const Commando = require('discord.js-commando');
const Ban = require('../../models/ban');
const User = require('../../models/user');
const util = require('../../lib/util');

module.exports = class FPGlobalBan extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpglobalban',
			group: 'admin',
			memberName: 'fpglobalban',
			description: 'Bans a user and all of his alt discord accounts permanently.',
			examples: ['fpglobalban @Postal "loss"'],
			guildOnly: true,
			args: [
				{
					key: 'user',
					label: 'User',
					prompt: 'Which user do you want to ban?',
					type: 'user',
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
		//return util.isInModeratorChannel(message) && message.guild.settings.get('master', false);
		return false;
	}

	async run(message, args) {
		const guild = message.guild;
		const moderator = message.member;
		const user = args.user;
		const reason = args.reason;
		const userData = await User.findOne({ discordId: user.id });
		const toBan = [user.id];

		if (message.channel.members.has(user.id) && !this.client.isOwner(message.member.user))
			return message.reply('You cannot ban a member of the moderator channel.');

		if (userData && userData.facepunchId) {
			const alts = await User.find({ facepunchId: userData.facepunchId, discordId: { $ne: user.id } });

			for (const alt of alts) {
				toBan.push(alt.discordId);
			}
		}

		for (const id of toBan) {
			const ban = await Ban.create({
				user: id,
				moderator: moderator.id,
				guild: guild.id,
				reason,
				duration: 0,
				global: true
			});

			for (const subscribedGuild of message.client.guilds.values()) {
				if (subscribedGuild.settings.get('banSubscriptionMode', 0) === 0 && !subscribedGuild.settings.get('master', false)) continue;

				if (subscribedGuild.members.has(id)) {
					const member = subscribedGuild.members.get(id);

					await util.kick(member, ban.formatReason(), true);

					await util.log(subscribedGuild, `**GBAN**: ${member.user.username}#${member.user.discriminator} (<@${member.id}>) was globally banned by ${moderator.user.username}#${moderator.user.discriminator} (<@${moderator.id}>) for "${reason}".`);
				}
			}
		}

		return message.reply(`Globally banned ${user.username}.`);
	}
};
