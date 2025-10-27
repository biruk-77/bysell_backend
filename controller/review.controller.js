// test-project/controller/review.controller.js
const { Review, User, Profile, Connection } = require('../models');
const { Op } = require('sequelize');

// Create a review
exports.createReview = async (req, res) => {
    try {
        const reviewerId = req.user.id;
        const { reviewedUserId, connectionId, rating, comment, reviewType } = req.body;

        // Validation
        if (!reviewedUserId || !rating || !reviewType) {
            return res.status(400).json({
                message: 'reviewedUserId, rating, and reviewType are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5'
            });
        }

        // Prevent self-review
        if (reviewerId === reviewedUserId) {
            return res.status(400).json({
                message: 'You cannot review yourself'
            });
        }

        // Check if user being reviewed exists
        const reviewedUser = await User.findByPk(reviewedUserId);
        if (!reviewedUser) {
            return res.status(404).json({
                message: 'User to review not found'
            });
        }

        // Check if connection exists and is accepted (if connectionId provided)
        if (connectionId) {
            const connection = await Connection.findOne({
                where: {
                    id: connectionId,
                    status: 'accepted',
                    [Op.or]: [
                        { requesterId: reviewerId, receiverId: reviewedUserId },
                        { requesterId: reviewedUserId, receiverId: reviewerId }
                    ]
                }
            });

            if (!connection) {
                return res.status(403).json({
                    message: 'You can only review users you have an accepted connection with'
                });
            }
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            where: {
                reviewerId,
                reviewedUserId,
                connectionId: connectionId || null
            }
        });

        if (existingReview) {
            return res.status(400).json({
                message: 'You have already reviewed this user for this connection'
            });
        }

        // Create review
        const review = await Review.create({
            reviewerId,
            reviewedUserId,
            connectionId: connectionId || null,
            rating,
            comment,
            reviewType,
            isVerified: connectionId ? true : false
        });

        // Update user's average rating
        await updateUserAverageRating(reviewedUserId);

        // Get full review data
        const fullReview = await Review.findByPk(review.id, {
            include: [
                {
                    model: User,
                    as: 'reviewer',
                    attributes: ['id', 'username', 'email', 'role'],
                    include: [{
                        model: Profile,
                        as: 'profile',
                        attributes: ['profileImage', 'bio', 'location']
                    }]
                }
            ]
        });

        res.status(201).json({
            message: 'Review created successfully',
            review: fullReview
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            message: 'Error creating review',
            error: error.message
        });
    }
};

// Get reviews for a user
exports.getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, reviewType } = req.query;

        const offset = (page - 1) * limit;

        const whereClause = { reviewedUserId: userId };
        if (reviewType) {
            whereClause.reviewType = reviewType;
        }

        const { count, rows: reviews } = await Review.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'reviewer',
                    attributes: ['id', 'username', 'role'],
                    include: [{
                        model: Profile,
                        as: 'profile',
                        attributes: ['profileImage', 'bio']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Get user's profile with rating info
        const userProfile = await Profile.findOne({
            where: { userId },
            attributes: ['averageRating', 'totalReviews']
        });

        res.status(200).json({
            reviews,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            summary: {
                averageRating: userProfile?.averageRating || 0,
                totalReviews: userProfile?.totalReviews || 0
            }
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            message: 'Error fetching reviews',
            error: error.message
        });
    }
};

// Update a review
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const reviewerId = req.user.id;
        const { rating, comment } = req.body;

        const review = await Review.findByPk(reviewId);

        if (!review) {
            return res.status(404).json({
                message: 'Review not found'
            });
        }

        // Check if user is the reviewer
        if (review.reviewerId !== reviewerId) {
            return res.status(403).json({
                message: 'You can only update your own reviews'
            });
        }

        // Validate rating
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5'
            });
        }

        // Update review
        if (rating) review.rating = rating;
        if (comment !== undefined) review.comment = comment;

        await review.save();

        // Update user's average rating
        await updateUserAverageRating(review.reviewedUserId);

        res.status(200).json({
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            message: 'Error updating review',
            error: error.message
        });
    }
};

// Delete a review
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const reviewerId = req.user.id;

        const review = await Review.findByPk(reviewId);

        if (!review) {
            return res.status(404).json({
                message: 'Review not found'
            });
        }

        // Check if user is the reviewer
        if (review.reviewerId !== reviewerId) {
            return res.status(403).json({
                message: 'You can only delete your own reviews'
            });
        }

        const reviewedUserId = review.reviewedUserId;
        await review.destroy();

        // Update user's average rating
        await updateUserAverageRating(reviewedUserId);

        res.status(200).json({
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            message: 'Error deleting review',
            error: error.message
        });
    }
};

// Helper function to update user's average rating
async function updateUserAverageRating(userId) {
    try {
        const reviews = await Review.findAll({
            where: { reviewedUserId: userId },
            attributes: ['rating']
        });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;

        await Profile.update(
            {
                averageRating: averageRating.toFixed(2),
                totalReviews
            },
            {
                where: { userId }
            }
        );
    } catch (error) {
        console.error('Error updating average rating:', error);
    }
}

module.exports = exports;
