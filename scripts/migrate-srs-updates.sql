-- test-project/scripts/migrate-srs-updates.sql
-- Migration script for SRS updates
-- Date: October 26, 2025
-- IMPORTANT: Backup your database before running this script!

USE test;

-- ============================================
-- 1. UPDATE USERS TABLE - Add New Roles
-- ============================================

ALTER TABLE users 
MODIFY COLUMN role ENUM(
    'employer', 
    'employee', 
    'buyer', 
    'seller', 
    'connector', 
    'reviewer', 
    'admin', 
    'service_provider', 
    'customer', 
    'renter', 
    'tenant', 
    'husband', 
    'wife'
) NOT NULL DEFAULT 'employee';

-- ============================================
-- 2. UPDATE CONNECTIONS TABLE - Add Connection Types
-- ============================================

ALTER TABLE connections
ADD COLUMN connectionType ENUM(
    'employment', 
    'rental', 
    'service', 
    'marketplace', 
    'matchmaking', 
    'general'
) NOT NULL DEFAULT 'general' AFTER status;

ALTER TABLE connections
ADD COLUMN purpose TEXT AFTER connectionType;

-- ============================================
-- 3. UPDATE POSTS TABLE - Add New Categories and Fields
-- ============================================

-- Update category enum
ALTER TABLE posts
MODIFY COLUMN category ENUM(
    'job', 
    'product', 
    'service', 
    'rental_property', 
    'matchmaking'
) NOT NULL;

-- Add new fields for different post types
ALTER TABLE posts ADD COLUMN price DECIMAL(10, 2) NULL COMMENT 'Price for products/services/rent' AFTER userId;
ALTER TABLE posts ADD COLUMN salary VARCHAR(255) NULL COMMENT 'Salary range for job posts' AFTER price;
ALTER TABLE posts ADD COLUMN propertyType ENUM('apartment', 'house', 'room', 'office', 'land', 'other') NULL AFTER salary;
ALTER TABLE posts ADD COLUMN bedrooms INTEGER NULL COMMENT 'Number of bedrooms' AFTER propertyType;
ALTER TABLE posts ADD COLUMN bathrooms INTEGER NULL COMMENT 'Number of bathrooms' AFTER bedrooms;
ALTER TABLE posts ADD COLUMN squareFeet INTEGER NULL COMMENT 'Property size' AFTER bathrooms;
ALTER TABLE posts ADD COLUMN amenities TEXT NULL COMMENT 'Amenities JSON string' AFTER squareFeet;
ALTER TABLE posts ADD COLUMN images TEXT NULL COMMENT 'Image URLs JSON array' AFTER amenities;
ALTER TABLE posts ADD COLUMN tags TEXT NULL COMMENT 'Tags JSON array' AFTER images;
ALTER TABLE posts ADD COLUMN isActive BOOLEAN DEFAULT TRUE COMMENT 'Post status' AFTER tags;
ALTER TABLE posts ADD COLUMN expiresAt DATETIME NULL COMMENT 'Expiration date' AFTER isActive;

-- ============================================
-- 4. UPDATE PROFILES TABLE - Add Comprehensive Fields
-- ============================================

-- Professional fields
ALTER TABLE profiles ADD COLUMN company VARCHAR(255) NULL COMMENT 'Company name' AFTER profileImage;
ALTER TABLE profiles ADD COLUMN jobTitle VARCHAR(255) NULL COMMENT 'Job title' AFTER company;
ALTER TABLE profiles ADD COLUMN education TEXT NULL COMMENT 'Education JSON' AFTER jobTitle;
ALTER TABLE profiles ADD COLUMN certifications TEXT NULL COMMENT 'Certifications JSON' AFTER education;
ALTER TABLE profiles ADD COLUMN portfolio TEXT NULL COMMENT 'Portfolio links JSON' AFTER certifications;
ALTER TABLE profiles ADD COLUMN languages TEXT NULL COMMENT 'Languages JSON' AFTER portfolio;

-- Personal/Matchmaking fields
ALTER TABLE profiles ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL AFTER languages;
ALTER TABLE profiles ADD COLUMN dateOfBirth DATE NULL AFTER gender;
ALTER TABLE profiles ADD COLUMN maritalStatus ENUM('single', 'married', 'divorced', 'widowed', 'prefer_not_to_say') NULL AFTER dateOfBirth;
ALTER TABLE profiles ADD COLUMN religion VARCHAR(100) NULL COMMENT 'Religious preference' AFTER maritalStatus;
ALTER TABLE profiles ADD COLUMN ethnicity VARCHAR(100) NULL COMMENT 'Ethnic background' AFTER religion;
ALTER TABLE profiles ADD COLUMN profession VARCHAR(255) NULL COMMENT 'Profession' AFTER ethnicity;
ALTER TABLE profiles ADD COLUMN interests TEXT NULL COMMENT 'Interests JSON' AFTER profession;

-- Business fields
ALTER TABLE profiles ADD COLUMN businessLicense VARCHAR(255) NULL COMMENT 'License document URL' AFTER interests;
ALTER TABLE profiles ADD COLUMN website VARCHAR(255) NULL COMMENT 'Website URL' AFTER businessLicense;
ALTER TABLE profiles ADD COLUMN socialMedia TEXT NULL COMMENT 'Social media links JSON' AFTER website;

-- Rating and verification
ALTER TABLE profiles ADD COLUMN averageRating DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'Average rating' AFTER socialMedia;
ALTER TABLE profiles ADD COLUMN totalReviews INTEGER DEFAULT 0 COMMENT 'Total reviews' AFTER averageRating;
ALTER TABLE profiles ADD COLUMN isVerified BOOLEAN DEFAULT FALSE COMMENT 'Verified by admin' AFTER totalReviews;
ALTER TABLE profiles ADD COLUMN verificationDocuments TEXT NULL COMMENT 'Verification docs JSON' AFTER isVerified;

-- ============================================
-- 5. CREATE REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
    id CHAR(36) PRIMARY KEY,
    reviewerId CHAR(36) NOT NULL,
    reviewedUserId CHAR(36) NOT NULL,
    connectionId CHAR(36) NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NULL,
    reviewType ENUM('employment', 'rental', 'service', 'marketplace', 'matchmaking') NOT NULL,
    isVerified BOOLEAN DEFAULT FALSE COMMENT 'Verified from actual transaction',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    
    FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewedUserId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (connectionId) REFERENCES connections(id) ON DELETE SET NULL,
    
    INDEX idx_reviewer_reviewed (reviewerId, reviewedUserId),
    INDEX idx_reviewed_user (reviewedUserId),
    INDEX idx_connection (connectionId),
    INDEX idx_review_type (reviewType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. CREATE OTPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS otps (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NULL,
    email VARCHAR(255) NULL,
    phoneNumber VARCHAR(255) NULL,
    otpCode VARCHAR(6) NOT NULL,
    otpType ENUM('email_verification', 'phone_verification', 'password_reset', 'two_factor') NOT NULL,
    isUsed BOOLEAN DEFAULT FALSE,
    expiresAt DATETIME NOT NULL,
    attempts INTEGER DEFAULT 0 COMMENT 'Verification attempts',
    maxAttempts INTEGER DEFAULT 3,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user (userId),
    INDEX idx_email (email),
    INDEX idx_phone (phoneNumber),
    INDEX idx_otp_code_type (otpCode, otpType),
    INDEX idx_expires (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. CREATE ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================

-- Connections table indexes
CREATE INDEX idx_connection_type ON connections(connectionType);
CREATE INDEX idx_connection_status_type ON connections(status, connectionType);

-- Posts table indexes
CREATE INDEX idx_post_category ON posts(category);
CREATE INDEX idx_post_active ON posts(isActive);
CREATE INDEX idx_post_expires ON posts(expiresAt);
CREATE INDEX idx_post_category_active ON posts(category, isActive);
CREATE INDEX idx_post_location ON posts(location);

-- Profiles table indexes
CREATE INDEX idx_profile_verified ON profiles(isVerified);
CREATE INDEX idx_profile_rating ON profiles(averageRating);
CREATE INDEX idx_profile_location ON profiles(location);

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================

-- Verify all changes were applied successfully
SELECT 'Tables verified' AS Status;

-- Check users table
SELECT COUNT(*) as users_count FROM users;

-- Check new tables exist
SELECT COUNT(*) as reviews_count FROM reviews;
SELECT COUNT(*) as otps_count FROM otps;

-- Check new columns in posts
SELECT COUNT(*) as posts_with_new_fields 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'test' 
AND TABLE_NAME = 'posts' 
AND COLUMN_NAME IN ('price', 'salary', 'propertyType', 'amenities', 'images', 'tags');

-- Check new columns in profiles
SELECT COUNT(*) as profiles_with_new_fields 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'test' 
AND TABLE_NAME = 'profiles' 
AND COLUMN_NAME IN ('company', 'gender', 'averageRating', 'isVerified');

-- Check new columns in connections
SELECT COUNT(*) as connections_with_new_fields 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'test' 
AND TABLE_NAME = 'connections' 
AND COLUMN_NAME IN ('connectionType', 'purpose');

-- Display success message
SELECT '✅ Migration completed successfully!' AS Result;
SELECT 'Please restart your Node.js server to apply changes.' AS NextStep;

-- ============================================
-- ROLLBACK SCRIPT (Save separately if needed)
-- ============================================
-- In case you need to rollback changes, save this as rollback.sql:
/*
ALTER TABLE users MODIFY COLUMN role ENUM('employer', 'employee', 'buyer', 'seller', 'connector', 'reviewer', 'admin') NOT NULL DEFAULT 'employee';
ALTER TABLE connections DROP COLUMN connectionType, DROP COLUMN purpose;
ALTER TABLE posts MODIFY COLUMN category ENUM('job', 'product', 'service') NOT NULL;
ALTER TABLE posts DROP COLUMN price, DROP COLUMN salary, DROP COLUMN propertyType, DROP COLUMN bedrooms, DROP COLUMN bathrooms, DROP COLUMN squareFeet, DROP COLUMN amenities, DROP COLUMN images, DROP COLUMN tags, DROP COLUMN isActive, DROP COLUMN expiresAt;
ALTER TABLE profiles DROP COLUMN company, DROP COLUMN jobTitle, DROP COLUMN education, DROP COLUMN certifications, DROP COLUMN portfolio, DROP COLUMN languages, DROP COLUMN gender, DROP COLUMN dateOfBirth, DROP COLUMN maritalStatus, DROP COLUMN religion, DROP COLUMN ethnicity, DROP COLUMN profession, DROP COLUMN interests, DROP COLUMN businessLicense, DROP COLUMN website, DROP COLUMN socialMedia, DROP COLUMN averageRating, DROP COLUMN totalReviews, DROP COLUMN isVerified, DROP COLUMN verificationDocuments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS otps;
*/
