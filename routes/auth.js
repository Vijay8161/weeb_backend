import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';  // Add this import

const router = express.Router();



// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        // Save user to the database
        const user = await newUser.save();
        res.status(201).json({ message: 'User registered successfully.', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check the password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Wrong password.' });
        }

        // Generate a token
        console.log('User ID:', user._id);
        console.log('User isAdmin:', user.isAdmin);
        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });


        // Respond with user data and token
        res.status(200).json({ message: 'Login successful.', user: { ...user._doc, password: undefined }, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

export default router;
