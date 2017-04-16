const Commando = require('discord.js-commando');
const logger = require('../../lib/logger');
const User = require('../../models/user');
const fetchProfile = require('../../lib/fetch-profile');
const util = require('../../lib/util');

module.exports = class FPUpdate extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpupdate',
			group: 'user',
			memberName: 'fpupdate',
			description: 'Updates your profile information.',
			examples: ['fpupdate'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return message.guild.settings.get('enabled', false) && message.guild.settings.get('registrar', false);
	}

	async run(message) {
		const member = message.member;
		let user = await User.findOne({discordId: member.id});

		if (!user && !user.facepunchId) return message.reply('You need to authenticate your account first, see the fpauth command.');
		if (!user.canFetchProfile()) return message.reply('You need to wait before updating your profile.');

		let abort = false;
		try {
			var profileData = await fetchProfile(user.facepunchId);
		} catch (e) {
			logger.error(e);
			abort = true;
		}

		if (abort || !profileData.ok)
			return message.reply('Sorry, something went wrong...');

		logger.debug(profileData);

		await user.updateFromProfileData(profileData);
		await util.updateDiscord(member, user);

		//TODO: Update non-registrar guilds

		return message.reply('Your profile information has been updated!');
	}
};
