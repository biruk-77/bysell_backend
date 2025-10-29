const postRoutes = require('./post.routes');
const postController = require('./post.controller');
const postService = require('./post.service');
const postEvents = require('./post.events');

module.exports = {
    routes: postRoutes,
    controller: postController,
    service: postService,
    events: postEvents
};
