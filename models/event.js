'use strict';

const mongoose = require('mongoose');
const db = require('../lib/db');

const EVENT_TYPES = ['join', 'leave', 'auth', 'ban', 'unban'];

const Event = new mongoose.Schema({
	type: {type: String, lowercase: true, required: true, enum: EVENT_TYPES},
	discordId: {type: String, index: true, required: true},
	createdAt: {type: Date, required: true, default: Date.now},
	description: String
});

module.exports = db.model('Event', Event);
