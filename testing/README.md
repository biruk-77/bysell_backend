# 🧪 Testing Documentation

This folder contains all testing guides and documentation for the BySell backend API.

## 📁 Contents

### **OTP_TESTING_GUIDE.md**
- Complete guide for testing OTP authentication
- Phone number formats supported
- Error handling examples
- Environment variables required

### **SMS_TESTING_GUIDE.md**
- SMS configuration and testing
- Mock mode vs production mode
- Troubleshooting SMS issues
- GeezSMS API integration

## 🚀 Quick Testing Setup

1. **Start the server**: `npm run dev`
2. **Check logs**: Monitor console for OTP codes
3. **Use Postman**: Import collection from `/postman` folder
4. **Test endpoints**: Follow the guides above

## 🔧 Test Environment Setup

### Required Environment Variables:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bysell_db

# JWT
JWT_SECRET=your_jwt_secret

# SMS (Optional for testing)
GEEZSMS_TOKEN=your_token
GEEZSMS_BASE_URL=https://api.geezsms.com/api/v1
GEEZSMS_SENDER_ID=BySell
```

## 📱 Test Phone Numbers

Use these Ethiopian phone number formats:
- `+251941893993` (E.164 format)
- `0941893993` (Local format)
- `941893993` (Without prefix)

## 🎯 Testing Workflow

1. **Authentication**: Test OTP or traditional login
2. **Profile**: Create and update user profiles
3. **Posts**: CRUD operations on listings
4. **Chat**: Send and receive messages
5. **Notifications**: Test notification system

## 🔍 Debugging Tips

- **Check server logs** for detailed error messages
- **Use Postman console** for request/response debugging
- **Monitor database** for data persistence
- **Verify JWT tokens** are properly formatted

## 📊 Test Coverage

- ✅ Authentication (OTP & Traditional)
- ✅ User Management
- ✅ Profile Operations
- ✅ Post CRUD
- ✅ Chat System
- ✅ Notifications
- ✅ Admin Functions

Happy testing! 🎉
