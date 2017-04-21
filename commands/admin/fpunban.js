const Commando = require('discord.js-commando');
const Ban = require('../../models/ban');
const User = require('../../models/user');
const util = require('../../lib/util');
const logger = require('../../lib/logger');

module.exports = class FPUnBan extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpunban',
			group: 'admin',
			memberName: 'fpunban',
			description: 'Removes all active bans from a user and all of his alt discord accounts.',
			examples: ['fpunban @Postal'],
			guildOnly: true,
			args: [
				{
					key: 'user',
					label: 'User',
					prompt: 'Which user do you want to ban?',
					type: 'user',
					wait: 30
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
		const userData = await User.findOne({ discordId: user.id });
		const toUnBanId = [user.id];
		const toUnBan = [userData];

		if (userData && userData.facepunchId) {
			const alts = await User.find({ facepunchId: userData.facepunchId, discordId: { $ne: user.id } });

			for (const alt of alts) {
				toUnBanId.push(alt.discordId);
				toUnBan.push(alt);
			}
		}

		await Ban.remove({ user: { $in: toUnBanId }, guild: guild.id, $where: 'this.duration === 0 || this.createdAt + this.duration * 1000 > new Date()' });

		const banRole = guild.settings.get('banRole');
		const memberRole = guild.settings.get('memberRole');
		const guildBans = await guild.fetchBans();

		for (const data of toUnBan) {
			if (guildBans.has(data.discordId)) {
				await guild.unban(data.discordId);
			}

			if (guild.members.has(data.discordId)) {
				const member = guild.members.get(data.discordId);

				try {
					if (member.roles.has(banRole)) await member.removeRole(banRole);
					if (!member.roles.has(memberRole) && data.facepunchId) await member.addRole(memberRole);
				} catch (e) {
					if (e.status == 403) {
						await message.reply('Could not remove the banned role, permission denied.');
					} else {
						logger.error(e);
					}
				}
			}
		}

		await util.log(guild, `**UNBAN**: ${user.username}#${user.discriminator} (<@${user.id}>) was unbanned by ${moderator.user.username}#${moderator.user.discriminator} (<@${moderator.id}>).`);

		return message.reply(`Unbanned ${user.username}.`);
	}
};
