'use strict';

const Discord = require('discord.js');
const uid = require('uid-safe');
const User = require('./models/user');
const Event = require('./models/event');
const fetchProfile = require('./lib/fetch-profile');
const logger = require('./lib/logger');
const config = require('./lib/config');

const FPAUTH_REGEX = /^!fpauth ?(\d+)?$/;
const GET_FPID_REGEX = /^!getfpid <@!?(\d+)>$/;
const GET_DISCORDID_REGEX = /^!getdiscordid \d+$/;
const SET_MPC_REGEX = /^!fpminpostcount \d+$/;
const SET_CI_REGEX = /^!fpcleanupinterval \d+$/;
const FP_PROFILE_URL = 'https://facepunch.com/member.php?u=';

let botEnabled = true;

async function sendWelcomeMessage(member) {
	let user = await User.findOne({discordId: member.id});

	if (!user || !user.facepunchId) {
		let token;
		if (!user) {
			token = await uid(32);

			await User.create({
				token: token,
				discordId: member.id,
			});
		} else {
			token = user.token;

			user.joinedAt = Date.now();
			await user.save();
		}

		let welcomeChannel = discordClient.guilds.get(config.get('discord.guild')).channels.get(config.get('discord.welcomeChannel'));

		await welcomeChannel.sendMessage(`Hello <@${member.id}>! You need to link your Facepunch account to use this server. To do so you need to edit your Facepunch profile (https://facepunch.com/profile.php?do=editprofile) and set your **Flickr username** to **${token}**
Make sure your profile is public otherwise this won't work.
Once thats done we'll need your Facepunch ID, to get it go to your profile, and grab the number after *member.php?u=*
Once you have your Facepunch ID type it in this channel like so: **!fpauth *<Facepunch ID>***`);

		logger.info(`A welcome message was sent to ${member.user.username} @${member.id}.`);
	}
}

async function updateUserData(member, user, profileData) {
	user.facepunchId = profileData.facepunchId;
	user.fetchedAt = Date.now();
	user.isGoldMember = profileData.isGoldMember;
	user.isModerator = profileData.isModerator;
	await user.save();

	let roles = [config.get('roles.member')];

	if (profileData.isGoldMember)
		roles.push(config.get('roles.goldMember'));

	if (profileData.isModerator) {
		roles.push(config.get('roles.goldMember'));
		roles.push(config.get('roles.moderator'));
	}

	await member.addRoles(roles);

	if (config.get('updateNickname')) {
		try {
			await member.setNickname(profileData.username);
		} catch (e) {
			if (e.status == 403) {
				logger.warn(`Could not update ${member.user.username} @${member.id}'s nickname, permission denied.`);
			} else {
				logger.error(e);
			}
		}
	}
}

async function cleanupLoop() {
	if (!botEnabled) return;
	let welcomeChannel = discordClient.guilds.get(config.get('discord.guild')).channels.get(config.get('discord.welcomeChannel'));
	for (let member of welcomeChannel.members.values()) {
		let user = await User.findOne({discordId: member.id});
		if (!user || user.facepunchId) continue;

		if (user.shouldBeKicked()) await member.kick();
	}

	let messages = await welcomeChannel.fetchMessages({limit: 500});

	for (let message of messages.values()) {
		let member = message.member;
		let ts = message.createdAt.getTime() / 1000;
		if (member && ((member.roles.size > 1 && !member.user.bot) || (new Date().getTime() / 1000) < ts + config.get('cleanupInterval'))) messages.delete(message.id);
	}

	if (messages.size > 2) return await welcomeChannel.bulkDelete(messages);

	for (let message of messages.values()) {
		await message.delete();
	}
}

let discordClient = new Discord.Client();

discordClient.on('ready', async () => {
	discordClient.user.setPresence(new Discord.Presence({
		status: 'online',
		game: new Discord.Game({
			name: 'with postal\'s ass'
		})
	}));

	let guild = discordClient.guilds.get(config.get('discord.guild'));
	guild = await guild.fetchMembers();

	for (let member of guild.members.values()) {
		if (!member.user.bot && !(await User.findOne({discordId: member.id}))) {
			await sendWelcomeMessage(member);
		}
	}
});

discordClient.on('guildMemberAdd', async (member) => {
	if (!botEnabled) return;
	if (member.user.bot) return;

	let logMessage = `${member.user.username} @${member.id} joined the server.`;
	logger.info(logMessage);
	await Event.create({type: 'join', discordId: member.id, description: logMessage});

	let user = await User.findOne({discordId: member.id});

	if (user && user.facepunchId) {
		try {
			var profileData = await fetchProfile(user.facepunchId);
		} catch (e) {
			return logger.error(e);
		}

		return await updateUserData(member, user, profileData);
	}

	await sendWelcomeMessage(member);
});

discordClient.on('guildMemberRemove', async (member) => {
	if (!botEnabled) return;
	if (member.user.bot) return;

	let logMessage = `${member.user.username} @${member.id} left the server.`;
	logger.info(logMessage);
	await Event.create({type: 'leave', discordId: member.id, description: logMessage});
});

discordClient.on('guildBanAdd', async (guild, user) => {
	if (!botEnabled) return;
	let logMessage = `${user.username} @${user.id} was banned from the server.`;
	logger.info(logMessage);
	await Event.create({type: 'ban', discordId: user.id, description: logMessage});
});

discordClient.on('guildBanRemove', async (guild, user) => {
	if (!botEnabled) return;
	let logMessage = `${user.username} @${user.id} was unbanned from the server.`;
	logger.info(logMessage);
	await Event.create({type: 'unban', discordId: user.id, description: logMessage});
});

discordClient.on('message', async (message) => {
	if (!botEnabled) {
		if (message.channel.id === config.get('discord.moderatorChannel') && message.content === '!fpon') {
			botEnabled = true;
			await message.channel.sendMessage('The bot is back online!');
		}

		return;
	}

	if (message.channel.id === config.get('discord.welcomeChannel') && FPAUTH_REGEX.test(message.content)) {
		let member = message.member;
		let user = await User.findOne({discordId: member.id});
		let facepunchId = FPAUTH_REGEX.exec(message.content)[1];

		if (!user) return await sendWelcomeMessage(member);

		let welcomeChannel = discordClient.guilds.get(config.get('discord.guild')).channels.get(config.get('discord.welcomeChannel'));

		if (user.facepunchId) {
			if (user.canFetchProfile())
				return await welcomeChannel.sendMessage(`<@${member.id}> You have already authenticated your profile recently, please wait before doing it again.`);

			facepunchId = user.facepunchId;
		} else if (!facepunchId)
			return await welcomeChannel.sendMessage(`<@${member.id}> You need to type your Facepunch ID in this channel like so: **!fpauth *<Facepunch ID>***`);

		let abort = false;
		try {
			var profileData = await fetchProfile(facepunchId);
		} catch (e) {
			logger.error(e);
			abort = true;
		}

		if (abort || !profileData.ok) {
			return await welcomeChannel.sendMessage('Sorry, something went wrong...');
		}

		logger.debug(profileData);

		if (!user.facepunchId) {
			let token = user.token;

			if (!profileData.token)
				return await welcomeChannel.sendMessage(`<@${member.id}> It seems you have not set your token. Make sure your profile is public and that your **Flickr username** is set to **${token}**`);

			user = await User.findOne({discordId: member.id, token: profileData.token});

			if (!user)
				return await welcomeChannel.sendMessage(`<@${member.id}> Your token does not match. You should set your **Flickr username** to **${token}**`);

			let minPostCount = config.get('minPostCount');
			if (profileData.postCount < minPostCount)
				return await welcomeChannel.sendMessage(`<@${member.id}> Sorry, you need to have at least ${minPostCount} posts to join this server. Come back when you meet this requirement.`);
		}

		await updateUserData(member, user, profileData);

		let logMessage = `${member.user.username} @${member.id} linked his FP Account ID: ${facepunchId} USERNAME: ${profileData.username} GOLDMEMBER: ${profileData.isGoldMember}.`;
		logger.info(logMessage);
		await Event.create({type: 'auth', discordId: member.id, description: logMessage});

		await welcomeChannel.sendMessage(`Congratulation <@${member.id}>, your account is now linked!`);
	} else if (message.channel.id === config.get('discord.moderatorChannel') && GET_DISCORDID_REGEX.test(message.content)) {
		let facepunchId = message.content.substring(14);
		let user = await User.findOne({facepunchId});

		if (!user) return await message.channel.sendMessage(`Nobody is known by that Facepunch ID (${facepunchId})`);

		await message.channel.sendMessage(`Here is ${facepunchId}'s discord account <@${user.discordId}>`);
	} else if (message.channel.id === config.get('discord.moderatorChannel') && GET_FPID_REGEX.test(message.content)) {
		let discordId = GET_FPID_REGEX.exec(message.content)[1];
		let user = await User.findOne({discordId});

		if (!user || !user.facepunchId) return await message.channel.sendMessage(`Nobody is known by that Discord ID (${discordId})`);

		await message.channel.sendMessage(`Here is <@${discordId}>'s facepunch profile ${FP_PROFILE_URL}${user.facepunchId}`);
	} else if (message.channel.id === config.get('discord.moderatorChannel') && SET_MPC_REGEX.test(message.content)) {
		let minPostCount = Number(message.content.substring(16));
		minPostCount = Math.floor(minPostCount);

		if (minPostCount < 0) return await message.channel.sendMessage('The minimum post count needs to be greater than 0.');

		config.set('minPostCount', minPostCount);

		await message.channel.sendMessage(`The minimum post count was set to ${minPostCount}. This setting will be reverted uppon restart!`);
	} else if (message.channel.id === config.get('discord.moderatorChannel') && SET_CI_REGEX.test(message.content)) {
		let interval = Number(message.content.substring(18));
		interval = Math.floor(interval);

		if (interval < 0) return await message.channel.sendMessage('The cleanup interval needs to be greater than 0.');

		config.set('cleanupInterval', interval);

		clearInterval(cleanupIntervalHandle);
		cleanupIntervalHandle = setInterval(cleanupLoop, config.get('cleanupInterval') * 1000);

		await message.channel.sendMessage(`The cleanup interval was set to ${interval}. This setting will be reverted uppon restart!`);
	} else if (message.channel.id === config.get('discord.moderatorChannel') && message.content === '!fpreassign') {
		await message.channel.sendMessage('Reassigning roles...');
		logger.info('Reassigning roles...');

		let guild = discordClient.guilds.get(config.get('discord.guild'));
		for (let member of guild.members.values()) {
			let memberId = config.get('roles.member');
			let goldId = config.get('roles.goldMember');
			let modId = config.get('roles.moderator');

			let toRemove = [];
			if (member.roles.has(memberId)) toRemove.push(memberId);
			if (member.roles.has(goldId)) toRemove.push(goldId);
			if (member.roles.has(modId)) toRemove.push(modId);

			await member.removeRoles(toRemove);

			let user = await User.findOne({discordId: member.id});
			if (user && user.facepunchId) {
				let roles = [memberId];

				if (user.isGoldMember) roles.push(goldId);

				if (user.isModerator) {
					roles.push(goldId);
					roles.push(modId);
				}

				await member.addRoles(roles);
			}
		}

		await message.channel.sendMessage('Roles reassigned!');
		logger.info('Roles reassigned!');
	} else if (message.channel.id === config.get('discord.moderatorChannel') && message.content === '!fpoff') {
		botEnabled = false;
		await message.channel.sendMessage('The bot will no longer respond to any Discord event.');
	}
});

discordClient.login(config.get('discord.token'));

let cleanupIntervalHandle = setInterval(cleanupLoop, config.get('cleanupInterval') * 1000);

// Treats unhandled errors in async code as regular errors.
process.on('unhandledRejection', (err) => {
	logger.debug('The following error was thrown from an unhandledRejection event.');
	logger.error(err);
	process.exit(1);
});

process.on('SIGTERM', async () => {
	clearInterval(cleanupIntervalHandle);
	logger.debug('Destroying discord client...');
	await discordClient.destroy();
	logger.debug('Discord client destroyed.');
});
