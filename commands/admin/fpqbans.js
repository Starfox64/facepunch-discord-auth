const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPQBans extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpqbans',
			group: 'admin',
			memberName: 'fpqbans',
			description: 'Lists all QBans presets.',
			examples: ['fpqbans'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message) {
		const guild = message.guild;
		const presets = guild.settings.get('qbanPreset', {});
		const presetKeys = Object.keys(presets);

		if (!presetKeys.length) return message.reply('There aren\'t any QBan presets.');

		let reply = 'QBans reasons:';
		for (const name of presetKeys) {
			const [duration, reason] = presets[name];
			const durationText = duration === 0 ? 'permanent' : duration / 60 + ' minutes';
			reply += `\n- **${name}**: ${durationText} "*${reason}*"`;
		}

		return message.reply(reply);
	}
};
