# 🏪 BySell Backend API

A comprehensive marketplace backend built with Node.js, Express, and MySQL, featuring OTP authentication, real-time chat, and modular architecture.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## 📁 Project Structure

```
bysell_backend/
├── core/                   # Core application components
│   ├── config/            # Database, Cloudinary, Firebase configs
│   ├── middleware/        # Authentication, validation, security
│   └── utils/             # Logger, validators, SMS, OTP utilities
├── models/                # Sequelize database models
├── modules/               # Feature-based modules
│   ├── auth/             # Authentication & OTP
│   ├── profile/          # User profiles
│   ├── post/             # Marketplace listings
│   ├── chat/             # Real-time messaging
│   ├── notification/     # Push notifications
│   └── admin/            # Admin management
├── socketControllers/     # Socket.io controllers
├── postman/              # API testing collection
├── testing/              # Testing guides & documentation
└── docs/                 # Project documentation
```

## 🔧 Features

### **Authentication System**
- ✅ **OTP Authentication** via SMS (GeezSMS)
- ✅ **Traditional Login** with JWT tokens
- ✅ **Phone Number Validation** (Ethiopian format)
- ✅ **Joi Validation** for all inputs
- ✅ **Winston Logging** for audit trails

### **Core Functionality**
- ✅ **User Profiles** with image uploads
- ✅ **Marketplace Posts** with CRUD operations
- ✅ **Real-time Chat** via Socket.io
- ✅ **Push Notifications** system
- ✅ **Admin Dashboard** functionality

### **Technical Features**
- ✅ **Modular Architecture** with clean separation
- ✅ **Database Migrations** with Sequelize
- ✅ **File Upload** handling (Cloudinary)
- ✅ **Rate Limiting** and security middleware
- ✅ **Error Handling** with structured responses

## 🔐 Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bysell_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# SMS Configuration (GeezSMS)
GEEZSMS_TOKEN=your_geezsms_token
GEEZSMS_BASE_URL=https://api.geezsms.com/api/v1
GEEZSMS_SENDER_ID=BySell

# Server Configuration
PORT=5000
NODE_ENV=development
```

## 📱 API Testing

### **Postman Collection**
Complete API collection with automatic authentication:
- 📁 **Location**: `/postman/`
- 📋 **Collection**: `BySell_API_Collection.postman_collection.json`
- 🌍 **Environment**: `BySell_Environment.postman_environment.json`
- 📖 **Guide**: `/postman/README.md`

### **Testing Documentation**
Comprehensive testing guides:
- 📁 **Location**: `/testing/`
- 🔐 **OTP Testing**: `OTP_TESTING_GUIDE.md`
- 📱 **SMS Testing**: `SMS_TESTING_GUIDE.md`
- 📖 **Overview**: `/testing/README.md`

## 🛠️ Development

### **Available Scripts**
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run test        # Run tests (if configured)
```

### **Database Setup**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE bysell_db;"

# Start server (auto-syncs tables)
npm run dev
```

## 📊 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/me` - Get current user

### **Profiles**
- `POST /api/profile` - Create profile
- `GET /api/profile/me` - Get my profile
- `PUT /api/profile` - Update profile

### **Posts**
- `POST /api/posts` - Create post
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### **Chat**
- `POST /api/chat/send` - Send message
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/conversations/:id/messages` - Get messages

### **Notifications**
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🔒 Security Features

- **JWT Authentication** with access & refresh tokens
- **Rate Limiting** on sensitive endpoints
- **Input Validation** with Joi schemas
- **SQL Injection Protection** via Sequelize ORM
- **CORS Configuration** for cross-origin requests
- **Helmet.js** for security headers

## 🚀 Deployment

### **Production Setup**
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SMS provider credentials
4. Configure file upload service
5. Set up reverse proxy (nginx)

### **Environment Variables**
Ensure all production environment variables are set:
- Database credentials
- JWT secrets
- SMS provider tokens
- File upload configurations

## 📞 Support

For issues and questions:
- 📖 Check `/testing/` documentation
- 🔍 Review server logs
- 📱 Test with Postman collection
- 🐛 Check database connections

## 🎯 Next Steps

- [ ] Add unit tests
- [ ] Implement caching (Redis)
- [ ] Add email notifications
- [ ] Implement file compression
- [ ] Add API versioning
- [ ] Set up CI/CD pipeline

---

**Built with ❤️ for the Ethiopian marketplace community**
