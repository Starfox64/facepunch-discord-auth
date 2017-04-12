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
		const userData = User.findOne({ discordId: user.id });
		const toUnBan = [user.id];

		if (userData && userData.facepunchId) {
			const alts = User.find({ facepunchId: userData.facepunchId, discordId: { $not: user.id } });

			for (const alt of alts) {
				toUnBan.push(alt.discordId);
			}
		}

		await Ban.remove({ user: { $in: toUnBan }, guild: guild.id, $where: 'this.duration === 0 || this.createdAt + this.duration * 1000 > new Date()' });

		await util.log(guild, `${user.username}#${user.discriminator} (<@${user.id}>) was unbanned by ${moderator.user.username}#${moderator.user.discriminator} (<@${moderator.id}>).`);

		return message.reply(`Unbanned ${user.username}.`);
	}
};
