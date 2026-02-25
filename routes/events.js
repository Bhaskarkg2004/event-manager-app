const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Comment = require('../models/Comment');
const { ensureAuthenticated } = require('../middleware/auth');

// Create Event Page
router.get('/create', ensureAuthenticated, (req, res) => {
    res.render('create-event', { title: 'Create Event' });
});

// Create Event Handle
router.post('/create', ensureAuthenticated, async (req, res) => {
    const { title, description, date, time, location, category } = req.body;
    try {
        const newEvent = new Event({
            title,
            description,
            date,
            time,
            location,
            category,
            organizer: req.user.id
        });
        await newEvent.save();
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('create-event', { title: 'Create Event', error: 'Something went wrong' });
    }
});

// Event Details Page
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer');
        const comments = await Comment.find({ event: req.params.id }).populate('user').sort({ createdAt: -1 });
        let isRegistered = false;
        if (req.user) {
            const reg = await Registration.findOne({ event: req.params.id, user: req.user.id });
            if (reg) isRegistered = true;
        }
        res.render('event-details', { title: event.title, event, comments, isRegistered });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Register for Event
router.post('/:id/register', ensureAuthenticated, async (req, res) => {
    try {
        const alreadyRegistered = await Registration.findOne({ event: req.params.id, user: req.user.id });
        if (!alreadyRegistered) {
            const newReg = new Registration({
                event: req.params.id,
                user: req.user.id
            });
            await newReg.save();
        }
        res.redirect(`/events/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.redirect(`/events/${req.params.id}`);
    }
});

// Like Event
router.post('/:id/like', ensureAuthenticated, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (event.likes.includes(req.user.id)) {
            event.likes.pull(req.user.id);
        } else {
            event.likes.push(req.user.id);
        }
        await event.save();
        res.redirect(`/events/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.redirect(`/events/${req.params.id}`);
    }
});

// Comment on Event
router.post('/:id/comment', ensureAuthenticated, async (req, res) => {
    try {
        const newComment = new Comment({
            event: req.params.id,
            user: req.user.id,
            content: req.body.content
        });
        await newComment.save();
        res.redirect(`/events/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.redirect(`/events/${req.params.id}`);
    }
});

// Show Edit Event Page
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        // Only organizer can edit
        if (!event || event.organizer.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }

        res.render('edit-event', { event, title: 'Edit Event' });

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Handle Edit Event
router.post('/:id/edit', ensureAuthenticated, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event || event.organizer.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }

        const { title, description, date, time, location, category } = req.body;

        event.title = title;
        event.description = description;
        event.date = date;
        event.time = time;
        event.location = location;
        event.category = category;

        await event.save();

        res.redirect(`/events/${event._id}`);

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});


// Delete Event
router.post('/:id/delete', ensureAuthenticated, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        // Only organizer can delete
        if (!event || event.organizer.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }

        // Optional but recommended:
        // Delete related registrations & comments
        await Registration.deleteMany({ event: req.params.id });
        await Comment.deleteMany({ event: req.params.id });

        await Event.findByIdAndDelete(req.params.id);

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

module.exports = router;
