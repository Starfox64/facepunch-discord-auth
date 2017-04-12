'use strict';

const mongoose = require('mongoose');
const config = require('../lib/config');
const util = require('../lib/util');
const db = require('../lib/db');

const User = new mongoose.Schema({
	facepunchId: { type: Number, index: true, unique: true, sparse: true },
	discordId: { type: String, index: true, unique: true, required: true },
	isGoldMember: { type: Boolean },
	isModerator: { type: Boolean },
	username: { type: String },
	token: { type: String, index: true, unique: true, required: true },
	fetchedAt: { type: Date, required: true, default: 0 }
});

User.methods.canFetchProfile = function() {
	let ts = this.fetchedAt.getTime() / 1000;
	return util.currentTimestamp() < ts + config.get('fetchCooldown');
};

User.methods.updateFromProfileData = async function(profileData) {
	this.facepunchId = profileData.facepunchId;
	this.fetchedAt = Date.now();
	this.isGoldMember = profileData.isGoldMember;
	this.isModerator = profileData.isModerator;
	this.username = profileData.username;

	await this.save();
};

module.exports = db.model('User', User);
