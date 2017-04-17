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
			examples: ['fpban @Postal 1d "loss"'],
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
					key: 'duration',
					label: 'Duration (0h=perm)',
					prompt: 'For how many minutes (0h is perm)?',
					type: 'duration',
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
		const duration = args.duration;
		const reason = args.reason;
		const userData = await User.findOne({ discordId: user.id });
		const toBan = [user.id];

		const banRole = guild.settings.get('banRole');
		const memberRole = guild.settings.get('memberRole');

		if (message.channel.members.has(user.id) && !this.client.isOwner(message.member.user))
			return message.reply('You cannot ban a member of the moderator channel.');

		if (!guild.roles.has(guild.settings.get('banRole')))
			return message.reply('The server does not have a ban role, see fpsetbanrole.');

		if (userData && userData.facepunchId) {
			const alts = await User.find({ facepunchId: userData.facepunchId, discordId: { $ne: user.id } });

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
				duration
			});

			if (guild.members.has(id)) {
				const member = guild.members.get(id);

				try {
					if (duration === 0) {
						await util.kick(member, ban.formatReason(), true);
					} else {
						await member.sendMessage(ban.formatReason());
						if (!member.roles.has(banRole)) await member.addRole(banRole);
						if (member.roles.has(memberRole)) await member.removeRole(memberRole);
					}
				} catch (e) {
					if (e.status == 403) {
						await message.reply('Could not assign the banned role, permission denied.');
					} else {
						logger.error(e);
					}

					return await ban.remove();
				}

				const durationText = ban.duration === 0 ? 'permanently' : ban.duration / 60 + ' minutes';
				await util.log(guild, `**BAN**: ${member.user.username}#${member.user.discriminator} (<@${member.id}>) was banned by ${moderator.user.username}#${moderator.user.discriminator} (<@${moderator.id}>) ${durationText} for "${reason}".`);
			}
		}

		return message.reply(`Banned ${user.username}.`);
	}
};
