# 📋 Postman Collection Usage Guide

## 🚀 Quick Start

1. **Import the collection**: `BySell_API_Collection.postman_collection.json`
2. **Import the environment**: `BySell_Environment.postman_environment.json`
3. **Select the environment** in Postman

## 🔐 Authentication Flow

### Step 1: Get JWT Tokens
Use one of these methods to authenticate:

**Option A: OTP Authentication**
```
POST /api/auth/request-otp
Body: {"phone": "+251941893993"}

POST /api/auth/verify-otp  
Body: {"phone": "+251941893993", "otp": "123456"}
```

**Option B: Traditional Login**
```
POST /api/auth/login
Body: {"username": "your_username", "password": "your_password"}
```

### Step 2: Automatic Token Management
The collection automatically:
- ✅ **Extracts tokens** from auth responses
- ✅ **Sets Authorization headers** for protected routes
- ✅ **Updates variables** (access_token, refresh_token, user_id)

## 📝 Collection Variables

| Variable | Description | Auto-Updated |
|----------|-------------|--------------|
| `access_token` | JWT access token | ✅ Yes |
| `refresh_token` | JWT refresh token | ✅ Yes |
| `user_id` | Current user ID | ✅ Yes |
| `admin_access_token` | Admin JWT token | ❌ Manual |
| `post_id` | Post ID for testing | ❌ Manual |
| `conversation_id` | Chat conversation ID | ❌ Manual |
| `notification_id` | Notification ID | ❌ Manual |

## 🔧 Protected Routes

These routes automatically get the `Authorization: Bearer {{access_token}}` header:
- `/api/auth/me`
- `/api/auth/account`
- `/api/profile/*`
- `/api/posts/*`
- `/api/chat/*`
- `/api/notifications/*`
- `/api/admin/*` (uses `admin_access_token`)

## 🎯 Testing Workflow

### 1. Authentication Test
1. **Request OTP** → Check server console for OTP code
2. **Verify OTP** → Tokens automatically saved
3. **Get Current User** → Should work with auto-auth

### 2. Profile Test
1. **Create Profile** → Upload profile with image
2. **Get My Profile** → View created profile
3. **Update Profile** → Modify profile data

### 3. Posts Test
1. **Create Post** → Add new listing
2. **Get All Posts** → View all posts
3. **Search Posts** → Filter by criteria

### 4. Chat Test
1. **Send Message** → Start conversation
2. **Get Conversations** → View chat list
3. **Get Messages** → View conversation history

## 💡 Pro Tips

1. **Token Expiry**: If you get 401 errors, re-authenticate to get fresh tokens
2. **Admin Testing**: Manually set `admin_access_token` for admin endpoints
3. **File Uploads**: Use form-data for profile image uploads
4. **Console Logs**: Check Postman console for auto-update messages
5. **Variables**: Use `{{variable_name}}` syntax in request bodies

## 🔍 Troubleshooting

**401 Unauthorized:**
- Check if `access_token` is set in variables
- Re-authenticate if token expired

**400 Bad Request:**
- Check request body format
- Verify required fields are included

**404 Not Found:**
- Verify server is running on correct port
- Check endpoint URL spelling

**500 Internal Server Error:**
- Check server logs
- Verify database connection

## 📱 Example Request Bodies

**OTP Request:**
```json
{
  "phone": "+251941893993"
}
```

**Create Post:**
```json
{
  "title": "iPhone 14 Pro for Sale",
  "description": "Brand new iPhone 14 Pro",
  "category": "electronics",
  "price": 85000,
  "currency": "ETB",
  "condition": "new",
  "location": "Addis Ababa"
}
```

**Send Message:**
```json
{
  "receiverId": "{{user_id}}",
  "content": "Hello! Interested in your listing.",
  "messageType": "text"
}
```

Happy testing! 🎉
