const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPSetGoldMemberRole extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetgoldmemberrole',
			group: 'admin',
			memberName: 'fpsetgoldmemberrole',
			description: 'Sets the role that will be applied to gold members.',
			examples: ['fpsetgoldmemberrole @Gold Member'],
			guildOnly: true,
			args: [
				{
					key: 'role',
					label: 'Gold Member role',
					prompt: 'Which role should be applied to gold members?',
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
		await message.guild.settings.set('goldMemberRole', args.role.id);
		return message.reply(`The gold member role was set to **${args.role.name}**.`);
	}
};
