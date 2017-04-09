const Commando = require('discord.js-commando');

module.exports = class FPSetRegistrar extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetregistrar',
			group: 'root',
			memberName: 'fpsetregistrar',
			description: 'Sets the registrar status of the current guild.',
			examples: ['fpsetregistrar true'],
			guildOnly: true,
			args: [
				{
					key: 'enabled',
					label: 'Boolean',
					prompt: 'Is this a registrar guild?',
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
		await message.guild.settings.set('registrar', args.enabled);
		if (args.enabled) return message.reply('This guild is now a registrar.');
		return message.reply('This guild is no longer a registrar.');
	}
};
