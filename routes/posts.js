import { Router } from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';

const router = Router();

// CREATE POST
router.post('/', async (req, res) => {
    console.log("hi");
    const newPost = new Post(req.body);
    try {
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

// UPDATE POST
router.put('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {
            await post.updateOne({ $set: req.body });
            res.status(200).json('Post has been updated');
        } else {
            res.status(403).json('You can only update your own post');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE POST

router.delete("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {
            await post.deleteOne();
            res.status(200).json({ message: "Post deleted successfully" });
        } else {
            res.status(403).json({ error: "You can only delete your own post" });
        }
    } catch (err) {
        console.error("Error deleting post:", err);  // Log the error
        res.status(500).json({ error: "An error occurred while deleting the post" });
    }
});


// LIKE/DISLIKE A POST
router.put('/:id/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({ $push: { likes: req.body.userId } });
            res.status(200).json('Post has been liked');
        } else {
            await post.updateOne({ $pull: { likes: req.body.userId } });
            res.status(200).json('Post has been disliked');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET A POST
router.get('/id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message, postId: req.params.id });
    }
});

// GET TIMELINE POSTS
router.get('/timeline/:userId', async (req, res) => {
    try {
        const currentUser = await User.findById(req.params.userId);
        const userPosts = await Post.find({ userId: currentUser._id });
        const friendPosts = await Promise.all(
            currentUser.followings.map(friendId => Post.find({ userId: friendId }))
        );
        res.status(200).json(userPosts.concat(...friendPosts));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET USER'S ALL POSTS
router.get('/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        const posts = await Post.find({ userId: user._id });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
