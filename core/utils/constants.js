// Application constants
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
};

const POST_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DELETED: 'deleted'
};

const NOTIFICATION_TYPES = {
    MESSAGE: 'message',
    CONNECTION_REQUEST: 'connection_request',
    CONNECTION_ACCEPTED: 'connection_accepted',
    POST_LIKE: 'post_like',
    POST_COMMENT: 'post_comment'
};

module.exports = {
    HTTP_STATUS,
    USER_ROLES,
    POST_STATUS,
    NOTIFICATION_TYPES
};
