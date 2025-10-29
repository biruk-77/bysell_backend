const express = require('express');
const router = express.Router();

const profileController = require('./profile.controller');
const { authMiddleware, upload, uploadProfileImage, handleUploadError } = require('../../core/middleware');
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
