const Commando = require('discord.js-commando');
const Ban = require('../../models/ban');
const User = require('../../models/user');
const util = require('../../lib/util');
const logger = require('../../lib/logger');

module.exports = class FPBan extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpban',
			group: 'admin',
			memberName: 'fpban',
			description: 'Bans a user and all of his alt discord accounts.',
			examples: ['fpban @Postal 1440 "loss"'],
			guildOnly: true,
			args: [
				{
					key: 'user',
					label: 'User',
					prompt: 'Which user do you want to ban?',
					type: 'user',
					wait: 30
				},
				{
					key: 'minutes',
					label: 'Minutes (0=perm)',
					prompt: 'For how many minutes (0 is perm)?',
					type: 'integer',
					min: 0,
					default: 0,
					wait: 30
				},
				{
					key: 'reason',
					label: 'Reason',
					prompt: 'Why?',
					type: 'string',
					default: 'N/A',
					wait: 60
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message, args) {
		const guild = message.guild;
		const moderator = message.member;
		const user = args.user;
		const minutes = args.minutes;
		const reason = args.reason;
		const userData = User.findOne({ discordId: user.id });
		const toBan = [user.id];

		if (message.channel.members.has(user.id) && !this.client.isOwner(message.member.user))
			return message.reply('You cannot ban a member of the moderator channel.');

		if (!guild.roles.has(guild.settings.get('banRole')))
			return message.reply('The server does not have a ban role, see fpsetbanrole.');

		if (userData && userData.facepunchId) {
			const alts = User.find({ facepunchId: userData.facepunchId, discordId: { $not: user.id } });

			for (const alt of alts) {
				toBan.push(alt.discordId);
			}
		}

		for (const id of toBan) {
			const ban = await Ban.create({
				user: id,
				moderator: moderator.id,
				guild: guild.id,
				reason,
				duration: minutes * 60
			});

			if (guild.members.has(id)) {
				const member = guild.members.get(id);
				await member.sendMessage(ban.formatReason());

				try {
					await member.addRole(guild.settings.get('banRole'));
				} catch (e) {
					if (e.status == 403) {
						await message.reply('Could not assign the banned role, permission denied.');
					} else {
						logger.error(e);
					}

					return await ban.remove();
				}

				const duration = ban.duration === 0 ? 'permanently' : ban.duration / 60 + ' minutes';
				await util.log(guild, `${member.username}#${member.discriminator} (<@${member.id}>) was banned by ${moderator.user.username}#${moderator.user.discriminator} (<@${moderator.id}>) ${duration} for "${reason}".`);
			}
		}

		return message.reply(`Banned ${user.username}.`);
	}
};
