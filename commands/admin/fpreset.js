const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPReset extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpreset',
			group: 'admin',
			memberName: 'fpreset',
			description: 'Removes all FP roles and nicknames from everyone.',
			examples: ['fpreset'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message) {
		const user = message.member.user;
		const promises = [];

		await message.reply('Resseting roles and nicknames...');

		for (const member of message.guild.members.values()) {
			promises.push(util.resetDiscord(member));
		}

		await Promise.all(promises);

		await util.log(message.guild, `**RESET**: ${user.username}#${user.discriminator} (<@${user.id}>) used fpreset.`);
		return message.reply('Done!');
	}
};
