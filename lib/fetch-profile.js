'use strict';

const request = require('./request');
const cheerio = require('cheerio');

const FP_PROFILE_URL = 'https://facepunch.com/member.php?u=';
const FP_MOD_COLORS = ['#00aa00', 'rgb(0, 112, 255'];

module.exports = async function fetchProfile(facepunchId) {
	let html = await request(FP_PROFILE_URL + facepunchId);

	if (!html) return {ok: false};

	let $ = cheerio.load(html);

	let token = $('#view-aboutme dt:contains(Flickr username:) + dd').text();
	token = token.length > 0 ? token : null;

	let postCount = Number($('.member_blockrow dt:contains(Total Posts) + dd').text().replace(/[^0-9 | ^.]/g, ''));
	let isGoldMember = $('#userinfo strong > font').attr('color') === '#A06000';
	let isModerator = FP_MOD_COLORS.includes($('#userinfo > span > span[style]').css('color'));
	let username = $('#userinfo > span:first-child').text();

	return {
		ok: true,
		token,
		postCount,
		isGoldMember,
		isModerator,
		username
	};
};
