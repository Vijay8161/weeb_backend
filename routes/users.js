import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Update User
router.put('/:id', async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
        if (req.body.password) {
            try {
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
            } catch (err) {
                return res.status(500).json({ error: 'Error hashing password.' });
            }
        }
        try {
            const user = await User.findByIdAndUpdate(req.params.id, {
                $set: req.body,
            }, { new: true });
            res.status(200).json(user);
        } catch (err) {
            return res.status(500).json({ error: 'Error updating user.' });
        }
    } else {
        return res.status(403).json({ error: 'You can only update your own account!' });
    }
});

// Delete User
router.delete('/:id', async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json('Account has been deleted');
        } catch (err) {
            return res.status(500).json({ error: 'Error deleting user.' });
        }
    } else {
        return res.status(403).json({ error: 'You can only delete your own account!' });
    }
});

// Get a User
router.get('/', async (req, res) => {
    const userId = req.query.userId;
    const username = req.query.username;
    try {
        const user = userId
            ? await User.findById(userId)
            : await User.findOne({ username: username });
        const { password, updatedAt, ...other } = user._doc;
        res.status(200).json(other);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user.' });
    }
});

// Get Friends
router.get('/friends/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        const friends = await Promise.all(
            user.followings.map((friendId) => {
                return User.findById(friendId);
            })
        );
        let friendList = [];
        friends.map(friend => {
            const { _id, username, profilePicture } = friend;
            friendList.push({ _id, username, profilePicture });
        });
        res.status(200).json(friendList);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching friends.' });
    }
});

// Follow a User
router.put('/:id/follow', async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if (!user.followers.includes(req.body.userId)) {
                await user.updateOne({ $push: { followers: req.body.userId } });
                await currentUser.updateOne({ $push: { followings: req.params.id } });
                res.status(200).json('User has been followed');
            } else {
                res.status(403).json('You already follow this user');
            }
        } catch (err) {
            res.status(500).json({ error: 'Error following user.' });
        }
    } else {
        res.status(403).json('You cannot follow yourself');
    }
});

// Unfollow a User
router.put('/:id/unfollow', async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if (user.followers.includes(req.body.userId)) {
                await user.updateOne({ $pull: { followers: req.body.userId } });
                await currentUser.updateOne({ $pull: { followings: req.params.id } });
                res.status(200).json('User has been unfollowed');
            } else {
                res.status(403).json('You do not follow this user');
            }
        } catch (err) {
            res.status(500).json({ error: 'Error unfollowing user.' });
        }
    } else {
        res.status(403).json('You cannot unfollow yourself');
    }
});

export default router;
