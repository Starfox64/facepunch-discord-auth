const Commando = require('discord.js-commando');
const logger = require('../../lib/logger');
const User = require('../../models/user');
const Event = require('../../models/event');
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

	async run(message, args) {
		const member = message.member;
		const facepunchId = args.facepunchId;
		let user = await User.findOne({discordId: member.id});

		if (!user)
			return await util.handleNewUser(member.id, true);

		if (user.facepunchId)
			return await message.reply(`<@${member.id}> You have already authenticated your profile recently, please wait before doing it again.`);

		let abort = false;
		try {
			var profileData = await fetchProfile(facepunchId);
		} catch (e) {
			logger.error(e);
			abort = true;
		}

		if (abort || !profileData.ok) {
			return await message.reply('Sorry, something went wrong...');
		}

		logger.debug(profileData);

		if (!profileData.token)
			return message.reply(`<@${member.id}> It seems you have not set your token. Make sure your profile is public and that your **Flickr username** is set to **${user.token}**`);

		if (profileData.token !== user.token)
			return message.reply(`<@${member.id}> Your token does not match. You should set your **Flickr username** to **${user.token}**`);

		let minPostCount = message.guild.settings.get('minPostCount', config.get('minPostCount'));
		if (profileData.postCount < minPostCount)
			return message.reply(`<@${member.id}> Sorry, you need to have at least ${minPostCount} posts to join this server. Come back when you meet this requirement.`);

		await user.updateFromProfileData(profileData);
		await util.updateDiscord(member, user);

		logger.info(`${member.user.username}#${member.user.discriminator} (${member.id}) linked his FP Account ID: ${facepunchId} USERNAME: ${profileData.username}.`);
		await Event.create({ type: 'auth', metadata: {discordId: member.id, facepunchId} });

		return message.reply(`Congratulation <@${member.id}>, your account is now linked!`);
	}
};
