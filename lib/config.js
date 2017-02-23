'use strict';

const convict = require('convict');

const config = convict({
	discord: {
		token: {
			doc: 'Discord Bot Token',
			format: String,
			default: null,
			env: 'FPAUTH_DISCORD_TOKEN'
		},
		guild: {
			doc: 'Discord Guild ID',
			format: String,
			default: null,
			env: 'FPAUTH_GUILD'
		},
		welcomeChannel: {
			doc: 'Discord welcome channel ID',
			format: String,
			default: null,
			env: 'FPAUTH_WELCOME_CHANNEL'
		},
		moderatorChannel: {
			doc: 'Discord moderator channel ID',
			format: String,
			default: null,
			env: 'FPAUTH_MOD_CHANNEL'
		}
	},
	roles: {
		member: {
			doc: 'Discord Role ID that will be given to members',
			format: String,
			default: null,
			env: 'FPAUTH_MEMBER_ROLE'
		},
		goldMember: {
			doc: 'Discord Role ID that will be given to gold members',
			format: String,
			default: null,
			env: 'FPAUTH_GOLDMEMBER_ROLE'
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
	mongoUrl: {
		doc: 'The Mongo connection URL',
		format: String,
		default: 'mongodb://localhost:27017/fpauth',
		env: 'FPAUTH_MONGO_URL'
	}
});

config.validate();

module.exports = config;
