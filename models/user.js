'use strict';

const mongoose = require('mongoose');
const config = require('../lib/config');
const db = require('../lib/db');

const User = new mongoose.Schema({
	facepunchId: {type: Number, index: true, unique: true, sparse: true},
	discordId: {type: String, index: true, unique: true, required: true},
	token: {type: String, index: true, unique: true, required: true},
	fetchedAt: {type: Date, required: true, default: 0},
	joinedAt: {type: Date, required: true, default: Date.now},
});

User.methods.canFetchProfile = function() {
	let ts = this.fetchedAt.getTime() / 1000;
	return (new Date().getTime() / 1000) < ts + config.get('fetchCooldown');
};

User.methods.shouldBeKicked = function() {
	let ts = this.joinedAt.getTime() / 1000;
	return (new Date().getTime() / 1000) > ts + config.get('authWindow');
};

module.exports = db.model('User', User);
