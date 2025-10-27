// test-project/utils/advancedOtpUtil.js
const speakeasy = require("speakeasy");
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
  const singleSMSUtil = createSingleSMSUtil({ token });

  function hashSecret(secret) {
    return crypto.createHash("sha256").update(secret).digest("hex");
  }

  async function normalizePhone(phoneNumber) {
    if (!phoneNumber) throw new Error("Phone number is required");
    let normalized = phoneNumber.replace(/\D/g, "");

    if (normalized.match(/^(09|07)\d{7,8}$/)) {
      normalized = normalized.replace(/^0/, "251");
    } else if (normalized.match(/^251(9|7)\d{7,8}$/)) {
      // Already has 251 prefix
    } else {
      throw new Error(
        "Phone must be 9 or 10 digits starting with 9 or 7, optionally prefixed with 251"
      );
    }
    return normalized;
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

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({ length: 20 });
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: "base32",
      digits: otpLength,
      step: otpExpirationSeconds,
    });

    // Store hashed secret and metadata
    const hashedSecret = hashSecret(secret.base32);
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
    const msg = `Your Ethio Connect OTP is ${token}. It expires in ${
      otpExpirationSeconds / 60
    } minutes.`;
    try {
      const smsResult = await singleSMSUtil.sendSingleSMS({
        phone,
        msg,
        shortcode_id,
        callback,
      });
      return {
        success: true,
        message: "OTP sent successfully",
        expiresIn: otpExpirationSeconds,
        phoneNumber: phone,
        // REMOVE IN PRODUCTION - only for development
        devToken: process.env.NODE_ENV === 'development' ? token : undefined,
        apiLogId: smsResult.data?.api_log_id,
      };
    } catch (error) {
      await Otp.destroy({ where: { phone, referenceType, referenceId } });
      throw new Error(`Failed to send OTP: ${error.message}`);
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

    // Verify OTP
    const isValid = speakeasy.totp.verify({
      secret: otp.hashedSecret,
      encoding: "hex",
      token,
      digits: otpLength,
      step: otpExpirationSeconds,
      window: 1,
    });

    if (isValid) {
      await otp.update({ status: "verified" });
      
      // Update user verification status
      await modelInstance.update({ isEmailVerified: true });
      
      await Otp.destroy({ where: { phone, referenceType, referenceId } });
      return { success: true, message: "OTP verified successfully" };
    } else {
      await otp.save();
      throw new Error("Invalid OTP");
    }
  }

  return { generateAndSendOtp, verifyOtp };
}

module.exports = createAdvancedOtpUtil;
