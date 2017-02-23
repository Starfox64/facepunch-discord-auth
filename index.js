'use strict';

const Discord = require('discord.js');
const uid = require('uid-safe');
const co = require('co');
const User = require('./models/user');
const Event = require('./models/event');
const fetchProfile = require('./lib/fetch-profile');
const logger = require('./lib/logger');
const config = require('./lib/config');

const FPAUTH_REGEX = /^!fpauth ?(\d+)?$/;
const GET_FPID_REGEX = /^!getfpid <@!?(\d+)>$/;
const GET_DISCORDID_REGEX = /^!getdiscordid \d+$/;
const FP_PROFILE_URL = 'https://facepunch.com/member.php?u=';

function sendWelcomeMessage(member) {
	return co(function*() {
		let user = yield User.findOne({discordId: member.id});

		if (!user || !user.facepunchId) {
			let token;
			if (!user) {
				token = yield uid(32);

				yield User.create({
					token: token,
					discordId: member.id,
				});
			} else {
				token = user.token;
			}

			let welcomeChannel = discordClient.guilds.get(config.get('discord.guild')).channels.get(config.get('discord.welcomeChannel'));

			yield welcomeChannel.sendMessage(`Hello <@${member.id}>! You need to link your Facepunch account to use this server. To do so you need to edit your Facepunch profile (https://facepunch.com/profile.php?do=editprofile) and set your **Flickr username** to **${token}**
Once thats done we'll need your Facepunch ID, to get it go to your profile, and grab the number after *member.php?u=*
Once you have your Facepunch ID type it in this channel like so: **!fpauth *<Facepunch ID>***`);

			logger.info(`A welcome message was sent to ${member.user.username} @${member.id}.`);
		}
	});
}

let discordClient = new Discord.Client();

discordClient.on('ready', () => {
	co(function*() {
		let guild = discordClient.guilds.get(config.get('discord.guild'));
		guild = yield guild.fetchMembers();

		for (let member of guild.members.values()) {
			if (!member.user.bot && !(yield User.findOne({discordId: member.id}))) {
				yield sendWelcomeMessage(member);
			}
		}
	}).catch(logger.error);
});

discordClient.on('guildMemberAdd', (member) => {
	co(function*() {
		if (member.user.bot) return;
		let user = yield User.findOne({discordId: member.id});

		if (user && user.facepunchId) return;

		yield sendWelcomeMessage(member);

		let logMessage = `${member.user.username} @${member.id} joined the server.`;
		logger.info(logMessage);
		yield Event.create({type: 'join', discordId: member.id, description: logMessage});
	}).catch(logger.error);
});

discordClient.on('guildMemberRemove', (member) => {
	co(function*() {
		if (member.user.bot) return;

		let logMessage = `${member.user.username} @${member.id} left the server.`;
		logger.info(logMessage);
		yield Event.create({type: 'leave', discordId: member.id, description: logMessage});
	}).catch(logger.error);
});

discordClient.on('guildBanAdd', (guild, user) => {
	co(function*() {
		let logMessage = `${user.username} @${user.id} was banned from the server.`;
		logger.info(logMessage);
		yield Event.create({type: 'ban', discordId: user.id, description: logMessage});
	}).catch(logger.error);
});

discordClient.on('guildBanRemove', (guild, user) => {
	co(function*() {
		let logMessage = `${user.username} @${user.id} was unbanned from the server.`;
		logger.info(logMessage);
		yield Event.create({type: 'unban', discordId: user.id, description: logMessage});
	}).catch(logger.error);
});

discordClient.on('message', (message) => {
	if (message.channel.id === config.get('discord.welcomeChannel') && FPAUTH_REGEX.test(message.content)) {
		co(function*() {
			let member = message.member;
			let user = yield User.findOne({discordId: member.id});
			let facepunchId = FPAUTH_REGEX.exec(message.content)[1];

			if (!user) return yield sendWelcomeMessage(member);

			let welcomeChannel = discordClient.guilds.get(config.get('discord.guild')).channels.get(config.get('discord.welcomeChannel'));

			if (user.facepunchId) {
				let ts = user.fetchedAt.getTime() / 1000;
				if ((new Date().getTime() / 1000) < ts + config.get('fetchCooldown'))
					return yield welcomeChannel.sendMessage(`<@${member.id}> You have already authenticated your profile recently, please wait before doing it again.`);

				facepunchId = user.facepunchId;
			} else if (!facepunchId)
				return yield welcomeChannel.sendMessage(`<@${member.id}> You need to type your Facepunch ID in this channel like so: **!fpauth *<Facepunch ID>***`);

			let abort = false;
			try {
				var profileData = yield fetchProfile(facepunchId);
			} catch (e) {
				logger.error(e);
				abort = true;
			}

			if (abort || !profileData.ok) {
				return yield welcomeChannel.sendMessage('Sorry, something went wrong...');
			}

			if (!user.facepunchId) {
				let token = user.token;

				if (!profileData.token)
					return yield welcomeChannel.sendMessage(`<@${member.id}> It seems you have not set your token. You should set your **Flickr username** to **${token}**`);

				user = yield User.findOne({discordId: member.id, token: profileData.token});

				if (!user)
					return yield welcomeChannel.sendMessage(`<@${member.id}> Your token does not match. You should set your **Flickr username** to **${token}**`);

				let minPostCount = config.get('minPostCount');
				if (profileData.postCount < minPostCount)
					return yield welcomeChannel.sendMessage(`<@${member.id}> Sorry, you need to have at least ${minPostCount} posts to join this server. Come back when you meet this requirement.`);
			}

			user.facepunchId = facepunchId;
			user.fetchedAt = Date.now();
			yield user.save();

			//GIVE ROLES
			yield member.addRole(config.get('roles.member'));

			if (profileData.isGoldMember) {
				yield member.addRole(config.get('roles.goldMember'));
			}

			if (config.get('updateNickname')) {
				try {
					yield member.setNickname(profileData.username);
				} catch (e) {
					if (e.status == 403) {
						logger.warn(`Could not update ${member.user.username} @${member.id}'s nickname, permission denied.`);
					} else {
						logger.error(e);
					}
				}
			}

			let logMessage = `${member.user.username} @${member.id} linked his FP Account ID: ${facepunchId} USERNAME: ${profileData.username} GOLDMEMBER: ${profileData.isGoldMember}.`;
			logger.info(logMessage);
			yield Event.create({type: 'auth', discordId: member.id, description: logMessage});

			yield welcomeChannel.sendMessage(`Congratulation <@${member.id}>, your account is now linked!`);
		}).catch(logger.error);
	} else if (message.channel.id === config.get('discord.moderatorChannel') && GET_DISCORDID_REGEX.test(message.content)) {
		co(function*() {
			let facepunchId = message.content.substring(14);
			let user = yield User.findOne({facepunchId});

			if (!user) return yield message.channel.sendMessage(`Nobody is known by that Facepunch ID (${facepunchId})`);

			yield message.channel.sendMessage(`Here is ${facepunchId}'s discord account <@${user.discordId}>`);
		}).catch(logger.error);
	} else if (message.channel.id === config.get('discord.moderatorChannel') && GET_FPID_REGEX.test(message.content)) {
		co(function*() {
			let discordId = GET_FPID_REGEX.exec(message.content)[1];
			let user = yield User.findOne({discordId});

			if (!user || !user.facepunchId) return yield message.channel.sendMessage(`Nobody is known by that Discord ID (${discordId})`);

			yield message.channel.sendMessage(`Here is <@${discordId}>'s facepunch profile ${FP_PROFILE_URL}${user.facepunchId}`);
		}).catch(logger.error);
	}
});

discordClient.login(config.get('discord.token'));

process.on('SIGTERM', () => {
	discordClient.destroy();
});
