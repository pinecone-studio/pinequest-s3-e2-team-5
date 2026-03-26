//#region node_modules/@clerk/shared/dist/runtime/constants-Bta24VLk.mjs
var LEGACY_DEV_INSTANCE_SUFFIXES = [
	".lcl.dev",
	".lclstage.dev",
	".lclclerk.com"
];
var DEV_OR_STAGING_SUFFIXES = [
	".lcl.dev",
	".stg.dev",
	".lclstage.dev",
	".stgstage.dev",
	".dev.lclclerk.com",
	".stg.lclclerk.com",
	".accounts.lclclerk.com",
	"accountsstage.dev",
	"accounts.dev"
];
var LOCAL_ENV_SUFFIXES = [
	".lcl.dev",
	"lclstage.dev",
	".lclclerk.com",
	".accounts.lclclerk.com"
];
var STAGING_ENV_SUFFIXES = [".accountsstage.dev"];
var LOCAL_API_URL = "https://api.lclclerk.com";
var STAGING_API_URL = "https://api.clerkstage.dev";
var PROD_API_URL = "https://api.clerk.com";
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/isomorphicAtob-CoF80qYz.mjs
/**
* A function that decodes a string of data which has been encoded using base-64 encoding.
* Uses `atob` if available, otherwise uses `Buffer` from `globalThis`. If neither are available, returns the data as-is.
*/
var isomorphicAtob = (data) => {
	if (typeof atob !== "undefined" && typeof atob === "function") return atob(data);
	else if (typeof globalThis.Buffer !== "undefined") return globalThis.Buffer.from(data, "base64").toString();
	return data;
};
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/keys-DuxzP8MU.mjs
/** Prefix used for production publishable keys */
var PUBLISHABLE_KEY_LIVE_PREFIX = "pk_live_";
/** Prefix used for development publishable keys */
var PUBLISHABLE_KEY_TEST_PREFIX = "pk_test_";
/**
* Validates that a decoded publishable key has the correct format.
* The decoded value should be a frontend API followed by exactly one '$' at the end.
*
* @param decoded - The decoded publishable key string to validate.
* @returns `true` if the decoded key has valid format, `false` otherwise.
*/
function isValidDecodedPublishableKey(decoded) {
	if (!decoded.endsWith("$")) return false;
	const withoutTrailing = decoded.slice(0, -1);
	if (withoutTrailing.includes("$")) return false;
	return withoutTrailing.includes(".");
}
/**
* Parses and validates a publishable key, extracting the frontend API and instance type.
*
* @param key - The publishable key to parse.
* @param options - Configuration options for parsing.
* @param options.fatal
* @param options.domain
* @param options.proxyUrl
* @param options.isSatellite
* @returns Parsed publishable key object with instanceType and frontendApi, or null if invalid.
*
* @throws {Error} When options.fatal is true and key is missing or invalid.
*/
function parsePublishableKey(key, options = {}) {
	key = key || "";
	if (!key || !isPublishableKey(key)) {
		if (options.fatal && !key) throw new Error("Publishable key is missing. Ensure that your publishable key is correctly configured. Double-check your environment configuration for your keys, or access them here: https://dashboard.clerk.com/last-active?path=api-keys");
		if (options.fatal && !isPublishableKey(key)) throw new Error("Publishable key not valid.");
		return null;
	}
	const instanceType = key.startsWith(PUBLISHABLE_KEY_LIVE_PREFIX) ? "production" : "development";
	let decodedFrontendApi;
	try {
		decodedFrontendApi = isomorphicAtob(key.split("_")[2]);
	} catch {
		if (options.fatal) throw new Error("Publishable key not valid: Failed to decode key.");
		return null;
	}
	if (!isValidDecodedPublishableKey(decodedFrontendApi)) {
		if (options.fatal) throw new Error("Publishable key not valid: Decoded key has invalid format.");
		return null;
	}
	let frontendApi = decodedFrontendApi.slice(0, -1);
	if (options.proxyUrl) frontendApi = options.proxyUrl;
	else if (instanceType !== "development" && options.domain && options.isSatellite) frontendApi = `clerk.${options.domain}`;
	return {
		instanceType,
		frontendApi
	};
}
/**
* Checks if the provided key is a valid publishable key.
*
* @param key - The key to be checked. Defaults to an empty string if not provided.
* @returns `true` if 'key' is a valid publishable key, `false` otherwise.
*/
function isPublishableKey(key = "") {
	try {
		if (!(key.startsWith(PUBLISHABLE_KEY_LIVE_PREFIX) || key.startsWith(PUBLISHABLE_KEY_TEST_PREFIX))) return false;
		const parts = key.split("_");
		if (parts.length !== 3) return false;
		const encodedPart = parts[2];
		if (!encodedPart) return false;
		return isValidDecodedPublishableKey(isomorphicAtob(encodedPart));
	} catch {
		return false;
	}
}
/**
* Creates a memoized cache for checking if URLs are development or staging environments.
* Uses a Map to cache results for better performance on repeated checks.
*
* @returns An object with an isDevOrStagingUrl method that checks if a URL is dev/staging.
*/
function createDevOrStagingUrlCache() {
	const devOrStagingUrlCache = /* @__PURE__ */ new Map();
	return { isDevOrStagingUrl: (url) => {
		if (!url) return false;
		const hostname = typeof url === "string" ? url : url.hostname;
		let res = devOrStagingUrlCache.get(hostname);
		if (res === void 0) {
			res = DEV_OR_STAGING_SUFFIXES.some((s) => hostname.endsWith(s));
			devOrStagingUrlCache.set(hostname, res);
		}
		return res;
	} };
}
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/underscore-ClYSgvuy.mjs
/**
* Converts a string from snake_case to camelCase.
*/
function snakeToCamel(str) {
	return str ? str.replace(/([-_][a-z])/g, (match) => match.toUpperCase().replace(/-|_/, "")) : "";
}
/**
* Converts a string from camelCase to snake_case.
*/
function camelToSnake(str) {
	return str ? str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`) : "";
}
var createDeepObjectTransformer = (transform) => {
	const deepTransform = (obj) => {
		if (!obj) return obj;
		if (Array.isArray(obj)) return obj.map((el) => {
			if (typeof el === "object" || Array.isArray(el)) return deepTransform(el);
			return el;
		});
		const copy = { ...obj };
		const keys = Object.keys(copy);
		for (const oldName of keys) {
			const newName = transform(oldName.toString());
			if (newName !== oldName) {
				copy[newName] = copy[oldName];
				delete copy[oldName];
			}
			if (typeof copy[newName] === "object") copy[newName] = deepTransform(copy[newName]);
		}
		return copy;
	};
	return deepTransform;
};
createDeepObjectTransformer(camelToSnake);
createDeepObjectTransformer(snakeToCamel);
/**
* A function to determine if a value is truthy.
*
* @returns True for `true`, true, positive numbers. False for `false`, false, 0, negative integers and anything else.
*/
function isTruthy(value) {
	if (typeof value === `boolean`) return value;
	if (value === void 0 || value === null) return false;
	if (typeof value === `string`) {
		if (value.toLowerCase() === `true`) return true;
		if (value.toLowerCase() === `false`) return false;
	}
	const number = parseInt(value, 10);
	if (isNaN(number)) return false;
	if (number > 0) return true;
	return false;
}
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/runtimeEnvironment-D1yr0yUs.mjs
var isDevelopmentEnvironment = () => {
	try {
		return false;
	} catch {}
	return false;
};
var isTestEnvironment = () => {
	try {
		return false;
	} catch {}
	return false;
};
var isProductionEnvironment = () => {
	try {
		return true;
	} catch {}
	return false;
};
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/apiUrlFromPublishableKey.mjs
/**
* Get the correct API url based on the publishable key.
*
* @param publishableKey - The publishable key to parse.
* @returns One of Clerk's API URLs.
*/
var apiUrlFromPublishableKey = (publishableKey) => {
	const frontendApi = parsePublishableKey(publishableKey)?.frontendApi;
	if (frontendApi?.startsWith("clerk.") && LEGACY_DEV_INSTANCE_SUFFIXES.some((suffix) => frontendApi?.endsWith(suffix))) return PROD_API_URL;
	if (LOCAL_ENV_SUFFIXES.some((suffix) => frontendApi?.endsWith(suffix))) return LOCAL_API_URL;
	if (STAGING_ENV_SUFFIXES.some((suffix) => frontendApi?.endsWith(suffix))) return STAGING_API_URL;
	return PROD_API_URL;
};
process.env.NEXT_PUBLIC_CLERK_JS_VERSION;
process.env.NEXT_PUBLIC_CLERK_JS_URL;
process.env.NEXT_PUBLIC_CLERK_UI_URL;
process.env.NEXT_PUBLIC_CLERK_UI_VERSION;
process.env.CLERK_API_VERSION;
process.env.CLERK_SECRET_KEY;
process.env.CLERK_MACHINE_SECRET_KEY;
process.env.CLERK_ENCRYPTION_KEY;
process.env.CLERK_API_URL || apiUrlFromPublishableKey("pk_test_bW92ZWQtY3JhbmUtMjIuY2xlcmsuYWNjb3VudHMuZGV2JA");
process.env.NEXT_PUBLIC_CLERK_DOMAIN;
process.env.NEXT_PUBLIC_CLERK_PROXY_URL;
isTruthy(process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE);
process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL;
process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL;
var SDK_METADATA = {
	name: "@clerk/nextjs",
	version: "7.0.7",
	environment: "production"
};
isTruthy(process.env.NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED);
isTruthy(process.env.NEXT_PUBLIC_CLERK_TELEMETRY_DEBUG);
var KEYLESS_DISABLED = isTruthy(process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED) || false;
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/utils/feature-flags.js
var canUseKeyless = isDevelopmentEnvironment() && !KEYLESS_DISABLED;
//#endregion
export { isTestEnvironment as a, parsePublishableKey as c, isProductionEnvironment as i, SDK_METADATA as n, isTruthy as o, isDevelopmentEnvironment as r, createDevOrStagingUrlCache as s, canUseKeyless as t };
