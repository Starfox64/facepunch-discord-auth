'use strict';

const logger = require('./logger');
const config = require('./config');
const uid = require('uid-safe');
const User = require('../models/user');

const util = module.exports = {};

util.currentTimestamp = function currentTimestamp() {
	return new Date().getTime() / 1000;
};

util.getGuildEntryRoom = async function getGuildEntryRoom(guild) {
	const entryRoom = guild.settings.get('entryRoom');
	let channel = guild.channels.get(guild.id);
	if (entryRoom) channel = guild.channels.get(entryRoom);

	return channel;
};

util.handleNewUser = async function handleNewUser(discordId, skipLookup = false) {
	let user = skipLookup ? null : await User.findOne({ discordId });

	if (!user) {
		user = await User.create({
			token: await uid(32),
			discordId
		});
	}

	return user;
};

util.sendWelcomeMessage = async function sendWelcomeMessage(channel, user, token) {
	await channel.sendMessage(`Hello <@${user.id}>! You need to link your Facepunch account to use this server. To do so you need to edit your Facepunch profile (https://facepunch.com/profile.php?do=editprofile) and set your **Flickr username** to **${token}**
Make sure your profile is public otherwise this won't work.
Once thats done we'll need your Facepunch ID, to get it go to your profile, and grab the number after *member.php?u=*
Once you have your Facepunch ID type it in this channel like so: **!fpauth *<Facepunch ID>***`);

	logger.info(`A welcome message was sent to ${user.username}#${user.discriminator} (${user.id}).`);
};

util.updateDiscord = async function updateDiscord(member, user) {
	const guildSettings = member.guild.settings;
	const roles = [];

	if (guildSettings.get('memberRole'))
		roles.push(guildSettings.get('memberRole'));

	if (user.isGoldMember && guildSettings.get('goldMemberRole'))
		roles.push(guildSettings.get('memberRole'));

	if (user.isModerator) {
		if (guildSettings.get('goldMemberRole')) roles.push(guildSettings.get('goldMemberRole'));
		if (guildSettings.get('moderatorRole')) roles.push(guildSettings.get('moderatorRole'));
	}

	await member.addRoles(roles);

	if (guildSettings.get('updateNickname', config.get('updateNickname'))) {
		try {
			await member.setNickname(user.username);
		} catch (e) {
			if (e.status == 403) {
				logger.warn(`Could not update ${member.user.username}#${member.user.discriminator} (${member.id})'s nickname, permission denied.`);
			} else {
				logger.error(e);
			}
		}
	}
};

util.resetDiscord = async function resetDiscord(member) {
	const guildSettings = member.guild.settings;
	const toRemove = [];

	const memberRole = guildSettings.get('memberRole');
	const goldMemberRole = guildSettings.get('goldMemberRole');
	const moderatorRole = guildSettings.get('moderatorRole');

	if (memberRole && member.roles.has(memberRole)) toRemove.push(goldMemberRole);
	if (goldMemberRole && member.roles.has(goldMemberRole)) toRemove.push(goldMemberRole);
	if (moderatorRole && member.roles.has(moderatorRole)) toRemove.push(moderatorRole);

	await member.removeRoles(toRemove);

	if (guildSettings.get('updateNickname', config.get('updateNickname'))) {
		try {
			await member.setNickname('');
		} catch (e) {
			if (e.status == 403) {
				logger.warn(`Could not update ${member.user.username}#${member.user.discriminator} (${member.id})'s nickname, permission denied.`);
			} else {
				logger.error(e);
			}
		}
	}
};

util.getCleanupLoop = function getCleanupLoop(discordClient) {
	return async () => {
		const userCache = new Map();

		for (const guild of discordClient.guilds.values()) {

			await guild.fetchMembers();

			for (const member of guild.members.values()) {
				const cached = userCache.has(member.id);
				const user = cached ? userCache.get(member.id) : await User.findOne({ discordId: member.id });
				if (!cached) userCache.set(member.id, user);

				const joinedTimestamp = member.joinedTimestamp / 1000;
				const maxIdleTime = guild.settings.get('maxIdleTime', config.get('maxIdleTime'));

				if ((!user || !user.facepunchId) && util.currentTimestamp() > joinedTimestamp + maxIdleTime) {
					try {
						await member.sendMessage('You took too long to authenticate!');
					} catch (e) {
						if (e.status == 403) {
							logger.warn(`Could not send kick reason to ${member.user.username}#${member.user.discriminator} (${member.id}), permission denied.`);
						} else {
							logger.error(e);
						}
					}

					try {
						await member.kick();
					} catch (e) {
						if (e.status == 403) {
							logger.warn(`Could not kick ${member.user.username}#${member.user.discriminator} (${member.id}), permission denied.`);
						} else {
							logger.error(e);
						}
					}
				}
			}
		}

		userCache.clear();
	};
};

util.isInModeratorChannel = function isInModeratorChannel(message) {
	const moderatorChannel = message.guild.settings.get('moderatorChannel');

	if (!moderatorChannel) return false;
	return message.channel.id === moderatorChannel;
};
