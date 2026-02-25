const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Home Page
router.get('/', async (req, res) => {
    try {
        const events = await Event.find().populate('organizer').sort({ createdAt: -1 });
        res.render('index', { title: 'Home', events });
    } catch (err) {
        console.error(err);
        res.render('index', { title: 'Home', events: [] });
    }
});

module.exports = router;
