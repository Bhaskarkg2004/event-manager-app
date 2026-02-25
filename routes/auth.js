const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { forwardAuthenticated } = require('../middleware/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => {
    res.render('login', { title: 'Login' });
});

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => {
    res.render('register', { title: 'Register' });
});

// Register Handle
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    let errors = [];

    if (!name || !email || !password) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            password,
            title: 'Register'
        });
    } else {
        try {
            const user = await User.findOne({ email: email });
            if (user) {
                errors.push({ msg: 'Email already exists' });
                res.render('register', {
                    errors,
                    name,
                    email,
                    password,
                    title: 'Register'
                });
            } else {
                const newUser = new User({
                    name,
                    email,
                    password
                });
                await newUser.save();
                res.redirect('/auth/login');
            }
        } catch (err) {
            console.error(err);
            res.redirect('/auth/register');
        }
    }
});

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: false // Need to add flash later if wanted
    })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/auth/login');
    });
});

module.exports = router;
