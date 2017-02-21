'use strict';

const Discord = require('discord.js');
const cloudscraper = require('cloudscraper');
const bluebird = require('bluebird');
const cheerio = require('cheerio');
const uid = require('uid-safe');
const co = require('co');
const User = require('./user');

const authRegex = /^!fpauth \d+$/;
const facepunchProfileUrl = 'https://facepunch.com/member.php?u=';

function sendWelcomeMessage(member) {
	return co(function*() {
		let user = yield User.findOne({discordId: member.id});

		if (!user || !user.facepunchId) {
			let token;
			if (!user) {
				token = yield uid(32);

				yield User.create({
					token: token,
					discordId: member.id,
				});
			} else {
				token = user.token
			}

			let welcomeChannel = discordClient.guilds.get(process.env.FPAUTH_GUILD).channels.get(process.env.FPAUTH_WELCOME_CHANNEL);

			yield welcomeChannel.sendMessage(`Hello <@${member.id}>! You need to link your Facepunch account to use this server. To do so you need to edit your Facepunch profile (https://facepunch.com/profile.php?do=editprofile) and set your **Flickr username** to **${token}**
Once thats done we'll need your Facepunch ID, to get it go to your profile, and grab the number after *member.php?u=*
Once you have your Facepunch ID type it in this channel like so: **!fpauth *<Facepunch ID>***`);
		}
	});
}

function request(url) {
	return new Promise((resolve, reject) => {
		cloudscraper.get(url, (err, res, body) => {
			if (err) return reject(err);
			resolve(body);
		});
	});
}

let discordClient = new Discord.Client();

discordClient.on('ready', () => {
	co(function*() {
		let guild = discordClient.guilds.get(process.env.FPAUTH_GUILD);
		guild = yield guild.fetchMembers();

		for (let member of guild.members.values()) {
			if (!member.user.bot && !(yield User.findOne({discordId: member.id}))) {
				yield sendWelcomeMessage(member);
			}
		}
	}).catch(console.error);
});

discordClient.on('guildMemberAdd', (member) => {
	co(function*() {
		if (member.user.bot) return;
		yield sendWelcomeMessage(member);
	}).catch(console.error);
});

discordClient.on('message', (message) => {
	if (message.channel.id === process.env.FPAUTH_WELCOME_CHANNEL && authRegex.test(message.content)) {
		co(function*() {
			let member = message.member;
			let user = yield User.findOne({discordId: member.id});
			if (user && user.facepunchId) return;

			let facepunchId = message.content.substring(8);

			let welcomeChannel = discordClient.guilds.get(process.env.FPAUTH_GUILD).channels.get(process.env.FPAUTH_WELCOME_CHANNEL);

			try {
				var html = yield request(facepunchProfileUrl + facepunchId);
			} catch (e) {
				console.error(e);
				yield welcomeChannel.sendMessage('Sorry, something went wrong...');
				return;
			}

			let $ = cheerio.load(html);

			let token = $('#view-aboutme dt:contains(Flickr username:) + dd').text();

			if (token.length === 0) {
				yield welcomeChannel.sendMessage(`<@${member.id}> It seems you have not set your token. You should set your **Flickr username** to **${token}**`);
				return;
			}

			let verifiedUser = yield User.findOne({discordId: member.id, token: token});

			if (!verifiedUser) {
				yield welcomeChannel.sendMessage(`<@${member.id}> Your token does not match. You should set your **Flickr username** to **${token}**`);
				return;
			}

			verifiedUser.facepunchId = facepunchId;
			yield verifiedUser.save();

			//GIVE ROLES
			yield member.addRole(process.env.FPAUTH_MEMBER_ROLE);

			if ($('#userinfo strong > font').attr('color') === '#A06000') {
				yield member.addRole(process.env.FPAUTH_GOLDMEMBER_ROLE);
			}

			let username = $('#userinfo > span:first-child').text();
			yield member.setNickname(username);

			yield welcomeChannel.sendMessage(`Congratulation <@${member.id}>, your account is now linked!`);
		}).catch(console.error);
	}
});

discordClient.login(process.env.FPAUTH_DISCORD_TOKEN);

process.on('SIGTERM', () => {
	discordClient.destroy();
});
