'use strict';

const mongoose = require('mongoose');
const db = require('../lib/db');

const User = new mongoose.Schema({
	facepunchId: {type: Number, index: true, unique: true, sparse: true},
	discordId: {type: String, index: true, unique: true, required: true},
	token: {type: String, index: true, unique: true, required: true},
	fetchedAt: {type: Date, required: true, default: 0}
});

module.exports = db.model('User', User);
