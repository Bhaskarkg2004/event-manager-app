const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            console.log('Passport: Finding user with email:', email);
            // Match user
            User.findOne({ email: email })
                .then(user => {
                    if (!user) {
                        console.log('Passport: User not found');
                        return done(null, false, { message: 'That email is not registered' });
                    }

                    console.log('Passport: User found, comparing passwords');
                    // Match password
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) {
                            console.error('Passport Bcrypt Error:', err);
                            throw err;
                        }
                        if (isMatch) {
                            console.log('Passport: Password matches');
                            return done(null, user);
                        } else {
                            console.log('Passport: Password does not match');
                            return done(null, false, { message: 'Password incorrect' });
                        }
                    });
                })
                .catch(err => {
                    console.error('Passport Error:', err);
                    done(err);
                });
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
