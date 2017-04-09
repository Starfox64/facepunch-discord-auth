'use strict';

const mongoose = require('mongoose');
const db = require('../lib/db');

const EVENT_TYPES = ['join', 'leave', 'auth', 'ban', 'unban'];

const Event = new mongoose.Schema({
	type: { type: String, lowercase: true, required: true, enum: EVENT_TYPES },
	metadata: { type: Object, required: true, default: {} },
	createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = db.model('Event', Event);
