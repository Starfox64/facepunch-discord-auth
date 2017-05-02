const Commando = require('discord.js-commando');

module.exports = class FPSetMaster extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetmaster',
			group: 'root',
			memberName: 'fpsetmaster',
			description: 'Sets the master status of the current guild.',
			examples: ['fpsetmaster true'],
			guildOnly: true,
			args: [
				{
					key: 'enabled',
					label: 'Boolean',
					prompt: 'Is this a master guild?',
					type: 'boolean',
					wait: 30
				}
			]
		});
	}

	hasPermission(message) {
		return this.client.isOwner(message.author);
	}

	async run(message, args) {
		await message.guild.settings.set('master', args.enabled);
		if (args.enabled) return message.reply('This guild is now a master guild.');
		return message.reply('This guild is no longer a master guild.');
	}
};
