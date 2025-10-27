// test-project/utils/advancedOtpUtil.js
// Uses simple random number OTP (not speakeasy) for better compatibility
const crypto = require("crypto");
const createSingleSMSUtil = require("./sendSingleSMSUtil");
const { Op } = require("sequelize");
const Otp = require("../models/otp.model");
const User = require("../models/user.model");

function createAdvancedOtpUtil({
  token,
  otpLength = 6,
  otpExpirationSeconds = 300,
  maxAttempts = 3,
  lockoutSeconds = 1800,
}) {
  // SMS util is async now
  let smsUtil = null;

  function hashSecret(secret) {
    return crypto.createHash("sha256").update(secret).digest("hex");
  }

  async function normalizePhone(phoneNumber) {
    if (!phoneNumber) throw new Error("Phone number is required");
    const raw = String(phoneNumber).trim();
    const digits = raw.replace(/\D/g, "");

    // Local format 09/07 + 8 digits (10 total)
    if (digits.length === 10 && (digits.startsWith('09') || digits.startsWith('07'))) {
      const withoutZero = digits.slice(1); // drop leading 0
      return '+251' + withoutZero;
    }

    // International without plus: 2519/2517 + 8 digits (12 total)
    if (digits.length === 12 && digits.startsWith('251') && (digits[3] === '9' || digits[3] === '7')) {
      return '+' + digits;
    }

    // Already has plus?
    if (raw.startsWith('+') && digits.length === 12 && digits.startsWith('251')) {
      return '+' + digits;
    }

    throw new Error('Invalid Ethiopian phone number. Use 09XXXXXXXX or +2519XXXXXXXX');
  }

  async function generateAndSendOtp({
    referenceType,
    referenceId,
    shortcode_id,
    callback,
  }) {
    if (!referenceType || !referenceId)
      throw new Error("Reference type and ID are required");
    if (!["User"].includes(referenceType))
      throw new Error("Reference type must be User");

    const Model = User;
    const modelInstance = await Model.findByPk(referenceId);
    if (!modelInstance) throw new Error(`${referenceType} not found`);

    const phoneField = "phoneNumber"; // Updated to match your User model
    if (!modelInstance[phoneField])
      throw new Error(`${referenceType} has no phone number`);

    const phone = await normalizePhone(modelInstance[phoneField]);

    // Check for existing OTP
    const existingOtp = await Otp.findOne({
      where: {
        phone,
        referenceType,
        referenceId,
        status: "pending",
        expiresAt: { [Op.gt]: Date.now() },
      },
    });
    if (existingOtp) {
      const remainingSeconds = Math.ceil(
        (existingOtp.expiresAt - Date.now()) / 1000
      );
      throw new Error(
        `Please wait ${remainingSeconds} seconds before requesting another OTP`
      );
    }

    // Check for lockout
    const lockedOtp = await Otp.findOne({
      where: {
        phone,
        referenceType,
        referenceId,
        status: "locked",
        expiresAt: { [Op.gt]: Date.now() },
      },
    });
    if (lockedOtp) {
      const remainingSeconds = Math.ceil(
        (lockedOtp.expiresAt - Date.now()) / 1000
      );
      throw new Error(
        `Account locked. Try again in ${remainingSeconds} seconds`
      );
    }

    // Clean up expired or used OTPs
    await Otp.destroy({
      where: {
        phone,
        referenceType,
        referenceId,
        [Op.or]: [
          { expiresAt: { [Op.lt]: Date.now() } },
          { status: { [Op.in]: ["verified", "expired"] } },
        ],
      },
    });

    // Generate random numeric OTP (like friend's working code)
    const min = 10 ** (otpLength - 1);
    const max = 10 ** otpLength - 1;
    const token = String(Math.floor(min + Math.random() * (max - min + 1)));

    // Store hashed token
    const hashedSecret = hashSecret(token);
    const expiresAt = Date.now() + otpExpirationSeconds * 1000;
    await Otp.create({
      phone,
      hashedSecret,
      expiresAt,
      attempts: 0,
      status: "pending",
      referenceType,
      referenceId,
    });

    // Send OTP via SMS
    const companyName = process.env.COMPANY_NAME || 'Ethio Connect';
    const msg = `${companyName}: Your OTP is ${token}. It expires in ${Math.floor(otpExpirationSeconds/60)} minutes.`;
    
    // Dev mode: Log OTP to console
    if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
      console.log(`\n🔐 [DEV OTP] Phone: ${phone}`);
      console.log(`🔐 [DEV OTP] Code: ${token}`);
      console.log(`🔐 [DEV OTP] Expires in: ${otpExpirationSeconds} seconds\n`);
    }
    
    try {
      // Initialize SMS util (async)
      if (!smsUtil) {
        smsUtil = await createSingleSMSUtil({ token });
      }
      
      const smsResult = await smsUtil.sendSingleSMS({
        phone,
        msg
      });
      return {
        success: true,
        message: "OTP sent successfully",
        expiresIn: otpExpirationSeconds,
        phoneNumber: phone,
        sms: smsResult.data
      };
    } catch (error) {
      // Don't fail if SMS provider fails - log and return success
      console.log(`[OTP SMS ERROR] phone=${phone} err=${error.message}`);
      return {
        success: true,
        message: "OTP generated (SMS may have failed)",
        expiresIn: otpExpirationSeconds,
        phoneNumber: phone
      };
    }
  }

  async function verifyOtp({ referenceType, referenceId, token }) {
    if (!referenceType || !referenceId || !token)
      throw new Error("Reference type, ID, and token are required");
    if (!["User"].includes(referenceType))
      throw new Error("Reference type must be User");

    const Model = User;
    const modelInstance = await Model.findByPk(referenceId);
    if (!modelInstance) throw new Error(`${referenceType} not found`);

    const phoneField = "phoneNumber";
    if (!modelInstance[phoneField])
      throw new Error(`${referenceType} has no phone number`);

    const phone = await normalizePhone(modelInstance[phoneField]);

    // Clean up expired or used OTPs
    await Otp.destroy({
      where: {
        phone,
        referenceType,
        referenceId,
        [Op.or]: [
          { expiresAt: { [Op.lt]: Date.now() } },
          { status: { [Op.in]: ["verified", "expired"] } },
        ],
      },
    });

    // Retrieve OTP
    const otp = await Otp.findOne({
      where: { phone, referenceType, referenceId, status: "pending" },
    });
    if (!otp) throw new Error("No valid OTP found");

    if (otp.attempts >= maxAttempts) {
      await otp.update({
        status: "locked",
        expiresAt: Date.now() + lockoutSeconds * 1000,
      });
      throw new Error(
        `Too many attempts. Account locked for ${lockoutSeconds / 60} minutes`
      );
    }

    if (Date.now() > otp.expiresAt) {
      await otp.update({ status: "expired" });
      throw new Error("OTP has expired");
    }

    // Increment attempts
    await otp.increment("attempts");

    // Verify OTP by comparing hashed values
    const isValid = hashSecret(String(token)) === otp.hashedSecret;

    if (isValid) {
      await otp.update({ status: "verified" });
      
      // Update user verification status
      await modelInstance.update({ isEmailVerified: true });
      
      await Otp.destroy({ where: { phone, referenceType, referenceId } });
      return { success: true, message: "OTP verified successfully" };
    } else {
      throw new Error("Invalid OTP");
    }
  }

  return { generateAndSendOtp, verifyOtp };
}

module.exports = createAdvancedOtpUtil;
