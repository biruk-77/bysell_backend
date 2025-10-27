This is the formatted content for a GitHub README.md file, incorporating all the details and structures you provided:

code
Markdown
download
content_copy
expand_less
# 🚀 ETHIO CONNECT - Backend API

### *Multi-Category Networking Platform Backend*

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1+-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7+-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Production-ready Node.js backend with JWT auth, real-time messaging (Socket.io), file uploads, and MySQL database.**

---

## 📋 Table of Contents
- [🎯 Project Overview](#-project-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🔧 Setup](#-setup)
- [📚 API Docs](#-api-documentation)
- [💻 Code Stats](#-backend-code-statistics)
- [🔐 Auth Flow](#-authentication-flow)
- [📱 Integration](#-api-integration-guide)
- [🛠️ Development](#-development)
- [📊 Database](#-database-schema)
- [🔒 Security](#-security)
- [🚀 Deployment](#-deployment)
- [📈 Performance](#-performance)
- [📞 Support & Contact](#-support--contact)
- [📄 License](#-license)
- [🎯 Project Status](#-project-status)

## 🎯 Project Overview

**Ethio Connect** is a production-ready Node.js backend API serving Ethiopia's premier multi-category networking platform. Built with Express, MySQL, and Socket.io for real-time communication.

### **What This Backend Does:**
- 🔐 Secure authentication & authorization system
- 💬 Real-time messaging with WebSocket (Socket.io)
- 👥 Connection management (send/accept/reject)
- 📁 File upload system for profile images
- 🔔 Real-time notifications
- 📊 Posts & search with category filtering
- ⚡ Status tracking (online/offline/away/busy)
- 🗄️ Complete MySQL database with 8 tables

### 🎯 **5 Connection Categories** (SRS Compliant)

| Category | Participants | Purpose |
|----------|--------------|---------|
| **👔 Employment** | Employer ↔️ Employee | Job posting, hiring, professional networking |
| **🏠 Rental** | Renter ↔️ Tenant | Property listings, housing search, rentals |
| **💕 Matchmaking** | Husband ↔️ Wife | Social connections, family matchmaking |
| **🛒 Marketplace** | Buyer ↔️ Seller | Product sales, negotiations, transactions |
| **🔧 Services** | Provider ↔️ Customer | Service offerings, professional hiring |

## ✨ Features

### 🔐 Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Secure password hashing with `bcrypt`
- ✅ Token expiration and refresh mechanisms

### 👤 User Management
- ✅ User registration with role selection
- ✅ Secure login/logout
- ✅ Profile management (CRUD operations)
- ✅ **File Upload System** (Profile images with Multer)
- ✅ User data validation and sanitization

### 🛡️ Security Features
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting ready
- ✅ CORS configuration

### 💬 Real-Time Communication
- ✅ **Socket.io WebSocket integration**
- ✅ **Real-time messaging system**
- ✅ **User presence tracking** (online/offline/away/busy)
- ✅ **Typing indicators**
- ✅ **Connection requests with notifications**
- ✅ **Message read receipts**
- ✅ **Conversation management**
- ✅ **Status cleanup service**

### 📊 Monitoring & Logging
- ✅ Request/response logging
- ✅ Performance monitoring
- ✅ Error tracking and handling

## 🏗️ Architecture

### System Architecture

```mermaid
graph TD
    A[Client (Mobile/Web)] --> B{Load Balancer (Nginx)};
    B --> C[API Gateway (Express.js)];
    C --> D[Real-time (Socket.io)];
    C --> E[Database (MySQL)];
    C --> F[File Storage (Local/FTP)];
    D <--> E;
📁 Project Structure
code
Text
download
content_copy
expand_less
ethioconnect-backend/
├── 📁 config/
│   └── database.js                 # Database configuration
├── 📁 controllers/
│   ├── auth.controller.js          # Authentication logic
│   ├── profileController.js        # Profile management
│   ├── message.controller.js       # Messaging system
│   ├── connection.controller.js    # Connection requests
│   ├── status.controller.js        # User status management
│   ├── notification.controller.js  # Notifications
│   ├── post.controller.js          # Posts management
│   ├── search.controller.js        # Search functionality
│   └── admin.controller.js         # Admin operations
├── 📁 middlewares/
│   ├── auth.middleware.js          # JWT verification
│   ├── upload.middleware.js        # File upload handling
│   └── security.middleware.js      # Security headers & rate limiting
├── 📁 models/
│   ├── user.model.js               # User data model
│   ├── Profile.js                  # Profile data model
│   ├── message.model.js            # Messages model
│   ├── connection.model.js         # Connections model
│   ├── conversation.model.js       # Conversations tracking
│   ├── userStatus.model.js         # User status & presence
│   ├── notification.model.js       # Notifications model
│   ├── post.model.js               # Posts model
│   └── index.js                    # Model relationships
├── 📁 routes/
│   ├── auth.routes.js              # Authentication routes
│   ├── profileRoutes.js            # Profile routes
│   ├── message.routes.js           # Messaging API
│   ├── connection.routes.js        # Connection management
│   ├── status.routes.js            # Status management
│   ├── notification.routes.js      # Notifications API
│   ├── post.routes.js              # Posts API
│   ├── search.routes.js            # Search API
│   └── admin.routes.js             # Admin API
├── 📁 services/
│   └── statusCleanup.service.js    # Automatic status cleanup
├── 📁 utils/
│   └── logger.js                   # Request logging utility
├── 📁 uploads/
│   └── profile-images/             # Profile image uploads
├── server.js                       # Application entry point (with Socket.io)
├── package.json                    # Dependencies and scripts
├── .env.example                    # Example environment file
├── README.md                       # Project documentation
├── API_DOCUMENTATION.md            # Complete API reference
├── SOCKET_EVENTS_REFERENCE.md      # Socket.io events guide
└── POSTMAN_SETUP.md                # API testing setup
🔧 Setup
Prerequisites

Node.js 18+

MySQL 8.0+

npm or yarn

Installation

Clone the repository (adjust URL if you fork):

code
Bash
download
content_copy
expand_less
git clone https://github.com/biruk-77/bysell_backend.git
cd bysell_backend

Install dependencies

code
Bash
download
content_copy
expand_less
npm install

Environment Configuration

code
Bash
download
content_copy
expand_less
cp .env.example .env

Edit the .env file with your configuration:

code
Env
download
content_copy
expand_less
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ethio_connect_db
DB_USER=root
DB_PASS=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Socket.io
SOCKET_PORT=5001

Database Setup

code
Bash
download
content_copy
expand_less
# Create database
mysql -u root -p
CREATE DATABASE ethio_connect_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Run migrations (assuming you have a migration script)
npm run db:migrate
# Seed initial data (optional)
# npm run db:seed

Start the Server

code
Bash
download
content_copy
expand_less
# Development (with nodemon)
npm run dev

# Production
npm start
🚀 Quick Start
code
Bash
download
content_copy
expand_less
npm run dev
📚 API Documentation
Base URL
code
Text
download
content_copy
expand_less
http://localhost:5000/api
🔐 Authentication Endpoints
Register User

POST /api/auth/register

code
JSON
download
content_copy
expand_less
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "employee"
}

Response:

code
JSON
download
content_copy
expand_less
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "employee"
  }
}
Login User

POST /api/auth/login

code
JSON
download
content_copy
expand_less
{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response:

code
JSON
download
content_copy
expand_less
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "employee"
  }
}
👤 Profile Endpoints (Protected)
Create/Update Profile (with File Upload)

POST /api/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:

profileImage: [FILE] (Optional - JPG, PNG, GIF, etc. Max 5MB)

bio: "Experienced software developer"

skills: "JavaScript, Node.js, React"

experience: "5 years"

location: "New York, NY"

Response:

code
JSON
download
content_copy
expand_less
{
  "message": "Profile saved successfully!",
  "profile": {
    "id": "uuid-here",
    "userId": "user-uuid",
    "bio": "Experienced software developer",
    "skills": "JavaScript, Node.js, React",
    "experience": "5 years",
    "location": "New York, NY",
    "profileImage": "/uploads/profile-images/user-uuid_1729512345_abc123.jpg",
    "createdAt": "2025-10-21T12:00:00.000Z",
    "updatedAt": "2025-10-21T12:00:00.000Z"
  }
}
Get My Profile

GET /api/profile/me
Authorization: Bearer <token>
Response:

code
JSON
download
content_copy
expand_less
{
  "id": "uuid-here",
  "userId": "user-uuid",
  "bio": "Experienced software developer",
  "skills": "JavaScript, Node.js, React",
  "experience": "5 years",
  "location": "New York, NY",
  "profileImage": "/uploads/profile-images/user-uuid_1729512345_abc123.jpg",
  "user": {
    "username": "johndoe",
    "email": "john@example.com",
    "role": "employee"
  }
}
📸 File Upload System
Feature	Details
Supported Types	Images: JPG, JPEG, PNG, GIF, BMP, WEBP, SVG
Size Limit	5MB per file
Storage	Local filesystem (uploads/profile-images/)
Naming	userId_timestamp_uuid.extension

✅ Automatic validation - Only image files accepted

✅ Size limits - 5MB maximum file size

✅ Unique filenames - Prevents conflicts

✅ Error handling - Comprehensive error messages

(For full API reference, see API_DOCUMENTATION.md)

💻 Backend Code Statistics
What I Built:
Component	Estimated Lines of Code	Description
Controllers (9 files)	~2,500 lines	Login, register, profile CRUD, messaging, connections, status tracking, etc.
Models (8 tables)	~1,200 lines	User, Profile, Message, Connection, Conversation, Status, Notification, Post models.
Routes (9 routes)	~800 lines	API endpoint definitions.
Middleware (Auth, Upload, Security)	~400 lines	JWT verification, file upload handling, security headers.
Socket Handlers	~600 lines	Real-time events processing.
Services (Status Cleanup)	~200 lines	Background services.
TOTAL	~5,700 lines	-
Key Implementations:
code
JavaScript
download
content_copy
expand_less
// ✅ JWT Authentication Example
const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

// ✅ Real-time Socket.io Events Setup
io.on('connection', (socket) => {
  socket.on('send_message', handleSendMessage);
  socket.on('typing', handleTyping);
  socket.on('update_status', handleStatusUpdate);
});

// ✅ File Upload with Multer Configuration
const upload = multer({
  storage: storage, // disk storage config
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter // custom image type filter
});
🔐 Authentication Flow
code
Mermaid
download
content_copy
expand_less
sequenceDiagram
    actor Client
    participant Server
    participant JWT Service
    participant Database
    
    Client->>Server: POST /api/auth/register {user data}
    Server->>Database: Check if user exists
    alt User not found
        Server->>Server: Hash password
        Server->>Database: Create new user
        Database-->>Server: User created
        Server->>JWT Service: Generate token {user ID, role}
        JWT Service-->>Server: JWT token
        Server-->>Client: Registration success + token
    end
    
    Client->>Server: POST /api/auth/login {email, password}
    Server->>Database: Find user by email
    Database-->>Server: User found
    Server->>Server: Compare passwords
    Server->>JWT Service: Generate token {user ID, role}
    JWT Service-->>Server: JWT token
    Server-->>Client: Login success + token
    
    Client->>Server: GET /api/profile/me (with token)
    Server->>JWT Service: Verify JWT token
    JWT Service-->>Server: Token valid (User ID)
    Server->>Database: Get user profile
    Database-->>Server: Profile data
    Server-->>Client: Profile response
📱 API Integration Guide
How to Connect Frontend:
code
JavaScript
download
content_copy
expand_less
// Basic API setup
const API_BASE_URL = 'http://localhost:5000/api';

// Include JWT token in requests
const fetchProtected = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};

// Example: Login request
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json(); // Returns { token, user }
};
WebSocket Connection:
code
JavaScript
download
content_copy
expand_less
// Socket.io client connection
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: yourJWTToken } // Authenticate socket connection
});

// Listen for events
socket.on('new_message', (data) => {
  console.log('New message:', data);
});

// Emit events
socket.emit('send_message', messageData);
🛠️ Development
Git Workflow
code
Bash
download
content_copy
expand_less
git checkout -b feature/your-feature
git add .
git commit -m "feat: description"
git push origin feature/your-feature

Commit Conventions: feat|fix|docs|style|refactor|test|chore

📊 Database Schema
👤 Users Table
code
SQL
download
content_copy
expand_less
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT 'user',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
📋 Profiles Table
code
SQL
download
content_copy
expand_less
CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  userId CHAR(36) UNIQUE NOT NULL,
  bio TEXT,
  skills VARCHAR(255),
  experience TEXT,
  location VARCHAR(255),
  profileImage VARCHAR(255) DEFAULT 'default_avatar_url.png',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
🔗 Database Relationships
code
Mermaid
download
content_copy
expand_less
erDiagram
    USERS ||--o{ PROFILES : has

    USERS {
        char(36) id PK
        varchar(255) username UK
        varchar(255) email UK
        varchar(255) password
        varchar(255) role
        datetime createdAt
        datetime updatedAt
    }
    
    PROFILES {
        char(36) id PK
        char(36) userId FK
        text bio
        varchar(255) skills
        text experience
        varchar(255) location
        varchar(255) profileImage
        datetime createdAt
        datetime updatedAt
    }
🔒 Security
🛡️ Security Measures Implemented

✅ Password Hashing: bcrypt with 10 salt rounds

✅ JWT Authentication: Secure token-based auth

✅ Input Validation: Sequelize built-in validation

✅ SQL Injection Prevention: Parameterized queries

✅ Environment Variables: Sensitive data protection

🚨 Security Recommendations

Additional security middleware is recommended:

code
JavaScript
download
content_copy
expand_less
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Apply security headers
app.use(helmet()); 

// Configure CORS for specific origin
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true })); 

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
🚀 Deployment
PM2 (Recommended for Production)
code
Bash
download
content_copy
expand_less
npm install -g pm2
pm2 start server.js --name ethio-connect-api
pm2 startup
pm2 save
Docker
code
Bash
download
content_copy
expand_less
docker build -t ethio-connect-backend .
docker run -p 5000:5000 --env-file .env ethio-connect-backend
Production Checklist

Set NODE_ENV=production

Configure .env with production credentials (DB, JWT, etc.)

Run migrations: npm run db:migrate

Setup SSL/HTTPS (via Load Balancer/Nginx)

Enable monitoring and logging

📈 Performance

Connection pooling (max: 10, idle: 10s)

Response compression enabled

Efficient Sequelize queries

Socket.io room-based events

Status cleanup service (15min intervals)

📞 Support & Contact
Resource	Link
📚 API Documentation	View Docs
🔌 Socket.io Events	Socket Reference
🐛 Report Issues	GitHub Issues
💬 Community	Join Discord
📧 Email Support	support@ethioconnect.et
📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

🎯 Project Status

![alt text](https://img.shields.io/badge/build-passing-brightgreen.svg)


![alt text](https://img.shields.io/badge/coverage-85%25-green.svg)


![alt text](https://img.shields.io/badge/version-1.0.0-blue.svg)

Built with ❤️ for Ethiopia by the Ethio Connect Team

🚀 Ready for Boss Review | Production-Ready | SRS Compliant
Last updated: October 27, 2025

⬆ Back to Top

code
Code
download
content_copy
expand_less
