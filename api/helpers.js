const _ = require('lodash');
const axios = require("axios");
const cheerio = require("cheerio");

const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');


///////////////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

/**
 * Compose function arguments starting from right to left
 * to an overall function and returns the overall function
 */
const compose = (...fns) => arg => {
	return _.flattenDeep(fns).reduceRight((current, fn) => {
		if (_.isFunction(fn)) return fn(current);
		throw new TypeError("compose() expects only functions as parameters.");
	}, arg);
};

/**
 * Compose async function arguments starting from right to left
 * to an overall async function and returns the overall async function
 */
const composeAsync = (...fns) => arg => {
	return _.flattenDeep(fns).reduceRight(async (current, fn) => {
		if (_.isFunction(fn)) return fn(await current);
		throw new TypeError("compose() expects only functions as parameters.");
	}, arg);
};

/**
 * Enforces the scheme of the URL is https
 * and returns the new URL
 */
const enforceHttpsUrl = url =>
	_.isString(url) ? url.replace(/^(https?:)?\/\//, "https://") : null;

/**
 * Strips number of all non-numeric characters
 * and returns the sanitized number
 */
const sanitizeNumber = number =>
	_.isString(number)
		? number.replace(/[^0-9-.]/g, "")
		: _.isNumber(number) ? number : null;

/**
 * Filters null values from array
 * and returns an array without nulls
 */
const withoutNulls = arr =>
	_.isArray(arr) ? arr.filter(val => !_.isNull(val)) : [];

/**
 * Transforms an array of ({ key: value }) pairs to an object
 * and returns the transformed object
 */
const arrayPairsToObject = arr =>
	arr.reduce((obj, pair) => ({ ...obj, ...pair }), {});

/**
 * A composed function that removes null values from array of ({ key: value }) pairs
 * and returns the transformed object of the array
 */
const fromPairsToObject = compose(arrayPairsToObject, withoutNulls);

/**
 * Handles the request(Promise) when it is fulfilled
 * and sends a JSON response to the HTTP response stream(res).
 */
const sendResponse = res => async request => {
	return await request
		.then(data => res.json({ status: "success", data }))
		.catch(({ status: code = 500 }) =>
			res.status(code).json({ status: "failure", code, message: code == 404 ? 'Not found.' : 'Request failed.' })
		);
};

/**
 * Loads the html string returned for the given URL
 * and sends a Cheerio parser instance of the loaded HTML
 */
const fetchHtmlFromUrlWithCookies = async (url,cookies) => {

	return await Axios.request({
		url: enforceHttpsUrl(url),
		method: "get",
		headers:{
			Cookie: cookies
		} 
   }).then(response => cheerio.load(response.data))
   .catch(error => {
	   error.status = (error.response && error.response.status) || 500;
	   throw error;
   });
};

/**
 * Loads the html string returned for the given URL
 * and sends a Cheerio parser instance of the loaded HTML
 */
const fetchHtmlFromUrl = async query => {
	let url = query.url;
	axiosCookieJarSupport(axios);
	let location = query.location;
	console.log(location);
	let c = `location-data=${location.zip}%3A${location.city}%3A${location.state}%3A%3A1%3A1|1fj%3B%3B5.94%2C2pl%3B%3B7.84%2C4m1%3B%3B13.65%2C1p2%3B%3B14.03%2C21e%3B%3B17.65%2C4mg%3B%3B18.19%2C4c9%3B%3B18.72%2C1dm%3B%3B19.08%2C1fs%3B%3B19.6%2C282%3B%3B19.8||7|1|1xri%3B16%3B0%3B1.44%2C1xi4%3B16%3B2%3B7.38%2C1xqu%3B16%3B4%3B10.14%2C1yev%3B16%3B5%3B11.29%2C1y2i%3B16%3B6%3B12.55;`;
	let c2 = `DL=${location.zip}%2C%2C%2Cip%2C${location.zip}%2C%2C;`;
	let c3 = `t-loc-zip=1606978188210|${location.zip}`
	const cookieJar = new tough.CookieJar();
	
	cookieJar.setCookieSync(`${c}; ${c2}; ${c3}`, 'https://www.walmart.com');
	return await axios
		.get(enforceHttpsUrl(url), {
			jar: cookieJar,
			withCredentials: true,
			headers: {
			  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36',
			}

		  })
		.then(response => cheerio.load(response.data))
		.catch(error => {
			error.status = (error.response && error.response.status) || 500;
			console.log(error);
			throw error;
		});
};

///////////////////////////////////////////////////////////////////////////////
// HTML PARSING HELPER FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

/**
 * Fetches the inner text of the element
 * and returns the trimmed text
 */
const fetchElemInnerText = elem => (elem.text && elem.text().trim()) || null;

/**
 * Fetches the specified attribute from the element
 * and returns the attribute value
 */
const fetchElemAttribute = attribute => elem =>
	(elem.attr && elem.attr(attribute)) || null;

/**
 * Extract an array of values from a collection of elements
 * using the extractor function and returns the array
 * or the return value from calling transform() on array
 */
const extractFromElems = extractor => transform => elems => $ => {
	const results = elems.map((i, element) => extractor($(element))).get();
	return _.isFunction(transform) ? transform(results) : results;
};

/**
 * A composed function that extracts number text from an element,
 * sanitizes the number text and returns the parsed integer
 */
const extractNumber = compose(parseInt, sanitizeNumber, fetchElemInnerText);

/**
 * A composed function that extracts url string from the element's attribute(attr)
 * and returns the url with https scheme
 */
const extractUrlAttribute = attr =>
	compose(enforceHttpsUrl, fetchElemAttribute(attr));


module.exports = {
	compose,
	composeAsync,
	enforceHttpsUrl,
	sanitizeNumber,
	withoutNulls,
	arrayPairsToObject,
	fromPairsToObject,
	sendResponse,
	fetchHtmlFromUrl,
	fetchElemInnerText,
	fetchElemAttribute,
	extractFromElems,
	extractNumber,
	extractUrlAttribute
};