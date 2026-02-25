const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Database connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/event_management';
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Passport config
require('./middleware/passport')(passport);

const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoStoreOptions = {
    mongoUrl: mongoURI,
    collectionName: 'sessions'
};

// EJS Setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Express session
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.default ? MongoStore.default.create(mongoStoreOptions) : MongoStore.create(mongoStoreOptions)
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variables (for flash messages and user)
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Method override
app.use(methodOverride('_method'));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/events', require('./routes/events'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
