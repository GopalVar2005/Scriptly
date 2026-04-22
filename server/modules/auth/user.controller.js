const User = require('../../models/User');
const passport = require('passport');
const { registerSchema, loginSchema } = require('../../validation');
const logger = require('../../utils/logger');

const registerUser = (req, res) => {
    const { email, password, username } = req.body;

    const { error } = registerSchema.validate({ email, password, username });
    if (error) {
        return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const displayName = username || (email ? email.split('@')[0] : 'User');
    const user = new User({ email, username: displayName });

    User.register(user, password, (err, registeredUser) => {
        if (err) {
            logger.error('[AUTH]', 'Register error:', err);
            return res.status(400).json({ success: false, error: err.message || "Registration failed" });
        }

        logger.info('[AUTH]', `User registered successfully: ${user.email}`);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: { id: registeredUser._id, username: registeredUser.username, email: registeredUser.email }
        });
    });
};

const loginUser = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, error: error.details[0].message });
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (!user) return res.status(400).json({ success: false, error: "Invalid username or password" });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            logger.info('[AUTH]', `User logged in successfully: ${user.email}`);
            return res.json({
                success: true,
                message: "Logged in successfully",
                user: { id: user._id, username: user.username, email: user.email }
            });
        });
    })(req, res, next);
};

const logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        logger.info('[AUTH]', 'User logged out successfully');
        res.json({ message: "Logged out successfully" });
    });
};

module.exports = { registerUser, loginUser, logoutUser };
