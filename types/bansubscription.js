const Commando = require('discord.js-commando');
const constants = require('../lib/constants');

module.exports = class BanSubscriptionArgumentType extends Commando.ArgumentType {
	constructor(client) {
		super(client, 'bansubscription');
	}

	validate(value) {
		return constants.BAN_SUBSCRIPTION_TYPES.includes(value.toUpperCase());
	}

	parse(value) {
		value = value.toUpperCase();

		if (!constants.BAN_SUBSCRIPTION_TYPES.includes(value))
			throw new TypeError('Invalid Ban Subscription Type');

		return value;
	}
};
