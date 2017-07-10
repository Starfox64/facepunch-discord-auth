'use strict';

const request = require('./request');
const logger = require('./logger');
const cheerio = require('cheerio');
const moment = require('moment-timezone');

const FP_PROFILE_URL = 'https://facepunch.com/member.php?u=';
const FP_MOD_COLORS = ['#00aa00', 'rgb(0, 112, 255)'];

module.exports = async function fetchProfile(facepunchId) {
	logger.debug(`Fetching ${facepunchId}'s profile.`);
	let html = await request(FP_PROFILE_URL + facepunchId);

	if (!html) return {ok: false};

	let $ = cheerio.load(html);

	let token = $('#view-aboutme dt:contains(Flickr username:) + dd').text();
	token = token.length > 0 ? token : null;

	let postCount = Number($('.member_blockrow dt:contains(Total Posts) + dd').text().replace(/[^0-9 | ^.]/g, ''));
	let joinDate = moment($('.member_blockrow dt:contains(Join Date) + dd').text(), 'Do MMM YYYY');
	let isBanned = $('#userinfo span > font').attr('color') === 'red';

	let isGoldMember, isModerator = false;
	if (!isBanned) {
		isGoldMember = $('#userinfo strong > font').attr('color') === '#A06000';
		if (!isGoldMember) isModerator = FP_MOD_COLORS.includes($('#userinfo > span > span[style]').css('color'));
	}

	let username = $('#userinfo > span:first-child').text();

	return {
		ok: true,
		token,
		postCount,
		isBanned,
		isGoldMember,
		isModerator,
		username,
		joinDate,
		facepunchId: Number(facepunchId)
	};
};
