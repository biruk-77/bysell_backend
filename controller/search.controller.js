// Search and Discovery controller
const { User, Post, Connection, Profile } = require('../models');
const { Op } = require('sequelize');

// --- UNIFIED SEARCH (USERS AND POSTS) ---
exports.unifiedSearch = async (req, res) => {
    try {
        const { 
            query, 
            type = 'all', // 'users', 'posts', 'all'
            page = 1, 
            limit = 20,
            location,
            role,
            category,
            postType,
            sortBy = 'relevance'
        } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({ 
                success: false,
                message: 'Search query must be at least 2 characters long.' 
            });
        }

        const offset = (page - 1) * limit;
        const searchTerm = query.trim();
        
        let results = {};

        // Search Users
        if (type === 'users' || type === 'all') {
            const userWhereClause = {
                status: 'active',
                [Op.or]: [
                    { username: { [Op.like]: `%${searchTerm}%` } },
                    { '$Profile.bio$': { [Op.like]: `%${searchTerm}%` } },
                    { '$Profile.skills$': { [Op.like]: `%${searchTerm}%` } },
                    { '$Profile.experience$': { [Op.like]: `%${searchTerm}%` } }
                ]
            };

            if (location) {
                userWhereClause[Op.and] = [
                    userWhereClause[Op.and] || [],
                    {
                        [Op.or]: [
                            { location: { [Op.like]: `%${location}%` } },
                            { '$Profile.location$': { [Op.like]: `%${location}%` } }
                        ]
                    }
                ];
            }

            if (role) {
                userWhereClause.role = role;
            }

            const userResults = await User.findAndCountAll({
                where: userWhereClause,
                include: [
                    {
                        model: Profile,
                        as: 'profile',
                        required: false,
                        attributes: ['bio', 'skills', 'experience', 'location', 'profileImage']
                    }
                ],
                attributes: ['id', 'username', 'role', 'location', 'createdAt'],
                limit: type === 'users' ? parseInt(limit) : Math.floor(limit / 2),
                offset: type === 'users' ? parseInt(offset) : 0,
                order: sortBy === 'newest' ? [['createdAt', 'DESC']] : [['username', 'ASC']]
            });

            results.users = {
                data: userResults.rows,
                count: userResults.count,
                hasMore: type === 'users' ? userResults.count > (page * limit) : userResults.count > Math.floor(limit / 2)
            };
        }

        // Search Posts
        if (type === 'posts' || type === 'all') {
            const postWhereClause = {
                [Op.or]: [
                    { title: { [Op.like]: `%${searchTerm}%` } },
                    { description: { [Op.like]: `%${searchTerm}%` } }
                ]
            };

            if (location) {
                postWhereClause.location = { [Op.like]: `%${location}%` };
            }

            if (category) {
                postWhereClause.category = category;
            }

            if (postType) {
                postWhereClause.postType = postType;
            }

            const postResults = await Post.findAndCountAll({
                where: postWhereClause,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'role'],
                        include: [
                            {
                                model: Profile,
                                as: 'profile',
                                attributes: ['profileImage'],
                                required: false
                            }
                        ]
                    }
                ],
                limit: type === 'posts' ? parseInt(limit) : Math.floor(limit / 2),
                offset: type === 'posts' ? parseInt(offset) : 0,
                order: sortBy === 'newest' ? [['createdAt', 'DESC']] : 
                       sortBy === 'price_low' ? [['price', 'ASC']] :
                       sortBy === 'price_high' ? [['price', 'DESC']] :
                       [['createdAt', 'DESC']]
            });

            results.posts = {
                data: postResults.rows,
                count: postResults.count,
                hasMore: type === 'posts' ? postResults.count > (page * limit) : postResults.count > Math.floor(limit / 2)
            };
        }

        const totalResults = (results.users?.count || 0) + (results.posts?.count || 0);

        console.log(`🔍 User ${req.user.username} searched: '${searchTerm}' - Found ${totalResults} results`);

        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            data: {
                query: searchTerm,
                type,
                results,
                totalResults,
                pagination: {
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                },
                filters: {
                    location,
                    role,
                    category,
                    postType,
                    sortBy
                }
            }
        });
    } catch (error) {
        console.error('Unified search error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong during search.' 
        });
    }
};

// --- SEARCH USERS ONLY ---
exports.searchUsers = async (req, res) => {
    try {
        const { 
            query, 
            page = 1, 
            limit = 20,
            role,
            location,
            skills,
            experience,
            sortBy = 'relevance'
        } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({ 
                success: false,
                message: 'Search query must be at least 2 characters long.' 
            });
        }

        const offset = (page - 1) * limit;
        const searchTerm = query.trim();

        const whereClause = {
            status: 'active',
            [Op.or]: [
                { username: { [Op.like]: `%${searchTerm}%` } },
                { '$profile.bio$': { [Op.like]: `%${searchTerm}%` } },
                { '$profile.skills$': { [Op.like]: `%${searchTerm}%` } }
            ]
        };

        if (role) {
            whereClause.role = role;
        }

        if (location) {
            whereClause[Op.and] = [
                whereClause[Op.and] || [],
                {
                    [Op.or]: [
                        { location: { [Op.like]: `%${location}%` } },
                        { '$profile.location$': { [Op.like]: `%${location}%` } }
                    ]
                }
            ];
        }

        if (skills) {
            whereClause['$profile.skills$'] = { [Op.like]: `%${skills}%` };
        }

        if (experience) {
            whereClause['$profile.experience$'] = { [Op.like]: `%${experience}%` };
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Profile,
                    as: 'profile',
                    required: false
                }
            ],
            attributes: ['id', 'username', 'role', 'location', 'createdAt'],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: sortBy === 'newest' ? [['createdAt', 'DESC']] : [['username', 'ASC']],
            distinct: true
        });

        console.log(`👥 User ${req.user.username} searched users: '${searchTerm}' - Found ${count} results`);

        res.status(200).json({
            success: true,
            message: 'User search completed successfully',
            data: {
                users: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalUsers: count,
                    hasNext: page * limit < count,
                    hasPrev: page > 1
                },
                filters: { role, location, skills, experience, sortBy }
            }
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong during user search.' 
        });
    }
};

// --- SEARCH POSTS ONLY ---
exports.searchPosts = async (req, res) => {
    try {
        const { 
            query, 
            page = 1, 
            limit = 20,
            type,
            category,
            location,
            minPrice,
            maxPrice,
            sortBy = 'newest'
        } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({ 
                success: false,
                message: 'Search query must be at least 2 characters long.' 
            });
        }

        const offset = (page - 1) * limit;
        const searchTerm = query.trim();

        const whereClause = {
            [Op.or]: [
                { title: { [Op.like]: `%${searchTerm}%` } },
                { description: { [Op.like]: `%${searchTerm}%` } }
            ]
        };

        if (type && type !== 'all') {
            whereClause.postType = type;
        }

        if (category && category !== 'all') {
            whereClause.category = category;
        }

        if (location) {
            whereClause.location = { [Op.like]: `%${location}%` };
        }

        if (minPrice) {
            whereClause.price = { [Op.gte]: parseFloat(minPrice) };
        }

        if (maxPrice) {
            if (whereClause.price) {
                whereClause.price[Op.lte] = parseFloat(maxPrice);
            } else {
                whereClause.price = { [Op.lte]: parseFloat(maxPrice) };
            }
        }

        const { count, rows } = await Post.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'role'],
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['profileImage'],
                            required: false
                        }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: sortBy === 'newest' ? [['createdAt', 'DESC']] : 
                   sortBy === 'oldest' ? [['createdAt', 'ASC']] :
                   sortBy === 'price_low' ? [['price', 'ASC']] :
                   sortBy === 'price_high' ? [['price', 'DESC']] :
                   sortBy === 'title' ? [['title', 'ASC']] :
                   [['createdAt', 'DESC']]
        });

        console.log(`📋 User ${req.user.username} searched posts: '${searchTerm}' - Found ${count} results`);

        res.status(200).json({
            success: true,
            message: 'Post search completed successfully',
            data: {
                posts: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalPosts: count,
                    hasNext: page * limit < count,
                    hasPrev: page > 1
                },
                filters: { type, category, location, minPrice, maxPrice, sortBy }
            }
        });
    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong during post search.' 
        });
    }
};

// --- GET SEARCH SUGGESTIONS ---
exports.getSearchSuggestions = async (req, res) => {
    try {
        const { query, type = 'all' } = req.query;

        if (!query || query.trim().length < 1) {
            return res.status(400).json({ 
                success: false,
                message: 'Query parameter is required.' 
            });
        }

        const searchTerm = query.trim();
        let suggestions = [];

        if (type === 'users' || type === 'all') {
            // Get user suggestions
            const userSuggestions = await User.findAll({
                where: {
                    status: 'active',
                    username: { [Op.like]: `%${searchTerm}%` }
                },
                attributes: ['id', 'username', 'role'],
                limit: 5,
                order: [['username', 'ASC']]
            });

            suggestions.push(...userSuggestions.map(user => ({
                type: 'user',
                id: user.id,
                text: user.username,
                subtitle: user.role,
                icon: 'user'
            })));
        }

        if (type === 'posts' || type === 'all') {
            // Get post title suggestions
            const postSuggestions = await Post.findAll({
                where: {
                    title: { [Op.like]: `%${searchTerm}%` }
                },
                attributes: ['id', 'title', 'type', 'category'],
                limit: 5,
                order: [['title', 'ASC']]
            });

            suggestions.push(...postSuggestions.map(post => ({
                type: 'post',
                id: post.id,
                text: post.title,
                subtitle: `${post.type} - ${post.category}`,
                icon: 'post'
            })));
        }

        // Get popular search terms (you can implement this based on search history)
        const popularTerms = [
            'web developer', 'graphic designer', 'marketing', 'sales',
            'remote work', 'part-time', 'freelance', 'full-time',
            'react', 'nodejs', 'python', 'java', 'design', 'writing'
        ];

        const matchingTerms = popularTerms
            .filter(term => term.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 3)
            .map(term => ({
                type: 'term',
                text: term,
                subtitle: 'Popular search',
                icon: 'search'
            }));

        suggestions.push(...matchingTerms);

        // Limit total suggestions
        suggestions = suggestions.slice(0, 10);

        res.status(200).json({
            success: true,
            message: 'Search suggestions retrieved successfully',
            data: {
                query: searchTerm,
                suggestions,
                count: suggestions.length
            }
        });
    } catch (error) {
        console.error('Get search suggestions error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while getting search suggestions.' 
        });
    }
};

// --- GET DISCOVERY FEED (RECOMMENDED CONTENT) ---
exports.getDiscoveryFeed = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { page = 1, limit = 20, type = 'mixed' } = req.query;

        const offset = (page - 1) * limit;
        let feed = [];

        // Get user's profile for personalization
        const userProfile = await Profile.findOne({ where: { userId } });
        const userLocation = userProfile?.location || req.user.location;
        const userSkills = userProfile?.skills || '';

        // Recommend posts based on user role and interests
        let postWhereClause = {};
        
        // Role-based recommendations
        if (userRole === 'employee') {
            postWhereClause.postType = 'offer';
            postWhereClause.category = 'job';
        } else if (userRole === 'employer') {
            postWhereClause.postType = 'request';
            postWhereClause.category = 'job';
        } else if (userRole === 'buyer') {
            postWhereClause.postType = 'offer';
            postWhereClause.category = { [Op.in]: ['product', 'service'] };
        } else if (userRole === 'seller') {
            postWhereClause.postType = 'request';
            postWhereClause.category = { [Op.in]: ['product', 'service'] };
        }

        // Location-based recommendations
        if (userLocation) {
            postWhereClause[Op.or] = [
                postWhereClause[Op.or] || [],
                { location: { [Op.like]: `%${userLocation}%` } }
            ];
        }

        const recommendedPosts = await Post.findAll({
            where: postWhereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'role'],
                    where: { id: { [Op.ne]: userId } }, // Exclude own posts
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['profileImage'],
                            required: false
                        }
                    ]
                }
            ],
            limit: Math.floor(limit * 0.7), // 70% posts
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        feed.push(...recommendedPosts.map(post => ({
            type: 'post',
            data: post,
            reason: 'Recommended for you'
        })));

        // Recommend users to connect with
        let userWhereClause = { 
            status: 'active',
            id: { [Op.ne]: userId }
        };

        // Find users not already connected
        const existingConnections = await Connection.findAll({
            where: {
                [Op.or]: [
                    { requesterId: userId },
                    { receiverId: userId }
                ]
            },
            attributes: ['requesterId', 'receiverId']
        });

        const connectedUserIds = existingConnections.flatMap(conn => 
            [conn.requesterId, conn.receiverId]
        ).filter(id => id !== userId);

        if (connectedUserIds.length > 0) {
            userWhereClause.id[Op.notIn] = connectedUserIds;
        }

        // Role-based user recommendations
        if (userRole === 'employee') {
            userWhereClause.role = { [Op.in]: ['employer', 'connector'] };
        } else if (userRole === 'employer') {
            userWhereClause.role = { [Op.in]: ['employee', 'connector'] };
        } else if (userRole === 'buyer') {
            userWhereClause.role = { [Op.in]: ['seller', 'connector'] };
        } else if (userRole === 'seller') {
            userWhereClause.role = { [Op.in]: ['buyer', 'connector'] };
        }

        const recommendedUsers = await User.findAll({
            where: userWhereClause,
            include: [
                {
                    model: Profile,
                    as: 'profile',
                    required: false
                }
            ],
            attributes: ['id', 'username', 'role', 'location', 'createdAt'],
            limit: Math.floor(limit * 0.3), // 30% users
            order: [['createdAt', 'DESC']]
        });

        feed.push(...recommendedUsers.map(user => ({
            type: 'user',
            data: user,
            reason: 'You might want to connect'
        })));

        // Shuffle feed for variety
        feed = feed.sort(() => Math.random() - 0.5);

        console.log(`🎯 User ${req.user.username} retrieved discovery feed with ${feed.length} items`);

        res.status(200).json({
            success: true,
            message: 'Discovery feed retrieved successfully',
            data: {
                feed,
                pagination: {
                    currentPage: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: feed.length === parseInt(limit)
                },
                personalization: {
                    userRole,
                    userLocation,
                    recommendations: `Tailored for ${userRole}s`
                }
            }
        });
    } catch (error) {
        console.error('Get discovery feed error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while getting discovery feed.' 
        });
    }
};

module.exports = {
    unifiedSearch: exports.unifiedSearch,
    searchUsers: exports.searchUsers,
    searchPosts: exports.searchPosts,
    getSearchSuggestions: exports.getSearchSuggestions,
    getDiscoveryFeed: exports.getDiscoveryFeed
};
