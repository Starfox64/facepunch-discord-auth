const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPQBan extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpqban',
			group: 'admin',
			memberName: 'fpqban',
			description: 'Bans a user and all of his alt discord accounts according to a QBan preset.',
			examples: ['fpqban @Postal rust'],
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
					key: 'preset',
					label: 'QBan preset',
					prompt: 'What preset do you want to apply?',
					type: 'string',
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
		const preset = guild.settings.get('qbanPreset', {})[args.preset];

		if (!preset) return message.reply(`QBan preset **${args.preset}** does not exist.`);

		args.duration = preset[0];
		args.reason = preset[1];

		const banCommand = this.client.registry.commands.get('fpban');
		return banCommand.run(message, args);
	}
};
