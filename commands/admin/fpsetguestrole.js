const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPSetGuestRole extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetguestrole',
			group: 'admin',
			memberName: 'fpsetguestrole',
			description: 'When set, members with this role will not be kicked for not authenticating.',
			examples: ['fpsetguestrole @Guest'],
			guildOnly: true,
			args: [
				{
					key: 'role',
					label: 'Guest role',
					prompt: 'Which role should be ignored?',
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
		await message.guild.settings.set('guestRole', args.role.id);
		return message.reply(`The guest role was set to **${args.role.name}**.`);
	}
};
