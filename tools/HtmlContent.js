#!/usr/bin/env node

function sleep(ms) {
	ms = (ms) ? ms : 0;
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}



process.on('uncaughtException', (error) => {
	console.error(error);
	process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
	console.error(reason, p);
	process.exit(1);
});

const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');

// console.log(process.argv);

if (!process.argv[2]) {
	console.error('ERROR: no url arg\n');

	console.info('for example:\n');
	console.log('  docker run --shm-size 1G --rm -v /tmp:/screenshots \\');
	console.log('  alekzonder/puppeteer:latest screenshot \'https://www.google.com\'\n');
	process.exit(1);
}

var url = process.argv[2];

var now = new Date();

var dateStr = now.toISOString();

var width = 800;
var height = 600;


var delay = 0;

if (typeof process.argv[4] === 'string') {
	delay = parseInt(process.argv[4], 10);
}
var proxy_url = '';
if (typeof process.argv[5] === 'string') {
	proxy_url = process.argv[5];
}

var isMobile = false;


(async () => {


	const args_browser = [
		'--no-sandbox',
		'--disable-setuid-sandbox',
		'--ignore-certificate-errors',
		'--disable-blink-features=AutomationControlled',
	];
	if (proxy_url !== ''){
		const newProxyUrl = await proxyChain.anonymizeProxy(proxy_url);
		args_browser.push(`--proxy-server=${newProxyUrl}`)
	}

	const browser = await puppeteer.launch({
		args: args_browser,
		ignoreHTTPSErrors: true,
		headless: true
	});

	const page = await browser.newPage();
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

	await page.setViewport({
		width,
		height,
		isMobile
	});
	await page.evaluate(() => {
		Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
	});

	await page.goto(url, {waitUntil: 'networkidle2'});
	await sleep(delay);

	const content = await page.content();
	browser.close();

	console.log(
		JSON.stringify({
			date: dateStr,
			timestamp: Math.floor(now.getTime() / 1000),
			content
		})
	);
})();

