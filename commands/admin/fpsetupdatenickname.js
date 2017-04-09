const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPSetUpdateNickname extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetupdatenickname',
			group: 'admin',
			memberName: 'fpsetupdatenickname',
			description: 'Sets whether members\' nicknames should match their Facepunch usernames.',
			examples: ['fpsetupdatenickname true'],
			guildOnly: true,
			args: [
				{
					key: 'updateNickname',
					label: 'Boolean',
					prompt: 'Do you want to update nicknames?',
					type: 'boolean',
					wait: 30
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message, args) {
		await message.guild.settings.set('updateNickname', args.updateNickname);

		if (args.updateNickname) return message.reply('Nicknames will now be updated.');
		return message.reply('Nicknames will no longer be updated.');
	}
};
