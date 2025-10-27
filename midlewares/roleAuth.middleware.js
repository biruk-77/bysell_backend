// test-project/midlewares/roleAuth.middleware.js
// Role-based authentication middleware
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Define role privileges
const ROLE_PRIVILEGES = {
    admin: {
        level: 6,
        permissions: [
            'manage_users', 'manage_posts', 'manage_connections', 'manage_messages',
            'view_analytics', 'moderate_content', 'system_settings', 'delete_any',
            'suspend_users', 'access_admin_panel', 'view_all_data', 'export_data'
        ]
    },
    connector: {
        level: 5,
        permissions: [
            'create_posts', 'manage_own_posts', 'send_connections', 'accept_connections',
            'send_messages', 'view_profiles', 'search_advanced', 'moderate_limited',
            'create_events', 'manage_networks', 'view_analytics_limited'
        ]
    },
    employer: {
        level: 4,
        permissions: [
            'create_job_posts', 'manage_own_posts', 'send_connections', 'accept_connections',
            'send_messages', 'view_profiles', 'search_candidates', 'post_jobs',
            'manage_applications', 'view_employee_profiles'
        ]
    },
    seller: {
        level: 3,
        permissions: [
            'create_product_posts', 'manage_own_posts', 'send_connections', 'accept_connections',
            'send_messages', 'view_profiles', 'manage_inventory', 'view_buyer_profiles',
            'create_offers'
        ]
    },
    buyer: {
        level: 2,
        permissions: [
            'create_request_posts', 'manage_own_posts', 'send_connections', 'accept_connections',
            'send_messages', 'view_profiles', 'search_products', 'make_purchases',
            'view_seller_profiles'
        ]
    },
    employee: {
        level: 1,
        permissions: [
            'create_profile', 'manage_own_profile', 'send_connections', 'accept_connections',
            'send_messages', 'view_profiles', 'search_jobs', 'apply_jobs',
            'view_employer_profiles'
        ]
    }
};

// Basic authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                message: 'Access denied. No token provided or invalid format.' 
            });
        }

        const token = authHeader.substring(7);
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Access denied. Token is missing.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database to ensure user still exists and get latest info
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'username', 'email', 'role', 'status', 'lastLogin']
        });

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Access denied. User not found.' 
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({ 
                success: false,
                message: `Access denied. Account is ${user.status}.` 
            });
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            privileges: ROLE_PRIVILEGES[user.role] || ROLE_PRIVILEGES.employee
        };

        console.log(`🔐 User authenticated: ${user.username} (${user.role})`);
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Access denied. Invalid token.' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Access denied. Token expired.' 
            });
        }

        return res.status(500).json({ 
            success: false,
            message: 'Internal server error during authentication.' 
        });
    }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Authentication required.' 
                });
            }

            const userRole = req.user.role;
            
            if (!allowedRoles.includes(userRole)) {
                console.log(`❌ Access denied: ${req.user.username} (${userRole}) tried to access ${req.method} ${req.path}`);
                return res.status(403).json({ 
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}` 
                });
            }

            console.log(`✅ Access granted: ${req.user.username} (${userRole}) accessing ${req.method} ${req.path}`);
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Internal server error during authorization.' 
            });
        }
    };
};

// Permission-based authorization middleware
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Authentication required.' 
                });
            }

            const userPermissions = req.user.privileges.permissions;
            const hasPermission = requiredPermissions.some(permission => 
                userPermissions.includes(permission)
            );

            if (!hasPermission) {
                console.log(`❌ Permission denied: ${req.user.username} lacks permissions: ${requiredPermissions.join(', ')}`);
                return res.status(403).json({ 
                    success: false,
                    message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}` 
                });
            }

            console.log(`✅ Permission granted: ${req.user.username} has required permissions`);
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Internal server error during permission check.' 
            });
        }
    };
};

// Admin only middleware
const adminOnly = authorize('admin');

// Owner or Admin middleware (for managing own resources)
const ownerOrAdmin = (resourceOwnerField = 'userId') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Authentication required.' 
                });
            }

            const userId = req.user.id;
            const userRole = req.user.role;
            const resourceOwnerId = req.body[resourceOwnerField] || req.params[resourceOwnerField] || req.query[resourceOwnerField];

            // Admin can access anything
            if (userRole === 'admin') {
                console.log(`✅ Admin access granted: ${req.user.username}`);
                return next();
            }

            // Resource owner can access their own resources
            if (resourceOwnerId && resourceOwnerId === userId) {
                console.log(`✅ Owner access granted: ${req.user.username}`);
                return next();
            }

            console.log(`❌ Access denied: ${req.user.username} not owner or admin`);
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. You can only manage your own resources.' 
            });
        } catch (error) {
            console.error('Owner/Admin check error:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Internal server error during ownership check.' 
            });
        }
    };
};

// Minimum role level middleware
const minimumRole = (minLevel) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Authentication required.' 
                });
            }

            const userLevel = req.user.privileges.level;
            
            if (userLevel < minLevel) {
                console.log(`❌ Insufficient role level: ${req.user.username} (level ${userLevel}) needs level ${minLevel}`);
                return res.status(403).json({ 
                    success: false,
                    message: `Access denied. Minimum role level required: ${minLevel}. Your level: ${userLevel}` 
                });
            }

            console.log(`✅ Role level sufficient: ${req.user.username} (level ${userLevel})`);
            next();
        } catch (error) {
            console.error('Role level check error:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Internal server error during role check.' 
            });
        }
    };
};

module.exports = {
    authenticate,
    authorize,
    requirePermission,
    adminOnly,
    ownerOrAdmin,
    minimumRole,
    ROLE_PRIVILEGES
};
