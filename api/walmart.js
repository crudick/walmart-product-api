const _ = require('lodash');

// Import helper functions
const {
	compose,
	composeAsync,
	extractNumber,
	enforceHttpsUrl,
	fetchHtmlFromUrl,
	extractFromElems,
	fromPairsToObject,
	fetchElemInnerText,
	fetchElemAttribute,
	extractUrlAttribute
} = require("./helpers");

// walmart.com (Base URL)
const BASE_URL = "https://www.walmart.com";

///////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

/**
 * Resolves the url as relative to the base scotch url
 * and returns the full URL
 */
const scotchRelativeUrl = url =>
	_.isString(url) ? `${BASE_URL}${url.replace(/^\/*?/, "/")}` : null;

/**
 * Extract a single post from container element
 */
const extractCustomerConsideration = elem => {

	const itemLink = elem.find('a.tile-link-overlay');
	const name = elem.find('div.TempoItemTile-Title');
	const image = elem.find('img');
	return {
		name: fetchElemInnerText(name),
		href: extractUrlAttribute('href')(itemLink),
		imageUrl: extractUrlAttribute('src')(image)
	};
};


/**
 * Extract profile from a Scotch author's page using the Cheerio parser instance
 * and returns the author profile object
 */
const extractProductDetails = $ => {
	console.log('extracting product details');
	const productName = $('h1[itemprop="name"]');
	const price = $('span[itemprop="price"]').attr('content');
	// fulfillment section
	const fulfillmentBox = $('div.fulfillment-buy-box-update');
	const dotcomFulfillment = fulfillmentBox.find('.prod-fulfillment div:nth-child(1)').find('.fulfillment-shipping-text');
	const storeFulfillment = fulfillmentBox.find('.prod-fulfillment div:nth-child(2)').find('div.fulfillment-text');

	const aboutItem = $('div.AboutThisItem').html();

	const extractConsiderations = extractFromElems(extractCustomerConsideration)();
	const customerConsiderationList = $('div[data-tl-id="contentZoneMiddle3-DefaultItemCarousel-PersonalizationModule"] > ul');
	const considerations = customerConsiderationList.find("li");
	
	console.log('we have details');
	return Promise.all([
		fetchElemInnerText(productName),
		price,
		fetchElemInnerText(dotcomFulfillment),
		fetchElemInnerText(storeFulfillment),
		aboutItem,
		extractConsiderations(considerations)($)
	]).then(([ name, price, deliveryStatus, pickupStatus, aboutHtml, considerations ]) => ({ name, price, deliveryStatus, pickupStatus, aboutHtml, considerations }));

};


/**
 * Fetches the product details
 */
const fetchProductDetails = (id, location) => {
	const PRODUCT_URL = `${BASE_URL}/ip/${id}`;
	let query = {
		url: PRODUCT_URL,
		location: location
	};
	return composeAsync(extractProductDetails, fetchHtmlFromUrl)(query);
};


module.exports = { fetchProductDetails };