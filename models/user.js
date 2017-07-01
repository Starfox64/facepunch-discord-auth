'use strict';

const mongoose = require('mongoose');
const config = require('../lib/config');
const util = require('../lib/util');
const db = require('../lib/db');

const User = new mongoose.Schema({
	facepunchId: { type: Number, index: true, sparse: true },
	discordId: { type: String, index: true, unique: true, required: true },
	isGoldMember: { type: Boolean },
	isModerator: { type: Boolean },
	username: { type: String },
	aliases: [String],
	token: { type: String, index: true, unique: true, required: true },
	fetchedAt: { type: Date, required: true, default: 0 }
});

User.methods.canFetchProfile = function() {
	let fetchedAt = this.fetchedAt.getTime() / 1000;
	return util.currentTimestamp() > fetchedAt + config.get('fetchCooldown');
};

User.methods.updateFromProfileData = function(profileData) {
	this.facepunchId = profileData.facepunchId;
	this.fetchedAt = Date.now();
	this.isGoldMember = profileData.isGoldMember;
	this.isModerator = profileData.isModerator;
	this.username = profileData.username;

	return this.save();
};

module.exports = db.model('User', User);
