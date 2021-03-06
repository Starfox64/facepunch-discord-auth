'use strict';

const mongoose = require('mongoose');
const moment = require('moment-timezone');
const constants = require('../lib/constants');
const util = require('../lib/util');
const db = require('../lib/db');

const Ban = new mongoose.Schema({
	user: { type: String, index: true, required: true },
	moderator: { type: String, index: true, required: true },
	guild: { type: String, index: true, required: true },
	reason: { type: String, required: true, default: 'N/A' },
	duration: { type: Number, required: true },
	global: { type: Boolean, required: true, default: false },
	createdAt: { type: Date, required: true, default: Date.now }
});

Ban.statics.findActiveBans = async function (user, guild) {
	let guilds = [guild.id];

	if (guild.settings.get('banSubscriptionMode', 0) == 2)
		guilds = guilds.concat(util.propertyArray(util.getMasterGuilds(guild.client), 'id'));

	let or = [{ guild: { $in: guilds } }];

	if (guild.settings.get('banSubscriptionMode', 0) > 0 || guild.settings.get('master', false))
		or.push({ global: true });

	let bans = await this.find({
		$and: [
			{ user: user.id },
			{ $or: or }
		],
		$where: 'this.duration === 0 || this.createdAt.getTime() + this.duration * 1000 > new Date().getTime()'
	}).sort({createdAt: -1}).exec();

	return bans;
};

Ban.methods.formatReason = function() {
	const unbanDate = moment(this.createdAt).add(this.duration, 'seconds').tz('UTC');
	const formattedDate = unbanDate.format(constants.DATE_FORMAT);
	const timeLeft = unbanDate.fromNow();
	const message = `You have been banned for the following reason: ${this.reason}\n`;

	if (this.duration > 0) return message + `You will be unbanned on ${formattedDate} (${timeLeft}).`;
	return message + 'This is a permanent ban.';
};

Ban.methods.unbanTs = function() {
	if (this.duration === 0) return Infinity;
	return this.createdAt.getTime() + this.duration * 1000;
};

module.exports = db.model('Ban', Ban);
