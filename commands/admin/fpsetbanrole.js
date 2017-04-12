const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPSetBanRole extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetbanrole',
			group: 'admin',
			memberName: 'fpsetbanrole',
			description: 'Sets the role that will be applied to banned members.',
			examples: ['fpsetbanrole @Banned'],
			guildOnly: true,
			args: [
				{
					key: 'role',
					label: 'Banned role',
					prompt: 'Which role should be applied to banned members?',
					type: 'role',
					wait: 30
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message, args) {
		await message.guild.settings.set('banRole', args.role.id);
		return message.reply(`The ban role was set to **${args.role.name}**.`);
	}
};
