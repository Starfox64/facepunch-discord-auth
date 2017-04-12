'use strict';

const mongoose = require('mongoose');
const moment = require('moment-timezone');
const constants = require('../lib/constants');
const db = require('../lib/db');

const Ban = new mongoose.Schema({
	user: { type: String, index: true, required: true },
	moderator: { type: String, index: true, required: true },
	guild: { type: String, index: true, required: true },
	reason: { type: String, required: true, default: 'N/A' },
	duration: { type: Number, required: true },
	createdAt: { type: Date, required: true, default: Date.now }
});

//TODO: Sort by furthest end date
Ban.statics.findActiveBans = function(user, guild) {
	return this.find({ user: user.id, guild: guild.id, $where: 'this.duration === 0 || this.createdAt.getTime() + this.duration * 1000 > new Date().getTime()' });
};

Ban.methods.formatReason = function() {
	const unbanDate = moment(this.createdAt).add(this.duration, 'seconds').tz('UTC');
	const formattedDate = unbanDate.format(constants.DATE_FORMAT);
	const timeLeft = unbanDate.fromNow();
	const message = `You have been banned for the following reason: ${this.reason}\n`;

	if (this.duration > 0) return message + `You will be unbanned on ${formattedDate} (${timeLeft}).`;
	return message + 'This is a permanent ban.';
};

module.exports = db.model('Ban', Ban);
