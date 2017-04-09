const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPSetModeratorRole extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetmoderatorrole',
			group: 'admin',
			memberName: 'fpsetmoderatorrole',
			description: 'Sets the role that will be applied to moderators.',
			examples: ['fpsetmoderatorrole #Moderator'],
			guildOnly: true,
			args: [
				{
					key: 'role',
					label: 'Moderators role',
					prompt: 'Which role should be applied to moderators?',
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
		await message.guild.settings.set('moderatorRole', args.role.id);
		return message.reply(`The moderator role was set to ${args.role.name}.`);
	}
};
