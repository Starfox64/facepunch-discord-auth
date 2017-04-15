const Commando = require('discord.js-commando');
const logger = require('../../lib/logger');
const User = require('../../models/user');
const config = require('../../lib/config');
const fetchProfile = require('../../lib/fetch-profile');
const util = require('../../lib/util');

module.exports = class FPAuthCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpauth',
			group: 'user',
			memberName: 'fpauth',
			description: 'Authenticates your account.',
			examples: ['fpauth 513945'],
			guildOnly: true,
			args: [
				{
					key: 'facepunchId',
					label: 'Facepunch ID',
					prompt: 'What is your Facepunch ID (number in your profile URL)?',
					type: 'integer',
					wait: 60
				}
			]
		});
	}

	isUsable(message) {
		return message.guild.settings.get('enabled', true) && message.guild.settings.get('registrar', false);
	}

	async run(message, args) {
		const member = message.member;
		const facepunchId = args.facepunchId;
		let user = await User.findOne({discordId: member.id});

		if (!user)
			user = await util.handleNewUser(member.id, true);

		if (user.facepunchId)
			return message.reply('You have already authenticated your profile.');

		let abort = false;
		try {
			var profileData = await fetchProfile(facepunchId);
		} catch (e) {
			logger.error(e);
			abort = true;
		}

		if (abort || !profileData.ok)
			return message.reply('Sorry, something went wrong...');

		logger.debug(profileData);

		if (!profileData.token)
			return message.reply(`It seems you have not set your token. Make sure your profile is public and that your **Flickr username** is set to **${user.token}**`);

		if (profileData.token !== user.token)
			return message.reply(`Your token does not match. You should set your **Flickr username** to **${user.token}**`);

		if (profileData.isBanned)
			return message.reply('Your Facepunch account is currently banned, come back when it\'s not.');

		let minPostCount = message.guild.settings.get('minPostCount', config.get('minPostCount'));
		if (profileData.postCount < minPostCount)
			return message.reply(`Sorry, you need to have at least ${minPostCount} posts to authenticate. Come back when you meet this requirement.`);

		await user.updateFromProfileData(profileData);
		await util.updateDiscord(member, user);

		//TODO: Update non-registrar guilds

		await util.log(message.guild, `${member.user.username}#${member.user.discriminator} (<@${member.id}>) linked his FP Account ID: ${facepunchId} USERNAME: ${profileData.username}.`);

		return message.reply('Congratulation, your account is now linked!');
	}
};