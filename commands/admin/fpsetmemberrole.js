const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPSetMemberRole extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetmemberrole',
			group: 'admin',
			memberName: 'fpsetmemberrole',
			description: 'Sets the role that will be applied to members.',
			examples: ['fpsetmemberrole #Member'],
			guildOnly: true,
			args: [
				{
					key: 'role',
					label: 'Member role',
					prompt: 'Which role should be applied to members?',
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
		await message.guild.settings.set('memberRole', args.role.id);
		return message.reply(`The member role was set to ${args.role.name}.`);
	}
};
