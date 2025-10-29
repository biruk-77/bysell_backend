# OTP Authentication Testing Guide

## Available Endpoints

**Note: Only User-based OTP authentication is supported. No Passenger or Driver specific endpoints.**

### 1. Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phone": "09XXXXXXXX"
}
```

**Example using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/request-otp" -Method POST -ContentType "application/json" -Body '{"phone": "0912345678"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "phoneNumber": "+2519XXXXXXXX",
  "expiresIn": 300
}
```

### 2. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "09XXXXXXXX",
  "otp": "123456"
}
```

**Example using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify-otp" -Method POST -ContentType "application/json" -Body '{"phone": "0912345678", "otp": "123456"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully. Account activated.",
  "user": {
    "id": "user-uuid",
    "username": "user_12345678",
    "phone": "+2519XXXXXXXX",
    "role": "user",
    "otpRegistered": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here"
}
```

## Phone Number Formats Supported

- `09XXXXXXXX` (Ethiopian local format)
- `07XXXXXXXX` (Ethiopian local format)
- `2519XXXXXXXX` (International without +)
- `2517XXXXXXXX` (International without +)
- `+2519XXXXXXXX` (E.164 format)
- `+2517XXXXXXXX` (E.164 format)

## Security Features

- **Rate Limiting**: 30-second cooldown between OTP requests
- **Attempt Limiting**: Maximum 3 verification attempts
- **Account Lockout**: 30-minute lockout after max attempts
- **OTP Expiration**: 5-minute expiry time
- **Hashed Storage**: OTPs stored as bcrypt hashes

## Error Responses

### Invalid Phone Number
```json
{
  "success": false,
  "message": "Invalid phone number. Use 09XXXXXXXX, 07XXXXXXXX, or +2519XXXXXXXX"
}
```

### Rate Limiting
```json
{
  "success": false,
  "message": "Please wait 25 seconds before requesting another OTP"
}
```

### Invalid OTP
```json
{
  "success": false,
  "message": "Invalid OTP. 2 attempts remaining."
}
```

### Account Locked
```json
{
  "success": false,
  "message": "Account locked. Please try again in 30 minutes"
}
```

## Environment Variables Required

```env
# SMS Configuration
GEEZSMS_TOKEN=your_sms_provider_token
GEEZSMS_BASE_URL=https://api.geezsms.com/api/v1
GEEZSMS_SENDER_ID=BySell
GEEZSMS_SHORTCODE_ID=your_shortcode_id

# Company Information
COMPANY_NAME=BySell

# JWT Configuration
JWT_SECRET=your_jwt_secret
```
