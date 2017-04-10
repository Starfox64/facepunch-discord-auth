'use strict';

const mongoose = require('mongoose');
const config = require('../lib/config');
const util = require('../lib/util');
const db = require('../lib/db');

const Ban = new mongoose.Schema({
	user: { type: String, index: true, required: true },
	moderator: { type: String, index: true, required: true },
	guild: { type: String, index: true, required: true },
	reason: { type: String, required: true, default: 'N/A' },
	duration: { type: Number, required: true },
	createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = db.model('Ban', Ban);
