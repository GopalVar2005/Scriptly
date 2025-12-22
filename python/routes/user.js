const express = require('express');
const User = require('../models/User');
const passport = require('passport');
const router = express.Router();

// Register user
router.post('/register', (req, res) => {
    // Accept email and password (username optional). Use callback form to avoid
    // issues with versions of passport-local-mongoose that expect callbacks.
    const { email, password, username } = req.body;
    const displayName = username || (email ? email.split('@')[0] : undefined);
    const user = new User({ email, username: displayName });

    User.register(user, password, (err, registeredUser) => {
        if (err) {
            console.error('Register error:', err);
            // Send the error message back to client for debugging (could be sanitized)
            return res.status(400).json({ error: err && err.message ? err.message : String(err) });
        }

        // Registration succeeded
        return res.status(201).json({ message: 'User registered successfully', user: { id: registeredUser._id, username: registeredUser.username, email: registeredUser.email } });
    });
});

// Login user
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: "Invalid username or password" });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            return res.json({ 
                message: "Logged in successfully", 
                user: { id: user._id, username: user.username, email: user.email } // include username
            });
        });
    })(req, res, next);
});

// Logout user
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.json({ message: "Logged out successfully" });
    });
});

module.exports = router;
