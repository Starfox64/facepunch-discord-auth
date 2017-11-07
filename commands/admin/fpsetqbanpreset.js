const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPQBanPreset extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpqbanpreset',
			group: 'admin',
			memberName: 'fpqbanpreset',
			description: 'Creates a quick ban preset. Remove the duration & reason to delete the preset.',
			examples: [
				'fpqbanpreset rust 1d "Asking about rust"',
				'fpqbanpreset rust'
			],
			guildOnly: true,
			args: [
				{
					key: 'name',
					label: 'Name',
					prompt: 'What should be the name of this preset?',
					type: 'string',
					wait: 30
				},
				{
					key: 'duration',
					label: 'Duration (0h=perm)',
					prompt: 'For how many minutes (0h is perm)?',
					type: 'duration',
					default: -1,
					wait: 30
				},
				{
					key: 'reason',
					label: 'Reason',
					prompt: 'Why?',
					type: 'string',
					default: 'N/A',
					wait: 60
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message, args) {
		const guild = message.guild;
		const name = args.name;
		const duration = args.duration;
		const reason = args.reason;
		const presets = guild.settings.get('qbanPreset', {});

		if (duration == -1) {
			delete presets[name];
			await guild.settings.set('qbanPreset', presets);
			return message.reply(`QBan preset **${name}** was deleted.`);
		}

		presets[name] = [duration, reason];
		await guild.settings.set('qbanPreset', presets);
		return message.reply(`QBan preset **${name}** was created.`);
	}
};
