// test-project/routes/profileRoutes.js
const express = require('express');
const router = express.Router();

// Import the NEW profile controller
const profileController = require('../controller/profileController.js');

// Import our "Security Guard" middleware
const authMiddleware = require('../midlewares/auth.middleware'); // Make sure this path is correct!

// Import file upload middleware
const { uploadProfileImage, handleUploadError } = require('../midlewares/upload.middleware');

// --- PROTECTED PROFILE ROUTES ---

// @route   POST /api/profile
// @desc    Create a new profile (first time)
// @access  Private
router.post('/', authMiddleware, uploadProfileImage, handleUploadError, profileController.createOrUpdateProfile);

// @route   PUT /api/profile
// @desc    Update the logged-in user's profile (with file upload)
// @access  Private
router.put('/', authMiddleware, uploadProfileImage, handleUploadError, profileController.updateProfile);

// @route   GET /api/profile/me
// @desc    Get the current logged-in user's profile
// @access  Private
router.get('/me', authMiddleware, profileController.getMyProfile);

// @route   POST /api/profile/upload-image
// @desc    Upload profile image only
// @access  Private
router.post('/upload-image', authMiddleware, uploadProfileImage, handleUploadError, profileController.uploadProfileImage);

module.exports = router;
