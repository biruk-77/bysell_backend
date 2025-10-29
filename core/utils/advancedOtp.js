const bcrypt = require('bcryptjs');
const { OTP } = require('../../models');
const { normalizePhone } = require('./phone');
const createSingleSMSUtil = require('./sms');
const { Op } = require('sequelize');

class AdvancedOtpUtil {
    constructor(config) {
        this.token = config.token;
        this.otpLength = config.otpLength || 6;
        this.otpExpirationSeconds = config.otpExpirationSeconds || 300; // 5 minutes
        this.maxAttempts = config.maxAttempts || 3;
        this.lockoutSeconds = config.lockoutSeconds || 1800; // 30 minutes
        this.companyName = config.companyName || process.env.COMPANY_NAME || 'BySell';
        
        this.smsUtil = null; // Will be initialized when needed
    }

    async getSmsUtil() {
        if (!this.smsUtil) {
            this.smsUtil = await createSingleSMSUtil({
                token: this.token,
                baseUrl: process.env.GEEZSMS_BASE_URL,
                senderId: process.env.GEEZSMS_SENDER_ID,
                shortcodeId: process.env.GEEZSMS_SHORTCODE_ID
            });
        }
        return this.smsUtil;
    }

    async generateAndSendOtp({ referenceType, referenceId, phoneNumber }) {
        try {
            const normalizedPhone = normalizePhone(phoneNumber);
            
            // Check for existing valid OTP (rate limiting)
            await this.checkRateLimit(normalizedPhone);
            
            // Check for locked accounts
            await this.checkLockout(normalizedPhone);
            
            // Generate 6-digit numeric OTP
            const otpCode = this.generateOtpCode();
            
            // Hash the OTP before storing
            const hashedOTP = await bcrypt.hash(otpCode, 10);
            
            // Set expiration time
            const expiresAt = Date.now() + (this.otpExpirationSeconds * 1000);
            
            // Clean up old OTPs for this phone
            await this.cleanupOldOtps(normalizedPhone);
            
            // Store OTP in database
            await OTP.create({
                phone: normalizedPhone,
                hashedSecret: hashedOTP,
                expiresAt: expiresAt,
                attempts: 0,
                status: 'pending',
                referenceType: referenceType,
                referenceId: referenceId
            });
            
            // Send SMS
            const message = `${this.companyName}: Your OTP is ${otpCode}. It expires in ${Math.floor(this.otpExpirationSeconds / 60)} minutes.`;
            
            try {
                const smsUtil = await this.getSmsUtil();
                await smsUtil.sendSingleSMS({
                    phone: normalizedPhone,
                    msg: message
                });
                
                console.log(`✅ OTP sent successfully to ${normalizedPhone}`);
            } catch (smsError) {
                console.error(`❌ SMS failed for ${normalizedPhone}:`, smsError.message);
                // Don't fail the entire operation if SMS fails
            }
            
            return {
                success: true,
                message: 'OTP sent successfully',
                phoneNumber: normalizedPhone,
                expiresIn: this.otpExpirationSeconds
            };
            
        } catch (error) {
            console.error('Generate and send OTP error:', error);
            throw error;
        }
    }

    async verifyOtp({ referenceType, referenceId, token, phoneNumber }) {
        try {
            const normalizedPhone = normalizePhone(phoneNumber);
            
            // Clean up expired/verified OTPs
            await this.cleanupExpiredOtps();
            
            // Find pending OTP
            const otpRecord = await OTP.findOne({
                where: {
                    phone: normalizedPhone,
                    referenceType: referenceType,
                    referenceId: referenceId,
                    status: 'pending'
                },
                order: [['createdAt', 'DESC']]
            });
            
            if (!otpRecord) {
                throw new Error('No valid OTP found for this phone number');
            }
            
            // Check if expired
            if (Date.now() > otpRecord.expiresAt) {
                await otpRecord.update({ status: 'expired' });
                throw new Error('OTP has expired. Please request a new one.');
            }
            
            // Check attempt limits
            if (otpRecord.attempts >= this.maxAttempts) {
                await otpRecord.update({ status: 'locked' });
                throw new Error('Too many attempts. Please request a new OTP.');
            }
            
            // Verify OTP
            const isValid = await bcrypt.compare(token, otpRecord.hashedSecret);
            
            if (!isValid) {
                await otpRecord.update({ attempts: otpRecord.attempts + 1 });
                const attemptsLeft = this.maxAttempts - (otpRecord.attempts + 1);
                throw new Error(`Invalid OTP. ${attemptsLeft} attempts remaining.`);
            }
            
            // OTP is valid! Mark as verified and clean up
            await otpRecord.update({ status: 'verified' });
            await this.cleanupOldOtps(normalizedPhone);
            
            return {
                success: true,
                message: 'OTP verified successfully',
                phoneNumber: normalizedPhone
            };
            
        } catch (error) {
            console.error('Verify OTP error:', error);
            throw error;
        }
    }

    generateOtpCode() {
        return Math.floor(Math.random() * Math.pow(10, this.otpLength))
            .toString()
            .padStart(this.otpLength, '0');
    }

    async checkRateLimit(phoneNumber) {
        const recentOtp = await OTP.findOne({
            where: {
                phone: phoneNumber,
                status: 'pending',
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 30000) // 30 seconds
                }
            }
        });
        
        if (recentOtp) {
            const waitTime = Math.ceil((30000 - (Date.now() - recentOtp.createdAt)) / 1000);
            throw new Error(`Please wait ${waitTime} seconds before requesting another OTP`);
        }
    }

    async checkLockout(phoneNumber) {
        const lockedOtp = await OTP.findOne({
            where: {
                phone: phoneNumber,
                status: 'locked',
                createdAt: {
                    [Op.gte]: new Date(Date.now() - (this.lockoutSeconds * 1000))
                }
            }
        });
        
        if (lockedOtp) {
            const remainingTime = Math.ceil((this.lockoutSeconds * 1000 - (Date.now() - lockedOtp.createdAt)) / 60000);
            throw new Error(`Account locked. Please try again in ${remainingTime} minutes`);
        }
    }

    async cleanupOldOtps(phoneNumber) {
        await OTP.destroy({
            where: {
                phone: phoneNumber,
                status: {
                    [Op.in]: ['expired', 'verified', 'locked']
                }
            }
        });
    }

    async cleanupExpiredOtps() {
        await OTP.update(
            { status: 'expired' },
            {
                where: {
                    status: 'pending',
                    expiresAt: {
                        [Op.lt]: Date.now()
                    }
                }
            }
        );
    }
}

function createAdvancedOtpUtil(config) {
    return new AdvancedOtpUtil(config);
}

module.exports = createAdvancedOtpUtil;
