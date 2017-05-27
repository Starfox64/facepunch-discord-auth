'use strict';

const Commando = require('discord.js-commando');
const Ban = require('../../models/ban');
const logger = require('../../lib/logger');

module.exports = class DebugBans extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'debugbans',
			group: 'root',
			memberName: 'debugbans',
			description: '...',
			examples: ['debugbans @Postal'],
			args: [
				{
					key: 'user',
					label: 'User',
					prompt: 'Which user\'s bans do you want to see?',
					type: 'user',
					wait: 30
				}
			]
		});
	}

	hasPermission(message) {
		return this.client.isOwner(message.author);
	}

	async run(message, args) {
		const guild = message.guild;
		const user = args.user;

		logger.debug(await Ban.findActiveBans(user, guild));
	}
};
