const Commando = require('discord.js-commando');
const User = require('../../models/user');
const util = require('../../lib/util');

module.exports = class FPAssign extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpassign',
			group: 'admin',
			memberName: 'fpassign',
			description: 'Sets all FP roles and nicknames for everyone.',
			examples: ['fpassign'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message) {
		const user = message.member.user;

		await message.reply('Setting roles and nicknames...');

		for (const member of message.guild.members.values()) {
			const user = await User.findOne({ discordId: member.id });
			if (user) await util.updateDiscord(member, user);
		}

		await util.log(message.guild, `${user.username}#${user.discriminator} (<@${user.id}>) used fpassign.`);
		return message.reply('Done!');
	}
};
