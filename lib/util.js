'use strict';

const escapeMarkdown = require('discord.js').escapeMarkdown;
const logger = require('./logger');
const config = require('./config');
const uid = require('uid-safe');

const util = module.exports = {};

util.currentTimestamp = function currentTimestamp() {
	return new Date().getTime() / 1000;
};

util.getGuildEntryRoom = function getGuildEntryRoom(guild) {
	const entryRoom = guild.settings.get('entryRoom');
	let channel = guild.channels.get(guild.id);
	if (guild.channels.has(entryRoom)) channel = guild.channels.get(entryRoom);

	return channel;
};

util.handleNewUser = async function handleNewUser(discordId, skipLookup = false) {
	const User = require('../models/user');
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
	await channel.sendMessage(`Hello <@${user.id}>! You need to link your Facepunch account to use this server. To do so you need to edit your Facepunch profile (https://facepunch.com/profile.php?do=editprofile) and set your **Flickr username** to **${escapeMarkdown(token)}**
Make sure your profile is public otherwise this won't work.
Once thats done we'll need your Facepunch ID, to get it go to your profile, and grab the number after *member.php?u=*
Once you have your Facepunch ID type it in this channel like so: **!fpauth *<Facepunch ID>***`);

	logger.info(`A welcome message was sent to ${user.username}#${user.discriminator} (${user.id}).`);
};

util.updateDiscord = async function updateDiscord(member, user) {
	const guild = member.guild;
	const guildSettings = guild.settings;
	const roles = [];

	if (!user || !user.facepunchId) return;

	if (guild.roles.has(guildSettings.get('memberRole')) && !member.roles.has(guildSettings.get('memberRole')) && !member.roles.has(guildSettings.get('banRole')))
		roles.push(guildSettings.get('memberRole'));

	if (guild.roles.has(guildSettings.get('goldMemberRole')) && (user.isGoldMember || user.isModerator) && !member.roles.has(guildSettings.get('goldMemberRole')))
		roles.push(guildSettings.get('goldMemberRole'));

	try {
		if (roles.length > 0) await member.addRoles(roles);
	} catch (e) {
		if (e.name === 'DiscordAPIError') {
			logger.warn(`Could not update ${member.user.username}#${member.user.discriminator} (${member.id})'s roles, ${e.message}.`);
		} else {
			logger.error(e);
		}
	}

	if (guildSettings.get('updateNickname', config.get('updateNickname'))) {
		try {
			await member.setNickname(user.username);
		} catch (e) {
			if (e.name === 'DiscordAPIError') {
				logger.warn(`Could not update ${member.user.username}#${member.user.discriminator} (${member.id})'s nickname, ${e.message}.`);
			} else {
				logger.error(e);
			}
		}
	}

	logger.debug(`Update ${member.user.username}#${member.user.discriminator} (${member.id}).`);
};

util.resetDiscord = async function resetDiscord(member) {
	const guildSettings = member.guild.settings;
	const toRemove = [];

	const memberRole = guildSettings.get('memberRole');
	const goldMemberRole = guildSettings.get('goldMemberRole');

	if (member.roles.has(memberRole)) toRemove.push(memberRole);
	if (member.roles.has(goldMemberRole)) toRemove.push(goldMemberRole);

	try {
		if (toRemove.length > 0) await member.removeRoles(toRemove);
	} catch (e) {
		if (e.name === 'DiscordAPIError') {
			logger.warn(`Could not update ${member.user.username}#${member.user.discriminator} (${member.id})'s roles, ${e.message}.`);
		} else {
			logger.error(e);
		}
	}

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

	logger.debug(`Reset ${member.user.username}#${member.user.discriminator} (${member.id}).`);
};

util.kick = async function kick(member, reason, ban = false) {
	try {
		await member.sendMessage(reason);
	} catch (e) {
		if (e.status == 403) {
			logger.warn(`Could not send kick reason to ${member.user.username}#${member.user.discriminator} (${member.id}), permission denied.`);
		} else {
			logger.error(e);
		}
	}

	try {
		if (ban) await member.ban();
		else await member.kick();
	} catch (e) {
		if (e.status == 403) {
			logger.warn(`Could not kick/ban ${member.user.username}#${member.user.discriminator} (${member.id}), permission denied.`);
		} else {
			logger.error(e);
		}
	}
};

util.getCleanupLoop = function getCleanupLoop(discordClient) {
	const User = require('../models/user');
	const Ban = require('../models/ban');

	return async () => {
		const userCache = new Map();

		for (const guild of discordClient.guilds.values()) {
			if (!guild.settings.get('enabled', false)) continue;

			for (const member of guild.members.values()) {
				if (member.user.bot) continue;

				const cached = userCache.has(member.id);
				const user = cached ? userCache.get(member.id) : await User.findOne({ discordId: member.id });
				if (!cached) userCache.set(member.id, user);

				const banRole = guild.settings.get('banRole');
				const memberRole = guild.settings.get('memberRole');
				if (banRole && member.roles.has(banRole)) {
					const bans = await Ban.findActiveBans(member, guild);

					if (bans.length === 0) {
						try {
							if (member.roles.has(banRole)) await member.removeRole(banRole);
							if (!member.roles.has(memberRole) && user.facepunchId) await member.addRole(memberRole);
						} catch (e) {
							if (e.name === 'DiscordAPIError') {
								logger.warn(`Could not update ${member.user.username}#${member.user.discriminator} (${member.id})'s roles, ${e.message}.`);
							} else {
								logger.error(e);
							}
						}
					}
				}

				const joinedTimestamp = member.joinedTimestamp / 1000;
				const maxIdleTime = guild.settings.get('maxIdleTime', config.get('maxIdleTime'));

				if (maxIdleTime === 0) continue;

				if ((!user || !user.facepunchId) && !member.roles.has(guild.settings.get('guestRole')) && util.currentTimestamp() > joinedTimestamp + maxIdleTime)
					await util.kick(member, 'You took too long to authenticate!');
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

util.log = function log(guild, message, level = 'info') {
	const logChannel = guild.channels.get(guild.settings.get('logChannel'));
	const moderatorChannel = guild.channels.get(guild.settings.get('moderatorChannel'));

	logger.log(level, `${message} In ${guild.name} (${guild.id})`);

	if (logChannel) return logChannel.sendMessage(message);
	if (moderatorChannel) return moderatorChannel.sendMessage(message);
	return Promise.resolve(false);
};

util.getMasterGuilds = function getMasterGuilds(discordClient) {
	let masterGuilds = [];
	for (const guild of discordClient.guilds) {
		if (guild.settings.get('master', false)) masterGuilds.push(guild);
	}
	return masterGuilds;
};

util.propertyArray = function propertyArray(arr, property) {
	let output = [];
	for (const item of arr) {
		output.push(item[property]);
	}
	return output;
};
