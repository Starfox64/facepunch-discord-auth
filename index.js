'use strict';

const Commando = require('discord.js-commando');
const MongooseProvider = require('./lib/mongoose-provider');
const Guild = require('./models/guild');
const Ban = require('./models/ban');
const User = require('./models/user');
const logger = require('./lib/logger');
const config = require('./lib/config');
const util = require('./lib/util');
const path = require('path');

let discordClient = new Commando.Client({
	unknownCommandResponse: false,
	fetchAllMembers: true,
	disabledEvents: ['TYPING_START', 'VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE', 'CHANNEL_PINS_UPDATE'],
	owner: config.get('discord.owner')
});

discordClient.setProvider(new MongooseProvider(Guild));

discordClient.registry.registerGroups([
	['root', 'root', true],
	['admin', 'Admin'],
	['user', 'User']
])
	.registerDefaultTypes()
	.registerDefaultGroups()
	.registerTypesIn(path.join(__dirname, 'types'))
	.registerDefaultCommands({help: true, prefix: true, eval_: false, ping: false, commandState: false})
	.registerCommandsIn(path.join(__dirname, 'commands'));

discordClient.on('ready', async () => {
	for (const guild of discordClient.guilds.values()) {
		if (!guild.settings.get('enabled', false)) continue;
		const entryRoom = util.getGuildEntryRoom(guild);

		for (const member of guild.members.values()) {
			if (member.user.bot) continue;

			const banRole = guild.settings.get('banRole');
			const memberRole = guild.settings.get('memberRole');
			if (banRole && !member.roles.has(banRole)) {
				const bans = await Ban.findActiveBans(member, guild);

				if (bans.length > 0) {
					const ban = bans[0];
					try {
						if (ban.duration === 0) {
							await util.kick(member, ban.formatReason(), true);
						} else {
							await member.sendMessage(ban.formatReason());
							if (!member.roles.has(banRole)) await member.addRole(banRole);
							if (member.roles.has(memberRole)) await member.removeRole(memberRole);
						}
					} catch (e) {
						if (e.status == 403) {
							logger.warn(`Could not add the ban role to ${member.user.username}#${member.user.discriminator} (${member.id}), permission denied.`);
						} else {
							logger.error(e);
						}
					}
				}
			}

			if (!(await User.findOne({ discordId: member.id }))) {
				if (!guild.settings.get('registrar', false)) {
					//await util.sendRedirectMessage(entryRoom, member.user);
					continue;
				}

				const user = await util.handleNewUser(member.id, true);
				//await util.sendWelcomeMessage(entryRoom, member.user, user.token);
			}
		}
	}
});

discordClient.on('guildMemberAdd', async (member) => {
	if (member.user.bot) return;

	await util.log(member.guild, `**JOIN**: ${member.user.username}#${member.user.discriminator} (<@${member.id}>) joined.`);

	if (!member.guild.settings.get('enabled', false)) return;

	const banRole = member.guild.settings.get('banRole');
	if (banRole && !member.roles.has(banRole)) {
		const bans = await Ban.findActiveBans(member, member.guild);

		if (bans.length > 0) {
			try {
				await member.addRole(banRole);
			} catch (e) {
				if (e.status == 403) {
					logger.warn(`Could not add the ban role to ${member.user.username}#${member.user.discriminator} (${member.id}), permission denied.`);
				} else {
					logger.error(e);
				}
			}
		}
	}

	let user = await User.findOne({ discordId: member.id });
	if (!user || !user.facepunchId) {
		const entryRoom = util.getGuildEntryRoom(member.guild);

		if (!member.guild.settings.get('registrar', false)) {
			await util.sendRedirectMessage(entryRoom, member.user);
			return;
		}

		if (!user) user = await util.handleNewUser(member.id, true);
		return await util.sendWelcomeMessage(util.getGuildEntryRoom(member.guild), member.user, user.token);
	}

	await util.updateDiscord(member, user);
});

discordClient.on('guildMemberRemove', async (member) => {
	if (member.user.bot) return;
	await util.log(member.guild, `**LEAVE**: ${member.user.username}#${member.user.discriminator} (<@${member.id}>) left.`);
});

discordClient.on('guildMemberUpdate', async (oldMember, newMember) => {
	if (!oldMember.user.bot && oldMember.nickname !== newMember.nickname) {
		await util.log(oldMember.guild, `**NICK**: ${oldMember.user.username}#${oldMember.user.discriminator} (<@${oldMember.id}>) changed their nickname from **${oldMember.nickname}** to **${newMember.nickname}**.`);

		const aliases = [];
		if (oldMember.nickname) aliases.push(oldMember.nickname);
		if (newMember.nickname) aliases.push(newMember.nickname);
		await User.update({ discordId: oldMember.id }, { $addToSet: { aliases: { $each: aliases } } });
	}
});

discordClient.on('guildCreate', async (guild) => {
	logger.info(`Guild ${guild.name} (${guild.id}) added.`);
});

discordClient.on('error', logger.error);
discordClient.on('warn', logger.warn);
discordClient.on('debug', logger.debug);

discordClient.on('disconnect', (closeEvent) => {
	logger.warn('Disconnected!', { closeEvent });
});

discordClient.on('reconnecting', () => {
	logger.warn('Reconnecting...');
});

discordClient.on('commandError', (cmd, err) => {
	if (err instanceof Commando.FriendlyError) return;
	logger.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
});

discordClient.on('message', (message) => {
	logger.debug(`${message.author.username}#${message.author.discriminator} (${message.author.id}) posted a message.`);
});

discordClient.login(config.get('discord.token'));

let cleanupIntervalHandle = setInterval(util.getCleanupLoop(discordClient), config.get('cleanupInterval') * 1000);

// Treats unhandled errors in async code as regular errors.
process.on('unhandledRejection', (err) => {
	logger.debug('The following error was thrown from an unhandledRejection event.');
	logger.error(err, { error: err }); //We add the error in the metadata so that it is inspected.
	process.exit(1);
});

process.on('SIGTERM', async () => {
	clearInterval(cleanupIntervalHandle);
	logger.debug('Destroying discord client...');
	await discordClient.destroy();
	logger.debug('Discord client destroyed.');
});
