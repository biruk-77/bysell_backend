// test-project/routes/search.routes.js
// Search and Discovery routes
const express = require('express');
const router = express.Router();
const searchController = require('../controller/search.controller');
const { authenticate } = require('../midlewares/roleAuth.middleware');
const { apiLimiter, validateSearch } = require('../midlewares/security.middleware');

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(apiLimiter);

// --- SEARCH ROUTES ---

// GET /api/search - Unified search (users and posts)
router.get('/', validateSearch, searchController.unifiedSearch);

// GET /api/search/users - Search users only
router.get('/users', validateSearch, searchController.searchUsers);

// GET /api/search/posts - Search posts only
router.get('/posts', validateSearch, searchController.searchPosts);

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', searchController.getSearchSuggestions);

// --- DISCOVERY ROUTES ---

// GET /api/search/discover - Get personalized discovery feed
router.get('/discover', searchController.getDiscoveryFeed);

module.exports = router;
