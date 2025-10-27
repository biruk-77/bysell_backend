// test-project/routes/review.routes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controller/review.controller');
const authMiddleware = require('../midlewares/auth.middleware');

// All review routes require authentication
router.use(authMiddleware);

// Create a review
router.post('/', reviewController.createReview);

// Get reviews for a specific user
router.get('/user/:userId', reviewController.getUserReviews);

// Update a review
router.put('/:reviewId', reviewController.updateReview);

// Delete a review
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;
