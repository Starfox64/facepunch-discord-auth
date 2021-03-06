'use strict';

const convict = require('convict');

const config = convict({
	logLevel: {
		doc: 'The winston logging level',
		format: ['silly', 'debug', 'verbose', 'info', 'warn', 'error'],
		default: 'info',
		env: 'FPAUTH_LOG_LEVEL'
	},
	discord: {
		token: {
			doc: 'Discord Bot Token',
			format: String,
			default: null,
			env: 'FPAUTH_DISCORD_TOKEN'
		},
		owner: {
			doc: 'ID of the bot owner',
			format: String,
			default: '',
			env: 'FPAUTH_DISCORD_OWNER'
		}
	},
	updateNickname: {
		doc: 'Set users nicknames to their Facepunch username',
		format: Boolean,
		default: false,
		env: 'FPAUTH_UPDATE_NICK'
	},
	fetchCooldown: {
		doc: 'Amount of time in seconds befaure !fpauth can be entered again after a SUCCESSFUL auth',
		format: 'nat',
		default: 600, // 10 minutes
		env: 'FPAUTH_FETCH_COOLDOWN'
	},
	minPostCount: {
		doc: 'The minimum amount of posts required to auth an account',
		format: 'nat',
		default: 25,
		env: 'FPAUTH_MIN_POSTS'
	},
	minAge: {
		doc: 'The minimum account age required to auth an account (in seconds)',
		format: 'nat',
		default: 60 * 60 * 24 * 31, // 1 month
		env: 'FPAUTH_MIN_AGE'
	},
	maxIdleTime: {
		doc: 'The amount seconds that a user has to link his account otherwise he is kicked (0 to disable)',
		format: 'nat',
		default: 0,
		env: 'FPAUTH_MAX_IDLE_TIME'
	},
	cleanupInterval: {
		doc: 'The interval in seconds at which the bot checks if it should kick unauthed users',
		format: 'nat',
		default: 60,
		env: 'FPAUTH_CLEANUP_INTERVAL'
	},
	mongoUrl: {
		doc: 'The Mongo connection URL',
		format: String,
		default: 'mongodb://localhost:27017/fpauth',
		env: 'FPAUTH_MONGO_URL'
	},
	raven: {
		doc: 'The Sentry DSN URL',
		format: '*',
		default: null,
		env: 'FPAUTH_RAVEN'
	}
});

config.validate();

module.exports = config;
