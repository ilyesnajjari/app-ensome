const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login endpoint
router.post('/auth/login', async (req, res) => {
    const { name, password } = req.body;
    try {
        const user = await User.findOne({ name });

        if (!user || user.password !== password) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.type === 'enqueteur') {
            try {
                user.Hlogin = new Date();
                await user.save();
            } catch (err) {
                return res.status(500).json({ success: false, message: 'Server error while updating login time' });
            }
        }

        const response = { success: true, name: user.name, type: user.type };
        if (user.type === 'enqueteur') {
            response.enquete = user.enquete;
        }
        res.json(response);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Register endpoint
router.post('/auth/register', async (req, res) => {
    const { name, password, type } = req.body;
    try {
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const newUser = new User({
            name,
            password,
            type,
            Hlogin: null,
            Hlogout: null
        });
        await newUser.save();

        res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Route pour obtenir tous les utilisateurs
router.get('/users', async (req, res) => {
    console.log('GET /users called'); // Log to verify route is called
    try {
        const users = await User.find();
        console.log('Fetched users:', users);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Route for deleting a user by name
router.delete('/users/:name', async (req, res) => {
    console.log(`DELETE /users/${req.params.name} called`); // Log to verify route is called
    try {
        const user = await User.findOneAndDelete({ name: req.params.name });
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.send('User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server error');
    }
});

// Logout endpoint
router.post('/auth/logout', async (req, res) => {
    const { name } = req.body;
    try {
        const user = await User.findOne({ name });

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        // Mettre à jour l'heure de logout
        if (user.type === 'enqueteur') {
            try {
                user.Hlogout = new Date();
                await user.save();
            } catch (err) {
                return res.status(500).json({ success: false, message: 'Server error while updating logout time' });
            }
        }

        res.json({ success: true, message: 'Logout successful' });
    } catch (err) {
        console.error(`Error during logout: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
