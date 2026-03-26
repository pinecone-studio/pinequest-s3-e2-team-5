import { i as __toESM } from "./chunk-Cvx0f2q0.js";
import { r as cookies, s as headers } from "./headers-C6ItjSdi.js";
import { c as require_react_react_server, i as registerServerReference } from "./rsc-B87piBzi.js";
import "./encryption-runtime-Dqwz5gIq.js";
import { B as buildErrorThrower, b as constants, c as KEYLESS_DISABLED, t as keyless } from "./keyless-node-BLs5Wyxn.js";
import { o as isDevelopmentEnvironment, r as createKeylessModeMessage, t as clerkDevelopmentCache } from "./keyless-XgWEHn-x.js";
//#region node_modules/vinext/dist/utils/base-path.js
/**
* Shared basePath helpers.
*
* Next.js only treats a pathname as being under basePath when it is an exact
* match ("/app") or starts with the basePath followed by a path separator
* ("/app/..."). Prefix-only matches like "/application" must be left intact.
*/
/**
* Check whether a pathname is inside the configured basePath.
*/
function hasBasePath(pathname, basePath) {
	if (!basePath) return false;
	return pathname === basePath || pathname.startsWith(basePath + "/");
}
/**
* Strip the basePath prefix from a pathname when it matches on a segment
* boundary. Returns the original pathname when it is outside the basePath.
*/
function stripBasePath(pathname, basePath) {
	if (!hasBasePath(pathname, basePath)) return pathname;
	return pathname.slice(basePath.length) || "/";
}
//#endregion
//#region node_modules/vinext/dist/shims/readonly-url-search-params.js
var ReadonlyURLSearchParamsError = class extends Error {
	constructor() {
		super("Method unavailable on `ReadonlyURLSearchParams`. Read more: https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams");
	}
};
/**
* Read-only URLSearchParams wrapper matching Next.js runtime behavior.
* Mutation methods remain present for instanceof/API compatibility but throw.
*/
var ReadonlyURLSearchParams = class extends URLSearchParams {
	append(_name, _value) {
		throw new ReadonlyURLSearchParamsError();
	}
	delete(_name, _value) {
		throw new ReadonlyURLSearchParamsError();
	}
	set(_name, _value) {
		throw new ReadonlyURLSearchParamsError();
	}
	sort() {
		throw new ReadonlyURLSearchParamsError();
	}
};
//#endregion
//#region node_modules/vinext/dist/shims/navigation.js
var import_react_react_server = /* @__PURE__ */ __toESM(require_react_react_server(), 1);
var _SERVER_INSERTED_HTML_CTX_KEY = Symbol.for("vinext.serverInsertedHTMLContext");
function getServerInsertedHTMLContext() {
	if (typeof import_react_react_server.createContext !== "function") return null;
	const globalState = globalThis;
	if (!globalState[_SERVER_INSERTED_HTML_CTX_KEY]) globalState[_SERVER_INSERTED_HTML_CTX_KEY] = import_react_react_server.createContext(null);
	return globalState[_SERVER_INSERTED_HTML_CTX_KEY] ?? null;
}
getServerInsertedHTMLContext();
var _serverContext = null;
var _getServerContext = () => _serverContext;
var _setServerContext = (ctx) => {
	_serverContext = ctx;
};
/**
* Register ALS-backed state accessors. Called by navigation-state.ts on import.
* @internal
*/
function _registerStateAccessors(accessors) {
	_getServerContext = accessors.getServerContext;
	_setServerContext = accessors.setServerContext;
	accessors.getInsertedHTMLCallbacks;
	accessors.clearInsertedHTMLCallbacks;
}
/**
* Get the navigation context for the current SSR/RSC render.
* Reads from AsyncLocalStorage when available (concurrent-safe),
* otherwise falls back to module-level state.
*/
function getNavigationContext() {
	return _getServerContext();
}
/**
* Set the navigation context for the current SSR/RSC render.
* Called by the framework entry before rendering each request.
*/
function setNavigationContext(ctx) {
	_setServerContext(ctx);
}
var isServer = typeof window === "undefined";
/** basePath from next.config.js, injected by the plugin at build time */
var __basePath = "";
var _listeners = /* @__PURE__ */ new Set();
function notifyListeners() {
	for (const fn of _listeners) fn();
}
new ReadonlyURLSearchParams(!isServer ? window.location.search : "");
!isServer && stripBasePath(window.location.pathname, __basePath);
!isServer && window.history.replaceState.bind(window.history);
/**
* Restore scroll position from a history state object (used on popstate).
*
* When an RSC navigation is in flight (back/forward triggers both this
* handler and the browser entry's popstate handler which calls
* __VINEXT_RSC_NAVIGATE__), we must wait for the new content to render
* before scrolling. Otherwise the user sees old content flash at the
* restored scroll position.
*
* This handler fires before the browser entry's popstate handler (because
* navigation.ts is loaded before hydration completes), so we defer via a
* microtask to give the browser entry handler a chance to set
* __VINEXT_RSC_PENDING__ first.
*/
function restoreScrollPosition(state) {
	if (state && typeof state === "object" && "__vinext_scrollY" in state) {
		const { __vinext_scrollX: x, __vinext_scrollY: y } = state;
		Promise.resolve().then(() => {
			const pending = window.__VINEXT_RSC_PENDING__ ?? null;
			if (pending) pending.then(() => {
				requestAnimationFrame(() => {
					window.scrollTo(x, y);
				});
			});
			else requestAnimationFrame(() => {
				window.scrollTo(x, y);
			});
		});
	}
}
/**
* HTTP Access Fallback error code — shared prefix for notFound/forbidden/unauthorized.
* Matches Next.js 16's unified error handling approach.
*/
var HTTP_ERROR_FALLBACK_ERROR_CODE = "NEXT_HTTP_ERROR_FALLBACK";
/**
* Enum matching Next.js RedirectType for type-safe redirect calls.
*/
var RedirectType = /* @__PURE__ */ function(RedirectType) {
	RedirectType["push"] = "push";
	RedirectType["replace"] = "replace";
	return RedirectType;
}({});
/**
* Internal error class used by redirect/notFound/forbidden/unauthorized.
* The `digest` field is the serialised control-flow signal read by the
* framework's error boundary and server-side request handlers.
*/
var VinextNavigationError = class extends Error {
	digest;
	constructor(message, digest) {
		super(message);
		this.digest = digest;
	}
};
/**
* Throw a redirect. Caught by the framework to send a redirect response.
*/
function redirect(url, type) {
	throw new VinextNavigationError(`NEXT_REDIRECT:${url}`, `NEXT_REDIRECT;${type ?? "replace"};${encodeURIComponent(url)}`);
}
/**
* Trigger a not-found response (404). Caught by the framework.
*/
function notFound() {
	throw new VinextNavigationError("NEXT_NOT_FOUND", `${HTTP_ERROR_FALLBACK_ERROR_CODE};404`);
}
if (!isServer) {
	window.addEventListener("popstate", (event) => {
		notifyListeners();
		restoreScrollPosition(event.state);
	});
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	window.history.pushState = function patchedPushState(data, unused, url) {
		originalPushState(data, unused, url);
		notifyListeners();
	};
	window.history.replaceState = function patchedReplaceState(data, unused, url) {
		originalReplaceState(data, unused, url);
		notifyListeners();
	};
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/headers-utils.js
function getCustomAttributeFromRequest(req, key) {
	return key in req ? req[key] : void 0;
}
function getAuthKeyFromRequest(req, key) {
	return getCustomAttributeFromRequest(req, constants.Attributes[key]) || getHeader(req, constants.Headers[key]);
}
function getHeader(req, name) {
	var _a, _b;
	if (isNextRequest(req) || isRequestWebAPI(req)) return req.headers.get(name);
	return req.headers[name] || req.headers[name.toLowerCase()] || ((_b = (_a = req.socket) == null ? void 0 : _a._httpMessage) == null ? void 0 : _b.getHeader(name));
}
function detectClerkMiddleware(req) {
	return Boolean(getAuthKeyFromRequest(req, "AuthStatus"));
}
function isNextRequest(val) {
	try {
		const { headers, nextUrl, cookies } = val || {};
		return typeof (headers == null ? void 0 : headers.get) === "function" && typeof (nextUrl == null ? void 0 : nextUrl.searchParams.get) === "function" && typeof (cookies == null ? void 0 : cookies.get) === "function";
	} catch {
		return false;
	}
}
function isRequestWebAPI(val) {
	try {
		const { headers } = val || {};
		return typeof (headers == null ? void 0 : headers.get) === "function";
	} catch {
		return false;
	}
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/utils/feature-flags.js
var canUseKeyless = isDevelopmentEnvironment() && !KEYLESS_DISABLED;
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/errorThrower.js
var errorThrower = buildErrorThrower({ packageName: "@clerk/nextjs" });
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/keyless.js
var keylessCookiePrefix = `__clerk_keys_`;
async function hashString(str) {
	const data = new TextEncoder().encode(str);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
async function getKeylessCookieName() {
	const PATH = process.env.PWD;
	if (!PATH) return `${keylessCookiePrefix}0`;
	return `${keylessCookiePrefix}${await hashString(PATH.split("/").filter(Boolean).slice(-3).reverse().join("/"))}`;
}
async function getKeylessCookieValue(getter) {
	if (!canUseKeyless) return;
	const keylessCookieName = await getKeylessCookieName();
	let keyless;
	try {
		if (keylessCookieName) keyless = JSON.parse(getter(keylessCookieName) || "{}");
	} catch {
		keyless = void 0;
	}
	return keyless;
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/app-router/keyless-actions.js
var keylessCookieConfig = {
	secure: false,
	httpOnly: false,
	sameSite: "lax"
};
async function syncKeylessConfigAction(args) {
	const { claimUrl, publishableKey, secretKey, returnUrl } = args;
	const cookieStore = await cookies();
	const request = new Request("https://placeholder.com", { headers: await headers() });
	const keylessCookie = await getKeylessCookieValue((name) => {
		var _a;
		return (_a = cookieStore.get(name)) == null ? void 0 : _a.value;
	});
	const pksMatch = (keylessCookie == null ? void 0 : keylessCookie.publishableKey) === publishableKey;
	const sksMatch = (keylessCookie == null ? void 0 : keylessCookie.secretKey) === secretKey;
	if (pksMatch && sksMatch) return;
	cookieStore.set(await getKeylessCookieName(), JSON.stringify({
		claimUrl,
		publishableKey,
		secretKey
	}), keylessCookieConfig);
	if (detectClerkMiddleware(request)) redirect(`/clerk-sync-keyless?returnUrl=${returnUrl}`, RedirectType.replace);
}
async function createOrReadKeylessAction() {
	var _a;
	if (!canUseKeyless) return null;
	let result;
	try {
		result = await keyless().getOrCreateKeys();
	} catch {
		result = null;
	}
	if (!result) {
		errorThrower.throwMissingPublishableKeyError();
		return null;
	}
	(_a = clerkDevelopmentCache) == null || _a.log({
		cacheKey: result.publishableKey,
		msg: createKeylessModeMessage(result)
	});
	const { claimUrl, publishableKey, secretKey, apiKeysUrl } = result;
	(await cookies()).set(await getKeylessCookieName(), JSON.stringify({
		claimUrl,
		publishableKey,
		secretKey
	}), keylessCookieConfig);
	return {
		claimUrl,
		publishableKey,
		apiKeysUrl
	};
}
async function deleteKeylessAction() {
	if (!canUseKeyless) return;
	try {
		await keyless().removeKeys();
	} catch {}
}
var $$wrap_createOrReadKeylessAction = /* @__PURE__ */ registerServerReference(createOrReadKeylessAction, "2ef97032be44", "createOrReadKeylessAction");
var $$wrap_deleteKeylessAction = /* @__PURE__ */ registerServerReference(deleteKeylessAction, "2ef97032be44", "deleteKeylessAction");
var $$wrap_syncKeylessConfigAction = /* @__PURE__ */ registerServerReference(syncKeylessConfigAction, "2ef97032be44", "syncKeylessConfigAction");
//#endregion
export { errorThrower as a, getAuthKeyFromRequest as c, getNavigationContext as d, notFound as f, getKeylessCookieValue as i, getHeader as l, setNavigationContext as m, $$wrap_deleteKeylessAction as n, canUseKeyless as o, redirect as p, $$wrap_syncKeylessConfigAction as r, detectClerkMiddleware as s, $$wrap_createOrReadKeylessAction as t, _registerStateAccessors as u };
