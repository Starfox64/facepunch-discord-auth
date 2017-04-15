const Commando = require('discord.js-commando');

module.exports = class DurationArgumentType extends Commando.ArgumentType {
	constructor(client) {
		super(client, 'duration');
		this.regex = /^(\d+)([hdmy])$/;
		this.values = {
			h: 60 * 60,
			d: 60 * 60 * 24,
			m: 60 * 60 * 24 * 31,
			y: 60 * 60 * 24 * 365
		};
	}

	validate(value) {
		const matches = this.regex.exec(value);
		return matches && !isNaN(Number(matches[1]));
	}

	parse(value) {
		const matches = this.regex.exec(value);
		if (!matches) throw new TypeError('Invalid duration');

		const amount = Number(matches[1]);
		if (isNaN(amount)) throw new TypeError('Invalid number');

		return amount * this.values[matches[2]];
	}
};
