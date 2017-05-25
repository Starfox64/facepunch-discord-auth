const Commando = require('discord.js-commando');

module.exports = class Error extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'error',
			group: 'root',
			memberName: 'error',
			description: 'Throws an error.',
			examples: ['error']
		});
	}

	hasPermission(message) {
		return this.client.isOwner(message.author);
	}

	async run() {
		throw new Error('Exception triggered by the error command.');
	}
};
