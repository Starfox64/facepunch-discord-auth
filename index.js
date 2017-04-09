'use strict';

const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const MongooseProvider = require('./lib/mongoose-provider');
const Guild = require('./models/guild');
const User = require('./models/user');
const Event = require('./models/event');
const fetchProfile = require('./lib/fetch-profile');
const logger = require('./lib/logger');
const config = require('./lib/config');
const util = require('./lib/util');
const path = require('path');

let discordClient = new Commando.Client({
	unknownCommandResponse: false,
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
	.registerDefaultCommands({help: true})
	.registerCommandsIn(path.join(__dirname, 'commands'));

discordClient.on('ready', async () => {
	discordClient.user.setPresence(new Discord.Presence({
		status: 'online',
		game: new Discord.Game({
			name: 'with postal\'s ass'
		})
	}));

	//TODO: Handle non registrar

	for (let guild of discordClient.guilds.values()) {
		if (!guild.settings.get('registrar', false)) continue;

		const entryRoom = await util.getGuildEntryRoom(guild);
		guild = await guild.fetchMembers();

		for (const member of guild.members.values()) {
			if (!member.user.bot && !(await User.findOne({ discordId: member.id }))) {
				const user = await util.handleNewUser(member.id, true);
				await util.sendWelcomeMessage(entryRoom, member.user, user.token);
			}
		}
	}
});

discordClient.on('guildMemberAdd', async (member) => {
	if (member.user.bot) return;

	logger.info(`${member.user.username}#${member.user.discriminator} (${member.id}) joined ${member.guild.name} (${member.guild.id}).`);
	await Event.create({ type: 'join', metadata: {user: member.id, guild: member.guild.id} });

	//TODO: Handle non registrar

	const user = await util.handleNewUser(member.id);

	if (!user.facepunchId)
		return await util.sendWelcomeMessage(await util.getGuildEntryRoom(member.guild), member.user, user.token);

	try {
		var profileData = await fetchProfile(user.facepunchId);
	} catch (e) {
		return logger.error(e);
	}

	await user.updateFromProfileData(profileData);
	await util.updateDiscord(member, user);
});

discordClient.on('guildMemberRemove', async (member) => {
	if (member.user.bot) return;

	logger.info(`${member.user.username}#${member.user.discriminator} (${member.id}) left ${member.guild.name} (${member.guild.id}).`);
	await Event.create({ type: 'leave', metadata: { user: member.id, guild: member.guild.id } });
});

discordClient.on('guildBanAdd', async (guild, user) => {
	logger.info(`${user.username}#${user.discriminator} (${user.id}) was banned from ${guild.name} (${guild.id}).`);
	await Event.create({ type: 'ban', metadata: { user: user.id, guild: guild.id } });
});

discordClient.on('guildBanRemove', async (guild, user) => {
	logger.info(`${user.username}#${user.discriminator} (${user.id}) was unbanned from ${guild.name} (${guild.id}).`);
	await Event.create({ type: 'unban', metadata: { user: user.id, guild: guild.id } });
});

discordClient.on('guildCreate', async (guild) => {
	logger.info(`Guild ${guild.name} (${guild.id}) added.`);
});

discordClient.login(config.get('discord.token'));

//let cleanupIntervalHandle = setInterval(util.getCleanupLoop(discordClient), config.get('cleanupInterval') * 1000);

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
