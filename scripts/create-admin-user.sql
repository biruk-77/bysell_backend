-- ============================================
-- CREATE ADMIN USER FOR ETHIO CONNECT
-- ============================================
-- Run this in MySQL to create your admin account
-- 
-- HOW TO USE:
-- 1. Generate password hash first (see below)
-- 2. Replace the hash in the INSERT statement
-- 3. Run this script in MySQL
-- ============================================

USE ethio_connect_db;

-- ============================================
-- STEP 1: GENERATE PASSWORD HASH
-- ============================================
-- In your terminal, run this command to generate a hash:
--
-- cd test-project
-- node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword123', 10))"
--
-- Copy the output hash and paste it below
-- ============================================

-- ============================================
-- STEP 2: CREATE ADMIN USER
-- ============================================
-- Replace the password hash below with your generated hash!

INSERT INTO users (
  id,
  username,
  email,
  password,
  role,
  status,
  isEmailVerified,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'admin',                                    -- Change username if desired
  'admin@ethioconnect.com',                   -- Change email if desired
  '$2a$10$REPLACE_THIS_WITH_YOUR_HASH',      -- ⚠️ REPLACE THIS!
  'admin',                                    -- Don't change (must be 'admin')
  'active',
  1,
  NOW(),
  NOW()
);

-- ============================================
-- STEP 3: VERIFY ADMIN WAS CREATED
-- ============================================
SELECT 
  id, 
  username, 
  email, 
  role, 
  status,
  createdAt 
FROM users 
WHERE role = 'admin';

-- ============================================
-- EXPECTED OUTPUT:
-- Should show your admin user with role = 'admin'
-- ============================================

-- ============================================
-- ALTERNATIVE: CREATE ADMIN WITH PRESET PASSWORD
-- ============================================
-- If you want to use password "Admin@123" (for testing only!)
-- Uncomment the INSERT below:

/*
INSERT INTO users (
  id,
  username,
  email,
  password,
  role,
  status,
  isEmailVerified,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'admin',
  'admin@ethioconnect.com',
  '$2a$10$CwTycUXWue0Thq9StjUM0uJ9cH9XcC8Y6XQJVxK5kF2R8aVkF/7pC',  -- Password: Admin@123
  'admin',
  'active',
  1,
  NOW(),
  NOW()
);
*/

-- ============================================
-- USEFUL ADMIN QUERIES
-- ============================================

-- Check all admins
-- SELECT * FROM users WHERE role = 'admin';

-- Update admin password (replace hash)
-- UPDATE users SET password = '$2a$10$NewHashHere' WHERE username = 'admin';

-- Delete admin (be careful!)
-- DELETE FROM users WHERE username = 'admin';

-- Get system stats
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_posts FROM posts;
-- SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- ============================================
-- SECURITY REMINDER:
-- ⚠️  Change the default password immediately!
-- ⚠️  Use strong passwords in production!
-- ⚠️  Never commit passwords to git!
-- ============================================
