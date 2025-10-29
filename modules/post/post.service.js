const { Post } = require('../../models');

class PostService {
    // Create new post
    async createPost(userId, postData) {
        const post = await Post.create({
            userId,
            ...postData
        });

        const populatedPost = await Post.findById(post._id)
            .populate('userId', 'username email')
            .populate('comments.userId', 'username email');

        // Post created
        return populatedPost;
    }

    // Get post by ID
    async getPostById(postId) {
        return await Post.findById(postId)
            .populate('userId', 'username email')
            .populate('comments.userId', 'username email')
            .populate('likes', 'username email');
    }

    // Get posts by user
    async getPostsByUser(userId, limit = 10, skip = 0) {
        return await Post.find({ userId })
            .populate('userId', 'username email')
            .populate('comments.userId', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
    }

    // Get all posts (feed)
    async getAllPosts(limit = 10, skip = 0) {
        return await Post.find({ status: 'active' })
            .populate('userId', 'username email')
            .populate('comments.userId', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
    }

    // Update post
    async updatePost(postId, userId, updateData) {
        const post = await Post.findOneAndUpdate(
            { _id: postId, userId },
            updateData,
            { new: true, runValidators: true }
        ).populate('userId', 'username email');

        if (post) {
            // Post updated
        }
        return post;
    }

    // Delete post
    async deletePost(postId, userId) {
        const post = await Post.findOneAndDelete({ _id: postId, userId });
        if (post) {
            // Post deleted
        }
        return post;
    }

    // Like/Unlike post
    async toggleLike(postId, userId) {
        const post = await Post.findById(postId);
        if (!post) return null;

        const isLiked = post.likes.includes(userId);
        
        if (isLiked) {
            post.likes.pull(userId);
            // Post unliked
        } else {
            post.likes.push(userId);
            // Post liked
        }

        await post.save();
        return await this.getPostById(postId);
    }

    // Add comment
    async addComment(postId, userId, content) {
        const post = await Post.findById(postId);
        if (!post) return null;

        post.comments.push({
            userId,
            content,
            createdAt: new Date()
        });

        await post.save();
        const updatedPost = await this.getPostById(postId);
        
        // Comment added to post
        return updatedPost;
    }
}

module.exports = new PostService();
