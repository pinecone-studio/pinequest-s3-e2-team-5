globalThis.__VINEXT_LAZY_CHUNKS__ = ["assets/feature-flags-CcGOMZHQ.js","assets/query-Dc2DlAGN.js","assets/keyless-creator-reader-CFibQ4ZO.js","assets/keyless-actions-CxPDcAqz.js","assets/router-BZ9OweEp.js","assets/keyless-cookie-sync-BVYItB2p.js","assets/worker-entry-D5Rs0LYt.js"];
import { i as __toESM, n as __esmMin, r as __exportAll, t as __commonJSMin } from "./assets/chunk-Cvx0f2q0.js";
import { _ as isInsideUnifiedScope, a as getDraftModeCookieHeader, c as headersContextFromRequest, d as setHeadersAccessPhase, f as setHeadersContext, g as getRequestContext, h as createRequestContext, i as getAndClearPendingCookies, m as encodeMiddlewareRequestHeaders, n as consumeDynamicUsage, o as getHeadersContext, p as parseCookieHeader, s as headers, t as applyMiddlewareRequestHeaders, u as markDynamicUsage, v as runWithRequestContext, y as runWithUnifiedStateMutation } from "./assets/headers-C6ItjSdi.js";
import { a as renderToReadableStream$2, c as require_react_react_server, n as decodeReply, o as loadServerAction, r as registerClientReference, s as setRequireModule, t as createTemporaryReferenceSet } from "./assets/rsc-B87piBzi.js";
import "./assets/encryption-runtime-Dqwz5gIq.js";
import { a as errorThrower$1, c as getAuthKeyFromRequest, d as getNavigationContext, f as notFound, i as getKeylessCookieValue, l as getHeader, m as setNavigationContext$1, n as $$wrap_deleteKeylessAction, o as canUseKeyless, p as redirect, s as detectClerkMiddleware, u as _registerStateAccessors } from "./assets/keyless-actions-DAj4Hcz3.js";
import { $ as pathToRegexp, A as signedOutAuthObject, B as buildErrorThrower, C as getAuthObjectForAcceptedToken, E as isMachineToken, F as hasValidSignature, G as parsePublishableKey, H as createDevOrStagingUrlCache, I as importKey, J as LOCAL_ENV_SUFFIXES, K as DEFAULT_PROXY_PATH, L as runtime, M as base64url, N as decodeJwt, O as isTokenTypeAccepted, P as getCryptoAlgorithm, Q as STAGING_FAPI_URL, R as verifyJwt, S as createRedirect, T as invalidTokenAuthObject, U as isDevelopmentFromPublishableKey, V as addClerkPrefix, W as isDevelopmentFromSecretKey, X as PROD_FAPI_URL, Y as LOCAL_FAPI_URL, Z as STAGING_ENV_SUFFIXES, _ as withLegacySyncReturn, a as DOMAIN, b as constants$1, d as SDK_METADATA, f as SECRET_KEY, g as withLegacyReturn, h as isTruthy, i as API_VERSION, j as stripPrivateDataFromObject, k as makeAuthObjectSerializable, l as PROXY_URL, m as SIGN_UP_URL, n as createClerkClientWithOptions, o as ENCRYPTION_KEY, p as SIGN_IN_URL, q as LEGACY_DEV_INSTANCE_SUFFIXES, r as API_URL, s as IS_SATELLITE, v as AuthStatus, w as getAuthObjectFromJwt, x as createClerkRequest, y as TokenType, z as SignJWTError } from "./assets/keyless-node-BLs5Wyxn.js";
import { s as isProductionEnvironment } from "./assets/keyless-XgWEHn-x.js";
import { n as middlewareFileReference, r as package_default } from "./assets/sdk-versions-Bb30ybd9.js";
import { AsyncLocalStorage } from "node:async_hooks";
import assetsManifest from "./__vite_rsc_assets_manifest.js";
import "node:fs";
import "node:path";
//#region node_modules/vinext/dist/server/image-optimization.js
/**
* Next.js default device sizes and image sizes.
* These are the allowed widths for image optimization when no custom
* config is provided. Matches Next.js defaults exactly.
*/
var DEFAULT_DEVICE_SIZES = [
	640,
	750,
	828,
	1080,
	1200,
	1920,
	2048,
	3840
];
var DEFAULT_IMAGE_SIZES = [
	16,
	32,
	48,
	64,
	96,
	128,
	256,
	384
];
/**
* Absolute maximum image width. Even if custom deviceSizes/imageSizes are
* configured, widths above this are always rejected. This prevents resource
* exhaustion from absurdly large resize requests.
*/
var ABSOLUTE_MAX_WIDTH = 3840;
/**
* Parse and validate image optimization query parameters.
* Returns null if the request is malformed.
*
* When `allowedWidths` is provided, the width must be 0 (no resize) or
* exactly match one of the allowed values. This matches Next.js behavior
* where only configured deviceSizes and imageSizes are accepted.
*
* When `allowedWidths` is not provided, any width from 0 to ABSOLUTE_MAX_WIDTH
* is accepted (backwards-compatible fallback).
*/
function parseImageParams(url, allowedWidths) {
	const imageUrl = url.searchParams.get("url");
	if (!imageUrl) return null;
	const w = parseInt(url.searchParams.get("w") || "0", 10);
	const q = parseInt(url.searchParams.get("q") || "75", 10);
	if (Number.isNaN(w) || w < 0) return null;
	if (w > ABSOLUTE_MAX_WIDTH) return null;
	if (allowedWidths && w !== 0 && !allowedWidths.includes(w)) return null;
	if (Number.isNaN(q) || q < 1 || q > 100) return null;
	const normalizedUrl = imageUrl.replaceAll("\\", "/");
	if (!normalizedUrl.startsWith("/") || normalizedUrl.startsWith("//")) return null;
	try {
		const base = "https://localhost";
		if (new URL(normalizedUrl, base).origin !== base) return null;
	} catch {
		return null;
	}
	return {
		imageUrl: normalizedUrl,
		width: w,
		quality: q
	};
}
/**
* Negotiate the best output format based on the Accept header.
* Returns an IANA media type.
*/
function negotiateImageFormat(acceptHeader) {
	if (!acceptHeader) return "image/jpeg";
	if (acceptHeader.includes("image/avif")) return "image/avif";
	if (acceptHeader.includes("image/webp")) return "image/webp";
	return "image/jpeg";
}
/**
* Standard Cache-Control header for optimized images.
* Optimized images are immutable because the URL encodes the transform params.
*/
var IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";
/**
* Allowlist of Content-Types that are safe to serve from the image endpoint.
* SVG is intentionally excluded — it can contain embedded JavaScript and is
* essentially an XML document, not a safe raster image format.
*/
var SAFE_IMAGE_CONTENT_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
	"image/x-icon",
	"image/vnd.microsoft.icon",
	"image/bmp",
	"image/tiff"
]);
/**
* Check if a Content-Type header value is a safe image type.
* Returns false for SVG (unless dangerouslyAllowSVG is true), HTML, or any non-image type.
*/
function isSafeImageContentType(contentType, dangerouslyAllowSVG = false) {
	if (!contentType) return false;
	const mediaType = contentType.split(";")[0].trim().toLowerCase();
	if (SAFE_IMAGE_CONTENT_TYPES.has(mediaType)) return true;
	if (dangerouslyAllowSVG && mediaType === "image/svg+xml") return true;
	return false;
}
/**
* Apply security headers to an image optimization response.
* These headers are set on every response from the image endpoint,
* regardless of whether the image was transformed or served as-is.
* When an ImageConfig is provided, uses its values for CSP and Content-Disposition.
*/
function setImageSecurityHeaders(headers, config) {
	headers.set("Content-Security-Policy", config?.contentSecurityPolicy ?? "script-src 'none'; frame-src 'none'; sandbox;");
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Content-Disposition", config?.contentDispositionType === "attachment" ? "attachment" : "inline");
}
function createPassthroughImageResponse(source, config) {
	const headers = new Headers(source.headers);
	headers.set("Cache-Control", IMAGE_CACHE_CONTROL);
	headers.set("Vary", "Accept");
	setImageSecurityHeaders(headers, config);
	return new Response(source.body, {
		status: 200,
		headers
	});
}
/**
* Handle image optimization requests.
*
* Parses and validates the request, fetches the source image via the provided
* handlers, optionally transforms it, and returns the response with appropriate
* cache headers.
*/
async function handleImageOptimization(request, handlers, allowedWidths, imageConfig) {
	const params = parseImageParams(new URL(request.url), allowedWidths);
	if (!params) return new Response("Bad Request", { status: 400 });
	const { imageUrl, width, quality } = params;
	const source = await handlers.fetchAsset(imageUrl, request);
	if (!source.ok || !source.body) return new Response("Image not found", { status: 404 });
	const format = negotiateImageFormat(request.headers.get("Accept"));
	const sourceContentType = source.headers.get("Content-Type");
	if (!isSafeImageContentType(sourceContentType, imageConfig?.dangerouslyAllowSVG)) return new Response("The requested resource is not an allowed image type", { status: 400 });
	if (sourceContentType?.split(";")[0].trim().toLowerCase() === "image/svg+xml") return createPassthroughImageResponse(source, imageConfig);
	if (handlers.transformImage) try {
		const transformed = await handlers.transformImage(source.body, {
			width,
			format,
			quality
		});
		const headers = new Headers(transformed.headers);
		headers.set("Cache-Control", IMAGE_CACHE_CONTROL);
		headers.set("Vary", "Accept");
		setImageSecurityHeaders(headers, imageConfig);
		if (!isSafeImageContentType(headers.get("Content-Type"), imageConfig?.dangerouslyAllowSVG)) headers.set("Content-Type", format);
		return new Response(transformed.body, {
			status: 200,
			headers
		});
	} catch (e) {
		console.error("[vinext] Image optimization error:", e);
	}
	try {
		return createPassthroughImageResponse(source, imageConfig);
	} catch (e) {
		console.error("[vinext] Image fallback error, refetching source image:", e);
		const refetchedSource = await handlers.fetchAsset(imageUrl, request);
		if (!refetchedSource.ok || !refetchedSource.body) return new Response("Image not found", { status: 404 });
		if (!isSafeImageContentType(refetchedSource.headers.get("Content-Type"), imageConfig?.dangerouslyAllowSVG)) return new Response("The requested resource is not an allowed image type", { status: 400 });
		return createPassthroughImageResponse(refetchedSource, imageConfig);
	}
}
//#endregion
//#region node_modules/vinext/dist/shims/request-context.js
/**
* Request ExecutionContext — AsyncLocalStorage-backed accessor.
*
* Makes the Cloudflare Workers `ExecutionContext` (which provides
* `waitUntil`) available to any code on the call stack during a request
* without requiring it to be threaded through every function signature.
*
* Usage:
*
*   // In the worker entry, wrap the handler:
*   import { runWithExecutionContext } from "vinext/shims/request-context";
*   export default {
*     fetch(request, env, ctx) {
*       return runWithExecutionContext(ctx, () => handler.fetch(request, env, ctx));
*     }
*   };
*
*   // Anywhere downstream:
*   import { getRequestExecutionContext } from "vinext/shims/request-context";
*   const ctx = getRequestExecutionContext(); // null on Node.js dev
*   ctx?.waitUntil(somePromise);
*/
var _ALS_KEY$3 = Symbol.for("vinext.requestContext.als");
var _g$5 = globalThis;
var _als$2 = _g$5[_ALS_KEY$3] ??= new AsyncLocalStorage();
/**
* Run `fn` with the given `ExecutionContext` available via
* `getRequestExecutionContext()` for the duration of the call (including
* all async continuations, such as RSC streaming).
*
* Call this at the top of your Worker's `fetch` handler, wrapping the
* delegation to vinext so the context propagates through the entire
* request pipeline.
*/
function runWithExecutionContext(ctx, fn) {
	if (isInsideUnifiedScope()) return runWithUnifiedStateMutation((uCtx) => {
		uCtx.executionContext = ctx;
	}, fn);
	return _als$2.run(ctx, fn);
}
/**
* Get the `ExecutionContext` for the current request, or `null` when called
* outside a `runWithExecutionContext()` scope (e.g. on Node.js dev server).
*
* Use `ctx?.waitUntil(promise)` to schedule background work that must
* complete before the Worker isolate is torn down.
*/
function getRequestExecutionContext() {
	if (isInsideUnifiedScope()) return getRequestContext().executionContext;
	return _als$2.getStore() ?? null;
}
//#endregion
//#region \0virtual:vite-rsc/server-references
var server_references_default = {
	"2ef97032be44": async () => {
		const { createOrReadKeylessAction, deleteKeylessAction, syncKeylessConfigAction } = await import("./assets/keyless-actions-zkD_W-4x.js");
		return {
			createOrReadKeylessAction,
			deleteKeylessAction,
			syncKeylessConfigAction
		};
	},
	"1f8ac0b3199d": async () => {
		const { invalidateCacheAction } = await import("./assets/server-actions-DNiVI1He.js");
		return { invalidateCacheAction };
	}
};
//#endregion
//#region node_modules/@vitejs/plugin-rsc/dist/rsc.js
initialize();
function initialize() {
	setRequireModule({ load: async (id) => {
		{
			const import_ = server_references_default[id];
			if (!import_) throw new Error(`server reference not found '${id}'`);
			return import_();
		}
	} });
}
function renderToReadableStream$1(data, options, extraOptions) {
	return renderToReadableStream$2(data, options, { onClientReference(metadata) {
		const deps = assetsManifest.clientReferenceDeps[metadata.id] ?? {
			js: [],
			css: []
		};
		extraOptions?.onClientReference?.({
			id: metadata.id,
			name: metadata.name,
			deps
		});
	} });
}
//#endregion
//#region node_modules/vinext/dist/shims/server.js
var import_react_react_server = /* @__PURE__ */ __toESM(require_react_react_server(), 1);
var NextRequest = class extends Request {
	_nextUrl;
	_cookies;
	constructor(input, init) {
		const { nextConfig: _nextConfig, ...requestInit } = init ?? {};
		if (input instanceof Request) {
			const req = input;
			super(req.url, {
				method: req.method,
				headers: req.headers,
				body: req.body,
				duplex: req.body ? "half" : void 0,
				...requestInit
			});
		} else super(input, requestInit);
		this._nextUrl = new NextURL(typeof input === "string" ? new URL(input, "http://localhost") : input instanceof URL ? input : new URL(input.url, "http://localhost"), void 0, _nextConfig ? {
			basePath: _nextConfig.basePath,
			nextConfig: { i18n: _nextConfig.i18n }
		} : void 0);
		this._cookies = new RequestCookies(this.headers);
	}
	get nextUrl() {
		return this._nextUrl;
	}
	get cookies() {
		return this._cookies;
	}
	/**
	* Client IP address. Prefers Cloudflare's trusted CF-Connecting-IP header
	* over the spoofable X-Forwarded-For. Returns undefined if unavailable.
	*/
	get ip() {
		return this.headers.get("cf-connecting-ip") ?? this.headers.get("x-real-ip") ?? this.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? void 0;
	}
	/**
	* Geolocation data. Platform-dependent (e.g., Cloudflare, Vercel).
	* Returns undefined if not available.
	*/
	get geo() {
		const country = this.headers.get("cf-ipcountry") ?? this.headers.get("x-vercel-ip-country") ?? void 0;
		if (!country) return void 0;
		return {
			country,
			city: this.headers.get("cf-ipcity") ?? this.headers.get("x-vercel-ip-city") ?? void 0,
			region: this.headers.get("cf-region") ?? this.headers.get("x-vercel-ip-country-region") ?? void 0,
			latitude: this.headers.get("cf-iplatitude") ?? this.headers.get("x-vercel-ip-latitude") ?? void 0,
			longitude: this.headers.get("cf-iplongitude") ?? this.headers.get("x-vercel-ip-longitude") ?? void 0
		};
	}
	/**
	* The build ID of the Next.js application.
	* Delegates to `nextUrl.buildId` to match Next.js API surface.
	* Can be used in middleware to detect deployment skew between client and server.
	*/
	get buildId() {
		return this._nextUrl.buildId;
	}
};
var NextResponse = class NextResponse extends Response {
	_cookies;
	constructor(body, init) {
		super(body, init);
		this._cookies = new ResponseCookies(this.headers);
	}
	get cookies() {
		return this._cookies;
	}
	/**
	* Create a JSON response.
	*/
	static json(body, init) {
		const headers = new Headers(init?.headers);
		if (!headers.has("content-type")) headers.set("content-type", "application/json");
		return new NextResponse(JSON.stringify(body), {
			...init,
			headers
		});
	}
	/**
	* Create a redirect response.
	*/
	static redirect(url, init) {
		const status = typeof init === "number" ? init : init?.status ?? 307;
		const destination = typeof url === "string" ? url : url.toString();
		const headers = new Headers(typeof init === "object" ? init?.headers : void 0);
		headers.set("Location", destination);
		return new NextResponse(null, {
			status,
			headers
		});
	}
	/**
	* Create a rewrite response (middleware pattern).
	* Sets the x-middleware-rewrite header.
	*/
	static rewrite(destination, init) {
		const url = typeof destination === "string" ? destination : destination.toString();
		const headers = new Headers(init?.headers);
		headers.set("x-middleware-rewrite", url);
		if (init?.request?.headers) encodeMiddlewareRequestHeaders(headers, init.request.headers);
		return new NextResponse(null, {
			...init,
			headers
		});
	}
	/**
	* Continue to the next handler (middleware pattern).
	* Sets the x-middleware-next header.
	*/
	static next(init) {
		const headers = new Headers(init?.headers);
		headers.set("x-middleware-next", "1");
		if (init?.request?.headers) encodeMiddlewareRequestHeaders(headers, init.request.headers);
		return new NextResponse(null, {
			...init,
			headers
		});
	}
};
var NextURL = class NextURL {
	/** Internal URL stores the pathname WITHOUT basePath or locale prefix. */
	_url;
	_basePath;
	_locale;
	_defaultLocale;
	_locales;
	constructor(input, base, config) {
		this._url = new URL(input.toString(), base);
		this._basePath = config?.basePath ?? "";
		this._stripBasePath();
		const i18n = config?.nextConfig?.i18n;
		if (i18n) {
			this._locales = [...i18n.locales];
			this._defaultLocale = i18n.defaultLocale;
			this._analyzeLocale(this._locales);
		}
	}
	/** Strip basePath prefix from the internal pathname. */
	_stripBasePath() {
		if (!this._basePath) return;
		const { pathname } = this._url;
		if (pathname === this._basePath || pathname.startsWith(this._basePath + "/")) this._url.pathname = pathname.slice(this._basePath.length) || "/";
	}
	/** Extract locale from pathname, stripping it from the internal URL. */
	_analyzeLocale(locales) {
		const segments = this._url.pathname.split("/");
		const candidate = segments[1]?.toLowerCase();
		const match = locales.find((l) => l.toLowerCase() === candidate);
		if (match) {
			this._locale = match;
			this._url.pathname = "/" + segments.slice(2).join("/");
		} else this._locale = this._defaultLocale;
	}
	/**
	* Reconstruct the full pathname with basePath + locale prefix.
	* Mirrors Next.js's internal formatPathname().
	*/
	_formatPathname() {
		let prefix = this._basePath;
		if (this._locale && this._locale !== this._defaultLocale) prefix += "/" + this._locale;
		if (!prefix) return this._url.pathname;
		const inner = this._url.pathname;
		return inner === "/" ? prefix : prefix + inner;
	}
	get href() {
		const formatted = this._formatPathname();
		if (formatted === this._url.pathname) return this._url.href;
		const { href, pathname, search, hash } = this._url;
		const baseEnd = href.length - pathname.length - search.length - hash.length;
		return href.slice(0, baseEnd) + formatted + search + hash;
	}
	set href(value) {
		this._url.href = value;
		this._stripBasePath();
		if (this._locales) this._analyzeLocale(this._locales);
	}
	get origin() {
		return this._url.origin;
	}
	get protocol() {
		return this._url.protocol;
	}
	set protocol(value) {
		this._url.protocol = value;
	}
	get username() {
		return this._url.username;
	}
	set username(value) {
		this._url.username = value;
	}
	get password() {
		return this._url.password;
	}
	set password(value) {
		this._url.password = value;
	}
	get host() {
		return this._url.host;
	}
	set host(value) {
		this._url.host = value;
	}
	get hostname() {
		return this._url.hostname;
	}
	set hostname(value) {
		this._url.hostname = value;
	}
	get port() {
		return this._url.port;
	}
	set port(value) {
		this._url.port = value;
	}
	/** Returns the pathname WITHOUT basePath or locale prefix. */
	get pathname() {
		return this._url.pathname;
	}
	set pathname(value) {
		this._url.pathname = value;
	}
	get search() {
		return this._url.search;
	}
	set search(value) {
		this._url.search = value;
	}
	get searchParams() {
		return this._url.searchParams;
	}
	get hash() {
		return this._url.hash;
	}
	set hash(value) {
		this._url.hash = value;
	}
	get basePath() {
		return this._basePath;
	}
	set basePath(value) {
		this._basePath = value === "" ? "" : value.startsWith("/") ? value : "/" + value;
	}
	get locale() {
		return this._locale ?? "";
	}
	set locale(value) {
		if (this._locales) {
			if (!value) {
				this._locale = this._defaultLocale;
				return;
			}
			if (!this._locales.includes(value)) throw new TypeError(`The locale "${value}" is not in the configured locales: ${this._locales.join(", ")}`);
		}
		this._locale = this._locales ? value : this._locale;
	}
	get defaultLocale() {
		return this._defaultLocale;
	}
	get locales() {
		return this._locales ? [...this._locales] : void 0;
	}
	clone() {
		const config = {
			basePath: this._basePath,
			nextConfig: this._locales ? { i18n: {
				locales: [...this._locales],
				defaultLocale: this._defaultLocale
			} } : void 0
		};
		return new NextURL(this.href, void 0, config);
	}
	toString() {
		return this.href;
	}
	/**
	* The build ID of the Next.js application.
	* Set from `generateBuildId` in next.config.js, or a random UUID if not configured.
	* Can be used in middleware to detect deployment skew between client and server.
	* Matches the Next.js API: `request.nextUrl.buildId`.
	*/
	get buildId() {
		return "fcf44256-aba6-4ab6-a8ed-dba656fa3843";
	}
};
var RequestCookies = class {
	_headers;
	_parsed;
	constructor(headers) {
		this._headers = headers;
		this._parsed = parseCookieHeader(headers.get("cookie") ?? "");
	}
	get(name) {
		const value = this._parsed.get(name);
		return value !== void 0 ? {
			name,
			value
		} : void 0;
	}
	getAll(nameOrOptions) {
		const name = typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions?.name;
		return [...this._parsed.entries()].filter(([cookieName]) => name === void 0 || cookieName === name).map(([cookieName, value]) => ({
			name: cookieName,
			value
		}));
	}
	has(name) {
		return this._parsed.has(name);
	}
	set(nameOrOptions, value) {
		let cookieName;
		let cookieValue;
		if (typeof nameOrOptions === "string") {
			cookieName = nameOrOptions;
			cookieValue = value ?? "";
		} else {
			cookieName = nameOrOptions.name;
			cookieValue = nameOrOptions.value;
		}
		this._parsed.set(cookieName, cookieValue);
		this._syncHeader();
		return this;
	}
	delete(names) {
		if (Array.isArray(names)) {
			const results = names.map((name) => this._parsed.delete(name));
			this._syncHeader();
			return results;
		}
		const result = this._parsed.delete(names);
		this._syncHeader();
		return result;
	}
	clear() {
		this._parsed.clear();
		this._syncHeader();
		return this;
	}
	get size() {
		return this._parsed.size;
	}
	toString() {
		return this._serialize();
	}
	_serialize() {
		return [...this._parsed.entries()].map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join("; ");
	}
	_syncHeader() {
		if (this._parsed.size === 0) this._headers.delete("cookie");
		else this._headers.set("cookie", this._serialize());
	}
	[Symbol.iterator]() {
		return this.getAll().map((c) => [c.name, c])[Symbol.iterator]();
	}
};
/**
* RFC 6265 §4.1.1: cookie-name is a token (RFC 2616 §2.2).
* Allowed: any visible ASCII (0x21-0x7E) except separators: ()<>@,;:\"/[]?={}
*/
var VALID_COOKIE_NAME_RE = /^[\x21\x23-\x27\x2A\x2B\x2D\x2E\x30-\x39\x41-\x5A\x5E-\x7A\x7C\x7E]+$/;
function validateCookieName(name) {
	if (!name || !VALID_COOKIE_NAME_RE.test(name)) throw new Error(`Invalid cookie name: ${JSON.stringify(name)}`);
}
function validateCookieAttributeValue(value, attributeName) {
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);
		if (code <= 31 || code === 127 || value[i] === ";") throw new Error(`Invalid cookie ${attributeName} value: ${JSON.stringify(value)}`);
	}
}
var ResponseCookies = class {
	_headers;
	constructor(headers) {
		this._headers = headers;
	}
	set(name, value, options) {
		validateCookieName(name);
		const parts = [`${name}=${encodeURIComponent(value)}`];
		if (options?.path) {
			validateCookieAttributeValue(options.path, "Path");
			parts.push(`Path=${options.path}`);
		}
		if (options?.domain) {
			validateCookieAttributeValue(options.domain, "Domain");
			parts.push(`Domain=${options.domain}`);
		}
		if (options?.maxAge !== void 0) parts.push(`Max-Age=${options.maxAge}`);
		if (options?.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
		if (options?.httpOnly) parts.push("HttpOnly");
		if (options?.secure) parts.push("Secure");
		if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);
		this._headers.append("Set-Cookie", parts.join("; "));
		return this;
	}
	get(name) {
		for (const header of this._headers.getSetCookie()) {
			const eq = header.indexOf("=");
			if (eq === -1) continue;
			if (header.slice(0, eq) === name) {
				const semi = header.indexOf(";", eq);
				const raw = header.slice(eq + 1, semi === -1 ? void 0 : semi);
				let value;
				try {
					value = decodeURIComponent(raw);
				} catch {
					value = raw;
				}
				return {
					name,
					value
				};
			}
		}
	}
	has(name) {
		return this.get(name) !== void 0;
	}
	getAll() {
		const entries = [];
		for (const header of this._headers.getSetCookie()) {
			const eq = header.indexOf("=");
			if (eq === -1) continue;
			const cookieName = header.slice(0, eq);
			const semi = header.indexOf(";", eq);
			const raw = header.slice(eq + 1, semi === -1 ? void 0 : semi);
			let value;
			try {
				value = decodeURIComponent(raw);
			} catch {
				value = raw;
			}
			entries.push({
				name: cookieName,
				value
			});
		}
		return entries;
	}
	delete(name) {
		this.set(name, "", {
			maxAge: 0,
			path: "/"
		});
		return this;
	}
	[Symbol.iterator]() {
		const entries = [];
		for (const header of this._headers.getSetCookie()) {
			const eq = header.indexOf("=");
			if (eq === -1) continue;
			const cookieName = header.slice(0, eq);
			const semi = header.indexOf(";", eq);
			const raw = header.slice(eq + 1, semi === -1 ? void 0 : semi);
			let value;
			try {
				value = decodeURIComponent(raw);
			} catch {
				value = raw;
			}
			entries.push([cookieName, {
				name: cookieName,
				value
			}]);
		}
		return entries[Symbol.iterator]();
	}
};
/**
* Minimal NextFetchEvent — extends FetchEvent where available,
* otherwise provides the waitUntil pattern standalone.
*/
var NextFetchEvent = class {
	sourcePage;
	_waitUntilPromises = [];
	constructor(params) {
		this.sourcePage = params.page;
	}
	waitUntil(promise) {
		this._waitUntilPromises.push(promise);
	}
	/** Drain all waitUntil promises. Returns a single promise that settles when all are done. */
	drainWaitUntil() {
		return Promise.allSettled(this._waitUntilPromises);
	}
};
globalThis.URLPattern;
//#endregion
//#region node_modules/vinext/dist/shims/error-boundary.js
/**
* Generic ErrorBoundary used to wrap route segments with error.tsx.
* This must be a client component since error boundaries use
* componentDidCatch / getDerivedStateFromError.
*/
/**
* Inner class component that catches notFound() errors and renders the
* not-found.tsx fallback. Resets when the pathname changes (client navigation)
* so a previous notFound() doesn't permanently stick.
*
* The ErrorBoundary above re-throws notFound errors so they propagate up to this
* boundary. This must be placed above the ErrorBoundary in the component tree.
*/
/**
* Wrapper that reads the current pathname and passes it to the inner class
* component. This enables automatic reset on client-side navigation.
*/
var ErrorBoundary = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'ErrorBoundary' is called on server");
}, "f29e6e234fea", "ErrorBoundary");
var NotFoundBoundary = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'NotFoundBoundary' is called on server");
}, "f29e6e234fea", "NotFoundBoundary");
//#endregion
//#region node_modules/vinext/dist/shims/layout-segment-context.js
/**
* Layout segment context provider.
*
* This is a "use client" module because it needs React's createContext
* and useContext, which are NOT available in the react-server condition.
* The RSC entry renders this as a client component boundary.
*
* The context is shared with navigation.ts via getLayoutSegmentContext()
* to avoid creating separate contexts in different modules.
*/
/**
* Wraps children with the layout segment context.
* Each layout in the App Router tree wraps its children with this provider,
* passing the remaining route tree segments below that layout level.
* Segments include route groups and resolved dynamic param values.
*/
var LayoutSegmentProvider = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'LayoutSegmentProvider' is called on server");
}, "0deffcb8ffd7", "LayoutSegmentProvider");
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.react-server.production.js
/**
* @license React
* react-jsx-runtime.react-server.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_react_server_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React = require_react_react_server(), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	if (!React.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) throw Error("The \"react\" package in this environment is not configured correctly. The \"react-server\" condition must be enabled in any environment that runs React Server Components.");
	function jsxProd(type, config, maybeKey) {
		var key = null;
		void 0 !== maybeKey && (key = "" + maybeKey);
		void 0 !== config.key && (key = "" + config.key);
		if ("key" in config) {
			maybeKey = {};
			for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
		} else maybeKey = config;
		config = maybeKey.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== config ? config : null,
			props: maybeKey
		};
	}
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.jsx = jsxProd;
	exports.jsxs = jsxProd;
}));
//#endregion
//#region node_modules/vinext/dist/shims/metadata.js
var import_jsx_runtime_react_server = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_react_server_production();
})))();
/**
* Normalize null-prototype objects from matchPattern() into thenable objects.
* See entries/app-rsc-entry.ts makeThenableParams() for full explanation.
*/
function makeThenableParams$1(obj) {
	const plain = { ...obj };
	return Object.assign(Promise.resolve(plain), plain);
}
/**
* Resolve viewport config from a module. Handles both static `viewport` export
* and async `generateViewport()` function.
*/
async function resolveModuleViewport(mod, params) {
	if (typeof mod.generateViewport === "function") {
		const asyncParams = makeThenableParams$1(params);
		return await mod.generateViewport({ params: asyncParams });
	}
	if (mod.viewport && typeof mod.viewport === "object") return mod.viewport;
	return null;
}
/**
* Merge viewport configs from multiple sources (layouts + page).
* Later entries override earlier ones.
*/
var DEFAULT_VIEWPORT = {
	width: "device-width",
	initialScale: 1
};
function mergeViewport(viewportList) {
	const merged = { ...DEFAULT_VIEWPORT };
	for (const vp of viewportList) Object.assign(merged, vp);
	return merged;
}
/**
* React component that renders viewport meta tags into <head>.
*/
function ViewportHead({ viewport }) {
	const elements = [];
	let key = 0;
	const parts = [];
	if (viewport.width !== void 0) parts.push(`width=${viewport.width}`);
	if (viewport.height !== void 0) parts.push(`height=${viewport.height}`);
	if (viewport.initialScale !== void 0) parts.push(`initial-scale=${viewport.initialScale}`);
	if (viewport.minimumScale !== void 0) parts.push(`minimum-scale=${viewport.minimumScale}`);
	if (viewport.maximumScale !== void 0) parts.push(`maximum-scale=${viewport.maximumScale}`);
	if (viewport.userScalable !== void 0) parts.push(`user-scalable=${viewport.userScalable ? "yes" : "no"}`);
	if (parts.length > 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "viewport",
		content: parts.join(", ")
	}, key++));
	if (viewport.themeColor) {
		if (typeof viewport.themeColor === "string") elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "theme-color",
			content: viewport.themeColor
		}, key++));
		else if (Array.isArray(viewport.themeColor)) for (const entry of viewport.themeColor) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "theme-color",
			content: entry.color,
			...entry.media ? { media: entry.media } : {}
		}, key++));
	}
	if (viewport.colorScheme) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "color-scheme",
		content: viewport.colorScheme
	}, key++));
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(import_jsx_runtime_react_server.Fragment, { children: elements });
}
/**
* Merge metadata from multiple sources (layouts + page).
*
* The list is ordered [rootLayout, nestedLayout, ..., page].
* Title template from layouts applies to the page title but NOT to
* the segment that defines the template itself. `title.absolute`
* skips all templates. `title.default` is the fallback when no
* child provides a title.
*
* Shallow merge: later entries override earlier ones (per Next.js docs).
*/
function mergeMetadata(metadataList) {
	if (metadataList.length === 0) return {};
	const merged = {};
	let parentTemplate;
	for (let i = 0; i < metadataList.length; i++) {
		const meta = metadataList[i];
		if (!(i === metadataList.length - 1) && meta.title && typeof meta.title === "object" && meta.title.template) parentTemplate = meta.title.template;
		for (const key of Object.keys(meta)) {
			if (key === "title") continue;
			merged[key] = meta[key];
		}
		if (meta.title !== void 0) merged.title = meta.title;
	}
	const finalTitle = merged.title;
	if (finalTitle) {
		if (typeof finalTitle === "string") {
			if (parentTemplate) merged.title = parentTemplate.replace("%s", finalTitle);
		} else if (typeof finalTitle === "object") {
			if (finalTitle.absolute) merged.title = finalTitle.absolute;
			else if (finalTitle.default) merged.title = finalTitle.default;
			else if (finalTitle.template && !finalTitle.default && !finalTitle.absolute) merged.title = void 0;
		}
	}
	return merged;
}
/**
* Resolve metadata from a module. Handles both static `metadata` export
* and async `generateMetadata()` function.
*
* @param parent - A Promise that resolves to the accumulated (merged) metadata
*   from all ancestor segments. Passed as the second argument to
*   `generateMetadata()`, matching Next.js's eager-execution-with-serial-
*   resolution approach. If not provided, defaults to a promise that resolves
*   to an empty object (so `await parent` never throws).
*/
async function resolveModuleMetadata(mod, params = {}, searchParams, parent = Promise.resolve({})) {
	if (typeof mod.generateMetadata === "function") {
		const asyncParams = makeThenableParams$1(params);
		const asyncSp = makeThenableParams$1(searchParams ?? {});
		return await mod.generateMetadata({
			params: asyncParams,
			searchParams: asyncSp
		}, parent);
	}
	if (mod.metadata && typeof mod.metadata === "object") return mod.metadata;
	return null;
}
/**
* React component that renders metadata as HTML head elements.
* Used by the RSC entry to inject into the <head>.
*/
function MetadataHead({ metadata }) {
	const elements = [];
	let key = 0;
	const base = metadata.metadataBase;
	function resolveUrl(url) {
		if (!url) return void 0;
		const s = typeof url === "string" ? url : url instanceof URL ? url.toString() : String(url);
		if (!base) return s;
		if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("//")) return s;
		try {
			return new URL(s, base).toString();
		} catch {
			return s;
		}
	}
	const title = typeof metadata.title === "string" ? metadata.title : typeof metadata.title === "object" ? metadata.title.absolute || metadata.title.default : void 0;
	if (title) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("title", { children: title }, key++));
	if (metadata.description) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "description",
		content: metadata.description
	}, key++));
	if (metadata.generator) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "generator",
		content: metadata.generator
	}, key++));
	if (metadata.applicationName) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "application-name",
		content: metadata.applicationName
	}, key++));
	if (metadata.referrer) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "referrer",
		content: metadata.referrer
	}, key++));
	if (metadata.keywords) {
		const kw = Array.isArray(metadata.keywords) ? metadata.keywords.join(",") : metadata.keywords;
		elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "keywords",
			content: kw
		}, key++));
	}
	if (metadata.authors) {
		const authorList = Array.isArray(metadata.authors) ? metadata.authors : [metadata.authors];
		for (const author of authorList) {
			if (author.name) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				name: "author",
				content: author.name
			}, key++));
			if (author.url) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "author",
				href: author.url
			}, key++));
		}
	}
	if (metadata.creator) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "creator",
		content: metadata.creator
	}, key++));
	if (metadata.publisher) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "publisher",
		content: metadata.publisher
	}, key++));
	if (metadata.formatDetection) {
		const parts = [];
		if (metadata.formatDetection.telephone === false) parts.push("telephone=no");
		if (metadata.formatDetection.address === false) parts.push("address=no");
		if (metadata.formatDetection.email === false) parts.push("email=no");
		if (parts.length > 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "format-detection",
			content: parts.join(", ")
		}, key++));
	}
	if (metadata.category) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "category",
		content: metadata.category
	}, key++));
	if (metadata.robots) if (typeof metadata.robots === "string") elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "robots",
		content: metadata.robots
	}, key++));
	else {
		const { googleBot, ...robotsRest } = metadata.robots;
		const robotParts = [];
		for (const [k, v] of Object.entries(robotsRest)) if (v === true) robotParts.push(k);
		else if (v === false) robotParts.push(`no${k}`);
		else if (typeof v === "string" || typeof v === "number") robotParts.push(`${k}:${v}`);
		if (robotParts.length > 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "robots",
			content: robotParts.join(", ")
		}, key++));
		if (googleBot) if (typeof googleBot === "string") elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "googlebot",
			content: googleBot
		}, key++));
		else {
			const gbParts = [];
			for (const [k, v] of Object.entries(googleBot)) if (v === true) gbParts.push(k);
			else if (v === false) gbParts.push(`no${k}`);
			else if (typeof v === "string" || typeof v === "number") gbParts.push(`${k}:${v}`);
			if (gbParts.length > 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				name: "googlebot",
				content: gbParts.join(", ")
			}, key++));
		}
	}
	if (metadata.openGraph) {
		const og = metadata.openGraph;
		if (og.title) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:title",
			content: og.title
		}, key++));
		if (og.description) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:description",
			content: og.description
		}, key++));
		if (og.url) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:url",
			content: resolveUrl(og.url)
		}, key++));
		if (og.siteName) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:site_name",
			content: og.siteName
		}, key++));
		if (og.type) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:type",
			content: og.type
		}, key++));
		if (og.locale) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:locale",
			content: og.locale
		}, key++));
		if (og.publishedTime) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "article:published_time",
			content: og.publishedTime
		}, key++));
		if (og.modifiedTime) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "article:modified_time",
			content: og.modifiedTime
		}, key++));
		if (og.authors) for (const author of og.authors) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "article:author",
			content: author
		}, key++));
		if (og.images) {
			const imgList = typeof og.images === "string" || og.images instanceof URL ? [{ url: og.images }] : Array.isArray(og.images) ? og.images : [og.images];
			for (const img of imgList) {
				const imgUrl = typeof img === "string" || img instanceof URL ? img : img.url;
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					property: "og:image",
					content: resolveUrl(imgUrl)
				}, key++));
				if (typeof img !== "string" && !(img instanceof URL)) {
					if (img.width) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
						property: "og:image:width",
						content: String(img.width)
					}, key++));
					if (img.height) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
						property: "og:image:height",
						content: String(img.height)
					}, key++));
					if (img.alt) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
						property: "og:image:alt",
						content: img.alt
					}, key++));
				}
			}
		}
		if (og.videos) for (const video of og.videos) {
			elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				property: "og:video",
				content: resolveUrl(video.url)
			}, key++));
			if (video.width) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				property: "og:video:width",
				content: String(video.width)
			}, key++));
			if (video.height) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				property: "og:video:height",
				content: String(video.height)
			}, key++));
		}
		if (og.audio) for (const audio of og.audio) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:audio",
			content: resolveUrl(audio.url)
		}, key++));
	}
	if (metadata.twitter) {
		const tw = metadata.twitter;
		if (tw.card) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:card",
			content: tw.card
		}, key++));
		if (tw.site) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:site",
			content: tw.site
		}, key++));
		if (tw.siteId) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:site:id",
			content: tw.siteId
		}, key++));
		if (tw.title) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:title",
			content: tw.title
		}, key++));
		if (tw.description) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:description",
			content: tw.description
		}, key++));
		if (tw.creator) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:creator",
			content: tw.creator
		}, key++));
		if (tw.creatorId) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:creator:id",
			content: tw.creatorId
		}, key++));
		if (tw.images) {
			const imgList = typeof tw.images === "string" || tw.images instanceof URL ? [tw.images] : Array.isArray(tw.images) ? tw.images : [tw.images];
			for (const img of imgList) {
				const imgUrl = typeof img === "string" || img instanceof URL ? img : img.url;
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:image",
					content: resolveUrl(imgUrl)
				}, key++));
				if (typeof img !== "string" && !(img instanceof URL) && img.alt) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:image:alt",
					content: img.alt
				}, key++));
			}
		}
		if (tw.players) {
			const players = Array.isArray(tw.players) ? tw.players : [tw.players];
			for (const player of players) {
				const playerUrl = player.playerUrl.toString();
				const streamUrl = player.streamUrl.toString();
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:player",
					content: resolveUrl(playerUrl)
				}, key++));
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:player:stream",
					content: resolveUrl(streamUrl)
				}, key++));
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:player:width",
					content: String(player.width)
				}, key++));
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:player:height",
					content: String(player.height)
				}, key++));
			}
		}
		if (tw.app) {
			const { app } = tw;
			for (const platform of [
				"iphone",
				"ipad",
				"googleplay"
			]) {
				if (app.name) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: `twitter:app:name:${platform}`,
					content: app.name
				}, key++));
				if (app.id[platform] !== void 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: `twitter:app:id:${platform}`,
					content: String(app.id[platform])
				}, key++));
				if (app.url?.[platform] !== void 0) {
					const appUrl = app.url[platform].toString();
					elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
						name: `twitter:app:url:${platform}`,
						content: resolveUrl(appUrl)
					}, key++));
				}
			}
		}
	}
	if (metadata.icons) {
		const { icon, shortcut, apple, other } = metadata.icons;
		if (shortcut) {
			const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];
			for (const s of shortcuts) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "shortcut icon",
				href: resolveUrl(s)
			}, key++));
		}
		if (icon) {
			const icons = typeof icon === "string" || icon instanceof URL ? [{ url: icon }] : icon;
			for (const i of icons) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "icon",
				href: resolveUrl(i.url),
				...i.sizes ? { sizes: i.sizes } : {},
				...i.type ? { type: i.type } : {},
				...i.media ? { media: i.media } : {}
			}, key++));
		}
		if (apple) {
			const apples = typeof apple === "string" || apple instanceof URL ? [{ url: apple }] : apple;
			for (const a of apples) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "apple-touch-icon",
				href: resolveUrl(a.url),
				...a.sizes ? { sizes: a.sizes } : {},
				...a.type ? { type: a.type } : {}
			}, key++));
		}
		if (other) for (const o of other) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: o.rel,
			href: resolveUrl(o.url),
			...o.sizes ? { sizes: o.sizes } : {}
		}, key++));
	}
	if (metadata.manifest) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
		rel: "manifest",
		href: resolveUrl(metadata.manifest)
	}, key++));
	if (metadata.alternates) {
		const alt = metadata.alternates;
		if (alt.canonical) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: "canonical",
			href: resolveUrl(alt.canonical)
		}, key++));
		if (alt.languages) for (const [lang, href] of Object.entries(alt.languages)) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: "alternate",
			hrefLang: lang,
			href: resolveUrl(href)
		}, key++));
		if (alt.media) for (const [media, href] of Object.entries(alt.media)) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: "alternate",
			media,
			href: resolveUrl(href)
		}, key++));
		if (alt.types) for (const [type, href] of Object.entries(alt.types)) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: "alternate",
			type,
			href: resolveUrl(href)
		}, key++));
	}
	if (metadata.verification) {
		const v = metadata.verification;
		if (v.google) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "google-site-verification",
			content: v.google
		}, key++));
		if (v.yahoo) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "y_key",
			content: v.yahoo
		}, key++));
		if (v.yandex) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "yandex-verification",
			content: v.yandex
		}, key++));
		if (v.other) for (const [name, content] of Object.entries(v.other)) {
			const values = Array.isArray(content) ? content : [content];
			for (const val of values) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				name,
				content: val
			}, key++));
		}
	}
	if (metadata.appleWebApp) {
		const awa = metadata.appleWebApp;
		if (awa.capable !== false) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "mobile-web-app-capable",
			content: "yes"
		}, key++));
		if (awa.title) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "apple-mobile-web-app-title",
			content: awa.title
		}, key++));
		if (awa.statusBarStyle) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "apple-mobile-web-app-status-bar-style",
			content: awa.statusBarStyle
		}, key++));
		if (awa.startupImage) {
			const imgs = typeof awa.startupImage === "string" ? [{ url: awa.startupImage }] : awa.startupImage;
			for (const img of imgs) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "apple-touch-startup-image",
				href: resolveUrl(img.url),
				...img.media ? { media: img.media } : {}
			}, key++));
		}
	}
	if (metadata.itunes) {
		const { appId, appArgument } = metadata.itunes;
		let content = `app-id=${appId}`;
		if (appArgument) content += `, app-argument=${appArgument}`;
		elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "apple-itunes-app",
			content
		}, key++));
	}
	if (metadata.appLinks) {
		const al = metadata.appLinks;
		for (const platform of [
			"ios",
			"iphone",
			"ipad",
			"android",
			"windows_phone",
			"windows",
			"windows_universal",
			"web"
		]) {
			const entries = al[platform];
			if (!entries) continue;
			const list = Array.isArray(entries) ? entries : [entries];
			for (const entry of list) for (const [k, v] of Object.entries(entry)) {
				if (v === void 0 || v === null) continue;
				const str = String(v);
				const content = k === "url" ? resolveUrl(str) : str;
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					property: `al:${platform}:${k}`,
					content
				}, key++));
			}
		}
	}
	if (metadata.other) for (const [name, content] of Object.entries(metadata.other)) {
		const values = Array.isArray(content) ? content : [content];
		for (const val of values) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name,
			content: val
		}, key++));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(import_jsx_runtime_react_server.Fragment, { children: elements });
}
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/pathMatcher.mjs
var precomputePathRegex = (patterns) => {
	return patterns.map((pattern) => pattern instanceof RegExp ? pattern : pathToRegexp(pattern));
};
/**
* Creates a function that matches paths against a set of patterns.
*
* @param patterns - A string, RegExp, or array of patterns to match against
* @returns A function that takes a pathname and returns true if it matches any of the patterns
*/
var createPathMatcher = (patterns) => {
	const matchers = precomputePathRegex([patterns || ""].flat().filter(Boolean));
	return (pathname) => matchers.some((matcher) => matcher.test(pathname));
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/routeMatcher.js
var createRouteMatcher = (routes) => {
	if (typeof routes === "function") return (req) => routes(req);
	const matcher = createPathMatcher(routes);
	return (req) => matcher(req.nextUrl.pathname);
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/app-router/server/utils.js
var _a, _b;
var CLERK_USE_CACHE_MARKER = Symbol.for("clerk_use_cache_error");
var ClerkUseCacheError = class extends (_b = Error, _a = CLERK_USE_CACHE_MARKER, _b) {
	constructor(message, originalError) {
		super(message);
		this.originalError = originalError;
		this[_a] = true;
		this.name = "ClerkUseCacheError";
	}
};
var isClerkUseCacheError = (e) => {
	return e instanceof Error && CLERK_USE_CACHE_MARKER in e;
};
var USE_CACHE_WITH_DYNAMIC_API_PATTERN = /inside\s+["']use cache["']|["']use cache["'].*(?:headers|cookies)|(?:headers|cookies).*["']use cache["']/i;
var CACHE_SCOPE_PATTERN = /cache scope/i;
var DYNAMIC_DATA_SOURCE_PATTERN = /dynamic data source/i;
var ROUTE_BAILOUT_PATTERN = /Route .*? needs to bail out of prerendering at this point because it used .*?./;
var isPrerenderingBailout = (e) => {
	if (!(e instanceof Error) || !("message" in e)) return false;
	const { message } = e;
	const lowerCaseInput = message.toLowerCase();
	return ROUTE_BAILOUT_PATTERN.test(message) || lowerCaseInput.includes("dynamic server usage") || lowerCaseInput.includes("this page needs to bail out of prerendering") || lowerCaseInput.includes("during prerendering");
};
var isNextjsUseCacheError = (e) => {
	if (!(e instanceof Error)) return false;
	const { message } = e;
	if (USE_CACHE_WITH_DYNAMIC_API_PATTERN.test(message)) return true;
	if (CACHE_SCOPE_PATTERN.test(message) && DYNAMIC_DATA_SOURCE_PATTERN.test(message)) return true;
	return false;
};
var USE_CACHE_ERROR_MESSAGE = `Clerk: auth() and currentUser() cannot be called inside a "use cache" function. These functions access \`headers()\` internally, which is a dynamic API not allowed in cached contexts.

To fix this, call auth() outside the cached function and pass the values you need as arguments:

  import { auth, clerkClient } from '@clerk/nextjs/server';

  async function getCachedUser(userId: string) {
    "use cache";
    const client = await clerkClient();
    return client.users.getUser(userId);
  }

  // In your component/page:
  const { userId } = await auth();
  if (userId) {
    const user = await getCachedUser(userId);
  }`;
async function buildRequestLike() {
	try {
		const { headers } = await import("./assets/headers-C6ItjSdi.js").then((n) => n.l);
		return new NextRequest("https://placeholder.com", { headers: await headers() });
	} catch (e) {
		if (e && isPrerenderingBailout(e)) throw e;
		if (e && isNextjsUseCacheError(e)) throw new ClerkUseCacheError(`${USE_CACHE_ERROR_MESSAGE}

Original error: ${e.message}`, e);
		throw new Error(`Clerk: auth(), currentUser() and clerkClient(), are only supported in App Router (/app directory).
If you're using /pages, try getAuth() instead.
Original error: ${e}`);
	}
}
function getScriptNonceFromHeader(cspHeaderValue) {
	var _a2;
	const directives = cspHeaderValue.split(";").map((directive2) => directive2.trim());
	const directive = directives.find((dir) => dir.startsWith("script-src")) || directives.find((dir) => dir.startsWith("default-src"));
	if (!directive) return;
	const nonce = (_a2 = directive.split(" ").slice(1).map((source) => source.trim()).find((source) => source.startsWith("'nonce-") && source.length > 8 && source.endsWith("'"))) == null ? void 0 : _a2.slice(7, -1);
	if (!nonce) return;
	if (/[&><\u2028\u2029]/g.test(nonce)) throw new Error("Nonce value from Content-Security-Policy contained invalid HTML escape characters, which is disallowed for security reasons. Make sure that your nonce value does not contain the following characters: `<`, `>`, `&`");
	return nonce;
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/middleware-storage.js
var clerkMiddlewareRequestDataStore = /* @__PURE__ */ new Map();
var clerkMiddlewareRequestDataStorage = new AsyncLocalStorage();
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/proxy-BcfViKjn.mjs
/**
*
*/
function isValidProxyUrl(key) {
	if (!key) return true;
	return isHttpOrHttps(key) || isProxyUrlRelative(key);
}
/**
*
*/
function isHttpOrHttps(key) {
	return /^http(s)?:\/\//.test(key || "");
}
/**
*
*/
function isProxyUrlRelative(key) {
	return key.startsWith("/");
}
/**
*
*/
function proxyUrlToAbsoluteURL(url) {
	if (!url) return "";
	return isProxyUrlRelative(url) ? new URL(url, window.location.origin).toString() : url;
}
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/handleValueOrFn-iAIjw-kJ.mjs
/**
*
*/
function handleValueOrFn(value, url, defaultValue) {
	if (typeof value === "function") return value(url);
	if (typeof value !== "undefined") return value;
	if (typeof defaultValue !== "undefined") return defaultValue;
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/constants.js
var constants = { Headers: {
	NextRewrite: "x-middleware-rewrite",
	NextResume: "x-middleware-next",
	NextRedirect: "Location",
	NextUrl: "next-url",
	NextAction: "next-action",
	NextjsData: "x-nextjs-data"
} };
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/vendor/crypto-es.js
var kt = Object.defineProperty;
var bt = (c, t, s) => t in c ? kt(c, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: s
}) : c[t] = s;
var it = (c, t, s) => bt(c, typeof t != "symbol" ? t + "" : t, s);
var lt, ht, dt, pt, xt, _t, at = ((lt = typeof globalThis != "undefined" ? globalThis : void 0) == null ? void 0 : lt.crypto) || ((ht = typeof global != "undefined" ? global : void 0) == null ? void 0 : ht.crypto) || ((dt = typeof window != "undefined" ? window : void 0) == null ? void 0 : dt.crypto) || ((pt = typeof self != "undefined" ? self : void 0) == null ? void 0 : pt.crypto) || ((_t = (xt = typeof frames != "undefined" ? frames : void 0) == null ? void 0 : xt[0]) == null ? void 0 : _t.crypto), Z;
at ? Z = (c) => {
	let t = [];
	for (let s = 0; s < c; s += 4) t.push(at.getRandomValues(new Uint32Array(1))[0]);
	return new u(t, c);
} : Z = (c) => {
	let t = [], s = (e) => {
		let r = e, o = 987654321, n = 4294967295;
		return () => {
			o = 36969 * (o & 65535) + (o >> 16) & n, r = 18e3 * (r & 65535) + (r >> 16) & n;
			let h = (o << 16) + r & n;
			return h /= 4294967296, h += .5, h * (Math.random() > .5 ? 1 : -1);
		};
	};
	for (let e = 0, r; e < c; e += 4) {
		let o = s((r || Math.random()) * 4294967296);
		r = o() * 987654071, t.push(o() * 4294967296 | 0);
	}
	return new u(t, c);
};
var m = class {
	static create(...t) {
		return new this(...t);
	}
	mixIn(t) {
		return Object.assign(this, t);
	}
	clone() {
		let t = new this.constructor();
		return Object.assign(t, this), t;
	}
}, u = class extends m {
	constructor(t = [], s = t.length * 4) {
		super();
		let e = t;
		if (e instanceof ArrayBuffer && (e = new Uint8Array(e)), (e instanceof Int8Array || e instanceof Uint8ClampedArray || e instanceof Int16Array || e instanceof Uint16Array || e instanceof Int32Array || e instanceof Uint32Array || e instanceof Float32Array || e instanceof Float64Array) && (e = new Uint8Array(e.buffer, e.byteOffset, e.byteLength)), e instanceof Uint8Array) {
			let r = e.byteLength, o = [];
			for (let n = 0; n < r; n += 1) o[n >>> 2] |= e[n] << 24 - n % 4 * 8;
			this.words = o, this.sigBytes = r;
		} else this.words = t, this.sigBytes = s;
	}
	toString(t = Mt) {
		return t.stringify(this);
	}
	concat(t) {
		let s = this.words, e = t.words, r = this.sigBytes, o = t.sigBytes;
		if (this.clamp(), r % 4) for (let n = 0; n < o; n += 1) {
			let h = e[n >>> 2] >>> 24 - n % 4 * 8 & 255;
			s[r + n >>> 2] |= h << 24 - (r + n) % 4 * 8;
		}
		else for (let n = 0; n < o; n += 4) s[r + n >>> 2] = e[n >>> 2];
		return this.sigBytes += o, this;
	}
	clamp() {
		let { words: t, sigBytes: s } = this;
		t[s >>> 2] &= 4294967295 << 32 - s % 4 * 8, t.length = Math.ceil(s / 4);
	}
	clone() {
		let t = super.clone.call(this);
		return t.words = this.words.slice(0), t;
	}
};
it(u, "random", Z);
var Mt = {
	stringify(c) {
		let { words: t, sigBytes: s } = c, e = [];
		for (let r = 0; r < s; r += 1) {
			let o = t[r >>> 2] >>> 24 - r % 4 * 8 & 255;
			e.push((o >>> 4).toString(16)), e.push((o & 15).toString(16));
		}
		return e.join("");
	},
	parse(c) {
		let t = c.length, s = [];
		for (let e = 0; e < t; e += 2) s[e >>> 3] |= parseInt(c.substr(e, 2), 16) << 24 - e % 8 * 4;
		return new u(s, t / 2);
	}
}, ft = {
	stringify(c) {
		let { words: t, sigBytes: s } = c, e = [];
		for (let r = 0; r < s; r += 1) {
			let o = t[r >>> 2] >>> 24 - r % 4 * 8 & 255;
			e.push(String.fromCharCode(o));
		}
		return e.join("");
	},
	parse(c) {
		let t = c.length, s = [];
		for (let e = 0; e < t; e += 1) s[e >>> 2] |= (c.charCodeAt(e) & 255) << 24 - e % 4 * 8;
		return new u(s, t);
	}
}, X = {
	stringify(c) {
		try {
			return decodeURIComponent(escape(ft.stringify(c)));
		} catch {
			throw new Error("Malformed UTF-8 data");
		}
	},
	parse(c) {
		return ft.parse(unescape(encodeURIComponent(c)));
	}
}, N = class extends m {
	constructor() {
		super(), this._minBufferSize = 0;
	}
	reset() {
		this._data = new u(), this._nDataBytes = 0;
	}
	_append(t) {
		let s = t;
		typeof s == "string" && (s = X.parse(s)), this._data.concat(s), this._nDataBytes += s.sigBytes;
	}
	_process(t) {
		let s, { _data: e, blockSize: r } = this, o = e.words, n = e.sigBytes, x = n / (r * 4);
		t ? x = Math.ceil(x) : x = Math.max((x | 0) - this._minBufferSize, 0);
		let p = x * r, _ = Math.min(p * 4, n);
		if (p) {
			for (let y = 0; y < p; y += r) this._doProcessBlock(o, y);
			s = o.splice(0, p), e.sigBytes -= _;
		}
		return new u(s, _);
	}
	clone() {
		let t = super.clone.call(this);
		return t._data = this._data.clone(), t;
	}
}, H = class extends N {
	constructor(t) {
		super(), this.blockSize = 512 / 32, this.cfg = Object.assign(new m(), t), this.reset();
	}
	static _createHelper(t) {
		return (s, e) => new t(e).finalize(s);
	}
	static _createHmacHelper(t) {
		return (s, e) => new $(t, e).finalize(s);
	}
	reset() {
		super.reset.call(this), this._doReset();
	}
	update(t) {
		return this._append(t), this._process(), this;
	}
	finalize(t) {
		return t && this._append(t), this._doFinalize();
	}
}, $ = class extends m {
	constructor(t, s) {
		super();
		let e = new t();
		this._hasher = e;
		let r = s;
		typeof r == "string" && (r = X.parse(r));
		let o = e.blockSize, n = o * 4;
		r.sigBytes > n && (r = e.finalize(s)), r.clamp();
		let h = r.clone();
		this._oKey = h;
		let x = r.clone();
		this._iKey = x;
		let p = h.words, _ = x.words;
		for (let y = 0; y < o; y += 1) p[y] ^= 1549556828, _[y] ^= 909522486;
		h.sigBytes = n, x.sigBytes = n, this.reset();
	}
	reset() {
		let t = this._hasher;
		t.reset(), t.update(this._iKey);
	}
	update(t) {
		return this._hasher.update(t), this;
	}
	finalize(t) {
		let s = this._hasher, e = s.finalize(t);
		return s.reset(), s.finalize(this._oKey.clone().concat(e));
	}
};
var zt = (c, t, s) => {
	let e = [], r = 0;
	for (let o = 0; o < t; o += 1) if (o % 4) {
		let x = s[c.charCodeAt(o - 1)] << o % 4 * 2 | s[c.charCodeAt(o)] >>> 6 - o % 4 * 2;
		e[r >>> 2] |= x << 24 - r % 4 * 8, r += 1;
	}
	return u.create(e, r);
}, tt = {
	stringify(c) {
		let { words: t, sigBytes: s } = c, e = this._map;
		c.clamp();
		let r = [];
		for (let n = 0; n < s; n += 3) {
			let h = t[n >>> 2] >>> 24 - n % 4 * 8 & 255, x = t[n + 1 >>> 2] >>> 24 - (n + 1) % 4 * 8 & 255, p = t[n + 2 >>> 2] >>> 24 - (n + 2) % 4 * 8 & 255, _ = h << 16 | x << 8 | p;
			for (let y = 0; y < 4 && n + y * .75 < s; y += 1) r.push(e.charAt(_ >>> 6 * (3 - y) & 63));
		}
		let o = e.charAt(64);
		if (o) for (; r.length % 4;) r.push(o);
		return r.join("");
	},
	parse(c) {
		let t = c.length, s = this._map, e = this._reverseMap;
		if (!e) {
			this._reverseMap = [], e = this._reverseMap;
			for (let o = 0; o < s.length; o += 1) e[s.charCodeAt(o)] = o;
		}
		let r = s.charAt(64);
		if (r) {
			let o = c.indexOf(r);
			o !== -1 && (t = o);
		}
		return zt(c, t, e);
	},
	_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
};
var d = [];
for (let c = 0; c < 64; c += 1) d[c] = Math.abs(Math.sin(c + 1)) * 4294967296 | 0;
var w = (c, t, s, e, r, o, n) => {
	let h = c + (t & s | ~t & e) + r + n;
	return (h << o | h >>> 32 - o) + t;
}, B = (c, t, s, e, r, o, n) => {
	let h = c + (t & e | s & ~e) + r + n;
	return (h << o | h >>> 32 - o) + t;
}, k = (c, t, s, e, r, o, n) => {
	let h = c + (t ^ s ^ e) + r + n;
	return (h << o | h >>> 32 - o) + t;
}, b = (c, t, s, e, r, o, n) => {
	let h = c + (s ^ (t | ~e)) + r + n;
	return (h << o | h >>> 32 - o) + t;
}, L = class extends H {
	_doReset() {
		this._hash = new u([
			1732584193,
			4023233417,
			2562383102,
			271733878
		]);
	}
	_doProcessBlock(t, s) {
		let e = t;
		for (let Y = 0; Y < 16; Y += 1) {
			let ct = s + Y, G = t[ct];
			e[ct] = (G << 8 | G >>> 24) & 16711935 | (G << 24 | G >>> 8) & 4278255360;
		}
		let r = this._hash.words, o = e[s + 0], n = e[s + 1], h = e[s + 2], x = e[s + 3], p = e[s + 4], _ = e[s + 5], y = e[s + 6], M = e[s + 7], z = e[s + 8], v = e[s + 9], g = e[s + 10], O = e[s + 11], S = e[s + 12], P = e[s + 13], I = e[s + 14], W = e[s + 15], i = r[0], a = r[1], f = r[2], l = r[3];
		i = w(i, a, f, l, o, 7, d[0]), l = w(l, i, a, f, n, 12, d[1]), f = w(f, l, i, a, h, 17, d[2]), a = w(a, f, l, i, x, 22, d[3]), i = w(i, a, f, l, p, 7, d[4]), l = w(l, i, a, f, _, 12, d[5]), f = w(f, l, i, a, y, 17, d[6]), a = w(a, f, l, i, M, 22, d[7]), i = w(i, a, f, l, z, 7, d[8]), l = w(l, i, a, f, v, 12, d[9]), f = w(f, l, i, a, g, 17, d[10]), a = w(a, f, l, i, O, 22, d[11]), i = w(i, a, f, l, S, 7, d[12]), l = w(l, i, a, f, P, 12, d[13]), f = w(f, l, i, a, I, 17, d[14]), a = w(a, f, l, i, W, 22, d[15]), i = B(i, a, f, l, n, 5, d[16]), l = B(l, i, a, f, y, 9, d[17]), f = B(f, l, i, a, O, 14, d[18]), a = B(a, f, l, i, o, 20, d[19]), i = B(i, a, f, l, _, 5, d[20]), l = B(l, i, a, f, g, 9, d[21]), f = B(f, l, i, a, W, 14, d[22]), a = B(a, f, l, i, p, 20, d[23]), i = B(i, a, f, l, v, 5, d[24]), l = B(l, i, a, f, I, 9, d[25]), f = B(f, l, i, a, x, 14, d[26]), a = B(a, f, l, i, z, 20, d[27]), i = B(i, a, f, l, P, 5, d[28]), l = B(l, i, a, f, h, 9, d[29]), f = B(f, l, i, a, M, 14, d[30]), a = B(a, f, l, i, S, 20, d[31]), i = k(i, a, f, l, _, 4, d[32]), l = k(l, i, a, f, z, 11, d[33]), f = k(f, l, i, a, O, 16, d[34]), a = k(a, f, l, i, I, 23, d[35]), i = k(i, a, f, l, n, 4, d[36]), l = k(l, i, a, f, p, 11, d[37]), f = k(f, l, i, a, M, 16, d[38]), a = k(a, f, l, i, g, 23, d[39]), i = k(i, a, f, l, P, 4, d[40]), l = k(l, i, a, f, o, 11, d[41]), f = k(f, l, i, a, x, 16, d[42]), a = k(a, f, l, i, y, 23, d[43]), i = k(i, a, f, l, v, 4, d[44]), l = k(l, i, a, f, S, 11, d[45]), f = k(f, l, i, a, W, 16, d[46]), a = k(a, f, l, i, h, 23, d[47]), i = b(i, a, f, l, o, 6, d[48]), l = b(l, i, a, f, M, 10, d[49]), f = b(f, l, i, a, I, 15, d[50]), a = b(a, f, l, i, _, 21, d[51]), i = b(i, a, f, l, S, 6, d[52]), l = b(l, i, a, f, x, 10, d[53]), f = b(f, l, i, a, g, 15, d[54]), a = b(a, f, l, i, n, 21, d[55]), i = b(i, a, f, l, z, 6, d[56]), l = b(l, i, a, f, W, 10, d[57]), f = b(f, l, i, a, y, 15, d[58]), a = b(a, f, l, i, P, 21, d[59]), i = b(i, a, f, l, p, 6, d[60]), l = b(l, i, a, f, O, 10, d[61]), f = b(f, l, i, a, h, 15, d[62]), a = b(a, f, l, i, v, 21, d[63]), r[0] = r[0] + i | 0, r[1] = r[1] + a | 0, r[2] = r[2] + f | 0, r[3] = r[3] + l | 0;
	}
	_doFinalize() {
		let t = this._data, s = t.words, e = this._nDataBytes * 8, r = t.sigBytes * 8;
		s[r >>> 5] |= 128 << 24 - r % 32;
		let o = Math.floor(e / 4294967296), n = e;
		s[(r + 64 >>> 9 << 4) + 15] = (o << 8 | o >>> 24) & 16711935 | (o << 24 | o >>> 8) & 4278255360, s[(r + 64 >>> 9 << 4) + 14] = (n << 8 | n >>> 24) & 16711935 | (n << 24 | n >>> 8) & 4278255360, t.sigBytes = (s.length + 1) * 4, this._process();
		let h = this._hash, x = h.words;
		for (let p = 0; p < 4; p += 1) {
			let _ = x[p];
			x[p] = (_ << 8 | _ >>> 24) & 16711935 | (_ << 24 | _ >>> 8) & 4278255360;
		}
		return h;
	}
	clone() {
		let t = super.clone.call(this);
		return t._hash = this._hash.clone(), t;
	}
};
H._createHelper(L);
H._createHmacHelper(L);
var T$1 = class extends m {
	constructor(t) {
		super(), this.cfg = Object.assign(new m(), {
			keySize: 128 / 32,
			hasher: L,
			iterations: 1
		}, t);
	}
	compute(t, s) {
		let e, { cfg: r } = this, o = r.hasher.create(), n = u.create(), h = n.words, { keySize: x, iterations: p } = r;
		for (; h.length < x;) {
			e && o.update(e), e = o.update(t).finalize(s), o.reset();
			for (let _ = 1; _ < p; _ += 1) e = o.finalize(e), o.reset();
			n.concat(e);
		}
		return n.sigBytes = x * 4, n;
	}
};
var C = class extends N {
	constructor(t, s, e) {
		super(), this.cfg = Object.assign(new m(), e), this._xformMode = t, this._key = s, this.reset();
	}
	static createEncryptor(t, s) {
		return this.create(this._ENC_XFORM_MODE, t, s);
	}
	static createDecryptor(t, s) {
		return this.create(this._DEC_XFORM_MODE, t, s);
	}
	static _createHelper(t) {
		let s = (e) => typeof e == "string" ? q : E;
		return {
			encrypt(e, r, o) {
				return s(r).encrypt(t, e, r, o);
			},
			decrypt(e, r, o) {
				return s(r).decrypt(t, e, r, o);
			}
		};
	}
	reset() {
		super.reset.call(this), this._doReset();
	}
	process(t) {
		return this._append(t), this._process();
	}
	finalize(t) {
		return t && this._append(t), this._doFinalize();
	}
};
C._ENC_XFORM_MODE = 1;
C._DEC_XFORM_MODE = 2;
C.keySize = 128 / 32;
C.ivSize = 128 / 32;
var et = class extends m {
	constructor(t, s) {
		super(), this._cipher = t, this._iv = s;
	}
	static createEncryptor(t, s) {
		return this.Encryptor.create(t, s);
	}
	static createDecryptor(t, s) {
		return this.Decryptor.create(t, s);
	}
};
function yt(c, t, s) {
	let e = c, r, o = this._iv;
	o ? (r = o, this._iv = void 0) : r = this._prevBlock;
	for (let n = 0; n < s; n += 1) e[t + n] ^= r[n];
}
var j = class extends et {};
j.Encryptor = class extends j {
	processBlock(c, t) {
		let s = this._cipher, { blockSize: e } = s;
		yt.call(this, c, t, e), s.encryptBlock(c, t), this._prevBlock = c.slice(t, t + e);
	}
};
j.Decryptor = class extends j {
	processBlock(c, t) {
		let s = this._cipher, { blockSize: e } = s, r = c.slice(t, t + e);
		s.decryptBlock(c, t), yt.call(this, c, t, e), this._prevBlock = r;
	}
};
var vt = {
	pad(c, t) {
		let s = t * 4, e = s - c.sigBytes % s, r = e << 24 | e << 16 | e << 8 | e, o = [];
		for (let h = 0; h < e; h += 4) o.push(r);
		let n = u.create(o, e);
		c.concat(n);
	},
	unpad(c) {
		let t = c, s = t.words[t.sigBytes - 1 >>> 2] & 255;
		t.sigBytes -= s;
	}
}, U = class extends C {
	constructor(t, s, e) {
		super(t, s, Object.assign({
			mode: j,
			padding: vt
		}, e)), this.blockSize = 128 / 32;
	}
	reset() {
		let t;
		super.reset.call(this);
		let { cfg: s } = this, { iv: e, mode: r } = s;
		this._xformMode === this.constructor._ENC_XFORM_MODE ? t = r.createEncryptor : (t = r.createDecryptor, this._minBufferSize = 1), this._mode = t.call(r, this, e && e.words), this._mode.__creator = t;
	}
	_doProcessBlock(t, s) {
		this._mode.processBlock(t, s);
	}
	_doFinalize() {
		let t, { padding: s } = this.cfg;
		return this._xformMode === this.constructor._ENC_XFORM_MODE ? (s.pad(this._data, this.blockSize), t = this._process(!0)) : (t = this._process(!0), s.unpad(t)), t;
	}
}, V = class extends m {
	constructor(t) {
		super(), this.mixIn(t);
	}
	toString(t) {
		return (t || this.formatter).stringify(this);
	}
}, Rt = {
	stringify(c) {
		let t, { ciphertext: s, salt: e } = c;
		return e ? t = u.create([1398893684, 1701076831]).concat(e).concat(s) : t = s, t.toString(tt);
	},
	parse(c) {
		let t, s = tt.parse(c), e = s.words;
		return e[0] === 1398893684 && e[1] === 1701076831 && (t = u.create(e.slice(2, 4)), e.splice(0, 4), s.sigBytes -= 16), V.create({
			ciphertext: s,
			salt: t
		});
	}
}, E = class extends m {
	static encrypt(t, s, e, r) {
		let o = Object.assign(new m(), this.cfg, r), n = t.createEncryptor(e, o), h = n.finalize(s), x = n.cfg;
		return V.create({
			ciphertext: h,
			key: e,
			iv: x.iv,
			algorithm: t,
			mode: x.mode,
			padding: x.padding,
			blockSize: n.blockSize,
			formatter: o.format
		});
	}
	static decrypt(t, s, e, r) {
		let o = s, n = Object.assign(new m(), this.cfg, r);
		return o = this._parse(o, n.format), t.createDecryptor(e, n).finalize(o.ciphertext);
	}
	static _parse(t, s) {
		return typeof t == "string" ? s.parse(t, this) : t;
	}
};
E.cfg = Object.assign(new m(), { format: Rt });
var Ft = { execute(c, t, s, e, r) {
	let o = e;
	o || (o = u.random(64 / 8));
	let n;
	r ? n = T$1.create({
		keySize: t + s,
		hasher: r
	}).compute(c, o) : n = T$1.create({ keySize: t + s }).compute(c, o);
	let h = u.create(n.words.slice(t), s * 4);
	return n.sigBytes = t * 4, V.create({
		key: n,
		iv: h,
		salt: o
	});
} }, q = class extends E {
	static encrypt(t, s, e, r) {
		let o = Object.assign(new m(), this.cfg, r), n = o.kdf.execute(e, t.keySize, t.ivSize, o.salt, o.hasher);
		o.iv = n.iv;
		let h = E.encrypt.call(this, t, s, n.key, o);
		return h.mixIn(n), h;
	}
	static decrypt(t, s, e, r) {
		let o = s, n = Object.assign(new m(), this.cfg, r);
		o = this._parse(o, n.format);
		let h = n.kdf.execute(e, t.keySize, t.ivSize, o.salt, n.hasher);
		return n.iv = h.iv, E.decrypt.call(this, t, o, h.key, n);
	}
};
q.cfg = Object.assign(E.cfg, { kdf: Ft });
var R = [], ut = [], gt = [], mt = [], wt = [], Bt = [], st = [], rt = [], ot = [], nt = [], A = [];
for (let c = 0; c < 256; c += 1) c < 128 ? A[c] = c << 1 : A[c] = c << 1 ^ 283;
var F = 0, D$1 = 0;
for (let c = 0; c < 256; c += 1) {
	let t = D$1 ^ D$1 << 1 ^ D$1 << 2 ^ D$1 << 3 ^ D$1 << 4;
	t = t >>> 8 ^ t & 255 ^ 99, R[F] = t, ut[t] = F;
	let s = A[F], e = A[s], r = A[e], o = A[t] * 257 ^ t * 16843008;
	gt[F] = o << 24 | o >>> 8, mt[F] = o << 16 | o >>> 16, wt[F] = o << 8 | o >>> 24, Bt[F] = o, o = r * 16843009 ^ e * 65537 ^ s * 257 ^ F * 16843008, st[t] = o << 24 | o >>> 8, rt[t] = o << 16 | o >>> 16, ot[t] = o << 8 | o >>> 24, nt[t] = o, F ? (F = s ^ A[A[A[r ^ s]]], D$1 ^= A[A[D$1]]) : (D$1 = 1, F = D$1);
}
var At = [
	0,
	1,
	2,
	4,
	8,
	16,
	32,
	64,
	128,
	27,
	54
], J = class extends U {
	_doReset() {
		let t;
		if (this._nRounds && this._keyPriorReset === this._key) return;
		this._keyPriorReset = this._key;
		let s = this._keyPriorReset, e = s.words, r = s.sigBytes / 4;
		this._nRounds = r + 6;
		let n = (this._nRounds + 1) * 4;
		this._keySchedule = [];
		let h = this._keySchedule;
		for (let p = 0; p < n; p += 1) p < r ? h[p] = e[p] : (t = h[p - 1], p % r ? r > 6 && p % r === 4 && (t = R[t >>> 24] << 24 | R[t >>> 16 & 255] << 16 | R[t >>> 8 & 255] << 8 | R[t & 255]) : (t = t << 8 | t >>> 24, t = R[t >>> 24] << 24 | R[t >>> 16 & 255] << 16 | R[t >>> 8 & 255] << 8 | R[t & 255], t ^= At[p / r | 0] << 24), h[p] = h[p - r] ^ t);
		this._invKeySchedule = [];
		let x = this._invKeySchedule;
		for (let p = 0; p < n; p += 1) {
			let _ = n - p;
			p % 4 ? t = h[_] : t = h[_ - 4], p < 4 || _ <= 4 ? x[p] = t : x[p] = st[R[t >>> 24]] ^ rt[R[t >>> 16 & 255]] ^ ot[R[t >>> 8 & 255]] ^ nt[R[t & 255]];
		}
	}
	encryptBlock(t, s) {
		this._doCryptBlock(t, s, this._keySchedule, gt, mt, wt, Bt, R);
	}
	decryptBlock(t, s) {
		let e = t, r = e[s + 1];
		e[s + 1] = e[s + 3], e[s + 3] = r, this._doCryptBlock(e, s, this._invKeySchedule, st, rt, ot, nt, ut), r = e[s + 1], e[s + 1] = e[s + 3], e[s + 3] = r;
	}
	_doCryptBlock(t, s, e, r, o, n, h, x) {
		let p = t, _ = this._nRounds, y = p[s] ^ e[0], M = p[s + 1] ^ e[1], z = p[s + 2] ^ e[2], v = p[s + 3] ^ e[3], g = 4;
		for (let W = 1; W < _; W += 1) {
			let i = r[y >>> 24] ^ o[M >>> 16 & 255] ^ n[z >>> 8 & 255] ^ h[v & 255] ^ e[g];
			g += 1;
			let a = r[M >>> 24] ^ o[z >>> 16 & 255] ^ n[v >>> 8 & 255] ^ h[y & 255] ^ e[g];
			g += 1;
			let f = r[z >>> 24] ^ o[v >>> 16 & 255] ^ n[y >>> 8 & 255] ^ h[M & 255] ^ e[g];
			g += 1;
			let l = r[v >>> 24] ^ o[y >>> 16 & 255] ^ n[M >>> 8 & 255] ^ h[z & 255] ^ e[g];
			g += 1, y = i, M = a, z = f, v = l;
		}
		let O = (x[y >>> 24] << 24 | x[M >>> 16 & 255] << 16 | x[z >>> 8 & 255] << 8 | x[v & 255]) ^ e[g];
		g += 1;
		let S = (x[M >>> 24] << 24 | x[z >>> 16 & 255] << 16 | x[v >>> 8 & 255] << 8 | x[y & 255]) ^ e[g];
		g += 1;
		let P = (x[z >>> 24] << 24 | x[v >>> 16 & 255] << 16 | x[y >>> 8 & 255] << 8 | x[M & 255]) ^ e[g];
		g += 1;
		let I = (x[v >>> 24] << 24 | x[y >>> 16 & 255] << 16 | x[M >>> 8 & 255] << 8 | x[z & 255]) ^ e[g];
		g += 1, p[s] = O, p[s + 1] = S, p[s + 2] = P, p[s + 3] = I;
	}
};
J.keySize = 256 / 32;
var Ht = U._createHelper(J), K = [], Q = class extends H {
	_doReset() {
		this._hash = new u([
			1732584193,
			4023233417,
			2562383102,
			271733878,
			3285377520
		]);
	}
	_doProcessBlock(t, s) {
		let e = this._hash.words, r = e[0], o = e[1], n = e[2], h = e[3], x = e[4];
		for (let p = 0; p < 80; p += 1) {
			if (p < 16) K[p] = t[s + p] | 0;
			else {
				let y = K[p - 3] ^ K[p - 8] ^ K[p - 14] ^ K[p - 16];
				K[p] = y << 1 | y >>> 31;
			}
			let _ = (r << 5 | r >>> 27) + x + K[p];
			p < 20 ? _ += (o & n | ~o & h) + 1518500249 : p < 40 ? _ += (o ^ n ^ h) + 1859775393 : p < 60 ? _ += (o & n | o & h | n & h) - 1894007588 : _ += (o ^ n ^ h) - 899497514, x = h, h = n, n = o << 30 | o >>> 2, o = r, r = _;
		}
		e[0] = e[0] + r | 0, e[1] = e[1] + o | 0, e[2] = e[2] + n | 0, e[3] = e[3] + h | 0, e[4] = e[4] + x | 0;
	}
	_doFinalize() {
		let t = this._data, s = t.words, e = this._nDataBytes * 8, r = t.sigBytes * 8;
		return s[r >>> 5] |= 128 << 24 - r % 32, s[(r + 64 >>> 9 << 4) + 14] = Math.floor(e / 4294967296), s[(r + 64 >>> 9 << 4) + 15] = e, t.sigBytes = s.length * 4, this._process(), this._hash;
	}
	clone() {
		let t = super.clone.call(this);
		return t._hash = this._hash.clone(), t;
	}
};
H._createHelper(Q);
var Dt = H._createHmacHelper(Q);
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/errors.js
var missingDomainAndProxy = `
Missing domain and proxyUrl. A satellite application needs to specify a domain or a proxyUrl.

1) With middleware
   e.g. export default clerkMiddleware({domain:'YOUR_DOMAIN',isSatellite:true});
2) With environment variables e.g.
   NEXT_PUBLIC_CLERK_DOMAIN='YOUR_DOMAIN'
   NEXT_PUBLIC_CLERK_IS_SATELLITE='true'
   `;
var missingSignInUrlInDev = `
Invalid signInUrl. A satellite application requires a signInUrl for development instances.
Check if signInUrl is missing from your configuration or if it is not an absolute URL

1) With middleware
   e.g. export default clerkMiddleware({signInUrl:'SOME_URL', isSatellite:true});
2) With environment variables e.g.
   NEXT_PUBLIC_CLERK_SIGN_IN_URL='SOME_URL'
   NEXT_PUBLIC_CLERK_IS_SATELLITE='true'`;
var getAuthAuthHeaderMissing = () => authAuthHeaderMissing("getAuth", void 0, middlewareFileReference);
var authAuthHeaderMissing = (helperName = "auth", prefixSteps, fileReference = "middleware") => {
	return `Clerk: ${helperName}() was called but Clerk can't detect usage of clerkMiddleware(). Please ensure the following:
- ${prefixSteps ? [...prefixSteps, ""].join("\n- ") : " "}clerkMiddleware() is used in your Next.js ${fileReference} file.
- Your ${fileReference} matcher is configured to match this route or page.
- If you are using the src directory, make sure the ${fileReference} file is inside of it.

For more details, see https://clerk.com/err/auth-middleware
`;
};
var authSignatureInvalid = `Clerk: Unable to verify request, this usually means the Clerk middleware did not run. Ensure Clerk's middleware is properly integrated and matches the current route. For more information, see: https://clerk.com/docs/reference/nextjs/clerk-middleware. (code=auth_signature_invalid)`;
var encryptionKeyInvalid = `Clerk: Unable to decrypt request data, this usually means the encryption key is invalid. Ensure the encryption key is properly set. For more information, see: https://clerk.com/docs/reference/nextjs/clerk-middleware#dynamic-keys. (code=encryption_key_invalid)`;
var encryptionKeyInvalidDev = `Clerk: Unable to decrypt request data.

Refresh the page if your .env file was just updated. If the issue persists, ensure the encryption key is valid and properly set.

For more information, see: https://clerk.com/docs/reference/nextjs/clerk-middleware#dynamic-keys. (code=encryption_key_invalid)`;
var encryptionKeyMissing = "Clerk: Missing `CLERK_ENCRYPTION_KEY`. Required for propagating `secretKey` middleware option. See docs: https://clerk.com/docs/references/nextjs/clerk-middleware#dynamic-keys. (code=encryption_key_missing)";
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/utils.js
var OVERRIDE_HEADERS = "x-middleware-override-headers";
var MIDDLEWARE_HEADER_PREFIX = "x-middleware-request";
var setRequestHeadersOnNextResponse = (res, req, newHeaders) => {
	if (!res.headers.get(OVERRIDE_HEADERS)) {
		res.headers.set(OVERRIDE_HEADERS, [...req.headers.keys()]);
		req.headers.forEach((val, key) => {
			res.headers.set(`${MIDDLEWARE_HEADER_PREFIX}-${key}`, val);
		});
	}
	Object.entries(newHeaders).forEach(([key, val]) => {
		res.headers.set(OVERRIDE_HEADERS, `${res.headers.get(OVERRIDE_HEADERS)},${key}`);
		res.headers.set(`${MIDDLEWARE_HEADER_PREFIX}-${key}`, val);
	});
};
function decorateRequest(req, res, requestState, requestData, keylessMode, machineAuthObject) {
	const { reason, message, status, token } = requestState;
	if (!res) res = NextResponse.next();
	if (res.headers.get(constants.Headers.NextRedirect)) return res;
	let rewriteURL;
	if (res.headers.get(constants.Headers.NextResume) === "1") {
		res.headers.delete(constants.Headers.NextResume);
		rewriteURL = new URL(req.url);
	}
	const rewriteURLHeader = res.headers.get(constants.Headers.NextRewrite);
	if (rewriteURLHeader) {
		const reqURL = new URL(req.url);
		rewriteURL = new URL(rewriteURLHeader);
		if (rewriteURL.origin !== reqURL.origin) return res;
	}
	if (rewriteURL) {
		const clerkRequestData = encryptClerkRequestData(requestData, keylessMode, machineAuthObject);
		setRequestHeadersOnNextResponse(res, req, {
			[constants$1.Headers.AuthStatus]: status,
			[constants$1.Headers.AuthToken]: token || "",
			[constants$1.Headers.AuthSignature]: token ? createTokenSignature(token, (requestData == null ? void 0 : requestData.secretKey) || SECRET_KEY || keylessMode.secretKey || "") : "",
			[constants$1.Headers.AuthMessage]: message || "",
			[constants$1.Headers.AuthReason]: reason || "",
			[constants$1.Headers.ClerkUrl]: req.clerkUrl.toString(),
			...clerkRequestData ? { [constants$1.Headers.ClerkRequestData]: clerkRequestData } : {}
		});
		res.headers.set(constants.Headers.NextRewrite, rewriteURL.href);
	}
	return res;
}
var handleMultiDomainAndProxy = (clerkRequest, opts) => {
	const relativeOrAbsoluteProxyUrl = handleValueOrFn(opts == null ? void 0 : opts.proxyUrl, clerkRequest.clerkUrl, PROXY_URL);
	let proxyUrl;
	if (!!relativeOrAbsoluteProxyUrl && !isHttpOrHttps(relativeOrAbsoluteProxyUrl)) proxyUrl = new URL(relativeOrAbsoluteProxyUrl, clerkRequest.clerkUrl).toString();
	else proxyUrl = relativeOrAbsoluteProxyUrl;
	const isSatellite = handleValueOrFn(opts.isSatellite, new URL(clerkRequest.url), IS_SATELLITE);
	const domain = handleValueOrFn(opts.domain, new URL(clerkRequest.url), DOMAIN);
	const signInUrl = (opts == null ? void 0 : opts.signInUrl) || SIGN_IN_URL;
	if (isSatellite && !proxyUrl && !domain) throw new Error(missingDomainAndProxy);
	if (isSatellite && !isHttpOrHttps(signInUrl) && isDevelopmentFromSecretKey(opts.secretKey || SECRET_KEY)) throw new Error(missingSignInUrlInDev);
	return {
		proxyUrl,
		isSatellite,
		domain,
		signInUrl
	};
};
var redirectAdapter = (url) => {
	return NextResponse.redirect(url, { headers: { [constants$1.Headers.ClerkRedirectTo]: "true" } });
};
function assertAuthStatus(req, error) {
	if (!detectClerkMiddleware(req)) throw new Error(error);
}
function assertKey(key, onError) {
	if (!key) onError();
	return key;
}
function createTokenSignature(token, key) {
	return Dt(token, key).toString();
}
function assertTokenSignature(token, key, signature) {
	if (!signature) throw new Error(authSignatureInvalid);
	if (createTokenSignature(token, key) !== signature) throw new Error(authSignatureInvalid);
}
var KEYLESS_ENCRYPTION_KEY = "clerk_keyless_dummy_key";
function encryptClerkRequestData(requestData, keylessModeKeys, machineAuthObject) {
	const isEmpty = (obj) => {
		if (!obj) return true;
		return !Object.values(obj).some((v) => v !== void 0);
	};
	if (isEmpty(requestData) && isEmpty(keylessModeKeys) && !machineAuthObject) return;
	if (requestData.secretKey && !ENCRYPTION_KEY) throw new Error(encryptionKeyMissing);
	const maybeKeylessEncryptionKey = isProductionEnvironment() ? ENCRYPTION_KEY || assertKey(SECRET_KEY, () => errorThrower$1.throwMissingSecretKeyError()) : ENCRYPTION_KEY || SECRET_KEY || KEYLESS_ENCRYPTION_KEY;
	return Ht.encrypt(JSON.stringify({
		...keylessModeKeys,
		...requestData,
		machineAuthObject: machineAuthObject != null ? machineAuthObject : void 0
	}), maybeKeylessEncryptionKey).toString();
}
function decryptClerkRequestData(encryptedRequestData) {
	if (!encryptedRequestData) return {};
	const maybeKeylessEncryptionKey = isProductionEnvironment() ? ENCRYPTION_KEY || SECRET_KEY : ENCRYPTION_KEY || SECRET_KEY || KEYLESS_ENCRYPTION_KEY;
	try {
		return decryptData(encryptedRequestData, maybeKeylessEncryptionKey);
	} catch {
		if (canUseKeyless) try {
			return decryptData(encryptedRequestData, KEYLESS_ENCRYPTION_KEY);
		} catch {
			throwInvalidEncryptionKey();
		}
		throwInvalidEncryptionKey();
	}
}
function throwInvalidEncryptionKey() {
	if (isProductionEnvironment()) throw new Error(encryptionKeyInvalid);
	throw new Error(encryptionKeyInvalidDev);
}
function decryptData(data, key) {
	const encoded = Ht.decrypt(data, key).toString(X);
	return JSON.parse(encoded);
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/clerkClient.js
var clerkClient = async () => {
	var _a, _b;
	let requestData;
	try {
		requestData = decryptClerkRequestData(getHeader(await buildRequestLike(), constants$1.Headers.ClerkRequestData));
	} catch (err) {
		if (err && isPrerenderingBailout(err)) throw err;
		if (err && isClerkUseCacheError(err)) throw err;
	}
	const options = (_b = (_a = clerkMiddlewareRequestDataStorage.getStore()) == null ? void 0 : _a.get("requestData")) != null ? _b : requestData;
	if ((options == null ? void 0 : options.secretKey) || (options == null ? void 0 : options.publishableKey)) return createClerkClientWithOptions(options);
	return createClerkClientWithOptions({});
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/utils/logFormatter.js
var maskSecretKey = (str) => {
	if (!str || typeof str !== "string") return str;
	try {
		return (str || "").replace(/^(sk_(live|test)_)(.+?)(.{3})$/, "$1*********$4");
	} catch {
		return "";
	}
};
var logFormatter = (entry) => {
	return (Array.isArray(entry) ? entry : [entry]).map((entry2) => {
		if (typeof entry2 === "string") return maskSecretKey(entry2);
		const masked = Object.fromEntries(Object.entries(entry2).map(([k, v]) => [k, maskSecretKey(v)]));
		return JSON.stringify(masked, null, 2);
	}).join(", ");
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/utils/debugLogger.js
var createDebugLogger = (name, formatter) => () => {
	const entries = [];
	let isEnabled = false;
	return {
		enable: () => {
			isEnabled = true;
		},
		debug: (...args) => {
			if (isEnabled) entries.push(args.map((arg) => typeof arg === "function" ? arg() : arg));
		},
		commit: () => {
			if (isEnabled) {
				console.log(debugLogHeader(name));
				for (const log of entries) {
					let output = formatter(log);
					output = output.split("\n").map((l) => `  ${l}`).join("\n");
					if (process.env.VERCEL) output = truncate(output, 4096);
					console.log(output);
				}
				console.log(debugLogFooter(name));
			}
		}
	};
};
var withLogger = (loggerFactoryOrName, handlerCtor) => {
	return ((...args) => {
		const logger = (typeof loggerFactoryOrName === "string" ? createDebugLogger(loggerFactoryOrName, logFormatter) : loggerFactoryOrName)();
		const handler = handlerCtor(logger);
		try {
			const res = handler(...args);
			if (typeof res === "object" && "then" in res && typeof res.then === "function") return res.then((val) => {
				logger.commit();
				return val;
			}).catch((err) => {
				logger.commit();
				throw err;
			});
			logger.commit();
			return res;
		} catch (err) {
			logger.commit();
			throw err;
		}
	});
};
function debugLogHeader(name) {
	return `[clerk debug start: ${name}]`;
}
function debugLogFooter(name) {
	return `[clerk debug end: ${name}] (@clerk/nextjs=7.0.7,next=${package_default.version},timestamp=${Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3)})`;
}
function truncate(str, maxLength) {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder("utf-8");
	const truncatedString = encoder.encode(str).slice(0, maxLength);
	return decoder.decode(truncatedString).replace(/\uFFFD/g, "");
}
//#endregion
//#region node_modules/@clerk/backend/dist/jwt/index.mjs
function encodeJwtData(value) {
	const stringified = JSON.stringify(value);
	const encoded = new TextEncoder().encode(stringified);
	return base64url.stringify(encoded, { pad: false });
}
async function signJwt(payload, key, options) {
	if (!options.algorithm) throw new Error("No algorithm specified");
	const encoder = new TextEncoder();
	const algorithm = getCryptoAlgorithm(options.algorithm);
	if (!algorithm) return { errors: [new SignJWTError(`Unsupported algorithm ${options.algorithm}`)] };
	const cryptoKey = await importKey(key, algorithm, "sign");
	const header = options.header || { typ: "JWT" };
	header.alg = options.algorithm;
	payload.iat = Math.floor(Date.now() / 1e3);
	const firstPart = `${encodeJwtData(header)}.${encodeJwtData(payload)}`;
	try {
		const signature = await runtime.crypto.subtle.sign(algorithm, cryptoKey, encoder.encode(firstPart));
		return { data: `${firstPart}.${base64url.stringify(new Uint8Array(signature), { pad: false })}` };
	} catch (error) {
		return { errors: [new SignJWTError(error?.message)] };
	}
}
withLegacyReturn(verifyJwt);
var decodeJwt2 = withLegacySyncReturn(decodeJwt);
withLegacyReturn(signJwt);
withLegacyReturn(hasValidSignature);
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/data/getAuthDataFromRequest.js
var getAuthHeaders = (req) => {
	return {
		authStatus: getAuthKeyFromRequest(req, "AuthStatus"),
		authToken: getAuthKeyFromRequest(req, "AuthToken"),
		authMessage: getAuthKeyFromRequest(req, "AuthMessage"),
		authReason: getAuthKeyFromRequest(req, "AuthReason"),
		authSignature: getAuthKeyFromRequest(req, "AuthSignature")
	};
};
var createAuthOptions = (req, opts, treatPendingAsSignedOut = true) => {
	const decryptedRequestData = decryptClerkRequestData(getHeader(req, constants$1.Headers.ClerkRequestData));
	return {
		secretKey: (opts == null ? void 0 : opts.secretKey) || decryptedRequestData.secretKey || SECRET_KEY,
		publishableKey: decryptedRequestData.publishableKey || "pk_test_bW92ZWQtY3JhbmUtMjIuY2xlcmsuYWNjb3VudHMuZGV2JA",
		apiUrl: API_URL,
		apiVersion: API_VERSION,
		authStatus: getAuthKeyFromRequest(req, "AuthStatus"),
		authMessage: getAuthKeyFromRequest(req, "AuthMessage"),
		authReason: getAuthKeyFromRequest(req, "AuthReason"),
		treatPendingAsSignedOut
	};
};
var getSessionAuthDataFromRequest = (req, { treatPendingAsSignedOut = true, ...opts } = {}) => {
	var _a, _b;
	const { authStatus, authMessage, authReason, authToken, authSignature } = getAuthHeaders(req);
	(_a = opts.logger) == null || _a.debug("headers", {
		authStatus,
		authMessage,
		authReason
	});
	const options = createAuthOptions(req, opts, treatPendingAsSignedOut);
	if (!isTokenTypeAccepted(TokenType.SessionToken, opts.acceptsToken || TokenType.SessionToken)) return signedOutAuthObject(options);
	let authObject;
	if (!authStatus || authStatus !== AuthStatus.SignedIn) authObject = signedOutAuthObject(options);
	else {
		assertTokenSignature(authToken, options.secretKey, authSignature);
		const jwt = decodeJwt2(authToken);
		(_b = opts.logger) == null || _b.debug("jwt", jwt.raw);
		return getAuthObjectFromJwt(jwt, options);
	}
	return authObject;
};
var getAuthDataFromRequest = (req, opts = {}) => {
	var _a, _b;
	const { authStatus, authMessage, authReason } = getAuthHeaders(req);
	(_a = opts.logger) == null || _a.debug("headers", {
		authStatus,
		authMessage,
		authReason
	});
	const decryptedRequestData = decryptClerkRequestData(getHeader(req, constants$1.Headers.ClerkRequestData));
	const bearerToken = (_b = getHeader(req, constants$1.Headers.Authorization)) == null ? void 0 : _b.replace("Bearer ", "");
	const acceptsToken = opts.acceptsToken || TokenType.SessionToken;
	const options = createAuthOptions(req, opts);
	const machineAuthObject = handleMachineToken(bearerToken, decryptedRequestData.machineAuthObject, acceptsToken, options);
	if (machineAuthObject) return machineAuthObject;
	if (bearerToken && isMachineToken(bearerToken)) return signedOutAuthObject(options);
	if (bearerToken && Array.isArray(acceptsToken) && !acceptsToken.includes(TokenType.SessionToken)) return invalidTokenAuthObject();
	return getSessionAuthDataFromRequest(req, opts);
};
var handleMachineToken = (bearerToken, rawAuthObject, acceptsToken, options) => {
	const hasMachineToken = bearerToken && isMachineToken(bearerToken);
	const acceptsOnlySessionToken = acceptsToken === TokenType.SessionToken || Array.isArray(acceptsToken) && acceptsToken.length === 1 && acceptsToken[0] === TokenType.SessionToken;
	if (hasMachineToken && rawAuthObject && !acceptsOnlySessionToken) {
		const authObject = getAuthObjectForAcceptedToken({
			authObject: {
				...rawAuthObject,
				debug: () => options
			},
			acceptsToken
		});
		return {
			...authObject,
			getToken: () => authObject.isAuthenticated ? Promise.resolve(bearerToken) : Promise.resolve(null),
			has: () => false
		};
	}
	return null;
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/createGetAuth.js
var createAsyncGetAuth = ({ debugLoggerName, noAuthStatusMessage }) => withLogger(debugLoggerName, (logger) => {
	return async (req, opts) => {
		if (isTruthy(getHeader(req, constants$1.Headers.EnableDebug))) logger.enable();
		if (!detectClerkMiddleware(req)) {
			const missConfiguredMiddlewareLocation = await import("./assets/middleware-location-BLDnezlK.js").then((m) => m.suggestMiddlewareLocation()).catch(() => void 0);
			if (missConfiguredMiddlewareLocation) throw new Error(missConfiguredMiddlewareLocation);
			assertAuthStatus(req, noAuthStatusMessage);
		}
		const getAuthDataFromRequest$1 = (req2, opts2 = {}) => {
			return getAuthDataFromRequest(req2, {
				...opts2,
				logger,
				acceptsToken: opts2 == null ? void 0 : opts2.acceptsToken
			});
		};
		return getAuthDataFromRequest$1(req, {
			...opts,
			logger,
			acceptsToken: opts == null ? void 0 : opts.acceptsToken
		});
	};
});
var createSyncGetAuth = ({ debugLoggerName, noAuthStatusMessage }) => withLogger(debugLoggerName, (logger) => {
	return (req, opts) => {
		if (isTruthy(getHeader(req, constants$1.Headers.EnableDebug))) logger.enable();
		assertAuthStatus(req, noAuthStatusMessage);
		const getAuthDataFromRequest = (req2, opts2 = {}) => {
			return getSessionAuthDataFromRequest(req2, {
				...opts2,
				logger,
				acceptsToken: opts2 == null ? void 0 : opts2.acceptsToken
			});
		};
		return getAuthDataFromRequest(req, {
			...opts,
			logger,
			acceptsToken: opts == null ? void 0 : opts.acceptsToken
		});
	};
});
createSyncGetAuth({
	debugLoggerName: "getAuth()",
	noAuthStatusMessage: getAuthAuthHeaderMissing()
});
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/buildClerkProps.js
function getDynamicAuthData(req, initialState = {}) {
	return makeAuthObjectSerializable(stripPrivateDataFromObject({
		...getAuthDataFromRequest(req),
		...initialState
	}));
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/nextErrors.js
var CONTROL_FLOW_ERROR = {
	REDIRECT_TO_URL: "CLERK_PROTECT_REDIRECT_TO_URL",
	REDIRECT_TO_SIGN_IN: "CLERK_PROTECT_REDIRECT_TO_SIGN_IN",
	REDIRECT_TO_SIGN_UP: "CLERK_PROTECT_REDIRECT_TO_SIGN_UP"
};
var LEGACY_NOT_FOUND_ERROR_CODE = "NEXT_NOT_FOUND";
function isLegacyNextjsNotFoundError(error) {
	if (typeof error !== "object" || error === null || !("digest" in error)) return false;
	return error.digest === LEGACY_NOT_FOUND_ERROR_CODE;
}
var HTTPAccessErrorStatusCodes = {
	NOT_FOUND: 404,
	FORBIDDEN: 403,
	UNAUTHORIZED: 401
};
var ALLOWED_CODES = new Set(Object.values(HTTPAccessErrorStatusCodes));
var HTTP_ERROR_FALLBACK_ERROR_CODE = "NEXT_HTTP_ERROR_FALLBACK";
function isHTTPAccessFallbackError(error) {
	if (typeof error !== "object" || error === null || !("digest" in error) || typeof error.digest !== "string") return false;
	const [prefix, httpStatus] = error.digest.split(";");
	return prefix === "NEXT_HTTP_ERROR_FALLBACK" && ALLOWED_CODES.has(Number(httpStatus));
}
function whichHTTPAccessFallbackError(error) {
	if (!isHTTPAccessFallbackError(error)) return;
	const [, httpStatus] = error.digest.split(";");
	return Number(httpStatus);
}
function isNextjsNotFoundError(error) {
	return isLegacyNextjsNotFoundError(error) || whichHTTPAccessFallbackError(error) === HTTPAccessErrorStatusCodes.NOT_FOUND;
}
var REDIRECT_ERROR_CODE = "NEXT_REDIRECT";
function nextjsRedirectError(url, extra, type = "replace", statusCode = 307) {
	const error = new Error(REDIRECT_ERROR_CODE);
	error.digest = `${REDIRECT_ERROR_CODE};${type};${url};${statusCode};`;
	error.clerk_digest = CONTROL_FLOW_ERROR.REDIRECT_TO_URL;
	Object.assign(error, extra);
	throw error;
}
function buildReturnBackUrl(url, returnBackUrl) {
	return returnBackUrl === null ? "" : returnBackUrl || url;
}
function redirectToSignInError(url, returnBackUrl) {
	nextjsRedirectError(url, {
		clerk_digest: CONTROL_FLOW_ERROR.REDIRECT_TO_SIGN_IN,
		returnBackUrl: buildReturnBackUrl(url, returnBackUrl)
	});
}
function redirectToSignUpError(url, returnBackUrl) {
	nextjsRedirectError(url, {
		clerk_digest: CONTROL_FLOW_ERROR.REDIRECT_TO_SIGN_UP,
		returnBackUrl: buildReturnBackUrl(url, returnBackUrl)
	});
}
function isNextjsRedirectError(error) {
	if (typeof error !== "object" || error === null || !("digest" in error) || typeof error.digest !== "string") return false;
	const digest = error.digest.split(";");
	const [errorCode, type] = digest;
	const destination = digest.slice(2, -2).join(";");
	const status = digest.at(-2);
	const statusCode = Number(status);
	return errorCode === REDIRECT_ERROR_CODE && (type === "replace" || type === "push") && typeof destination === "string" && !isNaN(statusCode) && statusCode === 307;
}
function isRedirectToSignInError(error) {
	if (isNextjsRedirectError(error) && "clerk_digest" in error) return error.clerk_digest === CONTROL_FLOW_ERROR.REDIRECT_TO_SIGN_IN;
	return false;
}
function isRedirectToSignUpError(error) {
	if (isNextjsRedirectError(error) && "clerk_digest" in error) return error.clerk_digest === CONTROL_FLOW_ERROR.REDIRECT_TO_SIGN_UP;
	return false;
}
function isNextjsUnauthorizedError(error) {
	return whichHTTPAccessFallbackError(error) === HTTPAccessErrorStatusCodes.UNAUTHORIZED;
}
function unauthorized() {
	const error = new Error(HTTP_ERROR_FALLBACK_ERROR_CODE);
	error.digest = `${HTTP_ERROR_FALLBACK_ERROR_CODE};${HTTPAccessErrorStatusCodes.UNAUTHORIZED}`;
	throw error;
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/nextFetcher.js
function isNextFetcher(fetch) {
	return "__nextPatched" in fetch && fetch.__nextPatched === true;
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/protect.js
function createProtect(opts) {
	const { redirectToSignIn, authObject, redirect, notFound, request, unauthorized } = opts;
	return (async (...args) => {
		var _a, _b, _c, _d, _e, _f;
		const paramsOrFunction = getAuthorizationParams(args[0]);
		const unauthenticatedUrl = ((_a = args[0]) == null ? void 0 : _a.unauthenticatedUrl) || ((_b = args[1]) == null ? void 0 : _b.unauthenticatedUrl);
		const unauthorizedUrl = ((_c = args[0]) == null ? void 0 : _c.unauthorizedUrl) || ((_d = args[1]) == null ? void 0 : _d.unauthorizedUrl);
		const requestedToken = ((_e = args[0]) == null ? void 0 : _e.token) || ((_f = args[1]) == null ? void 0 : _f.token) || TokenType.SessionToken;
		const handleUnauthenticated = () => {
			if (unauthenticatedUrl) return redirect(unauthenticatedUrl);
			if (isPageRequest(request)) return redirectToSignIn();
			if (isServerActionRequest(request)) return unauthorized();
			return notFound();
		};
		const handleUnauthorized = () => {
			if (authObject.tokenType !== TokenType.SessionToken || !isTokenTypeAccepted(TokenType.SessionToken, requestedToken)) return unauthorized();
			if (unauthorizedUrl) return redirect(unauthorizedUrl);
			return notFound();
		};
		if (!isTokenTypeAccepted(authObject.tokenType, requestedToken)) return handleUnauthorized();
		if (authObject.tokenType !== TokenType.SessionToken) {
			if (!authObject.isAuthenticated) return handleUnauthorized();
			return authObject;
		}
		if (authObject.sessionStatus === "pending") return handleUnauthenticated();
		if (!authObject.userId) return handleUnauthenticated();
		if (!paramsOrFunction) return authObject;
		if (typeof paramsOrFunction === "function") {
			if (paramsOrFunction(authObject.has)) return authObject;
			return handleUnauthorized();
		}
		if (authObject.has(paramsOrFunction)) return authObject;
		return handleUnauthorized();
	});
}
var getAuthorizationParams = (arg) => {
	if (!arg) return;
	if (arg.unauthenticatedUrl || arg.unauthorizedUrl || arg.token) return;
	if (Object.keys(arg).length === 1 && "token" in arg) return;
	return arg;
};
var isServerActionRequest = (req) => {
	var _a, _b;
	return !!req.headers.get(constants.Headers.NextUrl) && (((_a = req.headers.get(constants$1.Headers.Accept)) == null ? void 0 : _a.includes("text/x-component")) || ((_b = req.headers.get(constants$1.Headers.ContentType)) == null ? void 0 : _b.includes("multipart/form-data")) || !!req.headers.get(constants.Headers.NextAction));
};
var isPageRequest = (req) => {
	var _a;
	return req.headers.get(constants$1.Headers.SecFetchDest) === "document" || req.headers.get(constants$1.Headers.SecFetchDest) === "iframe" || ((_a = req.headers.get(constants$1.Headers.Accept)) == null ? void 0 : _a.includes("text/html")) || isAppRouterInternalNavigation(req) || isPagesRouterInternalNavigation(req);
};
var isAppRouterInternalNavigation = (req) => !!req.headers.get(constants.Headers.NextUrl) && !isServerActionRequest(req) || isPagePathAvailable();
var isPagePathAvailable = () => {
	const __fetch = globalThis.fetch;
	if (!isNextFetcher(__fetch)) return false;
	const { page } = __fetch.__nextGetStaticStore().getStore() || {};
	return Boolean(page);
};
var isPagesRouterInternalNavigation = (req) => !!req.headers.get(constants.Headers.NextjsData);
var init_server_only = __esmMin(() => {});
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js
var auth = (async (options) => {
	var _a;
	init_server_only();
	try {
		const request = await buildRequestLike();
		const stepsBasedOnSrcDirectory = async () => {
			try {
				return [`Your ${middlewareFileReference} file exists at ./${await import("./assets/middleware-location-BLDnezlK.js").then((m) => m.hasSrcAppDir()) ? "src/" : ""}${middlewareFileReference === "middleware or proxy" ? "middleware.(ts|js) or proxy.(ts|js)" : "middleware.(ts|js)"}`];
			} catch {
				return [];
			}
		};
		const authObject = await createAsyncGetAuth({
			debugLoggerName: "auth()",
			noAuthStatusMessage: authAuthHeaderMissing("auth", await stepsBasedOnSrcDirectory(), middlewareFileReference)
		})(request, {
			treatPendingAsSignedOut: options == null ? void 0 : options.treatPendingAsSignedOut,
			acceptsToken: (_a = options == null ? void 0 : options.acceptsToken) != null ? _a : TokenType.SessionToken
		});
		const clerkUrl = getAuthKeyFromRequest(request, "ClerkUrl");
		const createRedirectForRequest = (...args) => {
			const { returnBackUrl } = args[0] || {};
			const clerkRequest = createClerkRequest(request);
			const devBrowserToken = clerkRequest.clerkUrl.searchParams.get(constants$1.QueryParameters.DevBrowser) || clerkRequest.cookies.get(constants$1.Cookies.DevBrowser);
			const decryptedRequestData = decryptClerkRequestData(getHeader(request, constants$1.Headers.ClerkRequestData));
			return [createRedirect({
				redirectAdapter: redirect,
				devBrowserToken,
				baseUrl: clerkRequest.clerkUrl.toString(),
				publishableKey: decryptedRequestData.publishableKey || "pk_test_bW92ZWQtY3JhbmUtMjIuY2xlcmsuYWNjb3VudHMuZGV2JA",
				signInUrl: decryptedRequestData.signInUrl || SIGN_IN_URL,
				signUpUrl: decryptedRequestData.signUpUrl || SIGN_UP_URL,
				sessionStatus: authObject.tokenType === TokenType.SessionToken ? authObject.sessionStatus : null,
				isSatellite: decryptedRequestData.isSatellite
			}), returnBackUrl === null ? "" : returnBackUrl || (clerkUrl == null ? void 0 : clerkUrl.toString())];
		};
		const redirectToSignIn = (opts = {}) => {
			const [r, returnBackUrl] = createRedirectForRequest(opts);
			return r.redirectToSignIn({ returnBackUrl });
		};
		const redirectToSignUp = (opts = {}) => {
			const [r, returnBackUrl] = createRedirectForRequest(opts);
			return r.redirectToSignUp({ returnBackUrl });
		};
		if (authObject.tokenType === TokenType.SessionToken) return Object.assign(authObject, {
			redirectToSignIn,
			redirectToSignUp
		});
		return authObject;
	} catch (e) {
		if (isClerkUseCacheError(e)) throw e;
		if (isNextjsUseCacheError(e)) throw new ClerkUseCacheError(`${USE_CACHE_ERROR_MESSAGE}

Original error: ${e.message}`, e);
		throw e;
	}
});
auth.protect = async (...args) => {
	var _a, _b;
	init_server_only();
	const request = await buildRequestLike();
	const authObject = await auth({ acceptsToken: ((_a = args == null ? void 0 : args[0]) == null ? void 0 : _a.token) || ((_b = args == null ? void 0 : args[1]) == null ? void 0 : _b.token) || TokenType.SessionToken });
	return createProtect({
		request,
		authObject,
		redirectToSignIn: authObject.redirectToSignIn,
		notFound,
		redirect,
		unauthorized
	})(...args);
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/app-router/server/currentUser.js
async function currentUser(opts) {
	init_server_only();
	try {
		const { userId } = await auth({ treatPendingAsSignedOut: opts == null ? void 0 : opts.treatPendingAsSignedOut });
		if (!userId) return null;
		return (await clerkClient()).users.getUser(userId);
	} catch (e) {
		if (isClerkUseCacheError(e)) throw e;
		if (isNextjsUseCacheError(e)) throw new ClerkUseCacheError(`${USE_CACHE_ERROR_MESSAGE}

Original error: ${e.message}`, e);
		throw e;
	}
}
//#endregion
//#region node_modules/@clerk/backend/dist/proxy.mjs
var HOP_BY_HOP_HEADERS$1 = [
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade"
];
var RESPONSE_HEADERS_TO_STRIP = ["content-encoding", "content-length"];
function fapiUrlFromPublishableKey(publishableKey) {
	const frontendApi = parsePublishableKey(publishableKey)?.frontendApi;
	if (frontendApi?.startsWith("clerk.") && LEGACY_DEV_INSTANCE_SUFFIXES.some((suffix) => frontendApi?.endsWith(suffix))) return PROD_FAPI_URL;
	if (LOCAL_ENV_SUFFIXES.some((suffix) => frontendApi?.endsWith(suffix))) return LOCAL_FAPI_URL;
	if (STAGING_ENV_SUFFIXES.some((suffix) => frontendApi?.endsWith(suffix))) return STAGING_FAPI_URL;
	return PROD_FAPI_URL;
}
function stripTrailingSlashes(str) {
	while (str.endsWith("/")) str = str.slice(0, -1);
	return str;
}
function matchProxyPath(request, options) {
	const proxyPath = stripTrailingSlashes(options?.proxyPath || "/__clerk");
	const url = new URL(request.url);
	return url.pathname === proxyPath || url.pathname.startsWith(proxyPath + "/");
}
function createErrorResponse(code, message, status) {
	return new Response(JSON.stringify({ errors: [{
		code,
		message
	}] }), {
		status,
		headers: { "Content-Type": "application/json" }
	});
}
function derivePublicOrigin(request, requestUrl) {
	const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
	const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
	if (forwardedProto && forwardedHost) return `${forwardedProto}://${forwardedHost}`;
	return requestUrl.origin;
}
function getClientIp(request) {
	const cfConnectingIp = request.headers.get("cf-connecting-ip");
	if (cfConnectingIp) return cfConnectingIp;
	const xRealIp = request.headers.get("x-real-ip");
	if (xRealIp) return xRealIp;
	const xForwardedFor = request.headers.get("x-forwarded-for");
	if (xForwardedFor) return xForwardedFor.split(",")[0]?.trim();
}
async function clerkFrontendApiProxy(request, options) {
	const proxyPath = stripTrailingSlashes(options?.proxyPath || "/__clerk");
	const publishableKey = options?.publishableKey || (typeof process !== "undefined" ? process.env?.CLERK_PUBLISHABLE_KEY : void 0);
	const secretKey = options?.secretKey || (typeof process !== "undefined" ? process.env?.CLERK_SECRET_KEY : void 0);
	if (!publishableKey) return createErrorResponse("proxy_configuration_error", "Missing publishableKey. Provide it in options or set CLERK_PUBLISHABLE_KEY environment variable.", 500);
	if (!secretKey) return createErrorResponse("proxy_configuration_error", "Missing secretKey. Provide it in options or set CLERK_SECRET_KEY environment variable.", 500);
	const requestUrl = new URL(request.url);
	if (!(requestUrl.pathname === proxyPath || requestUrl.pathname.startsWith(proxyPath + "/"))) return createErrorResponse("proxy_path_mismatch", `Request path "${requestUrl.pathname}" does not match proxy path "${proxyPath}"`, 400);
	const fapiBaseUrl = fapiUrlFromPublishableKey(publishableKey);
	const fapiHost = new URL(fapiBaseUrl).host;
	const targetPath = requestUrl.pathname.slice(proxyPath.length) || "/";
	const targetUrl = new URL(`${fapiBaseUrl}${targetPath}`);
	targetUrl.search = requestUrl.search;
	if (targetUrl.host !== fapiHost) return createErrorResponse("proxy_request_failed", "Resolved target does not match the expected host", 400);
	const headers = new Headers();
	request.headers.forEach((value, key) => {
		if (!HOP_BY_HOP_HEADERS$1.includes(key.toLowerCase())) headers.set(key, value);
	});
	const proxyUrl = `${derivePublicOrigin(request, requestUrl)}${proxyPath}`;
	headers.set("Clerk-Proxy-Url", proxyUrl);
	headers.set("Clerk-Secret-Key", secretKey);
	headers.set("Host", fapiHost);
	headers.set("Accept-Encoding", "identity");
	if (!headers.has("X-Forwarded-Host")) headers.set("X-Forwarded-Host", requestUrl.host);
	if (!headers.has("X-Forwarded-Proto")) headers.set("X-Forwarded-Proto", requestUrl.protocol.replace(":", ""));
	const clientIp = getClientIp(request);
	if (clientIp) headers.set("X-Forwarded-For", clientIp);
	const hasBody = [
		"POST",
		"PUT",
		"PATCH"
	].includes(request.method);
	try {
		const fetchOptions = {
			method: request.method,
			headers,
			duplex: hasBody ? "half" : void 0
		};
		if (hasBody && request.body) fetchOptions.body = request.body;
		const response = await fetch(targetUrl.toString(), fetchOptions);
		const responseHeaders = new Headers();
		response.headers.forEach((value, key) => {
			const lower = key.toLowerCase();
			if (!HOP_BY_HOP_HEADERS$1.includes(lower) && !RESPONSE_HEADERS_TO_STRIP.includes(lower)) if (lower === "set-cookie") responseHeaders.append(key, value);
			else responseHeaders.set(key, value);
		});
		const locationHeader = response.headers.get("location");
		if (locationHeader) try {
			const locationUrl = new URL(locationHeader, fapiBaseUrl);
			if (locationUrl.host === fapiHost) {
				const rewrittenLocation = `${proxyUrl}${locationUrl.pathname}${locationUrl.search}${locationUrl.hash}`;
				responseHeaders.set("Location", rewrittenLocation);
			}
		} catch {}
		const proxyResponse = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders
		});
		for (const header of RESPONSE_HEADERS_TO_STRIP) proxyResponse.headers.delete(header);
		return proxyResponse;
	} catch (error) {
		return createErrorResponse("proxy_request_failed", `Failed to proxy request to Clerk FAPI: ${error instanceof Error ? error.message : "Unknown error"}`, 502);
	}
}
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/netlifyCacheHandler-Dkdkho_6.mjs
/**
* Cache busting parameter for Netlify to prevent cached responses
* during handshake flows with Clerk development instances.
*
* Note: This query parameter will be removed in the "@clerk/clerk-js" package.
*
* @internal
*/
var CLERK_NETLIFY_CACHE_BUST_PARAM = "__clerk_netlify_cache_bust";
/**
* Returns true if running in a Netlify environment.
* Checks for Netlify-specific environment variables in process.env.
* Safe for browser and non-Node environments.
*/
function isNetlifyRuntime() {
	if (typeof process === "undefined" || !process.env) return false;
	return Boolean(process.env.NETLIFY) || Boolean(process.env.NETLIFY_FUNCTIONS_TOKEN) || typeof process.env.URL === "string" && process.env.URL.endsWith("netlify.app");
}
/**
* Prevents infinite redirects in Netlify's functions by adding a cache bust parameter
* to the original redirect URL. This ensures that Netlify doesn't serve a cached response
* during the handshake flow.
*
* The issue happens only on Clerk development instances running on Netlify. This is
* a workaround until we find a better solution.
*
* See https://answers.netlify.com/t/cache-handling-recommendation-for-authentication-handshake-redirects/143969/1.
*
* @internal
*/
function handleNetlifyCacheInDevInstance({ locationHeader, requestStateHeaders, publishableKey }) {
	const isOnNetlify = isNetlifyRuntime();
	const isDevelopmentInstance = isDevelopmentFromPublishableKey(publishableKey);
	if (isOnNetlify && isDevelopmentInstance) {
		if (!locationHeader.includes("__clerk_handshake")) {
			const url = new URL(locationHeader);
			url.searchParams.append(CLERK_NETLIFY_CACHE_BUST_PARAM, Date.now().toString());
			requestStateHeaders.set("Location", url.toString());
		}
	}
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/utils/response.js
var isRedirect = (res) => {
	return res.headers.get(constants.Headers.NextRedirect);
};
var setHeader = (res, name, val) => {
	res.headers.set(name, val);
	return res;
};
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/devBrowser.mjs
var DEV_BROWSER_KEY = "__clerk_db_jwt";
function setDevBrowserInURL(url, devBrowser) {
	const resultURL = new URL(url);
	const existing = resultURL.searchParams.get(DEV_BROWSER_KEY);
	resultURL.searchParams.delete(DEV_BROWSER_KEY);
	const value = existing || devBrowser;
	if (value) resultURL.searchParams.set(DEV_BROWSER_KEY, value);
	return resultURL;
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/utils/serverRedirectWithAuth.js
var serverRedirectWithAuth = (clerkRequest, res, opts) => {
	const location = res.headers.get("location");
	if (res.headers.get(constants$1.Headers.ClerkRedirectTo) === "true" && !!location && isDevelopmentFromSecretKey(opts.secretKey) && clerkRequest.clerkUrl.isCrossOrigin(location)) {
		const devBrowser = clerkRequest.cookies.get("__clerk_db_jwt") || "";
		const urlWithDevBrowser = setDevBrowserInURL(new URL(location), devBrowser);
		return NextResponse.redirect(urlWithDevBrowser.href, res);
	}
	return res;
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/content-security-policy.js
var ContentSecurityPolicyDirectiveManager = class {
	/**
	* Creates a new ContentSecurityPolicyDirectiveSet with default values
	* @returns A new ContentSecurityPolicyDirectiveSet with default values
	*/
	static createDefaultDirectives() {
		return Object.entries(this.DEFAULT_DIRECTIVES).reduce((acc, [key, values]) => {
			acc[key] = new Set(values);
			return acc;
		}, {});
	}
	/**
	* Checks if a value is a special keyword that requires quoting
	* @param value - The value to check
	* @returns True if the value is a special keyword
	*/
	static isKeyword(value) {
		return this.KEYWORDS.has(value.replace(/^'|'$/g, ""));
	}
	/**
	* Formats a value according to CSP rules, adding quotes for special keywords
	* @param value - The value to format
	* @returns The formatted value
	*/
	static formatValue(value) {
		const unquoted = value.replace(/^'|'$/g, "");
		return this.isKeyword(unquoted) ? `'${unquoted}'` : value;
	}
	/**
	* Handles directive values, ensuring proper formatting and special case handling
	* @param values - Array of values to process
	* @returns Set of formatted values
	*/
	static handleDirectiveValues(values) {
		const result = /* @__PURE__ */ new Set();
		if (values.includes("'none'") || values.includes("none")) {
			result.add("'none'");
			return result;
		}
		values.forEach((v) => result.add(this.formatValue(v)));
		return result;
	}
};
/** Set of special keywords that require quoting in CSP directives */
ContentSecurityPolicyDirectiveManager.KEYWORDS = /* @__PURE__ */ new Set([
	"none",
	"self",
	"strict-dynamic",
	"unsafe-eval",
	"unsafe-hashes",
	"unsafe-inline"
]);
/** Default CSP directives and their values */
ContentSecurityPolicyDirectiveManager.DEFAULT_DIRECTIVES = {
	"connect-src": [
		"self",
		"https://clerk-telemetry.com",
		"https://*.clerk-telemetry.com",
		"https://api.stripe.com",
		"https://maps.googleapis.com",
		"https://img.clerk.com",
		"https://images.clerkstage.dev"
	],
	"default-src": ["self"],
	"form-action": ["self"],
	"frame-src": [
		"self",
		"https://challenges.cloudflare.com",
		"https://*.js.stripe.com",
		"https://js.stripe.com",
		"https://hooks.stripe.com"
	],
	"img-src": ["self", "https://img.clerk.com"],
	"script-src": [
		"self",
		...[],
		"unsafe-inline",
		"https:",
		"http:",
		"https://*.js.stripe.com",
		"https://js.stripe.com",
		"https://maps.googleapis.com"
	],
	"style-src": ["self", "unsafe-inline"],
	"worker-src": ["self", "blob:"]
};
function handleExistingDirective(mergedCSP, key, values) {
	if (values.includes("'none'") || values.includes("none")) {
		mergedCSP[key] = /* @__PURE__ */ new Set(["'none'"]);
		return;
	}
	const deduplicatedSet = /* @__PURE__ */ new Set();
	mergedCSP[key].forEach((value) => {
		deduplicatedSet.add(ContentSecurityPolicyDirectiveManager.formatValue(value));
	});
	values.forEach((value) => {
		deduplicatedSet.add(ContentSecurityPolicyDirectiveManager.formatValue(value));
	});
	mergedCSP[key] = deduplicatedSet;
}
function handleCustomDirective(customDirectives, key, values) {
	if (values.includes("'none'") || values.includes("none")) {
		customDirectives.set(key, /* @__PURE__ */ new Set(["'none'"]));
		return;
	}
	const formattedValues = /* @__PURE__ */ new Set();
	values.forEach((value) => {
		const formattedValue = ContentSecurityPolicyDirectiveManager.formatValue(value);
		formattedValues.add(formattedValue);
	});
	customDirectives.set(key, formattedValues);
}
function formatCSPHeader(mergedCSP) {
	return Object.entries(mergedCSP).sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => {
		return `${key} ${Array.from(values).map((v) => ({
			raw: v,
			formatted: ContentSecurityPolicyDirectiveManager.formatValue(v)
		})).map((item) => item.formatted).join(" ")}`;
	}).join("; ");
}
function generateNonce() {
	const randomBytes = new Uint8Array(16);
	crypto.getRandomValues(randomBytes);
	const binaryString = Array.from(randomBytes, (byte) => String.fromCharCode(byte)).join("");
	return btoa(binaryString);
}
function buildContentSecurityPolicyDirectives(strict, host, customDirectives, nonce) {
	const directives = Object.entries(ContentSecurityPolicyDirectiveManager.DEFAULT_DIRECTIVES).reduce((acc, [key, values]) => {
		acc[key] = new Set(values);
		return acc;
	}, {});
	directives["connect-src"].add(host);
	if (strict) {
		directives["script-src"].delete("http:");
		directives["script-src"].delete("https:");
		directives["script-src"].add("'strict-dynamic'");
		if (nonce) directives["script-src"].add(`'nonce-${nonce}'`);
	}
	if (customDirectives) {
		const customDirectivesMap = /* @__PURE__ */ new Map();
		Object.entries(customDirectives).forEach(([key, values]) => {
			const valuesArray = Array.isArray(values) ? values : [values];
			if (ContentSecurityPolicyDirectiveManager.DEFAULT_DIRECTIVES[key]) handleExistingDirective(directives, key, valuesArray);
			else handleCustomDirective(customDirectivesMap, key, valuesArray);
		});
		customDirectivesMap.forEach((values, key) => {
			directives[key] = values;
		});
	}
	return formatCSPHeader(directives);
}
function createContentSecurityPolicyHeaders(host, options) {
	var _a;
	const headers = [];
	const nonce = options.strict ? generateNonce() : void 0;
	let cspHeader = buildContentSecurityPolicyDirectives((_a = options.strict) != null ? _a : false, host, options.directives, nonce);
	if (options.reportTo) {
		cspHeader += "; report-to csp-endpoint";
		headers.push([constants$1.Headers.ReportingEndpoints, `csp-endpoint="${options.reportTo}"`]);
	}
	if (options.reportOnly) headers.push([constants$1.Headers.ContentSecurityPolicyReportOnly, cspHeader]);
	else headers.push([constants$1.Headers.ContentSecurityPolicy, cspHeader]);
	if (nonce) headers.push([constants$1.Headers.Nonce, nonce]);
	return { headers };
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/clerkMiddleware.js
var clerkMiddleware = ((...args) => {
	const [request, event] = parseRequestAndEvent(args);
	const [handler, params] = parseHandlerAndOptions(args);
	return clerkMiddlewareRequestDataStorage.run(clerkMiddlewareRequestDataStore, () => {
		const baseNextMiddleware = withLogger("clerkMiddleware", (logger) => async (request2, event2) => {
			var _a, _b;
			const resolvedParams = typeof params === "function" ? await params(request2) : params;
			const keyless = await getKeylessCookieValue((name) => {
				var _a2;
				return (_a2 = request2.cookies.get(name)) == null ? void 0 : _a2.value;
			});
			const publishableKey = assertKey(resolvedParams.publishableKey || "pk_test_bW92ZWQtY3JhbmUtMjIuY2xlcmsuYWNjb3VudHMuZGV2JA", () => errorThrower$1.throwMissingPublishableKeyError());
			const secretKey = assertKey(resolvedParams.secretKey || SECRET_KEY || (keyless == null ? void 0 : keyless.secretKey), () => errorThrower$1.throwMissingSecretKeyError());
			const frontendApiProxyConfig = resolvedParams.frontendApiProxy;
			if (frontendApiProxyConfig) {
				const { enabled, path: proxyPath = DEFAULT_PROXY_PATH } = frontendApiProxyConfig;
				const requestUrl = new URL(request2.url);
				if ((typeof enabled === "function" ? enabled(requestUrl) : enabled) && matchProxyPath(request2, { proxyPath })) return clerkFrontendApiProxy(request2, {
					proxyPath,
					publishableKey,
					secretKey
				});
			}
			const options = {
				publishableKey,
				secretKey,
				signInUrl: resolvedParams.signInUrl || SIGN_IN_URL,
				signUpUrl: resolvedParams.signUpUrl || SIGN_UP_URL,
				...resolvedParams
			};
			clerkMiddlewareRequestDataStore.set("requestData", options);
			const resolvedClerkClient = await clerkClient();
			if (options.debug) logger.enable();
			const clerkRequest = createClerkRequest(request2);
			logger.debug("options", options);
			logger.debug("url", () => clerkRequest.toJSON());
			const authHeader = request2.headers.get(constants$1.Headers.Authorization);
			if (authHeader && authHeader.startsWith("Basic ")) logger.debug("Basic Auth detected");
			const cspHeader = request2.headers.get(constants$1.Headers.ContentSecurityPolicy);
			if (cspHeader) logger.debug("Content-Security-Policy detected", () => ({ value: cspHeader }));
			const requestState = await resolvedClerkClient.authenticateRequest(clerkRequest, createAuthenticateRequestOptions(clerkRequest, options));
			logger.debug("requestState", () => ({
				status: requestState.status,
				headers: JSON.stringify(Object.fromEntries(requestState.headers)),
				reason: requestState.reason
			}));
			const locationHeader = requestState.headers.get(constants$1.Headers.Location);
			if (locationHeader) {
				handleNetlifyCacheInDevInstance({
					locationHeader,
					requestStateHeaders: requestState.headers,
					publishableKey: requestState.publishableKey
				});
				const res = NextResponse.redirect(requestState.headers.get(constants$1.Headers.Location) || locationHeader);
				requestState.headers.forEach((value, key) => {
					if (key === constants$1.Headers.Location) return;
					res.headers.append(key, value);
				});
				return res;
			} else if (requestState.status === AuthStatus.Handshake) throw new Error("Clerk: handshake status without redirect");
			const authObject = requestState.toAuth();
			logger.debug("auth", () => ({
				auth: authObject,
				debug: authObject.debug()
			}));
			const redirectToSignIn = createMiddlewareRedirectToSignIn(clerkRequest);
			const redirectToSignUp = createMiddlewareRedirectToSignUp(clerkRequest);
			const protect = await createMiddlewareProtect(clerkRequest, authObject, redirectToSignIn);
			const authHandler = createMiddlewareAuthHandler(requestState, redirectToSignIn, redirectToSignUp);
			authHandler.protect = protect;
			let handlerResult = NextResponse.next();
			try {
				handlerResult = await clerkMiddlewareRequestDataStorage.run(clerkMiddlewareRequestDataStore, async () => handler == null ? void 0 : handler(authHandler, request2, event2)) || handlerResult;
			} catch (e) {
				handlerResult = handleControlFlowErrors(e, clerkRequest, request2, requestState);
			}
			if (options.contentSecurityPolicy) {
				const { headers } = createContentSecurityPolicyHeaders(((_b = (_a = parsePublishableKey(publishableKey)) == null ? void 0 : _a.frontendApi) != null ? _b : "").replace("$", ""), options.contentSecurityPolicy);
				const cspRequestHeaders = {};
				headers.forEach(([key, value]) => {
					setHeader(handlerResult, key, value);
					cspRequestHeaders[key] = value;
				});
				setRequestHeadersOnNextResponse(handlerResult, clerkRequest, cspRequestHeaders);
				logger.debug("Clerk generated CSP", () => ({ headers }));
			}
			if (requestState.headers) requestState.headers.forEach((value, key) => {
				if (key === constants$1.Headers.ContentSecurityPolicy) logger.debug("Content-Security-Policy detected", () => ({ value }));
				handlerResult.headers.append(key, value);
			});
			if (isRedirect(handlerResult)) {
				logger.debug("handlerResult is redirect");
				return serverRedirectWithAuth(clerkRequest, handlerResult, options);
			}
			if (options.debug) setRequestHeadersOnNextResponse(handlerResult, clerkRequest, { [constants$1.Headers.EnableDebug]: "true" });
			const keylessKeysForRequestData = secretKey === (keyless == null ? void 0 : keyless.secretKey) ? {
				publishableKey: keyless == null ? void 0 : keyless.publishableKey,
				secretKey: keyless == null ? void 0 : keyless.secretKey
			} : {};
			decorateRequest(clerkRequest, handlerResult, requestState, resolvedParams, keylessKeysForRequestData, authObject.tokenType === "session_token" ? null : makeAuthObjectSerializable(authObject));
			return handlerResult;
		});
		const keylessMiddleware = async (request2, event2) => {
			var _a;
			if (isKeylessSyncRequest(request2)) return returnBackFromKeylessSync(request2);
			const resolvedParams = typeof params === "function" ? await params(request2) : params;
			await getKeylessCookieValue((name) => {
				var _a2;
				return (_a2 = request2.cookies.get(name)) == null ? void 0 : _a2.value;
			});
			resolvedParams.publishableKey;
			(_a = getHeader(request2, constants$1.Headers.Authorization)) == null || _a.replace("Bearer ", "");
			return baseNextMiddleware(request2, event2);
		};
		const nextMiddleware = async (request2, event2) => {
			if (canUseKeyless) return keylessMiddleware(request2, event2);
			return baseNextMiddleware(request2, event2);
		};
		if (request && event) return nextMiddleware(request, event);
		return nextMiddleware;
	});
});
var parseRequestAndEvent = (args) => {
	return [args[0] instanceof Request ? args[0] : void 0, args[0] instanceof Request ? args[1] : void 0];
};
var parseHandlerAndOptions = (args) => {
	return [typeof args[0] === "function" ? args[0] : void 0, (args.length === 2 ? args[1] : typeof args[0] === "function" ? {} : args[0]) || {}];
};
var isKeylessSyncRequest = (request) => request.nextUrl.pathname === "/clerk-sync-keyless";
var returnBackFromKeylessSync = (request) => {
	const returnUrl = request.nextUrl.searchParams.get("returnUrl");
	const url = new URL(request.url);
	url.pathname = "";
	return NextResponse.redirect(returnUrl || url.toString());
};
var createAuthenticateRequestOptions = (clerkRequest, options) => {
	let resolvedOptions = options;
	if (options.frontendApiProxy && !options.proxyUrl) {
		const { enabled, path: proxyPath = DEFAULT_PROXY_PATH } = options.frontendApiProxy;
		const requestUrl = new URL(clerkRequest.url);
		if (typeof enabled === "function" ? enabled(requestUrl) : enabled) {
			const derivedProxyUrl = `${requestUrl.origin}${proxyPath}`;
			resolvedOptions = {
				...options,
				proxyUrl: derivedProxyUrl
			};
		}
	}
	return {
		...resolvedOptions,
		...handleMultiDomainAndProxy(clerkRequest, resolvedOptions),
		acceptsToken: "any"
	};
};
var createMiddlewareRedirectToSignIn = (clerkRequest) => {
	return (opts = {}) => {
		redirectToSignInError(clerkRequest.clerkUrl.toString(), opts.returnBackUrl);
	};
};
var createMiddlewareRedirectToSignUp = (clerkRequest) => {
	return (opts = {}) => {
		redirectToSignUpError(clerkRequest.clerkUrl.toString(), opts.returnBackUrl);
	};
};
var createMiddlewareProtect = (clerkRequest, rawAuthObject, redirectToSignIn) => {
	return (async (params, options) => {
		const notFound$1 = () => notFound();
		const redirect = (url) => nextjsRedirectError(url, { redirectUrl: url });
		return createProtect({
			request: clerkRequest,
			redirect,
			notFound: notFound$1,
			unauthorized,
			authObject: getAuthObjectForAcceptedToken({
				authObject: rawAuthObject,
				acceptsToken: (params == null ? void 0 : params.token) || (options == null ? void 0 : options.token) || TokenType.SessionToken
			}),
			redirectToSignIn
		})(params, options);
	});
};
var createMiddlewareAuthHandler = (requestState, redirectToSignIn, redirectToSignUp) => {
	const authHandler = async (options) => {
		var _a;
		const rawAuthObject = requestState.toAuth({ treatPendingAsSignedOut: options == null ? void 0 : options.treatPendingAsSignedOut });
		const acceptsToken = (_a = options == null ? void 0 : options.acceptsToken) != null ? _a : TokenType.SessionToken;
		const authObject = getAuthObjectForAcceptedToken({
			authObject: rawAuthObject,
			acceptsToken
		});
		if (authObject.tokenType === TokenType.SessionToken && isTokenTypeAccepted(TokenType.SessionToken, acceptsToken)) return Object.assign(authObject, {
			redirectToSignIn,
			redirectToSignUp
		});
		return authObject;
	};
	return authHandler;
};
var handleControlFlowErrors = (e, clerkRequest, nextRequest, requestState) => {
	var _a;
	if (isNextjsUnauthorizedError(e)) {
		const response = new NextResponse(null, { status: 401 });
		const authObject = requestState.toAuth();
		if (authObject && authObject.tokenType === TokenType.OAuthToken) {
			const publishableKey = parsePublishableKey(requestState.publishableKey);
			return setHeader(response, "WWW-Authenticate", `Bearer resource_metadata="https://${publishableKey == null ? void 0 : publishableKey.frontendApi}/.well-known/oauth-protected-resource"`);
		}
		return response;
	}
	if (isNextjsNotFoundError(e)) return setHeader(NextResponse.rewrite(new URL(`/clerk_${Date.now()}`, nextRequest.url)), constants$1.Headers.AuthReason, "protect-rewrite");
	const isRedirectToSignIn = isRedirectToSignInError(e);
	const isRedirectToSignUp = isRedirectToSignUpError(e);
	if (isRedirectToSignIn || isRedirectToSignUp) {
		const redirect = createRedirect({
			redirectAdapter,
			baseUrl: clerkRequest.clerkUrl,
			signInUrl: requestState.signInUrl,
			signUpUrl: requestState.signUpUrl,
			publishableKey: requestState.publishableKey,
			sessionStatus: (_a = requestState.toAuth()) == null ? void 0 : _a.sessionStatus,
			isSatellite: requestState.isSatellite
		});
		const { returnBackUrl } = e;
		return redirect[isRedirectToSignIn ? "redirectToSignIn" : "redirectToSignUp"]({ returnBackUrl });
	}
	if (isNextjsRedirectError(e)) return redirectAdapter(e.redirectUrl);
	throw e;
};
//#endregion
//#region proxy.ts
var isProtectedRoute = createRouteMatcher([
	"/dashboard(.*)",
	"/student(.*)",
	"/teacher(.*)"
]);
var proxy_default = clerkMiddleware(async (auth, req) => {
	if (isProtectedRoute(req)) await auth.protect();
});
//#endregion
//#region node_modules/vinext/dist/server/metadata-routes.js
/** Escape the five XML special characters in text content and attribute values. */
function escapeXml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
/**
* Convert a sitemap array to XML string.
*/
function sitemapToXml(entries) {
	const hasAlternates = entries.some((entry) => Object.keys(entry.alternates ?? {}).length > 0);
	const hasImages = entries.some((entry) => Boolean(entry.images?.length));
	const hasVideos = entries.some((entry) => Boolean(entry.videos?.length));
	let content = "";
	content += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
	content += "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"";
	if (hasImages) content += " xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\"";
	if (hasVideos) content += " xmlns:video=\"http://www.google.com/schemas/sitemap-video/1.1\"";
	if (hasAlternates) content += " xmlns:xhtml=\"http://www.w3.org/1999/xhtml\">\n";
	else content += ">\n";
	for (const entry of entries) {
		content += "<url>\n";
		content += `<loc>${escapeXml(entry.url)}</loc>\n`;
		const languages = entry.alternates?.languages;
		if (languages && Object.keys(languages).length) for (const language in languages) content += `<xhtml:link rel="alternate" hreflang="${escapeXml(language)}" href="${escapeXml(languages[language])}" />\n`;
		if (entry.images?.length) for (const image of entry.images) content += `<image:image>\n<image:loc>${escapeXml(image)}</image:loc>\n</image:image>\n`;
		if (entry.videos?.length) for (const video of entry.videos) {
			const videoFields = [
				"<video:video>",
				`<video:title>${escapeXml(String(video.title))}</video:title>`,
				`<video:thumbnail_loc>${escapeXml(String(video.thumbnail_loc))}</video:thumbnail_loc>`,
				`<video:description>${escapeXml(String(video.description))}</video:description>`,
				video.content_loc && `<video:content_loc>${escapeXml(String(video.content_loc))}</video:content_loc>`,
				video.player_loc && `<video:player_loc>${escapeXml(String(video.player_loc))}</video:player_loc>`,
				video.duration && `<video:duration>${video.duration}</video:duration>`,
				video.view_count && `<video:view_count>${video.view_count}</video:view_count>`,
				video.tag && `<video:tag>${escapeXml(String(video.tag))}</video:tag>`,
				video.rating && `<video:rating>${video.rating}</video:rating>`,
				video.expiration_date && `<video:expiration_date>${escapeXml(String(video.expiration_date))}</video:expiration_date>`,
				video.publication_date && `<video:publication_date>${escapeXml(String(video.publication_date))}</video:publication_date>`,
				video.family_friendly && `<video:family_friendly>${video.family_friendly}</video:family_friendly>`,
				video.requires_subscription && `<video:requires_subscription>${video.requires_subscription}</video:requires_subscription>`,
				video.live && `<video:live>${video.live}</video:live>`,
				video.restriction && `<video:restriction relationship="${escapeXml(String(video.restriction.relationship))}">${escapeXml(String(video.restriction.content))}</video:restriction>`,
				video.platform && `<video:platform relationship="${escapeXml(String(video.platform.relationship))}">${escapeXml(String(video.platform.content))}</video:platform>`,
				video.uploader && `<video:uploader${video.uploader.info ? ` info="${escapeXml(String(video.uploader.info))}"` : ""}>${escapeXml(String(video.uploader.content))}</video:uploader>`,
				"</video:video>\n"
			].filter(Boolean);
			content += videoFields.join("\n");
		}
		if (entry.lastModified) content += `<lastmod>${serializeDate(entry.lastModified)}</lastmod>\n`;
		if (entry.changeFrequency) content += `<changefreq>${entry.changeFrequency}</changefreq>\n`;
		if (typeof entry.priority === "number") content += `<priority>${entry.priority}</priority>\n`;
		content += "</url>\n";
	}
	content += "</urlset>\n";
	return content;
}
/**
* Convert a robots config to text format.
*/
function robotsToText(config) {
	const lines = [];
	const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
	for (const rule of rules) {
		const agents = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent ?? "*"];
		for (const agent of agents) lines.push(`User-Agent: ${agent}`);
		if (rule.allow) {
			const allows = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
			for (const allow of allows) lines.push(`Allow: ${allow}`);
		}
		if (rule.disallow) {
			const disallows = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
			for (const disallow of disallows) lines.push(`Disallow: ${disallow}`);
		}
		if (rule.crawlDelay !== void 0) lines.push(`Crawl-delay: ${rule.crawlDelay}`);
		lines.push("");
	}
	if (config.sitemap) {
		const sitemaps = Array.isArray(config.sitemap) ? config.sitemap : [config.sitemap];
		for (const sitemap of sitemaps) lines.push(`Sitemap: ${sitemap}`);
	}
	if (config.host) lines.push(`Host: ${config.host}`);
	return lines.join("\n").trim() + "\n";
}
/**
* Convert a manifest config to JSON string.
*/
function manifestToJson(config) {
	return JSON.stringify(config, null, 2);
}
function serializeDate(value) {
	return value instanceof Date ? value.toISOString() : value;
}
//#endregion
//#region node_modules/vinext/dist/config/config-matchers.js
/**
* Cache for compiled regex patterns in matchConfigPattern.
*
* Redirect/rewrite patterns are static — they come from next.config.js and
* never change at runtime. Without caching, every request that hits the regex
* branch re-runs the full tokeniser walk + isSafeRegex + new RegExp() for
* every rule in the array. On apps with many locale-prefixed rules (which all
* contain `(` and therefore enter the regex branch) this dominated profiling
* at ~2.4 seconds of CPU self-time.
*
* Value is `null` when safeRegExp rejected the pattern (ReDoS risk), so we
* skip it on subsequent requests too without re-running the scanner.
*/
var _compiledPatternCache = /* @__PURE__ */ new Map();
/**
* Cache for compiled header source regexes in matchHeaders.
*
* Each NextHeader rule has a `source` that is run through escapeHeaderSource()
* then safeRegExp() to produce a RegExp. Both are pure functions of the source
* string and the result never changes. Without caching, every request
* re-runs the full escapeHeaderSource tokeniser + isSafeRegex scan + new RegExp()
* for every header rule.
*
* Value is `null` when safeRegExp rejected the pattern (ReDoS risk).
*/
var _compiledHeaderSourceCache = /* @__PURE__ */ new Map();
/**
* Cache for compiled has/missing condition value regexes in checkSingleCondition.
*
* Each has/missing condition may carry a `value` string that is passed directly
* to safeRegExp() for matching against header/cookie/query/host values. The
* condition objects are static (from next.config.js) so the compiled RegExp
* never changes. Without caching, safeRegExp() is called on every request for
* every condition on every rule.
*
* Value is `null` when safeRegExp rejected the pattern, or `false` when the
* value string was undefined (no regex needed — use exact string comparison).
*/
var _compiledConditionCache = /* @__PURE__ */ new Map();
/**
* Cache for destination substitution regexes in substituteDestinationParams.
*
* The regex depends only on the set of param keys captured from the matched
* source pattern. Caching by sorted key list avoids recompiling a new RegExp
* for repeated redirect/rewrite calls that use the same param shape.
*/
var _compiledDestinationParamCache = /* @__PURE__ */ new Map();
/**
* Redirect index for O(1) locale-static rule lookup.
*
* Many Next.js apps generate 50-100 redirect rules of the form:
*   /:locale(en|es|fr|...)?/some-static-path  →  /some-destination
*
* The compiled regex for each is like:
*   ^/(en|es|fr|...)?/some-static-path$
*
* When no redirect matches (the common case for ordinary page loads),
* matchRedirect previously ran exec() on every one of those regexes —
* ~2ms per call, ~2992ms total self-time in profiles.
*
* The index splits rules into two buckets:
*
*   localeStatic — rules whose source is exactly /:paramName(alt1|alt2|...)?/suffix
*     where `suffix` is a static path with no further params or regex groups.
*     These are indexed in a Map<suffix, entry[]> for O(1) lookup after a
*     single fast strip of the optional locale prefix.
*
*   linear — all other rules. Matched with the original O(n) loop.
*
* The index is stored in a WeakMap keyed by the redirects array so it is
* computed once per config load and GC'd when the array is no longer live.
*
* ## Ordering invariant
*
* Redirect rules must be evaluated in their original order (first match wins).
* Each locale-static entry stores its `originalIndex` so that, when a
* locale-static fast-path match is found, any linear rules that appear earlier
* in the array are still checked first.
*/
/** Matches `/:param(alternation)?/static/suffix` — the locale-static pattern. */
var _LOCALE_STATIC_RE = /^\/:[\w-]+\(([^)]+)\)\?\/([a-zA-Z0-9_~.%@!$&'*+,;=:/-]+)$/;
var _redirectIndexCache = /* @__PURE__ */ new WeakMap();
/**
* Build (or retrieve from cache) the redirect index for a given redirects array.
*
* Called once per config load from matchRedirect. The WeakMap ensures the index
* is recomputed if the config is reloaded (new array reference) and GC'd when
* the array is collected.
*/
function _getRedirectIndex(redirects) {
	let index = _redirectIndexCache.get(redirects);
	if (index !== void 0) return index;
	const localeStatic = /* @__PURE__ */ new Map();
	const linear = [];
	for (let i = 0; i < redirects.length; i++) {
		const redirect = redirects[i];
		const m = _LOCALE_STATIC_RE.exec(redirect.source);
		if (m) {
			const paramName = redirect.source.slice(2, redirect.source.indexOf("("));
			const alternation = m[1];
			const suffix = "/" + m[2];
			const altRe = safeRegExp("^(?:" + alternation + ")$");
			if (!altRe) {
				linear.push([i, redirect]);
				continue;
			}
			const entry = {
				paramName,
				altRe,
				redirect,
				originalIndex: i
			};
			const bucket = localeStatic.get(suffix);
			if (bucket) bucket.push(entry);
			else localeStatic.set(suffix, [entry]);
		} else linear.push([i, redirect]);
	}
	index = {
		localeStatic,
		linear
	};
	_redirectIndexCache.set(redirects, index);
	return index;
}
/** Hop-by-hop headers that should not be forwarded through a proxy. */
var HOP_BY_HOP_HEADERS = new Set([
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailers",
	"transfer-encoding",
	"upgrade"
]);
/**
* Request hop-by-hop headers to strip before proxying with fetch().
* Intentionally narrower than HOP_BY_HOP_HEADERS: external rewrite proxying
* still forwards proxy auth credentials, while response sanitization strips
* them before returning data to the client.
*/
var REQUEST_HOP_BY_HOP_HEADERS = new Set([
	"connection",
	"keep-alive",
	"te",
	"trailers",
	"transfer-encoding",
	"upgrade"
]);
function stripHopByHopRequestHeaders(headers) {
	const connectionTokens = (headers.get("connection") || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
	for (const header of REQUEST_HOP_BY_HOP_HEADERS) headers.delete(header);
	for (const token of connectionTokens) headers.delete(token);
}
/**
* Detect regex patterns vulnerable to catastrophic backtracking (ReDoS).
*
* Uses a lightweight heuristic: scans the pattern string for nested quantifiers
* (a quantifier applied to a group that itself contains a quantifier). This
* catches the most common pathological patterns like `(a+)+`, `(.*)*`,
* `([^/]+)+`, `(a|a+)+` without needing a full regex parser.
*
* Returns true if the pattern appears safe, false if it's potentially dangerous.
*/
function isSafeRegex(pattern) {
	const quantifierAtDepth = [];
	let depth = 0;
	let i = 0;
	while (i < pattern.length) {
		const ch = pattern[i];
		if (ch === "\\") {
			i += 2;
			continue;
		}
		if (ch === "[") {
			i++;
			while (i < pattern.length && pattern[i] !== "]") {
				if (pattern[i] === "\\") i++;
				i++;
			}
			i++;
			continue;
		}
		if (ch === "(") {
			depth++;
			if (quantifierAtDepth.length <= depth) quantifierAtDepth.push(false);
			else quantifierAtDepth[depth] = false;
			i++;
			continue;
		}
		if (ch === ")") {
			const hadQuantifier = depth > 0 && quantifierAtDepth[depth];
			if (depth > 0) depth--;
			const next = pattern[i + 1];
			if (next === "+" || next === "*" || next === "{") {
				if (hadQuantifier) return false;
				if (depth >= 0 && depth < quantifierAtDepth.length) quantifierAtDepth[depth] = true;
			}
			i++;
			continue;
		}
		if (ch === "+" || ch === "*") {
			if (depth > 0) quantifierAtDepth[depth] = true;
			i++;
			continue;
		}
		if (ch === "?") {
			const prev = i > 0 ? pattern[i - 1] : "";
			if (prev !== "+" && prev !== "*" && prev !== "?" && prev !== "}") {
				if (depth > 0) quantifierAtDepth[depth] = true;
			}
			i++;
			continue;
		}
		if (ch === "{") {
			let j = i + 1;
			while (j < pattern.length && /[\d,]/.test(pattern[j])) j++;
			if (j < pattern.length && pattern[j] === "}" && j > i + 1) {
				if (depth > 0) quantifierAtDepth[depth] = true;
				i = j + 1;
				continue;
			}
		}
		i++;
	}
	return true;
}
/**
* Compile a regex pattern safely. Returns the compiled RegExp or null if the
* pattern is invalid or vulnerable to ReDoS.
*
* Logs a warning when a pattern is rejected so developers can fix their config.
*/
function safeRegExp(pattern, flags) {
	if (!isSafeRegex(pattern)) {
		console.warn(`[vinext] Ignoring potentially unsafe regex pattern (ReDoS risk): ${pattern}\n  Patterns with nested quantifiers (e.g. (a+)+) can cause catastrophic backtracking.\n  Simplify the pattern to avoid nested repetition.`);
		return null;
	}
	try {
		return new RegExp(pattern, flags);
	} catch {
		return null;
	}
}
/**
* Convert a Next.js header/rewrite/redirect source pattern into a regex string.
*
* Regex groups in the source (e.g. `(\d+)`) are extracted first, the remaining
* text is escaped/converted in a **single pass** (avoiding chained `.replace()`
* which CodeQL flags as incomplete sanitization), then groups are restored.
*/
function escapeHeaderSource(source) {
	const S = "";
	const groups = [];
	const withPlaceholders = source.replace(/\(([^)]+)\)/g, (_m, inner) => {
		groups.push(inner);
		return `${S}G${groups.length - 1}${S}`;
	});
	let result = "";
	const re = new RegExp(`${S}G(\\d+)${S}|:[\\w-]+|[.+?*]|[^.+?*:\\uE000]+`, "g");
	let m;
	while ((m = re.exec(withPlaceholders)) !== null) if (m[1] !== void 0) result += `(${groups[Number(m[1])]})`;
	else if (m[0].startsWith(":")) {
		const constraintMatch = withPlaceholders.slice(re.lastIndex).match(new RegExp(`^${S}G(\\d+)${S}`));
		if (constraintMatch) {
			re.lastIndex += constraintMatch[0].length;
			result += `(${groups[Number(constraintMatch[1])]})`;
		} else result += "[^/]+";
	} else switch (m[0]) {
		case ".":
			result += "\\.";
			break;
		case "+":
			result += "\\+";
			break;
		case "?":
			result += "\\?";
			break;
		case "*":
			result += ".*";
			break;
		default:
			result += m[0];
			break;
	}
	return result;
}
/**
* Parse a Cookie header string into a key-value record.
*/
function parseCookies(cookieHeader) {
	if (!cookieHeader) return {};
	const cookies = {};
	for (const part of cookieHeader.split(";")) {
		const eq = part.indexOf("=");
		if (eq === -1) continue;
		const key = part.slice(0, eq).trim();
		const value = part.slice(eq + 1).trim();
		if (key) cookies[key] = value;
	}
	return cookies;
}
/**
* Build a RequestContext from a Web Request object.
*/
function requestContextFromRequest(request) {
	const url = new URL(request.url);
	return {
		headers: request.headers,
		cookies: parseCookies(request.headers.get("cookie")),
		query: url.searchParams,
		host: normalizeHost(request.headers.get("host"), url.hostname)
	};
}
function normalizeHost(hostHeader, fallbackHostname) {
	return (hostHeader ?? fallbackHostname).split(":", 1)[0].toLowerCase();
}
function _emptyParams() {
	return Object.create(null);
}
function _matchConditionValue(actualValue, expectedValue) {
	if (expectedValue === void 0) return _emptyParams();
	const re = _cachedConditionRegex(expectedValue);
	if (re) {
		const match = re.exec(actualValue);
		if (!match) return null;
		const params = _emptyParams();
		if (match.groups) {
			for (const [key, value] of Object.entries(match.groups)) if (value !== void 0) params[key] = value;
		}
		return params;
	}
	return actualValue === expectedValue ? _emptyParams() : null;
}
/**
* Check a single has/missing condition against request context.
* Returns captured params when the condition is satisfied, or null otherwise.
*/
function matchSingleCondition(condition, ctx) {
	switch (condition.type) {
		case "header": {
			const headerValue = ctx.headers.get(condition.key);
			if (headerValue === null) return null;
			return _matchConditionValue(headerValue, condition.value);
		}
		case "cookie": {
			const cookieValue = ctx.cookies[condition.key];
			if (cookieValue === void 0) return null;
			return _matchConditionValue(cookieValue, condition.value);
		}
		case "query": {
			const queryValue = ctx.query.get(condition.key);
			if (queryValue === null) return null;
			return _matchConditionValue(queryValue, condition.value);
		}
		case "host":
			if (condition.value !== void 0) return _matchConditionValue(ctx.host, condition.value);
			return ctx.host === condition.key ? _emptyParams() : null;
		default: return null;
	}
}
/**
* Return a cached RegExp for a has/missing condition value string, compiling
* on first use. Returns null if safeRegExp rejected the pattern or if the
* value is not a valid regex (fall back to exact string comparison).
*/
function _cachedConditionRegex(value) {
	let re = _compiledConditionCache.get(value);
	if (re === void 0) {
		re = safeRegExp(value);
		_compiledConditionCache.set(value, re);
	}
	return re;
}
/**
* Check all has/missing conditions for a config rule.
* Returns true if the rule should be applied (all has conditions pass, all missing conditions pass).
*
* - has: every condition must match (the request must have it)
* - missing: every condition must NOT match (the request must not have it)
*/
function collectConditionParams(has, missing, ctx) {
	const params = _emptyParams();
	if (has) for (const condition of has) {
		const conditionParams = matchSingleCondition(condition, ctx);
		if (!conditionParams) return null;
		Object.assign(params, conditionParams);
	}
	if (missing) {
		for (const condition of missing) if (matchSingleCondition(condition, ctx)) return null;
	}
	return params;
}
function checkHasConditions(has, missing, ctx) {
	return collectConditionParams(has, missing, ctx) !== null;
}
/**
* If the current position in `str` starts with a parenthesized group, consume
* it and advance `re.lastIndex` past the closing `)`. Returns the group
* contents or null if no group is present.
*/
function extractConstraint(str, re) {
	if (str[re.lastIndex] !== "(") return null;
	const start = re.lastIndex + 1;
	let depth = 1;
	let i = start;
	while (i < str.length && depth > 0) {
		if (str[i] === "(") depth++;
		else if (str[i] === ")") depth--;
		i++;
	}
	if (depth !== 0) return null;
	re.lastIndex = i;
	return str.slice(start, i - 1);
}
/**
* Match a Next.js config pattern (from redirects/rewrites sources) against a pathname.
* Returns matched params or null.
*
* Supports:
*   :param     - matches a single path segment
*   :param*    - matches zero or more segments (catch-all)
*   :param+    - matches one or more segments
*   (regex)    - inline regex patterns in the source
*   :param(constraint) - named param with inline regex constraint
*/
function matchConfigPattern(pathname, pattern) {
	if (pattern.includes("(") || pattern.includes("\\") || /:[\w-]+[*+][^/]/.test(pattern) || /:[\w-]+\./.test(pattern)) try {
		let compiled = _compiledPatternCache.get(pattern);
		if (compiled === void 0) {
			const paramNames = [];
			let regexStr = "";
			const tokenRe = /:([\w-]+)|[.]|[^:.]+/g;
			let tok;
			while ((tok = tokenRe.exec(pattern)) !== null) if (tok[1] !== void 0) {
				const name = tok[1];
				const rest = pattern.slice(tokenRe.lastIndex);
				if (rest.startsWith("*") || rest.startsWith("+")) {
					const quantifier = rest[0];
					tokenRe.lastIndex += 1;
					const constraint = extractConstraint(pattern, tokenRe);
					paramNames.push(name);
					if (constraint !== null) regexStr += `(${constraint})`;
					else regexStr += quantifier === "*" ? "(.*)" : "(.+)";
				} else {
					const constraint = extractConstraint(pattern, tokenRe);
					paramNames.push(name);
					regexStr += constraint !== null ? `(${constraint})` : "([^/]+)";
				}
			} else if (tok[0] === ".") regexStr += "\\.";
			else regexStr += tok[0];
			const re = safeRegExp("^" + regexStr + "$");
			compiled = re ? {
				re,
				paramNames
			} : null;
			_compiledPatternCache.set(pattern, compiled);
		}
		if (!compiled) return null;
		const match = compiled.re.exec(pathname);
		if (!match) return null;
		const params = Object.create(null);
		for (let i = 0; i < compiled.paramNames.length; i++) params[compiled.paramNames[i]] = match[i + 1] ?? "";
		return params;
	} catch {}
	const catchAllMatch = pattern.match(/:([\w-]+)(\*|\+)$/);
	if (catchAllMatch) {
		const prefix = pattern.slice(0, pattern.lastIndexOf(":"));
		const paramName = catchAllMatch[1];
		const isPlus = catchAllMatch[2] === "+";
		const prefixNoSlash = prefix.replace(/\/$/, "");
		if (!pathname.startsWith(prefixNoSlash)) return null;
		const charAfter = pathname[prefixNoSlash.length];
		if (charAfter !== void 0 && charAfter !== "/") return null;
		const rest = pathname.slice(prefixNoSlash.length);
		if (isPlus && (!rest || rest === "/")) return null;
		let restValue = rest.startsWith("/") ? rest.slice(1) : rest;
		return { [paramName]: restValue };
	}
	const parts = pattern.split("/");
	const pathParts = pathname.split("/");
	if (parts.length !== pathParts.length) return null;
	const params = Object.create(null);
	for (let i = 0; i < parts.length; i++) if (parts[i].startsWith(":")) params[parts[i].slice(1)] = pathParts[i];
	else if (parts[i] !== pathParts[i]) return null;
	return params;
}
/**
* Apply redirect rules from next.config.js.
* Returns the redirect info if a redirect was matched, or null.
*
* `ctx` provides the request context (cookies, headers, query, host) used
* to evaluate has/missing conditions. Next.js always has request context
* when evaluating redirects, so this parameter is required.
*
* ## Performance
*
* Rules with a locale-capture-group prefix (the dominant pattern in large
* Next.js apps — e.g. `/:locale(en|es|fr|...)?/some-path`) are handled via
* a pre-built index. Instead of running exec() on each locale regex
* individually, we:
*
*   1. Strip the optional locale prefix from the pathname with one cheap
*      string-slice check (no regex exec on the hot path).
*   2. Look up the stripped suffix in a Map<suffix, entry[]>.
*   3. For each matching entry, validate the captured locale string against
*      a small, anchored alternation regex.
*
* This reduces the per-request cost from O(n × regex) to O(1) map lookup +
* O(matches × tiny-regex), eliminating the ~2992ms self-time reported in
* profiles for apps with 63+ locale-prefixed rules.
*
* Rules that don't fit the locale-static pattern fall back to the original
* linear matchConfigPattern scan.
*
* ## Ordering invariant
*
* First match wins, preserving the original redirect array order. When a
* locale-static fast-path match is found at position N, all linear rules with
* an original index < N are checked via matchConfigPattern first — they are
* few in practice (typically zero) so this is not a hot-path concern.
*/
function matchRedirect(pathname, redirects, ctx) {
	if (redirects.length === 0) return null;
	const index = _getRedirectIndex(redirects);
	let localeMatch = null;
	let localeMatchIndex = Infinity;
	if (index.localeStatic.size > 0) {
		const noLocaleBucket = index.localeStatic.get(pathname);
		if (noLocaleBucket) for (const entry of noLocaleBucket) {
			if (entry.originalIndex >= localeMatchIndex) continue;
			const redirect = entry.redirect;
			const conditionParams = redirect.has || redirect.missing ? collectConditionParams(redirect.has, redirect.missing, ctx) : _emptyParams();
			if (!conditionParams) continue;
			let dest = substituteDestinationParams(redirect.destination, {
				[entry.paramName]: "",
				...conditionParams
			});
			dest = sanitizeDestination(dest);
			localeMatch = {
				destination: dest,
				permanent: redirect.permanent
			};
			localeMatchIndex = entry.originalIndex;
			break;
		}
		const slashTwo = pathname.indexOf("/", 1);
		if (slashTwo !== -1) {
			const suffix = pathname.slice(slashTwo);
			const localePart = pathname.slice(1, slashTwo);
			const localeBucket = index.localeStatic.get(suffix);
			if (localeBucket) for (const entry of localeBucket) {
				if (entry.originalIndex >= localeMatchIndex) continue;
				if (!entry.altRe.test(localePart)) continue;
				const redirect = entry.redirect;
				const conditionParams = redirect.has || redirect.missing ? collectConditionParams(redirect.has, redirect.missing, ctx) : _emptyParams();
				if (!conditionParams) continue;
				let dest = substituteDestinationParams(redirect.destination, {
					[entry.paramName]: localePart,
					...conditionParams
				});
				dest = sanitizeDestination(dest);
				localeMatch = {
					destination: dest,
					permanent: redirect.permanent
				};
				localeMatchIndex = entry.originalIndex;
				break;
			}
		}
	}
	for (const [origIdx, redirect] of index.linear) {
		if (origIdx >= localeMatchIndex) break;
		const params = matchConfigPattern(pathname, redirect.source);
		if (params) {
			const conditionParams = redirect.has || redirect.missing ? collectConditionParams(redirect.has, redirect.missing, ctx) : _emptyParams();
			if (!conditionParams) continue;
			let dest = substituteDestinationParams(redirect.destination, {
				...params,
				...conditionParams
			});
			dest = sanitizeDestination(dest);
			return {
				destination: dest,
				permanent: redirect.permanent
			};
		}
	}
	return localeMatch;
}
/**
* Apply rewrite rules from next.config.js.
* Returns the rewritten URL or null if no rewrite matched.
*
* `ctx` provides the request context (cookies, headers, query, host) used
* to evaluate has/missing conditions. Next.js always has request context
* when evaluating rewrites, so this parameter is required.
*/
function matchRewrite(pathname, rewrites, ctx) {
	for (const rewrite of rewrites) {
		const params = matchConfigPattern(pathname, rewrite.source);
		if (params) {
			const conditionParams = rewrite.has || rewrite.missing ? collectConditionParams(rewrite.has, rewrite.missing, ctx) : _emptyParams();
			if (!conditionParams) continue;
			let dest = substituteDestinationParams(rewrite.destination, {
				...params,
				...conditionParams
			});
			dest = sanitizeDestination(dest);
			return dest;
		}
	}
	return null;
}
/**
* Substitute all matched route params into a redirect/rewrite destination.
*
* Handles repeated params (e.g. `/api/:id/:id`) and catch-all suffix forms
* (`:path*`, `:path+`) in a single pass. Unknown params are left intact.
*/
function substituteDestinationParams(destination, params) {
	const keys = Object.keys(params);
	if (keys.length === 0) return destination;
	const sortedKeys = [...keys].sort((a, b) => b.length - a.length);
	const cacheKey = sortedKeys.join("\0");
	let paramRe = _compiledDestinationParamCache.get(cacheKey);
	if (!paramRe) {
		const paramAlternation = sortedKeys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
		paramRe = new RegExp(`:(${paramAlternation})([+*])?(?![A-Za-z0-9_])`, "g");
		_compiledDestinationParamCache.set(cacheKey, paramRe);
	}
	return destination.replace(paramRe, (_token, key) => params[key]);
}
/**
* Sanitize a redirect/rewrite destination to collapse protocol-relative URLs.
*
* After parameter substitution, a destination like `/:path*` can become
* `//evil.com` if the catch-all captured a decoded `%2F` (`/evil.com`).
* Browsers interpret `//evil.com` as a protocol-relative URL, redirecting
* users off-site.
*
* This function collapses any leading double (or more) slashes to a single
* slash for non-external (relative) destinations.
*/
function sanitizeDestination(dest) {
	if (dest.startsWith("http://") || dest.startsWith("https://")) return dest;
	dest = dest.replace(/^[\\/]+/, "/");
	return dest;
}
/**
* Check if a URL is external (absolute URL or protocol-relative).
* Detects any URL scheme (http:, https:, data:, javascript:, blob:, etc.)
* per RFC 3986, plus protocol-relative URLs (//).
*/
function isExternalUrl(url) {
	return /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//");
}
/**
* Proxy an incoming request to an external URL and return the upstream response.
*
* Used for external rewrites (e.g. `/ph/:path*` → `https://us.i.posthog.com/:path*`).
* Next.js handles these as server-side reverse proxies, forwarding the request
* method, headers, and body to the external destination.
*
* Works in all runtimes (Node.js, Cloudflare Workers) via the standard fetch() API.
*/
async function proxyExternalRequest(request, externalUrl) {
	const originalUrl = new URL(request.url);
	const targetUrl = new URL(externalUrl);
	const destinationKeys = new Set(targetUrl.searchParams.keys());
	for (const [key, value] of originalUrl.searchParams) if (!destinationKeys.has(key)) targetUrl.searchParams.append(key, value);
	const headers = new Headers(request.headers);
	headers.set("host", targetUrl.host);
	stripHopByHopRequestHeaders(headers);
	const keysToDelete = [];
	for (const key of headers.keys()) if (key.startsWith("x-middleware-")) keysToDelete.push(key);
	for (const key of keysToDelete) headers.delete(key);
	const method = request.method;
	const hasBody = method !== "GET" && method !== "HEAD";
	const init = {
		method,
		headers,
		redirect: "manual"
	};
	if (hasBody && request.body) {
		init.body = request.body;
		init.duplex = "half";
	}
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 3e4);
	let upstreamResponse;
	try {
		upstreamResponse = await fetch(targetUrl.href, {
			...init,
			signal: controller.signal
		});
	} catch (e) {
		if (e?.name === "AbortError") {
			console.error("[vinext] External rewrite proxy timeout:", targetUrl.href);
			return new Response("Gateway Timeout", { status: 504 });
		}
		console.error("[vinext] External rewrite proxy error:", e);
		return new Response("Bad Gateway", { status: 502 });
	} finally {
		clearTimeout(timeout);
	}
	const isNodeRuntime = typeof process !== "undefined" && !!process.versions?.node;
	const responseHeaders = new Headers();
	upstreamResponse.headers.forEach((value, key) => {
		const lower = key.toLowerCase();
		if (HOP_BY_HOP_HEADERS.has(lower)) return;
		if (isNodeRuntime && (lower === "content-encoding" || lower === "content-length")) return;
		responseHeaders.append(key, value);
	});
	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
		headers: responseHeaders
	});
}
/**
* Apply custom header rules from next.config.js.
* Returns an array of { key, value } pairs to set on the response.
*
* `ctx` provides the request context (cookies, headers, query, host) used
* to evaluate has/missing conditions. Next.js always has request context
* when evaluating headers, so this parameter is required.
*/
function matchHeaders(pathname, headers, ctx) {
	const result = [];
	for (const rule of headers) {
		let sourceRegex = _compiledHeaderSourceCache.get(rule.source);
		if (sourceRegex === void 0) {
			sourceRegex = safeRegExp("^" + escapeHeaderSource(rule.source) + "$");
			_compiledHeaderSourceCache.set(rule.source, sourceRegex);
		}
		if (sourceRegex && sourceRegex.test(pathname)) {
			if (rule.has || rule.missing) {
				if (!checkHasConditions(rule.has, rule.missing, ctx)) continue;
			}
			result.push(...rule.headers);
		}
	}
	return result;
}
//#endregion
//#region node_modules/vinext/dist/server/request-pipeline.js
/**
* Shared request pipeline utilities.
*
* Extracted from the App Router RSC entry (entries/app-rsc-entry.ts) to enable
* reuse across entry points. Currently consumed by app-rsc-entry.ts;
* dev-server.ts, prod-server.ts, and index.ts still have inline versions
* that should be migrated in follow-up work.
*
* These utilities handle the common request lifecycle steps: protocol-
* relative URL guards, basePath stripping, trailing slash normalization,
* and CSRF origin validation.
*/
/**
* Guard against protocol-relative URL open redirects.
*
* Paths like `//example.com/` would be redirected to `//example.com` by the
* trailing-slash normalizer, which browsers interpret as `http://example.com`.
* Backslashes are equivalent to forward slashes in the URL spec
* (e.g. `/\evil.com` is treated as `//evil.com` by browsers).
*
* Next.js returns 404 for these paths. We check the RAW pathname before
* normalization so the guard fires before normalizePath collapses `//`.
*
* @param rawPathname - The raw pathname from the URL, before any normalization
* @returns A 404 Response if the path is protocol-relative, or null to continue
*/
function guardProtocolRelativeUrl(rawPathname) {
	if (rawPathname.replaceAll("\\", "/").startsWith("//")) return new Response("404 Not Found", { status: 404 });
	return null;
}
/**
* Check if the pathname needs a trailing slash redirect, and return the
* redirect Response if so.
*
* Follows Next.js behavior:
* - `/api` routes are never redirected
* - The root path `/` is never redirected
* - If `trailingSlash` is true, redirect `/about` → `/about/`
* - If `trailingSlash` is false (default), redirect `/about/` → `/about`
*
* @param pathname - The basePath-stripped pathname
* @param basePath - The basePath to prepend to the redirect Location
* @param trailingSlash - Whether trailing slashes should be enforced
* @param search - The query string (including `?`) to preserve in the redirect
* @returns A 308 redirect Response, or null if no redirect is needed
*/
function normalizeTrailingSlash(pathname, basePath, trailingSlash, search) {
	if (pathname === "/" || pathname === "/api" || pathname.startsWith("/api/")) return null;
	const hasTrailing = pathname.endsWith("/");
	if (trailingSlash && !hasTrailing && !pathname.endsWith(".rsc")) return new Response(null, {
		status: 308,
		headers: { Location: basePath + pathname + "/" + search }
	});
	if (!trailingSlash && hasTrailing) return new Response(null, {
		status: 308,
		headers: { Location: basePath + pathname.replace(/\/+$/, "") + search }
	});
	return null;
}
/**
* Validate CSRF origin for server action requests.
*
* Matches Next.js behavior: compares the Origin header against the Host
* header. If they don't match, the request is rejected with 403 unless
* the origin is in the allowedOrigins list.
*
* @param request - The incoming Request
* @param allowedOrigins - Origins from experimental.serverActions.allowedOrigins
* @returns A 403 Response if origin validation fails, or null to continue
*/
function validateCsrfOrigin(request, allowedOrigins = []) {
	const originHeader = request.headers.get("origin");
	if (!originHeader) return null;
	if (originHeader === "null") {
		if (allowedOrigins.includes("null")) return null;
		console.warn(`[vinext] CSRF origin "null" blocked for server action. To allow requests from sandboxed contexts, add "null" to experimental.serverActions.allowedOrigins.`);
		return new Response("Forbidden", {
			status: 403,
			headers: { "Content-Type": "text/plain" }
		});
	}
	let originHost;
	try {
		originHost = new URL(originHeader).host.toLowerCase();
	} catch {
		return new Response("Forbidden", {
			status: 403,
			headers: { "Content-Type": "text/plain" }
		});
	}
	const hostHeader = (request.headers.get("host") || "").split(",")[0].trim().toLowerCase() || new URL(request.url).host.toLowerCase();
	if (originHost === hostHeader) return null;
	if (allowedOrigins.length > 0 && isOriginAllowed(originHost, allowedOrigins)) return null;
	console.warn(`[vinext] CSRF origin mismatch: origin "${originHost}" does not match host "${hostHeader}". Blocking server action request.`);
	return new Response("Forbidden", {
		status: 403,
		headers: { "Content-Type": "text/plain" }
	});
}
/**
* Check if an origin matches any pattern in the allowed origins list.
* Supports wildcard subdomains (e.g. `*.example.com`).
*/
function isOriginAllowed(origin, allowed) {
	for (const pattern of allowed) if (pattern.startsWith("*.")) {
		const suffix = pattern.slice(1);
		if (origin === pattern.slice(2) || origin.endsWith(suffix)) return true;
	} else if (origin === pattern) return true;
	return false;
}
/**
* Validate an image optimization URL parameter.
*
* Ensures the URL is a relative path that doesn't escape the origin:
* - Must start with "/" but not "//"
* - Backslashes are normalized (browsers treat `\` as `/`)
* - Origin validation as defense-in-depth
*
* @param rawUrl - The raw `url` query parameter value
* @param requestUrl - The full request URL for origin comparison
* @returns An error Response if validation fails, or the normalized image URL
*/
function validateImageUrl(rawUrl, requestUrl) {
	const imgUrl = rawUrl?.replaceAll("\\", "/") ?? null;
	if (!imgUrl || !imgUrl.startsWith("/") || imgUrl.startsWith("//")) return new Response(!rawUrl ? "Missing url parameter" : "Only relative URLs allowed", { status: 400 });
	const url = new URL(requestUrl);
	if (new URL(imgUrl, url.origin).origin !== url.origin) return new Response("Only relative URLs allowed", { status: 400 });
	return imgUrl;
}
/**
* Strip internal `x-middleware-*` headers from a Headers object.
*
* Middleware uses `x-middleware-*` headers as internal signals (e.g.
* `x-middleware-next`, `x-middleware-rewrite`, `x-middleware-request-*`).
* These must be removed before sending the response to the client.
*
* @param headers - The Headers object to modify in place
*/
function processMiddlewareHeaders(headers) {
	const keysToDelete = [];
	for (const key of headers.keys()) if (key.startsWith("x-middleware-")) keysToDelete.push(key);
	for (const key of keysToDelete) headers.delete(key);
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-runtime.js
var ROUTE_HANDLER_HTTP_METHODS = [
	"GET",
	"HEAD",
	"POST",
	"PUT",
	"DELETE",
	"PATCH",
	"OPTIONS"
];
function collectRouteHandlerMethods(handler) {
	const methods = ROUTE_HANDLER_HTTP_METHODS.filter((method) => typeof handler[method] === "function");
	if (methods.includes("GET") && !methods.includes("HEAD")) methods.push("HEAD");
	return methods;
}
function buildRouteHandlerAllowHeader(exportedMethods) {
	const allow = new Set(exportedMethods);
	allow.add("OPTIONS");
	return Array.from(allow).sort().join(", ");
}
var _KNOWN_DYNAMIC_APP_ROUTE_HANDLERS_KEY = Symbol.for("vinext.appRouteHandlerRuntime.knownDynamicHandlers");
var _g$4 = globalThis;
var knownDynamicAppRouteHandlers = _g$4[_KNOWN_DYNAMIC_APP_ROUTE_HANDLERS_KEY] ??= /* @__PURE__ */ new Set();
function isKnownDynamicAppRoute(pattern) {
	return knownDynamicAppRouteHandlers.has(pattern);
}
function markKnownDynamicAppRoute(pattern) {
	knownDynamicAppRouteHandlers.add(pattern);
}
function bindMethodIfNeeded(value, target) {
	return typeof value === "function" ? value.bind(target) : value;
}
function buildNextConfig(options) {
	if (!options.basePath && !options.i18n) return null;
	return {
		basePath: options.basePath,
		i18n: options.i18n ?? void 0
	};
}
function createTrackedAppRouteRequest(request, options = {}) {
	let didAccessDynamicRequest = false;
	const nextConfig = buildNextConfig(options);
	const markDynamicAccess = (access) => {
		didAccessDynamicRequest = true;
		options.onDynamicAccess?.(access);
	};
	const wrapNextUrl = (nextUrl) => {
		return new Proxy(nextUrl, { get(target, prop) {
			switch (prop) {
				case "search":
				case "searchParams":
				case "url":
				case "href":
				case "toJSON":
				case "toString":
				case "origin":
					markDynamicAccess(`nextUrl.${String(prop)}`);
					return bindMethodIfNeeded(Reflect.get(target, prop, target), target);
				case "clone": return () => wrapNextUrl(target.clone());
				default: return bindMethodIfNeeded(Reflect.get(target, prop, target), target);
			}
		} });
	};
	const wrapRequest = (input) => {
		const nextRequest = input instanceof NextRequest ? input : new NextRequest(input, { nextConfig: nextConfig ?? void 0 });
		let proxiedNextUrl = null;
		return new Proxy(nextRequest, { get(target, prop) {
			switch (prop) {
				case "nextUrl":
					proxiedNextUrl ??= wrapNextUrl(target.nextUrl);
					return proxiedNextUrl;
				case "headers":
				case "cookies":
				case "url":
				case "body":
				case "blob":
				case "json":
				case "text":
				case "arrayBuffer":
				case "formData":
					markDynamicAccess(`request.${String(prop)}`);
					return bindMethodIfNeeded(Reflect.get(target, prop, target), target);
				case "clone": return () => wrapRequest(target.clone());
				default: return bindMethodIfNeeded(Reflect.get(target, prop, target), target);
			}
		} });
	};
	return {
		request: wrapRequest(request),
		didAccessDynamicRequest() {
			return didAccessDynamicRequest;
		}
	};
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-policy.js
function getAppRouteHandlerRevalidateSeconds(handler) {
	return typeof handler.revalidate === "number" && handler.revalidate > 0 && handler.revalidate !== Infinity ? handler.revalidate : null;
}
function hasAppRouteHandlerDefaultExport(handler) {
	return typeof handler.default === "function";
}
function resolveAppRouteHandlerMethod(handler, method) {
	const exportedMethods = collectRouteHandlerMethods(handler);
	const allowHeaderForOptions = buildRouteHandlerAllowHeader(exportedMethods);
	const shouldAutoRespondToOptions = method === "OPTIONS" && typeof handler.OPTIONS !== "function";
	let handlerFn = typeof handler[method] === "function" ? handler[method] : void 0;
	let isAutoHead = false;
	if (method === "HEAD" && typeof handler.HEAD !== "function" && typeof handler.GET === "function") {
		handlerFn = handler.GET;
		isAutoHead = true;
	}
	return {
		allowHeaderForOptions,
		exportedMethods,
		handlerFn,
		isAutoHead,
		shouldAutoRespondToOptions
	};
}
function shouldReadAppRouteHandlerCache(options) {
	return options.isProduction && options.revalidateSeconds !== null && options.dynamicConfig !== "force-dynamic" && !options.isKnownDynamic && (options.method === "GET" || options.isAutoHead) && typeof options.handlerFn === "function";
}
function shouldApplyAppRouteHandlerRevalidateHeader(options) {
	return options.revalidateSeconds !== null && !options.dynamicUsedInHandler && (options.method === "GET" || options.isAutoHead) && !options.handlerSetCacheControl;
}
function shouldWriteAppRouteHandlerCache(options) {
	return options.isProduction && options.revalidateSeconds !== null && options.dynamicConfig !== "force-dynamic" && shouldApplyAppRouteHandlerRevalidateHeader(options);
}
function resolveAppRouteHandlerSpecialError(error, requestUrl) {
	if (!(error && typeof error === "object" && "digest" in error)) return null;
	const digest = String(error.digest);
	if (digest.startsWith("NEXT_REDIRECT;")) {
		const parts = digest.split(";");
		const redirectUrl = decodeURIComponent(parts[2]);
		return {
			kind: "redirect",
			location: new URL(redirectUrl, requestUrl).toString(),
			statusCode: parts[3] ? parseInt(parts[3], 10) : 307
		};
	}
	if (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;")) return {
		kind: "status",
		statusCode: digest === "NEXT_NOT_FOUND" ? 404 : parseInt(digest.split(";")[1], 10)
	};
	return null;
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-response.js
function buildRouteHandlerCacheControl(cacheState, revalidateSeconds) {
	if (cacheState === "STALE") return "s-maxage=0, stale-while-revalidate";
	return `s-maxage=${revalidateSeconds}, stale-while-revalidate`;
}
function applyRouteHandlerMiddlewareContext(response, middlewareContext) {
	if (!middlewareContext.headers && middlewareContext.status == null) return response;
	const responseHeaders = new Headers(response.headers);
	if (middlewareContext.headers) for (const [key, value] of middlewareContext.headers) responseHeaders.append(key, value);
	return new Response(response.body, {
		status: middlewareContext.status ?? response.status,
		statusText: response.statusText,
		headers: responseHeaders
	});
}
function buildRouteHandlerCachedResponse(cachedValue, options) {
	const headers = new Headers();
	for (const [key, value] of Object.entries(cachedValue.headers)) if (Array.isArray(value)) for (const entry of value) headers.append(key, entry);
	else headers.set(key, value);
	headers.set("X-Vinext-Cache", options.cacheState);
	headers.set("Cache-Control", buildRouteHandlerCacheControl(options.cacheState, options.revalidateSeconds));
	return new Response(options.isHead ? null : cachedValue.body, {
		status: cachedValue.status,
		headers
	});
}
function applyRouteHandlerRevalidateHeader(response, revalidateSeconds) {
	response.headers.set("cache-control", buildRouteHandlerCacheControl("HIT", revalidateSeconds));
}
function markRouteHandlerCacheMiss(response) {
	response.headers.set("X-Vinext-Cache", "MISS");
}
async function buildAppRouteCacheValue(response) {
	const body = await response.arrayBuffer();
	const headers = {};
	response.headers.forEach((value, key) => {
		if (key !== "x-vinext-cache" && key !== "cache-control") headers[key] = value;
	});
	return {
		kind: "APP_ROUTE",
		body,
		status: response.status,
		headers
	};
}
function finalizeRouteHandlerResponse(response, options) {
	const { pendingCookies, draftCookie, isHead } = options;
	if (pendingCookies.length === 0 && !draftCookie && !isHead) return response;
	const headers = new Headers(response.headers);
	for (const cookie of pendingCookies) headers.append("Set-Cookie", cookie);
	if (draftCookie) headers.append("Set-Cookie", draftCookie);
	return new Response(isHead ? null : response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-execution.js
async function runAppRouteHandler(options) {
	options.consumeDynamicUsage();
	const trackedRequest = createTrackedAppRouteRequest(options.request, {
		basePath: options.basePath,
		i18n: options.i18n,
		onDynamicAccess() {
			options.markDynamicUsage();
		}
	});
	const response = await options.handlerFn(trackedRequest.request, { params: options.params });
	return {
		dynamicUsedInHandler: options.consumeDynamicUsage(),
		response
	};
}
async function executeAppRouteHandler(options) {
	const previousHeadersPhase = options.setHeadersAccessPhase("route-handler");
	try {
		const { dynamicUsedInHandler, response } = await runAppRouteHandler(options);
		const handlerSetCacheControl = response.headers.has("cache-control");
		if (dynamicUsedInHandler) markKnownDynamicAppRoute(options.routePattern);
		if (shouldApplyAppRouteHandlerRevalidateHeader({
			dynamicUsedInHandler,
			handlerSetCacheControl,
			isAutoHead: options.isAutoHead,
			method: options.method,
			revalidateSeconds: options.revalidateSeconds
		})) {
			const revalidateSeconds = options.revalidateSeconds;
			if (revalidateSeconds == null) throw new Error("Expected route handler revalidate seconds");
			applyRouteHandlerRevalidateHeader(response, revalidateSeconds);
		}
		if (shouldWriteAppRouteHandlerCache({
			dynamicConfig: options.handler.dynamic,
			dynamicUsedInHandler,
			handlerSetCacheControl,
			isAutoHead: options.isAutoHead,
			isProduction: options.isProduction,
			method: options.method,
			revalidateSeconds: options.revalidateSeconds
		})) {
			markRouteHandlerCacheMiss(response);
			const routeClone = response.clone();
			const routeKey = options.isrRouteKey(options.cleanPathname);
			const revalidateSeconds = options.revalidateSeconds;
			if (revalidateSeconds == null) throw new Error("Expected route handler cache revalidate seconds");
			const routeTags = options.buildPageCacheTags(options.cleanPathname, options.getCollectedFetchTags());
			const routeWritePromise = (async () => {
				try {
					const routeCacheValue = await buildAppRouteCacheValue(routeClone);
					await options.isrSet(routeKey, routeCacheValue, revalidateSeconds, routeTags);
					options.isrDebug?.("route cache written", routeKey);
				} catch (cacheErr) {
					console.error("[vinext] ISR route cache write error:", cacheErr);
				}
			})();
			options.executionContext?.waitUntil(routeWritePromise);
		}
		const pendingCookies = options.getAndClearPendingCookies();
		const draftCookie = options.getDraftModeCookieHeader();
		options.clearRequestContext();
		return applyRouteHandlerMiddlewareContext(finalizeRouteHandlerResponse(response, {
			pendingCookies,
			draftCookie,
			isHead: options.isAutoHead
		}), options.middlewareContext);
	} catch (error) {
		options.getAndClearPendingCookies();
		const specialError = resolveAppRouteHandlerSpecialError(error, options.request.url);
		options.clearRequestContext();
		if (specialError) {
			if (specialError.kind === "redirect") return applyRouteHandlerMiddlewareContext(new Response(null, {
				status: specialError.statusCode,
				headers: { Location: specialError.location }
			}), options.middlewareContext);
			return applyRouteHandlerMiddlewareContext(new Response(null, { status: specialError.statusCode }), options.middlewareContext);
		}
		console.error("[vinext] Route handler error:", error);
		options.reportRequestError(error instanceof Error ? error : new Error(String(error)), {
			path: options.cleanPathname,
			method: options.request.method,
			headers: Object.fromEntries(options.request.headers.entries())
		}, {
			routerKind: "App Router",
			routePath: options.routePattern,
			routeType: "route"
		});
		return applyRouteHandlerMiddlewareContext(new Response(null, { status: 500 }), options.middlewareContext);
	} finally {
		options.setHeadersAccessPhase(previousHeadersPhase);
	}
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-cache.js
function getCachedAppRouteValue(entry) {
	return entry?.value.value && entry.value.value.kind === "APP_ROUTE" ? entry.value.value : null;
}
async function readAppRouteHandlerCacheResponse(options) {
	const routeKey = options.isrRouteKey(options.cleanPathname);
	try {
		const cached = await options.isrGet(routeKey);
		const cachedValue = getCachedAppRouteValue(cached);
		if (cachedValue && !cached?.isStale) {
			options.isrDebug?.("HIT (route)", options.cleanPathname);
			options.clearRequestContext();
			return applyRouteHandlerMiddlewareContext(buildRouteHandlerCachedResponse(cachedValue, {
				cacheState: "HIT",
				isHead: options.isAutoHead,
				revalidateSeconds: options.revalidateSeconds
			}), options.middlewareContext);
		}
		if (cached?.isStale && cachedValue) {
			const staleValue = cachedValue;
			const revalidateSearchParams = new URLSearchParams(options.revalidateSearchParams);
			options.scheduleBackgroundRegeneration(routeKey, async () => {
				await options.runInRevalidationContext(async () => {
					options.setNavigationContext({
						pathname: options.cleanPathname,
						searchParams: revalidateSearchParams,
						params: options.params
					});
					const { dynamicUsedInHandler, response } = await runAppRouteHandler({
						basePath: options.basePath,
						consumeDynamicUsage: options.consumeDynamicUsage,
						handlerFn: options.handlerFn,
						i18n: options.i18n,
						markDynamicUsage: options.markDynamicUsage,
						params: options.params,
						request: new Request(options.requestUrl, { method: "GET" })
					});
					options.setNavigationContext(null);
					if (dynamicUsedInHandler) {
						markKnownDynamicAppRoute(options.routePattern);
						options.isrDebug?.("route regen skipped (dynamic usage)", options.cleanPathname);
						return;
					}
					const routeTags = options.buildPageCacheTags(options.cleanPathname, options.getCollectedFetchTags());
					const routeCacheValue = await buildAppRouteCacheValue(response);
					await options.isrSet(routeKey, routeCacheValue, options.revalidateSeconds, routeTags);
					options.isrDebug?.("route regen complete", routeKey);
				});
			});
			options.isrDebug?.("STALE (route)", options.cleanPathname);
			options.clearRequestContext();
			return applyRouteHandlerMiddlewareContext(buildRouteHandlerCachedResponse(staleValue, {
				cacheState: "STALE",
				isHead: options.isAutoHead,
				revalidateSeconds: options.revalidateSeconds
			}), options.middlewareContext);
		}
	} catch (routeCacheError) {
		console.error("[vinext] ISR route cache read error:", routeCacheError);
	}
	return null;
}
//#endregion
//#region node_modules/vinext/dist/shims/cache.js
var MemoryCacheHandler = class {
	store = /* @__PURE__ */ new Map();
	tagRevalidatedAt = /* @__PURE__ */ new Map();
	async get(key, _ctx) {
		const entry = this.store.get(key);
		if (!entry) return null;
		for (const tag of entry.tags) {
			const revalidatedAt = this.tagRevalidatedAt.get(tag);
			if (revalidatedAt && revalidatedAt >= entry.lastModified) {
				this.store.delete(key);
				return null;
			}
		}
		if (entry.revalidateAt !== null && Date.now() > entry.revalidateAt) return {
			lastModified: entry.lastModified,
			value: entry.value,
			cacheState: "stale"
		};
		return {
			lastModified: entry.lastModified,
			value: entry.value
		};
	}
	async set(key, data, ctx) {
		const typedCtx = ctx;
		const tagSet = /* @__PURE__ */ new Set();
		if (data && "tags" in data && Array.isArray(data.tags)) for (const t of data.tags) tagSet.add(t);
		if (typedCtx && Array.isArray(typedCtx.tags)) for (const t of typedCtx.tags) tagSet.add(t);
		const tags = [...tagSet];
		let effectiveRevalidate;
		if (typedCtx) {
			const revalidate = typedCtx.cacheControl?.revalidate ?? typedCtx.revalidate;
			if (typeof revalidate === "number") effectiveRevalidate = revalidate;
		}
		if (data && "revalidate" in data && typeof data.revalidate === "number") effectiveRevalidate = data.revalidate;
		if (effectiveRevalidate === 0) return;
		const revalidateAt = typeof effectiveRevalidate === "number" && effectiveRevalidate > 0 ? Date.now() + effectiveRevalidate * 1e3 : null;
		this.store.set(key, {
			value: data,
			tags,
			lastModified: Date.now(),
			revalidateAt
		});
	}
	async revalidateTag(tags, _durations) {
		const tagList = Array.isArray(tags) ? tags : [tags];
		const now = Date.now();
		for (const tag of tagList) this.tagRevalidatedAt.set(tag, now);
	}
	resetRequestCache() {}
};
var _HANDLER_KEY = Symbol.for("vinext.cacheHandler");
var _gHandler = globalThis;
function _getActiveHandler() {
	return _gHandler[_HANDLER_KEY] ?? (_gHandler[_HANDLER_KEY] = new MemoryCacheHandler());
}
/**
* Get the active CacheHandler (for internal use or testing).
*/
function getCacheHandler() {
	return _getActiveHandler();
}
var _ALS_KEY$2 = Symbol.for("vinext.cache.als");
var _FALLBACK_KEY$2 = Symbol.for("vinext.cache.fallback");
var _g$3 = globalThis;
var _cacheAls = _g$3[_ALS_KEY$2] ??= new AsyncLocalStorage();
var _cacheFallbackState = _g$3[_FALLBACK_KEY$2] ??= { requestScopedCacheLife: null };
function _getCacheState() {
	if (isInsideUnifiedScope()) return getRequestContext();
	return _cacheAls.getStore() ?? _cacheFallbackState;
}
/**
* Consume and reset the request-scoped cache life. Returns null if none was set.
* @internal
*/
function _consumeRequestScopedCacheLife() {
	const state = _getCacheState();
	const config = state.requestScopedCacheLife;
	state.requestScopedCacheLife = null;
	return config;
}
/**
* AsyncLocalStorage to track whether we're inside an unstable_cache() callback.
* Stored on globalThis via Symbol so headers.ts can detect the scope without
* a direct import (avoiding circular dependencies).
*/
var _UNSTABLE_CACHE_ALS_KEY = Symbol.for("vinext.unstableCache.als");
_g$3[_UNSTABLE_CACHE_ALS_KEY] ??= new AsyncLocalStorage();
//#endregion
//#region node_modules/vinext/dist/server/isr-cache.js
var _PENDING_REGEN_KEY = Symbol.for("vinext.isrCache.pendingRegenerations");
var _g$2 = globalThis;
_g$2[_PENDING_REGEN_KEY] ??= /* @__PURE__ */ new Map();
/**
* Build a CachedAppPageValue for the App Router ISR cache.
*/
function buildAppPageCacheValue(html, rscData, status) {
	return {
		kind: "APP_PAGE",
		html,
		rscData,
		headers: void 0,
		postponed: void 0,
		status
	};
}
var _REVALIDATE_KEY = Symbol.for("vinext.isrCache.revalidateDurations");
_g$2[_REVALIDATE_KEY] ??= /* @__PURE__ */ new Map();
//#endregion
//#region node_modules/vinext/dist/server/app-page-cache.js
function buildAppPageCacheControl(cacheState, revalidateSeconds) {
	if (cacheState === "STALE") return "s-maxage=0, stale-while-revalidate";
	return `s-maxage=${revalidateSeconds}, stale-while-revalidate`;
}
function getCachedAppPageValue(entry) {
	return entry?.value.value && entry.value.value.kind === "APP_PAGE" ? entry.value.value : null;
}
function buildAppPageCachedResponse(cachedValue, options) {
	const status = cachedValue.status || 200;
	const headers = {
		"Cache-Control": buildAppPageCacheControl(options.cacheState, options.revalidateSeconds),
		Vary: "RSC, Accept",
		"X-Vinext-Cache": options.cacheState
	};
	if (options.isRscRequest) {
		if (!cachedValue.rscData) return null;
		return new Response(cachedValue.rscData, {
			status,
			headers: {
				"Content-Type": "text/x-component; charset=utf-8",
				...headers
			}
		});
	}
	if (typeof cachedValue.html !== "string" || cachedValue.html.length === 0) return null;
	return new Response(cachedValue.html, {
		status,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			...headers
		}
	});
}
async function readAppPageCacheResponse(options) {
	const isrKey = options.isRscRequest ? options.isrRscKey(options.cleanPathname) : options.isrHtmlKey(options.cleanPathname);
	try {
		const cached = await options.isrGet(isrKey);
		const cachedValue = getCachedAppPageValue(cached);
		if (cachedValue && !cached?.isStale) {
			const hitResponse = buildAppPageCachedResponse(cachedValue, {
				cacheState: "HIT",
				isRscRequest: options.isRscRequest,
				revalidateSeconds: options.revalidateSeconds
			});
			if (hitResponse) {
				options.isrDebug?.(options.isRscRequest ? "HIT (RSC)" : "HIT (HTML)", options.cleanPathname);
				options.clearRequestContext();
				return hitResponse;
			}
			options.isrDebug?.("MISS (empty cached entry)", options.cleanPathname);
		}
		if (cached?.isStale && cachedValue) {
			options.scheduleBackgroundRegeneration(options.cleanPathname, async () => {
				const revalidatedPage = await options.renderFreshPageForCache();
				await Promise.all([options.isrSet(options.isrHtmlKey(options.cleanPathname), buildAppPageCacheValue(revalidatedPage.html, void 0, 200), options.revalidateSeconds, revalidatedPage.tags), options.isrSet(options.isrRscKey(options.cleanPathname), buildAppPageCacheValue("", revalidatedPage.rscData, 200), options.revalidateSeconds, revalidatedPage.tags)]);
				options.isrDebug?.("regen complete", options.cleanPathname);
			});
			const staleResponse = buildAppPageCachedResponse(cachedValue, {
				cacheState: "STALE",
				isRscRequest: options.isRscRequest,
				revalidateSeconds: options.revalidateSeconds
			});
			if (staleResponse) {
				options.isrDebug?.(options.isRscRequest ? "STALE (RSC)" : "STALE (HTML)", options.cleanPathname);
				options.clearRequestContext();
				return staleResponse;
			}
			options.isrDebug?.("STALE MISS (empty stale entry)", options.cleanPathname);
		}
		if (!cached) options.isrDebug?.("MISS (no cache entry)", options.cleanPathname);
	} catch (isrReadError) {
		console.error("[vinext] ISR cache read error:", isrReadError);
	}
	return null;
}
function finalizeAppPageHtmlCacheResponse(response, options) {
	if (!response.body) return response;
	const [streamForClient, streamForCache] = response.body.tee();
	const htmlKey = options.isrHtmlKey(options.cleanPathname);
	const rscKey = options.isrRscKey(options.cleanPathname);
	const cachePromise = (async () => {
		try {
			const reader = streamForCache.getReader();
			const decoder = new TextDecoder();
			const chunks = [];
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				chunks.push(decoder.decode(value, { stream: true }));
			}
			chunks.push(decoder.decode());
			const pageTags = options.getPageTags();
			const writes = [options.isrSet(htmlKey, buildAppPageCacheValue(chunks.join(""), void 0, 200), options.revalidateSeconds, pageTags)];
			if (options.capturedRscDataPromise) writes.push(options.capturedRscDataPromise.then((rscData) => options.isrSet(rscKey, buildAppPageCacheValue("", rscData, 200), options.revalidateSeconds, pageTags)));
			await Promise.all(writes);
			options.isrDebug?.("HTML cache written", htmlKey);
		} catch (cacheError) {
			console.error("[vinext] ISR cache write error:", cacheError);
		}
	})();
	options.waitUntil?.(cachePromise);
	return new Response(streamForClient, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
}
function scheduleAppPageRscCacheWrite(options) {
	const capturedRscDataPromise = options.capturedRscDataPromise;
	if (!capturedRscDataPromise || options.dynamicUsedDuringBuild) return false;
	const rscKey = options.isrRscKey(options.cleanPathname);
	const cachePromise = (async () => {
		try {
			const rscData = await capturedRscDataPromise;
			if (options.consumeDynamicUsage()) {
				options.isrDebug?.("RSC cache write skipped (dynamic usage during render)", rscKey);
				return;
			}
			await options.isrSet(rscKey, buildAppPageCacheValue("", rscData, 200), options.revalidateSeconds, options.getPageTags());
			options.isrDebug?.("RSC cache written", rscKey);
		} catch (cacheError) {
			console.error("[vinext] ISR RSC cache write error:", cacheError);
		}
	})();
	options.waitUntil?.(cachePromise);
	return true;
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-execution.js
function isPromiseLike(value) {
	return Boolean(value && (typeof value === "object" || typeof value === "function") && "then" in value && typeof value.then === "function");
}
function getAppPageStatusText(statusCode) {
	return statusCode === 403 ? "Forbidden" : statusCode === 401 ? "Unauthorized" : "Not Found";
}
function resolveAppPageSpecialError(error) {
	if (!(error && typeof error === "object" && "digest" in error)) return null;
	const digest = String(error.digest);
	if (digest.startsWith("NEXT_REDIRECT;")) {
		const parts = digest.split(";");
		return {
			kind: "redirect",
			location: decodeURIComponent(parts[2]),
			statusCode: parts[3] ? parseInt(parts[3], 10) : 307
		};
	}
	if (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;")) return {
		kind: "http-access-fallback",
		statusCode: digest === "NEXT_NOT_FOUND" ? 404 : parseInt(digest.split(";")[1], 10)
	};
	return null;
}
async function buildAppPageSpecialErrorResponse(options) {
	if (options.specialError.kind === "redirect") {
		options.clearRequestContext();
		return Response.redirect(new URL(options.specialError.location, options.requestUrl), options.specialError.statusCode);
	}
	if (options.renderFallbackPage) {
		const fallbackResponse = await options.renderFallbackPage(options.specialError.statusCode);
		if (fallbackResponse) return fallbackResponse;
	}
	options.clearRequestContext();
	return new Response(getAppPageStatusText(options.specialError.statusCode), { status: options.specialError.statusCode });
}
async function probeAppPageLayouts(options) {
	return options.runWithSuppressedHookWarning(async () => {
		for (let layoutIndex = options.layoutCount - 1; layoutIndex >= 0; layoutIndex--) try {
			const layoutResult = options.probeLayoutAt(layoutIndex);
			if (isPromiseLike(layoutResult)) await layoutResult;
		} catch (error) {
			const response = await options.onLayoutError(error, layoutIndex);
			if (response) return response;
		}
		return null;
	});
}
async function probeAppPageComponent(options) {
	return options.runWithSuppressedHookWarning(async () => {
		try {
			const pageResult = options.probePage();
			if (isPromiseLike(pageResult)) if (options.awaitAsyncResult) await pageResult;
			else Promise.resolve(pageResult).catch(() => {});
		} catch (error) {
			return options.onError(error);
		}
		return null;
	});
}
async function readAppPageTextStream(stream) {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	const chunks = [];
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(decoder.decode(value, { stream: true }));
	}
	chunks.push(decoder.decode());
	return chunks.join("");
}
async function readAppPageBinaryStream(stream) {
	const reader = stream.getReader();
	const chunks = [];
	let totalLength = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
		totalLength += value.byteLength;
	}
	const buffer = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return buffer.buffer;
}
function teeAppPageRscStreamForCapture(stream, shouldCapture) {
	if (!shouldCapture) return {
		capturedRscDataPromise: null,
		responseStream: stream
	};
	const [responseStream, captureStream] = stream.tee();
	return {
		capturedRscDataPromise: readAppPageBinaryStream(captureStream),
		responseStream
	};
}
function buildAppPageFontLinkHeader(preloads) {
	if (!preloads || preloads.length === 0) return "";
	return preloads.map((preload) => `<${preload.href}>; rel=preload; as=font; type=${preload.type}; crossorigin`).join(", ");
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-boundary.js
function resolveAppPageHttpAccessBoundaryComponent(options) {
	let boundaryModule;
	if (options.statusCode === 403) boundaryModule = options.routeForbiddenModule ?? options.rootForbiddenModule;
	else if (options.statusCode === 401) boundaryModule = options.routeUnauthorizedModule ?? options.rootUnauthorizedModule;
	else boundaryModule = options.routeNotFoundModule ?? options.rootNotFoundModule;
	return options.getDefaultExport(boundaryModule) ?? null;
}
function resolveAppPageErrorBoundary(options) {
	const pageErrorComponent = options.getDefaultExport(options.pageErrorModule);
	if (pageErrorComponent) return {
		component: pageErrorComponent,
		isGlobalError: false
	};
	if (options.layoutErrorModules) for (let index = options.layoutErrorModules.length - 1; index >= 0; index--) {
		const layoutErrorComponent = options.getDefaultExport(options.layoutErrorModules[index]);
		if (layoutErrorComponent) return {
			component: layoutErrorComponent,
			isGlobalError: false
		};
	}
	const globalErrorComponent = options.getDefaultExport(options.globalErrorModule);
	return {
		component: globalErrorComponent ?? null,
		isGlobalError: Boolean(globalErrorComponent)
	};
}
function wrapAppPageBoundaryElement(options) {
	let element = options.element;
	if (!options.skipLayoutWrapping) {
		const asyncParams = options.makeThenableParams(options.matchedParams);
		for (let index = options.layoutModules.length - 1; index >= 0; index--) {
			const layoutComponent = options.getDefaultExport(options.layoutModules[index]);
			if (!layoutComponent) continue;
			element = options.renderLayout(layoutComponent, element, asyncParams);
			if (options.isRscRequest && options.renderLayoutSegmentProvider && options.resolveChildSegments) {
				const treePosition = options.layoutTreePositions ? options.layoutTreePositions[index] : 0;
				const childSegments = options.resolveChildSegments(options.routeSegments ?? [], treePosition, options.matchedParams);
				element = options.renderLayoutSegmentProvider(childSegments, element);
			}
		}
	}
	if (options.isRscRequest && options.includeGlobalErrorBoundary && options.globalErrorComponent) element = options.renderErrorBoundary(options.globalErrorComponent, element);
	return element;
}
async function renderAppPageBoundaryResponse(options) {
	const rscStream = options.renderToReadableStream(options.element, { onError: options.createRscOnErrorHandler() });
	if (options.isRscRequest) return new Response(rscStream, {
		status: options.status,
		headers: {
			"Content-Type": "text/x-component; charset=utf-8",
			Vary: "RSC, Accept"
		}
	});
	return options.createHtmlResponse(rscStream, options.status);
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-stream.js
function createAppPageFontData(options) {
	return {
		links: options.getLinks(),
		preloads: options.getPreloads(),
		styles: options.getStyles()
	};
}
async function renderAppPageHtmlStream(options) {
	return options.ssrHandler.handleSsr(options.rscStream, options.navigationContext, options.fontData);
}
async function renderAppPageHtmlResponse(options) {
	const htmlStream = await renderAppPageHtmlStream(options);
	options.clearRequestContext();
	const headers = {
		"Content-Type": "text/html; charset=utf-8",
		Vary: "RSC, Accept"
	};
	if (options.fontLinkHeader) headers.Link = options.fontLinkHeader;
	return new Response(htmlStream, {
		status: options.status,
		headers
	});
}
async function renderAppPageHtmlStreamWithRecovery(options) {
	try {
		const htmlStream = await options.renderHtmlStream();
		options.onShellRendered?.();
		return {
			htmlStream,
			response: null
		};
	} catch (error) {
		const specialError = options.resolveSpecialError(error);
		if (specialError) return {
			htmlStream: null,
			response: await options.renderSpecialErrorResponse(specialError)
		};
		const boundaryResponse = await options.renderErrorBoundaryResponse(error);
		if (boundaryResponse) return {
			htmlStream: null,
			response: boundaryResponse
		};
		throw error;
	}
}
function createAppPageRscErrorTracker(baseOnError) {
	let capturedError = null;
	return {
		getCapturedError() {
			return capturedError;
		},
		onRenderError(error, requestInfo, errorContext) {
			if (!(error && typeof error === "object" && "digest" in error)) capturedError = error;
			return baseOnError(error, requestInfo, errorContext);
		}
	};
}
function shouldRerenderAppPageWithGlobalError(options) {
	return Boolean(options.capturedError) && !options.hasLocalBoundary;
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-boundary-render.js
function getDefaultExport(module) {
	return module?.default ?? null;
}
async function resolveAppPageLayoutHead(layoutModules, params) {
	const filteredLayouts = layoutModules.filter(Boolean);
	const layoutMetadataPromises = [];
	let accumulatedMetadata = Promise.resolve({});
	for (let index = 0; index < filteredLayouts.length; index++) {
		const parentForLayout = accumulatedMetadata;
		const metadataPromise = resolveModuleMetadata(filteredLayouts[index], params, void 0, parentForLayout).catch((error) => {
			console.error("[vinext] Layout generateMetadata() failed:", error);
			return null;
		});
		layoutMetadataPromises.push(metadataPromise);
		accumulatedMetadata = metadataPromise.then(async (metadataResult) => {
			if (metadataResult) return mergeMetadata([await parentForLayout, metadataResult]);
			return parentForLayout;
		});
	}
	const [metadataResults, viewportResults] = await Promise.all([Promise.all(layoutMetadataPromises), Promise.all(filteredLayouts.map((layoutModule) => resolveModuleViewport(layoutModule, params).catch((error) => {
		console.error("[vinext] Layout generateViewport() failed:", error);
		return null;
	})))]);
	const metadataList = metadataResults.filter(Boolean);
	const viewportList = viewportResults.filter(Boolean);
	return {
		metadata: metadataList.length > 0 ? mergeMetadata(metadataList) : null,
		viewport: mergeViewport(viewportList)
	};
}
function wrapRenderedBoundaryElement(options) {
	return wrapAppPageBoundaryElement({
		element: options.element,
		getDefaultExport,
		globalErrorComponent: getDefaultExport(options.globalErrorModule),
		includeGlobalErrorBoundary: options.includeGlobalErrorBoundary,
		isRscRequest: options.isRscRequest,
		layoutModules: options.layoutModules,
		layoutTreePositions: options.layoutTreePositions,
		makeThenableParams: options.makeThenableParams,
		matchedParams: options.matchedParams,
		renderErrorBoundary(GlobalErrorComponent, children) {
			return (0, import_react_react_server.createElement)(ErrorBoundary, {
				fallback: GlobalErrorComponent,
				children
			});
		},
		renderLayout(LayoutComponent, children, asyncParams) {
			return (0, import_react_react_server.createElement)(LayoutComponent, {
				children,
				params: asyncParams
			});
		},
		renderLayoutSegmentProvider(childSegments, children) {
			return (0, import_react_react_server.createElement)(LayoutSegmentProvider, { childSegments }, children);
		},
		resolveChildSegments: options.resolveChildSegments,
		routeSegments: options.routeSegments ?? [],
		skipLayoutWrapping: options.skipLayoutWrapping
	});
}
async function renderAppPageBoundaryElementResponse(options) {
	const pathname = new URL(options.requestUrl).pathname;
	return renderAppPageBoundaryResponse({
		async createHtmlResponse(rscStream, responseStatus) {
			const fontData = createAppPageFontData({
				getLinks: options.getFontLinks,
				getPreloads: options.getFontPreloads,
				getStyles: options.getFontStyles
			});
			const ssrHandler = await options.loadSsrHandler();
			return renderAppPageHtmlResponse({
				clearRequestContext: options.clearRequestContext,
				fontData,
				fontLinkHeader: options.buildFontLinkHeader(fontData.preloads),
				navigationContext: options.getNavigationContext(),
				rscStream,
				ssrHandler,
				status: responseStatus
			});
		},
		createRscOnErrorHandler() {
			return options.createRscOnErrorHandler(pathname, options.routePattern ?? pathname);
		},
		element: options.element,
		isRscRequest: options.isRscRequest,
		renderToReadableStream: options.renderToReadableStream,
		status: options.status
	});
}
async function renderAppPageHttpAccessFallback(options) {
	const boundaryComponent = options.boundaryComponent ?? resolveAppPageHttpAccessBoundaryComponent({
		getDefaultExport,
		rootForbiddenModule: options.rootForbiddenModule,
		rootNotFoundModule: options.rootNotFoundModule,
		rootUnauthorizedModule: options.rootUnauthorizedModule,
		routeForbiddenModule: options.route?.forbidden,
		routeNotFoundModule: options.route?.notFound,
		routeUnauthorizedModule: options.route?.unauthorized,
		statusCode: options.statusCode
	});
	if (!boundaryComponent) return null;
	const layoutModules = options.layoutModules ?? options.route?.layouts ?? options.rootLayouts;
	const { metadata, viewport } = await resolveAppPageLayoutHead(layoutModules, options.matchedParams);
	const headElements = [(0, import_react_react_server.createElement)("meta", {
		charSet: "utf-8",
		key: "charset"
	}), (0, import_react_react_server.createElement)("meta", {
		content: "noindex",
		key: "robots",
		name: "robots"
	})];
	if (metadata) headElements.push((0, import_react_react_server.createElement)(MetadataHead, {
		key: "metadata",
		metadata
	}));
	headElements.push((0, import_react_react_server.createElement)(ViewportHead, {
		key: "viewport",
		viewport
	}));
	const element = wrapRenderedBoundaryElement({
		element: (0, import_react_react_server.createElement)(import_react_react_server.Fragment, null, ...headElements, (0, import_react_react_server.createElement)(boundaryComponent)),
		globalErrorModule: options.globalErrorModule,
		includeGlobalErrorBoundary: true,
		isRscRequest: options.isRscRequest,
		layoutModules,
		layoutTreePositions: options.route?.layoutTreePositions,
		makeThenableParams: options.makeThenableParams,
		matchedParams: options.matchedParams,
		resolveChildSegments: options.resolveChildSegments,
		routeSegments: options.route?.routeSegments
	});
	return renderAppPageBoundaryElementResponse({
		...options,
		element,
		routePattern: options.route?.pattern,
		status: options.statusCode
	});
}
async function renderAppPageErrorBoundary(options) {
	const errorBoundary = resolveAppPageErrorBoundary({
		getDefaultExport,
		globalErrorModule: options.globalErrorModule,
		layoutErrorModules: options.route?.errors,
		pageErrorModule: options.route?.error
	});
	if (!errorBoundary.component) return null;
	const rawError = options.error instanceof Error ? options.error : new Error(String(options.error));
	const errorObject = options.sanitizeErrorForClient(rawError);
	const matchedParams = options.matchedParams ?? options.route?.params ?? {};
	const layoutModules = options.route?.layouts ?? options.rootLayouts;
	const element = wrapRenderedBoundaryElement({
		element: (0, import_react_react_server.createElement)(errorBoundary.component, { error: errorObject }),
		globalErrorModule: options.globalErrorModule,
		includeGlobalErrorBoundary: !errorBoundary.isGlobalError,
		isRscRequest: options.isRscRequest,
		layoutModules,
		layoutTreePositions: options.route?.layoutTreePositions,
		makeThenableParams: options.makeThenableParams,
		matchedParams,
		resolveChildSegments: options.resolveChildSegments,
		routeSegments: options.route?.routeSegments,
		skipLayoutWrapping: errorBoundary.isGlobalError
	});
	return renderAppPageBoundaryElementResponse({
		...options,
		element,
		routePattern: options.route?.pattern,
		status: 200
	});
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-probe.js
async function probeAppPageBeforeRender(options) {
	if (options.layoutCount > 0) {
		const layoutProbeResponse = await probeAppPageLayouts({
			layoutCount: options.layoutCount,
			async onLayoutError(layoutError, layoutIndex) {
				const specialError = options.resolveSpecialError(layoutError);
				if (!specialError) return null;
				return options.renderLayoutSpecialError(specialError, layoutIndex);
			},
			probeLayoutAt: options.probeLayoutAt,
			runWithSuppressedHookWarning(probe) {
				return options.runWithSuppressedHookWarning(probe);
			}
		});
		if (layoutProbeResponse) return layoutProbeResponse;
	}
	return probeAppPageComponent({
		awaitAsyncResult: !options.hasLoadingBoundary,
		async onError(pageError) {
			const specialError = options.resolveSpecialError(pageError);
			if (specialError) return options.renderPageSpecialError(specialError);
			return null;
		},
		probePage: options.probePage,
		runWithSuppressedHookWarning(probe) {
			return options.runWithSuppressedHookWarning(probe);
		}
	});
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-response.js
var STATIC_CACHE_CONTROL = "s-maxage=31536000, stale-while-revalidate";
var NO_STORE_CACHE_CONTROL = "no-store, must-revalidate";
function buildRevalidateCacheControl(revalidateSeconds) {
	return `s-maxage=${revalidateSeconds}, stale-while-revalidate`;
}
function applyTimingHeader(headers, timing) {
	if (!timing) return;
	const handlerStart = Math.round(timing.handlerStart);
	const compileMs = timing.compileEnd !== void 0 ? Math.round(timing.compileEnd - timing.handlerStart) : -1;
	const renderMs = timing.responseKind === "html" && timing.renderEnd !== void 0 && timing.compileEnd !== void 0 ? Math.round(timing.renderEnd - timing.compileEnd) : -1;
	headers.set("x-vinext-timing", `${handlerStart},${compileMs},${renderMs}`);
}
function resolveAppPageRscResponsePolicy(options) {
	if (options.isForceDynamic || options.dynamicUsedDuringBuild) return { cacheControl: NO_STORE_CACHE_CONTROL };
	if ((options.isForceStatic || options.isDynamicError) && !options.revalidateSeconds || options.revalidateSeconds === Infinity) return {
		cacheControl: STATIC_CACHE_CONTROL,
		cacheState: "STATIC"
	};
	if (options.revalidateSeconds) return {
		cacheControl: buildRevalidateCacheControl(options.revalidateSeconds),
		cacheState: options.isProduction ? "MISS" : void 0
	};
	return {};
}
function resolveAppPageHtmlResponsePolicy(options) {
	if (options.isForceDynamic) return {
		cacheControl: NO_STORE_CACHE_CONTROL,
		shouldWriteToCache: false
	};
	if ((options.isForceStatic || options.isDynamicError) && (options.revalidateSeconds === null || options.revalidateSeconds === 0)) return {
		cacheControl: STATIC_CACHE_CONTROL,
		cacheState: "STATIC",
		shouldWriteToCache: false
	};
	if (options.dynamicUsedDuringRender) return {
		cacheControl: NO_STORE_CACHE_CONTROL,
		shouldWriteToCache: false
	};
	if (options.revalidateSeconds !== null && options.revalidateSeconds > 0 && options.revalidateSeconds !== Infinity) return {
		cacheControl: buildRevalidateCacheControl(options.revalidateSeconds),
		cacheState: options.isProduction ? "MISS" : void 0,
		shouldWriteToCache: options.isProduction
	};
	if (options.revalidateSeconds === Infinity) return {
		cacheControl: STATIC_CACHE_CONTROL,
		cacheState: "STATIC",
		shouldWriteToCache: false
	};
	return { shouldWriteToCache: false };
}
function buildAppPageRscResponse(body, options) {
	const headers = new Headers({
		"Content-Type": "text/x-component; charset=utf-8",
		Vary: "RSC, Accept"
	});
	if (options.params && Object.keys(options.params).length > 0) headers.set("X-Vinext-Params", JSON.stringify(options.params));
	if (options.policy.cacheControl) headers.set("Cache-Control", options.policy.cacheControl);
	if (options.policy.cacheState) headers.set("X-Vinext-Cache", options.policy.cacheState);
	if (options.middlewareContext.headers) for (const [key, value] of options.middlewareContext.headers) {
		const lowerKey = key.toLowerCase();
		if (lowerKey === "set-cookie" || lowerKey === "vary") headers.append(key, value);
		else headers.set(key, value);
	}
	applyTimingHeader(headers, options.timing);
	return new Response(body, {
		status: options.middlewareContext.status ?? 200,
		headers
	});
}
function buildAppPageHtmlResponse(body, options) {
	const headers = new Headers({
		"Content-Type": "text/html; charset=utf-8",
		Vary: "RSC, Accept"
	});
	if (options.policy.cacheControl) headers.set("Cache-Control", options.policy.cacheControl);
	if (options.policy.cacheState) headers.set("X-Vinext-Cache", options.policy.cacheState);
	if (options.draftCookie) headers.append("Set-Cookie", options.draftCookie);
	if (options.fontLinkHeader) headers.set("Link", options.fontLinkHeader);
	if (options.middlewareContext.headers) for (const [key, value] of options.middlewareContext.headers) headers.append(key, value);
	applyTimingHeader(headers, options.timing);
	return new Response(body, {
		status: options.middlewareContext.status ?? 200,
		headers
	});
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-render.js
function buildResponseTiming(options) {
	if (options.isProduction) return;
	return {
		compileEnd: options.compileEnd,
		handlerStart: options.handlerStart,
		renderEnd: options.renderEnd,
		responseKind: options.responseKind
	};
}
async function renderAppPageLifecycle(options) {
	const preRenderResponse = await probeAppPageBeforeRender({
		hasLoadingBoundary: options.hasLoadingBoundary,
		layoutCount: options.layoutCount,
		probeLayoutAt(layoutIndex) {
			return options.probeLayoutAt(layoutIndex);
		},
		probePage() {
			return options.probePage();
		},
		renderLayoutSpecialError(specialError, layoutIndex) {
			return options.renderLayoutSpecialError(specialError, layoutIndex);
		},
		renderPageSpecialError(specialError) {
			return options.renderPageSpecialError(specialError);
		},
		resolveSpecialError: resolveAppPageSpecialError,
		runWithSuppressedHookWarning(probe) {
			return options.runWithSuppressedHookWarning(probe);
		}
	});
	if (preRenderResponse) return preRenderResponse;
	const compileEnd = options.isProduction ? void 0 : performance.now();
	const rscErrorTracker = createAppPageRscErrorTracker(options.createRscOnErrorHandler(options.cleanPathname, options.routePattern));
	const rscStream = options.renderToReadableStream(options.element, { onError: rscErrorTracker.onRenderError });
	let revalidateSeconds = options.revalidateSeconds;
	const rscCapture = teeAppPageRscStreamForCapture(rscStream, options.isProduction && revalidateSeconds !== null && revalidateSeconds > 0 && revalidateSeconds !== Infinity && !options.isForceDynamic);
	const rscForResponse = rscCapture.responseStream;
	const isrRscDataPromise = rscCapture.capturedRscDataPromise;
	if (options.isRscRequest) {
		const dynamicUsedDuringBuild = options.consumeDynamicUsage();
		const rscResponsePolicy = resolveAppPageRscResponsePolicy({
			dynamicUsedDuringBuild,
			isDynamicError: options.isDynamicError,
			isForceDynamic: options.isForceDynamic,
			isForceStatic: options.isForceStatic,
			isProduction: options.isProduction,
			revalidateSeconds
		});
		const rscResponse = buildAppPageRscResponse(rscForResponse, {
			middlewareContext: options.middlewareContext,
			params: options.params,
			policy: rscResponsePolicy,
			timing: buildResponseTiming({
				compileEnd,
				handlerStart: options.handlerStart,
				isProduction: options.isProduction,
				responseKind: "rsc"
			})
		});
		scheduleAppPageRscCacheWrite({
			capturedRscDataPromise: options.isProduction ? isrRscDataPromise : null,
			cleanPathname: options.cleanPathname,
			consumeDynamicUsage: options.consumeDynamicUsage,
			dynamicUsedDuringBuild,
			getPageTags() {
				return options.getPageTags();
			},
			isrDebug: options.isrDebug,
			isrRscKey: options.isrRscKey,
			isrSet: options.isrSet,
			revalidateSeconds: revalidateSeconds ?? 0,
			waitUntil(promise) {
				options.waitUntil?.(promise);
			}
		});
		return rscResponse;
	}
	const fontData = createAppPageFontData({
		getLinks: options.getFontLinks,
		getPreloads: options.getFontPreloads,
		getStyles: options.getFontStyles
	});
	const fontLinkHeader = buildAppPageFontLinkHeader(fontData.preloads);
	let renderEnd;
	const htmlRender = await renderAppPageHtmlStreamWithRecovery({
		onShellRendered() {
			if (!options.isProduction) renderEnd = performance.now();
		},
		renderErrorBoundaryResponse(error) {
			return options.renderErrorBoundaryResponse(error);
		},
		async renderHtmlStream() {
			const ssrHandler = await options.loadSsrHandler();
			return renderAppPageHtmlStream({
				fontData,
				navigationContext: options.getNavigationContext(),
				rscStream: rscForResponse,
				ssrHandler
			});
		},
		renderSpecialErrorResponse(specialError) {
			return options.renderPageSpecialError(specialError);
		},
		resolveSpecialError: resolveAppPageSpecialError
	});
	if (htmlRender.response) return htmlRender.response;
	const htmlStream = htmlRender.htmlStream;
	if (!htmlStream) throw new Error("[vinext] Expected an HTML stream when no fallback response was returned");
	if (shouldRerenderAppPageWithGlobalError({
		capturedError: rscErrorTracker.getCapturedError(),
		hasLocalBoundary: options.routeHasLocalBoundary
	})) {
		const cleanResponse = await options.renderErrorBoundaryResponse(rscErrorTracker.getCapturedError());
		if (cleanResponse) return cleanResponse;
	}
	options.clearRequestContext();
	const draftCookie = options.getDraftModeCookieHeader();
	const dynamicUsedDuringRender = options.consumeDynamicUsage();
	const requestCacheLife = options.getRequestCacheLife();
	if (requestCacheLife?.revalidate !== void 0 && revalidateSeconds === null) revalidateSeconds = requestCacheLife.revalidate;
	const htmlResponsePolicy = resolveAppPageHtmlResponsePolicy({
		dynamicUsedDuringRender,
		isDynamicError: options.isDynamicError,
		isForceDynamic: options.isForceDynamic,
		isForceStatic: options.isForceStatic,
		isProduction: options.isProduction,
		revalidateSeconds
	});
	const htmlResponseTiming = buildResponseTiming({
		compileEnd,
		handlerStart: options.handlerStart,
		isProduction: options.isProduction,
		renderEnd,
		responseKind: "html"
	});
	if (htmlResponsePolicy.shouldWriteToCache) return finalizeAppPageHtmlCacheResponse(buildAppPageHtmlResponse(htmlStream, {
		draftCookie,
		fontLinkHeader,
		middlewareContext: options.middlewareContext,
		policy: htmlResponsePolicy,
		timing: htmlResponseTiming
	}), {
		capturedRscDataPromise: isrRscDataPromise,
		cleanPathname: options.cleanPathname,
		getPageTags() {
			return options.getPageTags();
		},
		isrDebug: options.isrDebug,
		isrHtmlKey: options.isrHtmlKey,
		isrRscKey: options.isrRscKey,
		isrSet: options.isrSet,
		revalidateSeconds: revalidateSeconds ?? 0,
		waitUntil(cachePromise) {
			options.waitUntil?.(cachePromise);
		}
	});
	return buildAppPageHtmlResponse(htmlStream, {
		draftCookie,
		fontLinkHeader,
		middlewareContext: options.middlewareContext,
		policy: htmlResponsePolicy,
		timing: htmlResponseTiming
	});
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-request.js
function areStaticParamsAllowed(params, staticParams) {
	const paramKeys = Object.keys(params);
	return staticParams.some((staticParamSet) => paramKeys.every((key) => {
		const value = params[key];
		const staticValue = staticParamSet[key];
		if (staticValue === void 0) return true;
		if (Array.isArray(value)) return JSON.stringify(value) === JSON.stringify(staticValue);
		if (typeof staticValue === "string" || typeof staticValue === "number" || typeof staticValue === "boolean") return String(value) === String(staticValue);
		return JSON.stringify(value) === JSON.stringify(staticValue);
	}));
}
async function validateAppPageDynamicParams(options) {
	if (!options.enforceStaticParamsOnly || !options.isDynamicRoute || typeof options.generateStaticParams !== "function") return null;
	try {
		const staticParams = await options.generateStaticParams({ params: options.params });
		if (Array.isArray(staticParams) && !areStaticParamsAllowed(options.params, staticParams)) {
			options.clearRequestContext();
			return new Response("Not Found", { status: 404 });
		}
	} catch (error) {
		options.logGenerateStaticParamsError?.(error);
	}
	return null;
}
async function resolveAppPageIntercept(options) {
	if (!options.isRscRequest) return {
		interceptOpts: void 0,
		response: null
	};
	const intercept = options.findIntercept(options.cleanPathname);
	if (!intercept) return {
		interceptOpts: void 0,
		response: null
	};
	const sourceRoute = options.getSourceRoute(intercept.sourceRouteIndex);
	const interceptOpts = options.toInterceptOpts(intercept);
	if (sourceRoute && sourceRoute !== options.currentRoute) {
		const sourceParams = options.matchSourceRouteParams(options.getRoutePattern(sourceRoute)) ?? {};
		options.setNavigationContext({
			params: intercept.matchedParams,
			pathname: options.cleanPathname,
			searchParams: options.searchParams
		});
		const interceptElement = await options.buildPageElement(sourceRoute, sourceParams, interceptOpts, options.searchParams);
		return {
			interceptOpts: void 0,
			response: await options.renderInterceptResponse(sourceRoute, interceptElement)
		};
	}
	return {
		interceptOpts,
		response: null
	};
}
async function buildAppPageElement(options) {
	try {
		return {
			element: await options.buildPageElement(),
			response: null
		};
	} catch (error) {
		const specialError = options.resolveSpecialError(error);
		if (specialError) return {
			element: null,
			response: await options.renderSpecialError(specialError)
		};
		const errorBoundaryResponse = await options.renderErrorBoundaryPage(error);
		if (errorBoundaryResponse) return {
			element: null,
			response: errorBoundaryResponse
		};
		throw error;
	}
}
//#endregion
//#region node_modules/vinext/dist/shims/fetch-cache.js
/**
* Extended fetch() with Next.js caching semantics.
*
* Patches `globalThis.fetch` during server rendering to support:
*
*   fetch(url, { next: { revalidate: 60, tags: ['posts'] } })
*   fetch(url, { cache: 'force-cache' })
*   fetch(url, { cache: 'no-store' })
*
* Cached responses are stored via the pluggable CacheHandler, so
* revalidateTag() and revalidatePath() invalidate fetch-level caches.
*
* Usage (in server entry):
*   import { withFetchCache, cleanupFetchCache } from './fetch-cache';
*   const cleanup = withFetchCache();
*   try { ... render ... } finally { cleanup(); }
*
* Or use the async helper:
*   await runWithFetchCache(async () => { ... render ... });
*/
/**
* Headers excluded from the cache key. These are W3C trace context headers
* that can break request caching and deduplication.
* All other headers ARE included in the cache key, matching Next.js behavior.
*/
var HEADER_BLOCKLIST = ["traceparent", "tracestate"];
var CACHE_KEY_PREFIX = "v3";
var MAX_CACHE_KEY_BODY_BYTES = 1024 * 1024;
var BodyTooLargeForCacheKeyError = class extends Error {
	constructor() {
		super("Fetch body too large for cache key generation");
	}
};
var SkipCacheKeyGenerationError = class extends Error {
	constructor() {
		super("Fetch body could not be serialized for cache key generation");
	}
};
/**
* Collect all headers from the request, excluding the blocklist.
* Merges headers from both the Request object and the init object,
* with init taking precedence (matching fetch() spec behavior).
*/
function collectHeaders(input, init) {
	const merged = {};
	if (input instanceof Request && input.headers) input.headers.forEach((v, k) => {
		merged[k] = v;
	});
	if (init?.headers) (init.headers instanceof Headers ? init.headers : new Headers(init.headers)).forEach((v, k) => {
		merged[k] = v;
	});
	for (const blocked of HEADER_BLOCKLIST) delete merged[blocked];
	return merged;
}
/**
* Check whether a fetch request carries any per-user auth headers.
* Used for the safety bypass (skip caching when auth headers are present
* without an explicit cache opt-in).
*/
var AUTH_HEADERS = [
	"authorization",
	"cookie",
	"x-api-key"
];
function hasAuthHeaders(input, init) {
	const headers = collectHeaders(input, init);
	return AUTH_HEADERS.some((name) => name in headers);
}
async function serializeFormData(formData, pushBodyChunk, getTotalBodyBytes) {
	for (const [key, val] of formData.entries()) {
		if (typeof val === "string") {
			pushBodyChunk(JSON.stringify([key, {
				kind: "string",
				value: val
			}]));
			continue;
		}
		if (val.size > MAX_CACHE_KEY_BODY_BYTES || getTotalBodyBytes() + val.size > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		pushBodyChunk(JSON.stringify([key, {
			kind: "file",
			name: val.name,
			type: val.type,
			value: await val.text()
		}]));
	}
}
function getParsedFormContentType(contentType) {
	const mediaType = contentType?.split(";")[0]?.trim().toLowerCase();
	if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return mediaType;
}
function stripMultipartBoundary(contentType) {
	const [type, ...params] = contentType.split(";");
	const keptParams = params.map((param) => param.trim()).filter(Boolean).filter((param) => !/^boundary\s*=/i.test(param));
	const normalizedType = type.trim().toLowerCase();
	return keptParams.length > 0 ? `${normalizedType}; ${keptParams.join("; ")}` : normalizedType;
}
async function readRequestBodyChunksWithinLimit(request) {
	const contentLengthHeader = request.headers.get("content-length");
	if (contentLengthHeader) {
		const contentLength = Number(contentLengthHeader);
		if (Number.isFinite(contentLength) && contentLength > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
	}
	const requestClone = request.clone();
	const contentType = requestClone.headers.get("content-type") ?? void 0;
	const reader = requestClone.body?.getReader();
	if (!reader) return {
		chunks: [],
		contentType
	};
	const chunks = [];
	let totalBodyBytes = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBodyBytes += value.byteLength;
			if (totalBodyBytes > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
			chunks.push(value);
		}
	} catch (err) {
		reader.cancel().catch(() => {});
		throw err;
	}
	return {
		chunks,
		contentType
	};
}
/**
* Serialize request body into string chunks for cache key inclusion.
* Handles all body types: string, Uint8Array, ReadableStream, FormData, Blob,
* and Request object bodies.
* Returns the serialized body chunks and optionally stashes the original body
* on init as `_ogBody` so it can still be used after stream consumption.
*/
async function serializeBody(input, init) {
	if (!init?.body && !(input instanceof Request && input.body)) return { bodyChunks: [] };
	const bodyChunks = [];
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	let totalBodyBytes = 0;
	let canonicalizedContentType;
	const pushBodyChunk = (chunk) => {
		totalBodyBytes += encoder.encode(chunk).byteLength;
		if (totalBodyBytes > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		bodyChunks.push(chunk);
	};
	const getTotalBodyBytes = () => totalBodyBytes;
	if (init?.body instanceof Uint8Array) {
		if (init.body.byteLength > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		pushBodyChunk(decoder.decode(init.body));
		init._ogBody = init.body;
	} else if (init?.body && typeof init.body.getReader === "function") {
		const [bodyForHashing, bodyForFetch] = init.body.tee();
		init._ogBody = bodyForFetch;
		const reader = bodyForHashing.getReader();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (typeof value === "string") pushBodyChunk(value);
				else {
					totalBodyBytes += value.byteLength;
					if (totalBodyBytes > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
					bodyChunks.push(decoder.decode(value, { stream: true }));
				}
			}
			const finalChunk = decoder.decode();
			if (finalChunk) pushBodyChunk(finalChunk);
		} catch (err) {
			await reader.cancel();
			if (err instanceof BodyTooLargeForCacheKeyError) throw err;
			throw new SkipCacheKeyGenerationError();
		}
	} else if (init?.body instanceof URLSearchParams) {
		init._ogBody = init.body;
		pushBodyChunk(init.body.toString());
	} else if (init?.body && typeof init.body.keys === "function") {
		const formData = init.body;
		init._ogBody = init.body;
		await serializeFormData(formData, pushBodyChunk, getTotalBodyBytes);
	} else if (init?.body && typeof init.body.arrayBuffer === "function") {
		const blob = init.body;
		if (blob.size > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		pushBodyChunk(await blob.text());
		const arrayBuffer = await blob.arrayBuffer();
		init._ogBody = new Blob([arrayBuffer], { type: blob.type });
	} else if (typeof init?.body === "string") {
		if (init.body.length > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		pushBodyChunk(init.body);
		init._ogBody = init.body;
	} else if (input instanceof Request && input.body) {
		let chunks;
		let contentType;
		try {
			({chunks, contentType} = await readRequestBodyChunksWithinLimit(input));
		} catch (err) {
			if (err instanceof BodyTooLargeForCacheKeyError) throw err;
			throw new SkipCacheKeyGenerationError();
		}
		const formContentType = getParsedFormContentType(contentType);
		if (formContentType) try {
			await serializeFormData(await new Request(input.url, {
				method: input.method,
				headers: contentType ? { "content-type": contentType } : void 0,
				body: new Blob(chunks)
			}).formData(), pushBodyChunk, getTotalBodyBytes);
			canonicalizedContentType = formContentType === "multipart/form-data" && contentType ? stripMultipartBoundary(contentType) : void 0;
			return {
				bodyChunks,
				canonicalizedContentType
			};
		} catch (err) {
			if (err instanceof BodyTooLargeForCacheKeyError) throw err;
			throw new SkipCacheKeyGenerationError();
		}
		for (const chunk of chunks) pushBodyChunk(decoder.decode(chunk, { stream: true }));
		const finalChunk = decoder.decode();
		if (finalChunk) pushBodyChunk(finalChunk);
	}
	return {
		bodyChunks,
		canonicalizedContentType
	};
}
/**
* Generate a deterministic cache key from a fetch request.
*
* Matches Next.js behavior: the key is a SHA-256 hash of a JSON array
* containing URL, method, all headers (minus blocklist), all RequestInit
* options, and the serialized body.
*/
async function buildFetchCacheKey(input, init) {
	let url;
	let method = "GET";
	if (typeof input === "string") url = input;
	else if (input instanceof URL) url = input.toString();
	else {
		url = input.url;
		method = input.method || "GET";
	}
	if (init?.method) method = init.method;
	const headers = collectHeaders(input, init);
	const { bodyChunks, canonicalizedContentType } = await serializeBody(input, init);
	if (canonicalizedContentType) headers["content-type"] = canonicalizedContentType;
	const cacheString = JSON.stringify([
		CACHE_KEY_PREFIX,
		url,
		method,
		headers,
		init?.mode,
		init?.redirect,
		init?.credentials,
		init?.referrer,
		init?.referrerPolicy,
		init?.integrity,
		init?.cache,
		bodyChunks
	]);
	const buffer = new TextEncoder().encode(cacheString);
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	return Array.prototype.map.call(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
}
var _PENDING_KEY = Symbol.for("vinext.fetchCache.pendingRefetches");
var _gPending = globalThis;
var pendingRefetches = _gPending[_PENDING_KEY] ??= /* @__PURE__ */ new Map();
var DEDUP_TIMEOUT_MS = 6e4;
var _ORIG_FETCH_KEY = Symbol.for("vinext.fetchCache.originalFetch");
var _gFetch = globalThis;
var originalFetch = _gFetch[_ORIG_FETCH_KEY] ??= globalThis.fetch;
var _ALS_KEY$1 = Symbol.for("vinext.fetchCache.als");
var _FALLBACK_KEY$1 = Symbol.for("vinext.fetchCache.fallback");
var _g$1 = globalThis;
var _als$1 = _g$1[_ALS_KEY$1] ??= new AsyncLocalStorage();
var _fallbackState$1 = _g$1[_FALLBACK_KEY$1] ??= { currentRequestTags: [] };
function _getState$1() {
	if (isInsideUnifiedScope()) return getRequestContext();
	return _als$1.getStore() ?? _fallbackState$1;
}
/**
* Get tags collected during the current render pass.
* Useful for associating page-level cache entries with all the
* fetch tags used during rendering.
*/
function getCollectedFetchTags() {
	return [..._getState$1().currentRequestTags];
}
/**
* Create a patched fetch function with Next.js caching semantics.
*
* The patched fetch:
* 1. Checks `cache` and `next` options to determine caching behavior
* 2. On cache hit, returns the cached response without hitting the network
* 3. On cache miss, fetches from network, stores in cache, returns response
* 4. Respects `next.revalidate` for TTL-based revalidation
* 5. Respects `next.tags` for tag-based invalidation via revalidateTag()
*/
function createPatchedFetch() {
	return async function patchedFetch(input, init) {
		const nextOpts = init?.next;
		const cacheDirective = init?.cache;
		if (!nextOpts && !cacheDirective) return originalFetch(input, init);
		if (cacheDirective === "no-store" || cacheDirective === "no-cache" || nextOpts?.revalidate === false || nextOpts?.revalidate === 0) return originalFetch(input, stripNextFromInit(init));
		if (!(cacheDirective === "force-cache" || typeof nextOpts?.revalidate === "number" && nextOpts.revalidate > 0) && hasAuthHeaders(input, init)) return originalFetch(input, stripNextFromInit(init));
		let revalidateSeconds;
		if (cacheDirective === "force-cache") revalidateSeconds = nextOpts?.revalidate && typeof nextOpts.revalidate === "number" ? nextOpts.revalidate : 31536e3;
		else if (typeof nextOpts?.revalidate === "number" && nextOpts.revalidate > 0) revalidateSeconds = nextOpts.revalidate;
		else if (nextOpts?.tags && nextOpts.tags.length > 0) revalidateSeconds = 31536e3;
		else return originalFetch(input, stripNextFromInit(init));
		const tags = nextOpts?.tags ?? [];
		let cacheKey;
		try {
			cacheKey = await buildFetchCacheKey(input, init);
		} catch (err) {
			if (err instanceof BodyTooLargeForCacheKeyError || err instanceof SkipCacheKeyGenerationError) return originalFetch(input, stripNextFromInit(init));
			throw err;
		}
		const handler = getCacheHandler();
		const reqTags = _getState$1().currentRequestTags;
		if (tags.length > 0) {
			for (const tag of tags) if (!reqTags.includes(tag)) reqTags.push(tag);
		}
		try {
			const cached = await handler.get(cacheKey, {
				kind: "FETCH",
				tags
			});
			if (cached?.value && cached.value.kind === "FETCH" && cached.cacheState !== "stale") {
				const cachedData = cached.value.data;
				return new Response(cachedData.body, {
					status: cachedData.status ?? 200,
					headers: cachedData.headers
				});
			}
			if (cached?.value && cached.value.kind === "FETCH" && cached.cacheState === "stale") {
				const staleData = cached.value.data;
				if (!pendingRefetches.has(cacheKey)) {
					const refetchPromise = originalFetch(input, stripNextFromInit(init)).then(async (freshResp) => {
						if (freshResp.status !== 200) return;
						const freshBody = await freshResp.text();
						const freshHeaders = {};
						freshResp.headers.forEach((v, k) => {
							if (k.toLowerCase() === "set-cookie") return;
							freshHeaders[k] = v;
						});
						const freshValue = {
							kind: "FETCH",
							data: {
								headers: freshHeaders,
								body: freshBody,
								url: typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
								status: freshResp.status
							},
							tags,
							revalidate: revalidateSeconds
						};
						await handler.set(cacheKey, freshValue, {
							fetchCache: true,
							tags,
							revalidate: revalidateSeconds
						});
					}).catch((err) => {
						const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
						console.error(`[vinext] fetch cache background revalidation failed for ${url} (key=${cacheKey.slice(0, 12)}...):`, err);
					}).finally(() => {
						if (pendingRefetches.get(cacheKey) === refetchPromise) pendingRefetches.delete(cacheKey);
						clearTimeout(timeoutId);
					});
					pendingRefetches.set(cacheKey, refetchPromise);
					const timeoutId = setTimeout(() => {
						if (pendingRefetches.get(cacheKey) === refetchPromise) pendingRefetches.delete(cacheKey);
					}, DEDUP_TIMEOUT_MS);
					getRequestExecutionContext()?.waitUntil(refetchPromise);
				}
				return new Response(staleData.body, {
					status: staleData.status ?? 200,
					headers: staleData.headers
				});
			}
		} catch (cacheErr) {
			console.error("[vinext] fetch cache read error:", cacheErr);
		}
		const response = await originalFetch(input, stripNextFromInit(init));
		if (response.status === 200) {
			const cloned = response.clone();
			const body = await cloned.text();
			const headers = {};
			cloned.headers.forEach((v, k) => {
				if (k.toLowerCase() === "set-cookie") return;
				headers[k] = v;
			});
			const cacheValue = {
				kind: "FETCH",
				data: {
					headers,
					body,
					url: typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
					status: cloned.status
				},
				tags,
				revalidate: revalidateSeconds
			};
			handler.set(cacheKey, cacheValue, {
				fetchCache: true,
				tags,
				revalidate: revalidateSeconds
			}).catch((err) => {
				console.error("[vinext] fetch cache write error:", err);
			});
		}
		return response;
	};
}
/**
* Strip the `next` property from RequestInit before passing to real fetch.
* The `next` property is not a standard fetch option and would cause warnings
* in some environments.
*/
function stripNextFromInit(init) {
	if (!init) return init;
	const { next: _next, _ogBody, ...rest } = init;
	if (_ogBody !== void 0) rest.body = _ogBody;
	return Object.keys(rest).length > 0 ? rest : void 0;
}
var _PATCH_KEY = Symbol.for("vinext.fetchCache.patchInstalled");
function _ensurePatchInstalled() {
	if (_g$1[_PATCH_KEY]) return;
	_g$1[_PATCH_KEY] = true;
	globalThis.fetch = createPatchedFetch();
}
/**
* Install the patched fetch without creating a standalone ALS scope.
*
* `runWithFetchCache()` is the standalone helper: it installs the patch and
* creates an isolated per-request tag store. The unified request context owns
* that isolation itself via `currentRequestTags`, so callers inside
* `runWithRequestContext()` only need the process-global fetch monkey-patch.
*/
function ensureFetchPatch() {
	_ensurePatchInstalled();
}
//#endregion
//#region node_modules/vinext/dist/routing/route-trie.js
function createNode() {
	return {
		staticChildren: /* @__PURE__ */ new Map(),
		dynamicChild: null,
		catchAllChild: null,
		optionalCatchAllChild: null,
		route: null
	};
}
/**
* Build a trie from pre-sorted routes.
*
* Routes must have a `patternParts` property (string[] of URL segments).
* Pattern segment conventions:
*   - `:name`  — dynamic segment
*   - `:name+` — catch-all (1+ segments)
*   - `:name*` — optional catch-all (0+ segments)
*   - anything else — static segment
*
* First route to claim a terminal position wins (routes are pre-sorted
* by precedence, so insertion order preserves correct priority).
*/
function buildRouteTrie(routes) {
	const root = createNode();
	for (const route of routes) {
		const parts = route.patternParts;
		if (parts.length === 0) {
			if (root.route === null) root.route = route;
			continue;
		}
		let node = root;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (part.endsWith("+") && part.startsWith(":")) {
				if (i !== parts.length - 1) break;
				const paramName = part.slice(1, -1);
				if (node.catchAllChild === null) node.catchAllChild = {
					paramName,
					route
				};
				break;
			}
			if (part.endsWith("*") && part.startsWith(":")) {
				if (i !== parts.length - 1) break;
				const paramName = part.slice(1, -1);
				if (node.optionalCatchAllChild === null) node.optionalCatchAllChild = {
					paramName,
					route
				};
				break;
			}
			if (part.startsWith(":")) {
				const paramName = part.slice(1);
				if (node.dynamicChild === null) node.dynamicChild = {
					paramName,
					node: createNode()
				};
				node = node.dynamicChild.node;
				if (i === parts.length - 1) {
					if (node.route === null) node.route = route;
				}
				continue;
			}
			let child = node.staticChildren.get(part);
			if (!child) {
				child = createNode();
				node.staticChildren.set(part, child);
			}
			node = child;
			if (i === parts.length - 1) {
				if (node.route === null) node.route = route;
			}
		}
	}
	return root;
}
/**
* Match a URL against the trie.
*
* @param root - Trie root built by `buildRouteTrie`
* @param urlParts - Pre-split URL segments (no empty strings)
* @returns Match result with route and extracted params, or null
*/
function trieMatch(root, urlParts) {
	return match(root, urlParts, 0);
}
function match(node, urlParts, index) {
	if (index === urlParts.length) {
		if (node.route !== null) return {
			route: node.route,
			params: Object.create(null)
		};
		if (node.optionalCatchAllChild !== null) {
			const params = Object.create(null);
			params[node.optionalCatchAllChild.paramName] = [];
			return {
				route: node.optionalCatchAllChild.route,
				params
			};
		}
		return null;
	}
	const segment = urlParts[index];
	const staticChild = node.staticChildren.get(segment);
	if (staticChild) {
		const result = match(staticChild, urlParts, index + 1);
		if (result !== null) return result;
	}
	if (node.dynamicChild !== null) {
		const result = match(node.dynamicChild.node, urlParts, index + 1);
		if (result !== null) {
			result.params[node.dynamicChild.paramName] = segment;
			return result;
		}
	}
	if (node.catchAllChild !== null) {
		const remaining = urlParts.slice(index);
		const params = Object.create(null);
		params[node.catchAllChild.paramName] = remaining;
		return {
			route: node.catchAllChild.route,
			params
		};
	}
	if (node.optionalCatchAllChild !== null) {
		const remaining = urlParts.slice(index);
		const params = Object.create(null);
		params[node.optionalCatchAllChild.paramName] = remaining;
		return {
			route: node.optionalCatchAllChild.route,
			params
		};
	}
	return null;
}
//#endregion
//#region node_modules/vinext/dist/shims/navigation-state.js
/**
* Server-only navigation state backed by AsyncLocalStorage.
*
* This module provides request-scoped isolation for navigation context
* and useServerInsertedHTML callbacks. Without ALS, concurrent requests
* on Cloudflare Workers would share module-level state and leak data
* (pathnames, params, CSS-in-JS styles) between requests.
*
* This module is server-only — it imports node:async_hooks and must NOT
* be bundled for the browser. The dual-environment navigation.ts shim
* uses a registration pattern so it works in both environments.
*/
var _ALS_KEY = Symbol.for("vinext.navigation.als");
var _FALLBACK_KEY = Symbol.for("vinext.navigation.fallback");
var _g = globalThis;
var _als = _g[_ALS_KEY] ??= new AsyncLocalStorage();
var _fallbackState = _g[_FALLBACK_KEY] ??= {
	serverContext: null,
	serverInsertedHTMLCallbacks: []
};
function _getState() {
	if (isInsideUnifiedScope()) return getRequestContext();
	return _als.getStore() ?? _fallbackState;
}
_registerStateAccessors({
	getServerContext() {
		return _getState().serverContext;
	},
	setServerContext(ctx) {
		_getState().serverContext = ctx;
	},
	getInsertedHTMLCallbacks() {
		return _getState().serverInsertedHTMLCallbacks;
	},
	clearInsertedHTMLCallbacks() {
		_getState().serverInsertedHTMLCallbacks = [];
	}
});
//#endregion
//#region node_modules/vinext/dist/server/instrumentation.js
/**
* Get the registered onRequestError handler (if any).
*
* Reads from globalThis so it works across Vite environment boundaries.
*/
function getOnRequestErrorHandler() {
	return globalThis.__VINEXT_onRequestErrorHandler__ ?? null;
}
/**
* Report a request error via the instrumentation handler.
*
* No-op if no onRequestError handler is registered.
*
* Reads the handler from globalThis so this function works correctly regardless
* of which environment it is called from.
*/
function reportRequestError(error, request, context) {
	const handler = getOnRequestErrorHandler();
	if (!handler) return Promise.resolve();
	const promise = (async () => {
		try {
			await handler(error, request, context);
		} catch (reportErr) {
			console.error("[vinext] onRequestError handler threw:", reportErr instanceof Error ? reportErr.message : String(reportErr));
		}
	})();
	getRequestExecutionContext()?.waitUntil(promise);
	return promise;
}
//#endregion
//#region node_modules/vinext/dist/shims/font-google-base.js
/**
* next/font/google shim
*
* Provides a compatible shim for Next.js Google Fonts.
*
* Two modes:
* 1. **Dev / CDN mode** (default): Loads fonts from Google Fonts CDN via <link> tags.
* 2. **Self-hosted mode** (production build): The vinext:google-fonts Vite plugin
*    fetches font CSS + .woff2 files at build time, caches them locally, and injects
*    @font-face CSS pointing at local assets. No requests to Google at runtime.
*
* Usage:
*   import { Inter } from 'next/font/google';
*   const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
*   // inter.className -> unique CSS class
*   // inter.style -> { fontFamily: "'Inter', sans-serif" }
*   // inter.variable -> CSS variable name like '--font-inter'
*/
/**
* Escape a string for safe interpolation inside a CSS single-quoted string.
*
* Prevents CSS injection by escaping characters that could break out of
* a `'...'` CSS string context: backslashes, single quotes, and newlines.
*/
function escapeCSSString(value) {
	return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\a ").replace(/\r/g, "\\d ");
}
/**
* Validate a CSS custom property name (e.g. `--font-inter`).
*
* Custom properties must start with `--` and only contain alphanumeric
* characters, hyphens, and underscores. Anything else could be used to
* break out of the CSS declaration and inject arbitrary rules.
*
* Returns the name if valid, undefined otherwise.
*/
function sanitizeCSSVarName(name) {
	if (/^--[a-zA-Z0-9_-]+$/.test(name)) return name;
}
/**
* Sanitize a CSS font-family fallback name.
*
* Generic family names (sans-serif, serif, monospace, etc.) are used as-is.
* Named families are wrapped in escaped quotes. This prevents injection via
* crafted fallback values like `); } body { color: red; } .x {`.
*/
function sanitizeFallback(name) {
	const generics = new Set([
		"serif",
		"sans-serif",
		"monospace",
		"cursive",
		"fantasy",
		"system-ui",
		"ui-serif",
		"ui-sans-serif",
		"ui-monospace",
		"ui-rounded",
		"emoji",
		"math",
		"fangsong"
	]);
	const trimmed = name.trim();
	if (generics.has(trimmed)) return trimmed;
	return `'${escapeCSSString(trimmed)}'`;
}
var classCounter = 0;
var injectedFonts = /* @__PURE__ */ new Set();
/**
* Convert a font family name to a CSS variable name.
* e.g., "Inter" -> "--font-inter", "Roboto Mono" -> "--font-roboto-mono"
*/
function toVarName(family) {
	return "--font-" + family.toLowerCase().replace(/\s+/g, "-");
}
/**
* Build a Google Fonts CSS URL.
*/
function buildGoogleFontsUrl(family, options) {
	const params = new URLSearchParams();
	let spec = family;
	const weights = options.weight ? Array.isArray(options.weight) ? options.weight : [options.weight] : [];
	const styles = options.style ? Array.isArray(options.style) ? options.style : [options.style] : [];
	if (weights.length > 0 || styles.length > 0) {
		const hasItalic = styles.includes("italic");
		if (weights.length > 0) if (hasItalic) {
			const pairs = [];
			for (const w of weights) {
				pairs.push(`0,${w}`);
				pairs.push(`1,${w}`);
			}
			spec += `:ital,wght@${pairs.join(";")}`;
		} else spec += `:wght@${weights.join(";")}`;
	} else spec += `:wght@100..900`;
	params.set("family", spec);
	params.set("display", options.display ?? "swap");
	return `https://fonts.googleapis.com/css2?${params.toString()}`;
}
/**
* Inject a <link> tag for the font (client-side only).
* On the server, we track font URLs for SSR head injection.
*/
function injectFontStylesheet(url) {
	if (injectedFonts.has(url)) return;
	injectedFonts.add(url);
	if (typeof document !== "undefined") {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = url;
		document.head.appendChild(link);
	}
}
/** Track which className CSS rules have been injected. */
var injectedClassRules = /* @__PURE__ */ new Set();
/**
* Inject a CSS rule that maps a className to a font-family.
*
* This is what makes `<div className={inter.className}>` apply the font.
* Next.js generates equivalent rules at build time.
*
* In Next.js, the .className class ONLY sets font-family — it does NOT
* set CSS variables. CSS variables are handled separately by the .variable class.
*/
function injectClassNameRule(className, fontFamily) {
	if (injectedClassRules.has(className)) return;
	injectedClassRules.add(className);
	const css = `.${className} { font-family: ${fontFamily}; }\n`;
	if (typeof document === "undefined") {
		ssrFontStyles$1.push(css);
		return;
	}
	const style = document.createElement("style");
	style.textContent = css;
	style.setAttribute("data-vinext-font-class", className);
	document.head.appendChild(style);
}
/** Track which variable class CSS rules have been injected. */
var injectedVariableRules = /* @__PURE__ */ new Set();
/** Track which :root CSS variable rules have been injected. */
var injectedRootVariables = /* @__PURE__ */ new Set();
/**
* Inject a CSS rule that sets a CSS variable on an element.
* This is what makes `<html className={inter.variable}>` set the CSS variable
* that can be referenced by other styles (e.g., Tailwind's font-sans).
*
* In Next.js, the .variable class ONLY sets the CSS variable — it does NOT
* set font-family. This is critical because apps commonly apply multiple
* .variable classes to <body> (e.g., geistSans.variable + geistMono.variable).
* If we also set font-family here, the last class wins due to CSS cascade,
* causing all text to use that font (e.g., everything becomes monospace).
*/
function injectVariableClassRule(variableClassName, cssVarName, fontFamily) {
	if (injectedVariableRules.has(variableClassName)) return;
	injectedVariableRules.add(variableClassName);
	let css = `.${variableClassName} { ${cssVarName}: ${fontFamily}; }\n`;
	if (!injectedRootVariables.has(cssVarName)) {
		injectedRootVariables.add(cssVarName);
		css += `:root { ${cssVarName}: ${fontFamily}; }\n`;
	}
	if (typeof document === "undefined") {
		ssrFontStyles$1.push(css);
		return;
	}
	const style = document.createElement("style");
	style.textContent = css;
	style.setAttribute("data-vinext-font-variable", variableClassName);
	document.head.appendChild(style);
}
var ssrFontStyles$1 = [];
/**
* Get collected SSR font class styles (used by the renderer).
* Note: We don't clear the arrays because fonts are loaded at module import
* time and need to persist across all requests in the Workers environment.
*/
function getSSRFontStyles$1() {
	return [...ssrFontStyles$1];
}
var ssrFontUrls = [];
/**
* Get collected SSR font URLs (used by the renderer).
* Note: We don't clear the arrays because fonts are loaded at module import
* time and need to persist across all requests in the Workers environment.
*/
function getSSRFontLinks() {
	return [...ssrFontUrls];
}
var ssrFontPreloads$1 = [];
var ssrFontPreloadHrefs = /* @__PURE__ */ new Set();
/**
* Get collected SSR font preload data (used by the renderer).
* Returns an array of { href, type } objects for emitting
* <link rel="preload" as="font" ...> tags.
*/
function getSSRFontPreloads$1() {
	return [...ssrFontPreloads$1];
}
/**
* Determine the MIME type for a font file based on its extension.
*/
function getFontMimeType(pathOrUrl) {
	if (pathOrUrl.endsWith(".woff2")) return "font/woff2";
	if (pathOrUrl.endsWith(".woff")) return "font/woff";
	if (pathOrUrl.endsWith(".ttf")) return "font/ttf";
	if (pathOrUrl.endsWith(".otf")) return "font/opentype";
	return "font/woff2";
}
/**
* Extract font file URLs from @font-face CSS rules.
* Parses url('...') references from the CSS text.
*/
function extractFontUrlsFromCSS(css) {
	const urls = [];
	const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
	let match;
	while ((match = urlRegex.exec(css)) !== null) {
		const url = match[1];
		if (url && url.startsWith("/")) urls.push(url);
	}
	return urls;
}
/**
* Collect font file URLs from self-hosted CSS for preload link generation.
* Only collects on the server (SSR). Deduplicates by href using a Set for O(1) lookups.
*/
function collectFontPreloadsFromCSS(css) {
	if (typeof document !== "undefined") return;
	const urls = extractFontUrlsFromCSS(css);
	for (const href of urls) if (!ssrFontPreloadHrefs.has(href)) {
		ssrFontPreloadHrefs.add(href);
		ssrFontPreloads$1.push({
			href,
			type: getFontMimeType(href)
		});
	}
}
/** Track injected self-hosted @font-face blocks (deduplicate) */
var injectedSelfHosted = /* @__PURE__ */ new Set();
/**
* Inject self-hosted @font-face CSS (from the build plugin).
* This replaces the CDN <link> tag with inline CSS.
*/
function injectSelfHostedCSS(css) {
	if (injectedSelfHosted.has(css)) return;
	injectedSelfHosted.add(css);
	collectFontPreloadsFromCSS(css);
	if (typeof document === "undefined") {
		ssrFontStyles$1.push(css);
		return;
	}
	const style = document.createElement("style");
	style.textContent = css;
	style.setAttribute("data-vinext-font-selfhosted", "true");
	document.head.appendChild(style);
}
function createFontLoader(family) {
	return function fontLoader(options = {}) {
		const id = classCounter++;
		const className = `__font_${family.toLowerCase().replace(/\s+/g, "_")}_${id}`;
		const fallback = options.fallback ?? ["sans-serif"];
		const fontFamily = `'${escapeCSSString(family)}', ${fallback.map(sanitizeFallback).join(", ")}`;
		const defaultVarName = toVarName(family);
		const cssVarName = options.variable ? sanitizeCSSVarName(options.variable) ?? defaultVarName : defaultVarName;
		const variableClassName = `__variable_${family.toLowerCase().replace(/\s+/g, "_")}_${id}`;
		if (options._selfHostedCSS) injectSelfHostedCSS(options._selfHostedCSS);
		else {
			const url = buildGoogleFontsUrl(family, options);
			injectFontStylesheet(url);
			if (typeof document === "undefined") {
				if (!ssrFontUrls.includes(url)) ssrFontUrls.push(url);
			}
		}
		injectClassNameRule(className, fontFamily);
		injectVariableClassRule(variableClassName, cssVarName, fontFamily);
		return {
			className,
			style: { fontFamily },
			variable: variableClassName
		};
	};
}
var googleFonts = new Proxy({}, { get(_target, prop) {
	if (prop === "__esModule") return true;
	if (prop === "default") return googleFonts;
	return createFontLoader(prop.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2"));
} });
//#endregion
//#region node_modules/vinext/dist/shims/font-local.js
var ssrFontStyles = [];
var ssrFontPreloads = [];
/**
* Get collected SSR font styles (used by the renderer).
* Note: We don't clear the arrays because fonts are loaded at module import
* time and need to persist across all requests in the Workers environment.
*/
function getSSRFontStyles() {
	return [...ssrFontStyles];
}
/**
* Get collected SSR font preload data (used by the renderer).
* Returns an array of { href, type } objects for emitting
* <link rel="preload" as="font" ...> tags.
*/
function getSSRFontPreloads() {
	return [...ssrFontPreloads];
}
//#endregion
//#region app/teacher/exams/[examId]/edit/page.tsx
var page_exports$14 = /* @__PURE__ */ __exportAll({ default: () => page_default$7 });
var page_default$7 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "05e51d6467a7", "default");
var Resources = ((React, deps, RemoveDuplicateServerCss, precedence) => {
	return function Resources() {
		return React.createElement(React.Fragment, null, [...deps.css.map((href) => React.createElement("link", {
			key: "css:" + href,
			rel: "stylesheet",
			...precedence ? { precedence } : {},
			href,
			"data-rsc-css-href": href
		})), RemoveDuplicateServerCss && React.createElement(RemoveDuplicateServerCss, { key: "remove-duplicate-css" })]);
	};
})(import_react_react_server.default, assetsManifest.serverResources["app/layout.tsx"], void 0, "vite-rsc/importer-resources");
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/client-boundary/uiComponents.js
var UserButton = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'UserButton' is called on server");
}, "7224bc36fc9a", "UserButton");
new RegExp([
	"bot",
	"spider",
	"crawl",
	"APIs-Google",
	"AdsBot",
	"Googlebot",
	"mediapartners",
	"Google Favicon",
	"FeedFetcher",
	"Google-Read-Aloud",
	"DuplexWeb-Google",
	"googleweblight",
	"bing",
	"yandex",
	"baidu",
	"duckduck",
	"yahoo",
	"ecosia",
	"ia_archiver",
	"facebook",
	"instagram",
	"pinterest",
	"reddit",
	"slack",
	"twitter",
	"whatsapp",
	"youtube",
	"semrush"
].join("|"), "i");
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/utils/mergeNextClerkPropsWithEnv.js
function getPrefetchUIFromEnvAndProps(propsPrefetchUI) {
	if (propsPrefetchUI === false) return false;
	if (process.env.NEXT_PUBLIC_CLERK_PREFETCH_UI === "false") return false;
}
var mergeNextClerkPropsWithEnv = (props) => {
	var _a;
	return {
		...props,
		publishableKey: props.publishableKey || "pk_test_bW92ZWQtY3JhbmUtMjIuY2xlcmsuYWNjb3VudHMuZGV2JA",
		__internal_clerkJSUrl: props.__internal_clerkJSUrl || process.env.NEXT_PUBLIC_CLERK_JS_URL,
		__internal_clerkJSVersion: props.__internal_clerkJSVersion || process.env.NEXT_PUBLIC_CLERK_JS_VERSION,
		__internal_clerkUIUrl: props.__internal_clerkUIUrl || process.env.NEXT_PUBLIC_CLERK_UI_URL,
		__internal_clerkUIVersion: props.__internal_clerkUIVersion || process.env.NEXT_PUBLIC_CLERK_UI_VERSION,
		prefetchUI: getPrefetchUIFromEnvAndProps(props.prefetchUI),
		proxyUrl: props.proxyUrl || process.env.NEXT_PUBLIC_CLERK_PROXY_URL || "",
		domain: props.domain || process.env.NEXT_PUBLIC_CLERK_DOMAIN || "",
		isSatellite: props.isSatellite || isTruthy(process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE),
		signInUrl: props.signInUrl || process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "",
		signUpUrl: props.signUpUrl || process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "",
		signInForceRedirectUrl: props.signInForceRedirectUrl || process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL || "",
		signUpForceRedirectUrl: props.signUpForceRedirectUrl || process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL || "",
		signInFallbackRedirectUrl: props.signInFallbackRedirectUrl || process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "",
		signUpFallbackRedirectUrl: props.signUpFallbackRedirectUrl || process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || "",
		newSubscriptionRedirectUrl: props.newSubscriptionRedirectUrl || process.env.NEXT_PUBLIC_CLERK_CHECKOUT_CONTINUE_URL || "",
		telemetry: (_a = props.telemetry) != null ? _a : {
			disabled: isTruthy(process.env.NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED),
			debug: isTruthy(process.env.NEXT_PUBLIC_CLERK_TELEMETRY_DEBUG)
		},
		sdkMetadata: SDK_METADATA,
		unsafe_disableDevelopmentModeConsoleWarning: isTruthy(process.env.NEXT_PUBLIC_CLERK_UNSAFE_DISABLE_DEVELOPMENT_MODE_CONSOLE_WARNING)
	};
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/app-router/client/ClerkProvider.js
var ClientClerkProvider = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'ClientClerkProvider' is called on server");
}, "bf350598b8b8", "ClientClerkProvider");
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/versionSelector-Cx1-K89P.mjs
/**
* This version selector is a bit complicated, so here is the flow:
* 1. Use the clerkJSVersion prop on the provider
* 2. Use the exact `@clerk/clerk-js` version if it is a `@snapshot` prerelease
* 3. Use the prerelease tag of `@clerk/clerk-js` or the packageVersion provided
* 4. Fallback to the major version of `@clerk/clerk-js` or the packageVersion provided
*
* @param clerkJSVersion - The optional clerkJSVersion prop on the provider
* @param packageVersion - The version of `@clerk/clerk-js` that will be used if an explicit version is not provided
* @returns The npm tag, version or major version to use
*/
var versionSelector = (clerkJSVersion, packageVersion = "6.3.2") => {
	if (clerkJSVersion) return clerkJSVersion;
	const prereleaseTag = getPrereleaseTag(packageVersion);
	if (prereleaseTag) {
		if (prereleaseTag === "snapshot") return packageVersion;
		return prereleaseTag;
	}
	return getMajorVersion(packageVersion);
};
var getPrereleaseTag = (packageVersion) => packageVersion.trim().replace(/^v/, "").match(/-(.+?)(\.|$)/)?.[1];
var getMajorVersion = (packageVersion) => packageVersion.trim().replace(/^v/, "").split(".")[0];
//#endregion
//#region node_modules/@clerk/shared/dist/runtime/loadClerkJsScript.mjs
var { isDevOrStagingUrl } = createDevOrStagingUrlCache();
buildErrorThrower({ packageName: "@clerk/shared" });
var clerkJSScriptUrl = (opts) => {
	const { __internal_clerkJSUrl, __internal_clerkJSVersion, proxyUrl, domain, publishableKey } = opts;
	if (__internal_clerkJSUrl) return __internal_clerkJSUrl;
	return `https://${buildScriptHost({
		publishableKey,
		proxyUrl,
		domain
	})}/npm/@clerk/clerk-js@${versionSelector(__internal_clerkJSVersion)}/dist/clerk.browser.js`;
};
var clerkUIScriptUrl = (opts) => {
	const { __internal_clerkUIUrl, __internal_clerkUIVersion, proxyUrl, domain, publishableKey } = opts;
	if (__internal_clerkUIUrl) return __internal_clerkUIUrl;
	return `https://${buildScriptHost({
		publishableKey,
		proxyUrl,
		domain
	})}/npm/@clerk/ui@${versionSelector(__internal_clerkUIVersion, "1.2.3")}/dist/ui.browser.js`;
};
var buildClerkJSScriptAttributes = (options) => {
	const obj = {};
	if (options.publishableKey) obj["data-clerk-publishable-key"] = options.publishableKey;
	if (options.proxyUrl) obj["data-clerk-proxy-url"] = options.proxyUrl;
	if (options.domain) obj["data-clerk-domain"] = options.domain;
	if (options.nonce) obj.nonce = options.nonce;
	return obj;
};
var buildScriptHost = (opts) => {
	const { proxyUrl, domain, publishableKey } = opts;
	if (!!proxyUrl && isValidProxyUrl(proxyUrl)) return proxyUrlToAbsoluteURL(proxyUrl).replace(/http(s)?:\/\//, "");
	else if (domain && !isDevOrStagingUrl(parsePublishableKey(publishableKey)?.frontendApi || "")) return addClerkPrefix(domain);
	else return parsePublishableKey(publishableKey)?.frontendApi || "";
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/utils/clerk-script-tags.js
function ClerkScriptTags(props) {
	const { publishableKey, __internal_clerkJSUrl, __internal_clerkJSVersion, __internal_clerkUIUrl, __internal_clerkUIVersion, nonce, domain, proxyUrl, prefetchUI } = props;
	const opts = {
		publishableKey,
		__internal_clerkJSUrl,
		__internal_clerkJSVersion,
		__internal_clerkUIUrl,
		__internal_clerkUIVersion,
		nonce,
		domain,
		proxyUrl
	};
	return /* @__PURE__ */ import_react_react_server.createElement(import_react_react_server.Fragment, null, /* @__PURE__ */ import_react_react_server.createElement("script", {
		src: clerkJSScriptUrl(opts),
		"data-clerk-js-script": true,
		async: true,
		crossOrigin: "anonymous",
		...buildClerkJSScriptAttributes(opts)
	}), prefetchUI !== false && /* @__PURE__ */ import_react_react_server.createElement("link", {
		rel: "preload",
		href: clerkUIScriptUrl(opts),
		as: "script",
		crossOrigin: "anonymous",
		nonce
	}));
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/app-router/server/DynamicClerkScripts.js
async function getNonce() {
	try {
		const headersList = await headers();
		const nonce = headersList.get("X-Nonce");
		return nonce ? nonce : getScriptNonceFromHeader(headersList.get("Content-Security-Policy") || "") || "";
	} catch (e) {
		if (isPrerenderingBailout(e)) throw e;
		return "";
	}
}
async function DynamicClerkScripts(props) {
	const { publishableKey, __internal_clerkJSUrl, __internal_clerkJSVersion, __internal_clerkUIUrl, __internal_clerkUIVersion, domain, proxyUrl, prefetchUI } = props;
	if (!publishableKey) return null;
	const nonce = await getNonce();
	return /* @__PURE__ */ import_react_react_server.createElement(ClerkScriptTags, {
		publishableKey,
		__internal_clerkJSUrl,
		__internal_clerkJSVersion,
		__internal_clerkUIUrl,
		__internal_clerkUIVersion,
		nonce,
		domain,
		proxyUrl,
		prefetchUI
	});
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/utils/only-try.js
var onlyTry = (cb) => {
	try {
		cb();
	} catch {}
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/app-router/server/keyless-provider.js
async function getKeylessStatus(params) {
	let [shouldRunAsKeyless, runningWithClaimedKeys, locallyStoredPublishableKey] = [
		false,
		false,
		""
	];
	if (canUseKeyless) {
		locallyStoredPublishableKey = await import("./assets/keyless-node-RQ32zZX1.js").then((mod) => {
			var _a;
			return ((_a = mod.keyless().readKeys()) == null ? void 0 : _a.publishableKey) || "";
		}).catch(() => "");
		runningWithClaimedKeys = Boolean(params.publishableKey) && params.publishableKey === locallyStoredPublishableKey;
		shouldRunAsKeyless = !params.publishableKey || runningWithClaimedKeys;
	}
	return {
		shouldRunAsKeyless,
		runningWithClaimedKeys
	};
}
var KeylessProvider = async (props) => {
	const { rest, runningWithClaimedKeys, __internal_scriptsSlot, children } = props;
	const newOrReadKeys = await import("./assets/keyless-node-RQ32zZX1.js").then((mod) => mod.keyless().getOrCreateKeys()).catch(() => null);
	const { clerkDevelopmentCache, createConfirmationMessage, createKeylessModeMessage } = await import("./assets/keyless-log-cache-BTxvRb4s.js").then((n) => n.t);
	if (!newOrReadKeys) return /* @__PURE__ */ import_react_react_server.createElement(ClientClerkProvider, {
		...mergeNextClerkPropsWithEnv(rest),
		disableKeyless: true,
		__internal_scriptsSlot
	}, children);
	const clientProvider = /* @__PURE__ */ import_react_react_server.createElement(ClientClerkProvider, {
		...mergeNextClerkPropsWithEnv({
			...rest,
			publishableKey: newOrReadKeys.publishableKey,
			__internal_keyless_claimKeylessApplicationUrl: newOrReadKeys.claimUrl,
			__internal_keyless_copyInstanceKeysUrl: newOrReadKeys.apiKeysUrl,
			__internal_keyless_dismissPrompt: runningWithClaimedKeys ? $$wrap_deleteKeylessAction : null
		}),
		__internal_scriptsSlot
	}, children);
	if (runningWithClaimedKeys) {
		try {
			const keylessService = await import("./assets/keyless-node-RQ32zZX1.js").then((mod) => mod.keyless());
			await (clerkDevelopmentCache == null ? void 0 : clerkDevelopmentCache.run(() => keylessService.completeOnboarding(), {
				cacheKey: `${newOrReadKeys.publishableKey}_complete`,
				onSuccessStale: 1440 * 60 * 1e3
			}));
		} catch {}
		clerkDevelopmentCache?.log({
			cacheKey: `${newOrReadKeys.publishableKey}_claimed`,
			msg: createConfirmationMessage()
		});
		return clientProvider;
	}
	const KeylessCookieSync = await import("./assets/keyless-cookie-sync-CE5-_JL7.js").then((mod) => mod.KeylessCookieSync);
	const headerStore = await headers();
	const host = headerStore.get("x-forwarded-host");
	const proto = headerStore.get("x-forwarded-proto");
	const claimUrl = new URL(newOrReadKeys.claimUrl);
	if (host && proto) onlyTry(() => claimUrl.searchParams.set("return_url", new URL(`${proto}://${host}`).href));
	clerkDevelopmentCache?.log({
		cacheKey: newOrReadKeys.publishableKey,
		msg: createKeylessModeMessage({
			...newOrReadKeys,
			claimUrl: claimUrl.href
		})
	});
	return /* @__PURE__ */ import_react_react_server.createElement(KeylessCookieSync, { ...newOrReadKeys }, clientProvider);
};
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/app-router/server/ClerkProvider.js
var getDynamicClerkState = import_react_react_server.cache(async function getDynamicClerkState2() {
	return getDynamicAuthData(await buildRequestLike());
});
async function ClerkProvider$1(props) {
	const { children, dynamic, ...rest } = props;
	const statePromiseOrValue = dynamic ? getDynamicClerkState() : void 0;
	const propsWithEnvs = mergeNextClerkPropsWithEnv({
		...rest,
		initialState: statePromiseOrValue
	});
	const { shouldRunAsKeyless, runningWithClaimedKeys } = await getKeylessStatus(propsWithEnvs);
	const scriptsSlot = dynamic ? /* @__PURE__ */ import_react_react_server.createElement(import_react_react_server.Suspense, null, /* @__PURE__ */ import_react_react_server.createElement(DynamicClerkScripts, {
		publishableKey: propsWithEnvs.publishableKey,
		__internal_clerkJSUrl: propsWithEnvs.__internal_clerkJSUrl,
		__internal_clerkJSVersion: propsWithEnvs.__internal_clerkJSVersion,
		__internal_clerkUIUrl: propsWithEnvs.__internal_clerkUIUrl,
		__internal_clerkUIVersion: propsWithEnvs.__internal_clerkUIVersion,
		domain: propsWithEnvs.domain,
		proxyUrl: propsWithEnvs.proxyUrl,
		prefetchUI: propsWithEnvs.prefetchUI
	})) : void 0;
	if (shouldRunAsKeyless) return /* @__PURE__ */ import_react_react_server.createElement(KeylessProvider, {
		rest: propsWithEnvs,
		runningWithClaimedKeys,
		__internal_scriptsSlot: scriptsSlot
	}, children);
	return /* @__PURE__ */ import_react_react_server.createElement(ClientClerkProvider, {
		...propsWithEnvs,
		__internal_scriptsSlot: scriptsSlot
	}, children);
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/app-router/server/controlComponents.js
async function Show$1(props) {
	const { children, fallback, treatPendingAsSignedOut, when } = props;
	const { has, userId } = await auth({ treatPendingAsSignedOut });
	const resolvedWhen = when;
	const authorized = /* @__PURE__ */ import_react_react_server.createElement(import_react_react_server.Fragment, null, children);
	const unauthorized = fallback ? /* @__PURE__ */ import_react_react_server.createElement(import_react_react_server.Fragment, null, fallback) : null;
	if (typeof resolvedWhen === "string") {
		if (resolvedWhen === "signed-out") return userId ? unauthorized : authorized;
		return userId ? authorized : unauthorized;
	}
	if (!userId) return unauthorized;
	if (typeof resolvedWhen === "function") return resolvedWhen(has) ? authorized : unauthorized;
	return has(resolvedWhen) ? authorized : unauthorized;
}
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/index.js
var ClerkProvider = ClerkProvider$1;
var Show = Show$1;
//#endregion
//#region lib/clerk-appearance.ts
var clerkAppearance = {
	cssLayerName: "clerk",
	theme: "simple",
	layout: {
		socialButtonsPlacement: "bottom",
		socialButtonsVariant: "blockButton"
	},
	variables: {
		colorPrimary: "var(--foreground)",
		colorText: "var(--foreground)",
		colorTextSecondary: "color-mix(in oklch, var(--foreground) 62%, white)",
		colorBackground: "var(--card)",
		colorInputBackground: "var(--background)",
		colorInputText: "var(--foreground)",
		colorNeutral: "var(--muted)",
		colorDanger: "var(--destructive)",
		borderRadius: "1.5rem",
		fontFamily: "var(--app-font-sans)"
	},
	elements: {
		rootBox: "w-full",
		cardBox: "w-full shadow-none",
		card: "rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-none",
		navbar: "hidden",
		headerTitle: "text-2xl font-semibold tracking-tight text-foreground",
		headerSubtitle: "mt-2 text-sm leading-6 text-muted-foreground",
		socialButtonsBlockButton: "h-11 rounded-xl border border-border bg-background text-sm font-medium text-foreground shadow-none transition-colors hover:bg-muted",
		socialButtonsBlockButtonText: "font-medium text-foreground",
		dividerLine: "bg-border",
		dividerText: "px-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase",
		formFieldLabel: "mb-2 text-sm font-medium tracking-tight text-foreground",
		formFieldInput: "h-11 rounded-xl border border-border bg-background text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus:border-foreground/25 focus:ring-2 focus:ring-ring/30",
		formButtonPrimary: "h-11 rounded-xl bg-foreground text-sm font-medium text-background shadow-none transition-all hover:bg-foreground/90",
		footerActionText: "text-sm text-muted-foreground",
		footerActionLink: "font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground/80",
		formResendCodeLink: "font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground/80",
		identityPreviewText: "text-sm text-foreground",
		identityPreviewEditButton: "font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground/80",
		otpCodeFieldInput: "size-11 rounded-xl border border-border bg-background text-foreground shadow-none",
		formFieldSuccessText: "text-sm text-foreground",
		formFieldWarningText: "text-sm text-destructive",
		alertText: "text-sm",
		alertClerkError: "rounded-xl border border-destructive/20 bg-destructive/10",
		alertClerkErrorText: "text-destructive",
		alternativeMethodsBlockButton: "rounded-xl border border-border bg-background text-foreground hover:bg-muted"
	}
};
//#endregion
//#region app/apollo-provider.tsx
var apollo_provider_default = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "43a0ea15b859", "default");
//#endregion
//#region app/layout.tsx
var layout_exports$3 = /* @__PURE__ */ __exportAll({
	default: () => $$wrap_RootLayout,
	metadata: () => metadata
});
var metadata = {
	title: "PineQuest",
	description: "PineQuest with Clerk authentication on Next.js 16."
};
function RootLayout({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("html", {
		lang: "en",
		className: "h-full antialiased",
		children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("body", {
			className: "min-h-full bg-background text-foreground",
			children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ClerkProvider, {
				appearance: clerkAppearance,
				children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
					className: "relative flex min-h-screen flex-col",
					children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(apollo_provider_default, { children })
				})
			})
		})
	});
}
var $$wrap_RootLayout = /* @__PURE__ */ __vite_rsc_wrap_css__(RootLayout, "default");
function __vite_rsc_wrap_css__(value, name) {
	if (typeof value !== "function") return value;
	function __wrapper(props) {
		return import_react_react_server.createElement(import_react_react_server.Fragment, null, import_react_react_server.createElement(Resources), import_react_react_server.createElement(value, props));
	}
	Object.defineProperty(__wrapper, "name", { value: name });
	return __wrapper;
}
//#endregion
//#region components/auth/cloudflare-student-sync.tsx
var CloudflareStudentSync = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'CloudflareStudentSync' is called on server");
}, "5fda18c2edc0", "CloudflareStudentSync");
//#endregion
//#region app/teacher/_component/TeacherHeader.tsx
var TeacherHeader = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'TeacherHeader' is called on server");
}, "35f793470406", "TeacherHeader");
//#endregion
//#region app/teacher/layout.tsx
var layout_exports$2 = /* @__PURE__ */ __exportAll({ default: () => TeacherLayout });
async function TeacherLayout({ children }) {
	const user = await currentUser();
	if (!user) redirect("/sign-in");
	const email = user.primaryEmailAddress?.emailAddress ?? "";
	const rawFirstName = user.unsafeMetadata?.firstName;
	const rawLastName = user.unsafeMetadata?.lastName;
	const rawPhone = user.unsafeMetadata?.phone;
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
		className: "min-h-screen bg-[#FCFCFE]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
				className: "sr-only",
				children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(CloudflareStudentSync, {
					email,
					firstName: typeof rawFirstName === "string" && rawFirstName.trim() ? rawFirstName : user.firstName ?? user.username ?? email,
					lastName: typeof rawLastName === "string" && rawLastName.trim() ? rawLastName : "",
					phone: typeof rawPhone === "string" ? rawPhone : "",
					grade: "",
					className: "",
					inviteCode: "",
					role: "teacher"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(TeacherHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("main", {
				className: "mx-auto w-full max-w-[1360px] px-6 py-10 lg:px-8",
				children
			})
		]
	});
}
//#endregion
//#region app/teacher/_component/StudentReviewDetail.tsx
var StudentReviewDetail = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'StudentReviewDetail' is called on server");
}, "f81ba8e9b4fe", "StudentReviewDetail");
[
	{
		key: "all",
		label: "Бүгд"
	},
	{
		key: "social",
		label: "Нийгэм"
	},
	{
		key: "civics",
		label: "Иргэний боловсрол"
	}
].filter((tab) => tab.key !== "all").map((tab) => tab.key);
var examCards = [
	{
		id: "soc-10-a",
		title: "Нийгэм Ухаан",
		topic: "Соёл",
		grade: "10-р анги",
		date: "03.25.2026",
		startTime: "13:30",
		duration: 60,
		taskCount: 30,
		subject: "social"
	},
	{
		id: "soc-10-b",
		title: "Нийгэм Ухаан",
		topic: "Соёл",
		grade: "9-р анги",
		date: "03.25.2026",
		startTime: "13:30",
		duration: 60,
		taskCount: 30,
		subject: "social"
	},
	{
		id: "soc-10-c",
		title: "Нийгэм Ухаан",
		topic: "Соёл",
		grade: "11-р анги",
		date: "03.25.2026",
		startTime: "13:30",
		duration: 60,
		taskCount: 30,
		subject: "social"
	},
	{
		id: "soc-10-d",
		title: "Нийгэм Ухаан",
		topic: "Соёл",
		grade: "12-р анги",
		date: "03.25.2026",
		startTime: "13:30",
		duration: 60,
		taskCount: 30,
		subject: "social"
	},
	{
		id: "civ-9-a",
		title: "Иргэний ёс зүй",
		topic: "Соёл",
		grade: "9-р анги",
		date: "03.28.2026",
		startTime: "13:30",
		duration: 45,
		taskCount: 24,
		subject: "civics"
	},
	{
		id: "civ-11-a",
		title: "Иргэний ёс зүй",
		topic: "Соёл",
		grade: "11-р анги",
		date: "04.01.2026",
		startTime: "13:30",
		duration: 50,
		taskCount: 28,
		subject: "civics"
	}
];
var studentResultsByExam = {
	"soc-10-a": [
		{
			id: 1,
			name: "Самбуудорж Ануужин",
			section: "10-1",
			score: "23/30",
			submittedAt: "2/8/2025",
			durationMinutes: 40
		},
		{
			id: 2,
			name: "Ц.Номуунаа",
			section: "10-1",
			score: "23/30",
			submittedAt: "2/8/2025",
			durationMinutes: 58
		},
		{
			id: 3,
			name: "Б.Тэмүүлэн",
			section: "10-2",
			score: "21/30",
			submittedAt: "2/8/2025",
			durationMinutes: 55
		},
		{
			id: 4,
			name: "Г.Мишээл",
			section: "10-2",
			score: "26/30",
			submittedAt: "2/8/2025",
			durationMinutes: 47
		},
		{
			id: 5,
			name: "Э.Сондор",
			section: "10-3",
			score: "20/30",
			submittedAt: "2/8/2025",
			durationMinutes: 59
		},
		{
			id: 6,
			name: "М.Марал",
			section: "10-1",
			score: "28/30",
			submittedAt: "2/8/2025",
			durationMinutes: 42
		},
		{
			id: 7,
			name: "Ж.Номин",
			section: "10-3",
			score: "24/30",
			submittedAt: "2/8/2025",
			durationMinutes: 51
		}
	],
	"soc-10-b": [
		{
			id: 1,
			name: "Д.Анударь",
			section: "9-1",
			score: "25/30",
			submittedAt: "2/9/2025",
			durationMinutes: 44
		},
		{
			id: 2,
			name: "Н.Төгөлдөр",
			section: "9-1",
			score: "19/30",
			submittedAt: "2/9/2025",
			durationMinutes: 57
		},
		{
			id: 3,
			name: "О.Ивээл",
			section: "9-2",
			score: "27/30",
			submittedAt: "2/9/2025",
			durationMinutes: 46
		}
	],
	"soc-10-c": [{
		id: 1,
		name: "А.Саруул",
		section: "11-1",
		score: "24/30",
		submittedAt: "2/10/2025",
		durationMinutes: 43
	}, {
		id: 2,
		name: "Ч.Амин",
		section: "11-2",
		score: "22/30",
		submittedAt: "2/10/2025",
		durationMinutes: 56
	}],
	"soc-10-d": [{
		id: 1,
		name: "П.Мөнхжин",
		section: "12-1",
		score: "18/30",
		submittedAt: "2/11/2025",
		durationMinutes: 60
	}, {
		id: 2,
		name: "С.Мөнгөнзул",
		section: "12-2",
		score: "29/30",
		submittedAt: "2/11/2025",
		durationMinutes: 45
	}],
	"civ-9-a": [{
		id: 1,
		name: "Ц.Эрхэс",
		section: "9-3",
		score: "20/24",
		submittedAt: "3/1/2025",
		durationMinutes: 39
	}],
	"civ-11-a": [{
		id: 1,
		name: "Э.Наран",
		section: "11-3",
		score: "25/28",
		submittedAt: "3/3/2025",
		durationMinutes: 48
	}]
};
//#endregion
//#region app/teacher/dashboard/[examId]/students/[studentId]/page.tsx
var page_exports$13 = /* @__PURE__ */ __exportAll({ default: () => TeacherStudentReviewPage });
async function TeacherStudentReviewPage({ params }) {
	const { examId, studentId } = await params;
	const exam = examCards.find((item) => item.id === examId);
	const student = (studentResultsByExam[examId] ?? []).find((item) => String(item.id) === studentId);
	if (!exam || !student) notFound();
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(StudentReviewDetail, {
		exam,
		student
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.js
/**
* @license lucide-react v0.577.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
	return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.js
/**
* @license lucide-react v0.577.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.js
/**
* @license lucide-react v0.577.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var toCamelCase = (string) => string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase());
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.js
/**
* @license lucide-react v0.577.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var toPascalCase = (string) => {
	const camelCase = toCamelCase(string);
	return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
//#endregion
//#region node_modules/lucide-react/dist/esm/defaultAttributes.js
/**
* @license lucide-react v0.577.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var defaultAttributes = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
};
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.js
/**
* @license lucide-react v0.577.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var hasA11yProp = (props) => {
	for (const prop in props) if (prop.startsWith("aria-") || prop === "role" || prop === "title") return true;
	return false;
};
//#endregion
//#region node_modules/lucide-react/dist/esm/Icon.js
/**
* @license lucide-react v0.577.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Icon = (0, import_react_react_server.forwardRef)(({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => (0, import_react_react_server.createElement)("svg", {
	ref,
	...defaultAttributes,
	width: size,
	height: size,
	stroke: color,
	strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
	className: mergeClasses("lucide", className),
	...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
	...rest
}, [...iconNode.map(([tag, attrs]) => (0, import_react_react_server.createElement)(tag, attrs)), ...Array.isArray(children) ? children : [children]]));
//#endregion
//#region node_modules/lucide-react/dist/esm/createLucideIcon.js
/**
* @license lucide-react v0.577.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var createLucideIcon = (iconName, iconNode) => {
	const Component = (0, import_react_react_server.forwardRef)(({ className, ...props }, ref) => (0, import_react_react_server.createElement)(Icon, {
		ref,
		iconNode,
		className: mergeClasses(`lucide-${toKebabCase(toPascalCase(iconName))}`, `lucide-${iconName}`, className),
		...props
	}));
	Component.displayName = toPascalCase(iconName);
	return Component;
};
var ArrowRight = createLucideIcon("arrow-right", [["path", {
	d: "M5 12h14",
	key: "1ays0h"
}], ["path", {
	d: "m12 5 7 7-7 7",
	key: "xquz4c"
}]]);
var LockKeyhole = createLucideIcon("lock-keyhole", [
	["circle", {
		cx: "12",
		cy: "16",
		r: "1",
		key: "1au0dj"
	}],
	["rect", {
		x: "3",
		y: "10",
		width: "18",
		height: "12",
		rx: "2",
		key: "6s8ecr"
	}],
	["path", {
		d: "M7 10V7a5 5 0 0 1 10 0v3",
		key: "1pqi11"
	}]
]);
var ShieldCheck = createLucideIcon("shield-check", [["path", {
	d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
	key: "oel41y"
}], ["path", {
	d: "m9 12 2 2 4-4",
	key: "dzmm74"
}]]);
var UserRoundCheck = createLucideIcon("user-round-check", [
	["path", {
		d: "M2 21a8 8 0 0 1 13.292-6",
		key: "bjp14o"
	}],
	["circle", {
		cx: "10",
		cy: "8",
		r: "5",
		key: "o932ke"
	}],
	["path", {
		d: "m16 19 2 2 4-4",
		key: "1b14m6"
	}]
]);
//#endregion
//#region node_modules/vinext/dist/shims/link.js
/**
* next/link shim
*
* Renders an <a> tag with client-side navigation support.
* On click, prevents full page reload and triggers client-side
* page swap via the router's navigation system.
*/
/**
* useLinkStatus returns the pending state of the enclosing <Link>.
* In Next.js, this is used to show loading indicators while a
* prefetch-triggered navigation is in progress.
*/
/** basePath from next.config.js, injected by the plugin at build time */
/**
* Check if a href is only a hash change (same pathname, different/added hash).
* Handles relative hashes like "#foo" and "?query#foo".
*/
/**
* Scroll to a hash target element, or to the top if no hash.
*/
/**
* Prefetch a URL for faster navigation.
*
* For App Router (RSC): fetches the .rsc payload in the background and
* stores it in an in-memory cache for instant use during navigation.
* For Pages Router: injects a <link rel="prefetch"> for the page module.
*
* Uses `requestIdleCallback` (or `setTimeout` fallback) to avoid blocking
* the main thread during initial page load.
*/
/**
* Shared IntersectionObserver for viewport-based prefetching.
* All Link elements use the same observer to minimize resource usage.
*/
/**
* Apply locale prefix to a URL path based on the locale prop.
* - locale="fr" → prepend /fr (unless it already has a locale prefix)
* - locale={false} → use the href as-is (no locale prefix, link to default)
* - locale=undefined → use current locale (href as-is in most cases)
*/
var link_default = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "c2747888630f", "default");
//#endregion
//#region components/charts/chart-kit.tsx
var BarChart = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'BarChart' is called on server");
}, "b2f03200b779", "BarChart");
var DoughnutChart = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'DoughnutChart' is called on server");
}, "b2f03200b779", "DoughnutChart");
//#endregion
//#region node_modules/katex/dist/katex.mjs
/**
* This is the ParseError class, which is the main error thrown by KaTeX
* functions when something has gone wrong. This is used to distinguish internal
* errors from errors in the expression that the user provided.
*
* If possible, a caller should provide a Token or ParseNode with information
* about where in the source string the problem occurred.
*/
var ParseError = class ParseError extends Error {
	constructor(message, token) {
		var error = "KaTeX parse error: " + message;
		var start;
		var end;
		var loc = token && token.loc;
		if (loc && loc.start <= loc.end) {
			var input = loc.lexer.input;
			start = loc.start;
			end = loc.end;
			if (start === input.length) error += " at end of input: ";
			else error += " at position " + (start + 1) + ": ";
			var underlined = input.slice(start, end).replace(/[^]/g, "$&̲");
			var left;
			if (start > 15) left = "…" + input.slice(start - 15, start);
			else left = input.slice(0, start);
			var right;
			if (end + 15 < input.length) right = input.slice(end, end + 15) + "…";
			else right = input.slice(end);
			error += left + underlined + right;
		}
		super(error);
		this.name = "ParseError";
		Object.setPrototypeOf(this, ParseError.prototype);
		this.position = start;
		if (start != null && end != null) this.length = end - start;
		this.rawMessage = message;
	}
};
/**
* This file contains a list of utility functions which are useful in other
* files.
*/
var uppercase = /([A-Z])/g;
var hyphenate = (str) => str.replace(uppercase, "-$1").toLowerCase();
var ESCAPE_LOOKUP = {
	"&": "&amp;",
	">": "&gt;",
	"<": "&lt;",
	"\"": "&quot;",
	"'": "&#x27;"
};
var ESCAPE_REGEX = /[&><"']/g;
/**
* Escapes text to prevent scripting attacks.
*/
var escape$1 = (text) => String(text).replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
/**
* Sometimes we want to pull out the innermost element of a group. In most
* cases, this will just be the group itself, but when ordgroups and colors have
* a single element, we want to pull that out.
*/
var getBaseElem = (group) => {
	if (group.type === "ordgroup") if (group.body.length === 1) return getBaseElem(group.body[0]);
	else return group;
	else if (group.type === "color") if (group.body.length === 1) return getBaseElem(group.body[0]);
	else return group;
	else if (group.type === "font") return getBaseElem(group.body);
	else return group;
};
var characterNodesTypes = new Set([
	"mathord",
	"textord",
	"atom"
]);
/**
* TeXbook algorithms often reference "character boxes", which are simply groups
* with a single character in them. To decide if something is a character box,
* we find its innermost group, and see if it is a single character.
*/
var isCharacterBox = (group) => characterNodesTypes.has(getBaseElem(group).type);
/**
* Return the protocol of a URL, or "_relative" if the URL does not specify a
* protocol (and thus is relative), or `null` if URL has invalid protocol
* (so should be outright rejected).
*/
var protocolFromUrl = (url) => {
	var protocol = /^[\x00-\x20]*([^\\/#?]*?)(:|&#0*58|&#x0*3a|&colon)/i.exec(url);
	if (!protocol) return "_relative";
	if (protocol[2] !== ":") return null;
	if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*$/.test(protocol[1])) return null;
	return protocol[1].toLowerCase();
};
var SETTINGS_SCHEMA = {
	displayMode: {
		type: "boolean",
		description: "Render math in display mode, which puts the math in display style (so \\int and \\sum are large, for example), and centers the math on the page on its own line.",
		cli: "-d, --display-mode"
	},
	output: {
		type: { enum: [
			"htmlAndMathml",
			"html",
			"mathml"
		] },
		description: "Determines the markup language of the output.",
		cli: "-F, --format <type>"
	},
	leqno: {
		type: "boolean",
		description: "Render display math in leqno style (left-justified tags)."
	},
	fleqn: {
		type: "boolean",
		description: "Render display math flush left."
	},
	throwOnError: {
		type: "boolean",
		default: true,
		cli: "-t, --no-throw-on-error",
		cliDescription: "Render errors (in the color given by --error-color) instead of throwing a ParseError exception when encountering an error."
	},
	errorColor: {
		type: "string",
		default: "#cc0000",
		cli: "-c, --error-color <color>",
		cliDescription: "A color string given in the format 'rgb' or 'rrggbb' (no #). This option determines the color of errors rendered by the -t option.",
		cliProcessor: (color) => "#" + color
	},
	macros: {
		type: "object",
		cli: "-m, --macro <def>",
		cliDescription: "Define custom macro of the form '\\foo:expansion' (use multiple -m arguments for multiple macros).",
		cliDefault: [],
		cliProcessor: (def, defs) => {
			defs.push(def);
			return defs;
		}
	},
	minRuleThickness: {
		type: "number",
		description: "Specifies a minimum thickness, in ems, for fraction lines, `\\sqrt` top lines, `{array}` vertical lines, `\\hline`, `\\hdashline`, `\\underline`, `\\overline`, and the borders of `\\fbox`, `\\boxed`, and `\\fcolorbox`.",
		processor: (t) => Math.max(0, t),
		cli: "--min-rule-thickness <size>",
		cliProcessor: parseFloat
	},
	colorIsTextColor: {
		type: "boolean",
		description: "Makes \\color behave like LaTeX's 2-argument \\textcolor, instead of LaTeX's one-argument \\color mode change.",
		cli: "-b, --color-is-text-color"
	},
	strict: {
		type: [
			{ enum: [
				"warn",
				"ignore",
				"error"
			] },
			"boolean",
			"function"
		],
		description: "Turn on strict / LaTeX faithfulness mode, which throws an error if the input uses features that are not supported by LaTeX.",
		cli: "-S, --strict",
		cliDefault: false
	},
	trust: {
		type: ["boolean", "function"],
		description: "Trust the input, enabling all HTML features such as \\url.",
		cli: "-T, --trust"
	},
	maxSize: {
		type: "number",
		default: Infinity,
		description: "If non-zero, all user-specified sizes, e.g. in \\rule{500em}{500em}, will be capped to maxSize ems. Otherwise, elements and spaces can be arbitrarily large",
		processor: (s) => Math.max(0, s),
		cli: "-s, --max-size <n>",
		cliProcessor: parseInt
	},
	maxExpand: {
		type: "number",
		default: 1e3,
		description: "Limit the number of macro expansions to the specified number, to prevent e.g. infinite macro loops. If set to Infinity, the macro expander will try to fully expand as in LaTeX.",
		processor: (n) => Math.max(0, n),
		cli: "-e, --max-expand <n>",
		cliProcessor: (n) => n === "Infinity" ? Infinity : parseInt(n)
	},
	globalGroup: {
		type: "boolean",
		cli: false
	}
};
function getDefaultValue(schema) {
	if ("default" in schema) return schema.default;
	var type = schema.type;
	var defaultType = Array.isArray(type) ? type[0] : type;
	if (typeof defaultType !== "string") return defaultType.enum[0];
	switch (defaultType) {
		case "boolean": return false;
		case "string": return "";
		case "number": return 0;
		case "object": return {};
	}
}
/**
* The main Settings object
*
* The current options stored are:
*  - displayMode: Whether the expression should be typeset as inline math
*                 (false, the default), meaning that the math starts in
*                 \textstyle and is placed in an inline-block); or as display
*                 math (true), meaning that the math starts in \displaystyle
*                 and is placed in a block with vertical margin.
*/
var Settings = class {
	constructor(options) {
		if (options === void 0) options = {};
		options = options || {};
		for (var prop of Object.keys(SETTINGS_SCHEMA)) {
			var schema = SETTINGS_SCHEMA[prop];
			var optionValue = options[prop];
			this[prop] = optionValue !== void 0 ? schema.processor ? schema.processor(optionValue) : optionValue : getDefaultValue(schema);
		}
	}
	/**
	* Report nonstrict (non-LaTeX-compatible) input.
	* Can safely not be called if `this.strict` is false in JavaScript.
	*/
	reportNonstrict(errorCode, errorMsg, token) {
		var strict = this.strict;
		if (typeof strict === "function") strict = strict(errorCode, errorMsg, token);
		if (!strict || strict === "ignore") return;
		else if (strict === true || strict === "error") throw new ParseError("LaTeX-incompatible input and strict mode is set to 'error': " + (errorMsg + " [" + errorCode + "]"), token);
		else if (strict === "warn") typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (errorMsg + " [" + errorCode + "]"));
		else typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + strict + "': " + errorMsg + " [" + errorCode + "]"));
	}
	/**
	* Check whether to apply strict (LaTeX-adhering) behavior for unusual
	* input (like `\\`).  Unlike `nonstrict`, will not throw an error;
	* instead, "error" translates to a return value of `true`, while "ignore"
	* translates to a return value of `false`.  May still print a warning:
	* "warn" prints a warning and returns `false`.
	* This is for the second category of `errorCode`s listed in the README.
	*/
	useStrictBehavior(errorCode, errorMsg, token) {
		var strict = this.strict;
		if (typeof strict === "function") try {
			strict = strict(errorCode, errorMsg, token);
		} catch (error) {
			strict = "error";
		}
		if (!strict || strict === "ignore") return false;
		else if (strict === true || strict === "error") return true;
		else if (strict === "warn") {
			typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (errorMsg + " [" + errorCode + "]"));
			return false;
		} else {
			typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + strict + "': " + errorMsg + " [" + errorCode + "]"));
			return false;
		}
	}
	/**
	* Check whether to test potentially dangerous input, and return
	* `true` (trusted) or `false` (untrusted).  The sole argument `context`
	* should be an object with `command` field specifying the relevant LaTeX
	* command (as a string starting with `\`), and any other arguments, etc.
	* If `context` has a `url` field, a `protocol` field will automatically
	* get added by this function (changing the specified object).
	*/
	isTrusted(context) {
		if ("url" in context && context.url && !context.protocol) {
			var protocol = protocolFromUrl(context.url);
			if (protocol == null) return false;
			context.protocol = protocol;
		}
		var trust = typeof this.trust === "function" ? this.trust(context) : this.trust;
		return Boolean(trust);
	}
};
/**
* This file contains information and classes for the various kinds of styles
* used in TeX. It provides a generic `Style` class, which holds information
* about a specific style. It then provides instances of all the different kinds
* of styles possible, and provides functions to move between them and get
* information about them.
*/
/**
* The main style class. Contains a unique id for the style, a size (which is
* the same for cramped and uncramped version of a style), and a cramped flag.
*/
var Style = class {
	constructor(id, size, cramped) {
		this.id = id;
		this.size = size;
		this.cramped = cramped;
	}
	/**
	* Get the style of a superscript given a base in the current style.
	*/
	sup() {
		return styles[sup[this.id]];
	}
	/**
	* Get the style of a subscript given a base in the current style.
	*/
	sub() {
		return styles[sub[this.id]];
	}
	/**
	* Get the style of a fraction numerator given the fraction in the current
	* style.
	*/
	fracNum() {
		return styles[fracNum[this.id]];
	}
	/**
	* Get the style of a fraction denominator given the fraction in the current
	* style.
	*/
	fracDen() {
		return styles[fracDen[this.id]];
	}
	/**
	* Get the cramped version of a style (in particular, cramping a cramped style
	* doesn't change the style).
	*/
	cramp() {
		return styles[cramp[this.id]];
	}
	/**
	* Get a text or display version of this style.
	*/
	text() {
		return styles[text$1[this.id]];
	}
	/**
	* Return true if this style is tightly spaced (scriptstyle/scriptscriptstyle)
	*/
	isTight() {
		return this.size >= 2;
	}
};
var D = 0;
var Dc = 1;
var T = 2;
var Tc = 3;
var S = 4;
var Sc = 5;
var SS = 6;
var SSc = 7;
var styles = [
	new Style(D, 0, false),
	new Style(Dc, 0, true),
	new Style(T, 1, false),
	new Style(Tc, 1, true),
	new Style(S, 2, false),
	new Style(Sc, 2, true),
	new Style(SS, 3, false),
	new Style(SSc, 3, true)
];
var sup = [
	S,
	Sc,
	S,
	Sc,
	SS,
	SSc,
	SS,
	SSc
];
var sub = [
	Sc,
	Sc,
	Sc,
	Sc,
	SSc,
	SSc,
	SSc,
	SSc
];
var fracNum = [
	T,
	Tc,
	S,
	Sc,
	SS,
	SSc,
	SS,
	SSc
];
var fracDen = [
	Tc,
	Tc,
	Sc,
	Sc,
	SSc,
	SSc,
	SSc,
	SSc
];
var cramp = [
	Dc,
	Dc,
	Tc,
	Tc,
	Sc,
	Sc,
	SSc,
	SSc
];
var text$1 = [
	D,
	Dc,
	T,
	Tc,
	T,
	Tc,
	T,
	Tc
];
var Style$1 = {
	DISPLAY: styles[D],
	TEXT: styles[T],
	SCRIPT: styles[S],
	SCRIPTSCRIPT: styles[SS]
};
/**
* Unicode block data for the families of scripts we support in \text{}.
* Scripts only need to appear here if they do not have font metrics.
*/
var scriptData = [
	{
		name: "latin",
		blocks: [[256, 591], [768, 879]]
	},
	{
		name: "cyrillic",
		blocks: [[1024, 1279]]
	},
	{
		name: "armenian",
		blocks: [[1328, 1423]]
	},
	{
		name: "brahmic",
		blocks: [[2304, 4255]]
	},
	{
		name: "georgian",
		blocks: [[4256, 4351]]
	},
	{
		name: "cjk",
		blocks: [
			[12288, 12543],
			[19968, 40879],
			[65280, 65376]
		]
	},
	{
		name: "hangul",
		blocks: [[44032, 55215]]
	}
];
/**
* Given a codepoint, return the name of the script or script family
* it is from, or null if it is not part of a known block
*/
function scriptFromCodepoint(codepoint) {
	for (var i = 0; i < scriptData.length; i++) {
		var script = scriptData[i];
		for (var _i = 0; _i < script.blocks.length; _i++) {
			var block = script.blocks[_i];
			if (codepoint >= block[0] && codepoint <= block[1]) return script.name;
		}
	}
	return null;
}
/**
* A flattened version of all the supported blocks in a single array.
* This is an optimization to make supportedCodepoint() fast.
*/
var allBlocks = [];
scriptData.forEach((s) => s.blocks.forEach((b) => allBlocks.push(...b)));
/**
* Given a codepoint, return true if it falls within one of the
* scripts or script families defined above and false otherwise.
*
* Micro benchmarks shows that this is faster than
* /[\u3000-\u30FF\u4E00-\u9FAF\uFF00-\uFF60\uAC00-\uD7AF\u0900-\u109F]/.test()
* in Firefox, Chrome and Node.
*/
function supportedCodepoint(codepoint) {
	for (var i = 0; i < allBlocks.length; i += 2) if (codepoint >= allBlocks[i] && codepoint <= allBlocks[i + 1]) return true;
	return false;
}
/**
* This file provides support to domTree.js and delimiter.js.
* It's a storehouse of path geometry for SVG images.
*/
var hLinePad = 80;
var sqrtMain = function sqrtMain(extraVinculum, hLinePad) {
	return "M95," + (622 + extraVinculum + hLinePad) + "\nc-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14\nc0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54\nc44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10\ns173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429\nc69,-144,104.5,-217.7,106.5,-221\nl" + extraVinculum / 2.075 + " -" + extraVinculum + "\nc5.3,-9.3,12,-14,20,-14\nH400000v" + (40 + extraVinculum) + "H845.2724\ns-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7\nc-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z\nM" + (834 + extraVinculum) + " " + hLinePad + "h400000v" + (40 + extraVinculum) + "h-400000z";
};
var sqrtSize1 = function sqrtSize1(extraVinculum, hLinePad) {
	return "M263," + (601 + extraVinculum + hLinePad) + "c0.7,0,18,39.7,52,119\nc34,79.3,68.167,158.7,102.5,238c34.3,79.3,51.8,119.3,52.5,120\nc340,-704.7,510.7,-1060.3,512,-1067\nl" + extraVinculum / 2.084 + " -" + extraVinculum + "\nc4.7,-7.3,11,-11,19,-11\nH40000v" + (40 + extraVinculum) + "H1012.3\ns-271.3,567,-271.3,567c-38.7,80.7,-84,175,-136,283c-52,108,-89.167,185.3,-111.5,232\nc-22.3,46.7,-33.8,70.3,-34.5,71c-4.7,4.7,-12.3,7,-23,7s-12,-1,-12,-1\ns-109,-253,-109,-253c-72.7,-168,-109.3,-252,-110,-252c-10.7,8,-22,16.7,-34,26\nc-22,17.3,-33.3,26,-34,26s-26,-26,-26,-26s76,-59,76,-59s76,-60,76,-60z\nM" + (1001 + extraVinculum) + " " + hLinePad + "h400000v" + (40 + extraVinculum) + "h-400000z";
};
var sqrtSize2 = function sqrtSize2(extraVinculum, hLinePad) {
	return "M983 " + (10 + extraVinculum + hLinePad) + "\nl" + extraVinculum / 3.13 + " -" + extraVinculum + "\nc4,-6.7,10,-10,18,-10 H400000v" + (40 + extraVinculum) + "\nH1013.1s-83.4,268,-264.1,840c-180.7,572,-277,876.3,-289,913c-4.7,4.7,-12.7,7,-24,7\ns-12,0,-12,0c-1.3,-3.3,-3.7,-11.7,-7,-25c-35.3,-125.3,-106.7,-373.3,-214,-744\nc-10,12,-21,25,-33,39s-32,39,-32,39c-6,-5.3,-15,-14,-27,-26s25,-30,25,-30\nc26.7,-32.7,52,-63,76,-91s52,-60,52,-60s208,722,208,722\nc56,-175.3,126.3,-397.3,211,-666c84.7,-268.7,153.8,-488.2,207.5,-658.5\nc53.7,-170.3,84.5,-266.8,92.5,-289.5z\nM" + (1001 + extraVinculum) + " " + hLinePad + "h400000v" + (40 + extraVinculum) + "h-400000z";
};
var sqrtSize3 = function sqrtSize3(extraVinculum, hLinePad) {
	return "M424," + (2398 + extraVinculum + hLinePad) + "\nc-1.3,-0.7,-38.5,-172,-111.5,-514c-73,-342,-109.8,-513.3,-110.5,-514\nc0,-2,-10.7,14.3,-32,49c-4.7,7.3,-9.8,15.7,-15.5,25c-5.7,9.3,-9.8,16,-12.5,20\ns-5,7,-5,7c-4,-3.3,-8.3,-7.7,-13,-13s-13,-13,-13,-13s76,-122,76,-122s77,-121,77,-121\ns209,968,209,968c0,-2,84.7,-361.7,254,-1079c169.3,-717.3,254.7,-1077.7,256,-1081\nl" + extraVinculum / 4.223 + " -" + extraVinculum + "c4,-6.7,10,-10,18,-10 H400000\nv" + (40 + extraVinculum) + "H1014.6\ns-87.3,378.7,-272.6,1166c-185.3,787.3,-279.3,1182.3,-282,1185\nc-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2z M" + (1001 + extraVinculum) + " " + hLinePad + "\nh400000v" + (40 + extraVinculum) + "h-400000z";
};
var sqrtSize4 = function sqrtSize4(extraVinculum, hLinePad) {
	return "M473," + (2713 + extraVinculum + hLinePad) + "\nc339.3,-1799.3,509.3,-2700,510,-2702 l" + extraVinculum / 5.298 + " -" + extraVinculum + "\nc3.3,-7.3,9.3,-11,18,-11 H400000v" + (40 + extraVinculum) + "H1017.7\ns-90.5,478,-276.2,1466c-185.7,988,-279.5,1483,-281.5,1485c-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2c0,-1.3,-5.3,-32,-16,-92c-50.7,-293.3,-119.7,-693.3,-207,-1200\nc0,-1.3,-5.3,8.7,-16,30c-10.7,21.3,-21.3,42.7,-32,64s-16,33,-16,33s-26,-26,-26,-26\ns76,-153,76,-153s77,-151,77,-151c0.7,0.7,35.7,202,105,604c67.3,400.7,102,602.7,104,\n606zM" + (1001 + extraVinculum) + " " + hLinePad + "h400000v" + (40 + extraVinculum) + "H1017.7z";
};
var phasePath = function phasePath(y) {
	var x = y / 2;
	return "M400000 " + y + " H0 L" + x + " 0 l65 45 L145 " + (y - 80) + " H400000z";
};
var sqrtTall = function sqrtTall(extraVinculum, hLinePad, viewBoxHeight) {
	var vertSegment = viewBoxHeight - 54 - hLinePad - extraVinculum;
	return "M702 " + (extraVinculum + hLinePad) + "H400000" + (40 + extraVinculum) + "\nH742v" + vertSegment + "l-4 4-4 4c-.667.7 -2 1.5-4 2.5s-4.167 1.833-6.5 2.5-5.5 1-9.5 1\nh-12l-28-84c-16.667-52-96.667 -294.333-240-727l-212 -643 -85 170\nc-4-3.333-8.333-7.667-13 -13l-13-13l77-155 77-156c66 199.333 139 419.667\n219 661 l218 661zM702 " + hLinePad + "H400000v" + (40 + extraVinculum) + "H742z";
};
var sqrtPath = function sqrtPath(size, extraVinculum, viewBoxHeight) {
	extraVinculum = 1e3 * extraVinculum;
	var path = "";
	switch (size) {
		case "sqrtMain":
			path = sqrtMain(extraVinculum, hLinePad);
			break;
		case "sqrtSize1":
			path = sqrtSize1(extraVinculum, hLinePad);
			break;
		case "sqrtSize2":
			path = sqrtSize2(extraVinculum, hLinePad);
			break;
		case "sqrtSize3":
			path = sqrtSize3(extraVinculum, hLinePad);
			break;
		case "sqrtSize4":
			path = sqrtSize4(extraVinculum, hLinePad);
			break;
		case "sqrtTall": path = sqrtTall(extraVinculum, hLinePad, viewBoxHeight);
	}
	return path;
};
var innerPath = function innerPath(name, height) {
	switch (name) {
		case "⎜": return "M291 0 H417 V" + height + " H291z M291 0 H417 V" + height + " H291z";
		case "∣": return "M145 0 H188 V" + height + " H145z M145 0 H188 V" + height + " H145z";
		case "∥": return "M145 0 H188 V" + height + " H145z M145 0 H188 V" + height + " H145z" + ("M367 0 H410 V" + height + " H367z M367 0 H410 V" + height + " H367z");
		case "⎟": return "M457 0 H583 V" + height + " H457z M457 0 H583 V" + height + " H457z";
		case "⎢": return "M319 0 H403 V" + height + " H319z M319 0 H403 V" + height + " H319z";
		case "⎥": return "M263 0 H347 V" + height + " H263z M263 0 H347 V" + height + " H263z";
		case "⎪": return "M384 0 H504 V" + height + " H384z M384 0 H504 V" + height + " H384z";
		case "⏐": return "M312 0 H355 V" + height + " H312z M312 0 H355 V" + height + " H312z";
		case "‖": return "M257 0 H300 V" + height + " H257z M257 0 H300 V" + height + " H257z" + ("M478 0 H521 V" + height + " H478z M478 0 H521 V" + height + " H478z");
		default: return "";
	}
};
var path = {
	doubleleftarrow: "M262 157\nl10-10c34-36 62.7-77 86-123 3.3-8 5-13.3 5-16 0-5.3-6.7-8-20-8-7.3\n 0-12.2.5-14.5 1.5-2.3 1-4.8 4.5-7.5 10.5-49.3 97.3-121.7 169.3-217 216-28\n 14-57.3 25-88 33-6.7 2-11 3.8-13 5.5-2 1.7-3 4.2-3 7.5s1 5.8 3 7.5\nc2 1.7 6.3 3.5 13 5.5 68 17.3 128.2 47.8 180.5 91.5 52.3 43.7 93.8 96.2 124.5\n 157.5 9.3 8 15.3 12.3 18 13h6c12-.7 18-4 18-10 0-2-1.7-7-5-15-23.3-46-52-87\n-86-123l-10-10h399738v-40H218c328 0 0 0 0 0l-10-8c-26.7-20-65.7-43-117-69 2.7\n-2 6-3.7 10-5 36.7-16 72.3-37.3 107-64l10-8h399782v-40z\nm8 0v40h399730v-40zm0 194v40h399730v-40z",
	doublerightarrow: "M399738 392l\n-10 10c-34 36-62.7 77-86 123-3.3 8-5 13.3-5 16 0 5.3 6.7 8 20 8 7.3 0 12.2-.5\n 14.5-1.5 2.3-1 4.8-4.5 7.5-10.5 49.3-97.3 121.7-169.3 217-216 28-14 57.3-25 88\n-33 6.7-2 11-3.8 13-5.5 2-1.7 3-4.2 3-7.5s-1-5.8-3-7.5c-2-1.7-6.3-3.5-13-5.5-68\n-17.3-128.2-47.8-180.5-91.5-52.3-43.7-93.8-96.2-124.5-157.5-9.3-8-15.3-12.3-18\n-13h-6c-12 .7-18 4-18 10 0 2 1.7 7 5 15 23.3 46 52 87 86 123l10 10H0v40h399782\nc-328 0 0 0 0 0l10 8c26.7 20 65.7 43 117 69-2.7 2-6 3.7-10 5-36.7 16-72.3 37.3\n-107 64l-10 8H0v40zM0 157v40h399730v-40zm0 194v40h399730v-40z",
	leftarrow: "M400000 241H110l3-3c68.7-52.7 113.7-120\n 135-202 4-14.7 6-23 6-25 0-7.3-7-11-21-11-8 0-13.2.8-15.5 2.5-2.3 1.7-4.2 5.8\n-5.5 12.5-1.3 4.7-2.7 10.3-4 17-12 48.7-34.8 92-68.5 130S65.3 228.3 18 247\nc-10 4-16 7.7-18 11 0 8.7 6 14.3 18 17 47.3 18.7 87.8 47 121.5 85S196 441.3 208\n 490c.7 2 1.3 5 2 9s1.2 6.7 1.5 8c.3 1.3 1 3.3 2 6s2.2 4.5 3.5 5.5c1.3 1 3.3\n 1.8 6 2.5s6 1 10 1c14 0 21-3.7 21-11 0-2-2-10.3-6-25-20-79.3-65-146.7-135-202\n l-3-3h399890zM100 241v40h399900v-40z",
	leftbrace: "M6 548l-6-6v-35l6-11c56-104 135.3-181.3 238-232 57.3-28.7 117\n-45 179-50h399577v120H403c-43.3 7-81 15-113 26-100.7 33-179.7 91-237 174-2.7\n 5-6 9-10 13-.7 1-7.3 1-20 1H6z",
	leftbraceunder: "M0 6l6-6h17c12.688 0 19.313.3 20 1 4 4 7.313 8.3 10 13\n 35.313 51.3 80.813 93.8 136.5 127.5 55.688 33.7 117.188 55.8 184.5 66.5.688\n 0 2 .3 4 1 18.688 2.7 76 4.3 172 5h399450v120H429l-6-1c-124.688-8-235-61.7\n-331-161C60.687 138.7 32.312 99.3 7 54L0 41V6z",
	leftgroup: "M400000 80\nH435C64 80 168.3 229.4 21 260c-5.9 1.2-18 0-18 0-2 0-3-1-3-3v-38C76 61 257 0\n 435 0h399565z",
	leftgroupunder: "M400000 262\nH435C64 262 168.3 112.6 21 82c-5.9-1.2-18 0-18 0-2 0-3 1-3 3v38c76 158 257 219\n 435 219h399565z",
	leftharpoon: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3\n-3.3 10.2-9.5 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5\n-18.3 3-21-1.3-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7\n-196 228-6.7 4.7-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40z",
	leftharpoonplus: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3-3.3 10.2-9.5\n 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5-18.3 3-21-1.3\n-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7-196 228-6.7 4.7\n-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40zM0 435v40h400000v-40z\nm0 0v40h400000v-40z",
	leftharpoondown: "M7 241c-4 4-6.333 8.667-7 14 0 5.333.667 9 2 11s5.333\n 5.333 12 10c90.667 54 156 130 196 228 3.333 10.667 6.333 16.333 9 17 2 .667 5\n 1 9 1h5c10.667 0 16.667-2 18-6 2-2.667 1-9.667-3-21-32-87.333-82.667-157.667\n-152-211l-3-3h399907v-40zM93 281 H400000 v-40L7 241z",
	leftharpoondownplus: "M7 435c-4 4-6.3 8.7-7 14 0 5.3.7 9 2 11s5.3 5.3 12\n 10c90.7 54 156 130 196 228 3.3 10.7 6.3 16.3 9 17 2 .7 5 1 9 1h5c10.7 0 16.7\n-2 18-6 2-2.7 1-9.7-3-21-32-87.3-82.7-157.7-152-211l-3-3h399907v-40H7zm93 0\nv40h399900v-40zM0 241v40h399900v-40zm0 0v40h399900v-40z",
	lefthook: "M400000 281 H103s-33-11.2-61-33.5S0 197.3 0 164s14.2-61.2 42.5\n-83.5C70.8 58.2 104 47 142 47 c16.7 0 25 6.7 25 20 0 12-8.7 18.7-26 20-40 3.3\n-68.7 15.7-86 37-10 12-15 25.3-15 40 0 22.7 9.8 40.7 29.5 54 19.7 13.3 43.5 21\n 71.5 23h399859zM103 281v-40h399897v40z",
	leftlinesegment: "M40 281 V428 H0 V94 H40 V241 H400000 v40z\nM40 281 V428 H0 V94 H40 V241 H400000 v40z",
	leftbracketunder: "M0 0 h120 V290 H399995 v120 H0z\nM0 0 h120 V290 H399995 v120 H0z",
	leftbracketover: "M0 440 h120 V150 H399995 v-120 H0z\nM0 440 h120 V150 H399995 v-120 H0z",
	leftmapsto: "M40 281 V448H0V74H40V241H400000v40z\nM40 281 V448H0V74H40V241H400000v40z",
	leftToFrom: "M0 147h400000v40H0zm0 214c68 40 115.7 95.7 143 167h22c15.3 0 23\n-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69-70-101l-7-8h399905v-40H95l7-8\nc28.7-32 52-65.7 70-101 10.7-23.3 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 265.3\n 68 321 0 361zm0-174v-40h399900v40zm100 154v40h399900v-40z",
	longequal: "M0 50 h400000 v40H0z m0 194h40000v40H0z\nM0 50 h400000 v40H0z m0 194h40000v40H0z",
	midbrace: "M200428 334\nc-100.7-8.3-195.3-44-280-108-55.3-42-101.7-93-139-153l-9-14c-2.7 4-5.7 8.7-9 14\n-53.3 86.7-123.7 153-211 199-66.7 36-137.3 56.3-212 62H0V214h199568c178.3-11.7\n 311.7-78.3 403-201 6-8 9.7-12 11-12 .7-.7 6.7-1 18-1s17.3.3 18 1c1.3 0 5 4 11\n 12 44.7 59.3 101.3 106.3 170 141s145.3 54.3 229 60h199572v120z",
	midbraceunder: "M199572 214\nc100.7 8.3 195.3 44 280 108 55.3 42 101.7 93 139 153l9 14c2.7-4 5.7-8.7 9-14\n 53.3-86.7 123.7-153 211-199 66.7-36 137.3-56.3 212-62h199568v120H200432c-178.3\n 11.7-311.7 78.3-403 201-6 8-9.7 12-11 12-.7.7-6.7 1-18 1s-17.3-.3-18-1c-1.3 0\n-5-4-11-12-44.7-59.3-101.3-106.3-170-141s-145.3-54.3-229-60H0V214z",
	oiintSize1: "M512.6 71.6c272.6 0 320.3 106.8 320.3 178.2 0 70.8-47.7 177.6\n-320.3 177.6S193.1 320.6 193.1 249.8c0-71.4 46.9-178.2 319.5-178.2z\nm368.1 178.2c0-86.4-60.9-215.4-368.1-215.4-306.4 0-367.3 129-367.3 215.4 0 85.8\n60.9 214.8 367.3 214.8 307.2 0 368.1-129 368.1-214.8z",
	oiintSize2: "M757.8 100.1c384.7 0 451.1 137.6 451.1 230 0 91.3-66.4 228.8\n-451.1 228.8-386.3 0-452.7-137.5-452.7-228.8 0-92.4 66.4-230 452.7-230z\nm502.4 230c0-111.2-82.4-277.2-502.4-277.2s-504 166-504 277.2\nc0 110 84 276 504 276s502.4-166 502.4-276z",
	oiiintSize1: "M681.4 71.6c408.9 0 480.5 106.8 480.5 178.2 0 70.8-71.6 177.6\n-480.5 177.6S202.1 320.6 202.1 249.8c0-71.4 70.5-178.2 479.3-178.2z\nm525.8 178.2c0-86.4-86.8-215.4-525.7-215.4-437.9 0-524.7 129-524.7 215.4 0\n85.8 86.8 214.8 524.7 214.8 438.9 0 525.7-129 525.7-214.8z",
	oiiintSize2: "M1021.2 53c603.6 0 707.8 165.8 707.8 277.2 0 110-104.2 275.8\n-707.8 275.8-606 0-710.2-165.8-710.2-275.8C311 218.8 415.2 53 1021.2 53z\nm770.4 277.1c0-131.2-126.4-327.6-770.5-327.6S248.4 198.9 248.4 330.1\nc0 130 128.8 326.4 772.7 326.4s770.5-196.4 770.5-326.4z",
	rightarrow: "M0 241v40h399891c-47.3 35.3-84 78-110 128\n-16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20\n 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7\n 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85\n-40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n 151.7 139 205zm0 0v40h399900v-40z",
	rightbrace: "M400000 542l\n-6 6h-17c-12.7 0-19.3-.3-20-1-4-4-7.3-8.3-10-13-35.3-51.3-80.8-93.8-136.5-127.5\ns-117.2-55.8-184.5-66.5c-.7 0-2-.3-4-1-18.7-2.7-76-4.3-172-5H0V214h399571l6 1\nc124.7 8 235 61.7 331 161 31.3 33.3 59.7 72.7 85 118l7 13v35z",
	rightbraceunder: "M399994 0l6 6v35l-6 11c-56 104-135.3 181.3-238 232-57.3\n 28.7-117 45-179 50H-300V214h399897c43.3-7 81-15 113-26 100.7-33 179.7-91 237\n-174 2.7-5 6-9 10-13 .7-1 7.3-1 20-1h17z",
	rightgroup: "M0 80h399565c371 0 266.7 149.4 414 180 5.9 1.2 18 0 18 0 2 0\n 3-1 3-3v-38c-76-158-257-219-435-219H0z",
	rightgroupunder: "M0 262h399565c371 0 266.7-149.4 414-180 5.9-1.2 18 0 18\n 0 2 0 3 1 3 3v38c-76 158-257 219-435 219H0z",
	rightharpoon: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3\n-3.7-15.3-11-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2\n-10.7 0-16.7 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58\n 69.2 92 94.5zm0 0v40h399900v-40z",
	rightharpoonplus: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3-3.7-15.3-11\n-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2-10.7 0-16.7\n 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58 69.2 92 94.5z\nm0 0v40h399900v-40z m100 194v40h399900v-40zm0 0v40h399900v-40z",
	rightharpoondown: "M399747 511c0 7.3 6.7 11 20 11 8 0 13-.8 15-2.5s4.7-6.8\n 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3 8.5-5.8 9.5\n-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3-64.7 57-92 95\n-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 241v40h399900v-40z",
	rightharpoondownplus: "M399747 705c0 7.3 6.7 11 20 11 8 0 13-.8\n 15-2.5s4.7-6.8 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3\n 8.5-5.8 9.5-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3\n-64.7 57-92 95-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 435v40h399900v-40z\nm0-194v40h400000v-40zm0 0v40h400000v-40z",
	righthook: "M399859 241c-764 0 0 0 0 0 40-3.3 68.7-15.7 86-37 10-12 15-25.3\n 15-40 0-22.7-9.8-40.7-29.5-54-19.7-13.3-43.5-21-71.5-23-17.3-1.3-26-8-26-20 0\n-13.3 8.7-20 26-20 38 0 71 11.2 99 33.5 0 0 7 5.6 21 16.7 14 11.2 21 33.5 21\n 66.8s-14 61.2-42 83.5c-28 22.3-61 33.5-99 33.5L0 241z M0 281v-40h399859v40z",
	rightlinesegment: "M399960 241 V94 h40 V428 h-40 V281 H0 v-40z\nM399960 241 V94 h40 V428 h-40 V281 H0 v-40z",
	rightbracketunder: "M399995 0 h-120 V290 H0 v120 H400000z\nM399995 0 h-120 V290 H0 v120 H400000z",
	rightbracketover: "M399995 440 h-120 V150 H0 v-120 H399995z\nM399995 440 h-120 V150 H0 v-120 H399995z",
	rightToFrom: "M400000 167c-70.7-42-118-97.7-142-167h-23c-15.3 0-23 .3-23\n 1 0 1.3 5.3 13.7 16 37 18 35.3 41.3 69 70 101l7 8H0v40h399905l-7 8c-28.7 32\n-52 65.7-70 101-10.7 23.3-16 35.7-16 37 0 .7 7.7 1 23 1h23c24-69.3 71.3-125 142\n-167z M100 147v40h399900v-40zM0 341v40h399900v-40z",
	twoheadleftarrow: "M0 167c68 40\n 115.7 95.7 143 167h22c15.3 0 23-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69\n-70-101l-7-8h125l9 7c50.7 39.3 85 86 103 140h46c0-4.7-6.3-18.7-19-42-18-35.3\n-40-67.3-66-96l-9-9h399716v-40H284l9-9c26-28.7 48-60.7 66-96 12.7-23.333 19\n-37.333 19-42h-46c-18 54-52.3 100.7-103 140l-9 7H95l7-8c28.7-32 52-65.7 70-101\n 10.7-23.333 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 71.3 68 127 0 167z",
	twoheadrightarrow: "M400000 167\nc-68-40-115.7-95.7-143-167h-22c-15.3 0-23 .3-23 1 0 1.3 5.3 13.7 16 37 18 35.3\n 41.3 69 70 101l7 8h-125l-9-7c-50.7-39.3-85-86-103-140h-46c0 4.7 6.3 18.7 19 42\n 18 35.3 40 67.3 66 96l9 9H0v40h399716l-9 9c-26 28.7-48 60.7-66 96-12.7 23.333\n-19 37.333-19 42h46c18-54 52.3-100.7 103-140l9-7h125l-7 8c-28.7 32-52 65.7-70\n 101-10.7 23.333-16 35.7-16 37 0 .7 7.7 1 23 1h22c27.3-71.3 75-127 143-167z",
	tilde1: "M200 55.538c-77 0-168 73.953-177 73.953-3 0-7\n-2.175-9-5.437L2 97c-1-2-2-4-2-6 0-4 2-7 5-9l20-12C116 12 171 0 207 0c86 0\n 114 68 191 68 78 0 168-68 177-68 4 0 7 2 9 5l12 19c1 2.175 2 4.35 2 6.525 0\n 4.35-2 7.613-5 9.788l-19 13.05c-92 63.077-116.937 75.308-183 76.128\n-68.267.847-113-73.952-191-73.952z",
	tilde2: "M344 55.266c-142 0-300.638 81.316-311.5 86.418\n-8.01 3.762-22.5 10.91-23.5 5.562L1 120c-1-2-1-3-1-4 0-5 3-9 8-10l18.4-9C160.9\n 31.9 283 0 358 0c148 0 188 122 331 122s314-97 326-97c4 0 8 2 10 7l7 21.114\nc1 2.14 1 3.21 1 4.28 0 5.347-3 9.626-7 10.696l-22.3 12.622C852.6 158.372 751\n 181.476 676 181.476c-149 0-189-126.21-332-126.21z",
	tilde3: "M786 59C457 59 32 175.242 13 175.242c-6 0-10-3.457\n-11-10.37L.15 138c-1-7 3-12 10-13l19.2-6.4C378.4 40.7 634.3 0 804.3 0c337 0\n 411.8 157 746.8 157 328 0 754-112 773-112 5 0 10 3 11 9l1 14.075c1 8.066-.697\n 16.595-6.697 17.492l-21.052 7.31c-367.9 98.146-609.15 122.696-778.15 122.696\n -338 0-409-156.573-744-156.573z",
	tilde4: "M786 58C457 58 32 177.487 13 177.487c-6 0-10-3.345\n-11-10.035L.15 143c-1-7 3-12 10-13l22-6.7C381.2 35 637.15 0 807.15 0c337 0 409\n 177 744 177 328 0 754-127 773-127 5 0 10 3 11 9l1 14.794c1 7.805-3 13.38-9\n 14.495l-20.7 5.574c-366.85 99.79-607.3 139.372-776.3 139.372-338 0-409\n -175.236-744-175.236z",
	vec: "M377 20c0-5.333 1.833-10 5.5-14S391 0 397 0c4.667 0 8.667 1.667 12 5\n3.333 2.667 6.667 9 10 19 6.667 24.667 20.333 43.667 41 57 7.333 4.667 11\n10.667 11 18 0 6-1 10-3 12s-6.667 5-14 9c-28.667 14.667-53.667 35.667-75 63\n-1.333 1.333-3.167 3.5-5.5 6.5s-4 4.833-5 5.5c-1 .667-2.5 1.333-4.5 2s-4.333 1\n-7 1c-4.667 0-9.167-1.833-13.5-5.5S337 184 337 178c0-12.667 15.667-32.333 47-59\nH213l-171-1c-8.667-6-13-12.333-13-19 0-4.667 4.333-11.333 13-20h359\nc-16-25.333-24-45-24-59z",
	widehat1: "M529 0h5l519 115c5 1 9 5 9 10 0 1-1 2-1 3l-4 22\nc-1 5-5 9-11 9h-2L532 67 19 159h-2c-5 0-9-4-11-9l-5-22c-1-6 2-12 8-13z",
	widehat2: "M1181 0h2l1171 176c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 220h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
	widehat3: "M1181 0h2l1171 236c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 280h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
	widehat4: "M1181 0h2l1171 296c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 340h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
	widecheck1: "M529,159h5l519,-115c5,-1,9,-5,9,-10c0,-1,-1,-2,-1,-3l-4,-22c-1,\n-5,-5,-9,-11,-9h-2l-512,92l-513,-92h-2c-5,0,-9,4,-11,9l-5,22c-1,6,2,12,8,13z",
	widecheck2: "M1181,220h2l1171,-176c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,153l-1167,-153h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
	widecheck3: "M1181,280h2l1171,-236c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,213l-1167,-213h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
	widecheck4: "M1181,340h2l1171,-296c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,273l-1167,-273h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
	baraboveleftarrow: "M400000 620h-399890l3 -3c68.7 -52.7 113.7 -120 135 -202\nc4 -14.7 6 -23 6 -25c0 -7.3 -7 -11 -21 -11c-8 0 -13.2 0.8 -15.5 2.5\nc-2.3 1.7 -4.2 5.8 -5.5 12.5c-1.3 4.7 -2.7 10.3 -4 17c-12 48.7 -34.8 92 -68.5 130\ns-74.2 66.3 -121.5 85c-10 4 -16 7.7 -18 11c0 8.7 6 14.3 18 17c47.3 18.7 87.8 47\n121.5 85s56.5 81.3 68.5 130c0.7 2 1.3 5 2 9s1.2 6.7 1.5 8c0.3 1.3 1 3.3 2 6\ns2.2 4.5 3.5 5.5c1.3 1 3.3 1.8 6 2.5s6 1 10 1c14 0 21 -3.7 21 -11\nc0 -2 -2 -10.3 -6 -25c-20 -79.3 -65 -146.7 -135 -202l-3 -3h399890z\nM100 620v40h399900v-40z M0 241v40h399900v-40zM0 241v40h399900v-40z",
	rightarrowabovebar: "M0 241v40h399891c-47.3 35.3-84 78-110 128-16.7 32\n-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0\n13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39\n-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85-40.5\n-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n151.7 139 205zm96 379h399894v40H0zm0 0h399904v40H0z",
	baraboveshortleftharpoon: "M507,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17\nc2,0.7,5,1,9,1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21\nc-32,-87.3,-82.7,-157.7,-152,-211c0,0,-3,-3,-3,-3l399351,0l0,-40\nc-398570,0,-399437,0,-399437,0z M593 435 v40 H399500 v-40z\nM0 281 v-40 H399908 v40z M0 281 v-40 H399908 v40z",
	rightharpoonaboveshortbar: "M0,241 l0,40c399126,0,399993,0,399993,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM0 241 v40 H399908 v-40z M0 475 v-40 H399500 v40z M0 475 v-40 H399500 v40z",
	shortbaraboveleftharpoon: "M7,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17c2,0.7,5,1,9,\n1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21c-32,-87.3,-82.7,-157.7,\n-152,-211c0,0,-3,-3,-3,-3l399907,0l0,-40c-399126,0,-399993,0,-399993,0z\nM93 435 v40 H400000 v-40z M500 241 v40 H400000 v-40z M500 241 v40 H400000 v-40z",
	shortrightharpoonabovebar: "M53,241l0,40c398570,0,399437,0,399437,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM500 241 v40 H399408 v-40z M500 435 v40 H400000 v-40z"
};
var tallDelim = function tallDelim(label, midHeight) {
	switch (label) {
		case "lbrack": return "M403 1759 V84 H666 V0 H319 V1759 v" + midHeight + " v1759 h347 v-84\nH403z M403 1759 V0 H319 V1759 v" + midHeight + " v1759 h84z";
		case "rbrack": return "M347 1759 V0 H0 V84 H263 V1759 v" + midHeight + " v1759 H0 v84 H347z\nM347 1759 V0 H263 V1759 v" + midHeight + " v1759 h84z";
		case "vert": return "M145 15 v585 v" + midHeight + " v585 c2.667,10,9.667,15,21,15\nc10,0,16.667,-5,20,-15 v-585 v" + -midHeight + " v-585 c-2.667,-10,-9.667,-15,-21,-15\nc-10,0,-16.667,5,-20,15z M188 15 H145 v585 v" + midHeight + " v585 h43z";
		case "doublevert": return "M145 15 v585 v" + midHeight + " v585 c2.667,10,9.667,15,21,15\nc10,0,16.667,-5,20,-15 v-585 v" + -midHeight + " v-585 c-2.667,-10,-9.667,-15,-21,-15\nc-10,0,-16.667,5,-20,15z M188 15 H145 v585 v" + midHeight + " v585 h43z\nM367 15 v585 v" + midHeight + " v585 c2.667,10,9.667,15,21,15\nc10,0,16.667,-5,20,-15 v-585 v" + -midHeight + " v-585 c-2.667,-10,-9.667,-15,-21,-15\nc-10,0,-16.667,5,-20,15z M410 15 H367 v585 v" + midHeight + " v585 h43z";
		case "lfloor": return "M319 602 V0 H403 V602 v" + midHeight + " v1715 h263 v84 H319z\nMM319 602 V0 H403 V602 v" + midHeight + " v1715 H319z";
		case "rfloor": return "M319 602 V0 H403 V602 v" + midHeight + " v1799 H0 v-84 H319z\nMM319 602 V0 H403 V602 v" + midHeight + " v1715 H319z";
		case "lceil": return "M403 1759 V84 H666 V0 H319 V1759 v" + midHeight + " v602 h84z\nM403 1759 V0 H319 V1759 v" + midHeight + " v602 h84z";
		case "rceil": return "M347 1759 V0 H0 V84 H263 V1759 v" + midHeight + " v602 h84z\nM347 1759 V0 h-84 V1759 v" + midHeight + " v602 h84z";
		case "lparen": return "M863,9c0,-2,-2,-5,-6,-9c0,0,-17,0,-17,0c-12.7,0,-19.3,0.3,-20,1\nc-5.3,5.3,-10.3,11,-15,17c-242.7,294.7,-395.3,682,-458,1162c-21.3,163.3,-33.3,349,\n-36,557 l0," + (midHeight + 84) + "c0.2,6,0,26,0,60c2,159.3,10,310.7,24,454c53.3,528,210,\n949.7,470,1265c4.7,6,9.7,11.7,15,17c0.7,0.7,7,1,19,1c0,0,18,0,18,0c4,-4,6,-7,6,-9\nc0,-2.7,-3.3,-8.7,-10,-18c-135.3,-192.7,-235.5,-414.3,-300.5,-665c-65,-250.7,-102.5,\n-544.7,-112.5,-882c-2,-104,-3,-167,-3,-189\nl0,-" + (midHeight + 92) + "c0,-162.7,5.7,-314,17,-454c20.7,-272,63.7,-513,129,-723c65.3,\n-210,155.3,-396.3,270,-559c6.7,-9.3,10,-15.3,10,-18z";
		case "rparen": return "M76,0c-16.7,0,-25,3,-25,9c0,2,2,6.3,6,13c21.3,28.7,42.3,60.3,\n63,95c96.7,156.7,172.8,332.5,228.5,527.5c55.7,195,92.8,416.5,111.5,664.5\nc11.3,139.3,17,290.7,17,454c0,28,1.7,43,3.3,45l0," + (midHeight + 9) + "\nc-3,4,-3.3,16.7,-3.3,38c0,162,-5.7,313.7,-17,455c-18.7,248,-55.8,469.3,-111.5,664\nc-55.7,194.7,-131.8,370.3,-228.5,527c-20.7,34.7,-41.7,66.3,-63,95c-2,3.3,-4,7,-6,11\nc0,7.3,5.7,11,17,11c0,0,11,0,11,0c9.3,0,14.3,-0.3,15,-1c5.3,-5.3,10.3,-11,15,-17\nc242.7,-294.7,395.3,-681.7,458,-1161c21.3,-164.7,33.3,-350.7,36,-558\nl0,-" + (midHeight + 144) + "c-2,-159.3,-10,-310.7,-24,-454c-53.3,-528,-210,-949.7,\n-470,-1265c-4.7,-6,-9.7,-11.7,-15,-17c-0.7,-0.7,-6.7,-1,-18,-1z";
		default: throw new Error("Unknown stretchy delimiter.");
	}
};
/**
* This node represents a document fragment, which contains elements, but when
* placed into the DOM doesn't have any representation itself. It only contains
* children and doesn't have any DOM node properties.
*/
var DocumentFragment = class {
	constructor(children) {
		this.children = children;
		this.classes = [];
		this.height = 0;
		this.depth = 0;
		this.maxFontSize = 0;
		this.style = {};
	}
	hasClass(className) {
		return this.classes.includes(className);
	}
	/** Convert the fragment into a node. */
	toNode() {
		var frag = document.createDocumentFragment();
		for (var i = 0; i < this.children.length; i++) frag.appendChild(this.children[i].toNode());
		return frag;
	}
	/** Convert the fragment into HTML markup. */
	toMarkup() {
		var markup = "";
		for (var i = 0; i < this.children.length; i++) markup += this.children[i].toMarkup();
		return markup;
	}
	/**
	* Converts the math node into a string, similar to innerText. Applies to
	* MathDomNode's only.
	*/
	toText() {
		var toText = (child) => child.toText();
		return this.children.map(toText).join("");
	}
};
/**
* This file does conversion between units.  In particular, it provides
* calculateSize to convert other units into ems.
*/
var ptPerUnit = {
	"pt": 1,
	"mm": 7227 / 2540,
	"cm": 7227 / 254,
	"in": 72.27,
	"bp": 803 / 800,
	"pc": 12,
	"dd": 1238 / 1157,
	"cc": 14856 / 1157,
	"nd": 685 / 642,
	"nc": 1370 / 107,
	"sp": 1 / 65536,
	"px": 803 / 800
};
var relativeUnit = {
	"ex": true,
	"em": true,
	"mu": true
};
/**
* Determine whether the specified unit (either a string defining the unit
* or a "size" parse node containing a unit field) is valid.
*/
var validUnit = function validUnit(unit) {
	if (typeof unit !== "string") unit = unit.unit;
	return unit in ptPerUnit || unit in relativeUnit || unit === "ex";
};
var calculateSize = function calculateSize(sizeValue, options) {
	var scale;
	if (sizeValue.unit in ptPerUnit) scale = ptPerUnit[sizeValue.unit] / options.fontMetrics().ptPerEm / options.sizeMultiplier;
	else if (sizeValue.unit === "mu") scale = options.fontMetrics().cssEmPerMu;
	else {
		var unitOptions;
		if (options.style.isTight()) unitOptions = options.havingStyle(options.style.text());
		else unitOptions = options;
		if (sizeValue.unit === "ex") scale = unitOptions.fontMetrics().xHeight;
		else if (sizeValue.unit === "em") scale = unitOptions.fontMetrics().quad;
		else throw new ParseError("Invalid unit: '" + sizeValue.unit + "'");
		if (unitOptions !== options) scale *= unitOptions.sizeMultiplier / options.sizeMultiplier;
	}
	return Math.min(sizeValue.number * scale, options.maxSize);
};
/**
* Round `n` to 4 decimal places, or to the nearest 1/10,000th em. See
* https://github.com/KaTeX/KaTeX/pull/2460.
*/
var makeEm = function makeEm(n) {
	return +n.toFixed(4) + "em";
};
/**
* These objects store the data about the DOM nodes we create, as well as some
* extra data. They can then be transformed into real DOM nodes with the
* `toNode` function or HTML markup using `toMarkup`. They are useful for both
* storing extra properties on the nodes, as well as providing a way to easily
* work with the DOM.
*
* Similar functions for working with MathML nodes exist in mathMLTree.js.
*
* TODO: refactor `span` and `anchor` into common superclass when
* target environments support class inheritance
*/
/**
* Create an HTML className based on a list of classes. In addition to joining
* with spaces, we also remove empty classes.
*/
var createClass = function createClass(classes) {
	return classes.filter((cls) => cls).join(" ");
};
var initNode = function initNode(classes, options, style) {
	this.classes = classes || [];
	this.attributes = {};
	this.height = 0;
	this.depth = 0;
	this.maxFontSize = 0;
	this.style = style || {};
	if (options) {
		if (options.style.isTight()) this.classes.push("mtight");
		var color = options.getColor();
		if (color) this.style.color = color;
	}
};
/**
* Convert into an HTML node
*/
var toNode = function toNode(tagName) {
	var node = document.createElement(tagName);
	node.className = createClass(this.classes);
	for (var key of Object.keys(this.style)) node.style[key] = this.style[key];
	for (var attr of Object.keys(this.attributes)) node.setAttribute(attr, this.attributes[attr]);
	for (var i = 0; i < this.children.length; i++) node.appendChild(this.children[i].toNode());
	return node;
};
/**
* https://w3c.github.io/html-reference/syntax.html#syntax-attributes
*
* > Attribute Names must consist of one or more characters
* other than the space characters, U+0000 NULL,
* '"', "'", ">", "/", "=", the control characters,
* and any characters that are not defined by Unicode.
*/
var invalidAttributeNameRegex = /[\s"'>/=\x00-\x1f]/;
/**
* Convert into an HTML markup string
*/
var toMarkup = function toMarkup(tagName) {
	var markup = "<" + tagName;
	if (this.classes.length) markup += " class=\"" + escape$1(createClass(this.classes)) + "\"";
	var styles = "";
	for (var key of Object.keys(this.style)) styles += hyphenate(key) + ":" + this.style[key] + ";";
	if (styles) markup += " style=\"" + escape$1(styles) + "\"";
	for (var attr of Object.keys(this.attributes)) {
		if (invalidAttributeNameRegex.test(attr)) throw new ParseError("Invalid attribute name '" + attr + "'");
		markup += " " + attr + "=\"" + escape$1(this.attributes[attr]) + "\"";
	}
	markup += ">";
	for (var i = 0; i < this.children.length; i++) markup += this.children[i].toMarkup();
	markup += "</" + tagName + ">";
	return markup;
};
/**
* This node represents a span node, with a className, a list of children, and
* an inline style. It also contains information about its height, depth, and
* maxFontSize.
*
* Represents two types with different uses: SvgSpan to wrap an SVG and DomSpan
* otherwise. This typesafety is important when HTML builders access a span's
* children.
*/
var Span = class {
	constructor(classes, children, options, style) {
		initNode.call(this, classes, options, style);
		this.children = children || [];
	}
	/**
	* Sets an arbitrary attribute on the span. Warning: use this wisely. Not
	* all browsers support attributes the same, and having too many custom
	* attributes is probably bad.
	*/
	setAttribute(attribute, value) {
		this.attributes[attribute] = value;
	}
	hasClass(className) {
		return this.classes.includes(className);
	}
	toNode() {
		return toNode.call(this, "span");
	}
	toMarkup() {
		return toMarkup.call(this, "span");
	}
};
/**
* This node represents an anchor (<a>) element with a hyperlink.  See `span`
* for further details.
*/
var Anchor = class {
	constructor(href, classes, children, options) {
		initNode.call(this, classes, options);
		this.children = children || [];
		this.setAttribute("href", href);
	}
	setAttribute(attribute, value) {
		this.attributes[attribute] = value;
	}
	hasClass(className) {
		return this.classes.includes(className);
	}
	toNode() {
		return toNode.call(this, "a");
	}
	toMarkup() {
		return toMarkup.call(this, "a");
	}
};
/**
* This node represents an image embed (<img>) element.
*/
var Img = class {
	constructor(src, alt, style) {
		this.alt = alt;
		this.src = src;
		this.classes = ["mord"];
		this.height = 0;
		this.depth = 0;
		this.maxFontSize = 0;
		this.style = style;
	}
	hasClass(className) {
		return this.classes.includes(className);
	}
	toNode() {
		var node = document.createElement("img");
		node.src = this.src;
		node.alt = this.alt;
		node.className = "mord";
		for (var key of Object.keys(this.style)) node.style[key] = this.style[key];
		return node;
	}
	toMarkup() {
		var markup = "<img src=\"" + escape$1(this.src) + "\"" + (" alt=\"" + escape$1(this.alt) + "\"");
		var styles = "";
		for (var key of Object.keys(this.style)) styles += hyphenate(key) + ":" + this.style[key] + ";";
		if (styles) markup += " style=\"" + escape$1(styles) + "\"";
		markup += "'/>";
		return markup;
	}
};
var iCombinations = {
	"î": "ı̂",
	"ï": "ı̈",
	"í": "ı́",
	"ì": "ı̀"
};
/**
* A symbol node contains information about a single symbol. It either renders
* to a single text node, or a span with a single text node in it, depending on
* whether it has CSS classes, styles, or needs italic correction.
*/
var SymbolNode = class {
	constructor(text, height, depth, italic, skew, width, classes, style) {
		this.text = text;
		this.height = height || 0;
		this.depth = depth || 0;
		this.italic = italic || 0;
		this.skew = skew || 0;
		this.width = width || 0;
		this.classes = classes || [];
		this.style = style || {};
		this.maxFontSize = 0;
		var script = scriptFromCodepoint(this.text.charCodeAt(0));
		if (script) this.classes.push(script + "_fallback");
		if (/[îïíì]/.test(this.text)) this.text = iCombinations[this.text];
	}
	hasClass(className) {
		return this.classes.includes(className);
	}
	/**
	* Creates a text node or span from a symbol node. Note that a span is only
	* created if it is needed.
	*/
	toNode() {
		var node = document.createTextNode(this.text);
		var span = null;
		if (this.italic > 0) {
			span = document.createElement("span");
			span.style.marginRight = makeEm(this.italic);
		}
		if (this.classes.length > 0) {
			span = span || document.createElement("span");
			span.className = createClass(this.classes);
		}
		for (var key of Object.keys(this.style)) {
			span = span || document.createElement("span");
			span.style[key] = this.style[key];
		}
		if (span) {
			span.appendChild(node);
			return span;
		} else return node;
	}
	/**
	* Creates markup for a symbol node.
	*/
	toMarkup() {
		var needsSpan = false;
		var markup = "<span";
		if (this.classes.length) {
			needsSpan = true;
			markup += " class=\"";
			markup += escape$1(createClass(this.classes));
			markup += "\"";
		}
		var styles = "";
		if (this.italic > 0) styles += "margin-right:" + makeEm(this.italic) + ";";
		for (var key of Object.keys(this.style)) styles += hyphenate(key) + ":" + this.style[key] + ";";
		if (styles) {
			needsSpan = true;
			markup += " style=\"" + escape$1(styles) + "\"";
		}
		var escaped = escape$1(this.text);
		if (needsSpan) {
			markup += ">";
			markup += escaped;
			markup += "</span>";
			return markup;
		} else return escaped;
	}
};
/**
* SVG nodes are used to render stretchy wide elements.
*/
var SvgNode = class {
	constructor(children, attributes) {
		this.children = children || [];
		this.attributes = attributes || {};
	}
	toNode() {
		var node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		for (var attr of Object.keys(this.attributes)) node.setAttribute(attr, this.attributes[attr]);
		for (var i = 0; i < this.children.length; i++) node.appendChild(this.children[i].toNode());
		return node;
	}
	toMarkup() {
		var markup = "<svg xmlns=\"http://www.w3.org/2000/svg\"";
		for (var attr of Object.keys(this.attributes)) markup += " " + attr + "=\"" + escape$1(this.attributes[attr]) + "\"";
		markup += ">";
		for (var i = 0; i < this.children.length; i++) markup += this.children[i].toMarkup();
		markup += "</svg>";
		return markup;
	}
};
var PathNode = class {
	constructor(pathName, alternate) {
		this.pathName = pathName;
		this.alternate = alternate;
	}
	toNode() {
		var node = document.createElementNS("http://www.w3.org/2000/svg", "path");
		if (this.alternate) node.setAttribute("d", this.alternate);
		else node.setAttribute("d", path[this.pathName]);
		return node;
	}
	toMarkup() {
		if (this.alternate) return "<path d=\"" + escape$1(this.alternate) + "\"/>";
		else return "<path d=\"" + escape$1(path[this.pathName]) + "\"/>";
	}
};
var LineNode = class {
	constructor(attributes) {
		this.attributes = attributes || {};
	}
	toNode() {
		var node = document.createElementNS("http://www.w3.org/2000/svg", "line");
		for (var attr of Object.keys(this.attributes)) node.setAttribute(attr, this.attributes[attr]);
		return node;
	}
	toMarkup() {
		var markup = "<line";
		for (var attr of Object.keys(this.attributes)) markup += " " + attr + "=\"" + escape$1(this.attributes[attr]) + "\"";
		markup += "/>";
		return markup;
	}
};
function assertSymbolDomNode(group) {
	if (group instanceof SymbolNode) return group;
	else throw new Error("Expected symbolNode but got " + String(group) + ".");
}
function assertSpan(group) {
	if (group instanceof Span) return group;
	else throw new Error("Expected span<HtmlDomNode> but got " + String(group) + ".");
}
/**
* Whether an HtmlDomNode has HtmlDomNode children.
* HtmlDomNode is a base type representing a union of
* SymbolNode, SvgSpan, DomSpan, Anchor, and documentFragment.
* In the last three cases, the children are HtmlDomNode[].
*/
var hasHtmlDomChildren = (node) => node instanceof Span || node instanceof Anchor || node instanceof DocumentFragment;
var fontMetricsData = {
	"AMS-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"65": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"66": [
			0,
			.68889,
			0,
			0,
			.66667
		],
		"67": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"68": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"69": [
			0,
			.68889,
			0,
			0,
			.66667
		],
		"70": [
			0,
			.68889,
			0,
			0,
			.61111
		],
		"71": [
			0,
			.68889,
			0,
			0,
			.77778
		],
		"72": [
			0,
			.68889,
			0,
			0,
			.77778
		],
		"73": [
			0,
			.68889,
			0,
			0,
			.38889
		],
		"74": [
			.16667,
			.68889,
			0,
			0,
			.5
		],
		"75": [
			0,
			.68889,
			0,
			0,
			.77778
		],
		"76": [
			0,
			.68889,
			0,
			0,
			.66667
		],
		"77": [
			0,
			.68889,
			0,
			0,
			.94445
		],
		"78": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"79": [
			.16667,
			.68889,
			0,
			0,
			.77778
		],
		"80": [
			0,
			.68889,
			0,
			0,
			.61111
		],
		"81": [
			.16667,
			.68889,
			0,
			0,
			.77778
		],
		"82": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"83": [
			0,
			.68889,
			0,
			0,
			.55556
		],
		"84": [
			0,
			.68889,
			0,
			0,
			.66667
		],
		"85": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"86": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"87": [
			0,
			.68889,
			0,
			0,
			1
		],
		"88": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"89": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"90": [
			0,
			.68889,
			0,
			0,
			.66667
		],
		"107": [
			0,
			.68889,
			0,
			0,
			.55556
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"165": [
			0,
			.675,
			.025,
			0,
			.75
		],
		"174": [
			.15559,
			.69224,
			0,
			0,
			.94666
		],
		"240": [
			0,
			.68889,
			0,
			0,
			.55556
		],
		"295": [
			0,
			.68889,
			0,
			0,
			.54028
		],
		"710": [
			0,
			.825,
			0,
			0,
			2.33334
		],
		"732": [
			0,
			.9,
			0,
			0,
			2.33334
		],
		"770": [
			0,
			.825,
			0,
			0,
			2.33334
		],
		"771": [
			0,
			.9,
			0,
			0,
			2.33334
		],
		"989": [
			.08167,
			.58167,
			0,
			0,
			.77778
		],
		"1008": [
			0,
			.43056,
			.04028,
			0,
			.66667
		],
		"8245": [
			0,
			.54986,
			0,
			0,
			.275
		],
		"8463": [
			0,
			.68889,
			0,
			0,
			.54028
		],
		"8487": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"8498": [
			0,
			.68889,
			0,
			0,
			.55556
		],
		"8502": [
			0,
			.68889,
			0,
			0,
			.66667
		],
		"8503": [
			0,
			.68889,
			0,
			0,
			.44445
		],
		"8504": [
			0,
			.68889,
			0,
			0,
			.66667
		],
		"8513": [
			0,
			.68889,
			0,
			0,
			.63889
		],
		"8592": [
			-.03598,
			.46402,
			0,
			0,
			.5
		],
		"8594": [
			-.03598,
			.46402,
			0,
			0,
			.5
		],
		"8602": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8603": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8606": [
			.01354,
			.52239,
			0,
			0,
			1
		],
		"8608": [
			.01354,
			.52239,
			0,
			0,
			1
		],
		"8610": [
			.01354,
			.52239,
			0,
			0,
			1.11111
		],
		"8611": [
			.01354,
			.52239,
			0,
			0,
			1.11111
		],
		"8619": [
			0,
			.54986,
			0,
			0,
			1
		],
		"8620": [
			0,
			.54986,
			0,
			0,
			1
		],
		"8621": [
			-.13313,
			.37788,
			0,
			0,
			1.38889
		],
		"8622": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8624": [
			0,
			.69224,
			0,
			0,
			.5
		],
		"8625": [
			0,
			.69224,
			0,
			0,
			.5
		],
		"8630": [
			0,
			.43056,
			0,
			0,
			1
		],
		"8631": [
			0,
			.43056,
			0,
			0,
			1
		],
		"8634": [
			.08198,
			.58198,
			0,
			0,
			.77778
		],
		"8635": [
			.08198,
			.58198,
			0,
			0,
			.77778
		],
		"8638": [
			.19444,
			.69224,
			0,
			0,
			.41667
		],
		"8639": [
			.19444,
			.69224,
			0,
			0,
			.41667
		],
		"8642": [
			.19444,
			.69224,
			0,
			0,
			.41667
		],
		"8643": [
			.19444,
			.69224,
			0,
			0,
			.41667
		],
		"8644": [
			.1808,
			.675,
			0,
			0,
			1
		],
		"8646": [
			.1808,
			.675,
			0,
			0,
			1
		],
		"8647": [
			.1808,
			.675,
			0,
			0,
			1
		],
		"8648": [
			.19444,
			.69224,
			0,
			0,
			.83334
		],
		"8649": [
			.1808,
			.675,
			0,
			0,
			1
		],
		"8650": [
			.19444,
			.69224,
			0,
			0,
			.83334
		],
		"8651": [
			.01354,
			.52239,
			0,
			0,
			1
		],
		"8652": [
			.01354,
			.52239,
			0,
			0,
			1
		],
		"8653": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8654": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8655": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8666": [
			.13667,
			.63667,
			0,
			0,
			1
		],
		"8667": [
			.13667,
			.63667,
			0,
			0,
			1
		],
		"8669": [
			-.13313,
			.37788,
			0,
			0,
			1
		],
		"8672": [
			-.064,
			.437,
			0,
			0,
			1.334
		],
		"8674": [
			-.064,
			.437,
			0,
			0,
			1.334
		],
		"8705": [
			0,
			.825,
			0,
			0,
			.5
		],
		"8708": [
			0,
			.68889,
			0,
			0,
			.55556
		],
		"8709": [
			.08167,
			.58167,
			0,
			0,
			.77778
		],
		"8717": [
			0,
			.43056,
			0,
			0,
			.42917
		],
		"8722": [
			-.03598,
			.46402,
			0,
			0,
			.5
		],
		"8724": [
			.08198,
			.69224,
			0,
			0,
			.77778
		],
		"8726": [
			.08167,
			.58167,
			0,
			0,
			.77778
		],
		"8733": [
			0,
			.69224,
			0,
			0,
			.77778
		],
		"8736": [
			0,
			.69224,
			0,
			0,
			.72222
		],
		"8737": [
			0,
			.69224,
			0,
			0,
			.72222
		],
		"8738": [
			.03517,
			.52239,
			0,
			0,
			.72222
		],
		"8739": [
			.08167,
			.58167,
			0,
			0,
			.22222
		],
		"8740": [
			.25142,
			.74111,
			0,
			0,
			.27778
		],
		"8741": [
			.08167,
			.58167,
			0,
			0,
			.38889
		],
		"8742": [
			.25142,
			.74111,
			0,
			0,
			.5
		],
		"8756": [
			0,
			.69224,
			0,
			0,
			.66667
		],
		"8757": [
			0,
			.69224,
			0,
			0,
			.66667
		],
		"8764": [
			-.13313,
			.36687,
			0,
			0,
			.77778
		],
		"8765": [
			-.13313,
			.37788,
			0,
			0,
			.77778
		],
		"8769": [
			-.13313,
			.36687,
			0,
			0,
			.77778
		],
		"8770": [
			-.03625,
			.46375,
			0,
			0,
			.77778
		],
		"8774": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"8776": [
			-.01688,
			.48312,
			0,
			0,
			.77778
		],
		"8778": [
			.08167,
			.58167,
			0,
			0,
			.77778
		],
		"8782": [
			.06062,
			.54986,
			0,
			0,
			.77778
		],
		"8783": [
			.06062,
			.54986,
			0,
			0,
			.77778
		],
		"8785": [
			.08198,
			.58198,
			0,
			0,
			.77778
		],
		"8786": [
			.08198,
			.58198,
			0,
			0,
			.77778
		],
		"8787": [
			.08198,
			.58198,
			0,
			0,
			.77778
		],
		"8790": [
			0,
			.69224,
			0,
			0,
			.77778
		],
		"8791": [
			.22958,
			.72958,
			0,
			0,
			.77778
		],
		"8796": [
			.08198,
			.91667,
			0,
			0,
			.77778
		],
		"8806": [
			.25583,
			.75583,
			0,
			0,
			.77778
		],
		"8807": [
			.25583,
			.75583,
			0,
			0,
			.77778
		],
		"8808": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"8809": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"8812": [
			.25583,
			.75583,
			0,
			0,
			.5
		],
		"8814": [
			.20576,
			.70576,
			0,
			0,
			.77778
		],
		"8815": [
			.20576,
			.70576,
			0,
			0,
			.77778
		],
		"8816": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"8817": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"8818": [
			.22958,
			.72958,
			0,
			0,
			.77778
		],
		"8819": [
			.22958,
			.72958,
			0,
			0,
			.77778
		],
		"8822": [
			.1808,
			.675,
			0,
			0,
			.77778
		],
		"8823": [
			.1808,
			.675,
			0,
			0,
			.77778
		],
		"8828": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"8829": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"8830": [
			.22958,
			.72958,
			0,
			0,
			.77778
		],
		"8831": [
			.22958,
			.72958,
			0,
			0,
			.77778
		],
		"8832": [
			.20576,
			.70576,
			0,
			0,
			.77778
		],
		"8833": [
			.20576,
			.70576,
			0,
			0,
			.77778
		],
		"8840": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"8841": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"8842": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"8843": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"8847": [
			.03517,
			.54986,
			0,
			0,
			.77778
		],
		"8848": [
			.03517,
			.54986,
			0,
			0,
			.77778
		],
		"8858": [
			.08198,
			.58198,
			0,
			0,
			.77778
		],
		"8859": [
			.08198,
			.58198,
			0,
			0,
			.77778
		],
		"8861": [
			.08198,
			.58198,
			0,
			0,
			.77778
		],
		"8862": [
			0,
			.675,
			0,
			0,
			.77778
		],
		"8863": [
			0,
			.675,
			0,
			0,
			.77778
		],
		"8864": [
			0,
			.675,
			0,
			0,
			.77778
		],
		"8865": [
			0,
			.675,
			0,
			0,
			.77778
		],
		"8872": [
			0,
			.69224,
			0,
			0,
			.61111
		],
		"8873": [
			0,
			.69224,
			0,
			0,
			.72222
		],
		"8874": [
			0,
			.69224,
			0,
			0,
			.88889
		],
		"8876": [
			0,
			.68889,
			0,
			0,
			.61111
		],
		"8877": [
			0,
			.68889,
			0,
			0,
			.61111
		],
		"8878": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"8879": [
			0,
			.68889,
			0,
			0,
			.72222
		],
		"8882": [
			.03517,
			.54986,
			0,
			0,
			.77778
		],
		"8883": [
			.03517,
			.54986,
			0,
			0,
			.77778
		],
		"8884": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"8885": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"8888": [
			0,
			.54986,
			0,
			0,
			1.11111
		],
		"8890": [
			.19444,
			.43056,
			0,
			0,
			.55556
		],
		"8891": [
			.19444,
			.69224,
			0,
			0,
			.61111
		],
		"8892": [
			.19444,
			.69224,
			0,
			0,
			.61111
		],
		"8901": [
			0,
			.54986,
			0,
			0,
			.27778
		],
		"8903": [
			.08167,
			.58167,
			0,
			0,
			.77778
		],
		"8905": [
			.08167,
			.58167,
			0,
			0,
			.77778
		],
		"8906": [
			.08167,
			.58167,
			0,
			0,
			.77778
		],
		"8907": [
			0,
			.69224,
			0,
			0,
			.77778
		],
		"8908": [
			0,
			.69224,
			0,
			0,
			.77778
		],
		"8909": [
			-.03598,
			.46402,
			0,
			0,
			.77778
		],
		"8910": [
			0,
			.54986,
			0,
			0,
			.76042
		],
		"8911": [
			0,
			.54986,
			0,
			0,
			.76042
		],
		"8912": [
			.03517,
			.54986,
			0,
			0,
			.77778
		],
		"8913": [
			.03517,
			.54986,
			0,
			0,
			.77778
		],
		"8914": [
			0,
			.54986,
			0,
			0,
			.66667
		],
		"8915": [
			0,
			.54986,
			0,
			0,
			.66667
		],
		"8916": [
			0,
			.69224,
			0,
			0,
			.66667
		],
		"8918": [
			.0391,
			.5391,
			0,
			0,
			.77778
		],
		"8919": [
			.0391,
			.5391,
			0,
			0,
			.77778
		],
		"8920": [
			.03517,
			.54986,
			0,
			0,
			1.33334
		],
		"8921": [
			.03517,
			.54986,
			0,
			0,
			1.33334
		],
		"8922": [
			.38569,
			.88569,
			0,
			0,
			.77778
		],
		"8923": [
			.38569,
			.88569,
			0,
			0,
			.77778
		],
		"8926": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"8927": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"8928": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"8929": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"8934": [
			.23222,
			.74111,
			0,
			0,
			.77778
		],
		"8935": [
			.23222,
			.74111,
			0,
			0,
			.77778
		],
		"8936": [
			.23222,
			.74111,
			0,
			0,
			.77778
		],
		"8937": [
			.23222,
			.74111,
			0,
			0,
			.77778
		],
		"8938": [
			.20576,
			.70576,
			0,
			0,
			.77778
		],
		"8939": [
			.20576,
			.70576,
			0,
			0,
			.77778
		],
		"8940": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"8941": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"8994": [
			.19444,
			.69224,
			0,
			0,
			.77778
		],
		"8995": [
			.19444,
			.69224,
			0,
			0,
			.77778
		],
		"9416": [
			.15559,
			.69224,
			0,
			0,
			.90222
		],
		"9484": [
			0,
			.69224,
			0,
			0,
			.5
		],
		"9488": [
			0,
			.69224,
			0,
			0,
			.5
		],
		"9492": [
			0,
			.37788,
			0,
			0,
			.5
		],
		"9496": [
			0,
			.37788,
			0,
			0,
			.5
		],
		"9585": [
			.19444,
			.68889,
			0,
			0,
			.88889
		],
		"9586": [
			.19444,
			.74111,
			0,
			0,
			.88889
		],
		"9632": [
			0,
			.675,
			0,
			0,
			.77778
		],
		"9633": [
			0,
			.675,
			0,
			0,
			.77778
		],
		"9650": [
			0,
			.54986,
			0,
			0,
			.72222
		],
		"9651": [
			0,
			.54986,
			0,
			0,
			.72222
		],
		"9654": [
			.03517,
			.54986,
			0,
			0,
			.77778
		],
		"9660": [
			0,
			.54986,
			0,
			0,
			.72222
		],
		"9661": [
			0,
			.54986,
			0,
			0,
			.72222
		],
		"9664": [
			.03517,
			.54986,
			0,
			0,
			.77778
		],
		"9674": [
			.11111,
			.69224,
			0,
			0,
			.66667
		],
		"9733": [
			.19444,
			.69224,
			0,
			0,
			.94445
		],
		"10003": [
			0,
			.69224,
			0,
			0,
			.83334
		],
		"10016": [
			0,
			.69224,
			0,
			0,
			.83334
		],
		"10731": [
			.11111,
			.69224,
			0,
			0,
			.66667
		],
		"10846": [
			.19444,
			.75583,
			0,
			0,
			.61111
		],
		"10877": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"10878": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"10885": [
			.25583,
			.75583,
			0,
			0,
			.77778
		],
		"10886": [
			.25583,
			.75583,
			0,
			0,
			.77778
		],
		"10887": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"10888": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"10889": [
			.26167,
			.75726,
			0,
			0,
			.77778
		],
		"10890": [
			.26167,
			.75726,
			0,
			0,
			.77778
		],
		"10891": [
			.48256,
			.98256,
			0,
			0,
			.77778
		],
		"10892": [
			.48256,
			.98256,
			0,
			0,
			.77778
		],
		"10901": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"10902": [
			.13667,
			.63667,
			0,
			0,
			.77778
		],
		"10933": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"10934": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"10935": [
			.26167,
			.75726,
			0,
			0,
			.77778
		],
		"10936": [
			.26167,
			.75726,
			0,
			0,
			.77778
		],
		"10937": [
			.26167,
			.75726,
			0,
			0,
			.77778
		],
		"10938": [
			.26167,
			.75726,
			0,
			0,
			.77778
		],
		"10949": [
			.25583,
			.75583,
			0,
			0,
			.77778
		],
		"10950": [
			.25583,
			.75583,
			0,
			0,
			.77778
		],
		"10955": [
			.28481,
			.79383,
			0,
			0,
			.77778
		],
		"10956": [
			.28481,
			.79383,
			0,
			0,
			.77778
		],
		"57350": [
			.08167,
			.58167,
			0,
			0,
			.22222
		],
		"57351": [
			.08167,
			.58167,
			0,
			0,
			.38889
		],
		"57352": [
			.08167,
			.58167,
			0,
			0,
			.77778
		],
		"57353": [
			0,
			.43056,
			.04028,
			0,
			.66667
		],
		"57356": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"57357": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"57358": [
			.41951,
			.91951,
			0,
			0,
			.77778
		],
		"57359": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"57360": [
			.30274,
			.79383,
			0,
			0,
			.77778
		],
		"57361": [
			.41951,
			.91951,
			0,
			0,
			.77778
		],
		"57366": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"57367": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"57368": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"57369": [
			.25142,
			.75726,
			0,
			0,
			.77778
		],
		"57370": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"57371": [
			.13597,
			.63597,
			0,
			0,
			.77778
		]
	},
	"Caligraphic-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"65": [
			0,
			.68333,
			0,
			.19445,
			.79847
		],
		"66": [
			0,
			.68333,
			.03041,
			.13889,
			.65681
		],
		"67": [
			0,
			.68333,
			.05834,
			.13889,
			.52653
		],
		"68": [
			0,
			.68333,
			.02778,
			.08334,
			.77139
		],
		"69": [
			0,
			.68333,
			.08944,
			.11111,
			.52778
		],
		"70": [
			0,
			.68333,
			.09931,
			.11111,
			.71875
		],
		"71": [
			.09722,
			.68333,
			.0593,
			.11111,
			.59487
		],
		"72": [
			0,
			.68333,
			.00965,
			.11111,
			.84452
		],
		"73": [
			0,
			.68333,
			.07382,
			0,
			.54452
		],
		"74": [
			.09722,
			.68333,
			.18472,
			.16667,
			.67778
		],
		"75": [
			0,
			.68333,
			.01445,
			.05556,
			.76195
		],
		"76": [
			0,
			.68333,
			0,
			.13889,
			.68972
		],
		"77": [
			0,
			.68333,
			0,
			.13889,
			1.2009
		],
		"78": [
			0,
			.68333,
			.14736,
			.08334,
			.82049
		],
		"79": [
			0,
			.68333,
			.02778,
			.11111,
			.79611
		],
		"80": [
			0,
			.68333,
			.08222,
			.08334,
			.69556
		],
		"81": [
			.09722,
			.68333,
			0,
			.11111,
			.81667
		],
		"82": [
			0,
			.68333,
			0,
			.08334,
			.8475
		],
		"83": [
			0,
			.68333,
			.075,
			.13889,
			.60556
		],
		"84": [
			0,
			.68333,
			.25417,
			0,
			.54464
		],
		"85": [
			0,
			.68333,
			.09931,
			.08334,
			.62583
		],
		"86": [
			0,
			.68333,
			.08222,
			0,
			.61278
		],
		"87": [
			0,
			.68333,
			.08222,
			.08334,
			.98778
		],
		"88": [
			0,
			.68333,
			.14643,
			.13889,
			.7133
		],
		"89": [
			.09722,
			.68333,
			.08222,
			.08334,
			.66834
		],
		"90": [
			0,
			.68333,
			.07944,
			.13889,
			.72473
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		]
	},
	"Fraktur-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"33": [
			0,
			.69141,
			0,
			0,
			.29574
		],
		"34": [
			0,
			.69141,
			0,
			0,
			.21471
		],
		"38": [
			0,
			.69141,
			0,
			0,
			.73786
		],
		"39": [
			0,
			.69141,
			0,
			0,
			.21201
		],
		"40": [
			.24982,
			.74947,
			0,
			0,
			.38865
		],
		"41": [
			.24982,
			.74947,
			0,
			0,
			.38865
		],
		"42": [
			0,
			.62119,
			0,
			0,
			.27764
		],
		"43": [
			.08319,
			.58283,
			0,
			0,
			.75623
		],
		"44": [
			0,
			.10803,
			0,
			0,
			.27764
		],
		"45": [
			.08319,
			.58283,
			0,
			0,
			.75623
		],
		"46": [
			0,
			.10803,
			0,
			0,
			.27764
		],
		"47": [
			.24982,
			.74947,
			0,
			0,
			.50181
		],
		"48": [
			0,
			.47534,
			0,
			0,
			.50181
		],
		"49": [
			0,
			.47534,
			0,
			0,
			.50181
		],
		"50": [
			0,
			.47534,
			0,
			0,
			.50181
		],
		"51": [
			.18906,
			.47534,
			0,
			0,
			.50181
		],
		"52": [
			.18906,
			.47534,
			0,
			0,
			.50181
		],
		"53": [
			.18906,
			.47534,
			0,
			0,
			.50181
		],
		"54": [
			0,
			.69141,
			0,
			0,
			.50181
		],
		"55": [
			.18906,
			.47534,
			0,
			0,
			.50181
		],
		"56": [
			0,
			.69141,
			0,
			0,
			.50181
		],
		"57": [
			.18906,
			.47534,
			0,
			0,
			.50181
		],
		"58": [
			0,
			.47534,
			0,
			0,
			.21606
		],
		"59": [
			.12604,
			.47534,
			0,
			0,
			.21606
		],
		"61": [
			-.13099,
			.36866,
			0,
			0,
			.75623
		],
		"63": [
			0,
			.69141,
			0,
			0,
			.36245
		],
		"65": [
			0,
			.69141,
			0,
			0,
			.7176
		],
		"66": [
			0,
			.69141,
			0,
			0,
			.88397
		],
		"67": [
			0,
			.69141,
			0,
			0,
			.61254
		],
		"68": [
			0,
			.69141,
			0,
			0,
			.83158
		],
		"69": [
			0,
			.69141,
			0,
			0,
			.66278
		],
		"70": [
			.12604,
			.69141,
			0,
			0,
			.61119
		],
		"71": [
			0,
			.69141,
			0,
			0,
			.78539
		],
		"72": [
			.06302,
			.69141,
			0,
			0,
			.7203
		],
		"73": [
			0,
			.69141,
			0,
			0,
			.55448
		],
		"74": [
			.12604,
			.69141,
			0,
			0,
			.55231
		],
		"75": [
			0,
			.69141,
			0,
			0,
			.66845
		],
		"76": [
			0,
			.69141,
			0,
			0,
			.66602
		],
		"77": [
			0,
			.69141,
			0,
			0,
			1.04953
		],
		"78": [
			0,
			.69141,
			0,
			0,
			.83212
		],
		"79": [
			0,
			.69141,
			0,
			0,
			.82699
		],
		"80": [
			.18906,
			.69141,
			0,
			0,
			.82753
		],
		"81": [
			.03781,
			.69141,
			0,
			0,
			.82699
		],
		"82": [
			0,
			.69141,
			0,
			0,
			.82807
		],
		"83": [
			0,
			.69141,
			0,
			0,
			.82861
		],
		"84": [
			0,
			.69141,
			0,
			0,
			.66899
		],
		"85": [
			0,
			.69141,
			0,
			0,
			.64576
		],
		"86": [
			0,
			.69141,
			0,
			0,
			.83131
		],
		"87": [
			0,
			.69141,
			0,
			0,
			1.04602
		],
		"88": [
			0,
			.69141,
			0,
			0,
			.71922
		],
		"89": [
			.18906,
			.69141,
			0,
			0,
			.83293
		],
		"90": [
			.12604,
			.69141,
			0,
			0,
			.60201
		],
		"91": [
			.24982,
			.74947,
			0,
			0,
			.27764
		],
		"93": [
			.24982,
			.74947,
			0,
			0,
			.27764
		],
		"94": [
			0,
			.69141,
			0,
			0,
			.49965
		],
		"97": [
			0,
			.47534,
			0,
			0,
			.50046
		],
		"98": [
			0,
			.69141,
			0,
			0,
			.51315
		],
		"99": [
			0,
			.47534,
			0,
			0,
			.38946
		],
		"100": [
			0,
			.62119,
			0,
			0,
			.49857
		],
		"101": [
			0,
			.47534,
			0,
			0,
			.40053
		],
		"102": [
			.18906,
			.69141,
			0,
			0,
			.32626
		],
		"103": [
			.18906,
			.47534,
			0,
			0,
			.5037
		],
		"104": [
			.18906,
			.69141,
			0,
			0,
			.52126
		],
		"105": [
			0,
			.69141,
			0,
			0,
			.27899
		],
		"106": [
			0,
			.69141,
			0,
			0,
			.28088
		],
		"107": [
			0,
			.69141,
			0,
			0,
			.38946
		],
		"108": [
			0,
			.69141,
			0,
			0,
			.27953
		],
		"109": [
			0,
			.47534,
			0,
			0,
			.76676
		],
		"110": [
			0,
			.47534,
			0,
			0,
			.52666
		],
		"111": [
			0,
			.47534,
			0,
			0,
			.48885
		],
		"112": [
			.18906,
			.52396,
			0,
			0,
			.50046
		],
		"113": [
			.18906,
			.47534,
			0,
			0,
			.48912
		],
		"114": [
			0,
			.47534,
			0,
			0,
			.38919
		],
		"115": [
			0,
			.47534,
			0,
			0,
			.44266
		],
		"116": [
			0,
			.62119,
			0,
			0,
			.33301
		],
		"117": [
			0,
			.47534,
			0,
			0,
			.5172
		],
		"118": [
			0,
			.52396,
			0,
			0,
			.5118
		],
		"119": [
			0,
			.52396,
			0,
			0,
			.77351
		],
		"120": [
			.18906,
			.47534,
			0,
			0,
			.38865
		],
		"121": [
			.18906,
			.47534,
			0,
			0,
			.49884
		],
		"122": [
			.18906,
			.47534,
			0,
			0,
			.39054
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"8216": [
			0,
			.69141,
			0,
			0,
			.21471
		],
		"8217": [
			0,
			.69141,
			0,
			0,
			.21471
		],
		"58112": [
			0,
			.62119,
			0,
			0,
			.49749
		],
		"58113": [
			0,
			.62119,
			0,
			0,
			.4983
		],
		"58114": [
			.18906,
			.69141,
			0,
			0,
			.33328
		],
		"58115": [
			.18906,
			.69141,
			0,
			0,
			.32923
		],
		"58116": [
			.18906,
			.47534,
			0,
			0,
			.50343
		],
		"58117": [
			0,
			.69141,
			0,
			0,
			.33301
		],
		"58118": [
			0,
			.62119,
			0,
			0,
			.33409
		],
		"58119": [
			0,
			.47534,
			0,
			0,
			.50073
		]
	},
	"Main-Bold": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"33": [
			0,
			.69444,
			0,
			0,
			.35
		],
		"34": [
			0,
			.69444,
			0,
			0,
			.60278
		],
		"35": [
			.19444,
			.69444,
			0,
			0,
			.95833
		],
		"36": [
			.05556,
			.75,
			0,
			0,
			.575
		],
		"37": [
			.05556,
			.75,
			0,
			0,
			.95833
		],
		"38": [
			0,
			.69444,
			0,
			0,
			.89444
		],
		"39": [
			0,
			.69444,
			0,
			0,
			.31944
		],
		"40": [
			.25,
			.75,
			0,
			0,
			.44722
		],
		"41": [
			.25,
			.75,
			0,
			0,
			.44722
		],
		"42": [
			0,
			.75,
			0,
			0,
			.575
		],
		"43": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"44": [
			.19444,
			.15556,
			0,
			0,
			.31944
		],
		"45": [
			0,
			.44444,
			0,
			0,
			.38333
		],
		"46": [
			0,
			.15556,
			0,
			0,
			.31944
		],
		"47": [
			.25,
			.75,
			0,
			0,
			.575
		],
		"48": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"49": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"50": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"51": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"52": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"53": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"54": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"55": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"56": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"57": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"58": [
			0,
			.44444,
			0,
			0,
			.31944
		],
		"59": [
			.19444,
			.44444,
			0,
			0,
			.31944
		],
		"60": [
			.08556,
			.58556,
			0,
			0,
			.89444
		],
		"61": [
			-.10889,
			.39111,
			0,
			0,
			.89444
		],
		"62": [
			.08556,
			.58556,
			0,
			0,
			.89444
		],
		"63": [
			0,
			.69444,
			0,
			0,
			.54305
		],
		"64": [
			0,
			.69444,
			0,
			0,
			.89444
		],
		"65": [
			0,
			.68611,
			0,
			0,
			.86944
		],
		"66": [
			0,
			.68611,
			0,
			0,
			.81805
		],
		"67": [
			0,
			.68611,
			0,
			0,
			.83055
		],
		"68": [
			0,
			.68611,
			0,
			0,
			.88194
		],
		"69": [
			0,
			.68611,
			0,
			0,
			.75555
		],
		"70": [
			0,
			.68611,
			0,
			0,
			.72361
		],
		"71": [
			0,
			.68611,
			0,
			0,
			.90416
		],
		"72": [
			0,
			.68611,
			0,
			0,
			.9
		],
		"73": [
			0,
			.68611,
			0,
			0,
			.43611
		],
		"74": [
			0,
			.68611,
			0,
			0,
			.59444
		],
		"75": [
			0,
			.68611,
			0,
			0,
			.90138
		],
		"76": [
			0,
			.68611,
			0,
			0,
			.69166
		],
		"77": [
			0,
			.68611,
			0,
			0,
			1.09166
		],
		"78": [
			0,
			.68611,
			0,
			0,
			.9
		],
		"79": [
			0,
			.68611,
			0,
			0,
			.86388
		],
		"80": [
			0,
			.68611,
			0,
			0,
			.78611
		],
		"81": [
			.19444,
			.68611,
			0,
			0,
			.86388
		],
		"82": [
			0,
			.68611,
			0,
			0,
			.8625
		],
		"83": [
			0,
			.68611,
			0,
			0,
			.63889
		],
		"84": [
			0,
			.68611,
			0,
			0,
			.8
		],
		"85": [
			0,
			.68611,
			0,
			0,
			.88472
		],
		"86": [
			0,
			.68611,
			.01597,
			0,
			.86944
		],
		"87": [
			0,
			.68611,
			.01597,
			0,
			1.18888
		],
		"88": [
			0,
			.68611,
			0,
			0,
			.86944
		],
		"89": [
			0,
			.68611,
			.02875,
			0,
			.86944
		],
		"90": [
			0,
			.68611,
			0,
			0,
			.70277
		],
		"91": [
			.25,
			.75,
			0,
			0,
			.31944
		],
		"92": [
			.25,
			.75,
			0,
			0,
			.575
		],
		"93": [
			.25,
			.75,
			0,
			0,
			.31944
		],
		"94": [
			0,
			.69444,
			0,
			0,
			.575
		],
		"95": [
			.31,
			.13444,
			.03194,
			0,
			.575
		],
		"97": [
			0,
			.44444,
			0,
			0,
			.55902
		],
		"98": [
			0,
			.69444,
			0,
			0,
			.63889
		],
		"99": [
			0,
			.44444,
			0,
			0,
			.51111
		],
		"100": [
			0,
			.69444,
			0,
			0,
			.63889
		],
		"101": [
			0,
			.44444,
			0,
			0,
			.52708
		],
		"102": [
			0,
			.69444,
			.10903,
			0,
			.35139
		],
		"103": [
			.19444,
			.44444,
			.01597,
			0,
			.575
		],
		"104": [
			0,
			.69444,
			0,
			0,
			.63889
		],
		"105": [
			0,
			.69444,
			0,
			0,
			.31944
		],
		"106": [
			.19444,
			.69444,
			0,
			0,
			.35139
		],
		"107": [
			0,
			.69444,
			0,
			0,
			.60694
		],
		"108": [
			0,
			.69444,
			0,
			0,
			.31944
		],
		"109": [
			0,
			.44444,
			0,
			0,
			.95833
		],
		"110": [
			0,
			.44444,
			0,
			0,
			.63889
		],
		"111": [
			0,
			.44444,
			0,
			0,
			.575
		],
		"112": [
			.19444,
			.44444,
			0,
			0,
			.63889
		],
		"113": [
			.19444,
			.44444,
			0,
			0,
			.60694
		],
		"114": [
			0,
			.44444,
			0,
			0,
			.47361
		],
		"115": [
			0,
			.44444,
			0,
			0,
			.45361
		],
		"116": [
			0,
			.63492,
			0,
			0,
			.44722
		],
		"117": [
			0,
			.44444,
			0,
			0,
			.63889
		],
		"118": [
			0,
			.44444,
			.01597,
			0,
			.60694
		],
		"119": [
			0,
			.44444,
			.01597,
			0,
			.83055
		],
		"120": [
			0,
			.44444,
			0,
			0,
			.60694
		],
		"121": [
			.19444,
			.44444,
			.01597,
			0,
			.60694
		],
		"122": [
			0,
			.44444,
			0,
			0,
			.51111
		],
		"123": [
			.25,
			.75,
			0,
			0,
			.575
		],
		"124": [
			.25,
			.75,
			0,
			0,
			.31944
		],
		"125": [
			.25,
			.75,
			0,
			0,
			.575
		],
		"126": [
			.35,
			.34444,
			0,
			0,
			.575
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"163": [
			0,
			.69444,
			0,
			0,
			.86853
		],
		"168": [
			0,
			.69444,
			0,
			0,
			.575
		],
		"172": [
			0,
			.44444,
			0,
			0,
			.76666
		],
		"176": [
			0,
			.69444,
			0,
			0,
			.86944
		],
		"177": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"184": [
			.17014,
			0,
			0,
			0,
			.51111
		],
		"198": [
			0,
			.68611,
			0,
			0,
			1.04166
		],
		"215": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"216": [
			.04861,
			.73472,
			0,
			0,
			.89444
		],
		"223": [
			0,
			.69444,
			0,
			0,
			.59722
		],
		"230": [
			0,
			.44444,
			0,
			0,
			.83055
		],
		"247": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"248": [
			.09722,
			.54167,
			0,
			0,
			.575
		],
		"305": [
			0,
			.44444,
			0,
			0,
			.31944
		],
		"338": [
			0,
			.68611,
			0,
			0,
			1.16944
		],
		"339": [
			0,
			.44444,
			0,
			0,
			.89444
		],
		"567": [
			.19444,
			.44444,
			0,
			0,
			.35139
		],
		"710": [
			0,
			.69444,
			0,
			0,
			.575
		],
		"711": [
			0,
			.63194,
			0,
			0,
			.575
		],
		"713": [
			0,
			.59611,
			0,
			0,
			.575
		],
		"714": [
			0,
			.69444,
			0,
			0,
			.575
		],
		"715": [
			0,
			.69444,
			0,
			0,
			.575
		],
		"728": [
			0,
			.69444,
			0,
			0,
			.575
		],
		"729": [
			0,
			.69444,
			0,
			0,
			.31944
		],
		"730": [
			0,
			.69444,
			0,
			0,
			.86944
		],
		"732": [
			0,
			.69444,
			0,
			0,
			.575
		],
		"733": [
			0,
			.69444,
			0,
			0,
			.575
		],
		"915": [
			0,
			.68611,
			0,
			0,
			.69166
		],
		"916": [
			0,
			.68611,
			0,
			0,
			.95833
		],
		"920": [
			0,
			.68611,
			0,
			0,
			.89444
		],
		"923": [
			0,
			.68611,
			0,
			0,
			.80555
		],
		"926": [
			0,
			.68611,
			0,
			0,
			.76666
		],
		"928": [
			0,
			.68611,
			0,
			0,
			.9
		],
		"931": [
			0,
			.68611,
			0,
			0,
			.83055
		],
		"933": [
			0,
			.68611,
			0,
			0,
			.89444
		],
		"934": [
			0,
			.68611,
			0,
			0,
			.83055
		],
		"936": [
			0,
			.68611,
			0,
			0,
			.89444
		],
		"937": [
			0,
			.68611,
			0,
			0,
			.83055
		],
		"8211": [
			0,
			.44444,
			.03194,
			0,
			.575
		],
		"8212": [
			0,
			.44444,
			.03194,
			0,
			1.14999
		],
		"8216": [
			0,
			.69444,
			0,
			0,
			.31944
		],
		"8217": [
			0,
			.69444,
			0,
			0,
			.31944
		],
		"8220": [
			0,
			.69444,
			0,
			0,
			.60278
		],
		"8221": [
			0,
			.69444,
			0,
			0,
			.60278
		],
		"8224": [
			.19444,
			.69444,
			0,
			0,
			.51111
		],
		"8225": [
			.19444,
			.69444,
			0,
			0,
			.51111
		],
		"8242": [
			0,
			.55556,
			0,
			0,
			.34444
		],
		"8407": [
			0,
			.72444,
			.15486,
			0,
			.575
		],
		"8463": [
			0,
			.69444,
			0,
			0,
			.66759
		],
		"8465": [
			0,
			.69444,
			0,
			0,
			.83055
		],
		"8467": [
			0,
			.69444,
			0,
			0,
			.47361
		],
		"8472": [
			.19444,
			.44444,
			0,
			0,
			.74027
		],
		"8476": [
			0,
			.69444,
			0,
			0,
			.83055
		],
		"8501": [
			0,
			.69444,
			0,
			0,
			.70277
		],
		"8592": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8593": [
			.19444,
			.69444,
			0,
			0,
			.575
		],
		"8594": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8595": [
			.19444,
			.69444,
			0,
			0,
			.575
		],
		"8596": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8597": [
			.25,
			.75,
			0,
			0,
			.575
		],
		"8598": [
			.19444,
			.69444,
			0,
			0,
			1.14999
		],
		"8599": [
			.19444,
			.69444,
			0,
			0,
			1.14999
		],
		"8600": [
			.19444,
			.69444,
			0,
			0,
			1.14999
		],
		"8601": [
			.19444,
			.69444,
			0,
			0,
			1.14999
		],
		"8636": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8637": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8640": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8641": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8656": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8657": [
			.19444,
			.69444,
			0,
			0,
			.70277
		],
		"8658": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8659": [
			.19444,
			.69444,
			0,
			0,
			.70277
		],
		"8660": [
			-.10889,
			.39111,
			0,
			0,
			1.14999
		],
		"8661": [
			.25,
			.75,
			0,
			0,
			.70277
		],
		"8704": [
			0,
			.69444,
			0,
			0,
			.63889
		],
		"8706": [
			0,
			.69444,
			.06389,
			0,
			.62847
		],
		"8707": [
			0,
			.69444,
			0,
			0,
			.63889
		],
		"8709": [
			.05556,
			.75,
			0,
			0,
			.575
		],
		"8711": [
			0,
			.68611,
			0,
			0,
			.95833
		],
		"8712": [
			.08556,
			.58556,
			0,
			0,
			.76666
		],
		"8715": [
			.08556,
			.58556,
			0,
			0,
			.76666
		],
		"8722": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"8723": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"8725": [
			.25,
			.75,
			0,
			0,
			.575
		],
		"8726": [
			.25,
			.75,
			0,
			0,
			.575
		],
		"8727": [
			-.02778,
			.47222,
			0,
			0,
			.575
		],
		"8728": [
			-.02639,
			.47361,
			0,
			0,
			.575
		],
		"8729": [
			-.02639,
			.47361,
			0,
			0,
			.575
		],
		"8730": [
			.18,
			.82,
			0,
			0,
			.95833
		],
		"8733": [
			0,
			.44444,
			0,
			0,
			.89444
		],
		"8734": [
			0,
			.44444,
			0,
			0,
			1.14999
		],
		"8736": [
			0,
			.69224,
			0,
			0,
			.72222
		],
		"8739": [
			.25,
			.75,
			0,
			0,
			.31944
		],
		"8741": [
			.25,
			.75,
			0,
			0,
			.575
		],
		"8743": [
			0,
			.55556,
			0,
			0,
			.76666
		],
		"8744": [
			0,
			.55556,
			0,
			0,
			.76666
		],
		"8745": [
			0,
			.55556,
			0,
			0,
			.76666
		],
		"8746": [
			0,
			.55556,
			0,
			0,
			.76666
		],
		"8747": [
			.19444,
			.69444,
			.12778,
			0,
			.56875
		],
		"8764": [
			-.10889,
			.39111,
			0,
			0,
			.89444
		],
		"8768": [
			.19444,
			.69444,
			0,
			0,
			.31944
		],
		"8771": [
			.00222,
			.50222,
			0,
			0,
			.89444
		],
		"8773": [
			.027,
			.638,
			0,
			0,
			.894
		],
		"8776": [
			.02444,
			.52444,
			0,
			0,
			.89444
		],
		"8781": [
			.00222,
			.50222,
			0,
			0,
			.89444
		],
		"8801": [
			.00222,
			.50222,
			0,
			0,
			.89444
		],
		"8804": [
			.19667,
			.69667,
			0,
			0,
			.89444
		],
		"8805": [
			.19667,
			.69667,
			0,
			0,
			.89444
		],
		"8810": [
			.08556,
			.58556,
			0,
			0,
			1.14999
		],
		"8811": [
			.08556,
			.58556,
			0,
			0,
			1.14999
		],
		"8826": [
			.08556,
			.58556,
			0,
			0,
			.89444
		],
		"8827": [
			.08556,
			.58556,
			0,
			0,
			.89444
		],
		"8834": [
			.08556,
			.58556,
			0,
			0,
			.89444
		],
		"8835": [
			.08556,
			.58556,
			0,
			0,
			.89444
		],
		"8838": [
			.19667,
			.69667,
			0,
			0,
			.89444
		],
		"8839": [
			.19667,
			.69667,
			0,
			0,
			.89444
		],
		"8846": [
			0,
			.55556,
			0,
			0,
			.76666
		],
		"8849": [
			.19667,
			.69667,
			0,
			0,
			.89444
		],
		"8850": [
			.19667,
			.69667,
			0,
			0,
			.89444
		],
		"8851": [
			0,
			.55556,
			0,
			0,
			.76666
		],
		"8852": [
			0,
			.55556,
			0,
			0,
			.76666
		],
		"8853": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"8854": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"8855": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"8856": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"8857": [
			.13333,
			.63333,
			0,
			0,
			.89444
		],
		"8866": [
			0,
			.69444,
			0,
			0,
			.70277
		],
		"8867": [
			0,
			.69444,
			0,
			0,
			.70277
		],
		"8868": [
			0,
			.69444,
			0,
			0,
			.89444
		],
		"8869": [
			0,
			.69444,
			0,
			0,
			.89444
		],
		"8900": [
			-.02639,
			.47361,
			0,
			0,
			.575
		],
		"8901": [
			-.02639,
			.47361,
			0,
			0,
			.31944
		],
		"8902": [
			-.02778,
			.47222,
			0,
			0,
			.575
		],
		"8968": [
			.25,
			.75,
			0,
			0,
			.51111
		],
		"8969": [
			.25,
			.75,
			0,
			0,
			.51111
		],
		"8970": [
			.25,
			.75,
			0,
			0,
			.51111
		],
		"8971": [
			.25,
			.75,
			0,
			0,
			.51111
		],
		"8994": [
			-.13889,
			.36111,
			0,
			0,
			1.14999
		],
		"8995": [
			-.13889,
			.36111,
			0,
			0,
			1.14999
		],
		"9651": [
			.19444,
			.69444,
			0,
			0,
			1.02222
		],
		"9657": [
			-.02778,
			.47222,
			0,
			0,
			.575
		],
		"9661": [
			.19444,
			.69444,
			0,
			0,
			1.02222
		],
		"9667": [
			-.02778,
			.47222,
			0,
			0,
			.575
		],
		"9711": [
			.19444,
			.69444,
			0,
			0,
			1.14999
		],
		"9824": [
			.12963,
			.69444,
			0,
			0,
			.89444
		],
		"9825": [
			.12963,
			.69444,
			0,
			0,
			.89444
		],
		"9826": [
			.12963,
			.69444,
			0,
			0,
			.89444
		],
		"9827": [
			.12963,
			.69444,
			0,
			0,
			.89444
		],
		"9837": [
			0,
			.75,
			0,
			0,
			.44722
		],
		"9838": [
			.19444,
			.69444,
			0,
			0,
			.44722
		],
		"9839": [
			.19444,
			.69444,
			0,
			0,
			.44722
		],
		"10216": [
			.25,
			.75,
			0,
			0,
			.44722
		],
		"10217": [
			.25,
			.75,
			0,
			0,
			.44722
		],
		"10815": [
			0,
			.68611,
			0,
			0,
			.9
		],
		"10927": [
			.19667,
			.69667,
			0,
			0,
			.89444
		],
		"10928": [
			.19667,
			.69667,
			0,
			0,
			.89444
		],
		"57376": [
			.19444,
			.69444,
			0,
			0,
			0
		]
	},
	"Main-BoldItalic": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"33": [
			0,
			.69444,
			.11417,
			0,
			.38611
		],
		"34": [
			0,
			.69444,
			.07939,
			0,
			.62055
		],
		"35": [
			.19444,
			.69444,
			.06833,
			0,
			.94444
		],
		"37": [
			.05556,
			.75,
			.12861,
			0,
			.94444
		],
		"38": [
			0,
			.69444,
			.08528,
			0,
			.88555
		],
		"39": [
			0,
			.69444,
			.12945,
			0,
			.35555
		],
		"40": [
			.25,
			.75,
			.15806,
			0,
			.47333
		],
		"41": [
			.25,
			.75,
			.03306,
			0,
			.47333
		],
		"42": [
			0,
			.75,
			.14333,
			0,
			.59111
		],
		"43": [
			.10333,
			.60333,
			.03306,
			0,
			.88555
		],
		"44": [
			.19444,
			.14722,
			0,
			0,
			.35555
		],
		"45": [
			0,
			.44444,
			.02611,
			0,
			.41444
		],
		"46": [
			0,
			.14722,
			0,
			0,
			.35555
		],
		"47": [
			.25,
			.75,
			.15806,
			0,
			.59111
		],
		"48": [
			0,
			.64444,
			.13167,
			0,
			.59111
		],
		"49": [
			0,
			.64444,
			.13167,
			0,
			.59111
		],
		"50": [
			0,
			.64444,
			.13167,
			0,
			.59111
		],
		"51": [
			0,
			.64444,
			.13167,
			0,
			.59111
		],
		"52": [
			.19444,
			.64444,
			.13167,
			0,
			.59111
		],
		"53": [
			0,
			.64444,
			.13167,
			0,
			.59111
		],
		"54": [
			0,
			.64444,
			.13167,
			0,
			.59111
		],
		"55": [
			.19444,
			.64444,
			.13167,
			0,
			.59111
		],
		"56": [
			0,
			.64444,
			.13167,
			0,
			.59111
		],
		"57": [
			0,
			.64444,
			.13167,
			0,
			.59111
		],
		"58": [
			0,
			.44444,
			.06695,
			0,
			.35555
		],
		"59": [
			.19444,
			.44444,
			.06695,
			0,
			.35555
		],
		"61": [
			-.10889,
			.39111,
			.06833,
			0,
			.88555
		],
		"63": [
			0,
			.69444,
			.11472,
			0,
			.59111
		],
		"64": [
			0,
			.69444,
			.09208,
			0,
			.88555
		],
		"65": [
			0,
			.68611,
			0,
			0,
			.86555
		],
		"66": [
			0,
			.68611,
			.0992,
			0,
			.81666
		],
		"67": [
			0,
			.68611,
			.14208,
			0,
			.82666
		],
		"68": [
			0,
			.68611,
			.09062,
			0,
			.87555
		],
		"69": [
			0,
			.68611,
			.11431,
			0,
			.75666
		],
		"70": [
			0,
			.68611,
			.12903,
			0,
			.72722
		],
		"71": [
			0,
			.68611,
			.07347,
			0,
			.89527
		],
		"72": [
			0,
			.68611,
			.17208,
			0,
			.8961
		],
		"73": [
			0,
			.68611,
			.15681,
			0,
			.47166
		],
		"74": [
			0,
			.68611,
			.145,
			0,
			.61055
		],
		"75": [
			0,
			.68611,
			.14208,
			0,
			.89499
		],
		"76": [
			0,
			.68611,
			0,
			0,
			.69777
		],
		"77": [
			0,
			.68611,
			.17208,
			0,
			1.07277
		],
		"78": [
			0,
			.68611,
			.17208,
			0,
			.8961
		],
		"79": [
			0,
			.68611,
			.09062,
			0,
			.85499
		],
		"80": [
			0,
			.68611,
			.0992,
			0,
			.78721
		],
		"81": [
			.19444,
			.68611,
			.09062,
			0,
			.85499
		],
		"82": [
			0,
			.68611,
			.02559,
			0,
			.85944
		],
		"83": [
			0,
			.68611,
			.11264,
			0,
			.64999
		],
		"84": [
			0,
			.68611,
			.12903,
			0,
			.7961
		],
		"85": [
			0,
			.68611,
			.17208,
			0,
			.88083
		],
		"86": [
			0,
			.68611,
			.18625,
			0,
			.86555
		],
		"87": [
			0,
			.68611,
			.18625,
			0,
			1.15999
		],
		"88": [
			0,
			.68611,
			.15681,
			0,
			.86555
		],
		"89": [
			0,
			.68611,
			.19803,
			0,
			.86555
		],
		"90": [
			0,
			.68611,
			.14208,
			0,
			.70888
		],
		"91": [
			.25,
			.75,
			.1875,
			0,
			.35611
		],
		"93": [
			.25,
			.75,
			.09972,
			0,
			.35611
		],
		"94": [
			0,
			.69444,
			.06709,
			0,
			.59111
		],
		"95": [
			.31,
			.13444,
			.09811,
			0,
			.59111
		],
		"97": [
			0,
			.44444,
			.09426,
			0,
			.59111
		],
		"98": [
			0,
			.69444,
			.07861,
			0,
			.53222
		],
		"99": [
			0,
			.44444,
			.05222,
			0,
			.53222
		],
		"100": [
			0,
			.69444,
			.10861,
			0,
			.59111
		],
		"101": [
			0,
			.44444,
			.085,
			0,
			.53222
		],
		"102": [
			.19444,
			.69444,
			.21778,
			0,
			.4
		],
		"103": [
			.19444,
			.44444,
			.105,
			0,
			.53222
		],
		"104": [
			0,
			.69444,
			.09426,
			0,
			.59111
		],
		"105": [
			0,
			.69326,
			.11387,
			0,
			.35555
		],
		"106": [
			.19444,
			.69326,
			.1672,
			0,
			.35555
		],
		"107": [
			0,
			.69444,
			.11111,
			0,
			.53222
		],
		"108": [
			0,
			.69444,
			.10861,
			0,
			.29666
		],
		"109": [
			0,
			.44444,
			.09426,
			0,
			.94444
		],
		"110": [
			0,
			.44444,
			.09426,
			0,
			.64999
		],
		"111": [
			0,
			.44444,
			.07861,
			0,
			.59111
		],
		"112": [
			.19444,
			.44444,
			.07861,
			0,
			.59111
		],
		"113": [
			.19444,
			.44444,
			.105,
			0,
			.53222
		],
		"114": [
			0,
			.44444,
			.11111,
			0,
			.50167
		],
		"115": [
			0,
			.44444,
			.08167,
			0,
			.48694
		],
		"116": [
			0,
			.63492,
			.09639,
			0,
			.385
		],
		"117": [
			0,
			.44444,
			.09426,
			0,
			.62055
		],
		"118": [
			0,
			.44444,
			.11111,
			0,
			.53222
		],
		"119": [
			0,
			.44444,
			.11111,
			0,
			.76777
		],
		"120": [
			0,
			.44444,
			.12583,
			0,
			.56055
		],
		"121": [
			.19444,
			.44444,
			.105,
			0,
			.56166
		],
		"122": [
			0,
			.44444,
			.13889,
			0,
			.49055
		],
		"126": [
			.35,
			.34444,
			.11472,
			0,
			.59111
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"168": [
			0,
			.69444,
			.11473,
			0,
			.59111
		],
		"176": [
			0,
			.69444,
			0,
			0,
			.94888
		],
		"184": [
			.17014,
			0,
			0,
			0,
			.53222
		],
		"198": [
			0,
			.68611,
			.11431,
			0,
			1.02277
		],
		"216": [
			.04861,
			.73472,
			.09062,
			0,
			.88555
		],
		"223": [
			.19444,
			.69444,
			.09736,
			0,
			.665
		],
		"230": [
			0,
			.44444,
			.085,
			0,
			.82666
		],
		"248": [
			.09722,
			.54167,
			.09458,
			0,
			.59111
		],
		"305": [
			0,
			.44444,
			.09426,
			0,
			.35555
		],
		"338": [
			0,
			.68611,
			.11431,
			0,
			1.14054
		],
		"339": [
			0,
			.44444,
			.085,
			0,
			.82666
		],
		"567": [
			.19444,
			.44444,
			.04611,
			0,
			.385
		],
		"710": [
			0,
			.69444,
			.06709,
			0,
			.59111
		],
		"711": [
			0,
			.63194,
			.08271,
			0,
			.59111
		],
		"713": [
			0,
			.59444,
			.10444,
			0,
			.59111
		],
		"714": [
			0,
			.69444,
			.08528,
			0,
			.59111
		],
		"715": [
			0,
			.69444,
			0,
			0,
			.59111
		],
		"728": [
			0,
			.69444,
			.10333,
			0,
			.59111
		],
		"729": [
			0,
			.69444,
			.12945,
			0,
			.35555
		],
		"730": [
			0,
			.69444,
			0,
			0,
			.94888
		],
		"732": [
			0,
			.69444,
			.11472,
			0,
			.59111
		],
		"733": [
			0,
			.69444,
			.11472,
			0,
			.59111
		],
		"915": [
			0,
			.68611,
			.12903,
			0,
			.69777
		],
		"916": [
			0,
			.68611,
			0,
			0,
			.94444
		],
		"920": [
			0,
			.68611,
			.09062,
			0,
			.88555
		],
		"923": [
			0,
			.68611,
			0,
			0,
			.80666
		],
		"926": [
			0,
			.68611,
			.15092,
			0,
			.76777
		],
		"928": [
			0,
			.68611,
			.17208,
			0,
			.8961
		],
		"931": [
			0,
			.68611,
			.11431,
			0,
			.82666
		],
		"933": [
			0,
			.68611,
			.10778,
			0,
			.88555
		],
		"934": [
			0,
			.68611,
			.05632,
			0,
			.82666
		],
		"936": [
			0,
			.68611,
			.10778,
			0,
			.88555
		],
		"937": [
			0,
			.68611,
			.0992,
			0,
			.82666
		],
		"8211": [
			0,
			.44444,
			.09811,
			0,
			.59111
		],
		"8212": [
			0,
			.44444,
			.09811,
			0,
			1.18221
		],
		"8216": [
			0,
			.69444,
			.12945,
			0,
			.35555
		],
		"8217": [
			0,
			.69444,
			.12945,
			0,
			.35555
		],
		"8220": [
			0,
			.69444,
			.16772,
			0,
			.62055
		],
		"8221": [
			0,
			.69444,
			.07939,
			0,
			.62055
		]
	},
	"Main-Italic": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"33": [
			0,
			.69444,
			.12417,
			0,
			.30667
		],
		"34": [
			0,
			.69444,
			.06961,
			0,
			.51444
		],
		"35": [
			.19444,
			.69444,
			.06616,
			0,
			.81777
		],
		"37": [
			.05556,
			.75,
			.13639,
			0,
			.81777
		],
		"38": [
			0,
			.69444,
			.09694,
			0,
			.76666
		],
		"39": [
			0,
			.69444,
			.12417,
			0,
			.30667
		],
		"40": [
			.25,
			.75,
			.16194,
			0,
			.40889
		],
		"41": [
			.25,
			.75,
			.03694,
			0,
			.40889
		],
		"42": [
			0,
			.75,
			.14917,
			0,
			.51111
		],
		"43": [
			.05667,
			.56167,
			.03694,
			0,
			.76666
		],
		"44": [
			.19444,
			.10556,
			0,
			0,
			.30667
		],
		"45": [
			0,
			.43056,
			.02826,
			0,
			.35778
		],
		"46": [
			0,
			.10556,
			0,
			0,
			.30667
		],
		"47": [
			.25,
			.75,
			.16194,
			0,
			.51111
		],
		"48": [
			0,
			.64444,
			.13556,
			0,
			.51111
		],
		"49": [
			0,
			.64444,
			.13556,
			0,
			.51111
		],
		"50": [
			0,
			.64444,
			.13556,
			0,
			.51111
		],
		"51": [
			0,
			.64444,
			.13556,
			0,
			.51111
		],
		"52": [
			.19444,
			.64444,
			.13556,
			0,
			.51111
		],
		"53": [
			0,
			.64444,
			.13556,
			0,
			.51111
		],
		"54": [
			0,
			.64444,
			.13556,
			0,
			.51111
		],
		"55": [
			.19444,
			.64444,
			.13556,
			0,
			.51111
		],
		"56": [
			0,
			.64444,
			.13556,
			0,
			.51111
		],
		"57": [
			0,
			.64444,
			.13556,
			0,
			.51111
		],
		"58": [
			0,
			.43056,
			.0582,
			0,
			.30667
		],
		"59": [
			.19444,
			.43056,
			.0582,
			0,
			.30667
		],
		"61": [
			-.13313,
			.36687,
			.06616,
			0,
			.76666
		],
		"63": [
			0,
			.69444,
			.1225,
			0,
			.51111
		],
		"64": [
			0,
			.69444,
			.09597,
			0,
			.76666
		],
		"65": [
			0,
			.68333,
			0,
			0,
			.74333
		],
		"66": [
			0,
			.68333,
			.10257,
			0,
			.70389
		],
		"67": [
			0,
			.68333,
			.14528,
			0,
			.71555
		],
		"68": [
			0,
			.68333,
			.09403,
			0,
			.755
		],
		"69": [
			0,
			.68333,
			.12028,
			0,
			.67833
		],
		"70": [
			0,
			.68333,
			.13305,
			0,
			.65277
		],
		"71": [
			0,
			.68333,
			.08722,
			0,
			.77361
		],
		"72": [
			0,
			.68333,
			.16389,
			0,
			.74333
		],
		"73": [
			0,
			.68333,
			.15806,
			0,
			.38555
		],
		"74": [
			0,
			.68333,
			.14028,
			0,
			.525
		],
		"75": [
			0,
			.68333,
			.14528,
			0,
			.76888
		],
		"76": [
			0,
			.68333,
			0,
			0,
			.62722
		],
		"77": [
			0,
			.68333,
			.16389,
			0,
			.89666
		],
		"78": [
			0,
			.68333,
			.16389,
			0,
			.74333
		],
		"79": [
			0,
			.68333,
			.09403,
			0,
			.76666
		],
		"80": [
			0,
			.68333,
			.10257,
			0,
			.67833
		],
		"81": [
			.19444,
			.68333,
			.09403,
			0,
			.76666
		],
		"82": [
			0,
			.68333,
			.03868,
			0,
			.72944
		],
		"83": [
			0,
			.68333,
			.11972,
			0,
			.56222
		],
		"84": [
			0,
			.68333,
			.13305,
			0,
			.71555
		],
		"85": [
			0,
			.68333,
			.16389,
			0,
			.74333
		],
		"86": [
			0,
			.68333,
			.18361,
			0,
			.74333
		],
		"87": [
			0,
			.68333,
			.18361,
			0,
			.99888
		],
		"88": [
			0,
			.68333,
			.15806,
			0,
			.74333
		],
		"89": [
			0,
			.68333,
			.19383,
			0,
			.74333
		],
		"90": [
			0,
			.68333,
			.14528,
			0,
			.61333
		],
		"91": [
			.25,
			.75,
			.1875,
			0,
			.30667
		],
		"93": [
			.25,
			.75,
			.10528,
			0,
			.30667
		],
		"94": [
			0,
			.69444,
			.06646,
			0,
			.51111
		],
		"95": [
			.31,
			.12056,
			.09208,
			0,
			.51111
		],
		"97": [
			0,
			.43056,
			.07671,
			0,
			.51111
		],
		"98": [
			0,
			.69444,
			.06312,
			0,
			.46
		],
		"99": [
			0,
			.43056,
			.05653,
			0,
			.46
		],
		"100": [
			0,
			.69444,
			.10333,
			0,
			.51111
		],
		"101": [
			0,
			.43056,
			.07514,
			0,
			.46
		],
		"102": [
			.19444,
			.69444,
			.21194,
			0,
			.30667
		],
		"103": [
			.19444,
			.43056,
			.08847,
			0,
			.46
		],
		"104": [
			0,
			.69444,
			.07671,
			0,
			.51111
		],
		"105": [
			0,
			.65536,
			.1019,
			0,
			.30667
		],
		"106": [
			.19444,
			.65536,
			.14467,
			0,
			.30667
		],
		"107": [
			0,
			.69444,
			.10764,
			0,
			.46
		],
		"108": [
			0,
			.69444,
			.10333,
			0,
			.25555
		],
		"109": [
			0,
			.43056,
			.07671,
			0,
			.81777
		],
		"110": [
			0,
			.43056,
			.07671,
			0,
			.56222
		],
		"111": [
			0,
			.43056,
			.06312,
			0,
			.51111
		],
		"112": [
			.19444,
			.43056,
			.06312,
			0,
			.51111
		],
		"113": [
			.19444,
			.43056,
			.08847,
			0,
			.46
		],
		"114": [
			0,
			.43056,
			.10764,
			0,
			.42166
		],
		"115": [
			0,
			.43056,
			.08208,
			0,
			.40889
		],
		"116": [
			0,
			.61508,
			.09486,
			0,
			.33222
		],
		"117": [
			0,
			.43056,
			.07671,
			0,
			.53666
		],
		"118": [
			0,
			.43056,
			.10764,
			0,
			.46
		],
		"119": [
			0,
			.43056,
			.10764,
			0,
			.66444
		],
		"120": [
			0,
			.43056,
			.12042,
			0,
			.46389
		],
		"121": [
			.19444,
			.43056,
			.08847,
			0,
			.48555
		],
		"122": [
			0,
			.43056,
			.12292,
			0,
			.40889
		],
		"126": [
			.35,
			.31786,
			.11585,
			0,
			.51111
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"168": [
			0,
			.66786,
			.10474,
			0,
			.51111
		],
		"176": [
			0,
			.69444,
			0,
			0,
			.83129
		],
		"184": [
			.17014,
			0,
			0,
			0,
			.46
		],
		"198": [
			0,
			.68333,
			.12028,
			0,
			.88277
		],
		"216": [
			.04861,
			.73194,
			.09403,
			0,
			.76666
		],
		"223": [
			.19444,
			.69444,
			.10514,
			0,
			.53666
		],
		"230": [
			0,
			.43056,
			.07514,
			0,
			.71555
		],
		"248": [
			.09722,
			.52778,
			.09194,
			0,
			.51111
		],
		"338": [
			0,
			.68333,
			.12028,
			0,
			.98499
		],
		"339": [
			0,
			.43056,
			.07514,
			0,
			.71555
		],
		"710": [
			0,
			.69444,
			.06646,
			0,
			.51111
		],
		"711": [
			0,
			.62847,
			.08295,
			0,
			.51111
		],
		"713": [
			0,
			.56167,
			.10333,
			0,
			.51111
		],
		"714": [
			0,
			.69444,
			.09694,
			0,
			.51111
		],
		"715": [
			0,
			.69444,
			0,
			0,
			.51111
		],
		"728": [
			0,
			.69444,
			.10806,
			0,
			.51111
		],
		"729": [
			0,
			.66786,
			.11752,
			0,
			.30667
		],
		"730": [
			0,
			.69444,
			0,
			0,
			.83129
		],
		"732": [
			0,
			.66786,
			.11585,
			0,
			.51111
		],
		"733": [
			0,
			.69444,
			.1225,
			0,
			.51111
		],
		"915": [
			0,
			.68333,
			.13305,
			0,
			.62722
		],
		"916": [
			0,
			.68333,
			0,
			0,
			.81777
		],
		"920": [
			0,
			.68333,
			.09403,
			0,
			.76666
		],
		"923": [
			0,
			.68333,
			0,
			0,
			.69222
		],
		"926": [
			0,
			.68333,
			.15294,
			0,
			.66444
		],
		"928": [
			0,
			.68333,
			.16389,
			0,
			.74333
		],
		"931": [
			0,
			.68333,
			.12028,
			0,
			.71555
		],
		"933": [
			0,
			.68333,
			.11111,
			0,
			.76666
		],
		"934": [
			0,
			.68333,
			.05986,
			0,
			.71555
		],
		"936": [
			0,
			.68333,
			.11111,
			0,
			.76666
		],
		"937": [
			0,
			.68333,
			.10257,
			0,
			.71555
		],
		"8211": [
			0,
			.43056,
			.09208,
			0,
			.51111
		],
		"8212": [
			0,
			.43056,
			.09208,
			0,
			1.02222
		],
		"8216": [
			0,
			.69444,
			.12417,
			0,
			.30667
		],
		"8217": [
			0,
			.69444,
			.12417,
			0,
			.30667
		],
		"8220": [
			0,
			.69444,
			.1685,
			0,
			.51444
		],
		"8221": [
			0,
			.69444,
			.06961,
			0,
			.51444
		],
		"8463": [
			0,
			.68889,
			0,
			0,
			.54028
		]
	},
	"Main-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"33": [
			0,
			.69444,
			0,
			0,
			.27778
		],
		"34": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"35": [
			.19444,
			.69444,
			0,
			0,
			.83334
		],
		"36": [
			.05556,
			.75,
			0,
			0,
			.5
		],
		"37": [
			.05556,
			.75,
			0,
			0,
			.83334
		],
		"38": [
			0,
			.69444,
			0,
			0,
			.77778
		],
		"39": [
			0,
			.69444,
			0,
			0,
			.27778
		],
		"40": [
			.25,
			.75,
			0,
			0,
			.38889
		],
		"41": [
			.25,
			.75,
			0,
			0,
			.38889
		],
		"42": [
			0,
			.75,
			0,
			0,
			.5
		],
		"43": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"44": [
			.19444,
			.10556,
			0,
			0,
			.27778
		],
		"45": [
			0,
			.43056,
			0,
			0,
			.33333
		],
		"46": [
			0,
			.10556,
			0,
			0,
			.27778
		],
		"47": [
			.25,
			.75,
			0,
			0,
			.5
		],
		"48": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"49": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"50": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"51": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"52": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"53": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"54": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"55": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"56": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"57": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"58": [
			0,
			.43056,
			0,
			0,
			.27778
		],
		"59": [
			.19444,
			.43056,
			0,
			0,
			.27778
		],
		"60": [
			.0391,
			.5391,
			0,
			0,
			.77778
		],
		"61": [
			-.13313,
			.36687,
			0,
			0,
			.77778
		],
		"62": [
			.0391,
			.5391,
			0,
			0,
			.77778
		],
		"63": [
			0,
			.69444,
			0,
			0,
			.47222
		],
		"64": [
			0,
			.69444,
			0,
			0,
			.77778
		],
		"65": [
			0,
			.68333,
			0,
			0,
			.75
		],
		"66": [
			0,
			.68333,
			0,
			0,
			.70834
		],
		"67": [
			0,
			.68333,
			0,
			0,
			.72222
		],
		"68": [
			0,
			.68333,
			0,
			0,
			.76389
		],
		"69": [
			0,
			.68333,
			0,
			0,
			.68056
		],
		"70": [
			0,
			.68333,
			0,
			0,
			.65278
		],
		"71": [
			0,
			.68333,
			0,
			0,
			.78472
		],
		"72": [
			0,
			.68333,
			0,
			0,
			.75
		],
		"73": [
			0,
			.68333,
			0,
			0,
			.36111
		],
		"74": [
			0,
			.68333,
			0,
			0,
			.51389
		],
		"75": [
			0,
			.68333,
			0,
			0,
			.77778
		],
		"76": [
			0,
			.68333,
			0,
			0,
			.625
		],
		"77": [
			0,
			.68333,
			0,
			0,
			.91667
		],
		"78": [
			0,
			.68333,
			0,
			0,
			.75
		],
		"79": [
			0,
			.68333,
			0,
			0,
			.77778
		],
		"80": [
			0,
			.68333,
			0,
			0,
			.68056
		],
		"81": [
			.19444,
			.68333,
			0,
			0,
			.77778
		],
		"82": [
			0,
			.68333,
			0,
			0,
			.73611
		],
		"83": [
			0,
			.68333,
			0,
			0,
			.55556
		],
		"84": [
			0,
			.68333,
			0,
			0,
			.72222
		],
		"85": [
			0,
			.68333,
			0,
			0,
			.75
		],
		"86": [
			0,
			.68333,
			.01389,
			0,
			.75
		],
		"87": [
			0,
			.68333,
			.01389,
			0,
			1.02778
		],
		"88": [
			0,
			.68333,
			0,
			0,
			.75
		],
		"89": [
			0,
			.68333,
			.025,
			0,
			.75
		],
		"90": [
			0,
			.68333,
			0,
			0,
			.61111
		],
		"91": [
			.25,
			.75,
			0,
			0,
			.27778
		],
		"92": [
			.25,
			.75,
			0,
			0,
			.5
		],
		"93": [
			.25,
			.75,
			0,
			0,
			.27778
		],
		"94": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"95": [
			.31,
			.12056,
			.02778,
			0,
			.5
		],
		"97": [
			0,
			.43056,
			0,
			0,
			.5
		],
		"98": [
			0,
			.69444,
			0,
			0,
			.55556
		],
		"99": [
			0,
			.43056,
			0,
			0,
			.44445
		],
		"100": [
			0,
			.69444,
			0,
			0,
			.55556
		],
		"101": [
			0,
			.43056,
			0,
			0,
			.44445
		],
		"102": [
			0,
			.69444,
			.07778,
			0,
			.30556
		],
		"103": [
			.19444,
			.43056,
			.01389,
			0,
			.5
		],
		"104": [
			0,
			.69444,
			0,
			0,
			.55556
		],
		"105": [
			0,
			.66786,
			0,
			0,
			.27778
		],
		"106": [
			.19444,
			.66786,
			0,
			0,
			.30556
		],
		"107": [
			0,
			.69444,
			0,
			0,
			.52778
		],
		"108": [
			0,
			.69444,
			0,
			0,
			.27778
		],
		"109": [
			0,
			.43056,
			0,
			0,
			.83334
		],
		"110": [
			0,
			.43056,
			0,
			0,
			.55556
		],
		"111": [
			0,
			.43056,
			0,
			0,
			.5
		],
		"112": [
			.19444,
			.43056,
			0,
			0,
			.55556
		],
		"113": [
			.19444,
			.43056,
			0,
			0,
			.52778
		],
		"114": [
			0,
			.43056,
			0,
			0,
			.39167
		],
		"115": [
			0,
			.43056,
			0,
			0,
			.39445
		],
		"116": [
			0,
			.61508,
			0,
			0,
			.38889
		],
		"117": [
			0,
			.43056,
			0,
			0,
			.55556
		],
		"118": [
			0,
			.43056,
			.01389,
			0,
			.52778
		],
		"119": [
			0,
			.43056,
			.01389,
			0,
			.72222
		],
		"120": [
			0,
			.43056,
			0,
			0,
			.52778
		],
		"121": [
			.19444,
			.43056,
			.01389,
			0,
			.52778
		],
		"122": [
			0,
			.43056,
			0,
			0,
			.44445
		],
		"123": [
			.25,
			.75,
			0,
			0,
			.5
		],
		"124": [
			.25,
			.75,
			0,
			0,
			.27778
		],
		"125": [
			.25,
			.75,
			0,
			0,
			.5
		],
		"126": [
			.35,
			.31786,
			0,
			0,
			.5
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"163": [
			0,
			.69444,
			0,
			0,
			.76909
		],
		"167": [
			.19444,
			.69444,
			0,
			0,
			.44445
		],
		"168": [
			0,
			.66786,
			0,
			0,
			.5
		],
		"172": [
			0,
			.43056,
			0,
			0,
			.66667
		],
		"176": [
			0,
			.69444,
			0,
			0,
			.75
		],
		"177": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"182": [
			.19444,
			.69444,
			0,
			0,
			.61111
		],
		"184": [
			.17014,
			0,
			0,
			0,
			.44445
		],
		"198": [
			0,
			.68333,
			0,
			0,
			.90278
		],
		"215": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"216": [
			.04861,
			.73194,
			0,
			0,
			.77778
		],
		"223": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"230": [
			0,
			.43056,
			0,
			0,
			.72222
		],
		"247": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"248": [
			.09722,
			.52778,
			0,
			0,
			.5
		],
		"305": [
			0,
			.43056,
			0,
			0,
			.27778
		],
		"338": [
			0,
			.68333,
			0,
			0,
			1.01389
		],
		"339": [
			0,
			.43056,
			0,
			0,
			.77778
		],
		"567": [
			.19444,
			.43056,
			0,
			0,
			.30556
		],
		"710": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"711": [
			0,
			.62847,
			0,
			0,
			.5
		],
		"713": [
			0,
			.56778,
			0,
			0,
			.5
		],
		"714": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"715": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"728": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"729": [
			0,
			.66786,
			0,
			0,
			.27778
		],
		"730": [
			0,
			.69444,
			0,
			0,
			.75
		],
		"732": [
			0,
			.66786,
			0,
			0,
			.5
		],
		"733": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"915": [
			0,
			.68333,
			0,
			0,
			.625
		],
		"916": [
			0,
			.68333,
			0,
			0,
			.83334
		],
		"920": [
			0,
			.68333,
			0,
			0,
			.77778
		],
		"923": [
			0,
			.68333,
			0,
			0,
			.69445
		],
		"926": [
			0,
			.68333,
			0,
			0,
			.66667
		],
		"928": [
			0,
			.68333,
			0,
			0,
			.75
		],
		"931": [
			0,
			.68333,
			0,
			0,
			.72222
		],
		"933": [
			0,
			.68333,
			0,
			0,
			.77778
		],
		"934": [
			0,
			.68333,
			0,
			0,
			.72222
		],
		"936": [
			0,
			.68333,
			0,
			0,
			.77778
		],
		"937": [
			0,
			.68333,
			0,
			0,
			.72222
		],
		"8211": [
			0,
			.43056,
			.02778,
			0,
			.5
		],
		"8212": [
			0,
			.43056,
			.02778,
			0,
			1
		],
		"8216": [
			0,
			.69444,
			0,
			0,
			.27778
		],
		"8217": [
			0,
			.69444,
			0,
			0,
			.27778
		],
		"8220": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"8221": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"8224": [
			.19444,
			.69444,
			0,
			0,
			.44445
		],
		"8225": [
			.19444,
			.69444,
			0,
			0,
			.44445
		],
		"8230": [
			0,
			.123,
			0,
			0,
			1.172
		],
		"8242": [
			0,
			.55556,
			0,
			0,
			.275
		],
		"8407": [
			0,
			.71444,
			.15382,
			0,
			.5
		],
		"8463": [
			0,
			.68889,
			0,
			0,
			.54028
		],
		"8465": [
			0,
			.69444,
			0,
			0,
			.72222
		],
		"8467": [
			0,
			.69444,
			0,
			.11111,
			.41667
		],
		"8472": [
			.19444,
			.43056,
			0,
			.11111,
			.63646
		],
		"8476": [
			0,
			.69444,
			0,
			0,
			.72222
		],
		"8501": [
			0,
			.69444,
			0,
			0,
			.61111
		],
		"8592": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8593": [
			.19444,
			.69444,
			0,
			0,
			.5
		],
		"8594": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8595": [
			.19444,
			.69444,
			0,
			0,
			.5
		],
		"8596": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8597": [
			.25,
			.75,
			0,
			0,
			.5
		],
		"8598": [
			.19444,
			.69444,
			0,
			0,
			1
		],
		"8599": [
			.19444,
			.69444,
			0,
			0,
			1
		],
		"8600": [
			.19444,
			.69444,
			0,
			0,
			1
		],
		"8601": [
			.19444,
			.69444,
			0,
			0,
			1
		],
		"8614": [
			.011,
			.511,
			0,
			0,
			1
		],
		"8617": [
			.011,
			.511,
			0,
			0,
			1.126
		],
		"8618": [
			.011,
			.511,
			0,
			0,
			1.126
		],
		"8636": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8637": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8640": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8641": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8652": [
			.011,
			.671,
			0,
			0,
			1
		],
		"8656": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8657": [
			.19444,
			.69444,
			0,
			0,
			.61111
		],
		"8658": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8659": [
			.19444,
			.69444,
			0,
			0,
			.61111
		],
		"8660": [
			-.13313,
			.36687,
			0,
			0,
			1
		],
		"8661": [
			.25,
			.75,
			0,
			0,
			.61111
		],
		"8704": [
			0,
			.69444,
			0,
			0,
			.55556
		],
		"8706": [
			0,
			.69444,
			.05556,
			.08334,
			.5309
		],
		"8707": [
			0,
			.69444,
			0,
			0,
			.55556
		],
		"8709": [
			.05556,
			.75,
			0,
			0,
			.5
		],
		"8711": [
			0,
			.68333,
			0,
			0,
			.83334
		],
		"8712": [
			.0391,
			.5391,
			0,
			0,
			.66667
		],
		"8715": [
			.0391,
			.5391,
			0,
			0,
			.66667
		],
		"8722": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"8723": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"8725": [
			.25,
			.75,
			0,
			0,
			.5
		],
		"8726": [
			.25,
			.75,
			0,
			0,
			.5
		],
		"8727": [
			-.03472,
			.46528,
			0,
			0,
			.5
		],
		"8728": [
			-.05555,
			.44445,
			0,
			0,
			.5
		],
		"8729": [
			-.05555,
			.44445,
			0,
			0,
			.5
		],
		"8730": [
			.2,
			.8,
			0,
			0,
			.83334
		],
		"8733": [
			0,
			.43056,
			0,
			0,
			.77778
		],
		"8734": [
			0,
			.43056,
			0,
			0,
			1
		],
		"8736": [
			0,
			.69224,
			0,
			0,
			.72222
		],
		"8739": [
			.25,
			.75,
			0,
			0,
			.27778
		],
		"8741": [
			.25,
			.75,
			0,
			0,
			.5
		],
		"8743": [
			0,
			.55556,
			0,
			0,
			.66667
		],
		"8744": [
			0,
			.55556,
			0,
			0,
			.66667
		],
		"8745": [
			0,
			.55556,
			0,
			0,
			.66667
		],
		"8746": [
			0,
			.55556,
			0,
			0,
			.66667
		],
		"8747": [
			.19444,
			.69444,
			.11111,
			0,
			.41667
		],
		"8764": [
			-.13313,
			.36687,
			0,
			0,
			.77778
		],
		"8768": [
			.19444,
			.69444,
			0,
			0,
			.27778
		],
		"8771": [
			-.03625,
			.46375,
			0,
			0,
			.77778
		],
		"8773": [
			-.022,
			.589,
			0,
			0,
			.778
		],
		"8776": [
			-.01688,
			.48312,
			0,
			0,
			.77778
		],
		"8781": [
			-.03625,
			.46375,
			0,
			0,
			.77778
		],
		"8784": [
			-.133,
			.673,
			0,
			0,
			.778
		],
		"8801": [
			-.03625,
			.46375,
			0,
			0,
			.77778
		],
		"8804": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"8805": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"8810": [
			.0391,
			.5391,
			0,
			0,
			1
		],
		"8811": [
			.0391,
			.5391,
			0,
			0,
			1
		],
		"8826": [
			.0391,
			.5391,
			0,
			0,
			.77778
		],
		"8827": [
			.0391,
			.5391,
			0,
			0,
			.77778
		],
		"8834": [
			.0391,
			.5391,
			0,
			0,
			.77778
		],
		"8835": [
			.0391,
			.5391,
			0,
			0,
			.77778
		],
		"8838": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"8839": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"8846": [
			0,
			.55556,
			0,
			0,
			.66667
		],
		"8849": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"8850": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"8851": [
			0,
			.55556,
			0,
			0,
			.66667
		],
		"8852": [
			0,
			.55556,
			0,
			0,
			.66667
		],
		"8853": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"8854": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"8855": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"8856": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"8857": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"8866": [
			0,
			.69444,
			0,
			0,
			.61111
		],
		"8867": [
			0,
			.69444,
			0,
			0,
			.61111
		],
		"8868": [
			0,
			.69444,
			0,
			0,
			.77778
		],
		"8869": [
			0,
			.69444,
			0,
			0,
			.77778
		],
		"8872": [
			.249,
			.75,
			0,
			0,
			.867
		],
		"8900": [
			-.05555,
			.44445,
			0,
			0,
			.5
		],
		"8901": [
			-.05555,
			.44445,
			0,
			0,
			.27778
		],
		"8902": [
			-.03472,
			.46528,
			0,
			0,
			.5
		],
		"8904": [
			.005,
			.505,
			0,
			0,
			.9
		],
		"8942": [
			.03,
			.903,
			0,
			0,
			.278
		],
		"8943": [
			-.19,
			.313,
			0,
			0,
			1.172
		],
		"8945": [
			-.1,
			.823,
			0,
			0,
			1.282
		],
		"8968": [
			.25,
			.75,
			0,
			0,
			.44445
		],
		"8969": [
			.25,
			.75,
			0,
			0,
			.44445
		],
		"8970": [
			.25,
			.75,
			0,
			0,
			.44445
		],
		"8971": [
			.25,
			.75,
			0,
			0,
			.44445
		],
		"8994": [
			-.14236,
			.35764,
			0,
			0,
			1
		],
		"8995": [
			-.14236,
			.35764,
			0,
			0,
			1
		],
		"9136": [
			.244,
			.744,
			0,
			0,
			.412
		],
		"9137": [
			.244,
			.745,
			0,
			0,
			.412
		],
		"9651": [
			.19444,
			.69444,
			0,
			0,
			.88889
		],
		"9657": [
			-.03472,
			.46528,
			0,
			0,
			.5
		],
		"9661": [
			.19444,
			.69444,
			0,
			0,
			.88889
		],
		"9667": [
			-.03472,
			.46528,
			0,
			0,
			.5
		],
		"9711": [
			.19444,
			.69444,
			0,
			0,
			1
		],
		"9824": [
			.12963,
			.69444,
			0,
			0,
			.77778
		],
		"9825": [
			.12963,
			.69444,
			0,
			0,
			.77778
		],
		"9826": [
			.12963,
			.69444,
			0,
			0,
			.77778
		],
		"9827": [
			.12963,
			.69444,
			0,
			0,
			.77778
		],
		"9837": [
			0,
			.75,
			0,
			0,
			.38889
		],
		"9838": [
			.19444,
			.69444,
			0,
			0,
			.38889
		],
		"9839": [
			.19444,
			.69444,
			0,
			0,
			.38889
		],
		"10216": [
			.25,
			.75,
			0,
			0,
			.38889
		],
		"10217": [
			.25,
			.75,
			0,
			0,
			.38889
		],
		"10222": [
			.244,
			.744,
			0,
			0,
			.412
		],
		"10223": [
			.244,
			.745,
			0,
			0,
			.412
		],
		"10229": [
			.011,
			.511,
			0,
			0,
			1.609
		],
		"10230": [
			.011,
			.511,
			0,
			0,
			1.638
		],
		"10231": [
			.011,
			.511,
			0,
			0,
			1.859
		],
		"10232": [
			.024,
			.525,
			0,
			0,
			1.609
		],
		"10233": [
			.024,
			.525,
			0,
			0,
			1.638
		],
		"10234": [
			.024,
			.525,
			0,
			0,
			1.858
		],
		"10236": [
			.011,
			.511,
			0,
			0,
			1.638
		],
		"10815": [
			0,
			.68333,
			0,
			0,
			.75
		],
		"10927": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"10928": [
			.13597,
			.63597,
			0,
			0,
			.77778
		],
		"57376": [
			.19444,
			.69444,
			0,
			0,
			0
		]
	},
	"Math-BoldItalic": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"48": [
			0,
			.44444,
			0,
			0,
			.575
		],
		"49": [
			0,
			.44444,
			0,
			0,
			.575
		],
		"50": [
			0,
			.44444,
			0,
			0,
			.575
		],
		"51": [
			.19444,
			.44444,
			0,
			0,
			.575
		],
		"52": [
			.19444,
			.44444,
			0,
			0,
			.575
		],
		"53": [
			.19444,
			.44444,
			0,
			0,
			.575
		],
		"54": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"55": [
			.19444,
			.44444,
			0,
			0,
			.575
		],
		"56": [
			0,
			.64444,
			0,
			0,
			.575
		],
		"57": [
			.19444,
			.44444,
			0,
			0,
			.575
		],
		"65": [
			0,
			.68611,
			0,
			0,
			.86944
		],
		"66": [
			0,
			.68611,
			.04835,
			0,
			.8664
		],
		"67": [
			0,
			.68611,
			.06979,
			0,
			.81694
		],
		"68": [
			0,
			.68611,
			.03194,
			0,
			.93812
		],
		"69": [
			0,
			.68611,
			.05451,
			0,
			.81007
		],
		"70": [
			0,
			.68611,
			.15972,
			0,
			.68889
		],
		"71": [
			0,
			.68611,
			0,
			0,
			.88673
		],
		"72": [
			0,
			.68611,
			.08229,
			0,
			.98229
		],
		"73": [
			0,
			.68611,
			.07778,
			0,
			.51111
		],
		"74": [
			0,
			.68611,
			.10069,
			0,
			.63125
		],
		"75": [
			0,
			.68611,
			.06979,
			0,
			.97118
		],
		"76": [
			0,
			.68611,
			0,
			0,
			.75555
		],
		"77": [
			0,
			.68611,
			.11424,
			0,
			1.14201
		],
		"78": [
			0,
			.68611,
			.11424,
			0,
			.95034
		],
		"79": [
			0,
			.68611,
			.03194,
			0,
			.83666
		],
		"80": [
			0,
			.68611,
			.15972,
			0,
			.72309
		],
		"81": [
			.19444,
			.68611,
			0,
			0,
			.86861
		],
		"82": [
			0,
			.68611,
			.00421,
			0,
			.87235
		],
		"83": [
			0,
			.68611,
			.05382,
			0,
			.69271
		],
		"84": [
			0,
			.68611,
			.15972,
			0,
			.63663
		],
		"85": [
			0,
			.68611,
			.11424,
			0,
			.80027
		],
		"86": [
			0,
			.68611,
			.25555,
			0,
			.67778
		],
		"87": [
			0,
			.68611,
			.15972,
			0,
			1.09305
		],
		"88": [
			0,
			.68611,
			.07778,
			0,
			.94722
		],
		"89": [
			0,
			.68611,
			.25555,
			0,
			.67458
		],
		"90": [
			0,
			.68611,
			.06979,
			0,
			.77257
		],
		"97": [
			0,
			.44444,
			0,
			0,
			.63287
		],
		"98": [
			0,
			.69444,
			0,
			0,
			.52083
		],
		"99": [
			0,
			.44444,
			0,
			0,
			.51342
		],
		"100": [
			0,
			.69444,
			0,
			0,
			.60972
		],
		"101": [
			0,
			.44444,
			0,
			0,
			.55361
		],
		"102": [
			.19444,
			.69444,
			.11042,
			0,
			.56806
		],
		"103": [
			.19444,
			.44444,
			.03704,
			0,
			.5449
		],
		"104": [
			0,
			.69444,
			0,
			0,
			.66759
		],
		"105": [
			0,
			.69326,
			0,
			0,
			.4048
		],
		"106": [
			.19444,
			.69326,
			.0622,
			0,
			.47083
		],
		"107": [
			0,
			.69444,
			.01852,
			0,
			.6037
		],
		"108": [
			0,
			.69444,
			.0088,
			0,
			.34815
		],
		"109": [
			0,
			.44444,
			0,
			0,
			1.0324
		],
		"110": [
			0,
			.44444,
			0,
			0,
			.71296
		],
		"111": [
			0,
			.44444,
			0,
			0,
			.58472
		],
		"112": [
			.19444,
			.44444,
			0,
			0,
			.60092
		],
		"113": [
			.19444,
			.44444,
			.03704,
			0,
			.54213
		],
		"114": [
			0,
			.44444,
			.03194,
			0,
			.5287
		],
		"115": [
			0,
			.44444,
			0,
			0,
			.53125
		],
		"116": [
			0,
			.63492,
			0,
			0,
			.41528
		],
		"117": [
			0,
			.44444,
			0,
			0,
			.68102
		],
		"118": [
			0,
			.44444,
			.03704,
			0,
			.56666
		],
		"119": [
			0,
			.44444,
			.02778,
			0,
			.83148
		],
		"120": [
			0,
			.44444,
			0,
			0,
			.65903
		],
		"121": [
			.19444,
			.44444,
			.03704,
			0,
			.59028
		],
		"122": [
			0,
			.44444,
			.04213,
			0,
			.55509
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"915": [
			0,
			.68611,
			.15972,
			0,
			.65694
		],
		"916": [
			0,
			.68611,
			0,
			0,
			.95833
		],
		"920": [
			0,
			.68611,
			.03194,
			0,
			.86722
		],
		"923": [
			0,
			.68611,
			0,
			0,
			.80555
		],
		"926": [
			0,
			.68611,
			.07458,
			0,
			.84125
		],
		"928": [
			0,
			.68611,
			.08229,
			0,
			.98229
		],
		"931": [
			0,
			.68611,
			.05451,
			0,
			.88507
		],
		"933": [
			0,
			.68611,
			.15972,
			0,
			.67083
		],
		"934": [
			0,
			.68611,
			0,
			0,
			.76666
		],
		"936": [
			0,
			.68611,
			.11653,
			0,
			.71402
		],
		"937": [
			0,
			.68611,
			.04835,
			0,
			.8789
		],
		"945": [
			0,
			.44444,
			0,
			0,
			.76064
		],
		"946": [
			.19444,
			.69444,
			.03403,
			0,
			.65972
		],
		"947": [
			.19444,
			.44444,
			.06389,
			0,
			.59003
		],
		"948": [
			0,
			.69444,
			.03819,
			0,
			.52222
		],
		"949": [
			0,
			.44444,
			0,
			0,
			.52882
		],
		"950": [
			.19444,
			.69444,
			.06215,
			0,
			.50833
		],
		"951": [
			.19444,
			.44444,
			.03704,
			0,
			.6
		],
		"952": [
			0,
			.69444,
			.03194,
			0,
			.5618
		],
		"953": [
			0,
			.44444,
			0,
			0,
			.41204
		],
		"954": [
			0,
			.44444,
			0,
			0,
			.66759
		],
		"955": [
			0,
			.69444,
			0,
			0,
			.67083
		],
		"956": [
			.19444,
			.44444,
			0,
			0,
			.70787
		],
		"957": [
			0,
			.44444,
			.06898,
			0,
			.57685
		],
		"958": [
			.19444,
			.69444,
			.03021,
			0,
			.50833
		],
		"959": [
			0,
			.44444,
			0,
			0,
			.58472
		],
		"960": [
			0,
			.44444,
			.03704,
			0,
			.68241
		],
		"961": [
			.19444,
			.44444,
			0,
			0,
			.6118
		],
		"962": [
			.09722,
			.44444,
			.07917,
			0,
			.42361
		],
		"963": [
			0,
			.44444,
			.03704,
			0,
			.68588
		],
		"964": [
			0,
			.44444,
			.13472,
			0,
			.52083
		],
		"965": [
			0,
			.44444,
			.03704,
			0,
			.63055
		],
		"966": [
			.19444,
			.44444,
			0,
			0,
			.74722
		],
		"967": [
			.19444,
			.44444,
			0,
			0,
			.71805
		],
		"968": [
			.19444,
			.69444,
			.03704,
			0,
			.75833
		],
		"969": [
			0,
			.44444,
			.03704,
			0,
			.71782
		],
		"977": [
			0,
			.69444,
			0,
			0,
			.69155
		],
		"981": [
			.19444,
			.69444,
			0,
			0,
			.7125
		],
		"982": [
			0,
			.44444,
			.03194,
			0,
			.975
		],
		"1009": [
			.19444,
			.44444,
			0,
			0,
			.6118
		],
		"1013": [
			0,
			.44444,
			0,
			0,
			.48333
		],
		"57649": [
			0,
			.44444,
			0,
			0,
			.39352
		],
		"57911": [
			.19444,
			.44444,
			0,
			0,
			.43889
		]
	},
	"Math-Italic": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"48": [
			0,
			.43056,
			0,
			0,
			.5
		],
		"49": [
			0,
			.43056,
			0,
			0,
			.5
		],
		"50": [
			0,
			.43056,
			0,
			0,
			.5
		],
		"51": [
			.19444,
			.43056,
			0,
			0,
			.5
		],
		"52": [
			.19444,
			.43056,
			0,
			0,
			.5
		],
		"53": [
			.19444,
			.43056,
			0,
			0,
			.5
		],
		"54": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"55": [
			.19444,
			.43056,
			0,
			0,
			.5
		],
		"56": [
			0,
			.64444,
			0,
			0,
			.5
		],
		"57": [
			.19444,
			.43056,
			0,
			0,
			.5
		],
		"65": [
			0,
			.68333,
			0,
			.13889,
			.75
		],
		"66": [
			0,
			.68333,
			.05017,
			.08334,
			.75851
		],
		"67": [
			0,
			.68333,
			.07153,
			.08334,
			.71472
		],
		"68": [
			0,
			.68333,
			.02778,
			.05556,
			.82792
		],
		"69": [
			0,
			.68333,
			.05764,
			.08334,
			.7382
		],
		"70": [
			0,
			.68333,
			.13889,
			.08334,
			.64306
		],
		"71": [
			0,
			.68333,
			0,
			.08334,
			.78625
		],
		"72": [
			0,
			.68333,
			.08125,
			.05556,
			.83125
		],
		"73": [
			0,
			.68333,
			.07847,
			.11111,
			.43958
		],
		"74": [
			0,
			.68333,
			.09618,
			.16667,
			.55451
		],
		"75": [
			0,
			.68333,
			.07153,
			.05556,
			.84931
		],
		"76": [
			0,
			.68333,
			0,
			.02778,
			.68056
		],
		"77": [
			0,
			.68333,
			.10903,
			.08334,
			.97014
		],
		"78": [
			0,
			.68333,
			.10903,
			.08334,
			.80347
		],
		"79": [
			0,
			.68333,
			.02778,
			.08334,
			.76278
		],
		"80": [
			0,
			.68333,
			.13889,
			.08334,
			.64201
		],
		"81": [
			.19444,
			.68333,
			0,
			.08334,
			.79056
		],
		"82": [
			0,
			.68333,
			.00773,
			.08334,
			.75929
		],
		"83": [
			0,
			.68333,
			.05764,
			.08334,
			.6132
		],
		"84": [
			0,
			.68333,
			.13889,
			.08334,
			.58438
		],
		"85": [
			0,
			.68333,
			.10903,
			.02778,
			.68278
		],
		"86": [
			0,
			.68333,
			.22222,
			0,
			.58333
		],
		"87": [
			0,
			.68333,
			.13889,
			0,
			.94445
		],
		"88": [
			0,
			.68333,
			.07847,
			.08334,
			.82847
		],
		"89": [
			0,
			.68333,
			.22222,
			0,
			.58056
		],
		"90": [
			0,
			.68333,
			.07153,
			.08334,
			.68264
		],
		"97": [
			0,
			.43056,
			0,
			0,
			.52859
		],
		"98": [
			0,
			.69444,
			0,
			0,
			.42917
		],
		"99": [
			0,
			.43056,
			0,
			.05556,
			.43276
		],
		"100": [
			0,
			.69444,
			0,
			.16667,
			.52049
		],
		"101": [
			0,
			.43056,
			0,
			.05556,
			.46563
		],
		"102": [
			.19444,
			.69444,
			.10764,
			.16667,
			.48959
		],
		"103": [
			.19444,
			.43056,
			.03588,
			.02778,
			.47697
		],
		"104": [
			0,
			.69444,
			0,
			0,
			.57616
		],
		"105": [
			0,
			.65952,
			0,
			0,
			.34451
		],
		"106": [
			.19444,
			.65952,
			.05724,
			0,
			.41181
		],
		"107": [
			0,
			.69444,
			.03148,
			0,
			.5206
		],
		"108": [
			0,
			.69444,
			.01968,
			.08334,
			.29838
		],
		"109": [
			0,
			.43056,
			0,
			0,
			.87801
		],
		"110": [
			0,
			.43056,
			0,
			0,
			.60023
		],
		"111": [
			0,
			.43056,
			0,
			.05556,
			.48472
		],
		"112": [
			.19444,
			.43056,
			0,
			.08334,
			.50313
		],
		"113": [
			.19444,
			.43056,
			.03588,
			.08334,
			.44641
		],
		"114": [
			0,
			.43056,
			.02778,
			.05556,
			.45116
		],
		"115": [
			0,
			.43056,
			0,
			.05556,
			.46875
		],
		"116": [
			0,
			.61508,
			0,
			.08334,
			.36111
		],
		"117": [
			0,
			.43056,
			0,
			.02778,
			.57246
		],
		"118": [
			0,
			.43056,
			.03588,
			.02778,
			.48472
		],
		"119": [
			0,
			.43056,
			.02691,
			.08334,
			.71592
		],
		"120": [
			0,
			.43056,
			0,
			.02778,
			.57153
		],
		"121": [
			.19444,
			.43056,
			.03588,
			.05556,
			.49028
		],
		"122": [
			0,
			.43056,
			.04398,
			.05556,
			.46505
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"915": [
			0,
			.68333,
			.13889,
			.08334,
			.61528
		],
		"916": [
			0,
			.68333,
			0,
			.16667,
			.83334
		],
		"920": [
			0,
			.68333,
			.02778,
			.08334,
			.76278
		],
		"923": [
			0,
			.68333,
			0,
			.16667,
			.69445
		],
		"926": [
			0,
			.68333,
			.07569,
			.08334,
			.74236
		],
		"928": [
			0,
			.68333,
			.08125,
			.05556,
			.83125
		],
		"931": [
			0,
			.68333,
			.05764,
			.08334,
			.77986
		],
		"933": [
			0,
			.68333,
			.13889,
			.05556,
			.58333
		],
		"934": [
			0,
			.68333,
			0,
			.08334,
			.66667
		],
		"936": [
			0,
			.68333,
			.11,
			.05556,
			.61222
		],
		"937": [
			0,
			.68333,
			.05017,
			.08334,
			.7724
		],
		"945": [
			0,
			.43056,
			.0037,
			.02778,
			.6397
		],
		"946": [
			.19444,
			.69444,
			.05278,
			.08334,
			.56563
		],
		"947": [
			.19444,
			.43056,
			.05556,
			0,
			.51773
		],
		"948": [
			0,
			.69444,
			.03785,
			.05556,
			.44444
		],
		"949": [
			0,
			.43056,
			0,
			.08334,
			.46632
		],
		"950": [
			.19444,
			.69444,
			.07378,
			.08334,
			.4375
		],
		"951": [
			.19444,
			.43056,
			.03588,
			.05556,
			.49653
		],
		"952": [
			0,
			.69444,
			.02778,
			.08334,
			.46944
		],
		"953": [
			0,
			.43056,
			0,
			.05556,
			.35394
		],
		"954": [
			0,
			.43056,
			0,
			0,
			.57616
		],
		"955": [
			0,
			.69444,
			0,
			0,
			.58334
		],
		"956": [
			.19444,
			.43056,
			0,
			.02778,
			.60255
		],
		"957": [
			0,
			.43056,
			.06366,
			.02778,
			.49398
		],
		"958": [
			.19444,
			.69444,
			.04601,
			.11111,
			.4375
		],
		"959": [
			0,
			.43056,
			0,
			.05556,
			.48472
		],
		"960": [
			0,
			.43056,
			.03588,
			0,
			.57003
		],
		"961": [
			.19444,
			.43056,
			0,
			.08334,
			.51702
		],
		"962": [
			.09722,
			.43056,
			.07986,
			.08334,
			.36285
		],
		"963": [
			0,
			.43056,
			.03588,
			0,
			.57141
		],
		"964": [
			0,
			.43056,
			.1132,
			.02778,
			.43715
		],
		"965": [
			0,
			.43056,
			.03588,
			.02778,
			.54028
		],
		"966": [
			.19444,
			.43056,
			0,
			.08334,
			.65417
		],
		"967": [
			.19444,
			.43056,
			0,
			.05556,
			.62569
		],
		"968": [
			.19444,
			.69444,
			.03588,
			.11111,
			.65139
		],
		"969": [
			0,
			.43056,
			.03588,
			0,
			.62245
		],
		"977": [
			0,
			.69444,
			0,
			.08334,
			.59144
		],
		"981": [
			.19444,
			.69444,
			0,
			.08334,
			.59583
		],
		"982": [
			0,
			.43056,
			.02778,
			0,
			.82813
		],
		"1009": [
			.19444,
			.43056,
			0,
			.08334,
			.51702
		],
		"1013": [
			0,
			.43056,
			0,
			.05556,
			.4059
		],
		"57649": [
			0,
			.43056,
			0,
			.02778,
			.32246
		],
		"57911": [
			.19444,
			.43056,
			0,
			.08334,
			.38403
		]
	},
	"SansSerif-Bold": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"33": [
			0,
			.69444,
			0,
			0,
			.36667
		],
		"34": [
			0,
			.69444,
			0,
			0,
			.55834
		],
		"35": [
			.19444,
			.69444,
			0,
			0,
			.91667
		],
		"36": [
			.05556,
			.75,
			0,
			0,
			.55
		],
		"37": [
			.05556,
			.75,
			0,
			0,
			1.02912
		],
		"38": [
			0,
			.69444,
			0,
			0,
			.83056
		],
		"39": [
			0,
			.69444,
			0,
			0,
			.30556
		],
		"40": [
			.25,
			.75,
			0,
			0,
			.42778
		],
		"41": [
			.25,
			.75,
			0,
			0,
			.42778
		],
		"42": [
			0,
			.75,
			0,
			0,
			.55
		],
		"43": [
			.11667,
			.61667,
			0,
			0,
			.85556
		],
		"44": [
			.10556,
			.13056,
			0,
			0,
			.30556
		],
		"45": [
			0,
			.45833,
			0,
			0,
			.36667
		],
		"46": [
			0,
			.13056,
			0,
			0,
			.30556
		],
		"47": [
			.25,
			.75,
			0,
			0,
			.55
		],
		"48": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"49": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"50": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"51": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"52": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"53": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"54": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"55": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"56": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"57": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"58": [
			0,
			.45833,
			0,
			0,
			.30556
		],
		"59": [
			.10556,
			.45833,
			0,
			0,
			.30556
		],
		"61": [
			-.09375,
			.40625,
			0,
			0,
			.85556
		],
		"63": [
			0,
			.69444,
			0,
			0,
			.51945
		],
		"64": [
			0,
			.69444,
			0,
			0,
			.73334
		],
		"65": [
			0,
			.69444,
			0,
			0,
			.73334
		],
		"66": [
			0,
			.69444,
			0,
			0,
			.73334
		],
		"67": [
			0,
			.69444,
			0,
			0,
			.70278
		],
		"68": [
			0,
			.69444,
			0,
			0,
			.79445
		],
		"69": [
			0,
			.69444,
			0,
			0,
			.64167
		],
		"70": [
			0,
			.69444,
			0,
			0,
			.61111
		],
		"71": [
			0,
			.69444,
			0,
			0,
			.73334
		],
		"72": [
			0,
			.69444,
			0,
			0,
			.79445
		],
		"73": [
			0,
			.69444,
			0,
			0,
			.33056
		],
		"74": [
			0,
			.69444,
			0,
			0,
			.51945
		],
		"75": [
			0,
			.69444,
			0,
			0,
			.76389
		],
		"76": [
			0,
			.69444,
			0,
			0,
			.58056
		],
		"77": [
			0,
			.69444,
			0,
			0,
			.97778
		],
		"78": [
			0,
			.69444,
			0,
			0,
			.79445
		],
		"79": [
			0,
			.69444,
			0,
			0,
			.79445
		],
		"80": [
			0,
			.69444,
			0,
			0,
			.70278
		],
		"81": [
			.10556,
			.69444,
			0,
			0,
			.79445
		],
		"82": [
			0,
			.69444,
			0,
			0,
			.70278
		],
		"83": [
			0,
			.69444,
			0,
			0,
			.61111
		],
		"84": [
			0,
			.69444,
			0,
			0,
			.73334
		],
		"85": [
			0,
			.69444,
			0,
			0,
			.76389
		],
		"86": [
			0,
			.69444,
			.01528,
			0,
			.73334
		],
		"87": [
			0,
			.69444,
			.01528,
			0,
			1.03889
		],
		"88": [
			0,
			.69444,
			0,
			0,
			.73334
		],
		"89": [
			0,
			.69444,
			.0275,
			0,
			.73334
		],
		"90": [
			0,
			.69444,
			0,
			0,
			.67223
		],
		"91": [
			.25,
			.75,
			0,
			0,
			.34306
		],
		"93": [
			.25,
			.75,
			0,
			0,
			.34306
		],
		"94": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"95": [
			.35,
			.10833,
			.03056,
			0,
			.55
		],
		"97": [
			0,
			.45833,
			0,
			0,
			.525
		],
		"98": [
			0,
			.69444,
			0,
			0,
			.56111
		],
		"99": [
			0,
			.45833,
			0,
			0,
			.48889
		],
		"100": [
			0,
			.69444,
			0,
			0,
			.56111
		],
		"101": [
			0,
			.45833,
			0,
			0,
			.51111
		],
		"102": [
			0,
			.69444,
			.07639,
			0,
			.33611
		],
		"103": [
			.19444,
			.45833,
			.01528,
			0,
			.55
		],
		"104": [
			0,
			.69444,
			0,
			0,
			.56111
		],
		"105": [
			0,
			.69444,
			0,
			0,
			.25556
		],
		"106": [
			.19444,
			.69444,
			0,
			0,
			.28611
		],
		"107": [
			0,
			.69444,
			0,
			0,
			.53056
		],
		"108": [
			0,
			.69444,
			0,
			0,
			.25556
		],
		"109": [
			0,
			.45833,
			0,
			0,
			.86667
		],
		"110": [
			0,
			.45833,
			0,
			0,
			.56111
		],
		"111": [
			0,
			.45833,
			0,
			0,
			.55
		],
		"112": [
			.19444,
			.45833,
			0,
			0,
			.56111
		],
		"113": [
			.19444,
			.45833,
			0,
			0,
			.56111
		],
		"114": [
			0,
			.45833,
			.01528,
			0,
			.37222
		],
		"115": [
			0,
			.45833,
			0,
			0,
			.42167
		],
		"116": [
			0,
			.58929,
			0,
			0,
			.40417
		],
		"117": [
			0,
			.45833,
			0,
			0,
			.56111
		],
		"118": [
			0,
			.45833,
			.01528,
			0,
			.5
		],
		"119": [
			0,
			.45833,
			.01528,
			0,
			.74445
		],
		"120": [
			0,
			.45833,
			0,
			0,
			.5
		],
		"121": [
			.19444,
			.45833,
			.01528,
			0,
			.5
		],
		"122": [
			0,
			.45833,
			0,
			0,
			.47639
		],
		"126": [
			.35,
			.34444,
			0,
			0,
			.55
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"168": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"176": [
			0,
			.69444,
			0,
			0,
			.73334
		],
		"180": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"184": [
			.17014,
			0,
			0,
			0,
			.48889
		],
		"305": [
			0,
			.45833,
			0,
			0,
			.25556
		],
		"567": [
			.19444,
			.45833,
			0,
			0,
			.28611
		],
		"710": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"711": [
			0,
			.63542,
			0,
			0,
			.55
		],
		"713": [
			0,
			.63778,
			0,
			0,
			.55
		],
		"728": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"729": [
			0,
			.69444,
			0,
			0,
			.30556
		],
		"730": [
			0,
			.69444,
			0,
			0,
			.73334
		],
		"732": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"733": [
			0,
			.69444,
			0,
			0,
			.55
		],
		"915": [
			0,
			.69444,
			0,
			0,
			.58056
		],
		"916": [
			0,
			.69444,
			0,
			0,
			.91667
		],
		"920": [
			0,
			.69444,
			0,
			0,
			.85556
		],
		"923": [
			0,
			.69444,
			0,
			0,
			.67223
		],
		"926": [
			0,
			.69444,
			0,
			0,
			.73334
		],
		"928": [
			0,
			.69444,
			0,
			0,
			.79445
		],
		"931": [
			0,
			.69444,
			0,
			0,
			.79445
		],
		"933": [
			0,
			.69444,
			0,
			0,
			.85556
		],
		"934": [
			0,
			.69444,
			0,
			0,
			.79445
		],
		"936": [
			0,
			.69444,
			0,
			0,
			.85556
		],
		"937": [
			0,
			.69444,
			0,
			0,
			.79445
		],
		"8211": [
			0,
			.45833,
			.03056,
			0,
			.55
		],
		"8212": [
			0,
			.45833,
			.03056,
			0,
			1.10001
		],
		"8216": [
			0,
			.69444,
			0,
			0,
			.30556
		],
		"8217": [
			0,
			.69444,
			0,
			0,
			.30556
		],
		"8220": [
			0,
			.69444,
			0,
			0,
			.55834
		],
		"8221": [
			0,
			.69444,
			0,
			0,
			.55834
		]
	},
	"SansSerif-Italic": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"33": [
			0,
			.69444,
			.05733,
			0,
			.31945
		],
		"34": [
			0,
			.69444,
			.00316,
			0,
			.5
		],
		"35": [
			.19444,
			.69444,
			.05087,
			0,
			.83334
		],
		"36": [
			.05556,
			.75,
			.11156,
			0,
			.5
		],
		"37": [
			.05556,
			.75,
			.03126,
			0,
			.83334
		],
		"38": [
			0,
			.69444,
			.03058,
			0,
			.75834
		],
		"39": [
			0,
			.69444,
			.07816,
			0,
			.27778
		],
		"40": [
			.25,
			.75,
			.13164,
			0,
			.38889
		],
		"41": [
			.25,
			.75,
			.02536,
			0,
			.38889
		],
		"42": [
			0,
			.75,
			.11775,
			0,
			.5
		],
		"43": [
			.08333,
			.58333,
			.02536,
			0,
			.77778
		],
		"44": [
			.125,
			.08333,
			0,
			0,
			.27778
		],
		"45": [
			0,
			.44444,
			.01946,
			0,
			.33333
		],
		"46": [
			0,
			.08333,
			0,
			0,
			.27778
		],
		"47": [
			.25,
			.75,
			.13164,
			0,
			.5
		],
		"48": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"49": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"50": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"51": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"52": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"53": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"54": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"55": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"56": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"57": [
			0,
			.65556,
			.11156,
			0,
			.5
		],
		"58": [
			0,
			.44444,
			.02502,
			0,
			.27778
		],
		"59": [
			.125,
			.44444,
			.02502,
			0,
			.27778
		],
		"61": [
			-.13,
			.37,
			.05087,
			0,
			.77778
		],
		"63": [
			0,
			.69444,
			.11809,
			0,
			.47222
		],
		"64": [
			0,
			.69444,
			.07555,
			0,
			.66667
		],
		"65": [
			0,
			.69444,
			0,
			0,
			.66667
		],
		"66": [
			0,
			.69444,
			.08293,
			0,
			.66667
		],
		"67": [
			0,
			.69444,
			.11983,
			0,
			.63889
		],
		"68": [
			0,
			.69444,
			.07555,
			0,
			.72223
		],
		"69": [
			0,
			.69444,
			.11983,
			0,
			.59722
		],
		"70": [
			0,
			.69444,
			.13372,
			0,
			.56945
		],
		"71": [
			0,
			.69444,
			.11983,
			0,
			.66667
		],
		"72": [
			0,
			.69444,
			.08094,
			0,
			.70834
		],
		"73": [
			0,
			.69444,
			.13372,
			0,
			.27778
		],
		"74": [
			0,
			.69444,
			.08094,
			0,
			.47222
		],
		"75": [
			0,
			.69444,
			.11983,
			0,
			.69445
		],
		"76": [
			0,
			.69444,
			0,
			0,
			.54167
		],
		"77": [
			0,
			.69444,
			.08094,
			0,
			.875
		],
		"78": [
			0,
			.69444,
			.08094,
			0,
			.70834
		],
		"79": [
			0,
			.69444,
			.07555,
			0,
			.73611
		],
		"80": [
			0,
			.69444,
			.08293,
			0,
			.63889
		],
		"81": [
			.125,
			.69444,
			.07555,
			0,
			.73611
		],
		"82": [
			0,
			.69444,
			.08293,
			0,
			.64584
		],
		"83": [
			0,
			.69444,
			.09205,
			0,
			.55556
		],
		"84": [
			0,
			.69444,
			.13372,
			0,
			.68056
		],
		"85": [
			0,
			.69444,
			.08094,
			0,
			.6875
		],
		"86": [
			0,
			.69444,
			.1615,
			0,
			.66667
		],
		"87": [
			0,
			.69444,
			.1615,
			0,
			.94445
		],
		"88": [
			0,
			.69444,
			.13372,
			0,
			.66667
		],
		"89": [
			0,
			.69444,
			.17261,
			0,
			.66667
		],
		"90": [
			0,
			.69444,
			.11983,
			0,
			.61111
		],
		"91": [
			.25,
			.75,
			.15942,
			0,
			.28889
		],
		"93": [
			.25,
			.75,
			.08719,
			0,
			.28889
		],
		"94": [
			0,
			.69444,
			.0799,
			0,
			.5
		],
		"95": [
			.35,
			.09444,
			.08616,
			0,
			.5
		],
		"97": [
			0,
			.44444,
			.00981,
			0,
			.48056
		],
		"98": [
			0,
			.69444,
			.03057,
			0,
			.51667
		],
		"99": [
			0,
			.44444,
			.08336,
			0,
			.44445
		],
		"100": [
			0,
			.69444,
			.09483,
			0,
			.51667
		],
		"101": [
			0,
			.44444,
			.06778,
			0,
			.44445
		],
		"102": [
			0,
			.69444,
			.21705,
			0,
			.30556
		],
		"103": [
			.19444,
			.44444,
			.10836,
			0,
			.5
		],
		"104": [
			0,
			.69444,
			.01778,
			0,
			.51667
		],
		"105": [
			0,
			.67937,
			.09718,
			0,
			.23889
		],
		"106": [
			.19444,
			.67937,
			.09162,
			0,
			.26667
		],
		"107": [
			0,
			.69444,
			.08336,
			0,
			.48889
		],
		"108": [
			0,
			.69444,
			.09483,
			0,
			.23889
		],
		"109": [
			0,
			.44444,
			.01778,
			0,
			.79445
		],
		"110": [
			0,
			.44444,
			.01778,
			0,
			.51667
		],
		"111": [
			0,
			.44444,
			.06613,
			0,
			.5
		],
		"112": [
			.19444,
			.44444,
			.0389,
			0,
			.51667
		],
		"113": [
			.19444,
			.44444,
			.04169,
			0,
			.51667
		],
		"114": [
			0,
			.44444,
			.10836,
			0,
			.34167
		],
		"115": [
			0,
			.44444,
			.0778,
			0,
			.38333
		],
		"116": [
			0,
			.57143,
			.07225,
			0,
			.36111
		],
		"117": [
			0,
			.44444,
			.04169,
			0,
			.51667
		],
		"118": [
			0,
			.44444,
			.10836,
			0,
			.46111
		],
		"119": [
			0,
			.44444,
			.10836,
			0,
			.68334
		],
		"120": [
			0,
			.44444,
			.09169,
			0,
			.46111
		],
		"121": [
			.19444,
			.44444,
			.10836,
			0,
			.46111
		],
		"122": [
			0,
			.44444,
			.08752,
			0,
			.43472
		],
		"126": [
			.35,
			.32659,
			.08826,
			0,
			.5
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"168": [
			0,
			.67937,
			.06385,
			0,
			.5
		],
		"176": [
			0,
			.69444,
			0,
			0,
			.73752
		],
		"184": [
			.17014,
			0,
			0,
			0,
			.44445
		],
		"305": [
			0,
			.44444,
			.04169,
			0,
			.23889
		],
		"567": [
			.19444,
			.44444,
			.04169,
			0,
			.26667
		],
		"710": [
			0,
			.69444,
			.0799,
			0,
			.5
		],
		"711": [
			0,
			.63194,
			.08432,
			0,
			.5
		],
		"713": [
			0,
			.60889,
			.08776,
			0,
			.5
		],
		"714": [
			0,
			.69444,
			.09205,
			0,
			.5
		],
		"715": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"728": [
			0,
			.69444,
			.09483,
			0,
			.5
		],
		"729": [
			0,
			.67937,
			.07774,
			0,
			.27778
		],
		"730": [
			0,
			.69444,
			0,
			0,
			.73752
		],
		"732": [
			0,
			.67659,
			.08826,
			0,
			.5
		],
		"733": [
			0,
			.69444,
			.09205,
			0,
			.5
		],
		"915": [
			0,
			.69444,
			.13372,
			0,
			.54167
		],
		"916": [
			0,
			.69444,
			0,
			0,
			.83334
		],
		"920": [
			0,
			.69444,
			.07555,
			0,
			.77778
		],
		"923": [
			0,
			.69444,
			0,
			0,
			.61111
		],
		"926": [
			0,
			.69444,
			.12816,
			0,
			.66667
		],
		"928": [
			0,
			.69444,
			.08094,
			0,
			.70834
		],
		"931": [
			0,
			.69444,
			.11983,
			0,
			.72222
		],
		"933": [
			0,
			.69444,
			.09031,
			0,
			.77778
		],
		"934": [
			0,
			.69444,
			.04603,
			0,
			.72222
		],
		"936": [
			0,
			.69444,
			.09031,
			0,
			.77778
		],
		"937": [
			0,
			.69444,
			.08293,
			0,
			.72222
		],
		"8211": [
			0,
			.44444,
			.08616,
			0,
			.5
		],
		"8212": [
			0,
			.44444,
			.08616,
			0,
			1
		],
		"8216": [
			0,
			.69444,
			.07816,
			0,
			.27778
		],
		"8217": [
			0,
			.69444,
			.07816,
			0,
			.27778
		],
		"8220": [
			0,
			.69444,
			.14205,
			0,
			.5
		],
		"8221": [
			0,
			.69444,
			.00316,
			0,
			.5
		]
	},
	"SansSerif-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"33": [
			0,
			.69444,
			0,
			0,
			.31945
		],
		"34": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"35": [
			.19444,
			.69444,
			0,
			0,
			.83334
		],
		"36": [
			.05556,
			.75,
			0,
			0,
			.5
		],
		"37": [
			.05556,
			.75,
			0,
			0,
			.83334
		],
		"38": [
			0,
			.69444,
			0,
			0,
			.75834
		],
		"39": [
			0,
			.69444,
			0,
			0,
			.27778
		],
		"40": [
			.25,
			.75,
			0,
			0,
			.38889
		],
		"41": [
			.25,
			.75,
			0,
			0,
			.38889
		],
		"42": [
			0,
			.75,
			0,
			0,
			.5
		],
		"43": [
			.08333,
			.58333,
			0,
			0,
			.77778
		],
		"44": [
			.125,
			.08333,
			0,
			0,
			.27778
		],
		"45": [
			0,
			.44444,
			0,
			0,
			.33333
		],
		"46": [
			0,
			.08333,
			0,
			0,
			.27778
		],
		"47": [
			.25,
			.75,
			0,
			0,
			.5
		],
		"48": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"49": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"50": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"51": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"52": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"53": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"54": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"55": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"56": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"57": [
			0,
			.65556,
			0,
			0,
			.5
		],
		"58": [
			0,
			.44444,
			0,
			0,
			.27778
		],
		"59": [
			.125,
			.44444,
			0,
			0,
			.27778
		],
		"61": [
			-.13,
			.37,
			0,
			0,
			.77778
		],
		"63": [
			0,
			.69444,
			0,
			0,
			.47222
		],
		"64": [
			0,
			.69444,
			0,
			0,
			.66667
		],
		"65": [
			0,
			.69444,
			0,
			0,
			.66667
		],
		"66": [
			0,
			.69444,
			0,
			0,
			.66667
		],
		"67": [
			0,
			.69444,
			0,
			0,
			.63889
		],
		"68": [
			0,
			.69444,
			0,
			0,
			.72223
		],
		"69": [
			0,
			.69444,
			0,
			0,
			.59722
		],
		"70": [
			0,
			.69444,
			0,
			0,
			.56945
		],
		"71": [
			0,
			.69444,
			0,
			0,
			.66667
		],
		"72": [
			0,
			.69444,
			0,
			0,
			.70834
		],
		"73": [
			0,
			.69444,
			0,
			0,
			.27778
		],
		"74": [
			0,
			.69444,
			0,
			0,
			.47222
		],
		"75": [
			0,
			.69444,
			0,
			0,
			.69445
		],
		"76": [
			0,
			.69444,
			0,
			0,
			.54167
		],
		"77": [
			0,
			.69444,
			0,
			0,
			.875
		],
		"78": [
			0,
			.69444,
			0,
			0,
			.70834
		],
		"79": [
			0,
			.69444,
			0,
			0,
			.73611
		],
		"80": [
			0,
			.69444,
			0,
			0,
			.63889
		],
		"81": [
			.125,
			.69444,
			0,
			0,
			.73611
		],
		"82": [
			0,
			.69444,
			0,
			0,
			.64584
		],
		"83": [
			0,
			.69444,
			0,
			0,
			.55556
		],
		"84": [
			0,
			.69444,
			0,
			0,
			.68056
		],
		"85": [
			0,
			.69444,
			0,
			0,
			.6875
		],
		"86": [
			0,
			.69444,
			.01389,
			0,
			.66667
		],
		"87": [
			0,
			.69444,
			.01389,
			0,
			.94445
		],
		"88": [
			0,
			.69444,
			0,
			0,
			.66667
		],
		"89": [
			0,
			.69444,
			.025,
			0,
			.66667
		],
		"90": [
			0,
			.69444,
			0,
			0,
			.61111
		],
		"91": [
			.25,
			.75,
			0,
			0,
			.28889
		],
		"93": [
			.25,
			.75,
			0,
			0,
			.28889
		],
		"94": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"95": [
			.35,
			.09444,
			.02778,
			0,
			.5
		],
		"97": [
			0,
			.44444,
			0,
			0,
			.48056
		],
		"98": [
			0,
			.69444,
			0,
			0,
			.51667
		],
		"99": [
			0,
			.44444,
			0,
			0,
			.44445
		],
		"100": [
			0,
			.69444,
			0,
			0,
			.51667
		],
		"101": [
			0,
			.44444,
			0,
			0,
			.44445
		],
		"102": [
			0,
			.69444,
			.06944,
			0,
			.30556
		],
		"103": [
			.19444,
			.44444,
			.01389,
			0,
			.5
		],
		"104": [
			0,
			.69444,
			0,
			0,
			.51667
		],
		"105": [
			0,
			.67937,
			0,
			0,
			.23889
		],
		"106": [
			.19444,
			.67937,
			0,
			0,
			.26667
		],
		"107": [
			0,
			.69444,
			0,
			0,
			.48889
		],
		"108": [
			0,
			.69444,
			0,
			0,
			.23889
		],
		"109": [
			0,
			.44444,
			0,
			0,
			.79445
		],
		"110": [
			0,
			.44444,
			0,
			0,
			.51667
		],
		"111": [
			0,
			.44444,
			0,
			0,
			.5
		],
		"112": [
			.19444,
			.44444,
			0,
			0,
			.51667
		],
		"113": [
			.19444,
			.44444,
			0,
			0,
			.51667
		],
		"114": [
			0,
			.44444,
			.01389,
			0,
			.34167
		],
		"115": [
			0,
			.44444,
			0,
			0,
			.38333
		],
		"116": [
			0,
			.57143,
			0,
			0,
			.36111
		],
		"117": [
			0,
			.44444,
			0,
			0,
			.51667
		],
		"118": [
			0,
			.44444,
			.01389,
			0,
			.46111
		],
		"119": [
			0,
			.44444,
			.01389,
			0,
			.68334
		],
		"120": [
			0,
			.44444,
			0,
			0,
			.46111
		],
		"121": [
			.19444,
			.44444,
			.01389,
			0,
			.46111
		],
		"122": [
			0,
			.44444,
			0,
			0,
			.43472
		],
		"126": [
			.35,
			.32659,
			0,
			0,
			.5
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"168": [
			0,
			.67937,
			0,
			0,
			.5
		],
		"176": [
			0,
			.69444,
			0,
			0,
			.66667
		],
		"184": [
			.17014,
			0,
			0,
			0,
			.44445
		],
		"305": [
			0,
			.44444,
			0,
			0,
			.23889
		],
		"567": [
			.19444,
			.44444,
			0,
			0,
			.26667
		],
		"710": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"711": [
			0,
			.63194,
			0,
			0,
			.5
		],
		"713": [
			0,
			.60889,
			0,
			0,
			.5
		],
		"714": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"715": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"728": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"729": [
			0,
			.67937,
			0,
			0,
			.27778
		],
		"730": [
			0,
			.69444,
			0,
			0,
			.66667
		],
		"732": [
			0,
			.67659,
			0,
			0,
			.5
		],
		"733": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"915": [
			0,
			.69444,
			0,
			0,
			.54167
		],
		"916": [
			0,
			.69444,
			0,
			0,
			.83334
		],
		"920": [
			0,
			.69444,
			0,
			0,
			.77778
		],
		"923": [
			0,
			.69444,
			0,
			0,
			.61111
		],
		"926": [
			0,
			.69444,
			0,
			0,
			.66667
		],
		"928": [
			0,
			.69444,
			0,
			0,
			.70834
		],
		"931": [
			0,
			.69444,
			0,
			0,
			.72222
		],
		"933": [
			0,
			.69444,
			0,
			0,
			.77778
		],
		"934": [
			0,
			.69444,
			0,
			0,
			.72222
		],
		"936": [
			0,
			.69444,
			0,
			0,
			.77778
		],
		"937": [
			0,
			.69444,
			0,
			0,
			.72222
		],
		"8211": [
			0,
			.44444,
			.02778,
			0,
			.5
		],
		"8212": [
			0,
			.44444,
			.02778,
			0,
			1
		],
		"8216": [
			0,
			.69444,
			0,
			0,
			.27778
		],
		"8217": [
			0,
			.69444,
			0,
			0,
			.27778
		],
		"8220": [
			0,
			.69444,
			0,
			0,
			.5
		],
		"8221": [
			0,
			.69444,
			0,
			0,
			.5
		]
	},
	"Script-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"65": [
			0,
			.7,
			.22925,
			0,
			.80253
		],
		"66": [
			0,
			.7,
			.04087,
			0,
			.90757
		],
		"67": [
			0,
			.7,
			.1689,
			0,
			.66619
		],
		"68": [
			0,
			.7,
			.09371,
			0,
			.77443
		],
		"69": [
			0,
			.7,
			.18583,
			0,
			.56162
		],
		"70": [
			0,
			.7,
			.13634,
			0,
			.89544
		],
		"71": [
			0,
			.7,
			.17322,
			0,
			.60961
		],
		"72": [
			0,
			.7,
			.29694,
			0,
			.96919
		],
		"73": [
			0,
			.7,
			.19189,
			0,
			.80907
		],
		"74": [
			.27778,
			.7,
			.19189,
			0,
			1.05159
		],
		"75": [
			0,
			.7,
			.31259,
			0,
			.91364
		],
		"76": [
			0,
			.7,
			.19189,
			0,
			.87373
		],
		"77": [
			0,
			.7,
			.15981,
			0,
			1.08031
		],
		"78": [
			0,
			.7,
			.3525,
			0,
			.9015
		],
		"79": [
			0,
			.7,
			.08078,
			0,
			.73787
		],
		"80": [
			0,
			.7,
			.08078,
			0,
			1.01262
		],
		"81": [
			0,
			.7,
			.03305,
			0,
			.88282
		],
		"82": [
			0,
			.7,
			.06259,
			0,
			.85
		],
		"83": [
			0,
			.7,
			.19189,
			0,
			.86767
		],
		"84": [
			0,
			.7,
			.29087,
			0,
			.74697
		],
		"85": [
			0,
			.7,
			.25815,
			0,
			.79996
		],
		"86": [
			0,
			.7,
			.27523,
			0,
			.62204
		],
		"87": [
			0,
			.7,
			.27523,
			0,
			.80532
		],
		"88": [
			0,
			.7,
			.26006,
			0,
			.94445
		],
		"89": [
			0,
			.7,
			.2939,
			0,
			.70961
		],
		"90": [
			0,
			.7,
			.24037,
			0,
			.8212
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		]
	},
	"Size1-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"40": [
			.35001,
			.85,
			0,
			0,
			.45834
		],
		"41": [
			.35001,
			.85,
			0,
			0,
			.45834
		],
		"47": [
			.35001,
			.85,
			0,
			0,
			.57778
		],
		"91": [
			.35001,
			.85,
			0,
			0,
			.41667
		],
		"92": [
			.35001,
			.85,
			0,
			0,
			.57778
		],
		"93": [
			.35001,
			.85,
			0,
			0,
			.41667
		],
		"123": [
			.35001,
			.85,
			0,
			0,
			.58334
		],
		"125": [
			.35001,
			.85,
			0,
			0,
			.58334
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"710": [
			0,
			.72222,
			0,
			0,
			.55556
		],
		"732": [
			0,
			.72222,
			0,
			0,
			.55556
		],
		"770": [
			0,
			.72222,
			0,
			0,
			.55556
		],
		"771": [
			0,
			.72222,
			0,
			0,
			.55556
		],
		"8214": [
			-99e-5,
			.601,
			0,
			0,
			.77778
		],
		"8593": [
			1e-5,
			.6,
			0,
			0,
			.66667
		],
		"8595": [
			1e-5,
			.6,
			0,
			0,
			.66667
		],
		"8657": [
			1e-5,
			.6,
			0,
			0,
			.77778
		],
		"8659": [
			1e-5,
			.6,
			0,
			0,
			.77778
		],
		"8719": [
			.25001,
			.75,
			0,
			0,
			.94445
		],
		"8720": [
			.25001,
			.75,
			0,
			0,
			.94445
		],
		"8721": [
			.25001,
			.75,
			0,
			0,
			1.05556
		],
		"8730": [
			.35001,
			.85,
			0,
			0,
			1
		],
		"8739": [
			-.00599,
			.606,
			0,
			0,
			.33333
		],
		"8741": [
			-.00599,
			.606,
			0,
			0,
			.55556
		],
		"8747": [
			.30612,
			.805,
			.19445,
			0,
			.47222
		],
		"8748": [
			.306,
			.805,
			.19445,
			0,
			.47222
		],
		"8749": [
			.306,
			.805,
			.19445,
			0,
			.47222
		],
		"8750": [
			.30612,
			.805,
			.19445,
			0,
			.47222
		],
		"8896": [
			.25001,
			.75,
			0,
			0,
			.83334
		],
		"8897": [
			.25001,
			.75,
			0,
			0,
			.83334
		],
		"8898": [
			.25001,
			.75,
			0,
			0,
			.83334
		],
		"8899": [
			.25001,
			.75,
			0,
			0,
			.83334
		],
		"8968": [
			.35001,
			.85,
			0,
			0,
			.47222
		],
		"8969": [
			.35001,
			.85,
			0,
			0,
			.47222
		],
		"8970": [
			.35001,
			.85,
			0,
			0,
			.47222
		],
		"8971": [
			.35001,
			.85,
			0,
			0,
			.47222
		],
		"9168": [
			-99e-5,
			.601,
			0,
			0,
			.66667
		],
		"10216": [
			.35001,
			.85,
			0,
			0,
			.47222
		],
		"10217": [
			.35001,
			.85,
			0,
			0,
			.47222
		],
		"10752": [
			.25001,
			.75,
			0,
			0,
			1.11111
		],
		"10753": [
			.25001,
			.75,
			0,
			0,
			1.11111
		],
		"10754": [
			.25001,
			.75,
			0,
			0,
			1.11111
		],
		"10756": [
			.25001,
			.75,
			0,
			0,
			.83334
		],
		"10758": [
			.25001,
			.75,
			0,
			0,
			.83334
		]
	},
	"Size2-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"40": [
			.65002,
			1.15,
			0,
			0,
			.59722
		],
		"41": [
			.65002,
			1.15,
			0,
			0,
			.59722
		],
		"47": [
			.65002,
			1.15,
			0,
			0,
			.81111
		],
		"91": [
			.65002,
			1.15,
			0,
			0,
			.47222
		],
		"92": [
			.65002,
			1.15,
			0,
			0,
			.81111
		],
		"93": [
			.65002,
			1.15,
			0,
			0,
			.47222
		],
		"123": [
			.65002,
			1.15,
			0,
			0,
			.66667
		],
		"125": [
			.65002,
			1.15,
			0,
			0,
			.66667
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"710": [
			0,
			.75,
			0,
			0,
			1
		],
		"732": [
			0,
			.75,
			0,
			0,
			1
		],
		"770": [
			0,
			.75,
			0,
			0,
			1
		],
		"771": [
			0,
			.75,
			0,
			0,
			1
		],
		"8719": [
			.55001,
			1.05,
			0,
			0,
			1.27778
		],
		"8720": [
			.55001,
			1.05,
			0,
			0,
			1.27778
		],
		"8721": [
			.55001,
			1.05,
			0,
			0,
			1.44445
		],
		"8730": [
			.65002,
			1.15,
			0,
			0,
			1
		],
		"8747": [
			.86225,
			1.36,
			.44445,
			0,
			.55556
		],
		"8748": [
			.862,
			1.36,
			.44445,
			0,
			.55556
		],
		"8749": [
			.862,
			1.36,
			.44445,
			0,
			.55556
		],
		"8750": [
			.86225,
			1.36,
			.44445,
			0,
			.55556
		],
		"8896": [
			.55001,
			1.05,
			0,
			0,
			1.11111
		],
		"8897": [
			.55001,
			1.05,
			0,
			0,
			1.11111
		],
		"8898": [
			.55001,
			1.05,
			0,
			0,
			1.11111
		],
		"8899": [
			.55001,
			1.05,
			0,
			0,
			1.11111
		],
		"8968": [
			.65002,
			1.15,
			0,
			0,
			.52778
		],
		"8969": [
			.65002,
			1.15,
			0,
			0,
			.52778
		],
		"8970": [
			.65002,
			1.15,
			0,
			0,
			.52778
		],
		"8971": [
			.65002,
			1.15,
			0,
			0,
			.52778
		],
		"10216": [
			.65002,
			1.15,
			0,
			0,
			.61111
		],
		"10217": [
			.65002,
			1.15,
			0,
			0,
			.61111
		],
		"10752": [
			.55001,
			1.05,
			0,
			0,
			1.51112
		],
		"10753": [
			.55001,
			1.05,
			0,
			0,
			1.51112
		],
		"10754": [
			.55001,
			1.05,
			0,
			0,
			1.51112
		],
		"10756": [
			.55001,
			1.05,
			0,
			0,
			1.11111
		],
		"10758": [
			.55001,
			1.05,
			0,
			0,
			1.11111
		]
	},
	"Size3-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"40": [
			.95003,
			1.45,
			0,
			0,
			.73611
		],
		"41": [
			.95003,
			1.45,
			0,
			0,
			.73611
		],
		"47": [
			.95003,
			1.45,
			0,
			0,
			1.04445
		],
		"91": [
			.95003,
			1.45,
			0,
			0,
			.52778
		],
		"92": [
			.95003,
			1.45,
			0,
			0,
			1.04445
		],
		"93": [
			.95003,
			1.45,
			0,
			0,
			.52778
		],
		"123": [
			.95003,
			1.45,
			0,
			0,
			.75
		],
		"125": [
			.95003,
			1.45,
			0,
			0,
			.75
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"710": [
			0,
			.75,
			0,
			0,
			1.44445
		],
		"732": [
			0,
			.75,
			0,
			0,
			1.44445
		],
		"770": [
			0,
			.75,
			0,
			0,
			1.44445
		],
		"771": [
			0,
			.75,
			0,
			0,
			1.44445
		],
		"8730": [
			.95003,
			1.45,
			0,
			0,
			1
		],
		"8968": [
			.95003,
			1.45,
			0,
			0,
			.58334
		],
		"8969": [
			.95003,
			1.45,
			0,
			0,
			.58334
		],
		"8970": [
			.95003,
			1.45,
			0,
			0,
			.58334
		],
		"8971": [
			.95003,
			1.45,
			0,
			0,
			.58334
		],
		"10216": [
			.95003,
			1.45,
			0,
			0,
			.75
		],
		"10217": [
			.95003,
			1.45,
			0,
			0,
			.75
		]
	},
	"Size4-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.25
		],
		"40": [
			1.25003,
			1.75,
			0,
			0,
			.79167
		],
		"41": [
			1.25003,
			1.75,
			0,
			0,
			.79167
		],
		"47": [
			1.25003,
			1.75,
			0,
			0,
			1.27778
		],
		"91": [
			1.25003,
			1.75,
			0,
			0,
			.58334
		],
		"92": [
			1.25003,
			1.75,
			0,
			0,
			1.27778
		],
		"93": [
			1.25003,
			1.75,
			0,
			0,
			.58334
		],
		"123": [
			1.25003,
			1.75,
			0,
			0,
			.80556
		],
		"125": [
			1.25003,
			1.75,
			0,
			0,
			.80556
		],
		"160": [
			0,
			0,
			0,
			0,
			.25
		],
		"710": [
			0,
			.825,
			0,
			0,
			1.8889
		],
		"732": [
			0,
			.825,
			0,
			0,
			1.8889
		],
		"770": [
			0,
			.825,
			0,
			0,
			1.8889
		],
		"771": [
			0,
			.825,
			0,
			0,
			1.8889
		],
		"8730": [
			1.25003,
			1.75,
			0,
			0,
			1
		],
		"8968": [
			1.25003,
			1.75,
			0,
			0,
			.63889
		],
		"8969": [
			1.25003,
			1.75,
			0,
			0,
			.63889
		],
		"8970": [
			1.25003,
			1.75,
			0,
			0,
			.63889
		],
		"8971": [
			1.25003,
			1.75,
			0,
			0,
			.63889
		],
		"9115": [
			.64502,
			1.155,
			0,
			0,
			.875
		],
		"9116": [
			1e-5,
			.6,
			0,
			0,
			.875
		],
		"9117": [
			.64502,
			1.155,
			0,
			0,
			.875
		],
		"9118": [
			.64502,
			1.155,
			0,
			0,
			.875
		],
		"9119": [
			1e-5,
			.6,
			0,
			0,
			.875
		],
		"9120": [
			.64502,
			1.155,
			0,
			0,
			.875
		],
		"9121": [
			.64502,
			1.155,
			0,
			0,
			.66667
		],
		"9122": [
			-99e-5,
			.601,
			0,
			0,
			.66667
		],
		"9123": [
			.64502,
			1.155,
			0,
			0,
			.66667
		],
		"9124": [
			.64502,
			1.155,
			0,
			0,
			.66667
		],
		"9125": [
			-99e-5,
			.601,
			0,
			0,
			.66667
		],
		"9126": [
			.64502,
			1.155,
			0,
			0,
			.66667
		],
		"9127": [
			1e-5,
			.9,
			0,
			0,
			.88889
		],
		"9128": [
			.65002,
			1.15,
			0,
			0,
			.88889
		],
		"9129": [
			.90001,
			0,
			0,
			0,
			.88889
		],
		"9130": [
			0,
			.3,
			0,
			0,
			.88889
		],
		"9131": [
			1e-5,
			.9,
			0,
			0,
			.88889
		],
		"9132": [
			.65002,
			1.15,
			0,
			0,
			.88889
		],
		"9133": [
			.90001,
			0,
			0,
			0,
			.88889
		],
		"9143": [
			.88502,
			.915,
			0,
			0,
			1.05556
		],
		"10216": [
			1.25003,
			1.75,
			0,
			0,
			.80556
		],
		"10217": [
			1.25003,
			1.75,
			0,
			0,
			.80556
		],
		"57344": [
			-.00499,
			.605,
			0,
			0,
			1.05556
		],
		"57345": [
			-.00499,
			.605,
			0,
			0,
			1.05556
		],
		"57680": [
			0,
			.12,
			0,
			0,
			.45
		],
		"57681": [
			0,
			.12,
			0,
			0,
			.45
		],
		"57682": [
			0,
			.12,
			0,
			0,
			.45
		],
		"57683": [
			0,
			.12,
			0,
			0,
			.45
		]
	},
	"Typewriter-Regular": {
		"32": [
			0,
			0,
			0,
			0,
			.525
		],
		"33": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"34": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"35": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"36": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"37": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"38": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"39": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"40": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"41": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"42": [
			0,
			.52083,
			0,
			0,
			.525
		],
		"43": [
			-.08056,
			.53055,
			0,
			0,
			.525
		],
		"44": [
			.13889,
			.125,
			0,
			0,
			.525
		],
		"45": [
			-.08056,
			.53055,
			0,
			0,
			.525
		],
		"46": [
			0,
			.125,
			0,
			0,
			.525
		],
		"47": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"48": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"49": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"50": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"51": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"52": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"53": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"54": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"55": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"56": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"57": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"58": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"59": [
			.13889,
			.43056,
			0,
			0,
			.525
		],
		"60": [
			-.05556,
			.55556,
			0,
			0,
			.525
		],
		"61": [
			-.19549,
			.41562,
			0,
			0,
			.525
		],
		"62": [
			-.05556,
			.55556,
			0,
			0,
			.525
		],
		"63": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"64": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"65": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"66": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"67": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"68": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"69": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"70": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"71": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"72": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"73": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"74": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"75": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"76": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"77": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"78": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"79": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"80": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"81": [
			.13889,
			.61111,
			0,
			0,
			.525
		],
		"82": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"83": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"84": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"85": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"86": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"87": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"88": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"89": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"90": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"91": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"92": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"93": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"94": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"95": [
			.09514,
			0,
			0,
			0,
			.525
		],
		"96": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"97": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"98": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"99": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"100": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"101": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"102": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"103": [
			.22222,
			.43056,
			0,
			0,
			.525
		],
		"104": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"105": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"106": [
			.22222,
			.61111,
			0,
			0,
			.525
		],
		"107": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"108": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"109": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"110": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"111": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"112": [
			.22222,
			.43056,
			0,
			0,
			.525
		],
		"113": [
			.22222,
			.43056,
			0,
			0,
			.525
		],
		"114": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"115": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"116": [
			0,
			.55358,
			0,
			0,
			.525
		],
		"117": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"118": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"119": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"120": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"121": [
			.22222,
			.43056,
			0,
			0,
			.525
		],
		"122": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"123": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"124": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"125": [
			.08333,
			.69444,
			0,
			0,
			.525
		],
		"126": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"127": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"160": [
			0,
			0,
			0,
			0,
			.525
		],
		"176": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"184": [
			.19445,
			0,
			0,
			0,
			.525
		],
		"305": [
			0,
			.43056,
			0,
			0,
			.525
		],
		"567": [
			.22222,
			.43056,
			0,
			0,
			.525
		],
		"711": [
			0,
			.56597,
			0,
			0,
			.525
		],
		"713": [
			0,
			.56555,
			0,
			0,
			.525
		],
		"714": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"715": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"728": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"730": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"770": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"771": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"776": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"915": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"916": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"920": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"923": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"926": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"928": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"931": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"933": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"934": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"936": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"937": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"8216": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"8217": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"8242": [
			0,
			.61111,
			0,
			0,
			.525
		],
		"9251": [
			.11111,
			.21944,
			0,
			0,
			.525
		]
	}
};
/**
* This file contains metrics regarding fonts and individual symbols. The sigma
* and xi variables, as well as the metricMap map contain data extracted from
* TeX, TeX font metrics, and the TTF files. These data are then exposed via the
* `metrics` variable and the getCharacterMetrics function.
*/
var sigmasAndXis = {
	slant: [
		.25,
		.25,
		.25
	],
	space: [
		0,
		0,
		0
	],
	stretch: [
		0,
		0,
		0
	],
	shrink: [
		0,
		0,
		0
	],
	xHeight: [
		.431,
		.431,
		.431
	],
	quad: [
		1,
		1.171,
		1.472
	],
	extraSpace: [
		0,
		0,
		0
	],
	num1: [
		.677,
		.732,
		.925
	],
	num2: [
		.394,
		.384,
		.387
	],
	num3: [
		.444,
		.471,
		.504
	],
	denom1: [
		.686,
		.752,
		1.025
	],
	denom2: [
		.345,
		.344,
		.532
	],
	sup1: [
		.413,
		.503,
		.504
	],
	sup2: [
		.363,
		.431,
		.404
	],
	sup3: [
		.289,
		.286,
		.294
	],
	sub1: [
		.15,
		.143,
		.2
	],
	sub2: [
		.247,
		.286,
		.4
	],
	supDrop: [
		.386,
		.353,
		.494
	],
	subDrop: [
		.05,
		.071,
		.1
	],
	delim1: [
		2.39,
		1.7,
		1.98
	],
	delim2: [
		1.01,
		1.157,
		1.42
	],
	axisHeight: [
		.25,
		.25,
		.25
	],
	defaultRuleThickness: [
		.04,
		.049,
		.049
	],
	bigOpSpacing1: [
		.111,
		.111,
		.111
	],
	bigOpSpacing2: [
		.166,
		.166,
		.166
	],
	bigOpSpacing3: [
		.2,
		.2,
		.2
	],
	bigOpSpacing4: [
		.6,
		.611,
		.611
	],
	bigOpSpacing5: [
		.1,
		.143,
		.143
	],
	sqrtRuleThickness: [
		.04,
		.04,
		.04
	],
	ptPerEm: [
		10,
		10,
		10
	],
	doubleRuleSep: [
		.2,
		.2,
		.2
	],
	arrayRuleWidth: [
		.04,
		.04,
		.04
	],
	fboxsep: [
		.3,
		.3,
		.3
	],
	fboxrule: [
		.04,
		.04,
		.04
	]
};
var extraCharacterMap = {
	"Å": "A",
	"Ð": "D",
	"Þ": "o",
	"å": "a",
	"ð": "d",
	"þ": "o",
	"А": "A",
	"Б": "B",
	"В": "B",
	"Г": "F",
	"Д": "A",
	"Е": "E",
	"Ж": "K",
	"З": "3",
	"И": "N",
	"Й": "N",
	"К": "K",
	"Л": "N",
	"М": "M",
	"Н": "H",
	"О": "O",
	"П": "N",
	"Р": "P",
	"С": "C",
	"Т": "T",
	"У": "y",
	"Ф": "O",
	"Х": "X",
	"Ц": "U",
	"Ч": "h",
	"Ш": "W",
	"Щ": "W",
	"Ъ": "B",
	"Ы": "X",
	"Ь": "B",
	"Э": "3",
	"Ю": "X",
	"Я": "R",
	"а": "a",
	"б": "b",
	"в": "a",
	"г": "r",
	"д": "y",
	"е": "e",
	"ж": "m",
	"з": "e",
	"и": "n",
	"й": "n",
	"к": "n",
	"л": "n",
	"м": "m",
	"н": "n",
	"о": "o",
	"п": "n",
	"р": "p",
	"с": "c",
	"т": "o",
	"у": "y",
	"ф": "b",
	"х": "x",
	"ц": "n",
	"ч": "n",
	"ш": "w",
	"щ": "w",
	"ъ": "a",
	"ы": "m",
	"ь": "a",
	"э": "e",
	"ю": "m",
	"я": "r"
};
/**
* This function adds new font metrics to default metricMap
* It can also override existing metrics
*/
function setFontMetrics(fontName, metrics) {
	fontMetricsData[fontName] = metrics;
}
/**
* This function is a convenience function for looking up information in the
* metricMap table. It takes a character as a string, and a font.
*
* Note: the `width` property may be undefined if fontMetricsData.js wasn't
* built using `Make extended_metrics`.
*/
function getCharacterMetrics(character, font, mode) {
	if (!fontMetricsData[font]) throw new Error("Font metrics not found for font: " + font + ".");
	var ch = character.charCodeAt(0);
	var metrics = fontMetricsData[font][ch];
	if (!metrics && character[0] in extraCharacterMap) {
		ch = extraCharacterMap[character[0]].charCodeAt(0);
		metrics = fontMetricsData[font][ch];
	}
	if (!metrics && mode === "text") {
		if (supportedCodepoint(ch)) metrics = fontMetricsData[font][77];
	}
	if (metrics) return {
		depth: metrics[0],
		height: metrics[1],
		italic: metrics[2],
		skew: metrics[3],
		width: metrics[4]
	};
}
var fontMetricsBySizeIndex = {};
/**
* Get the font metrics for a given size.
*/
function getGlobalMetrics(size) {
	var sizeIndex;
	if (size >= 5) sizeIndex = 0;
	else if (size >= 3) sizeIndex = 1;
	else sizeIndex = 2;
	if (!fontMetricsBySizeIndex[sizeIndex]) {
		var metrics = fontMetricsBySizeIndex[sizeIndex] = { cssEmPerMu: sigmasAndXis.quad[sizeIndex] / 18 };
		for (var key in sigmasAndXis) if (sigmasAndXis.hasOwnProperty(key)) metrics[key] = sigmasAndXis[key][sizeIndex];
	}
	return fontMetricsBySizeIndex[sizeIndex];
}
/**
* This file holds a list of all no-argument functions and single-character
* symbols (like 'a' or ';').
*
* For each of the symbols, there are three properties they can have:
* - font (required): the font to be used for this symbol. Either "main" (the
normal font), or "ams" (the ams fonts).
* - group (required): the ParseNode group type the symbol should have (i.e.
"textord", "mathord", etc).
See https://github.com/KaTeX/KaTeX/wiki/Examining-TeX#group-types
* - replace: the character that this symbol or function should be
*   replaced with (i.e. "\phi" has a replace value of "\u03d5", the phi
*   character in the main font).
*
* The outermost map in the table indicates what mode the symbols should be
* accepted in (e.g. "math" or "text").
*/
var ATOMS = {
	"bin": 1,
	"close": 1,
	"inner": 1,
	"open": 1,
	"punct": 1,
	"rel": 1
};
var NON_ATOMS = {
	"accent-token": 1,
	"mathord": 1,
	"op-token": 1,
	"spacing": 1,
	"textord": 1
};
var symbols = {
	"math": {},
	"text": {}
};
/** `acceptUnicodeChar = true` is only applicable if `replace` is set. */
function defineSymbol(mode, font, group, replace, name, acceptUnicodeChar) {
	symbols[mode][name] = {
		font,
		group,
		replace
	};
	if (acceptUnicodeChar && replace) symbols[mode][replace] = symbols[mode][name];
}
var math = "math";
var text = "text";
var main = "main";
var ams = "ams";
var accent = "accent-token";
var bin = "bin";
var close = "close";
var inner = "inner";
var mathord = "mathord";
var op = "op-token";
var open = "open";
var punct = "punct";
var rel = "rel";
var spacing = "spacing";
var textord = "textord";
defineSymbol(math, main, rel, "≡", "\\equiv", true);
defineSymbol(math, main, rel, "≺", "\\prec", true);
defineSymbol(math, main, rel, "≻", "\\succ", true);
defineSymbol(math, main, rel, "∼", "\\sim", true);
defineSymbol(math, main, rel, "⊥", "\\perp");
defineSymbol(math, main, rel, "⪯", "\\preceq", true);
defineSymbol(math, main, rel, "⪰", "\\succeq", true);
defineSymbol(math, main, rel, "≃", "\\simeq", true);
defineSymbol(math, main, rel, "∣", "\\mid", true);
defineSymbol(math, main, rel, "≪", "\\ll", true);
defineSymbol(math, main, rel, "≫", "\\gg", true);
defineSymbol(math, main, rel, "≍", "\\asymp", true);
defineSymbol(math, main, rel, "∥", "\\parallel");
defineSymbol(math, main, rel, "⋈", "\\bowtie", true);
defineSymbol(math, main, rel, "⌣", "\\smile", true);
defineSymbol(math, main, rel, "⊑", "\\sqsubseteq", true);
defineSymbol(math, main, rel, "⊒", "\\sqsupseteq", true);
defineSymbol(math, main, rel, "≐", "\\doteq", true);
defineSymbol(math, main, rel, "⌢", "\\frown", true);
defineSymbol(math, main, rel, "∋", "\\ni", true);
defineSymbol(math, main, rel, "∝", "\\propto", true);
defineSymbol(math, main, rel, "⊢", "\\vdash", true);
defineSymbol(math, main, rel, "⊣", "\\dashv", true);
defineSymbol(math, main, rel, "∋", "\\owns");
defineSymbol(math, main, punct, ".", "\\ldotp");
defineSymbol(math, main, punct, "⋅", "\\cdotp");
defineSymbol(math, main, punct, "⋅", "·");
defineSymbol(text, main, textord, "⋅", "·");
defineSymbol(math, main, textord, "#", "\\#");
defineSymbol(text, main, textord, "#", "\\#");
defineSymbol(math, main, textord, "&", "\\&");
defineSymbol(text, main, textord, "&", "\\&");
defineSymbol(math, main, textord, "ℵ", "\\aleph", true);
defineSymbol(math, main, textord, "∀", "\\forall", true);
defineSymbol(math, main, textord, "ℏ", "\\hbar", true);
defineSymbol(math, main, textord, "∃", "\\exists", true);
defineSymbol(math, main, textord, "∇", "\\nabla", true);
defineSymbol(math, main, textord, "♭", "\\flat", true);
defineSymbol(math, main, textord, "ℓ", "\\ell", true);
defineSymbol(math, main, textord, "♮", "\\natural", true);
defineSymbol(math, main, textord, "♣", "\\clubsuit", true);
defineSymbol(math, main, textord, "℘", "\\wp", true);
defineSymbol(math, main, textord, "♯", "\\sharp", true);
defineSymbol(math, main, textord, "♢", "\\diamondsuit", true);
defineSymbol(math, main, textord, "ℜ", "\\Re", true);
defineSymbol(math, main, textord, "♡", "\\heartsuit", true);
defineSymbol(math, main, textord, "ℑ", "\\Im", true);
defineSymbol(math, main, textord, "♠", "\\spadesuit", true);
defineSymbol(math, main, textord, "§", "\\S", true);
defineSymbol(text, main, textord, "§", "\\S");
defineSymbol(math, main, textord, "¶", "\\P", true);
defineSymbol(text, main, textord, "¶", "\\P");
defineSymbol(math, main, textord, "†", "\\dag");
defineSymbol(text, main, textord, "†", "\\dag");
defineSymbol(text, main, textord, "†", "\\textdagger");
defineSymbol(math, main, textord, "‡", "\\ddag");
defineSymbol(text, main, textord, "‡", "\\ddag");
defineSymbol(text, main, textord, "‡", "\\textdaggerdbl");
defineSymbol(math, main, close, "⎱", "\\rmoustache", true);
defineSymbol(math, main, open, "⎰", "\\lmoustache", true);
defineSymbol(math, main, close, "⟯", "\\rgroup", true);
defineSymbol(math, main, open, "⟮", "\\lgroup", true);
defineSymbol(math, main, bin, "∓", "\\mp", true);
defineSymbol(math, main, bin, "⊖", "\\ominus", true);
defineSymbol(math, main, bin, "⊎", "\\uplus", true);
defineSymbol(math, main, bin, "⊓", "\\sqcap", true);
defineSymbol(math, main, bin, "∗", "\\ast");
defineSymbol(math, main, bin, "⊔", "\\sqcup", true);
defineSymbol(math, main, bin, "◯", "\\bigcirc", true);
defineSymbol(math, main, bin, "∙", "\\bullet", true);
defineSymbol(math, main, bin, "‡", "\\ddagger");
defineSymbol(math, main, bin, "≀", "\\wr", true);
defineSymbol(math, main, bin, "⨿", "\\amalg");
defineSymbol(math, main, bin, "&", "\\And");
defineSymbol(math, main, rel, "⟵", "\\longleftarrow", true);
defineSymbol(math, main, rel, "⇐", "\\Leftarrow", true);
defineSymbol(math, main, rel, "⟸", "\\Longleftarrow", true);
defineSymbol(math, main, rel, "⟶", "\\longrightarrow", true);
defineSymbol(math, main, rel, "⇒", "\\Rightarrow", true);
defineSymbol(math, main, rel, "⟹", "\\Longrightarrow", true);
defineSymbol(math, main, rel, "↔", "\\leftrightarrow", true);
defineSymbol(math, main, rel, "⟷", "\\longleftrightarrow", true);
defineSymbol(math, main, rel, "⇔", "\\Leftrightarrow", true);
defineSymbol(math, main, rel, "⟺", "\\Longleftrightarrow", true);
defineSymbol(math, main, rel, "↦", "\\mapsto", true);
defineSymbol(math, main, rel, "⟼", "\\longmapsto", true);
defineSymbol(math, main, rel, "↗", "\\nearrow", true);
defineSymbol(math, main, rel, "↩", "\\hookleftarrow", true);
defineSymbol(math, main, rel, "↪", "\\hookrightarrow", true);
defineSymbol(math, main, rel, "↘", "\\searrow", true);
defineSymbol(math, main, rel, "↼", "\\leftharpoonup", true);
defineSymbol(math, main, rel, "⇀", "\\rightharpoonup", true);
defineSymbol(math, main, rel, "↙", "\\swarrow", true);
defineSymbol(math, main, rel, "↽", "\\leftharpoondown", true);
defineSymbol(math, main, rel, "⇁", "\\rightharpoondown", true);
defineSymbol(math, main, rel, "↖", "\\nwarrow", true);
defineSymbol(math, main, rel, "⇌", "\\rightleftharpoons", true);
defineSymbol(math, ams, rel, "≮", "\\nless", true);
defineSymbol(math, ams, rel, "", "\\@nleqslant");
defineSymbol(math, ams, rel, "", "\\@nleqq");
defineSymbol(math, ams, rel, "⪇", "\\lneq", true);
defineSymbol(math, ams, rel, "≨", "\\lneqq", true);
defineSymbol(math, ams, rel, "", "\\@lvertneqq");
defineSymbol(math, ams, rel, "⋦", "\\lnsim", true);
defineSymbol(math, ams, rel, "⪉", "\\lnapprox", true);
defineSymbol(math, ams, rel, "⊀", "\\nprec", true);
defineSymbol(math, ams, rel, "⋠", "\\npreceq", true);
defineSymbol(math, ams, rel, "⋨", "\\precnsim", true);
defineSymbol(math, ams, rel, "⪹", "\\precnapprox", true);
defineSymbol(math, ams, rel, "≁", "\\nsim", true);
defineSymbol(math, ams, rel, "", "\\@nshortmid");
defineSymbol(math, ams, rel, "∤", "\\nmid", true);
defineSymbol(math, ams, rel, "⊬", "\\nvdash", true);
defineSymbol(math, ams, rel, "⊭", "\\nvDash", true);
defineSymbol(math, ams, rel, "⋪", "\\ntriangleleft");
defineSymbol(math, ams, rel, "⋬", "\\ntrianglelefteq", true);
defineSymbol(math, ams, rel, "⊊", "\\subsetneq", true);
defineSymbol(math, ams, rel, "", "\\@varsubsetneq");
defineSymbol(math, ams, rel, "⫋", "\\subsetneqq", true);
defineSymbol(math, ams, rel, "", "\\@varsubsetneqq");
defineSymbol(math, ams, rel, "≯", "\\ngtr", true);
defineSymbol(math, ams, rel, "", "\\@ngeqslant");
defineSymbol(math, ams, rel, "", "\\@ngeqq");
defineSymbol(math, ams, rel, "⪈", "\\gneq", true);
defineSymbol(math, ams, rel, "≩", "\\gneqq", true);
defineSymbol(math, ams, rel, "", "\\@gvertneqq");
defineSymbol(math, ams, rel, "⋧", "\\gnsim", true);
defineSymbol(math, ams, rel, "⪊", "\\gnapprox", true);
defineSymbol(math, ams, rel, "⊁", "\\nsucc", true);
defineSymbol(math, ams, rel, "⋡", "\\nsucceq", true);
defineSymbol(math, ams, rel, "⋩", "\\succnsim", true);
defineSymbol(math, ams, rel, "⪺", "\\succnapprox", true);
defineSymbol(math, ams, rel, "≆", "\\ncong", true);
defineSymbol(math, ams, rel, "", "\\@nshortparallel");
defineSymbol(math, ams, rel, "∦", "\\nparallel", true);
defineSymbol(math, ams, rel, "⊯", "\\nVDash", true);
defineSymbol(math, ams, rel, "⋫", "\\ntriangleright");
defineSymbol(math, ams, rel, "⋭", "\\ntrianglerighteq", true);
defineSymbol(math, ams, rel, "", "\\@nsupseteqq");
defineSymbol(math, ams, rel, "⊋", "\\supsetneq", true);
defineSymbol(math, ams, rel, "", "\\@varsupsetneq");
defineSymbol(math, ams, rel, "⫌", "\\supsetneqq", true);
defineSymbol(math, ams, rel, "", "\\@varsupsetneqq");
defineSymbol(math, ams, rel, "⊮", "\\nVdash", true);
defineSymbol(math, ams, rel, "⪵", "\\precneqq", true);
defineSymbol(math, ams, rel, "⪶", "\\succneqq", true);
defineSymbol(math, ams, rel, "", "\\@nsubseteqq");
defineSymbol(math, ams, bin, "⊴", "\\unlhd");
defineSymbol(math, ams, bin, "⊵", "\\unrhd");
defineSymbol(math, ams, rel, "↚", "\\nleftarrow", true);
defineSymbol(math, ams, rel, "↛", "\\nrightarrow", true);
defineSymbol(math, ams, rel, "⇍", "\\nLeftarrow", true);
defineSymbol(math, ams, rel, "⇏", "\\nRightarrow", true);
defineSymbol(math, ams, rel, "↮", "\\nleftrightarrow", true);
defineSymbol(math, ams, rel, "⇎", "\\nLeftrightarrow", true);
defineSymbol(math, ams, rel, "△", "\\vartriangle");
defineSymbol(math, ams, textord, "ℏ", "\\hslash");
defineSymbol(math, ams, textord, "▽", "\\triangledown");
defineSymbol(math, ams, textord, "◊", "\\lozenge");
defineSymbol(math, ams, textord, "Ⓢ", "\\circledS");
defineSymbol(math, ams, textord, "®", "\\circledR");
defineSymbol(text, ams, textord, "®", "\\circledR");
defineSymbol(math, ams, textord, "∡", "\\measuredangle", true);
defineSymbol(math, ams, textord, "∄", "\\nexists");
defineSymbol(math, ams, textord, "℧", "\\mho");
defineSymbol(math, ams, textord, "Ⅎ", "\\Finv", true);
defineSymbol(math, ams, textord, "⅁", "\\Game", true);
defineSymbol(math, ams, textord, "‵", "\\backprime");
defineSymbol(math, ams, textord, "▲", "\\blacktriangle");
defineSymbol(math, ams, textord, "▼", "\\blacktriangledown");
defineSymbol(math, ams, textord, "■", "\\blacksquare");
defineSymbol(math, ams, textord, "⧫", "\\blacklozenge");
defineSymbol(math, ams, textord, "★", "\\bigstar");
defineSymbol(math, ams, textord, "∢", "\\sphericalangle", true);
defineSymbol(math, ams, textord, "∁", "\\complement", true);
defineSymbol(math, ams, textord, "ð", "\\eth", true);
defineSymbol(text, main, textord, "ð", "ð");
defineSymbol(math, ams, textord, "╱", "\\diagup");
defineSymbol(math, ams, textord, "╲", "\\diagdown");
defineSymbol(math, ams, textord, "□", "\\square");
defineSymbol(math, ams, textord, "□", "\\Box");
defineSymbol(math, ams, textord, "◊", "\\Diamond");
defineSymbol(math, ams, textord, "¥", "\\yen", true);
defineSymbol(text, ams, textord, "¥", "\\yen", true);
defineSymbol(math, ams, textord, "✓", "\\checkmark", true);
defineSymbol(text, ams, textord, "✓", "\\checkmark");
defineSymbol(math, ams, textord, "ℶ", "\\beth", true);
defineSymbol(math, ams, textord, "ℸ", "\\daleth", true);
defineSymbol(math, ams, textord, "ℷ", "\\gimel", true);
defineSymbol(math, ams, textord, "ϝ", "\\digamma", true);
defineSymbol(math, ams, textord, "ϰ", "\\varkappa");
defineSymbol(math, ams, open, "┌", "\\@ulcorner", true);
defineSymbol(math, ams, close, "┐", "\\@urcorner", true);
defineSymbol(math, ams, open, "└", "\\@llcorner", true);
defineSymbol(math, ams, close, "┘", "\\@lrcorner", true);
defineSymbol(math, ams, rel, "≦", "\\leqq", true);
defineSymbol(math, ams, rel, "⩽", "\\leqslant", true);
defineSymbol(math, ams, rel, "⪕", "\\eqslantless", true);
defineSymbol(math, ams, rel, "≲", "\\lesssim", true);
defineSymbol(math, ams, rel, "⪅", "\\lessapprox", true);
defineSymbol(math, ams, rel, "≊", "\\approxeq", true);
defineSymbol(math, ams, bin, "⋖", "\\lessdot");
defineSymbol(math, ams, rel, "⋘", "\\lll", true);
defineSymbol(math, ams, rel, "≶", "\\lessgtr", true);
defineSymbol(math, ams, rel, "⋚", "\\lesseqgtr", true);
defineSymbol(math, ams, rel, "⪋", "\\lesseqqgtr", true);
defineSymbol(math, ams, rel, "≑", "\\doteqdot");
defineSymbol(math, ams, rel, "≓", "\\risingdotseq", true);
defineSymbol(math, ams, rel, "≒", "\\fallingdotseq", true);
defineSymbol(math, ams, rel, "∽", "\\backsim", true);
defineSymbol(math, ams, rel, "⋍", "\\backsimeq", true);
defineSymbol(math, ams, rel, "⫅", "\\subseteqq", true);
defineSymbol(math, ams, rel, "⋐", "\\Subset", true);
defineSymbol(math, ams, rel, "⊏", "\\sqsubset", true);
defineSymbol(math, ams, rel, "≼", "\\preccurlyeq", true);
defineSymbol(math, ams, rel, "⋞", "\\curlyeqprec", true);
defineSymbol(math, ams, rel, "≾", "\\precsim", true);
defineSymbol(math, ams, rel, "⪷", "\\precapprox", true);
defineSymbol(math, ams, rel, "⊲", "\\vartriangleleft");
defineSymbol(math, ams, rel, "⊴", "\\trianglelefteq");
defineSymbol(math, ams, rel, "⊨", "\\vDash", true);
defineSymbol(math, ams, rel, "⊪", "\\Vvdash", true);
defineSymbol(math, ams, rel, "⌣", "\\smallsmile");
defineSymbol(math, ams, rel, "⌢", "\\smallfrown");
defineSymbol(math, ams, rel, "≏", "\\bumpeq", true);
defineSymbol(math, ams, rel, "≎", "\\Bumpeq", true);
defineSymbol(math, ams, rel, "≧", "\\geqq", true);
defineSymbol(math, ams, rel, "⩾", "\\geqslant", true);
defineSymbol(math, ams, rel, "⪖", "\\eqslantgtr", true);
defineSymbol(math, ams, rel, "≳", "\\gtrsim", true);
defineSymbol(math, ams, rel, "⪆", "\\gtrapprox", true);
defineSymbol(math, ams, bin, "⋗", "\\gtrdot");
defineSymbol(math, ams, rel, "⋙", "\\ggg", true);
defineSymbol(math, ams, rel, "≷", "\\gtrless", true);
defineSymbol(math, ams, rel, "⋛", "\\gtreqless", true);
defineSymbol(math, ams, rel, "⪌", "\\gtreqqless", true);
defineSymbol(math, ams, rel, "≖", "\\eqcirc", true);
defineSymbol(math, ams, rel, "≗", "\\circeq", true);
defineSymbol(math, ams, rel, "≜", "\\triangleq", true);
defineSymbol(math, ams, rel, "∼", "\\thicksim");
defineSymbol(math, ams, rel, "≈", "\\thickapprox");
defineSymbol(math, ams, rel, "⫆", "\\supseteqq", true);
defineSymbol(math, ams, rel, "⋑", "\\Supset", true);
defineSymbol(math, ams, rel, "⊐", "\\sqsupset", true);
defineSymbol(math, ams, rel, "≽", "\\succcurlyeq", true);
defineSymbol(math, ams, rel, "⋟", "\\curlyeqsucc", true);
defineSymbol(math, ams, rel, "≿", "\\succsim", true);
defineSymbol(math, ams, rel, "⪸", "\\succapprox", true);
defineSymbol(math, ams, rel, "⊳", "\\vartriangleright");
defineSymbol(math, ams, rel, "⊵", "\\trianglerighteq");
defineSymbol(math, ams, rel, "⊩", "\\Vdash", true);
defineSymbol(math, ams, rel, "∣", "\\shortmid");
defineSymbol(math, ams, rel, "∥", "\\shortparallel");
defineSymbol(math, ams, rel, "≬", "\\between", true);
defineSymbol(math, ams, rel, "⋔", "\\pitchfork", true);
defineSymbol(math, ams, rel, "∝", "\\varpropto");
defineSymbol(math, ams, rel, "◀", "\\blacktriangleleft");
defineSymbol(math, ams, rel, "∴", "\\therefore", true);
defineSymbol(math, ams, rel, "∍", "\\backepsilon");
defineSymbol(math, ams, rel, "▶", "\\blacktriangleright");
defineSymbol(math, ams, rel, "∵", "\\because", true);
defineSymbol(math, ams, rel, "⋘", "\\llless");
defineSymbol(math, ams, rel, "⋙", "\\gggtr");
defineSymbol(math, ams, bin, "⊲", "\\lhd");
defineSymbol(math, ams, bin, "⊳", "\\rhd");
defineSymbol(math, ams, rel, "≂", "\\eqsim", true);
defineSymbol(math, main, rel, "⋈", "\\Join");
defineSymbol(math, ams, rel, "≑", "\\Doteq", true);
defineSymbol(math, ams, bin, "∔", "\\dotplus", true);
defineSymbol(math, ams, bin, "∖", "\\smallsetminus");
defineSymbol(math, ams, bin, "⋒", "\\Cap", true);
defineSymbol(math, ams, bin, "⋓", "\\Cup", true);
defineSymbol(math, ams, bin, "⩞", "\\doublebarwedge", true);
defineSymbol(math, ams, bin, "⊟", "\\boxminus", true);
defineSymbol(math, ams, bin, "⊞", "\\boxplus", true);
defineSymbol(math, ams, bin, "⋇", "\\divideontimes", true);
defineSymbol(math, ams, bin, "⋉", "\\ltimes", true);
defineSymbol(math, ams, bin, "⋊", "\\rtimes", true);
defineSymbol(math, ams, bin, "⋋", "\\leftthreetimes", true);
defineSymbol(math, ams, bin, "⋌", "\\rightthreetimes", true);
defineSymbol(math, ams, bin, "⋏", "\\curlywedge", true);
defineSymbol(math, ams, bin, "⋎", "\\curlyvee", true);
defineSymbol(math, ams, bin, "⊝", "\\circleddash", true);
defineSymbol(math, ams, bin, "⊛", "\\circledast", true);
defineSymbol(math, ams, bin, "⋅", "\\centerdot");
defineSymbol(math, ams, bin, "⊺", "\\intercal", true);
defineSymbol(math, ams, bin, "⋒", "\\doublecap");
defineSymbol(math, ams, bin, "⋓", "\\doublecup");
defineSymbol(math, ams, bin, "⊠", "\\boxtimes", true);
defineSymbol(math, ams, rel, "⇢", "\\dashrightarrow", true);
defineSymbol(math, ams, rel, "⇠", "\\dashleftarrow", true);
defineSymbol(math, ams, rel, "⇇", "\\leftleftarrows", true);
defineSymbol(math, ams, rel, "⇆", "\\leftrightarrows", true);
defineSymbol(math, ams, rel, "⇚", "\\Lleftarrow", true);
defineSymbol(math, ams, rel, "↞", "\\twoheadleftarrow", true);
defineSymbol(math, ams, rel, "↢", "\\leftarrowtail", true);
defineSymbol(math, ams, rel, "↫", "\\looparrowleft", true);
defineSymbol(math, ams, rel, "⇋", "\\leftrightharpoons", true);
defineSymbol(math, ams, rel, "↶", "\\curvearrowleft", true);
defineSymbol(math, ams, rel, "↺", "\\circlearrowleft", true);
defineSymbol(math, ams, rel, "↰", "\\Lsh", true);
defineSymbol(math, ams, rel, "⇈", "\\upuparrows", true);
defineSymbol(math, ams, rel, "↿", "\\upharpoonleft", true);
defineSymbol(math, ams, rel, "⇃", "\\downharpoonleft", true);
defineSymbol(math, main, rel, "⊶", "\\origof", true);
defineSymbol(math, main, rel, "⊷", "\\imageof", true);
defineSymbol(math, ams, rel, "⊸", "\\multimap", true);
defineSymbol(math, ams, rel, "↭", "\\leftrightsquigarrow", true);
defineSymbol(math, ams, rel, "⇉", "\\rightrightarrows", true);
defineSymbol(math, ams, rel, "⇄", "\\rightleftarrows", true);
defineSymbol(math, ams, rel, "↠", "\\twoheadrightarrow", true);
defineSymbol(math, ams, rel, "↣", "\\rightarrowtail", true);
defineSymbol(math, ams, rel, "↬", "\\looparrowright", true);
defineSymbol(math, ams, rel, "↷", "\\curvearrowright", true);
defineSymbol(math, ams, rel, "↻", "\\circlearrowright", true);
defineSymbol(math, ams, rel, "↱", "\\Rsh", true);
defineSymbol(math, ams, rel, "⇊", "\\downdownarrows", true);
defineSymbol(math, ams, rel, "↾", "\\upharpoonright", true);
defineSymbol(math, ams, rel, "⇂", "\\downharpoonright", true);
defineSymbol(math, ams, rel, "⇝", "\\rightsquigarrow", true);
defineSymbol(math, ams, rel, "⇝", "\\leadsto");
defineSymbol(math, ams, rel, "⇛", "\\Rrightarrow", true);
defineSymbol(math, ams, rel, "↾", "\\restriction");
defineSymbol(math, main, textord, "‘", "`");
defineSymbol(math, main, textord, "$", "\\$");
defineSymbol(text, main, textord, "$", "\\$");
defineSymbol(text, main, textord, "$", "\\textdollar");
defineSymbol(math, main, textord, "%", "\\%");
defineSymbol(text, main, textord, "%", "\\%");
defineSymbol(math, main, textord, "_", "\\_");
defineSymbol(text, main, textord, "_", "\\_");
defineSymbol(text, main, textord, "_", "\\textunderscore");
defineSymbol(math, main, textord, "∠", "\\angle", true);
defineSymbol(math, main, textord, "∞", "\\infty", true);
defineSymbol(math, main, textord, "′", "\\prime");
defineSymbol(math, main, textord, "△", "\\triangle");
defineSymbol(math, main, textord, "Γ", "\\Gamma", true);
defineSymbol(math, main, textord, "Δ", "\\Delta", true);
defineSymbol(math, main, textord, "Θ", "\\Theta", true);
defineSymbol(math, main, textord, "Λ", "\\Lambda", true);
defineSymbol(math, main, textord, "Ξ", "\\Xi", true);
defineSymbol(math, main, textord, "Π", "\\Pi", true);
defineSymbol(math, main, textord, "Σ", "\\Sigma", true);
defineSymbol(math, main, textord, "Υ", "\\Upsilon", true);
defineSymbol(math, main, textord, "Φ", "\\Phi", true);
defineSymbol(math, main, textord, "Ψ", "\\Psi", true);
defineSymbol(math, main, textord, "Ω", "\\Omega", true);
defineSymbol(math, main, textord, "A", "Α");
defineSymbol(math, main, textord, "B", "Β");
defineSymbol(math, main, textord, "E", "Ε");
defineSymbol(math, main, textord, "Z", "Ζ");
defineSymbol(math, main, textord, "H", "Η");
defineSymbol(math, main, textord, "I", "Ι");
defineSymbol(math, main, textord, "K", "Κ");
defineSymbol(math, main, textord, "M", "Μ");
defineSymbol(math, main, textord, "N", "Ν");
defineSymbol(math, main, textord, "O", "Ο");
defineSymbol(math, main, textord, "P", "Ρ");
defineSymbol(math, main, textord, "T", "Τ");
defineSymbol(math, main, textord, "X", "Χ");
defineSymbol(math, main, textord, "¬", "\\neg", true);
defineSymbol(math, main, textord, "¬", "\\lnot");
defineSymbol(math, main, textord, "⊤", "\\top");
defineSymbol(math, main, textord, "⊥", "\\bot");
defineSymbol(math, main, textord, "∅", "\\emptyset");
defineSymbol(math, ams, textord, "∅", "\\varnothing");
defineSymbol(math, main, mathord, "α", "\\alpha", true);
defineSymbol(math, main, mathord, "β", "\\beta", true);
defineSymbol(math, main, mathord, "γ", "\\gamma", true);
defineSymbol(math, main, mathord, "δ", "\\delta", true);
defineSymbol(math, main, mathord, "ϵ", "\\epsilon", true);
defineSymbol(math, main, mathord, "ζ", "\\zeta", true);
defineSymbol(math, main, mathord, "η", "\\eta", true);
defineSymbol(math, main, mathord, "θ", "\\theta", true);
defineSymbol(math, main, mathord, "ι", "\\iota", true);
defineSymbol(math, main, mathord, "κ", "\\kappa", true);
defineSymbol(math, main, mathord, "λ", "\\lambda", true);
defineSymbol(math, main, mathord, "μ", "\\mu", true);
defineSymbol(math, main, mathord, "ν", "\\nu", true);
defineSymbol(math, main, mathord, "ξ", "\\xi", true);
defineSymbol(math, main, mathord, "ο", "\\omicron", true);
defineSymbol(math, main, mathord, "π", "\\pi", true);
defineSymbol(math, main, mathord, "ρ", "\\rho", true);
defineSymbol(math, main, mathord, "σ", "\\sigma", true);
defineSymbol(math, main, mathord, "τ", "\\tau", true);
defineSymbol(math, main, mathord, "υ", "\\upsilon", true);
defineSymbol(math, main, mathord, "ϕ", "\\phi", true);
defineSymbol(math, main, mathord, "χ", "\\chi", true);
defineSymbol(math, main, mathord, "ψ", "\\psi", true);
defineSymbol(math, main, mathord, "ω", "\\omega", true);
defineSymbol(math, main, mathord, "ε", "\\varepsilon", true);
defineSymbol(math, main, mathord, "ϑ", "\\vartheta", true);
defineSymbol(math, main, mathord, "ϖ", "\\varpi", true);
defineSymbol(math, main, mathord, "ϱ", "\\varrho", true);
defineSymbol(math, main, mathord, "ς", "\\varsigma", true);
defineSymbol(math, main, mathord, "φ", "\\varphi", true);
defineSymbol(math, main, bin, "∗", "*", true);
defineSymbol(math, main, bin, "+", "+");
defineSymbol(math, main, bin, "−", "-", true);
defineSymbol(math, main, bin, "⋅", "\\cdot", true);
defineSymbol(math, main, bin, "∘", "\\circ", true);
defineSymbol(math, main, bin, "÷", "\\div", true);
defineSymbol(math, main, bin, "±", "\\pm", true);
defineSymbol(math, main, bin, "×", "\\times", true);
defineSymbol(math, main, bin, "∩", "\\cap", true);
defineSymbol(math, main, bin, "∪", "\\cup", true);
defineSymbol(math, main, bin, "∖", "\\setminus", true);
defineSymbol(math, main, bin, "∧", "\\land");
defineSymbol(math, main, bin, "∨", "\\lor");
defineSymbol(math, main, bin, "∧", "\\wedge", true);
defineSymbol(math, main, bin, "∨", "\\vee", true);
defineSymbol(math, main, textord, "√", "\\surd");
defineSymbol(math, main, open, "⟨", "\\langle", true);
defineSymbol(math, main, open, "∣", "\\lvert");
defineSymbol(math, main, open, "∥", "\\lVert");
defineSymbol(math, main, close, "?", "?");
defineSymbol(math, main, close, "!", "!");
defineSymbol(math, main, close, "⟩", "\\rangle", true);
defineSymbol(math, main, close, "∣", "\\rvert");
defineSymbol(math, main, close, "∥", "\\rVert");
defineSymbol(math, main, rel, "=", "=");
defineSymbol(math, main, rel, ":", ":");
defineSymbol(math, main, rel, "≈", "\\approx", true);
defineSymbol(math, main, rel, "≅", "\\cong", true);
defineSymbol(math, main, rel, "≥", "\\ge");
defineSymbol(math, main, rel, "≥", "\\geq", true);
defineSymbol(math, main, rel, "←", "\\gets");
defineSymbol(math, main, rel, ">", "\\gt", true);
defineSymbol(math, main, rel, "∈", "\\in", true);
defineSymbol(math, main, rel, "", "\\@not");
defineSymbol(math, main, rel, "⊂", "\\subset", true);
defineSymbol(math, main, rel, "⊃", "\\supset", true);
defineSymbol(math, main, rel, "⊆", "\\subseteq", true);
defineSymbol(math, main, rel, "⊇", "\\supseteq", true);
defineSymbol(math, ams, rel, "⊈", "\\nsubseteq", true);
defineSymbol(math, ams, rel, "⊉", "\\nsupseteq", true);
defineSymbol(math, main, rel, "⊨", "\\models");
defineSymbol(math, main, rel, "←", "\\leftarrow", true);
defineSymbol(math, main, rel, "≤", "\\le");
defineSymbol(math, main, rel, "≤", "\\leq", true);
defineSymbol(math, main, rel, "<", "\\lt", true);
defineSymbol(math, main, rel, "→", "\\rightarrow", true);
defineSymbol(math, main, rel, "→", "\\to");
defineSymbol(math, ams, rel, "≱", "\\ngeq", true);
defineSymbol(math, ams, rel, "≰", "\\nleq", true);
defineSymbol(math, main, spacing, "\xA0", "\\ ");
defineSymbol(math, main, spacing, "\xA0", "\\space");
defineSymbol(math, main, spacing, "\xA0", "\\nobreakspace");
defineSymbol(text, main, spacing, "\xA0", "\\ ");
defineSymbol(text, main, spacing, "\xA0", " ");
defineSymbol(text, main, spacing, "\xA0", "\\space");
defineSymbol(text, main, spacing, "\xA0", "\\nobreakspace");
defineSymbol(math, main, spacing, null, "\\nobreak");
defineSymbol(math, main, spacing, null, "\\allowbreak");
defineSymbol(math, main, punct, ",", ",");
defineSymbol(math, main, punct, ";", ";");
defineSymbol(math, ams, bin, "⊼", "\\barwedge", true);
defineSymbol(math, ams, bin, "⊻", "\\veebar", true);
defineSymbol(math, main, bin, "⊙", "\\odot", true);
defineSymbol(math, main, bin, "⊕", "\\oplus", true);
defineSymbol(math, main, bin, "⊗", "\\otimes", true);
defineSymbol(math, main, textord, "∂", "\\partial", true);
defineSymbol(math, main, bin, "⊘", "\\oslash", true);
defineSymbol(math, ams, bin, "⊚", "\\circledcirc", true);
defineSymbol(math, ams, bin, "⊡", "\\boxdot", true);
defineSymbol(math, main, bin, "△", "\\bigtriangleup");
defineSymbol(math, main, bin, "▽", "\\bigtriangledown");
defineSymbol(math, main, bin, "†", "\\dagger");
defineSymbol(math, main, bin, "⋄", "\\diamond");
defineSymbol(math, main, bin, "⋆", "\\star");
defineSymbol(math, main, bin, "◃", "\\triangleleft");
defineSymbol(math, main, bin, "▹", "\\triangleright");
defineSymbol(math, main, open, "{", "\\{");
defineSymbol(text, main, textord, "{", "\\{");
defineSymbol(text, main, textord, "{", "\\textbraceleft");
defineSymbol(math, main, close, "}", "\\}");
defineSymbol(text, main, textord, "}", "\\}");
defineSymbol(text, main, textord, "}", "\\textbraceright");
defineSymbol(math, main, open, "{", "\\lbrace");
defineSymbol(math, main, close, "}", "\\rbrace");
defineSymbol(math, main, open, "[", "\\lbrack", true);
defineSymbol(text, main, textord, "[", "\\lbrack", true);
defineSymbol(math, main, close, "]", "\\rbrack", true);
defineSymbol(text, main, textord, "]", "\\rbrack", true);
defineSymbol(math, main, open, "(", "\\lparen", true);
defineSymbol(math, main, close, ")", "\\rparen", true);
defineSymbol(text, main, textord, "<", "\\textless", true);
defineSymbol(text, main, textord, ">", "\\textgreater", true);
defineSymbol(math, main, open, "⌊", "\\lfloor", true);
defineSymbol(math, main, close, "⌋", "\\rfloor", true);
defineSymbol(math, main, open, "⌈", "\\lceil", true);
defineSymbol(math, main, close, "⌉", "\\rceil", true);
defineSymbol(math, main, textord, "\\", "\\backslash");
defineSymbol(math, main, textord, "∣", "|");
defineSymbol(math, main, textord, "∣", "\\vert");
defineSymbol(text, main, textord, "|", "\\textbar", true);
defineSymbol(math, main, textord, "∥", "\\|");
defineSymbol(math, main, textord, "∥", "\\Vert");
defineSymbol(text, main, textord, "∥", "\\textbardbl");
defineSymbol(text, main, textord, "~", "\\textasciitilde");
defineSymbol(text, main, textord, "\\", "\\textbackslash");
defineSymbol(text, main, textord, "^", "\\textasciicircum");
defineSymbol(math, main, rel, "↑", "\\uparrow", true);
defineSymbol(math, main, rel, "⇑", "\\Uparrow", true);
defineSymbol(math, main, rel, "↓", "\\downarrow", true);
defineSymbol(math, main, rel, "⇓", "\\Downarrow", true);
defineSymbol(math, main, rel, "↕", "\\updownarrow", true);
defineSymbol(math, main, rel, "⇕", "\\Updownarrow", true);
defineSymbol(math, main, op, "∐", "\\coprod");
defineSymbol(math, main, op, "⋁", "\\bigvee");
defineSymbol(math, main, op, "⋀", "\\bigwedge");
defineSymbol(math, main, op, "⨄", "\\biguplus");
defineSymbol(math, main, op, "⋂", "\\bigcap");
defineSymbol(math, main, op, "⋃", "\\bigcup");
defineSymbol(math, main, op, "∫", "\\int");
defineSymbol(math, main, op, "∫", "\\intop");
defineSymbol(math, main, op, "∬", "\\iint");
defineSymbol(math, main, op, "∭", "\\iiint");
defineSymbol(math, main, op, "∏", "\\prod");
defineSymbol(math, main, op, "∑", "\\sum");
defineSymbol(math, main, op, "⨂", "\\bigotimes");
defineSymbol(math, main, op, "⨁", "\\bigoplus");
defineSymbol(math, main, op, "⨀", "\\bigodot");
defineSymbol(math, main, op, "∮", "\\oint");
defineSymbol(math, main, op, "∯", "\\oiint");
defineSymbol(math, main, op, "∰", "\\oiiint");
defineSymbol(math, main, op, "⨆", "\\bigsqcup");
defineSymbol(math, main, op, "∫", "\\smallint");
defineSymbol(text, main, inner, "…", "\\textellipsis");
defineSymbol(math, main, inner, "…", "\\mathellipsis");
defineSymbol(text, main, inner, "…", "\\ldots", true);
defineSymbol(math, main, inner, "…", "\\ldots", true);
defineSymbol(math, main, inner, "⋯", "\\@cdots", true);
defineSymbol(math, main, inner, "⋱", "\\ddots", true);
defineSymbol(math, main, textord, "⋮", "\\varvdots");
defineSymbol(text, main, textord, "⋮", "\\varvdots");
defineSymbol(math, main, accent, "ˊ", "\\acute");
defineSymbol(math, main, accent, "ˋ", "\\grave");
defineSymbol(math, main, accent, "¨", "\\ddot");
defineSymbol(math, main, accent, "~", "\\tilde");
defineSymbol(math, main, accent, "ˉ", "\\bar");
defineSymbol(math, main, accent, "˘", "\\breve");
defineSymbol(math, main, accent, "ˇ", "\\check");
defineSymbol(math, main, accent, "^", "\\hat");
defineSymbol(math, main, accent, "⃗", "\\vec");
defineSymbol(math, main, accent, "˙", "\\dot");
defineSymbol(math, main, accent, "˚", "\\mathring");
defineSymbol(math, main, mathord, "", "\\@imath");
defineSymbol(math, main, mathord, "", "\\@jmath");
defineSymbol(math, main, textord, "ı", "ı");
defineSymbol(math, main, textord, "ȷ", "ȷ");
defineSymbol(text, main, textord, "ı", "\\i", true);
defineSymbol(text, main, textord, "ȷ", "\\j", true);
defineSymbol(text, main, textord, "ß", "\\ss", true);
defineSymbol(text, main, textord, "æ", "\\ae", true);
defineSymbol(text, main, textord, "œ", "\\oe", true);
defineSymbol(text, main, textord, "ø", "\\o", true);
defineSymbol(text, main, textord, "Æ", "\\AE", true);
defineSymbol(text, main, textord, "Œ", "\\OE", true);
defineSymbol(text, main, textord, "Ø", "\\O", true);
defineSymbol(text, main, accent, "ˊ", "\\'");
defineSymbol(text, main, accent, "ˋ", "\\`");
defineSymbol(text, main, accent, "ˆ", "\\^");
defineSymbol(text, main, accent, "˜", "\\~");
defineSymbol(text, main, accent, "ˉ", "\\=");
defineSymbol(text, main, accent, "˘", "\\u");
defineSymbol(text, main, accent, "˙", "\\.");
defineSymbol(text, main, accent, "¸", "\\c");
defineSymbol(text, main, accent, "˚", "\\r");
defineSymbol(text, main, accent, "ˇ", "\\v");
defineSymbol(text, main, accent, "¨", "\\\"");
defineSymbol(text, main, accent, "˝", "\\H");
defineSymbol(text, main, accent, "◯", "\\textcircled");
var ligatures = {
	"--": true,
	"---": true,
	"``": true,
	"''": true
};
defineSymbol(text, main, textord, "–", "--", true);
defineSymbol(text, main, textord, "–", "\\textendash");
defineSymbol(text, main, textord, "—", "---", true);
defineSymbol(text, main, textord, "—", "\\textemdash");
defineSymbol(text, main, textord, "‘", "`", true);
defineSymbol(text, main, textord, "‘", "\\textquoteleft");
defineSymbol(text, main, textord, "’", "'", true);
defineSymbol(text, main, textord, "’", "\\textquoteright");
defineSymbol(text, main, textord, "“", "``", true);
defineSymbol(text, main, textord, "“", "\\textquotedblleft");
defineSymbol(text, main, textord, "”", "''", true);
defineSymbol(text, main, textord, "”", "\\textquotedblright");
defineSymbol(math, main, textord, "°", "\\degree", true);
defineSymbol(text, main, textord, "°", "\\degree");
defineSymbol(text, main, textord, "°", "\\textdegree", true);
defineSymbol(math, main, textord, "£", "\\pounds");
defineSymbol(math, main, textord, "£", "\\mathsterling", true);
defineSymbol(text, main, textord, "£", "\\pounds");
defineSymbol(text, main, textord, "£", "\\textsterling", true);
defineSymbol(math, ams, textord, "✠", "\\maltese");
defineSymbol(text, ams, textord, "✠", "\\maltese");
var mathTextSymbols = "0123456789/@.\"";
for (var i = 0; i < mathTextSymbols.length; i++) {
	var ch = mathTextSymbols.charAt(i);
	defineSymbol(math, main, textord, ch, ch);
}
var textSymbols = "0123456789!@*()-=+\";:?/.,";
for (var _i = 0; _i < textSymbols.length; _i++) {
	var _ch = textSymbols.charAt(_i);
	defineSymbol(text, main, textord, _ch, _ch);
}
var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
for (var _i2 = 0; _i2 < letters.length; _i2++) {
	var _ch2 = letters.charAt(_i2);
	defineSymbol(math, main, mathord, _ch2, _ch2);
	defineSymbol(text, main, textord, _ch2, _ch2);
}
defineSymbol(math, ams, textord, "C", "ℂ");
defineSymbol(text, ams, textord, "C", "ℂ");
defineSymbol(math, ams, textord, "H", "ℍ");
defineSymbol(text, ams, textord, "H", "ℍ");
defineSymbol(math, ams, textord, "N", "ℕ");
defineSymbol(text, ams, textord, "N", "ℕ");
defineSymbol(math, ams, textord, "P", "ℙ");
defineSymbol(text, ams, textord, "P", "ℙ");
defineSymbol(math, ams, textord, "Q", "ℚ");
defineSymbol(text, ams, textord, "Q", "ℚ");
defineSymbol(math, ams, textord, "R", "ℝ");
defineSymbol(text, ams, textord, "R", "ℝ");
defineSymbol(math, ams, textord, "Z", "ℤ");
defineSymbol(text, ams, textord, "Z", "ℤ");
defineSymbol(math, main, mathord, "h", "ℎ");
defineSymbol(text, main, mathord, "h", "ℎ");
var wideChar = "";
for (var _i3 = 0; _i3 < letters.length; _i3++) {
	var _ch3 = letters.charAt(_i3);
	wideChar = String.fromCharCode(55349, 56320 + _i3);
	defineSymbol(math, main, mathord, _ch3, wideChar);
	defineSymbol(text, main, textord, _ch3, wideChar);
	wideChar = String.fromCharCode(55349, 56372 + _i3);
	defineSymbol(math, main, mathord, _ch3, wideChar);
	defineSymbol(text, main, textord, _ch3, wideChar);
	wideChar = String.fromCharCode(55349, 56424 + _i3);
	defineSymbol(math, main, mathord, _ch3, wideChar);
	defineSymbol(text, main, textord, _ch3, wideChar);
	wideChar = String.fromCharCode(55349, 56580 + _i3);
	defineSymbol(math, main, mathord, _ch3, wideChar);
	defineSymbol(text, main, textord, _ch3, wideChar);
	wideChar = String.fromCharCode(55349, 56684 + _i3);
	defineSymbol(math, main, mathord, _ch3, wideChar);
	defineSymbol(text, main, textord, _ch3, wideChar);
	wideChar = String.fromCharCode(55349, 56736 + _i3);
	defineSymbol(math, main, mathord, _ch3, wideChar);
	defineSymbol(text, main, textord, _ch3, wideChar);
	wideChar = String.fromCharCode(55349, 56788 + _i3);
	defineSymbol(math, main, mathord, _ch3, wideChar);
	defineSymbol(text, main, textord, _ch3, wideChar);
	wideChar = String.fromCharCode(55349, 56840 + _i3);
	defineSymbol(math, main, mathord, _ch3, wideChar);
	defineSymbol(text, main, textord, _ch3, wideChar);
	wideChar = String.fromCharCode(55349, 56944 + _i3);
	defineSymbol(math, main, mathord, _ch3, wideChar);
	defineSymbol(text, main, textord, _ch3, wideChar);
	if (_i3 < 26) {
		wideChar = String.fromCharCode(55349, 56632 + _i3);
		defineSymbol(math, main, mathord, _ch3, wideChar);
		defineSymbol(text, main, textord, _ch3, wideChar);
		wideChar = String.fromCharCode(55349, 56476 + _i3);
		defineSymbol(math, main, mathord, _ch3, wideChar);
		defineSymbol(text, main, textord, _ch3, wideChar);
	}
}
wideChar = String.fromCharCode(55349, 56668);
defineSymbol(math, main, mathord, "k", wideChar);
defineSymbol(text, main, textord, "k", wideChar);
for (var _i4 = 0; _i4 < 10; _i4++) {
	var _ch4 = _i4.toString();
	wideChar = String.fromCharCode(55349, 57294 + _i4);
	defineSymbol(math, main, mathord, _ch4, wideChar);
	defineSymbol(text, main, textord, _ch4, wideChar);
	wideChar = String.fromCharCode(55349, 57314 + _i4);
	defineSymbol(math, main, mathord, _ch4, wideChar);
	defineSymbol(text, main, textord, _ch4, wideChar);
	wideChar = String.fromCharCode(55349, 57324 + _i4);
	defineSymbol(math, main, mathord, _ch4, wideChar);
	defineSymbol(text, main, textord, _ch4, wideChar);
	wideChar = String.fromCharCode(55349, 57334 + _i4);
	defineSymbol(math, main, mathord, _ch4, wideChar);
	defineSymbol(text, main, textord, _ch4, wideChar);
}
var extraLatin = "ÐÞþ";
for (var _i5 = 0; _i5 < extraLatin.length; _i5++) {
	var _ch5 = extraLatin.charAt(_i5);
	defineSymbol(math, main, mathord, _ch5, _ch5);
	defineSymbol(text, main, textord, _ch5, _ch5);
}
/**
* This file provides support for Unicode range U+1D400 to U+1D7FF,
* Mathematical Alphanumeric Symbols.
*
* Function wideCharacterFont takes a wide character as input and returns
* the font information necessary to render it properly.
*/
/**
* Data below is from https://www.unicode.org/charts/PDF/U1D400.pdf
* That document sorts characters into groups by font type, say bold or italic.
*
* In the arrays below, each subarray consists three elements:
*      * The CSS class of that group when in math mode.
*      * The CSS class of that group when in text mode.
*      * The font name, so that KaTeX can get font metrics.
*/
var wideLatinLetterData = [
	[
		"mathbf",
		"textbf",
		"Main-Bold"
	],
	[
		"mathbf",
		"textbf",
		"Main-Bold"
	],
	[
		"mathnormal",
		"textit",
		"Math-Italic"
	],
	[
		"mathnormal",
		"textit",
		"Math-Italic"
	],
	[
		"boldsymbol",
		"boldsymbol",
		"Main-BoldItalic"
	],
	[
		"boldsymbol",
		"boldsymbol",
		"Main-BoldItalic"
	],
	[
		"mathscr",
		"textscr",
		"Script-Regular"
	],
	[
		"",
		"",
		""
	],
	[
		"",
		"",
		""
	],
	[
		"",
		"",
		""
	],
	[
		"mathfrak",
		"textfrak",
		"Fraktur-Regular"
	],
	[
		"mathfrak",
		"textfrak",
		"Fraktur-Regular"
	],
	[
		"mathbb",
		"textbb",
		"AMS-Regular"
	],
	[
		"mathbb",
		"textbb",
		"AMS-Regular"
	],
	[
		"mathboldfrak",
		"textboldfrak",
		"Fraktur-Regular"
	],
	[
		"mathboldfrak",
		"textboldfrak",
		"Fraktur-Regular"
	],
	[
		"mathsf",
		"textsf",
		"SansSerif-Regular"
	],
	[
		"mathsf",
		"textsf",
		"SansSerif-Regular"
	],
	[
		"mathboldsf",
		"textboldsf",
		"SansSerif-Bold"
	],
	[
		"mathboldsf",
		"textboldsf",
		"SansSerif-Bold"
	],
	[
		"mathitsf",
		"textitsf",
		"SansSerif-Italic"
	],
	[
		"mathitsf",
		"textitsf",
		"SansSerif-Italic"
	],
	[
		"",
		"",
		""
	],
	[
		"",
		"",
		""
	],
	[
		"mathtt",
		"texttt",
		"Typewriter-Regular"
	],
	[
		"mathtt",
		"texttt",
		"Typewriter-Regular"
	]
];
var wideNumeralData = [
	[
		"mathbf",
		"textbf",
		"Main-Bold"
	],
	[
		"",
		"",
		""
	],
	[
		"mathsf",
		"textsf",
		"SansSerif-Regular"
	],
	[
		"mathboldsf",
		"textboldsf",
		"SansSerif-Bold"
	],
	[
		"mathtt",
		"texttt",
		"Typewriter-Regular"
	]
];
var wideCharacterFont = (wideChar, mode) => {
	var H = wideChar.charCodeAt(0);
	var L = wideChar.charCodeAt(1);
	var codePoint = (H - 55296) * 1024 + (L - 56320) + 65536;
	var j = mode === "math" ? 0 : 1;
	if (119808 <= codePoint && codePoint < 120484) {
		var i = Math.floor((codePoint - 119808) / 26);
		return [wideLatinLetterData[i][2], wideLatinLetterData[i][j]];
	} else if (120782 <= codePoint && codePoint <= 120831) {
		var _i = Math.floor((codePoint - 120782) / 10);
		return [wideNumeralData[_i][2], wideNumeralData[_i][j]];
	} else if (codePoint === 120485 || codePoint === 120486) return [wideLatinLetterData[0][2], wideLatinLetterData[0][j]];
	else if (120486 < codePoint && codePoint < 120782) return ["", ""];
	else throw new ParseError("Unsupported character: " + wideChar);
};
/**
* Looks up the given symbol in fontMetrics, after applying any symbol
* replacements defined in symbol.js
*/
var lookupSymbol = function lookupSymbol(value, fontName, mode) {
	if (symbols[mode][value]) {
		var replacement = symbols[mode][value].replace;
		if (replacement) value = replacement;
	}
	return {
		value,
		metrics: getCharacterMetrics(value, fontName, mode)
	};
};
/**
* Makes a symbolNode after translation via the list of symbols in symbols.js.
* Correctly pulls out metrics for the character, and optionally takes a list of
* classes to be attached to the node.
*
* TODO: make argument order closer to makeSpan
* TODO: add a separate argument for math class (e.g. `mop`, `mbin`), which
* should if present come first in `classes`.
* TODO(#953): Make `options` mandatory and always pass it in.
*/
var makeSymbol = function makeSymbol(value, fontName, mode, options, classes) {
	var lookup = lookupSymbol(value, fontName, mode);
	var metrics = lookup.metrics;
	value = lookup.value;
	var symbolNode;
	if (metrics) {
		var italic = metrics.italic;
		if (mode === "text" || options && options.font === "mathit") italic = 0;
		symbolNode = new SymbolNode(value, metrics.height, metrics.depth, italic, metrics.skew, metrics.width, classes);
	} else {
		typeof console !== "undefined" && console.warn("No character metrics " + ("for '" + value + "' in style '" + fontName + "' and mode '" + mode + "'"));
		symbolNode = new SymbolNode(value, 0, 0, 0, 0, 0, classes);
	}
	if (options) {
		symbolNode.maxFontSize = options.sizeMultiplier;
		if (options.style.isTight()) symbolNode.classes.push("mtight");
		var color = options.getColor();
		if (color) symbolNode.style.color = color;
	}
	return symbolNode;
};
/**
* Makes a symbol in Main-Regular or AMS-Regular.
* Used for rel, bin, open, close, inner, and punct.
*/
var mathsym = function mathsym(value, mode, options, classes) {
	if (classes === void 0) classes = [];
	if (options.font === "boldsymbol" && lookupSymbol(value, "Main-Bold", mode).metrics) return makeSymbol(value, "Main-Bold", mode, options, classes.concat(["mathbf"]));
	else if (value === "\\" || symbols[mode][value].font === "main") return makeSymbol(value, "Main-Regular", mode, options, classes);
	else return makeSymbol(value, "AMS-Regular", mode, options, classes.concat(["amsrm"]));
};
/**
* Determines which of the two font names (Main-Bold and Math-BoldItalic) and
* corresponding style tags (mathbf or boldsymbol) to use for font "boldsymbol",
* depending on the symbol.  Use this function instead of fontMap for font
* "boldsymbol".
*/
var boldsymbol = function boldsymbol(value, mode, options, classes, type) {
	if (type !== "textord" && lookupSymbol(value, "Math-BoldItalic", mode).metrics) return {
		fontName: "Math-BoldItalic",
		fontClass: "boldsymbol"
	};
	else return {
		fontName: "Main-Bold",
		fontClass: "mathbf"
	};
};
/**
* Makes either a mathord or textord in the correct font and color.
*/
var makeOrd = function makeOrd(group, options, type) {
	var mode = group.mode;
	var text = group.text;
	var classes = ["mord"];
	var isFont = mode === "math" || mode === "text" && options.font;
	var fontOrFamily = isFont ? options.font : options.fontFamily;
	var wideFontName = "";
	var wideFontClass = "";
	if (text.charCodeAt(0) === 55349) [wideFontName, wideFontClass] = wideCharacterFont(text, mode);
	if (wideFontName.length > 0) return makeSymbol(text, wideFontName, mode, options, classes.concat(wideFontClass));
	else if (fontOrFamily) {
		var fontName;
		var fontClasses;
		if (fontOrFamily === "boldsymbol") {
			var fontData = boldsymbol(text, mode, options, classes, type);
			fontName = fontData.fontName;
			fontClasses = [fontData.fontClass];
		} else if (isFont) {
			fontName = fontMap[fontOrFamily].fontName;
			fontClasses = [fontOrFamily];
		} else {
			fontName = retrieveTextFontName(fontOrFamily, options.fontWeight, options.fontShape);
			fontClasses = [
				fontOrFamily,
				options.fontWeight,
				options.fontShape
			];
		}
		if (lookupSymbol(text, fontName, mode).metrics) return makeSymbol(text, fontName, mode, options, classes.concat(fontClasses));
		else if (ligatures.hasOwnProperty(text) && fontName.slice(0, 10) === "Typewriter") {
			var parts = [];
			for (var i = 0; i < text.length; i++) parts.push(makeSymbol(text[i], fontName, mode, options, classes.concat(fontClasses)));
			return makeFragment(parts);
		}
	}
	if (type === "mathord") return makeSymbol(text, "Math-Italic", mode, options, classes.concat(["mathnormal"]));
	else if (type === "textord") {
		var font = symbols[mode][text] && symbols[mode][text].font;
		if (font === "ams") return makeSymbol(text, retrieveTextFontName("amsrm", options.fontWeight, options.fontShape), mode, options, classes.concat("amsrm", options.fontWeight, options.fontShape));
		else if (font === "main" || !font) return makeSymbol(text, retrieveTextFontName("textrm", options.fontWeight, options.fontShape), mode, options, classes.concat(options.fontWeight, options.fontShape));
		else {
			var _fontName3 = retrieveTextFontName(font, options.fontWeight, options.fontShape);
			return makeSymbol(text, _fontName3, mode, options, classes.concat(_fontName3, options.fontWeight, options.fontShape));
		}
	} else throw new Error("unexpected type: " + type + " in makeOrd");
};
/**
* Returns true if subsequent symbolNodes have the same classes, skew, maxFont,
* and styles. For mathnormal text, the left node must also have zero italic
* correction so we don't lose spacing between combined glyphs.
*/
var canCombine = (prev, next) => {
	if (createClass(prev.classes) !== createClass(next.classes) || prev.skew !== next.skew || prev.maxFontSize !== next.maxFontSize || prev.italic !== 0 && prev.hasClass("mathnormal")) return false;
	if (prev.classes.length === 1) {
		var cls = prev.classes[0];
		if (cls === "mbin" || cls === "mord") return false;
	}
	for (var key of Object.keys(prev.style)) if (prev.style[key] !== next.style[key]) return false;
	for (var _key of Object.keys(next.style)) if (prev.style[_key] !== next.style[_key]) return false;
	return true;
};
/**
* Combine consecutive domTree.symbolNodes into a single symbolNode.
* Note: this function mutates the argument.
*/
var tryCombineChars = (chars) => {
	for (var i = 0; i < chars.length - 1; i++) {
		var prev = chars[i];
		var next = chars[i + 1];
		if (prev instanceof SymbolNode && next instanceof SymbolNode && canCombine(prev, next)) {
			prev.text += next.text;
			prev.height = Math.max(prev.height, next.height);
			prev.depth = Math.max(prev.depth, next.depth);
			prev.italic = next.italic;
			chars.splice(i + 1, 1);
			i--;
		}
	}
	return chars;
};
/**
* Calculate the height, depth, and maxFontSize of an element based on its
* children.
*/
var sizeElementFromChildren = function sizeElementFromChildren(elem) {
	var height = 0;
	var depth = 0;
	var maxFontSize = 0;
	for (var i = 0; i < elem.children.length; i++) {
		var child = elem.children[i];
		if (child.height > height) height = child.height;
		if (child.depth > depth) depth = child.depth;
		if (child.maxFontSize > maxFontSize) maxFontSize = child.maxFontSize;
	}
	elem.height = height;
	elem.depth = depth;
	elem.maxFontSize = maxFontSize;
};
/**
* Makes a span with the given list of classes, list of children, and options.
*
* TODO(#953): Ensure that `options` is always provided (currently some call
* sites don't pass it) and make the type below mandatory.
* TODO: add a separate argument for math class (e.g. `mop`, `mbin`), which
* should if present come first in `classes`.
*/
var makeSpan = function makeSpan(classes, children, options, style) {
	var span = new Span(classes, children, options, style);
	sizeElementFromChildren(span);
	return span;
};
var makeSvgSpan = (classes, children, options, style) => new Span(classes, children, options, style);
var makeLineSpan = function makeLineSpan(className, options, thickness) {
	var line = makeSpan([className], [], options);
	line.height = Math.max(thickness || options.fontMetrics().defaultRuleThickness, options.minRuleThickness);
	line.style.borderBottomWidth = makeEm(line.height);
	line.maxFontSize = 1;
	return line;
};
/**
* Makes an anchor with the given href, list of classes, list of children,
* and options.
*/
var makeAnchor = function makeAnchor(href, classes, children, options) {
	var anchor = new Anchor(href, classes, children, options);
	sizeElementFromChildren(anchor);
	return anchor;
};
/**
* Makes a document fragment with the given list of children.
*/
var makeFragment = function makeFragment(children) {
	var fragment = new DocumentFragment(children);
	sizeElementFromChildren(fragment);
	return fragment;
};
/**
* Wraps group in a span if it's a document fragment, allowing to apply classes
* and styles
*/
var wrapFragment = function wrapFragment(group, options) {
	if (group instanceof DocumentFragment) return makeSpan([], [group], options);
	return group;
};
var getVListChildrenAndDepth = function getVListChildrenAndDepth(params) {
	if (params.positionType === "individualShift") {
		var oldChildren = params.children;
		var children = [oldChildren[0]];
		var _depth = -oldChildren[0].shift - oldChildren[0].elem.depth;
		var currPos = _depth;
		for (var i = 1; i < oldChildren.length; i++) {
			var diff = -oldChildren[i].shift - currPos - oldChildren[i].elem.depth;
			var size = diff - (oldChildren[i - 1].elem.height + oldChildren[i - 1].elem.depth);
			currPos = currPos + diff;
			children.push({
				type: "kern",
				size
			});
			children.push(oldChildren[i]);
		}
		return {
			children,
			depth: _depth
		};
	}
	var depth;
	if (params.positionType === "top") {
		var bottom = params.positionData;
		for (var _i = 0; _i < params.children.length; _i++) {
			var child = params.children[_i];
			bottom -= child.type === "kern" ? child.size : child.elem.height + child.elem.depth;
		}
		depth = bottom;
	} else if (params.positionType === "bottom") depth = -params.positionData;
	else {
		var firstChild = params.children[0];
		if (firstChild.type !== "elem") throw new Error("First child must have type \"elem\".");
		if (params.positionType === "shift") depth = -firstChild.elem.depth - params.positionData;
		else if (params.positionType === "firstBaseline") depth = -firstChild.elem.depth;
		else throw new Error("Invalid positionType " + params.positionType + ".");
	}
	return {
		children: params.children,
		depth
	};
};
/**
* Makes a vertical list by stacking elements and kerns on top of each other.
* Allows for many different ways of specifying the positioning method.
*
* See VListParam documentation above.
*/
var makeVList = function makeVList(params, options) {
	var { children, depth } = getVListChildrenAndDepth(params);
	var pstrutSize = 0;
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		if (child.type === "elem") {
			var elem = child.elem;
			pstrutSize = Math.max(pstrutSize, elem.maxFontSize, elem.height);
		}
	}
	pstrutSize += 2;
	var pstrut = makeSpan(["pstrut"], []);
	pstrut.style.height = makeEm(pstrutSize);
	var realChildren = [];
	var minPos = depth;
	var maxPos = depth;
	var currPos = depth;
	for (var _i2 = 0; _i2 < children.length; _i2++) {
		var _child = children[_i2];
		if (_child.type === "kern") currPos += _child.size;
		else {
			var _elem = _child.elem;
			var classes = _child.wrapperClasses || [];
			var style = _child.wrapperStyle || {};
			var childWrap = makeSpan(classes, [pstrut, _elem], void 0, style);
			childWrap.style.top = makeEm(-pstrutSize - currPos - _elem.depth);
			if (_child.marginLeft) childWrap.style.marginLeft = _child.marginLeft;
			if (_child.marginRight) childWrap.style.marginRight = _child.marginRight;
			realChildren.push(childWrap);
			currPos += _elem.height + _elem.depth;
		}
		minPos = Math.min(minPos, currPos);
		maxPos = Math.max(maxPos, currPos);
	}
	var vlist = makeSpan(["vlist"], realChildren);
	vlist.style.height = makeEm(maxPos);
	var rows;
	if (minPos < 0) {
		var depthStrut = makeSpan(["vlist"], [makeSpan([], [])]);
		depthStrut.style.height = makeEm(-minPos);
		rows = [makeSpan(["vlist-r"], [vlist, makeSpan(["vlist-s"], [new SymbolNode("​")])]), makeSpan(["vlist-r"], [depthStrut])];
	} else rows = [makeSpan(["vlist-r"], [vlist])];
	var vtable = makeSpan(["vlist-t"], rows);
	if (rows.length === 2) vtable.classes.push("vlist-t2");
	vtable.height = maxPos;
	vtable.depth = -minPos;
	return vtable;
};
var makeGlue = (measurement, options) => {
	var rule = makeSpan(["mspace"], [], options);
	var size = calculateSize(measurement, options);
	rule.style.marginRight = makeEm(size);
	return rule;
};
var retrieveTextFontName = function retrieveTextFontName(fontFamily, fontWeight, fontShape) {
	var baseFontName = "";
	switch (fontFamily) {
		case "amsrm":
			baseFontName = "AMS";
			break;
		case "textrm":
			baseFontName = "Main";
			break;
		case "textsf":
			baseFontName = "SansSerif";
			break;
		case "texttt":
			baseFontName = "Typewriter";
			break;
		default: baseFontName = fontFamily;
	}
	var fontStylesName;
	if (fontWeight === "textbf" && fontShape === "textit") fontStylesName = "BoldItalic";
	else if (fontWeight === "textbf") fontStylesName = "Bold";
	else if (fontWeight === "textit") fontStylesName = "Italic";
	else fontStylesName = "Regular";
	return baseFontName + "-" + fontStylesName;
};
/**
* Maps TeX font commands to objects containing:
* - variant: string used for "mathvariant" attribute in buildMathML.js
* - fontName: the "style" parameter to fontMetrics.getCharacterMetrics
*/
var fontMap = {
	"mathbf": {
		variant: "bold",
		fontName: "Main-Bold"
	},
	"mathrm": {
		variant: "normal",
		fontName: "Main-Regular"
	},
	"textit": {
		variant: "italic",
		fontName: "Main-Italic"
	},
	"mathit": {
		variant: "italic",
		fontName: "Main-Italic"
	},
	"mathnormal": {
		variant: "italic",
		fontName: "Math-Italic"
	},
	"mathsfit": {
		variant: "sans-serif-italic",
		fontName: "SansSerif-Italic"
	},
	"mathbb": {
		variant: "double-struck",
		fontName: "AMS-Regular"
	},
	"mathcal": {
		variant: "script",
		fontName: "Caligraphic-Regular"
	},
	"mathfrak": {
		variant: "fraktur",
		fontName: "Fraktur-Regular"
	},
	"mathscr": {
		variant: "script",
		fontName: "Script-Regular"
	},
	"mathsf": {
		variant: "sans-serif",
		fontName: "SansSerif-Regular"
	},
	"mathtt": {
		variant: "monospace",
		fontName: "Typewriter-Regular"
	}
};
var svgData = {
	vec: [
		"vec",
		.471,
		.714
	],
	oiintSize1: [
		"oiintSize1",
		.957,
		.499
	],
	oiintSize2: [
		"oiintSize2",
		1.472,
		.659
	],
	oiiintSize1: [
		"oiiintSize1",
		1.304,
		.499
	],
	oiiintSize2: [
		"oiiintSize2",
		1.98,
		.659
	]
};
var staticSvg = function staticSvg(value, options) {
	var [pathName, width, height] = svgData[value];
	var span = makeSvgSpan(["overlay"], [new SvgNode([new PathNode(pathName)], {
		"width": makeEm(width),
		"height": makeEm(height),
		"style": "width:" + makeEm(width),
		"viewBox": "0 0 " + 1e3 * width + " " + 1e3 * height,
		"preserveAspectRatio": "xMinYMin"
	})], options);
	span.height = height;
	span.style.height = makeEm(height);
	span.style.width = makeEm(width);
	return span;
};
var thinspace = {
	number: 3,
	unit: "mu"
};
var mediumspace = {
	number: 4,
	unit: "mu"
};
var thickspace = {
	number: 5,
	unit: "mu"
};
var spacings = {
	mord: {
		mop: thinspace,
		mbin: mediumspace,
		mrel: thickspace,
		minner: thinspace
	},
	mop: {
		mord: thinspace,
		mop: thinspace,
		mrel: thickspace,
		minner: thinspace
	},
	mbin: {
		mord: mediumspace,
		mop: mediumspace,
		mopen: mediumspace,
		minner: mediumspace
	},
	mrel: {
		mord: thickspace,
		mop: thickspace,
		mopen: thickspace,
		minner: thickspace
	},
	mopen: {},
	mclose: {
		mop: thinspace,
		mbin: mediumspace,
		mrel: thickspace,
		minner: thinspace
	},
	mpunct: {
		mord: thinspace,
		mop: thinspace,
		mrel: thickspace,
		mopen: thinspace,
		mclose: thinspace,
		mpunct: thinspace,
		minner: thinspace
	},
	minner: {
		mord: thinspace,
		mop: thinspace,
		mbin: mediumspace,
		mrel: thickspace,
		mopen: thinspace,
		mpunct: thinspace,
		minner: thinspace
	}
};
var tightSpacings = {
	mord: { mop: thinspace },
	mop: {
		mord: thinspace,
		mop: thinspace
	},
	mbin: {},
	mrel: {},
	mopen: {},
	mclose: { mop: thinspace },
	mpunct: {},
	minner: { mop: thinspace }
};
/**
* All registered functions.
* `functions.js` just exports this same dictionary again and makes it public.
* `Parser.js` requires this dictionary.
*/
var _functions = {};
/**
* All HTML builders. Should be only used in the `define*` and the `build*ML`
* functions.
*/
var _htmlGroupBuilders = {};
/**
* All MathML builders. Should be only used in the `define*` and the `build*ML`
* functions.
*/
var _mathmlGroupBuilders = {};
function defineFunction(_ref) {
	var { type, names, props, handler, htmlBuilder, mathmlBuilder } = _ref;
	var data = {
		type,
		numArgs: props.numArgs,
		argTypes: props.argTypes,
		allowedInArgument: !!props.allowedInArgument,
		allowedInText: !!props.allowedInText,
		allowedInMath: props.allowedInMath === void 0 ? true : props.allowedInMath,
		numOptionalArgs: props.numOptionalArgs || 0,
		infix: !!props.infix,
		primitive: !!props.primitive,
		handler
	};
	for (var i = 0; i < names.length; ++i) _functions[names[i]] = data;
	if (type) {
		if (htmlBuilder) _htmlGroupBuilders[type] = htmlBuilder;
		if (mathmlBuilder) _mathmlGroupBuilders[type] = mathmlBuilder;
	}
}
/**
* Use this to register only the HTML and MathML builders for a function (e.g.
* if the function's ParseNode is generated in Parser.js rather than via a
* stand-alone handler provided to `defineFunction`).
*/
function defineFunctionBuilders(_ref2) {
	var { type, htmlBuilder, mathmlBuilder } = _ref2;
	defineFunction({
		type,
		names: [],
		props: { numArgs: 0 },
		handler() {
			throw new Error("Should never be called.");
		},
		htmlBuilder,
		mathmlBuilder
	});
}
var normalizeArgument = function normalizeArgument(arg) {
	return arg.type === "ordgroup" && arg.body.length === 1 ? arg.body[0] : arg;
};
var ordargument = function ordargument(arg) {
	return arg.type === "ordgroup" ? arg.body : [arg];
};
/**
* This file does the main work of building a domTree structure from a parse
* tree. The entry point is the `buildHTML` function, which takes a parse tree.
* Then, the buildExpression, buildGroup, and various groupBuilders functions
* are called, to produce a final HTML tree.
*/
var binLeftCanceller = new Set([
	"leftmost",
	"mbin",
	"mopen",
	"mrel",
	"mop",
	"mpunct"
]);
var binRightCanceller = new Set([
	"rightmost",
	"mrel",
	"mclose",
	"mpunct"
]);
var styleMap$1 = {
	"display": Style$1.DISPLAY,
	"text": Style$1.TEXT,
	"script": Style$1.SCRIPT,
	"scriptscript": Style$1.SCRIPTSCRIPT
};
var DomEnum = {
	mord: "mord",
	mop: "mop",
	mbin: "mbin",
	mrel: "mrel",
	mopen: "mopen",
	mclose: "mclose",
	mpunct: "mpunct",
	minner: "minner"
};
/**
* Take a list of nodes, build them in order, and return a list of the built
* nodes. documentFragments are flattened into their contents, so the
* returned list contains no fragments. `isRealGroup` is true if `expression`
* is a real group (no atoms will be added on either side), as opposed to
* a partial group (e.g. one created by \color). `surrounding` is an array
* consisting type of nodes that will be added to the left and right.
*/
var buildExpression$1 = function buildExpression(expression, options, isRealGroup, surrounding) {
	if (surrounding === void 0) surrounding = [null, null];
	var groups = [];
	for (var i = 0; i < expression.length; i++) {
		var output = buildGroup$1(expression[i], options);
		if (output instanceof DocumentFragment) {
			var children = output.children;
			groups.push(...children);
		} else groups.push(output);
	}
	tryCombineChars(groups);
	if (!isRealGroup) return groups;
	var glueOptions = options;
	if (expression.length === 1) {
		var node = expression[0];
		if (node.type === "sizing") glueOptions = options.havingSize(node.size);
		else if (node.type === "styling") glueOptions = options.havingStyle(styleMap$1[node.style]);
	}
	var dummyPrev = makeSpan([surrounding[0] || "leftmost"], [], options);
	var dummyNext = makeSpan([surrounding[1] || "rightmost"], [], options);
	var isRoot = isRealGroup === "root";
	_traverseNonSpaceNodes(groups, (node, prev) => {
		var prevType = prev.classes[0];
		var type = node.classes[0];
		if (prevType === "mbin" && binRightCanceller.has(type)) prev.classes[0] = "mord";
		else if (type === "mbin" && binLeftCanceller.has(prevType)) node.classes[0] = "mord";
	}, { node: dummyPrev }, dummyNext, isRoot);
	_traverseNonSpaceNodes(groups, (node, prev) => {
		var _tightSpacings$prevTy, _spacings$prevType;
		var prevType = getTypeOfDomTree(prev);
		var type = getTypeOfDomTree(node);
		var space = prevType && type ? node.hasClass("mtight") ? (_tightSpacings$prevTy = tightSpacings[prevType]) == null ? void 0 : _tightSpacings$prevTy[type] : (_spacings$prevType = spacings[prevType]) == null ? void 0 : _spacings$prevType[type] : null;
		if (space) return makeGlue(space, glueOptions);
	}, { node: dummyPrev }, dummyNext, isRoot);
	return groups;
};
var _traverseNonSpaceNodes = function traverseNonSpaceNodes(nodes, callback, prev, next, isRoot) {
	if (next) nodes.push(next);
	var i = 0;
	for (; i < nodes.length; i++) {
		var node = nodes[i];
		var partialGroup = checkPartialGroup(node);
		if (partialGroup) {
			_traverseNonSpaceNodes(partialGroup.children, callback, prev, null, isRoot);
			continue;
		}
		var nonspace = !node.hasClass("mspace");
		if (nonspace) {
			var result = callback(node, prev.node);
			if (result) if (prev.insertAfter) prev.insertAfter(result);
			else {
				nodes.unshift(result);
				i++;
			}
		}
		if (nonspace) prev.node = node;
		else if (isRoot && node.hasClass("newline")) prev.node = makeSpan(["leftmost"]);
		prev.insertAfter = ((index) => (n) => {
			nodes.splice(index + 1, 0, n);
			i++;
		})(i);
	}
	if (next) nodes.pop();
};
var checkPartialGroup = function checkPartialGroup(node) {
	if (node instanceof DocumentFragment || node instanceof Anchor || node instanceof Span && node.hasClass("enclosing")) return node;
	return null;
};
var _getOutermostNode = function getOutermostNode(node, side) {
	var partialGroup = checkPartialGroup(node);
	if (partialGroup) {
		var children = partialGroup.children;
		if (children.length) {
			if (side === "right") return _getOutermostNode(children[children.length - 1], "right");
			else if (side === "left") return _getOutermostNode(children[0], "left");
		}
	}
	return node;
};
var getTypeOfDomTree = function getTypeOfDomTree(node, side) {
	if (!node) return null;
	if (side) node = _getOutermostNode(node, side);
	return DomEnum[node.classes[0]] || null;
};
var makeNullDelimiter = function makeNullDelimiter(options, classes) {
	var moreClasses = ["nulldelimiter"].concat(options.baseSizingClasses());
	return makeSpan(classes.concat(moreClasses));
};
/**
* buildGroup is the function that takes a group and calls the correct groupType
* function for it. It also handles the interaction of size and style changes
* between parents and children.
*/
var buildGroup$1 = function buildGroup(group, options, baseOptions) {
	if (!group) return makeSpan();
	if (_htmlGroupBuilders[group.type]) {
		var groupNode = _htmlGroupBuilders[group.type](group, options);
		if (baseOptions && options.size !== baseOptions.size) {
			groupNode = makeSpan(options.sizingClasses(baseOptions), [groupNode], options);
			var multiplier = options.sizeMultiplier / baseOptions.sizeMultiplier;
			groupNode.height *= multiplier;
			groupNode.depth *= multiplier;
		}
		return groupNode;
	} else throw new ParseError("Got group of unknown type: '" + group.type + "'");
};
/**
* Combine an array of HTML DOM nodes (e.g., the output of `buildExpression`)
* into an unbreakable HTML node of class .base, with proper struts to
* guarantee correct vertical extent.  `buildHTML` calls this repeatedly to
* make up the entire expression as a sequence of unbreakable units.
*/
function buildHTMLUnbreakable(children, options) {
	var body = makeSpan(["base"], children, options);
	var strut = makeSpan(["strut"]);
	strut.style.height = makeEm(body.height + body.depth);
	if (body.depth) strut.style.verticalAlign = makeEm(-body.depth);
	body.children.unshift(strut);
	return body;
}
/**
* Take an entire parse tree, and build it into an appropriate set of HTML
* nodes.
*/
function buildHTML(tree, options) {
	var tag = null;
	if (tree.length === 1 && tree[0].type === "tag") {
		tag = tree[0].tag;
		tree = tree[0].body;
	}
	var expression = buildExpression$1(tree, options, "root");
	var eqnNum;
	if (expression.length === 2 && expression[1].hasClass("tag")) eqnNum = expression.pop();
	var children = [];
	var parts = [];
	for (var i = 0; i < expression.length; i++) {
		parts.push(expression[i]);
		if (expression[i].hasClass("mbin") || expression[i].hasClass("mrel") || expression[i].hasClass("allowbreak")) {
			var nobreak = false;
			while (i < expression.length - 1 && expression[i + 1].hasClass("mspace") && !expression[i + 1].hasClass("newline")) {
				i++;
				parts.push(expression[i]);
				if (expression[i].hasClass("nobreak")) nobreak = true;
			}
			if (!nobreak) {
				children.push(buildHTMLUnbreakable(parts, options));
				parts = [];
			}
		} else if (expression[i].hasClass("newline")) {
			parts.pop();
			if (parts.length > 0) {
				children.push(buildHTMLUnbreakable(parts, options));
				parts = [];
			}
			children.push(expression[i]);
		}
	}
	if (parts.length > 0) children.push(buildHTMLUnbreakable(parts, options));
	var tagChild;
	if (tag) {
		tagChild = buildHTMLUnbreakable(buildExpression$1(tag, options, true), options);
		tagChild.classes = ["tag"];
		children.push(tagChild);
	} else if (eqnNum) children.push(eqnNum);
	var htmlNode = makeSpan(["katex-html"], children);
	htmlNode.setAttribute("aria-hidden", "true");
	if (tagChild) {
		var strut = tagChild.children[0];
		strut.style.height = makeEm(htmlNode.height + htmlNode.depth);
		if (htmlNode.depth) strut.style.verticalAlign = makeEm(-htmlNode.depth);
	}
	return htmlNode;
}
/**
* These objects store data about MathML nodes. This is the MathML equivalent
* of the types in domTree.js. Since MathML handles its own rendering, and
* since we're mainly using MathML to improve accessibility, we don't manage
* any of the styling state that the plain DOM nodes do.
*
* The `toNode` and `toMarkup` functions work similarly to how they do in
* domTree.js, creating namespaced DOM nodes and HTML text markup respectively.
*/
function newDocumentFragment(children) {
	return new DocumentFragment(children);
}
/**
* This node represents a general purpose MathML node of any type. The
* constructor requires the type of node to create (for example, `"mo"` or
* `"mspace"`, corresponding to `<mo>` and `<mspace>` tags).
*/
var MathNode = class {
	constructor(type, children, classes) {
		this.type = type;
		this.attributes = {};
		this.children = children || [];
		this.classes = classes || [];
	}
	/**
	* Sets an attribute on a MathML node. MathML depends on attributes to convey a
	* semantic content, so this is used heavily.
	*/
	setAttribute(name, value) {
		this.attributes[name] = value;
	}
	/**
	* Gets an attribute on a MathML node.
	*/
	getAttribute(name) {
		return this.attributes[name];
	}
	/**
	* Converts the math node into a MathML-namespaced DOM element.
	*/
	toNode() {
		var node = document.createElementNS("http://www.w3.org/1998/Math/MathML", this.type);
		for (var attr in this.attributes) if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) node.setAttribute(attr, this.attributes[attr]);
		if (this.classes.length > 0) node.className = createClass(this.classes);
		for (var i = 0; i < this.children.length; i++) if (this.children[i] instanceof TextNode && this.children[i + 1] instanceof TextNode) {
			var text = this.children[i].toText() + this.children[++i].toText();
			while (this.children[i + 1] instanceof TextNode) text += this.children[++i].toText();
			node.appendChild(new TextNode(text).toNode());
		} else node.appendChild(this.children[i].toNode());
		return node;
	}
	/**
	* Converts the math node into an HTML markup string.
	*/
	toMarkup() {
		var markup = "<" + this.type;
		for (var attr in this.attributes) if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
			markup += " " + attr + "=\"";
			markup += escape$1(this.attributes[attr]);
			markup += "\"";
		}
		if (this.classes.length > 0) markup += " class =\"" + escape$1(createClass(this.classes)) + "\"";
		markup += ">";
		for (var i = 0; i < this.children.length; i++) markup += this.children[i].toMarkup();
		markup += "</" + this.type + ">";
		return markup;
	}
	/**
	* Converts the math node into a string, similar to innerText, but escaped.
	*/
	toText() {
		return this.children.map((child) => child.toText()).join("");
	}
};
/**
* This node represents a piece of text.
*/
var TextNode = class {
	constructor(text) {
		this.text = text;
	}
	/**
	* Converts the text node into a DOM text node.
	*/
	toNode() {
		return document.createTextNode(this.text);
	}
	/**
	* Converts the text node into escaped HTML markup
	* (representing the text itself).
	*/
	toMarkup() {
		return escape$1(this.toText());
	}
	/**
	* Converts the text node into a string
	* (representing the text itself).
	*/
	toText() {
		return this.text;
	}
};
/**
* This node represents a space, but may render as <mspace.../> or as text,
* depending on the width.
*/
var SpaceNode = class {
	/**
	* Create a Space node with width given in CSS ems.
	*/
	constructor(width) {
		this.width = width;
		if (width >= .05555 && width <= .05556) this.character = " ";
		else if (width >= .1666 && width <= .1667) this.character = " ";
		else if (width >= .2222 && width <= .2223) this.character = " ";
		else if (width >= .2777 && width <= .2778) this.character = "  ";
		else if (width >= -.05556 && width <= -.05555) this.character = " ⁣";
		else if (width >= -.1667 && width <= -.1666) this.character = " ⁣";
		else if (width >= -.2223 && width <= -.2222) this.character = " ⁣";
		else if (width >= -.2778 && width <= -.2777) this.character = " ⁣";
		else this.character = null;
	}
	/**
	* Converts the math node into a MathML-namespaced DOM element.
	*/
	toNode() {
		if (this.character) return document.createTextNode(this.character);
		else {
			var node = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mspace");
			node.setAttribute("width", makeEm(this.width));
			return node;
		}
	}
	/**
	* Converts the math node into an HTML markup string.
	*/
	toMarkup() {
		if (this.character) return "<mtext>" + this.character + "</mtext>";
		else return "<mspace width=\"" + makeEm(this.width) + "\"/>";
	}
	/**
	* Converts the math node into a string, similar to innerText.
	*/
	toText() {
		if (this.character) return this.character;
		else return " ";
	}
};
/**
* This file converts a parse tree into a corresponding MathML tree. The main
* entry point is the `buildMathML` function, which takes a parse tree from the
* parser.
*/
var noVariantSymbols = new Set(["\\imath", "\\jmath"]);
var rowLikeTypes = new Set(["mrow", "mtable"]);
/**
* Takes a symbol and converts it into a MathML text node after performing
* optional replacement from symbols.js.
*/
var makeText = function makeText(text, mode, options) {
	if (symbols[mode][text] && symbols[mode][text].replace && text.charCodeAt(0) !== 55349 && !(ligatures.hasOwnProperty(text) && options && (options.fontFamily && options.fontFamily.slice(4, 6) === "tt" || options.font && options.font.slice(4, 6) === "tt"))) text = symbols[mode][text].replace;
	return new TextNode(text);
};
/**
* Wrap the given array of nodes in an <mrow> node if needed, i.e.,
* unless the array has length 1.  Always returns a single node.
*/
var makeRow = function makeRow(body) {
	if (body.length === 1) return body[0];
	else return new MathNode("mrow", body);
};
/**
* Returns the math variant as a string or null if none is required.
*/
var getVariant = function getVariant(group, options) {
	if (options.fontFamily === "texttt") return "monospace";
	else if (options.fontFamily === "textsf") if (options.fontShape === "textit" && options.fontWeight === "textbf") return "sans-serif-bold-italic";
	else if (options.fontShape === "textit") return "sans-serif-italic";
	else if (options.fontWeight === "textbf") return "bold-sans-serif";
	else return "sans-serif";
	else if (options.fontShape === "textit" && options.fontWeight === "textbf") return "bold-italic";
	else if (options.fontShape === "textit") return "italic";
	else if (options.fontWeight === "textbf") return "bold";
	var font = options.font;
	if (!font || font === "mathnormal") return null;
	var mode = group.mode;
	if (font === "mathit") return "italic";
	else if (font === "boldsymbol") return group.type === "textord" ? "bold" : "bold-italic";
	else if (font === "mathbf") return "bold";
	else if (font === "mathbb") return "double-struck";
	else if (font === "mathsfit") return "sans-serif-italic";
	else if (font === "mathfrak") return "fraktur";
	else if (font === "mathscr" || font === "mathcal") return "script";
	else if (font === "mathsf") return "sans-serif";
	else if (font === "mathtt") return "monospace";
	var text = group.text;
	if (noVariantSymbols.has(text)) return null;
	if (symbols[mode][text]) {
		var replacement = symbols[mode][text].replace;
		if (replacement) text = replacement;
	}
	var fontName = fontMap[font].fontName;
	if (getCharacterMetrics(text, fontName, mode)) return fontMap[font].variant;
	return null;
};
/**
* Check for <mi>.</mi> which is how a dot renders in MathML,
* or <mo separator="true" lspace="0em" rspace="0em">,</mo>
* which is how a braced comma {,} renders in MathML
*/
function isNumberPunctuation(group) {
	if (!group) return false;
	if (group.type === "mi" && group.children.length === 1) {
		var child = group.children[0];
		return child instanceof TextNode && child.text === ".";
	} else if (group.type === "mo" && group.children.length === 1 && group.getAttribute("separator") === "true" && group.getAttribute("lspace") === "0em" && group.getAttribute("rspace") === "0em") {
		var _child = group.children[0];
		return _child instanceof TextNode && _child.text === ",";
	} else return false;
}
/**
* Takes a list of nodes, builds them, and returns a list of the generated
* MathML nodes.  Also combine consecutive <mtext> outputs into a single
* <mtext> tag.
*/
var buildExpression = function buildExpression(expression, options, isOrdgroup) {
	if (expression.length === 1) {
		var group = buildGroup(expression[0], options);
		if (isOrdgroup && group instanceof MathNode && group.type === "mo") {
			group.setAttribute("lspace", "0em");
			group.setAttribute("rspace", "0em");
		}
		return [group];
	}
	var groups = [];
	var lastGroup;
	for (var i = 0; i < expression.length; i++) {
		var _group = buildGroup(expression[i], options);
		if (_group instanceof MathNode && lastGroup instanceof MathNode) {
			if (_group.type === "mtext" && lastGroup.type === "mtext" && _group.getAttribute("mathvariant") === lastGroup.getAttribute("mathvariant")) {
				lastGroup.children.push(..._group.children);
				continue;
			} else if (_group.type === "mn" && lastGroup.type === "mn") {
				lastGroup.children.push(..._group.children);
				continue;
			} else if (isNumberPunctuation(_group) && lastGroup.type === "mn") {
				lastGroup.children.push(..._group.children);
				continue;
			} else if (_group.type === "mn" && isNumberPunctuation(lastGroup)) {
				_group.children = [...lastGroup.children, ..._group.children];
				groups.pop();
			} else if ((_group.type === "msup" || _group.type === "msub") && _group.children.length >= 1 && (lastGroup.type === "mn" || isNumberPunctuation(lastGroup))) {
				var base = _group.children[0];
				if (base instanceof MathNode && base.type === "mn") {
					base.children = [...lastGroup.children, ...base.children];
					groups.pop();
				}
			} else if (lastGroup.type === "mi" && lastGroup.children.length === 1) {
				var lastChild = lastGroup.children[0];
				if (lastChild instanceof TextNode && lastChild.text === "̸" && (_group.type === "mo" || _group.type === "mi" || _group.type === "mn")) {
					var child = _group.children[0];
					if (child instanceof TextNode && child.text.length > 0) {
						child.text = child.text.slice(0, 1) + "̸" + child.text.slice(1);
						groups.pop();
					}
				}
			}
		}
		groups.push(_group);
		lastGroup = _group;
	}
	return groups;
};
/**
* Equivalent to buildExpression, but wraps the elements in an <mrow>
* if there's more than one.  Returns a single node instead of an array.
*/
var buildExpressionRow = function buildExpressionRow(expression, options, isOrdgroup) {
	return makeRow(buildExpression(expression, options, isOrdgroup));
};
/**
* Takes a group from the parser and calls the appropriate groupBuilders function
* on it to produce a MathML node.
*/
var buildGroup = function buildGroup(group, options) {
	if (!group) return new MathNode("mrow");
	if (_mathmlGroupBuilders[group.type]) return _mathmlGroupBuilders[group.type](group, options);
	else throw new ParseError("Got group of unknown type: '" + group.type + "'");
};
/**
* Takes a full parse tree and settings and builds a MathML representation of
* it. In particular, we put the elements from building the parse tree into a
* <semantics> tag so we can also include that TeX source as an annotation.
*
* Note that we actually return a domTree element with a `<math>` inside it so
* we can do appropriate styling.
*/
function buildMathML(tree, texExpression, options, isDisplayMode, forMathmlOnly) {
	var expression = buildExpression(tree, options);
	var wrapper;
	if (expression.length === 1 && expression[0] instanceof MathNode && rowLikeTypes.has(expression[0].type)) wrapper = expression[0];
	else wrapper = new MathNode("mrow", expression);
	var annotation = new MathNode("annotation", [new TextNode(texExpression)]);
	annotation.setAttribute("encoding", "application/x-tex");
	var math = new MathNode("math", [new MathNode("semantics", [wrapper, annotation])]);
	math.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");
	if (isDisplayMode) math.setAttribute("display", "block");
	return makeSpan([forMathmlOnly ? "katex" : "katex-mathml"], [math]);
}
/**
* This file contains information about the options that the Parser carries
* around with it while parsing. Data is held in an `Options` object, and when
* recursing, a new `Options` object can be created with the `.with*` and
* `.reset` functions.
*/
var sizeStyleMap = [
	[
		1,
		1,
		1
	],
	[
		2,
		1,
		1
	],
	[
		3,
		1,
		1
	],
	[
		4,
		2,
		1
	],
	[
		5,
		2,
		1
	],
	[
		6,
		3,
		1
	],
	[
		7,
		4,
		2
	],
	[
		8,
		6,
		3
	],
	[
		9,
		7,
		6
	],
	[
		10,
		8,
		7
	],
	[
		11,
		10,
		9
	]
];
var sizeMultipliers = [
	.5,
	.6,
	.7,
	.8,
	.9,
	1,
	1.2,
	1.44,
	1.728,
	2.074,
	2.488
];
var sizeAtStyle = function sizeAtStyle(size, style) {
	return style.size < 2 ? size : sizeStyleMap[size - 1][style.size - 1];
};
/**
* This is the main options class. It contains the current style, size, color,
* and font.
*
* Options objects should not be modified. To create a new Options with
* different properties, call a `.having*` method.
*/
var Options = class Options {
	constructor(data) {
		this.style = data.style;
		this.color = data.color;
		this.size = data.size || Options.BASESIZE;
		this.textSize = data.textSize || this.size;
		this.phantom = !!data.phantom;
		this.font = data.font || "";
		this.fontFamily = data.fontFamily || "";
		this.fontWeight = data.fontWeight || "";
		this.fontShape = data.fontShape || "";
		this.sizeMultiplier = sizeMultipliers[this.size - 1];
		this.maxSize = data.maxSize;
		this.minRuleThickness = data.minRuleThickness;
		this._fontMetrics = void 0;
	}
	/**
	* Returns a new options object with the same properties as "this".  Properties
	* from "extension" will be copied to the new options object.
	*/
	extend(extension) {
		var data = {
			style: this.style,
			size: this.size,
			textSize: this.textSize,
			color: this.color,
			phantom: this.phantom,
			font: this.font,
			fontFamily: this.fontFamily,
			fontWeight: this.fontWeight,
			fontShape: this.fontShape,
			maxSize: this.maxSize,
			minRuleThickness: this.minRuleThickness
		};
		Object.assign(data, extension);
		return new Options(data);
	}
	/**
	* Return an options object with the given style. If `this.style === style`,
	* returns `this`.
	*/
	havingStyle(style) {
		if (this.style === style) return this;
		else return this.extend({
			style,
			size: sizeAtStyle(this.textSize, style)
		});
	}
	/**
	* Return an options object with a cramped version of the current style. If
	* the current style is cramped, returns `this`.
	*/
	havingCrampedStyle() {
		return this.havingStyle(this.style.cramp());
	}
	/**
	* Return an options object with the given size and in at least `\textstyle`.
	* Returns `this` if appropriate.
	*/
	havingSize(size) {
		if (this.size === size && this.textSize === size) return this;
		else return this.extend({
			style: this.style.text(),
			size,
			textSize: size,
			sizeMultiplier: sizeMultipliers[size - 1]
		});
	}
	/**
	* Like `this.havingSize(BASESIZE).havingStyle(style)`. If `style` is omitted,
	* changes to at least `\textstyle`.
	*/
	havingBaseStyle(style) {
		style = style || this.style.text();
		var wantSize = sizeAtStyle(Options.BASESIZE, style);
		if (this.size === wantSize && this.textSize === Options.BASESIZE && this.style === style) return this;
		else return this.extend({
			style,
			size: wantSize
		});
	}
	/**
	* Remove the effect of sizing changes such as \Huge.
	* Keep the effect of the current style, such as \scriptstyle.
	*/
	havingBaseSizing() {
		var size;
		switch (this.style.id) {
			case 4:
			case 5:
				size = 3;
				break;
			case 6:
			case 7:
				size = 1;
				break;
			default: size = 6;
		}
		return this.extend({
			style: this.style.text(),
			size
		});
	}
	/**
	* Create a new options object with the given color.
	*/
	withColor(color) {
		return this.extend({ color });
	}
	/**
	* Create a new options object with "phantom" set to true.
	*/
	withPhantom() {
		return this.extend({ phantom: true });
	}
	/**
	* Creates a new options object with the given math font or old text font.
	* @type {[type]}
	*/
	withFont(font) {
		return this.extend({ font });
	}
	/**
	* Create a new options objects with the given fontFamily.
	*/
	withTextFontFamily(fontFamily) {
		return this.extend({
			fontFamily,
			font: ""
		});
	}
	/**
	* Creates a new options object with the given font weight
	*/
	withTextFontWeight(fontWeight) {
		return this.extend({
			fontWeight,
			font: ""
		});
	}
	/**
	* Creates a new options object with the given font weight
	*/
	withTextFontShape(fontShape) {
		return this.extend({
			fontShape,
			font: ""
		});
	}
	/**
	* Return the CSS sizing classes required to switch from enclosing options
	* `oldOptions` to `this`. Returns an array of classes.
	*/
	sizingClasses(oldOptions) {
		if (oldOptions.size !== this.size) return [
			"sizing",
			"reset-size" + oldOptions.size,
			"size" + this.size
		];
		else return [];
	}
	/**
	* Return the CSS sizing classes required to switch to the base size. Like
	* `this.havingSize(BASESIZE).sizingClasses(this)`.
	*/
	baseSizingClasses() {
		if (this.size !== Options.BASESIZE) return [
			"sizing",
			"reset-size" + this.size,
			"size" + Options.BASESIZE
		];
		else return [];
	}
	/**
	* Return the font metrics for this size.
	*/
	fontMetrics() {
		if (!this._fontMetrics) this._fontMetrics = getGlobalMetrics(this.size);
		return this._fontMetrics;
	}
	/**
	* Gets the CSS color of the current options object
	*/
	getColor() {
		if (this.phantom) return "transparent";
		else return this.color;
	}
};
/**
* The base size index.
*/
Options.BASESIZE = 6;
var optionsFromSettings = function optionsFromSettings(settings) {
	return new Options({
		style: settings.displayMode ? Style$1.DISPLAY : Style$1.TEXT,
		maxSize: settings.maxSize,
		minRuleThickness: settings.minRuleThickness
	});
};
var displayWrap = function displayWrap(node, settings) {
	if (settings.displayMode) {
		var classes = ["katex-display"];
		if (settings.leqno) classes.push("leqno");
		if (settings.fleqn) classes.push("fleqn");
		node = makeSpan(classes, [node]);
	}
	return node;
};
var buildTree = function buildTree(tree, expression, settings) {
	var options = optionsFromSettings(settings);
	var katexNode;
	if (settings.output === "mathml") return buildMathML(tree, expression, options, settings.displayMode, true);
	else if (settings.output === "html") katexNode = makeSpan(["katex"], [buildHTML(tree, options)]);
	else katexNode = makeSpan(["katex"], [buildMathML(tree, expression, options, settings.displayMode, false), buildHTML(tree, options)]);
	return displayWrap(katexNode, settings);
};
var buildHTMLTree = function buildHTMLTree(tree, expression, settings) {
	return displayWrap(makeSpan(["katex"], [buildHTML(tree, optionsFromSettings(settings))]), settings);
};
/**
* This file provides support to buildMathML.js and buildHTML.js
* for stretchy wide elements rendered from SVG files
* and other CSS trickery.
*/
var stretchyCodePoint = {
	widehat: "^",
	widecheck: "ˇ",
	widetilde: "~",
	utilde: "~",
	overleftarrow: "←",
	underleftarrow: "←",
	xleftarrow: "←",
	overrightarrow: "→",
	underrightarrow: "→",
	xrightarrow: "→",
	underbrace: "⏟",
	overbrace: "⏞",
	underbracket: "⎵",
	overbracket: "⎴",
	overgroup: "⏠",
	undergroup: "⏡",
	overleftrightarrow: "↔",
	underleftrightarrow: "↔",
	xleftrightarrow: "↔",
	Overrightarrow: "⇒",
	xRightarrow: "⇒",
	overleftharpoon: "↼",
	xleftharpoonup: "↼",
	overrightharpoon: "⇀",
	xrightharpoonup: "⇀",
	xLeftarrow: "⇐",
	xLeftrightarrow: "⇔",
	xhookleftarrow: "↩",
	xhookrightarrow: "↪",
	xmapsto: "↦",
	xrightharpoondown: "⇁",
	xleftharpoondown: "↽",
	xrightleftharpoons: "⇌",
	xleftrightharpoons: "⇋",
	xtwoheadleftarrow: "↞",
	xtwoheadrightarrow: "↠",
	xlongequal: "=",
	xtofrom: "⇄",
	xrightleftarrows: "⇄",
	xrightequilibrium: "⇌",
	xleftequilibrium: "⇋",
	"\\cdrightarrow": "→",
	"\\cdleftarrow": "←",
	"\\cdlongequal": "="
};
var stretchyMathML = function stretchyMathML(label) {
	var node = new MathNode("mo", [new TextNode(stretchyCodePoint[label.replace(/^\\/, "")])]);
	node.setAttribute("stretchy", "true");
	return node;
};
var katexImagesData = {
	overrightarrow: [
		["rightarrow"],
		.888,
		522,
		"xMaxYMin"
	],
	overleftarrow: [
		["leftarrow"],
		.888,
		522,
		"xMinYMin"
	],
	underrightarrow: [
		["rightarrow"],
		.888,
		522,
		"xMaxYMin"
	],
	underleftarrow: [
		["leftarrow"],
		.888,
		522,
		"xMinYMin"
	],
	xrightarrow: [
		["rightarrow"],
		1.469,
		522,
		"xMaxYMin"
	],
	"\\cdrightarrow": [
		["rightarrow"],
		3,
		522,
		"xMaxYMin"
	],
	xleftarrow: [
		["leftarrow"],
		1.469,
		522,
		"xMinYMin"
	],
	"\\cdleftarrow": [
		["leftarrow"],
		3,
		522,
		"xMinYMin"
	],
	Overrightarrow: [
		["doublerightarrow"],
		.888,
		560,
		"xMaxYMin"
	],
	xRightarrow: [
		["doublerightarrow"],
		1.526,
		560,
		"xMaxYMin"
	],
	xLeftarrow: [
		["doubleleftarrow"],
		1.526,
		560,
		"xMinYMin"
	],
	overleftharpoon: [
		["leftharpoon"],
		.888,
		522,
		"xMinYMin"
	],
	xleftharpoonup: [
		["leftharpoon"],
		.888,
		522,
		"xMinYMin"
	],
	xleftharpoondown: [
		["leftharpoondown"],
		.888,
		522,
		"xMinYMin"
	],
	overrightharpoon: [
		["rightharpoon"],
		.888,
		522,
		"xMaxYMin"
	],
	xrightharpoonup: [
		["rightharpoon"],
		.888,
		522,
		"xMaxYMin"
	],
	xrightharpoondown: [
		["rightharpoondown"],
		.888,
		522,
		"xMaxYMin"
	],
	xlongequal: [
		["longequal"],
		.888,
		334,
		"xMinYMin"
	],
	"\\cdlongequal": [
		["longequal"],
		3,
		334,
		"xMinYMin"
	],
	xtwoheadleftarrow: [
		["twoheadleftarrow"],
		.888,
		334,
		"xMinYMin"
	],
	xtwoheadrightarrow: [
		["twoheadrightarrow"],
		.888,
		334,
		"xMaxYMin"
	],
	overleftrightarrow: [
		["leftarrow", "rightarrow"],
		.888,
		522
	],
	overbrace: [
		[
			"leftbrace",
			"midbrace",
			"rightbrace"
		],
		1.6,
		548
	],
	underbrace: [
		[
			"leftbraceunder",
			"midbraceunder",
			"rightbraceunder"
		],
		1.6,
		548
	],
	underleftrightarrow: [
		["leftarrow", "rightarrow"],
		.888,
		522
	],
	xleftrightarrow: [
		["leftarrow", "rightarrow"],
		1.75,
		522
	],
	xLeftrightarrow: [
		["doubleleftarrow", "doublerightarrow"],
		1.75,
		560
	],
	xrightleftharpoons: [
		["leftharpoondownplus", "rightharpoonplus"],
		1.75,
		716
	],
	xleftrightharpoons: [
		["leftharpoonplus", "rightharpoondownplus"],
		1.75,
		716
	],
	xhookleftarrow: [
		["leftarrow", "righthook"],
		1.08,
		522
	],
	xhookrightarrow: [
		["lefthook", "rightarrow"],
		1.08,
		522
	],
	overlinesegment: [
		["leftlinesegment", "rightlinesegment"],
		.888,
		522
	],
	underlinesegment: [
		["leftlinesegment", "rightlinesegment"],
		.888,
		522
	],
	overbracket: [
		["leftbracketover", "rightbracketover"],
		1.6,
		440
	],
	underbracket: [
		["leftbracketunder", "rightbracketunder"],
		1.6,
		410
	],
	overgroup: [
		["leftgroup", "rightgroup"],
		.888,
		342
	],
	undergroup: [
		["leftgroupunder", "rightgroupunder"],
		.888,
		342
	],
	xmapsto: [
		["leftmapsto", "rightarrow"],
		1.5,
		522
	],
	xtofrom: [
		["leftToFrom", "rightToFrom"],
		1.75,
		528
	],
	xrightleftarrows: [
		["baraboveleftarrow", "rightarrowabovebar"],
		1.75,
		901
	],
	xrightequilibrium: [
		["baraboveshortleftharpoon", "rightharpoonaboveshortbar"],
		1.75,
		716
	],
	xleftequilibrium: [
		["shortbaraboveleftharpoon", "shortrightharpoonabovebar"],
		1.75,
		716
	]
};
var wideAccentLabels = new Set([
	"widehat",
	"widecheck",
	"widetilde",
	"utilde"
]);
var stretchySvg = function stretchySvg(group, options) {
	function buildSvgSpan_() {
		var viewBoxWidth = 4e5;
		var label = group.label.slice(1);
		if (wideAccentLabels.has(label)) {
			var grp = group;
			var numChars = grp.base.type === "ordgroup" ? grp.base.body.length : 1;
			var viewBoxHeight;
			var pathName;
			var _height;
			if (numChars > 5) if (label === "widehat" || label === "widecheck") {
				viewBoxHeight = 420;
				viewBoxWidth = 2364;
				_height = .42;
				pathName = label + "4";
			} else {
				viewBoxHeight = 312;
				viewBoxWidth = 2340;
				_height = .34;
				pathName = "tilde4";
			}
			else {
				var imgIndex = [
					1,
					1,
					2,
					2,
					3,
					3
				][numChars];
				if (label === "widehat" || label === "widecheck") {
					viewBoxWidth = [
						0,
						1062,
						2364,
						2364,
						2364
					][imgIndex];
					viewBoxHeight = [
						0,
						239,
						300,
						360,
						420
					][imgIndex];
					_height = [
						0,
						.24,
						.3,
						.3,
						.36,
						.42
					][imgIndex];
					pathName = label + imgIndex;
				} else {
					viewBoxWidth = [
						0,
						600,
						1033,
						2339,
						2340
					][imgIndex];
					viewBoxHeight = [
						0,
						260,
						286,
						306,
						312
					][imgIndex];
					_height = [
						0,
						.26,
						.286,
						.3,
						.306,
						.34
					][imgIndex];
					pathName = "tilde" + imgIndex;
				}
			}
			return {
				span: makeSvgSpan([], [new SvgNode([new PathNode(pathName)], {
					"width": "100%",
					"height": makeEm(_height),
					"viewBox": "0 0 " + viewBoxWidth + " " + viewBoxHeight,
					"preserveAspectRatio": "none"
				})], options),
				minWidth: 0,
				height: _height
			};
		} else {
			var spans = [];
			var data = katexImagesData[label];
			var [paths, _minWidth, _viewBoxHeight] = data;
			var _height2 = _viewBoxHeight / 1e3;
			var numSvgChildren = paths.length;
			var widthClasses;
			var aligns;
			if (numSvgChildren === 1) {
				var align1 = data[3];
				widthClasses = ["hide-tail"];
				aligns = [align1];
			} else if (numSvgChildren === 2) {
				widthClasses = ["halfarrow-left", "halfarrow-right"];
				aligns = ["xMinYMin", "xMaxYMin"];
			} else if (numSvgChildren === 3) {
				widthClasses = [
					"brace-left",
					"brace-center",
					"brace-right"
				];
				aligns = [
					"xMinYMin",
					"xMidYMin",
					"xMaxYMin"
				];
			} else throw new Error("Correct katexImagesData or update code here to support\n                    " + numSvgChildren + " children.");
			for (var i = 0; i < numSvgChildren; i++) {
				var _svgNode = new SvgNode([new PathNode(paths[i])], {
					"width": "400em",
					"height": makeEm(_height2),
					"viewBox": "0 0 " + viewBoxWidth + " " + _viewBoxHeight,
					"preserveAspectRatio": aligns[i] + " slice"
				});
				var _span = makeSvgSpan([widthClasses[i]], [_svgNode], options);
				if (numSvgChildren === 1) return {
					span: _span,
					minWidth: _minWidth,
					height: _height2
				};
				else {
					_span.style.height = makeEm(_height2);
					spans.push(_span);
				}
			}
			return {
				span: makeSpan(["stretchy"], spans, options),
				minWidth: _minWidth,
				height: _height2
			};
		}
	}
	var { span, minWidth, height } = buildSvgSpan_();
	span.height = height;
	span.style.height = makeEm(height);
	if (minWidth > 0) span.style.minWidth = makeEm(minWidth);
	return span;
};
var stretchyEnclose = function stretchyEnclose(inner, label, topPad, bottomPad, options) {
	var img;
	var totalHeight = inner.height + inner.depth + topPad + bottomPad;
	if (/fbox|color|angl/.test(label)) {
		img = makeSpan(["stretchy", label], [], options);
		if (label === "fbox") {
			var color = options.color && options.getColor();
			if (color) img.style.borderColor = color;
		}
	} else {
		var lines = [];
		if (/^[bx]cancel$/.test(label)) lines.push(new LineNode({
			"x1": "0",
			"y1": "0",
			"x2": "100%",
			"y2": "100%",
			"stroke-width": "0.046em"
		}));
		if (/^x?cancel$/.test(label)) lines.push(new LineNode({
			"x1": "0",
			"y1": "100%",
			"x2": "100%",
			"y2": "0",
			"stroke-width": "0.046em"
		}));
		img = makeSvgSpan([], [new SvgNode(lines, {
			"width": "100%",
			"height": makeEm(totalHeight)
		})], options);
	}
	img.height = totalHeight;
	img.style.height = makeEm(totalHeight);
	return img;
};
/**
* Asserts that the node is of the given type and returns it with stricter
* typing. Throws if the node's type does not match.
*/
function assertNodeType(node, type) {
	if (!node || node.type !== type) throw new Error("Expected node of type " + type + ", but got " + (node ? "node of type " + node.type : String(node)));
	return node;
}
/**
* Returns the node more strictly typed iff it is of the given type. Otherwise,
* returns null.
*/
function assertSymbolNodeType(node) {
	var typedNode = checkSymbolNodeType(node);
	if (!typedNode) throw new Error("Expected node of symbol group type, but got " + (node ? "node of type " + node.type : String(node)));
	return typedNode;
}
/**
* Returns the node more strictly typed iff it is of the given type. Otherwise,
* returns null.
*/
function checkSymbolNodeType(node) {
	if (node && (node.type === "atom" || NON_ATOMS.hasOwnProperty(node.type))) return node;
	return null;
}
var getBaseSymbol = (group) => {
	if (group instanceof SymbolNode) return group;
	if (hasHtmlDomChildren(group) && group.children.length === 1) return getBaseSymbol(group.children[0]);
};
var htmlBuilder$a = (grp, options) => {
	var base;
	var group;
	var supSubGroup;
	if (grp && grp.type === "supsub") {
		group = assertNodeType(grp.base, "accent");
		base = group.base;
		grp.base = base;
		supSubGroup = assertSpan(buildGroup$1(grp, options));
		grp.base = group;
	} else {
		group = assertNodeType(grp, "accent");
		base = group.base;
	}
	var body = buildGroup$1(base, options.havingCrampedStyle());
	var mustShift = group.isShifty && isCharacterBox(base);
	var skew = 0;
	if (mustShift) {
		var _getBaseSymbol$skew, _getBaseSymbol;
		skew = (_getBaseSymbol$skew = (_getBaseSymbol = getBaseSymbol(body)) == null ? void 0 : _getBaseSymbol.skew) != null ? _getBaseSymbol$skew : 0;
	}
	var accentBelow = group.label === "\\c";
	var clearance = accentBelow ? body.height + body.depth : Math.min(body.height, options.fontMetrics().xHeight);
	var accentBody;
	if (!group.isStretchy) {
		var accent;
		var width;
		if (group.label === "\\vec") {
			accent = staticSvg("vec", options);
			width = svgData.vec[1];
		} else {
			accent = makeOrd({
				type: "textord",
				mode: group.mode,
				text: group.label
			}, options, "textord");
			accent = assertSymbolDomNode(accent);
			accent.italic = 0;
			width = accent.width;
			if (accentBelow) clearance += accent.depth;
		}
		accentBody = makeSpan(["accent-body"], [accent]);
		var accentFull = group.label === "\\textcircled";
		if (accentFull) {
			accentBody.classes.push("accent-full");
			clearance = body.height;
		}
		var left = skew;
		if (!accentFull) left -= width / 2;
		accentBody.style.left = makeEm(left);
		if (group.label === "\\textcircled") accentBody.style.top = ".2em";
		accentBody = makeVList({
			positionType: "firstBaseline",
			children: [
				{
					type: "elem",
					elem: body
				},
				{
					type: "kern",
					size: -clearance
				},
				{
					type: "elem",
					elem: accentBody
				}
			]
		});
	} else {
		accentBody = stretchySvg(group, options);
		accentBody = makeVList({
			positionType: "firstBaseline",
			children: [{
				type: "elem",
				elem: body
			}, {
				type: "elem",
				elem: accentBody,
				wrapperClasses: ["svg-align"],
				wrapperStyle: skew > 0 ? {
					width: "calc(100% - " + makeEm(2 * skew) + ")",
					marginLeft: makeEm(2 * skew)
				} : void 0
			}]
		});
	}
	var accentWrap = makeSpan(["mord", "accent"], [accentBody], options);
	if (supSubGroup) {
		supSubGroup.children[0] = accentWrap;
		supSubGroup.height = Math.max(accentWrap.height, supSubGroup.height);
		supSubGroup.classes[0] = "mord";
		return supSubGroup;
	} else return accentWrap;
};
var mathmlBuilder$9 = (group, options) => {
	var accentNode = group.isStretchy ? stretchyMathML(group.label) : new MathNode("mo", [makeText(group.label, group.mode)]);
	var node = new MathNode("mover", [buildGroup(group.base, options), accentNode]);
	node.setAttribute("accent", "true");
	return node;
};
var NON_STRETCHY_ACCENT_REGEX = new RegExp([
	"\\acute",
	"\\grave",
	"\\ddot",
	"\\tilde",
	"\\bar",
	"\\breve",
	"\\check",
	"\\hat",
	"\\vec",
	"\\dot",
	"\\mathring"
].map((accent) => "\\" + accent).join("|"));
defineFunction({
	type: "accent",
	names: [
		"\\acute",
		"\\grave",
		"\\ddot",
		"\\tilde",
		"\\bar",
		"\\breve",
		"\\check",
		"\\hat",
		"\\vec",
		"\\dot",
		"\\mathring",
		"\\widecheck",
		"\\widehat",
		"\\widetilde",
		"\\overrightarrow",
		"\\overleftarrow",
		"\\Overrightarrow",
		"\\overleftrightarrow",
		"\\overgroup",
		"\\overlinesegment",
		"\\overleftharpoon",
		"\\overrightharpoon"
	],
	props: { numArgs: 1 },
	handler: (context, args) => {
		var base = normalizeArgument(args[0]);
		var isStretchy = !NON_STRETCHY_ACCENT_REGEX.test(context.funcName);
		var isShifty = !isStretchy || context.funcName === "\\widehat" || context.funcName === "\\widetilde" || context.funcName === "\\widecheck";
		return {
			type: "accent",
			mode: context.parser.mode,
			label: context.funcName,
			isStretchy,
			isShifty,
			base
		};
	},
	htmlBuilder: htmlBuilder$a,
	mathmlBuilder: mathmlBuilder$9
});
defineFunction({
	type: "accent",
	names: [
		"\\'",
		"\\`",
		"\\^",
		"\\~",
		"\\=",
		"\\u",
		"\\.",
		"\\\"",
		"\\c",
		"\\r",
		"\\H",
		"\\v",
		"\\textcircled"
	],
	props: {
		numArgs: 1,
		allowedInText: true,
		allowedInMath: true,
		argTypes: ["primitive"]
	},
	handler: (context, args) => {
		var base = args[0];
		var mode = context.parser.mode;
		if (mode === "math") {
			context.parser.settings.reportNonstrict("mathVsTextAccents", "LaTeX's accent " + context.funcName + " works only in text mode");
			mode = "text";
		}
		return {
			type: "accent",
			mode,
			label: context.funcName,
			isStretchy: false,
			isShifty: true,
			base
		};
	},
	htmlBuilder: htmlBuilder$a,
	mathmlBuilder: mathmlBuilder$9
});
defineFunction({
	type: "accentUnder",
	names: [
		"\\underleftarrow",
		"\\underrightarrow",
		"\\underleftrightarrow",
		"\\undergroup",
		"\\underlinesegment",
		"\\utilde"
	],
	props: { numArgs: 1 },
	handler: (_ref, args) => {
		var { parser, funcName } = _ref;
		var base = args[0];
		return {
			type: "accentUnder",
			mode: parser.mode,
			label: funcName,
			base
		};
	},
	htmlBuilder: (group, options) => {
		var innerGroup = buildGroup$1(group.base, options);
		var accentBody = stretchySvg(group, options);
		var kern = group.label === "\\utilde" ? .12 : 0;
		return makeSpan(["mord", "accentunder"], [makeVList({
			positionType: "top",
			positionData: innerGroup.height,
			children: [
				{
					type: "elem",
					elem: accentBody,
					wrapperClasses: ["svg-align"]
				},
				{
					type: "kern",
					size: kern
				},
				{
					type: "elem",
					elem: innerGroup
				}
			]
		})], options);
	},
	mathmlBuilder: (group, options) => {
		var accentNode = stretchyMathML(group.label);
		var node = new MathNode("munder", [buildGroup(group.base, options), accentNode]);
		node.setAttribute("accentunder", "true");
		return node;
	}
});
var paddedNode = (group) => {
	var node = new MathNode("mpadded", group ? [group] : []);
	node.setAttribute("width", "+0.6em");
	node.setAttribute("lspace", "0.3em");
	return node;
};
defineFunction({
	type: "xArrow",
	names: [
		"\\xleftarrow",
		"\\xrightarrow",
		"\\xLeftarrow",
		"\\xRightarrow",
		"\\xleftrightarrow",
		"\\xLeftrightarrow",
		"\\xhookleftarrow",
		"\\xhookrightarrow",
		"\\xmapsto",
		"\\xrightharpoondown",
		"\\xrightharpoonup",
		"\\xleftharpoondown",
		"\\xleftharpoonup",
		"\\xrightleftharpoons",
		"\\xleftrightharpoons",
		"\\xlongequal",
		"\\xtwoheadrightarrow",
		"\\xtwoheadleftarrow",
		"\\xtofrom",
		"\\xrightleftarrows",
		"\\xrightequilibrium",
		"\\xleftequilibrium",
		"\\\\cdrightarrow",
		"\\\\cdleftarrow",
		"\\\\cdlongequal"
	],
	props: {
		numArgs: 1,
		numOptionalArgs: 1
	},
	handler(_ref, args, optArgs) {
		var { parser, funcName } = _ref;
		return {
			type: "xArrow",
			mode: parser.mode,
			label: funcName,
			body: args[0],
			below: optArgs[0]
		};
	},
	htmlBuilder(group, options) {
		var style = options.style;
		var newOptions = options.havingStyle(style.sup());
		var upperGroup = wrapFragment(buildGroup$1(group.body, newOptions, options), options);
		var arrowPrefix = group.label.slice(0, 2) === "\\x" ? "x" : "cd";
		upperGroup.classes.push(arrowPrefix + "-arrow-pad");
		var lowerGroup;
		if (group.below) {
			newOptions = options.havingStyle(style.sub());
			lowerGroup = wrapFragment(buildGroup$1(group.below, newOptions, options), options);
			lowerGroup.classes.push(arrowPrefix + "-arrow-pad");
		}
		var arrowBody = stretchySvg(group, options);
		var arrowShift = -options.fontMetrics().axisHeight + .5 * arrowBody.height;
		var upperShift = -options.fontMetrics().axisHeight - .5 * arrowBody.height - .111;
		if (upperGroup.depth > .25 || group.label === "\\xleftequilibrium") upperShift -= upperGroup.depth;
		var vlist;
		if (lowerGroup) {
			var lowerShift = -options.fontMetrics().axisHeight + lowerGroup.height + .5 * arrowBody.height + .111;
			vlist = makeVList({
				positionType: "individualShift",
				children: [
					{
						type: "elem",
						elem: upperGroup,
						shift: upperShift
					},
					{
						type: "elem",
						elem: arrowBody,
						shift: arrowShift
					},
					{
						type: "elem",
						elem: lowerGroup,
						shift: lowerShift
					}
				]
			});
		} else vlist = makeVList({
			positionType: "individualShift",
			children: [{
				type: "elem",
				elem: upperGroup,
				shift: upperShift
			}, {
				type: "elem",
				elem: arrowBody,
				shift: arrowShift
			}]
		});
		vlist.children[0].children[0].children[1].classes.push("svg-align");
		return makeSpan(["mrel", "x-arrow"], [vlist], options);
	},
	mathmlBuilder(group, options) {
		var arrowNode = stretchyMathML(group.label);
		arrowNode.setAttribute("minsize", group.label.charAt(0) === "x" ? "1.75em" : "3.0em");
		var node;
		if (group.body) {
			var upperNode = paddedNode(buildGroup(group.body, options));
			if (group.below) node = new MathNode("munderover", [
				arrowNode,
				paddedNode(buildGroup(group.below, options)),
				upperNode
			]);
			else node = new MathNode("mover", [arrowNode, upperNode]);
		} else if (group.below) node = new MathNode("munder", [arrowNode, paddedNode(buildGroup(group.below, options))]);
		else {
			node = paddedNode();
			node = new MathNode("mover", [arrowNode, node]);
		}
		return node;
	}
});
function htmlBuilder$9(group, options) {
	var elements = buildExpression$1(group.body, options, true);
	return makeSpan([group.mclass], elements, options);
}
function mathmlBuilder$8(group, options) {
	var node;
	var inner = buildExpression(group.body, options);
	if (group.mclass === "minner") node = new MathNode("mpadded", inner);
	else if (group.mclass === "mord") if (group.isCharacterBox) {
		node = inner[0];
		node.type = "mi";
	} else node = new MathNode("mi", inner);
	else {
		if (group.isCharacterBox) {
			node = inner[0];
			node.type = "mo";
		} else node = new MathNode("mo", inner);
		if (group.mclass === "mbin") {
			node.attributes.lspace = "0.22em";
			node.attributes.rspace = "0.22em";
		} else if (group.mclass === "mpunct") {
			node.attributes.lspace = "0em";
			node.attributes.rspace = "0.17em";
		} else if (group.mclass === "mopen" || group.mclass === "mclose") {
			node.attributes.lspace = "0em";
			node.attributes.rspace = "0em";
		} else if (group.mclass === "minner") {
			node.attributes.lspace = "0.0556em";
			node.attributes.width = "+0.1111em";
		}
	}
	return node;
}
defineFunction({
	type: "mclass",
	names: [
		"\\mathord",
		"\\mathbin",
		"\\mathrel",
		"\\mathopen",
		"\\mathclose",
		"\\mathpunct",
		"\\mathinner"
	],
	props: {
		numArgs: 1,
		primitive: true
	},
	handler(_ref, args) {
		var { parser, funcName } = _ref;
		var body = args[0];
		return {
			type: "mclass",
			mode: parser.mode,
			mclass: "m" + funcName.slice(5),
			body: ordargument(body),
			isCharacterBox: isCharacterBox(body)
		};
	},
	htmlBuilder: htmlBuilder$9,
	mathmlBuilder: mathmlBuilder$8
});
var binrelClass = (arg) => {
	var atom = arg.type === "ordgroup" && arg.body.length ? arg.body[0] : arg;
	if (atom.type === "atom" && (atom.family === "bin" || atom.family === "rel")) return "m" + atom.family;
	else return "mord";
};
defineFunction({
	type: "mclass",
	names: ["\\@binrel"],
	props: { numArgs: 2 },
	handler(_ref2, args) {
		var { parser } = _ref2;
		return {
			type: "mclass",
			mode: parser.mode,
			mclass: binrelClass(args[0]),
			body: ordargument(args[1]),
			isCharacterBox: isCharacterBox(args[1])
		};
	}
});
defineFunction({
	type: "mclass",
	names: [
		"\\stackrel",
		"\\overset",
		"\\underset"
	],
	props: { numArgs: 2 },
	handler(_ref3, args) {
		var { parser, funcName } = _ref3;
		var baseArg = args[1];
		var shiftedArg = args[0];
		var mclass;
		if (funcName !== "\\stackrel") mclass = binrelClass(baseArg);
		else mclass = "mrel";
		var baseOp = {
			type: "op",
			mode: baseArg.mode,
			limits: true,
			alwaysHandleSupSub: true,
			parentIsSupSub: false,
			symbol: false,
			suppressBaseShift: funcName !== "\\stackrel",
			body: ordargument(baseArg)
		};
		var supsub = {
			type: "supsub",
			mode: shiftedArg.mode,
			base: baseOp,
			sup: funcName === "\\underset" ? null : shiftedArg,
			sub: funcName === "\\underset" ? shiftedArg : null
		};
		return {
			type: "mclass",
			mode: parser.mode,
			mclass,
			body: [supsub],
			isCharacterBox: isCharacterBox(supsub)
		};
	},
	htmlBuilder: htmlBuilder$9,
	mathmlBuilder: mathmlBuilder$8
});
defineFunction({
	type: "pmb",
	names: ["\\pmb"],
	props: {
		numArgs: 1,
		allowedInText: true
	},
	handler(_ref, args) {
		var { parser } = _ref;
		return {
			type: "pmb",
			mode: parser.mode,
			mclass: binrelClass(args[0]),
			body: ordargument(args[0])
		};
	},
	htmlBuilder(group, options) {
		var elements = buildExpression$1(group.body, options, true);
		var node = makeSpan([group.mclass], elements, options);
		node.style.textShadow = "0.02em 0.01em 0.04px";
		return node;
	},
	mathmlBuilder(group, style) {
		var node = new MathNode("mstyle", buildExpression(group.body, style));
		node.setAttribute("style", "text-shadow: 0.02em 0.01em 0.04px");
		return node;
	}
});
var cdArrowFunctionName = {
	">": "\\\\cdrightarrow",
	"<": "\\\\cdleftarrow",
	"=": "\\\\cdlongequal",
	"A": "\\uparrow",
	"V": "\\downarrow",
	"|": "\\Vert",
	".": "no arrow"
};
var newCell = () => {
	return {
		type: "styling",
		body: [],
		mode: "math",
		style: "display"
	};
};
var isStartOfArrow = (node) => {
	return node.type === "textord" && node.text === "@";
};
var isLabelEnd = (node, endChar) => {
	return (node.type === "mathord" || node.type === "atom") && node.text === endChar;
};
function cdArrow(arrowChar, labels, parser) {
	var funcName = cdArrowFunctionName[arrowChar];
	switch (funcName) {
		case "\\\\cdrightarrow":
		case "\\\\cdleftarrow": return parser.callFunction(funcName, [labels[0]], [labels[1]]);
		case "\\uparrow":
		case "\\downarrow":
			var leftLabel = parser.callFunction("\\\\cdleft", [labels[0]], []);
			var bareArrow = {
				type: "atom",
				text: funcName,
				mode: "math",
				family: "rel"
			};
			var arrowGroup = {
				type: "ordgroup",
				mode: "math",
				body: [
					leftLabel,
					parser.callFunction("\\Big", [bareArrow], []),
					parser.callFunction("\\\\cdright", [labels[1]], [])
				]
			};
			return parser.callFunction("\\\\cdparent", [arrowGroup], []);
		case "\\\\cdlongequal": return parser.callFunction("\\\\cdlongequal", [], []);
		case "\\Vert": return parser.callFunction("\\Big", [{
			type: "textord",
			text: "\\Vert",
			mode: "math"
		}], []);
		default: return {
			type: "textord",
			text: " ",
			mode: "math"
		};
	}
}
function parseCD(parser) {
	var parsedRows = [];
	parser.gullet.beginGroup();
	parser.gullet.macros.set("\\cr", "\\\\\\relax");
	parser.gullet.beginGroup();
	while (true) {
		parsedRows.push(parser.parseExpression(false, "\\\\"));
		parser.gullet.endGroup();
		parser.gullet.beginGroup();
		var next = parser.fetch().text;
		if (next === "&" || next === "\\\\") parser.consume();
		else if (next === "\\end") {
			if (parsedRows[parsedRows.length - 1].length === 0) parsedRows.pop();
			break;
		} else throw new ParseError("Expected \\\\ or \\cr or \\end", parser.nextToken);
	}
	var row = [];
	var body = [row];
	for (var i = 0; i < parsedRows.length; i++) {
		var rowNodes = parsedRows[i];
		var cell = newCell();
		for (var j = 0; j < rowNodes.length; j++) if (!isStartOfArrow(rowNodes[j])) cell.body.push(rowNodes[j]);
		else {
			row.push(cell);
			j += 1;
			var arrowChar = assertSymbolNodeType(rowNodes[j]).text;
			var labels = new Array(2);
			labels[0] = {
				type: "ordgroup",
				mode: "math",
				body: []
			};
			labels[1] = {
				type: "ordgroup",
				mode: "math",
				body: []
			};
			if ("=|.".includes(arrowChar));
			else if ("<>AV".includes(arrowChar)) for (var labelNum = 0; labelNum < 2; labelNum++) {
				var inLabel = true;
				for (var k = j + 1; k < rowNodes.length; k++) {
					if (isLabelEnd(rowNodes[k], arrowChar)) {
						inLabel = false;
						j = k;
						break;
					}
					if (isStartOfArrow(rowNodes[k])) throw new ParseError("Missing a " + arrowChar + " character to complete a CD arrow.", rowNodes[k]);
					labels[labelNum].body.push(rowNodes[k]);
				}
				if (inLabel) throw new ParseError("Missing a " + arrowChar + " character to complete a CD arrow.", rowNodes[j]);
			}
			else throw new ParseError("Expected one of \"<>AV=|.\" after @", rowNodes[j]);
			var wrappedArrow = {
				type: "styling",
				body: [cdArrow(arrowChar, labels, parser)],
				mode: "math",
				style: "display"
			};
			row.push(wrappedArrow);
			cell = newCell();
		}
		if (i % 2 === 0) row.push(cell);
		else row.shift();
		row = [];
		body.push(row);
	}
	parser.gullet.endGroup();
	parser.gullet.endGroup();
	return {
		type: "array",
		mode: "math",
		body,
		arraystretch: 1,
		addJot: true,
		rowGaps: [null],
		cols: new Array(body[0].length).fill({
			type: "align",
			align: "c",
			pregap: .25,
			postgap: .25
		}),
		colSeparationType: "CD",
		hLinesBeforeRow: new Array(body.length + 1).fill([])
	};
}
defineFunction({
	type: "cdlabel",
	names: ["\\\\cdleft", "\\\\cdright"],
	props: { numArgs: 1 },
	handler(_ref, args) {
		var { parser, funcName } = _ref;
		return {
			type: "cdlabel",
			mode: parser.mode,
			side: funcName.slice(4),
			label: args[0]
		};
	},
	htmlBuilder(group, options) {
		var newOptions = options.havingStyle(options.style.sup());
		var label = wrapFragment(buildGroup$1(group.label, newOptions, options), options);
		label.classes.push("cd-label-" + group.side);
		label.style.bottom = makeEm(.8 - label.depth);
		label.height = 0;
		label.depth = 0;
		return label;
	},
	mathmlBuilder(group, options) {
		var label = new MathNode("mrow", [buildGroup(group.label, options)]);
		label = new MathNode("mpadded", [label]);
		label.setAttribute("width", "0");
		if (group.side === "left") label.setAttribute("lspace", "-1width");
		label.setAttribute("voffset", "0.7em");
		label = new MathNode("mstyle", [label]);
		label.setAttribute("displaystyle", "false");
		label.setAttribute("scriptlevel", "1");
		return label;
	}
});
defineFunction({
	type: "cdlabelparent",
	names: ["\\\\cdparent"],
	props: { numArgs: 1 },
	handler(_ref2, args) {
		var { parser } = _ref2;
		return {
			type: "cdlabelparent",
			mode: parser.mode,
			fragment: args[0]
		};
	},
	htmlBuilder(group, options) {
		var parent = wrapFragment(buildGroup$1(group.fragment, options), options);
		parent.classes.push("cd-vert-arrow");
		return parent;
	},
	mathmlBuilder(group, options) {
		return new MathNode("mrow", [buildGroup(group.fragment, options)]);
	}
});
defineFunction({
	type: "textord",
	names: ["\\@char"],
	props: {
		numArgs: 1,
		allowedInText: true
	},
	handler(_ref, args) {
		var { parser } = _ref;
		var group = assertNodeType(args[0], "ordgroup").body;
		var number = "";
		for (var i = 0; i < group.length; i++) {
			var node = assertNodeType(group[i], "textord");
			number += node.text;
		}
		var code = parseInt(number);
		var text;
		if (isNaN(code)) throw new ParseError("\\@char has non-numeric argument " + number);
		else if (code < 0 || code >= 1114111) throw new ParseError("\\@char with invalid code point " + number);
		else if (code <= 65535) text = String.fromCharCode(code);
		else {
			code -= 65536;
			text = String.fromCharCode((code >> 10) + 55296, (code & 1023) + 56320);
		}
		return {
			type: "textord",
			mode: parser.mode,
			text
		};
	}
});
var htmlBuilder$8 = (group, options) => {
	return makeFragment(buildExpression$1(group.body, options.withColor(group.color), false));
};
var mathmlBuilder$7 = (group, options) => {
	var node = new MathNode("mstyle", buildExpression(group.body, options.withColor(group.color)));
	node.setAttribute("mathcolor", group.color);
	return node;
};
defineFunction({
	type: "color",
	names: ["\\textcolor"],
	props: {
		numArgs: 2,
		allowedInText: true,
		argTypes: ["color", "original"]
	},
	handler(_ref, args) {
		var { parser } = _ref;
		var color = assertNodeType(args[0], "color-token").color;
		var body = args[1];
		return {
			type: "color",
			mode: parser.mode,
			color,
			body: ordargument(body)
		};
	},
	htmlBuilder: htmlBuilder$8,
	mathmlBuilder: mathmlBuilder$7
});
defineFunction({
	type: "color",
	names: ["\\color"],
	props: {
		numArgs: 1,
		allowedInText: true,
		argTypes: ["color"]
	},
	handler(_ref2, args) {
		var { parser, breakOnTokenText } = _ref2;
		var color = assertNodeType(args[0], "color-token").color;
		parser.gullet.macros.set("\\current@color", color);
		var body = parser.parseExpression(true, breakOnTokenText);
		return {
			type: "color",
			mode: parser.mode,
			color,
			body
		};
	},
	htmlBuilder: htmlBuilder$8,
	mathmlBuilder: mathmlBuilder$7
});
defineFunction({
	type: "cr",
	names: ["\\\\"],
	props: {
		numArgs: 0,
		numOptionalArgs: 0,
		allowedInText: true
	},
	handler(_ref, args, optArgs) {
		var { parser } = _ref;
		var size = parser.gullet.future().text === "[" ? parser.parseSizeGroup(true) : null;
		var newLine = !parser.settings.displayMode || !parser.settings.useStrictBehavior("newLineInDisplayMode", "In LaTeX, \\\\ or \\newline does nothing in display mode");
		return {
			type: "cr",
			mode: parser.mode,
			newLine,
			size: size && assertNodeType(size, "size").value
		};
	},
	htmlBuilder(group, options) {
		var span = makeSpan(["mspace"], [], options);
		if (group.newLine) {
			span.classes.push("newline");
			if (group.size) span.style.marginTop = makeEm(calculateSize(group.size, options));
		}
		return span;
	},
	mathmlBuilder(group, options) {
		var node = new MathNode("mspace");
		if (group.newLine) {
			node.setAttribute("linebreak", "newline");
			if (group.size) node.setAttribute("height", makeEm(calculateSize(group.size, options)));
		}
		return node;
	}
});
var globalMap = {
	"\\global": "\\global",
	"\\long": "\\\\globallong",
	"\\\\globallong": "\\\\globallong",
	"\\def": "\\gdef",
	"\\gdef": "\\gdef",
	"\\edef": "\\xdef",
	"\\xdef": "\\xdef",
	"\\let": "\\\\globallet",
	"\\futurelet": "\\\\globalfuture"
};
var checkControlSequence = (tok) => {
	var name = tok.text;
	if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) throw new ParseError("Expected a control sequence", tok);
	return name;
};
var getRHS = (parser) => {
	var tok = parser.gullet.popToken();
	if (tok.text === "=") {
		tok = parser.gullet.popToken();
		if (tok.text === " ") tok = parser.gullet.popToken();
	}
	return tok;
};
var letCommand = (parser, name, tok, global) => {
	var macro = parser.gullet.macros.get(tok.text);
	if (macro == null) {
		tok.noexpand = true;
		macro = {
			tokens: [tok],
			numArgs: 0,
			unexpandable: !parser.gullet.isExpandable(tok.text)
		};
	}
	parser.gullet.macros.set(name, macro, global);
};
defineFunction({
	type: "internal",
	names: [
		"\\global",
		"\\long",
		"\\\\globallong"
	],
	props: {
		numArgs: 0,
		allowedInText: true
	},
	handler(_ref) {
		var { parser, funcName } = _ref;
		parser.consumeSpaces();
		var token = parser.fetch();
		if (globalMap[token.text]) {
			if (funcName === "\\global" || funcName === "\\\\globallong") token.text = globalMap[token.text];
			return assertNodeType(parser.parseFunction(), "internal");
		}
		throw new ParseError("Invalid token after macro prefix", token);
	}
});
defineFunction({
	type: "internal",
	names: [
		"\\def",
		"\\gdef",
		"\\edef",
		"\\xdef"
	],
	props: {
		numArgs: 0,
		allowedInText: true,
		primitive: true
	},
	handler(_ref2) {
		var { parser, funcName } = _ref2;
		var tok = parser.gullet.popToken();
		var name = tok.text;
		if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) throw new ParseError("Expected a control sequence", tok);
		var numArgs = 0;
		var insert;
		var delimiters = [[]];
		while (parser.gullet.future().text !== "{") {
			tok = parser.gullet.popToken();
			if (tok.text === "#") {
				if (parser.gullet.future().text === "{") {
					insert = parser.gullet.future();
					delimiters[numArgs].push("{");
					break;
				}
				tok = parser.gullet.popToken();
				if (!/^[1-9]$/.test(tok.text)) throw new ParseError("Invalid argument number \"" + tok.text + "\"");
				if (parseInt(tok.text) !== numArgs + 1) throw new ParseError("Argument number \"" + tok.text + "\" out of order");
				numArgs++;
				delimiters.push([]);
			} else if (tok.text === "EOF") throw new ParseError("Expected a macro definition");
			else delimiters[numArgs].push(tok.text);
		}
		var { tokens } = parser.gullet.consumeArg();
		if (insert) tokens.unshift(insert);
		if (funcName === "\\edef" || funcName === "\\xdef") {
			tokens = parser.gullet.expandTokens(tokens);
			tokens.reverse();
		}
		parser.gullet.macros.set(name, {
			tokens,
			numArgs,
			delimiters
		}, funcName === globalMap[funcName]);
		return {
			type: "internal",
			mode: parser.mode
		};
	}
});
defineFunction({
	type: "internal",
	names: ["\\let", "\\\\globallet"],
	props: {
		numArgs: 0,
		allowedInText: true,
		primitive: true
	},
	handler(_ref3) {
		var { parser, funcName } = _ref3;
		var name = checkControlSequence(parser.gullet.popToken());
		parser.gullet.consumeSpaces();
		letCommand(parser, name, getRHS(parser), funcName === "\\\\globallet");
		return {
			type: "internal",
			mode: parser.mode
		};
	}
});
defineFunction({
	type: "internal",
	names: ["\\futurelet", "\\\\globalfuture"],
	props: {
		numArgs: 0,
		allowedInText: true,
		primitive: true
	},
	handler(_ref4) {
		var { parser, funcName } = _ref4;
		var name = checkControlSequence(parser.gullet.popToken());
		var middle = parser.gullet.popToken();
		var tok = parser.gullet.popToken();
		letCommand(parser, name, tok, funcName === "\\\\globalfuture");
		parser.gullet.pushToken(tok);
		parser.gullet.pushToken(middle);
		return {
			type: "internal",
			mode: parser.mode
		};
	}
});
/**
* This file deals with creating delimiters of various sizes. The TeXbook
* discusses these routines on page 441-442, in the "Another subroutine sets box
* x to a specified variable delimiter" paragraph.
*
* There are three main routines here. `makeSmallDelim` makes a delimiter in the
* normal font, but in either text, script, or scriptscript style.
* `makeLargeDelim` makes a delimiter in textstyle, but in one of the Size1,
* Size2, Size3, or Size4 fonts. `makeStackedDelim` makes a delimiter out of
* smaller pieces that are stacked on top of one another.
*
* The functions take a parameter `center`, which determines if the delimiter
* should be centered around the axis.
*
* Then, there are three exposed functions. `sizedDelim` makes a delimiter in
* one of the given sizes. This is used for things like `\bigl`.
* `customSizedDelim` makes a delimiter with a given total height+depth. It is
* called in places like `\sqrt`. `leftRightDelim` makes an appropriate
* delimiter which surrounds an expression of a given height an depth. It is
* used in `\left` and `\right`.
*/
/**
* Get the metrics for a given symbol and font, after transformation (i.e.
* after following replacement from symbols.js)
*/
var getMetrics = function getMetrics(symbol, font, mode) {
	var metrics = getCharacterMetrics(symbols.math[symbol] && symbols.math[symbol].replace || symbol, font, mode);
	if (!metrics) throw new Error("Unsupported symbol " + symbol + " and font size " + font + ".");
	return metrics;
};
/**
* Puts a delimiter span in a given style, and adds appropriate height, depth,
* and maxFontSizes.
*/
var styleWrap = function styleWrap(delim, toStyle, options, classes) {
	var newOptions = options.havingBaseStyle(toStyle);
	var span = makeSpan(classes.concat(newOptions.sizingClasses(options)), [delim], options);
	var delimSizeMultiplier = newOptions.sizeMultiplier / options.sizeMultiplier;
	span.height *= delimSizeMultiplier;
	span.depth *= delimSizeMultiplier;
	span.maxFontSize = newOptions.sizeMultiplier;
	return span;
};
var centerSpan = function centerSpan(span, options, style) {
	var newOptions = options.havingBaseStyle(style);
	var shift = (1 - options.sizeMultiplier / newOptions.sizeMultiplier) * options.fontMetrics().axisHeight;
	span.classes.push("delimcenter");
	span.style.top = makeEm(shift);
	span.height -= shift;
	span.depth += shift;
};
/**
* Makes a small delimiter. This is a delimiter that comes in the Main-Regular
* font, but is restyled to either be in textstyle, scriptstyle, or
* scriptscriptstyle.
*/
var makeSmallDelim = function makeSmallDelim(delim, style, center, options, mode, classes) {
	var span = styleWrap(makeSymbol(delim, "Main-Regular", mode, options), style, options, classes);
	if (center) centerSpan(span, options, style);
	return span;
};
/**
* Builds a symbol in the given font size (note size is an integer)
*/
var mathrmSize = function mathrmSize(value, size, mode, options) {
	return makeSymbol(value, "Size" + size + "-Regular", mode, options);
};
/**
* Makes a large delimiter. This is a delimiter that comes in the Size1, Size2,
* Size3, or Size4 fonts. It is always rendered in textstyle.
*/
var makeLargeDelim = function makeLargeDelim(delim, size, center, options, mode, classes) {
	var inner = mathrmSize(delim, size, mode, options);
	var span = styleWrap(makeSpan(["delimsizing", "size" + size], [inner], options), Style$1.TEXT, options, classes);
	if (center) centerSpan(span, options, Style$1.TEXT);
	return span;
};
/**
* Make a span from a font glyph with the given offset and in the given font.
* This is used in makeStackedDelim to make the stacking pieces for the delimiter.
*/
var makeGlyphSpan = function makeGlyphSpan(symbol, font, mode) {
	var sizeClass;
	if (font === "Size1-Regular") sizeClass = "delim-size1";
	else sizeClass = "delim-size4";
	return {
		type: "elem",
		elem: makeSpan(["delimsizinginner", sizeClass], [makeSpan([], [makeSymbol(symbol, font, mode)])])
	};
};
var makeInner = function makeInner(ch, height, options) {
	var width = fontMetricsData["Size4-Regular"][ch.charCodeAt(0)] ? fontMetricsData["Size4-Regular"][ch.charCodeAt(0)][4] : fontMetricsData["Size1-Regular"][ch.charCodeAt(0)][4];
	var span = makeSvgSpan([], [new SvgNode([new PathNode("inner", innerPath(ch, Math.round(1e3 * height)))], {
		"width": makeEm(width),
		"height": makeEm(height),
		"style": "width:" + makeEm(width),
		"viewBox": "0 0 " + 1e3 * width + " " + Math.round(1e3 * height),
		"preserveAspectRatio": "xMinYMin"
	})], options);
	span.height = height;
	span.style.height = makeEm(height);
	span.style.width = makeEm(width);
	return {
		type: "elem",
		elem: span
	};
};
var lapInEms = .008;
var lap = {
	type: "kern",
	size: -1 * lapInEms
};
var verts = new Set([
	"|",
	"\\lvert",
	"\\rvert",
	"\\vert"
]);
var doubleVerts = new Set([
	"\\|",
	"\\lVert",
	"\\rVert",
	"\\Vert"
]);
/**
* Make a stacked delimiter out of a given delimiter, with the total height at
* least `heightTotal`. This routine is mentioned on page 442 of the TeXbook.
*/
var makeStackedDelim = function makeStackedDelim(delim, heightTotal, center, options, mode, classes) {
	var top;
	var middle;
	var repeat;
	var bottom;
	var svgLabel = "";
	var viewBoxWidth = 0;
	top = repeat = bottom = delim;
	middle = null;
	var font = "Size1-Regular";
	if (delim === "\\uparrow") repeat = bottom = "⏐";
	else if (delim === "\\Uparrow") repeat = bottom = "‖";
	else if (delim === "\\downarrow") top = repeat = "⏐";
	else if (delim === "\\Downarrow") top = repeat = "‖";
	else if (delim === "\\updownarrow") {
		top = "\\uparrow";
		repeat = "⏐";
		bottom = "\\downarrow";
	} else if (delim === "\\Updownarrow") {
		top = "\\Uparrow";
		repeat = "‖";
		bottom = "\\Downarrow";
	} else if (verts.has(delim)) {
		repeat = "∣";
		svgLabel = "vert";
		viewBoxWidth = 333;
	} else if (doubleVerts.has(delim)) {
		repeat = "∥";
		svgLabel = "doublevert";
		viewBoxWidth = 556;
	} else if (delim === "[" || delim === "\\lbrack") {
		top = "⎡";
		repeat = "⎢";
		bottom = "⎣";
		font = "Size4-Regular";
		svgLabel = "lbrack";
		viewBoxWidth = 667;
	} else if (delim === "]" || delim === "\\rbrack") {
		top = "⎤";
		repeat = "⎥";
		bottom = "⎦";
		font = "Size4-Regular";
		svgLabel = "rbrack";
		viewBoxWidth = 667;
	} else if (delim === "\\lfloor" || delim === "⌊") {
		repeat = top = "⎢";
		bottom = "⎣";
		font = "Size4-Regular";
		svgLabel = "lfloor";
		viewBoxWidth = 667;
	} else if (delim === "\\lceil" || delim === "⌈") {
		top = "⎡";
		repeat = bottom = "⎢";
		font = "Size4-Regular";
		svgLabel = "lceil";
		viewBoxWidth = 667;
	} else if (delim === "\\rfloor" || delim === "⌋") {
		repeat = top = "⎥";
		bottom = "⎦";
		font = "Size4-Regular";
		svgLabel = "rfloor";
		viewBoxWidth = 667;
	} else if (delim === "\\rceil" || delim === "⌉") {
		top = "⎤";
		repeat = bottom = "⎥";
		font = "Size4-Regular";
		svgLabel = "rceil";
		viewBoxWidth = 667;
	} else if (delim === "(" || delim === "\\lparen") {
		top = "⎛";
		repeat = "⎜";
		bottom = "⎝";
		font = "Size4-Regular";
		svgLabel = "lparen";
		viewBoxWidth = 875;
	} else if (delim === ")" || delim === "\\rparen") {
		top = "⎞";
		repeat = "⎟";
		bottom = "⎠";
		font = "Size4-Regular";
		svgLabel = "rparen";
		viewBoxWidth = 875;
	} else if (delim === "\\{" || delim === "\\lbrace") {
		top = "⎧";
		middle = "⎨";
		bottom = "⎩";
		repeat = "⎪";
		font = "Size4-Regular";
	} else if (delim === "\\}" || delim === "\\rbrace") {
		top = "⎫";
		middle = "⎬";
		bottom = "⎭";
		repeat = "⎪";
		font = "Size4-Regular";
	} else if (delim === "\\lgroup" || delim === "⟮") {
		top = "⎧";
		bottom = "⎩";
		repeat = "⎪";
		font = "Size4-Regular";
	} else if (delim === "\\rgroup" || delim === "⟯") {
		top = "⎫";
		bottom = "⎭";
		repeat = "⎪";
		font = "Size4-Regular";
	} else if (delim === "\\lmoustache" || delim === "⎰") {
		top = "⎧";
		bottom = "⎭";
		repeat = "⎪";
		font = "Size4-Regular";
	} else if (delim === "\\rmoustache" || delim === "⎱") {
		top = "⎫";
		bottom = "⎩";
		repeat = "⎪";
		font = "Size4-Regular";
	}
	var topMetrics = getMetrics(top, font, mode);
	var topHeightTotal = topMetrics.height + topMetrics.depth;
	var repeatMetrics = getMetrics(repeat, font, mode);
	var repeatHeightTotal = repeatMetrics.height + repeatMetrics.depth;
	var bottomMetrics = getMetrics(bottom, font, mode);
	var bottomHeightTotal = bottomMetrics.height + bottomMetrics.depth;
	var middleHeightTotal = 0;
	var middleFactor = 1;
	if (middle !== null) {
		var middleMetrics = getMetrics(middle, font, mode);
		middleHeightTotal = middleMetrics.height + middleMetrics.depth;
		middleFactor = 2;
	}
	var minHeight = topHeightTotal + bottomHeightTotal + middleHeightTotal;
	var realHeightTotal = minHeight + Math.max(0, Math.ceil((heightTotal - minHeight) / (middleFactor * repeatHeightTotal))) * middleFactor * repeatHeightTotal;
	var axisHeight = options.fontMetrics().axisHeight;
	if (center) axisHeight *= options.sizeMultiplier;
	var depth = realHeightTotal / 2 - axisHeight;
	var stack = [];
	if (svgLabel.length > 0) {
		var midHeight = realHeightTotal - topHeightTotal - bottomHeightTotal;
		var viewBoxHeight = Math.round(realHeightTotal * 1e3);
		var pathStr = tallDelim(svgLabel, Math.round(midHeight * 1e3));
		var path = new PathNode(svgLabel, pathStr);
		var width = makeEm(viewBoxWidth / 1e3);
		var height = makeEm(viewBoxHeight / 1e3);
		var wrapper = makeSvgSpan([], [new SvgNode([path], {
			"width": width,
			"height": height,
			"viewBox": "0 0 " + viewBoxWidth + " " + viewBoxHeight
		})], options);
		wrapper.height = viewBoxHeight / 1e3;
		wrapper.style.width = width;
		wrapper.style.height = height;
		stack.push({
			type: "elem",
			elem: wrapper
		});
	} else {
		stack.push(makeGlyphSpan(bottom, font, mode));
		stack.push(lap);
		if (middle === null) {
			var innerHeight = realHeightTotal - topHeightTotal - bottomHeightTotal + 2 * lapInEms;
			stack.push(makeInner(repeat, innerHeight, options));
		} else {
			var _innerHeight = (realHeightTotal - topHeightTotal - bottomHeightTotal - middleHeightTotal) / 2 + 2 * lapInEms;
			stack.push(makeInner(repeat, _innerHeight, options));
			stack.push(lap);
			stack.push(makeGlyphSpan(middle, font, mode));
			stack.push(lap);
			stack.push(makeInner(repeat, _innerHeight, options));
		}
		stack.push(lap);
		stack.push(makeGlyphSpan(top, font, mode));
	}
	var newOptions = options.havingBaseStyle(Style$1.TEXT);
	return styleWrap(makeSpan(["delimsizing", "mult"], [makeVList({
		positionType: "bottom",
		positionData: depth,
		children: stack
	})], newOptions), Style$1.TEXT, options, classes);
};
var vbPad = 80;
var emPad = .08;
var sqrtSvg = function sqrtSvg(sqrtName, height, viewBoxHeight, extraVinculum, options) {
	return makeSvgSpan(["hide-tail"], [new SvgNode([new PathNode(sqrtName, sqrtPath(sqrtName, extraVinculum, viewBoxHeight))], {
		"width": "400em",
		"height": makeEm(height),
		"viewBox": "0 0 400000 " + viewBoxHeight,
		"preserveAspectRatio": "xMinYMin slice"
	})], options);
};
/**
* Make a sqrt image of the given height,
*/
var makeSqrtImage = function makeSqrtImage(height, options) {
	var newOptions = options.havingBaseSizing();
	var delim = traverseSequence("\\surd", height * newOptions.sizeMultiplier, stackLargeDelimiterSequence, newOptions);
	var sizeMultiplier = newOptions.sizeMultiplier;
	var extraVinculum = Math.max(0, options.minRuleThickness - options.fontMetrics().sqrtRuleThickness);
	var span;
	var spanHeight = 0;
	var texHeight = 0;
	var viewBoxHeight = 0;
	var advanceWidth;
	if (delim.type === "small") {
		viewBoxHeight = 1e3 + 1e3 * extraVinculum + vbPad;
		if (height < 1) sizeMultiplier = 1;
		else if (height < 1.4) sizeMultiplier = .7;
		spanHeight = (1 + extraVinculum + emPad) / sizeMultiplier;
		texHeight = (1 + extraVinculum) / sizeMultiplier;
		span = sqrtSvg("sqrtMain", spanHeight, viewBoxHeight, extraVinculum, options);
		span.style.minWidth = "0.853em";
		advanceWidth = .833 / sizeMultiplier;
	} else if (delim.type === "large") {
		viewBoxHeight = (1e3 + vbPad) * sizeToMaxHeight[delim.size];
		texHeight = (sizeToMaxHeight[delim.size] + extraVinculum) / sizeMultiplier;
		spanHeight = (sizeToMaxHeight[delim.size] + extraVinculum + emPad) / sizeMultiplier;
		span = sqrtSvg("sqrtSize" + delim.size, spanHeight, viewBoxHeight, extraVinculum, options);
		span.style.minWidth = "1.02em";
		advanceWidth = 1 / sizeMultiplier;
	} else {
		spanHeight = height + extraVinculum + emPad;
		texHeight = height + extraVinculum;
		viewBoxHeight = Math.floor(1e3 * height + extraVinculum) + vbPad;
		span = sqrtSvg("sqrtTall", spanHeight, viewBoxHeight, extraVinculum, options);
		span.style.minWidth = "0.742em";
		advanceWidth = 1.056;
	}
	span.height = texHeight;
	span.style.height = makeEm(spanHeight);
	return {
		span,
		advanceWidth,
		ruleWidth: (options.fontMetrics().sqrtRuleThickness + extraVinculum) * sizeMultiplier
	};
};
var stackLargeDelimiters = new Set([
	"(",
	"\\lparen",
	")",
	"\\rparen",
	"[",
	"\\lbrack",
	"]",
	"\\rbrack",
	"\\{",
	"\\lbrace",
	"\\}",
	"\\rbrace",
	"\\lfloor",
	"\\rfloor",
	"⌊",
	"⌋",
	"\\lceil",
	"\\rceil",
	"⌈",
	"⌉",
	"\\surd"
]);
var stackAlwaysDelimiters = new Set([
	"\\uparrow",
	"\\downarrow",
	"\\updownarrow",
	"\\Uparrow",
	"\\Downarrow",
	"\\Updownarrow",
	"|",
	"\\|",
	"\\vert",
	"\\Vert",
	"\\lvert",
	"\\rvert",
	"\\lVert",
	"\\rVert",
	"\\lgroup",
	"\\rgroup",
	"⟮",
	"⟯",
	"\\lmoustache",
	"\\rmoustache",
	"⎰",
	"⎱"
]);
var stackNeverDelimiters = new Set([
	"<",
	">",
	"\\langle",
	"\\rangle",
	"/",
	"\\backslash",
	"\\lt",
	"\\gt"
]);
var sizeToMaxHeight = [
	0,
	1.2,
	1.8,
	2.4,
	3
];
/**
* Used to create a delimiter of a specific size, where `size` is 1, 2, 3, or 4.
*/
var makeSizedDelim = function makeSizedDelim(delim, size, options, mode, classes) {
	if (delim === "<" || delim === "\\lt" || delim === "⟨") delim = "\\langle";
	else if (delim === ">" || delim === "\\gt" || delim === "⟩") delim = "\\rangle";
	if (stackLargeDelimiters.has(delim) || stackNeverDelimiters.has(delim)) return makeLargeDelim(delim, size, false, options, mode, classes);
	else if (stackAlwaysDelimiters.has(delim)) return makeStackedDelim(delim, sizeToMaxHeight[size], false, options, mode, classes);
	else throw new ParseError("Illegal delimiter: '" + delim + "'");
};
var stackNeverDelimiterSequence = [
	{
		type: "small",
		style: Style$1.SCRIPTSCRIPT
	},
	{
		type: "small",
		style: Style$1.SCRIPT
	},
	{
		type: "small",
		style: Style$1.TEXT
	},
	{
		type: "large",
		size: 1
	},
	{
		type: "large",
		size: 2
	},
	{
		type: "large",
		size: 3
	},
	{
		type: "large",
		size: 4
	}
];
var stackAlwaysDelimiterSequence = [
	{
		type: "small",
		style: Style$1.SCRIPTSCRIPT
	},
	{
		type: "small",
		style: Style$1.SCRIPT
	},
	{
		type: "small",
		style: Style$1.TEXT
	},
	{ type: "stack" }
];
var stackLargeDelimiterSequence = [
	{
		type: "small",
		style: Style$1.SCRIPTSCRIPT
	},
	{
		type: "small",
		style: Style$1.SCRIPT
	},
	{
		type: "small",
		style: Style$1.TEXT
	},
	{
		type: "large",
		size: 1
	},
	{
		type: "large",
		size: 2
	},
	{
		type: "large",
		size: 3
	},
	{
		type: "large",
		size: 4
	},
	{ type: "stack" }
];
/**
* Get the font used in a delimiter based on what kind of delimiter it is.
* TODO(#963) Use more specific font family return type once that is introduced.
*/
var delimTypeToFont = function delimTypeToFont(type) {
	if (type.type === "small") return "Main-Regular";
	else if (type.type === "large") return "Size" + type.size + "-Regular";
	else if (type.type === "stack") return "Size4-Regular";
	else {
		var delimKind = type.type;
		throw new Error("Add support for delim type '" + delimKind + "' here.");
	}
};
/**
* Traverse a sequence of types of delimiters to decide what kind of delimiter
* should be used to create a delimiter of the given height+depth.
*/
var traverseSequence = function traverseSequence(delim, height, sequence, options) {
	for (var i = Math.min(2, 3 - options.style.size); i < sequence.length; i++) {
		var delimType = sequence[i];
		if (delimType.type === "stack") break;
		var metrics = getMetrics(delim, delimTypeToFont(delimType), "math");
		var heightDepth = metrics.height + metrics.depth;
		if (delimType.type === "small") {
			var newOptions = options.havingBaseStyle(delimType.style);
			heightDepth *= newOptions.sizeMultiplier;
		}
		if (heightDepth > height) return delimType;
	}
	return sequence[sequence.length - 1];
};
/**
* Make a delimiter of a given height+depth, with optional centering. Here, we
* traverse the sequences, and create a delimiter that the sequence tells us to.
*/
var makeCustomSizedDelim = function makeCustomSizedDelim(delim, height, center, options, mode, classes) {
	if (delim === "<" || delim === "\\lt" || delim === "⟨") delim = "\\langle";
	else if (delim === ">" || delim === "\\gt" || delim === "⟩") delim = "\\rangle";
	var sequence;
	if (stackNeverDelimiters.has(delim)) sequence = stackNeverDelimiterSequence;
	else if (stackLargeDelimiters.has(delim)) sequence = stackLargeDelimiterSequence;
	else sequence = stackAlwaysDelimiterSequence;
	var delimType = traverseSequence(delim, height, sequence, options);
	if (delimType.type === "small") return makeSmallDelim(delim, delimType.style, center, options, mode, classes);
	else if (delimType.type === "large") return makeLargeDelim(delim, delimType.size, center, options, mode, classes);
	else return makeStackedDelim(delim, height, center, options, mode, classes);
};
/**
* Make a delimiter for use with `\left` and `\right`, given a height and depth
* of an expression that the delimiters surround.
*/
var makeLeftRightDelim = function makeLeftRightDelim(delim, height, depth, options, mode, classes) {
	var axisHeight = options.fontMetrics().axisHeight * options.sizeMultiplier;
	var delimiterFactor = 901;
	var delimiterExtend = 5 / options.fontMetrics().ptPerEm;
	var maxDistFromAxis = Math.max(height - axisHeight, depth + axisHeight);
	return makeCustomSizedDelim(delim, Math.max(maxDistFromAxis / 500 * delimiterFactor, 2 * maxDistFromAxis - delimiterExtend), true, options, mode, classes);
};
var delimiterSizes = {
	"\\bigl": {
		mclass: "mopen",
		size: 1
	},
	"\\Bigl": {
		mclass: "mopen",
		size: 2
	},
	"\\biggl": {
		mclass: "mopen",
		size: 3
	},
	"\\Biggl": {
		mclass: "mopen",
		size: 4
	},
	"\\bigr": {
		mclass: "mclose",
		size: 1
	},
	"\\Bigr": {
		mclass: "mclose",
		size: 2
	},
	"\\biggr": {
		mclass: "mclose",
		size: 3
	},
	"\\Biggr": {
		mclass: "mclose",
		size: 4
	},
	"\\bigm": {
		mclass: "mrel",
		size: 1
	},
	"\\Bigm": {
		mclass: "mrel",
		size: 2
	},
	"\\biggm": {
		mclass: "mrel",
		size: 3
	},
	"\\Biggm": {
		mclass: "mrel",
		size: 4
	},
	"\\big": {
		mclass: "mord",
		size: 1
	},
	"\\Big": {
		mclass: "mord",
		size: 2
	},
	"\\bigg": {
		mclass: "mord",
		size: 3
	},
	"\\Bigg": {
		mclass: "mord",
		size: 4
	}
};
var delimiters = new Set([
	"(",
	"\\lparen",
	")",
	"\\rparen",
	"[",
	"\\lbrack",
	"]",
	"\\rbrack",
	"\\{",
	"\\lbrace",
	"\\}",
	"\\rbrace",
	"\\lfloor",
	"\\rfloor",
	"⌊",
	"⌋",
	"\\lceil",
	"\\rceil",
	"⌈",
	"⌉",
	"<",
	">",
	"\\langle",
	"⟨",
	"\\rangle",
	"⟩",
	"\\lt",
	"\\gt",
	"\\lvert",
	"\\rvert",
	"\\lVert",
	"\\rVert",
	"\\lgroup",
	"\\rgroup",
	"⟮",
	"⟯",
	"\\lmoustache",
	"\\rmoustache",
	"⎰",
	"⎱",
	"/",
	"\\backslash",
	"|",
	"\\vert",
	"\\|",
	"\\Vert",
	"\\uparrow",
	"\\Uparrow",
	"\\downarrow",
	"\\Downarrow",
	"\\updownarrow",
	"\\Updownarrow",
	"."
]);
function checkDelimiter(delim, context) {
	var symDelim = checkSymbolNodeType(delim);
	if (symDelim && delimiters.has(symDelim.text)) return symDelim;
	else if (symDelim) throw new ParseError("Invalid delimiter '" + symDelim.text + "' after '" + context.funcName + "'", delim);
	else throw new ParseError("Invalid delimiter type '" + delim.type + "'", delim);
}
defineFunction({
	type: "delimsizing",
	names: [
		"\\bigl",
		"\\Bigl",
		"\\biggl",
		"\\Biggl",
		"\\bigr",
		"\\Bigr",
		"\\biggr",
		"\\Biggr",
		"\\bigm",
		"\\Bigm",
		"\\biggm",
		"\\Biggm",
		"\\big",
		"\\Big",
		"\\bigg",
		"\\Bigg"
	],
	props: {
		numArgs: 1,
		argTypes: ["primitive"]
	},
	handler: (context, args) => {
		var delim = checkDelimiter(args[0], context);
		return {
			type: "delimsizing",
			mode: context.parser.mode,
			size: delimiterSizes[context.funcName].size,
			mclass: delimiterSizes[context.funcName].mclass,
			delim: delim.text
		};
	},
	htmlBuilder: (group, options) => {
		if (group.delim === ".") return makeSpan([group.mclass]);
		return makeSizedDelim(group.delim, group.size, options, group.mode, [group.mclass]);
	},
	mathmlBuilder: (group) => {
		var children = [];
		if (group.delim !== ".") children.push(makeText(group.delim, group.mode));
		var node = new MathNode("mo", children);
		if (group.mclass === "mopen" || group.mclass === "mclose") node.setAttribute("fence", "true");
		else node.setAttribute("fence", "false");
		node.setAttribute("stretchy", "true");
		var size = makeEm(sizeToMaxHeight[group.size]);
		node.setAttribute("minsize", size);
		node.setAttribute("maxsize", size);
		return node;
	}
});
function assertParsed(group) {
	if (!group.body) throw new Error("Bug: The leftright ParseNode wasn't fully parsed.");
}
defineFunction({
	type: "leftright-right",
	names: ["\\right"],
	props: {
		numArgs: 1,
		primitive: true
	},
	handler: (context, args) => {
		var color = context.parser.gullet.macros.get("\\current@color");
		if (color && typeof color !== "string") throw new ParseError("\\current@color set to non-string in \\right");
		return {
			type: "leftright-right",
			mode: context.parser.mode,
			delim: checkDelimiter(args[0], context).text,
			color
		};
	}
});
defineFunction({
	type: "leftright",
	names: ["\\left"],
	props: {
		numArgs: 1,
		primitive: true
	},
	handler: (context, args) => {
		var delim = checkDelimiter(args[0], context);
		var parser = context.parser;
		++parser.leftrightDepth;
		var body = parser.parseExpression(false);
		--parser.leftrightDepth;
		parser.expect("\\right", false);
		var right = assertNodeType(parser.parseFunction(), "leftright-right");
		return {
			type: "leftright",
			mode: parser.mode,
			body,
			left: delim.text,
			right: right.delim,
			rightColor: right.color
		};
	},
	htmlBuilder: (group, options) => {
		assertParsed(group);
		var inner = buildExpression$1(group.body, options, true, ["mopen", "mclose"]);
		var innerHeight = 0;
		var innerDepth = 0;
		var hadMiddle = false;
		for (var i = 0; i < inner.length; i++) if (inner[i].isMiddle) hadMiddle = true;
		else {
			innerHeight = Math.max(inner[i].height, innerHeight);
			innerDepth = Math.max(inner[i].depth, innerDepth);
		}
		innerHeight *= options.sizeMultiplier;
		innerDepth *= options.sizeMultiplier;
		var leftDelim;
		if (group.left === ".") leftDelim = makeNullDelimiter(options, ["mopen"]);
		else leftDelim = makeLeftRightDelim(group.left, innerHeight, innerDepth, options, group.mode, ["mopen"]);
		inner.unshift(leftDelim);
		if (hadMiddle) for (var _i = 1; _i < inner.length; _i++) {
			var isMiddle = inner[_i].isMiddle;
			if (isMiddle) inner[_i] = makeLeftRightDelim(isMiddle.delim, innerHeight, innerDepth, isMiddle.options, group.mode, []);
		}
		var rightDelim;
		if (group.right === ".") rightDelim = makeNullDelimiter(options, ["mclose"]);
		else {
			var colorOptions = group.rightColor ? options.withColor(group.rightColor) : options;
			rightDelim = makeLeftRightDelim(group.right, innerHeight, innerDepth, colorOptions, group.mode, ["mclose"]);
		}
		inner.push(rightDelim);
		return makeSpan(["minner"], inner, options);
	},
	mathmlBuilder: (group, options) => {
		assertParsed(group);
		var inner = buildExpression(group.body, options);
		if (group.left !== ".") {
			var leftNode = new MathNode("mo", [makeText(group.left, group.mode)]);
			leftNode.setAttribute("fence", "true");
			inner.unshift(leftNode);
		}
		if (group.right !== ".") {
			var rightNode = new MathNode("mo", [makeText(group.right, group.mode)]);
			rightNode.setAttribute("fence", "true");
			if (group.rightColor) rightNode.setAttribute("mathcolor", group.rightColor);
			inner.push(rightNode);
		}
		return makeRow(inner);
	}
});
defineFunction({
	type: "middle",
	names: ["\\middle"],
	props: {
		numArgs: 1,
		primitive: true
	},
	handler: (context, args) => {
		var delim = checkDelimiter(args[0], context);
		if (!context.parser.leftrightDepth) throw new ParseError("\\middle without preceding \\left", delim);
		return {
			type: "middle",
			mode: context.parser.mode,
			delim: delim.text
		};
	},
	htmlBuilder: (group, options) => {
		var middleDelim;
		if (group.delim === ".") middleDelim = makeNullDelimiter(options, []);
		else {
			middleDelim = makeSizedDelim(group.delim, 1, options, group.mode, []);
			var isMiddle = {
				delim: group.delim,
				options
			};
			middleDelim.isMiddle = isMiddle;
		}
		return middleDelim;
	},
	mathmlBuilder: (group, options) => {
		var middleNode = new MathNode("mo", [group.delim === "\\vert" || group.delim === "|" ? makeText("|", "text") : makeText(group.delim, group.mode)]);
		middleNode.setAttribute("fence", "true");
		middleNode.setAttribute("lspace", "0.05em");
		middleNode.setAttribute("rspace", "0.05em");
		return middleNode;
	}
});
var htmlBuilder$7 = (group, options) => {
	var inner = wrapFragment(buildGroup$1(group.body, options), options);
	var label = group.label.slice(1);
	var scale = options.sizeMultiplier;
	var img;
	var imgShift = 0;
	var isSingleChar = isCharacterBox(group.body);
	if (label === "sout") {
		img = makeSpan(["stretchy", "sout"]);
		img.height = options.fontMetrics().defaultRuleThickness / scale;
		imgShift = -.5 * options.fontMetrics().xHeight;
	} else if (label === "phase") {
		var lineWeight = calculateSize({
			number: .6,
			unit: "pt"
		}, options);
		var clearance = calculateSize({
			number: .35,
			unit: "ex"
		}, options);
		var newOptions = options.havingBaseSizing();
		scale = scale / newOptions.sizeMultiplier;
		var angleHeight = inner.height + inner.depth + lineWeight + clearance;
		inner.style.paddingLeft = makeEm(angleHeight / 2 + lineWeight);
		var viewBoxHeight = Math.floor(1e3 * angleHeight * scale);
		img = makeSvgSpan(["hide-tail"], [new SvgNode([new PathNode("phase", phasePath(viewBoxHeight))], {
			"width": "400em",
			"height": makeEm(viewBoxHeight / 1e3),
			"viewBox": "0 0 400000 " + viewBoxHeight,
			"preserveAspectRatio": "xMinYMin slice"
		})], options);
		img.style.height = makeEm(angleHeight);
		imgShift = inner.depth + lineWeight + clearance;
	} else {
		if (/cancel/.test(label)) {
			if (!isSingleChar) inner.classes.push("cancel-pad");
		} else if (label === "angl") inner.classes.push("anglpad");
		else inner.classes.push("boxpad");
		var topPad = 0;
		var bottomPad = 0;
		var ruleThickness = 0;
		if (/box/.test(label)) {
			ruleThickness = Math.max(options.fontMetrics().fboxrule, options.minRuleThickness);
			topPad = options.fontMetrics().fboxsep + (label === "colorbox" ? 0 : ruleThickness);
			bottomPad = topPad;
		} else if (label === "angl") {
			ruleThickness = Math.max(options.fontMetrics().defaultRuleThickness, options.minRuleThickness);
			topPad = 4 * ruleThickness;
			bottomPad = Math.max(0, .25 - inner.depth);
		} else {
			topPad = isSingleChar ? .2 : 0;
			bottomPad = topPad;
		}
		img = stretchyEnclose(inner, label, topPad, bottomPad, options);
		if (/fbox|boxed|fcolorbox/.test(label)) {
			img.style.borderStyle = "solid";
			img.style.borderWidth = makeEm(ruleThickness);
		} else if (label === "angl" && ruleThickness !== .049) {
			img.style.borderTopWidth = makeEm(ruleThickness);
			img.style.borderRightWidth = makeEm(ruleThickness);
		}
		imgShift = inner.depth + bottomPad;
		if (group.backgroundColor) {
			img.style.backgroundColor = group.backgroundColor;
			if (group.borderColor) img.style.borderColor = group.borderColor;
		}
	}
	var vlist;
	if (group.backgroundColor) vlist = makeVList({
		positionType: "individualShift",
		children: [{
			type: "elem",
			elem: img,
			shift: imgShift
		}, {
			type: "elem",
			elem: inner,
			shift: 0
		}]
	});
	else {
		var classes = /cancel|phase/.test(label) ? ["svg-align"] : [];
		vlist = makeVList({
			positionType: "individualShift",
			children: [{
				type: "elem",
				elem: inner,
				shift: 0
			}, {
				type: "elem",
				elem: img,
				shift: imgShift,
				wrapperClasses: classes
			}]
		});
	}
	if (/cancel/.test(label)) {
		vlist.height = inner.height;
		vlist.depth = inner.depth;
	}
	if (/cancel/.test(label) && !isSingleChar) return makeSpan(["mord", "cancel-lap"], [vlist], options);
	else return makeSpan(["mord"], [vlist], options);
};
var mathmlBuilder$6 = (group, options) => {
	var fboxsep = 0;
	var node = new MathNode(group.label.includes("colorbox") ? "mpadded" : "menclose", [buildGroup(group.body, options)]);
	switch (group.label) {
		case "\\cancel":
			node.setAttribute("notation", "updiagonalstrike");
			break;
		case "\\bcancel":
			node.setAttribute("notation", "downdiagonalstrike");
			break;
		case "\\phase":
			node.setAttribute("notation", "phasorangle");
			break;
		case "\\sout":
			node.setAttribute("notation", "horizontalstrike");
			break;
		case "\\fbox":
			node.setAttribute("notation", "box");
			break;
		case "\\angl":
			node.setAttribute("notation", "actuarial");
			break;
		case "\\fcolorbox":
		case "\\colorbox":
			fboxsep = options.fontMetrics().fboxsep * options.fontMetrics().ptPerEm;
			node.setAttribute("width", "+" + 2 * fboxsep + "pt");
			node.setAttribute("height", "+" + 2 * fboxsep + "pt");
			node.setAttribute("lspace", fboxsep + "pt");
			node.setAttribute("voffset", fboxsep + "pt");
			if (group.label === "\\fcolorbox") {
				var thk = Math.max(options.fontMetrics().fboxrule, options.minRuleThickness);
				node.setAttribute("style", "border: " + makeEm(thk) + " solid " + group.borderColor);
			}
			break;
		case "\\xcancel":
			node.setAttribute("notation", "updiagonalstrike downdiagonalstrike");
			break;
	}
	if (group.backgroundColor) node.setAttribute("mathbackground", group.backgroundColor);
	return node;
};
defineFunction({
	type: "enclose",
	names: ["\\colorbox"],
	props: {
		numArgs: 2,
		allowedInText: true,
		argTypes: ["color", "text"]
	},
	handler(_ref, args, optArgs) {
		var { parser, funcName } = _ref;
		var color = assertNodeType(args[0], "color-token").color;
		var body = args[1];
		return {
			type: "enclose",
			mode: parser.mode,
			label: funcName,
			backgroundColor: color,
			body
		};
	},
	htmlBuilder: htmlBuilder$7,
	mathmlBuilder: mathmlBuilder$6
});
defineFunction({
	type: "enclose",
	names: ["\\fcolorbox"],
	props: {
		numArgs: 3,
		allowedInText: true,
		argTypes: [
			"color",
			"color",
			"text"
		]
	},
	handler(_ref2, args, optArgs) {
		var { parser, funcName } = _ref2;
		var borderColor = assertNodeType(args[0], "color-token").color;
		var backgroundColor = assertNodeType(args[1], "color-token").color;
		var body = args[2];
		return {
			type: "enclose",
			mode: parser.mode,
			label: funcName,
			backgroundColor,
			borderColor,
			body
		};
	},
	htmlBuilder: htmlBuilder$7,
	mathmlBuilder: mathmlBuilder$6
});
defineFunction({
	type: "enclose",
	names: ["\\fbox"],
	props: {
		numArgs: 1,
		argTypes: ["hbox"],
		allowedInText: true
	},
	handler(_ref3, args) {
		var { parser } = _ref3;
		return {
			type: "enclose",
			mode: parser.mode,
			label: "\\fbox",
			body: args[0]
		};
	}
});
defineFunction({
	type: "enclose",
	names: [
		"\\cancel",
		"\\bcancel",
		"\\xcancel",
		"\\phase"
	],
	props: { numArgs: 1 },
	handler(_ref4, args) {
		var { parser, funcName } = _ref4;
		var body = args[0];
		return {
			type: "enclose",
			mode: parser.mode,
			label: funcName,
			body
		};
	},
	htmlBuilder: htmlBuilder$7,
	mathmlBuilder: mathmlBuilder$6
});
defineFunction({
	type: "enclose",
	names: ["\\sout"],
	props: {
		numArgs: 1,
		allowedInText: true
	},
	handler(_ref5, args) {
		var { parser, funcName } = _ref5;
		if (parser.mode === "math") parser.settings.reportNonstrict("mathVsSout", "LaTeX's \\sout works only in text mode");
		var body = args[0];
		return {
			type: "enclose",
			mode: parser.mode,
			label: funcName,
			body
		};
	},
	htmlBuilder: htmlBuilder$7,
	mathmlBuilder: mathmlBuilder$6
});
defineFunction({
	type: "enclose",
	names: ["\\angl"],
	props: {
		numArgs: 1,
		argTypes: ["hbox"],
		allowedInText: false
	},
	handler(_ref6, args) {
		var { parser } = _ref6;
		return {
			type: "enclose",
			mode: parser.mode,
			label: "\\angl",
			body: args[0]
		};
	}
});
/**
* All registered environments.
* `environments.js` exports this same dictionary again and makes it public.
* `Parser.js` requires this dictionary via `environments.js`.
*/
var _environments = {};
function defineEnvironment(_ref) {
	var { type, names, props, handler, htmlBuilder, mathmlBuilder } = _ref;
	var data = {
		type,
		numArgs: props.numArgs || 0,
		allowedInText: false,
		numOptionalArgs: 0,
		handler
	};
	for (var i = 0; i < names.length; ++i) _environments[names[i]] = data;
	if (htmlBuilder) _htmlGroupBuilders[type] = htmlBuilder;
	if (mathmlBuilder) _mathmlGroupBuilders[type] = mathmlBuilder;
}
/**
* All registered global/built-in macros.
* `macros.js` exports this same dictionary again and makes it public.
* `Parser.js` requires this dictionary via `macros.js`.
*/
var _macros = {};
function defineMacro(name, body) {
	_macros[name] = body;
}
/**
* Lexing or parsing positional information for error reporting.
* This object is immutable.
*/
var SourceLocation = class SourceLocation {
	constructor(lexer, start, end) {
		this.lexer = lexer;
		this.start = start;
		this.end = end;
	}
	/**
	* Merges two `SourceLocation`s from location providers, given they are
	* provided in order of appearance.
	* - Returns the first one's location if only the first is provided.
	* - Returns a merged range of the first and the last if both are provided
	*   and their lexers match.
	* - Otherwise, returns null.
	*/
	static range(first, second) {
		if (!second) return first && first.loc;
		else if (!first || !first.loc || !second.loc || first.loc.lexer !== second.loc.lexer) return null;
		else return new SourceLocation(first.loc.lexer, first.loc.start, second.loc.end);
	}
};
/**
* The resulting token returned from `lex`.
*
* It consists of the token text plus some position information.
* The position information is essentially a range in an input string,
* but instead of referencing the bare input string, we refer to the lexer.
* That way it is possible to attach extra metadata to the input string,
* like for example a file name or similar.
*
* The position information is optional, so it is OK to construct synthetic
* tokens if appropriate. Not providing available position information may
* lead to degraded error reporting, though.
*/
var Token = class Token {
	constructor(text, loc) {
		this.text = text;
		this.loc = loc;
	}
	/**
	* Given a pair of tokens (this and endToken), compute a `Token` encompassing
	* the whole input range enclosed by these two.
	*/
	range(endToken, text) {
		return new Token(text, SourceLocation.range(this, endToken));
	}
};
function getHLines(parser) {
	var hlineInfo = [];
	parser.consumeSpaces();
	var nxt = parser.fetch().text;
	if (nxt === "\\relax") {
		parser.consume();
		parser.consumeSpaces();
		nxt = parser.fetch().text;
	}
	while (nxt === "\\hline" || nxt === "\\hdashline") {
		parser.consume();
		hlineInfo.push(nxt === "\\hdashline");
		parser.consumeSpaces();
		nxt = parser.fetch().text;
	}
	return hlineInfo;
}
var validateAmsEnvironmentContext = (context) => {
	if (!context.parser.settings.displayMode) throw new ParseError("{" + context.envName + "} can be used only in display mode.");
};
var gatherEnvironments = new Set(["gather", "gather*"]);
function getAutoTag(name) {
	if (!name.includes("ed")) return !name.includes("*");
}
/**
* Parse the body of the environment, with rows delimited by \\ and
* columns delimited by &, and create a nested list in row-major order
* with one group per cell.  If given an optional argument style
* ("text", "display", etc.), then each cell is cast into that style.
*/
function parseArray(parser, _ref, style) {
	var { hskipBeforeAndAfter, addJot, cols, arraystretch, colSeparationType, autoTag, singleRow, emptySingleRow, maxNumCols, leqno } = _ref;
	parser.gullet.beginGroup();
	if (!singleRow) parser.gullet.macros.set("\\cr", "\\\\\\relax");
	if (!arraystretch) {
		var stretch = parser.gullet.expandMacroAsText("\\arraystretch");
		if (stretch == null) arraystretch = 1;
		else {
			arraystretch = parseFloat(stretch);
			if (!arraystretch || arraystretch < 0) throw new ParseError("Invalid \\arraystretch: " + stretch);
		}
	}
	parser.gullet.beginGroup();
	var row = [];
	var body = [row];
	var rowGaps = [];
	var hLinesBeforeRow = [];
	var tags = autoTag != null ? [] : void 0;
	function beginRow() {
		if (autoTag) parser.gullet.macros.set("\\@eqnsw", "1", true);
	}
	function endRow() {
		if (tags) if (parser.gullet.macros.get("\\df@tag")) {
			tags.push(parser.subparse([new Token("\\df@tag")]));
			parser.gullet.macros.set("\\df@tag", void 0, true);
		} else tags.push(Boolean(autoTag) && parser.gullet.macros.get("\\@eqnsw") === "1");
	}
	beginRow();
	hLinesBeforeRow.push(getHLines(parser));
	while (true) {
		var cellBody = parser.parseExpression(false, singleRow ? "\\end" : "\\\\");
		parser.gullet.endGroup();
		parser.gullet.beginGroup();
		var cell = {
			type: "ordgroup",
			mode: parser.mode,
			body: cellBody
		};
		if (style) cell = {
			type: "styling",
			mode: parser.mode,
			style,
			body: [cell]
		};
		row.push(cell);
		var next = parser.fetch().text;
		if (next === "&") {
			if (maxNumCols && row.length === maxNumCols) if (singleRow || colSeparationType) throw new ParseError("Too many tab characters: &", parser.nextToken);
			else parser.settings.reportNonstrict("textEnv", "Too few columns specified in the {array} column argument.");
			parser.consume();
		} else if (next === "\\end") {
			endRow();
			if (row.length === 1 && cell.type === "styling" && cell.body.length === 1 && cell.body[0].type === "ordgroup" && cell.body[0].body.length === 0 && (body.length > 1 || !emptySingleRow)) body.pop();
			if (hLinesBeforeRow.length < body.length + 1) hLinesBeforeRow.push([]);
			break;
		} else if (next === "\\\\") {
			parser.consume();
			var size = void 0;
			if (parser.gullet.future().text !== " ") size = parser.parseSizeGroup(true);
			rowGaps.push(size ? size.value : null);
			endRow();
			hLinesBeforeRow.push(getHLines(parser));
			row = [];
			body.push(row);
			beginRow();
		} else throw new ParseError("Expected & or \\\\ or \\cr or \\end", parser.nextToken);
	}
	parser.gullet.endGroup();
	parser.gullet.endGroup();
	return {
		type: "array",
		mode: parser.mode,
		addJot,
		arraystretch,
		body,
		cols,
		rowGaps,
		hskipBeforeAndAfter,
		hLinesBeforeRow,
		colSeparationType,
		tags,
		leqno
	};
}
function dCellStyle(envName) {
	if (envName.slice(0, 1) === "d") return "display";
	else return "text";
}
var htmlBuilder$6 = function htmlBuilder(group, options) {
	var r;
	var c;
	var nr = group.body.length;
	var hLinesBeforeRow = group.hLinesBeforeRow;
	var nc = 0;
	var body = new Array(nr);
	var hlines = [];
	var ruleThickness = Math.max(options.fontMetrics().arrayRuleWidth, options.minRuleThickness);
	var pt = 1 / options.fontMetrics().ptPerEm;
	var arraycolsep = 5 * pt;
	if (group.colSeparationType && group.colSeparationType === "small") arraycolsep = .2778 * (options.havingStyle(Style$1.SCRIPT).sizeMultiplier / options.sizeMultiplier);
	var baselineskip = group.colSeparationType === "CD" ? calculateSize({
		number: 3,
		unit: "ex"
	}, options) : 12 * pt;
	var jot = 3 * pt;
	var arrayskip = group.arraystretch * baselineskip;
	var arstrutHeight = .7 * arrayskip;
	var arstrutDepth = .3 * arrayskip;
	var totalHeight = 0;
	function setHLinePos(hlinesInGap) {
		for (var i = 0; i < hlinesInGap.length; ++i) {
			if (i > 0) totalHeight += .25;
			hlines.push({
				pos: totalHeight,
				isDashed: hlinesInGap[i]
			});
		}
	}
	setHLinePos(hLinesBeforeRow[0]);
	for (r = 0; r < group.body.length; ++r) {
		var inrow = group.body[r];
		var height = arstrutHeight;
		var depth = arstrutDepth;
		if (nc < inrow.length) nc = inrow.length;
		var outrow = new Array(inrow.length);
		for (c = 0; c < inrow.length; ++c) {
			var elt = buildGroup$1(inrow[c], options);
			if (depth < elt.depth) depth = elt.depth;
			if (height < elt.height) height = elt.height;
			outrow[c] = elt;
		}
		var rowGap = group.rowGaps[r];
		var gap = 0;
		if (rowGap) {
			gap = calculateSize(rowGap, options);
			if (gap > 0) {
				gap += arstrutDepth;
				if (depth < gap) depth = gap;
				gap = 0;
			}
		}
		if (group.addJot) depth += jot;
		outrow.height = height;
		outrow.depth = depth;
		totalHeight += height;
		outrow.pos = totalHeight;
		totalHeight += depth + gap;
		body[r] = outrow;
		setHLinePos(hLinesBeforeRow[r + 1]);
	}
	var offset = totalHeight / 2 + options.fontMetrics().axisHeight;
	var colDescriptions = group.cols || [];
	var cols = [];
	var colSep;
	var colDescrNum;
	var tagSpans = [];
	if (group.tags && group.tags.some((tag) => tag)) for (r = 0; r < nr; ++r) {
		var rw = body[r];
		var shift = rw.pos - offset;
		var tag = group.tags[r];
		var tagSpan = void 0;
		if (tag === true) tagSpan = makeSpan(["eqn-num"], [], options);
		else if (tag === false) tagSpan = makeSpan([], [], options);
		else tagSpan = makeSpan([], buildExpression$1(tag, options, true), options);
		tagSpan.depth = rw.depth;
		tagSpan.height = rw.height;
		tagSpans.push({
			type: "elem",
			elem: tagSpan,
			shift
		});
	}
	for (c = 0, colDescrNum = 0; c < nc || colDescrNum < colDescriptions.length; ++c, ++colDescrNum) {
		var _colDescr3;
		var colDescr = colDescriptions[colDescrNum];
		var firstSeparator = true;
		while (((_colDescr = colDescr) == null ? void 0 : _colDescr.type) === "separator") {
			var _colDescr;
			if (!firstSeparator) {
				colSep = makeSpan(["arraycolsep"], []);
				colSep.style.width = makeEm(options.fontMetrics().doubleRuleSep);
				cols.push(colSep);
			}
			if (colDescr.separator === "|" || colDescr.separator === ":") {
				var lineType = colDescr.separator === "|" ? "solid" : "dashed";
				var separator = makeSpan(["vertical-separator"], [], options);
				separator.style.height = makeEm(totalHeight);
				separator.style.borderRightWidth = makeEm(ruleThickness);
				separator.style.borderRightStyle = lineType;
				separator.style.margin = "0 " + makeEm(-ruleThickness / 2);
				var _shift = totalHeight - offset;
				if (_shift) separator.style.verticalAlign = makeEm(-_shift);
				cols.push(separator);
			} else throw new ParseError("Invalid separator type: " + colDescr.separator);
			colDescrNum++;
			colDescr = colDescriptions[colDescrNum];
			firstSeparator = false;
		}
		if (c >= nc) continue;
		var sepwidth = void 0;
		if (c > 0 || group.hskipBeforeAndAfter) {
			var _colDescr$pregap, _colDescr2;
			sepwidth = (_colDescr$pregap = (_colDescr2 = colDescr) == null ? void 0 : _colDescr2.pregap) != null ? _colDescr$pregap : arraycolsep;
			if (sepwidth !== 0) {
				colSep = makeSpan(["arraycolsep"], []);
				colSep.style.width = makeEm(sepwidth);
				cols.push(colSep);
			}
		}
		var colElems = [];
		for (r = 0; r < nr; ++r) {
			var row = body[r];
			var elem = row[c];
			if (!elem) continue;
			var _shift2 = row.pos - offset;
			elem.depth = row.depth;
			elem.height = row.height;
			colElems.push({
				type: "elem",
				elem,
				shift: _shift2
			});
		}
		var colVList = makeVList({
			positionType: "individualShift",
			children: colElems
		});
		var colSpan = makeSpan(["col-align-" + (((_colDescr3 = colDescr) == null ? void 0 : _colDescr3.align) || "c")], [colVList]);
		cols.push(colSpan);
		if (c < nc - 1 || group.hskipBeforeAndAfter) {
			var _colDescr$postgap, _colDescr4;
			sepwidth = (_colDescr$postgap = (_colDescr4 = colDescr) == null ? void 0 : _colDescr4.postgap) != null ? _colDescr$postgap : arraycolsep;
			if (sepwidth !== 0) {
				colSep = makeSpan(["arraycolsep"], []);
				colSep.style.width = makeEm(sepwidth);
				cols.push(colSep);
			}
		}
	}
	var tableBody = makeSpan(["mtable"], cols);
	if (hlines.length > 0) {
		var line = makeLineSpan("hline", options, ruleThickness);
		var dashes = makeLineSpan("hdashline", options, ruleThickness);
		var vListElems = [{
			type: "elem",
			elem: tableBody,
			shift: 0
		}];
		while (hlines.length > 0) {
			var hline = hlines.pop();
			var lineShift = hline.pos - offset;
			if (hline.isDashed) vListElems.push({
				type: "elem",
				elem: dashes,
				shift: lineShift
			});
			else vListElems.push({
				type: "elem",
				elem: line,
				shift: lineShift
			});
		}
		tableBody = makeVList({
			positionType: "individualShift",
			children: vListElems
		});
	}
	if (tagSpans.length === 0) return makeSpan(["mord"], [tableBody], options);
	else {
		var tagCol = makeSpan(["tag"], [makeVList({
			positionType: "individualShift",
			children: tagSpans
		})], options);
		return makeFragment([tableBody, tagCol]);
	}
};
var alignMap = {
	c: "center ",
	l: "left ",
	r: "right "
};
var mathmlBuilder$5 = function mathmlBuilder(group, options) {
	var tbl = [];
	var glue = new MathNode("mtd", [], ["mtr-glue"]);
	var tag = new MathNode("mtd", [], ["mml-eqn-num"]);
	for (var i = 0; i < group.body.length; i++) {
		var rw = group.body[i];
		var row = [];
		for (var j = 0; j < rw.length; j++) row.push(new MathNode("mtd", [buildGroup(rw[j], options)]));
		if (group.tags && group.tags[i]) {
			row.unshift(glue);
			row.push(glue);
			if (group.leqno) row.unshift(tag);
			else row.push(tag);
		}
		tbl.push(new MathNode("mtr", row));
	}
	var table = new MathNode("mtable", tbl);
	var gap = group.arraystretch === .5 ? .1 : .16 + group.arraystretch - 1 + (group.addJot ? .09 : 0);
	table.setAttribute("rowspacing", makeEm(gap));
	var menclose = "";
	var align = "";
	if (group.cols && group.cols.length > 0) {
		var cols = group.cols;
		var columnLines = "";
		var prevTypeWasAlign = false;
		var iStart = 0;
		var iEnd = cols.length;
		if (cols[0].type === "separator") {
			menclose += "top ";
			iStart = 1;
		}
		if (cols[cols.length - 1].type === "separator") {
			menclose += "bottom ";
			iEnd -= 1;
		}
		for (var _i = iStart; _i < iEnd; _i++) {
			var col = cols[_i];
			if (col.type === "align") {
				align += alignMap[col.align];
				if (prevTypeWasAlign) columnLines += "none ";
				prevTypeWasAlign = true;
			} else if (col.type === "separator") {
				if (prevTypeWasAlign) {
					columnLines += col.separator === "|" ? "solid " : "dashed ";
					prevTypeWasAlign = false;
				}
			}
		}
		table.setAttribute("columnalign", align.trim());
		if (/[sd]/.test(columnLines)) table.setAttribute("columnlines", columnLines.trim());
	}
	if (group.colSeparationType === "align") {
		var _cols = group.cols || [];
		var spacing = "";
		for (var _i2 = 1; _i2 < _cols.length; _i2++) spacing += _i2 % 2 ? "0em " : "1em ";
		table.setAttribute("columnspacing", spacing.trim());
	} else if (group.colSeparationType === "alignat" || group.colSeparationType === "gather") table.setAttribute("columnspacing", "0em");
	else if (group.colSeparationType === "small") table.setAttribute("columnspacing", "0.2778em");
	else if (group.colSeparationType === "CD") table.setAttribute("columnspacing", "0.5em");
	else table.setAttribute("columnspacing", "1em");
	var rowLines = "";
	var hlines = group.hLinesBeforeRow;
	menclose += hlines[0].length > 0 ? "left " : "";
	menclose += hlines[hlines.length - 1].length > 0 ? "right " : "";
	for (var _i3 = 1; _i3 < hlines.length - 1; _i3++) rowLines += hlines[_i3].length === 0 ? "none " : hlines[_i3][0] ? "dashed " : "solid ";
	if (/[sd]/.test(rowLines)) table.setAttribute("rowlines", rowLines.trim());
	if (menclose !== "") {
		table = new MathNode("menclose", [table]);
		table.setAttribute("notation", menclose.trim());
	}
	if (group.arraystretch && group.arraystretch < 1) {
		table = new MathNode("mstyle", [table]);
		table.setAttribute("scriptlevel", "1");
	}
	return table;
};
var alignedHandler = function alignedHandler(context, args) {
	if (!context.envName.includes("ed")) validateAmsEnvironmentContext(context);
	var cols = [];
	var separationType = context.envName.includes("at") ? "alignat" : "align";
	var isSplit = context.envName === "split";
	var res = parseArray(context.parser, {
		cols,
		addJot: true,
		autoTag: isSplit ? void 0 : getAutoTag(context.envName),
		emptySingleRow: true,
		colSeparationType: separationType,
		maxNumCols: isSplit ? 2 : void 0,
		leqno: context.parser.settings.leqno
	}, "display");
	var numMaths = 0;
	var numCols = 0;
	var emptyGroup = {
		type: "ordgroup",
		mode: context.mode,
		body: []
	};
	if (args[0] && args[0].type === "ordgroup") {
		var arg0 = "";
		for (var i = 0; i < args[0].body.length; i++) {
			var textord = assertNodeType(args[0].body[i], "textord");
			arg0 += textord.text;
		}
		numMaths = Number(arg0);
		numCols = numMaths * 2;
	}
	var isAligned = !numCols;
	res.body.forEach(function(row) {
		for (var _i4 = 1; _i4 < row.length; _i4 += 2) assertNodeType(assertNodeType(row[_i4], "styling").body[0], "ordgroup").body.unshift(emptyGroup);
		if (!isAligned) {
			var curMaths = row.length / 2;
			if (numMaths < curMaths) throw new ParseError("Too many math in a row: " + ("expected " + numMaths + ", but got " + curMaths), row[0]);
		} else if (numCols < row.length) numCols = row.length;
	});
	for (var _i5 = 0; _i5 < numCols; ++_i5) {
		var align = "r";
		var pregap = 0;
		if (_i5 % 2 === 1) align = "l";
		else if (_i5 > 0 && isAligned) pregap = 1;
		cols[_i5] = {
			type: "align",
			align,
			pregap,
			postgap: 0
		};
	}
	res.colSeparationType = isAligned ? "align" : "alignat";
	return res;
};
defineEnvironment({
	type: "array",
	names: ["array", "darray"],
	props: { numArgs: 1 },
	handler(context, args) {
		var cols = (checkSymbolNodeType(args[0]) ? [args[0]] : assertNodeType(args[0], "ordgroup").body).map(function(nde) {
			var ca = assertSymbolNodeType(nde).text;
			if ("lcr".includes(ca)) return {
				type: "align",
				align: ca
			};
			else if (ca === "|") return {
				type: "separator",
				separator: "|"
			};
			else if (ca === ":") return {
				type: "separator",
				separator: ":"
			};
			throw new ParseError("Unknown column alignment: " + ca, nde);
		});
		var res = {
			cols,
			hskipBeforeAndAfter: true,
			maxNumCols: cols.length
		};
		return parseArray(context.parser, res, dCellStyle(context.envName));
	},
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
	type: "array",
	names: [
		"matrix",
		"pmatrix",
		"bmatrix",
		"Bmatrix",
		"vmatrix",
		"Vmatrix",
		"matrix*",
		"pmatrix*",
		"bmatrix*",
		"Bmatrix*",
		"vmatrix*",
		"Vmatrix*"
	],
	props: { numArgs: 0 },
	handler(context) {
		var delimiters = {
			"matrix": null,
			"pmatrix": ["(", ")"],
			"bmatrix": ["[", "]"],
			"Bmatrix": ["\\{", "\\}"],
			"vmatrix": ["|", "|"],
			"Vmatrix": ["\\Vert", "\\Vert"]
		}[context.envName.replace("*", "")];
		var colAlign = "c";
		var payload = {
			hskipBeforeAndAfter: false,
			cols: [{
				type: "align",
				align: colAlign
			}]
		};
		if (context.envName.charAt(context.envName.length - 1) === "*") {
			var parser = context.parser;
			parser.consumeSpaces();
			if (parser.fetch().text === "[") {
				parser.consume();
				parser.consumeSpaces();
				colAlign = parser.fetch().text;
				if (!"lcr".includes(colAlign)) throw new ParseError("Expected l or c or r", parser.nextToken);
				parser.consume();
				parser.consumeSpaces();
				parser.expect("]");
				parser.consume();
				payload.cols = [{
					type: "align",
					align: colAlign
				}];
			}
		}
		var res = parseArray(context.parser, payload, dCellStyle(context.envName));
		var numCols = Math.max(0, ...res.body.map((row) => row.length));
		res.cols = new Array(numCols).fill({
			type: "align",
			align: colAlign
		});
		return delimiters ? {
			type: "leftright",
			mode: context.mode,
			body: [res],
			left: delimiters[0],
			right: delimiters[1],
			rightColor: void 0
		} : res;
	},
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
	type: "array",
	names: ["smallmatrix"],
	props: { numArgs: 0 },
	handler(context) {
		var res = parseArray(context.parser, { arraystretch: .5 }, "script");
		res.colSeparationType = "small";
		return res;
	},
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
	type: "array",
	names: ["subarray"],
	props: { numArgs: 1 },
	handler(context, args) {
		var cols = (checkSymbolNodeType(args[0]) ? [args[0]] : assertNodeType(args[0], "ordgroup").body).map(function(nde) {
			var ca = assertSymbolNodeType(nde).text;
			if ("lc".includes(ca)) return {
				type: "align",
				align: ca
			};
			throw new ParseError("Unknown column alignment: " + ca, nde);
		});
		if (cols.length > 1) throw new ParseError("{subarray} can contain only one column");
		var payload = {
			cols,
			hskipBeforeAndAfter: false,
			arraystretch: .5
		};
		var res = parseArray(context.parser, payload, "script");
		if (res.body.length > 0 && res.body[0].length > 1) throw new ParseError("{subarray} can contain only one column");
		return res;
	},
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
	type: "array",
	names: [
		"cases",
		"dcases",
		"rcases",
		"drcases"
	],
	props: { numArgs: 0 },
	handler(context) {
		var res = parseArray(context.parser, {
			arraystretch: 1.2,
			cols: [{
				type: "align",
				align: "l",
				pregap: 0,
				postgap: 1
			}, {
				type: "align",
				align: "l",
				pregap: 0,
				postgap: 0
			}]
		}, dCellStyle(context.envName));
		return {
			type: "leftright",
			mode: context.mode,
			body: [res],
			left: context.envName.includes("r") ? "." : "\\{",
			right: context.envName.includes("r") ? "\\}" : ".",
			rightColor: void 0
		};
	},
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
	type: "array",
	names: [
		"align",
		"align*",
		"aligned",
		"split"
	],
	props: { numArgs: 0 },
	handler: alignedHandler,
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
	type: "array",
	names: [
		"gathered",
		"gather",
		"gather*"
	],
	props: { numArgs: 0 },
	handler(context) {
		if (gatherEnvironments.has(context.envName)) validateAmsEnvironmentContext(context);
		var res = {
			cols: [{
				type: "align",
				align: "c"
			}],
			addJot: true,
			colSeparationType: "gather",
			autoTag: getAutoTag(context.envName),
			emptySingleRow: true,
			leqno: context.parser.settings.leqno
		};
		return parseArray(context.parser, res, "display");
	},
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
	type: "array",
	names: [
		"alignat",
		"alignat*",
		"alignedat"
	],
	props: { numArgs: 1 },
	handler: alignedHandler,
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
	type: "array",
	names: ["equation", "equation*"],
	props: { numArgs: 0 },
	handler(context) {
		validateAmsEnvironmentContext(context);
		var res = {
			autoTag: getAutoTag(context.envName),
			emptySingleRow: true,
			singleRow: true,
			maxNumCols: 1,
			leqno: context.parser.settings.leqno
		};
		return parseArray(context.parser, res, "display");
	},
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
	type: "array",
	names: ["CD"],
	props: { numArgs: 0 },
	handler(context) {
		validateAmsEnvironmentContext(context);
		return parseCD(context.parser);
	},
	htmlBuilder: htmlBuilder$6,
	mathmlBuilder: mathmlBuilder$5
});
defineMacro("\\nonumber", "\\gdef\\@eqnsw{0}");
defineMacro("\\notag", "\\nonumber");
defineFunction({
	type: "text",
	names: ["\\hline", "\\hdashline"],
	props: {
		numArgs: 0,
		allowedInText: true,
		allowedInMath: true
	},
	handler(context, args) {
		throw new ParseError(context.funcName + " valid only within array environment");
	}
});
var environments = _environments;
defineFunction({
	type: "environment",
	names: ["\\begin", "\\end"],
	props: {
		numArgs: 1,
		argTypes: ["text"]
	},
	handler(_ref, args) {
		var { parser, funcName } = _ref;
		var nameGroup = args[0];
		if (nameGroup.type !== "ordgroup") throw new ParseError("Invalid environment name", nameGroup);
		var envName = "";
		for (var i = 0; i < nameGroup.body.length; ++i) envName += assertNodeType(nameGroup.body[i], "textord").text;
		if (funcName === "\\begin") {
			if (!environments.hasOwnProperty(envName)) throw new ParseError("No such environment: " + envName, nameGroup);
			var env = environments[envName];
			var { args: _args, optArgs } = parser.parseArguments("\\begin{" + envName + "}", env);
			var context = {
				mode: parser.mode,
				envName,
				parser
			};
			var result = env.handler(context, _args, optArgs);
			parser.expect("\\end", false);
			var endNameToken = parser.nextToken;
			var end = assertNodeType(parser.parseFunction(), "environment");
			if (end.name !== envName) throw new ParseError("Mismatch: \\begin{" + envName + "} matched by \\end{" + end.name + "}", endNameToken);
			return result;
		}
		return {
			type: "environment",
			mode: parser.mode,
			name: envName,
			nameGroup
		};
	}
});
var htmlBuilder$5 = (group, options) => {
	var font = group.font;
	var newOptions = options.withFont(font);
	return buildGroup$1(group.body, newOptions);
};
var mathmlBuilder$4 = (group, options) => {
	var font = group.font;
	var newOptions = options.withFont(font);
	return buildGroup(group.body, newOptions);
};
var fontAliases = {
	"\\Bbb": "\\mathbb",
	"\\bold": "\\mathbf",
	"\\frak": "\\mathfrak",
	"\\bm": "\\boldsymbol"
};
defineFunction({
	type: "font",
	names: [
		"\\mathrm",
		"\\mathit",
		"\\mathbf",
		"\\mathnormal",
		"\\mathsfit",
		"\\mathbb",
		"\\mathcal",
		"\\mathfrak",
		"\\mathscr",
		"\\mathsf",
		"\\mathtt",
		"\\Bbb",
		"\\bold",
		"\\frak"
	],
	props: {
		numArgs: 1,
		allowedInArgument: true
	},
	handler: (_ref, args) => {
		var { parser, funcName } = _ref;
		var body = normalizeArgument(args[0]);
		var func = funcName;
		if (func in fontAliases) func = fontAliases[func];
		return {
			type: "font",
			mode: parser.mode,
			font: func.slice(1),
			body
		};
	},
	htmlBuilder: htmlBuilder$5,
	mathmlBuilder: mathmlBuilder$4
});
defineFunction({
	type: "mclass",
	names: ["\\boldsymbol", "\\bm"],
	props: { numArgs: 1 },
	handler: (_ref2, args) => {
		var { parser } = _ref2;
		var body = args[0];
		return {
			type: "mclass",
			mode: parser.mode,
			mclass: binrelClass(body),
			body: [{
				type: "font",
				mode: parser.mode,
				font: "boldsymbol",
				body
			}],
			isCharacterBox: isCharacterBox(body)
		};
	}
});
defineFunction({
	type: "font",
	names: [
		"\\rm",
		"\\sf",
		"\\tt",
		"\\bf",
		"\\it",
		"\\cal"
	],
	props: {
		numArgs: 0,
		allowedInText: true
	},
	handler: (_ref3, args) => {
		var { parser, funcName, breakOnTokenText } = _ref3;
		var { mode } = parser;
		var body = parser.parseExpression(true, breakOnTokenText);
		return {
			type: "font",
			mode,
			font: "math" + funcName.slice(1),
			body: {
				type: "ordgroup",
				mode: parser.mode,
				body
			}
		};
	},
	htmlBuilder: htmlBuilder$5,
	mathmlBuilder: mathmlBuilder$4
});
var htmlBuilder$4 = (group, options) => {
	var style = options.style;
	var nstyle = style.fracNum();
	var dstyle = style.fracDen();
	var newOptions = options.havingStyle(nstyle);
	var numerm = buildGroup$1(group.numer, newOptions, options);
	if (group.continued) {
		var hStrut = 8.5 / options.fontMetrics().ptPerEm;
		var dStrut = 3.5 / options.fontMetrics().ptPerEm;
		numerm.height = numerm.height < hStrut ? hStrut : numerm.height;
		numerm.depth = numerm.depth < dStrut ? dStrut : numerm.depth;
	}
	newOptions = options.havingStyle(dstyle);
	var denomm = buildGroup$1(group.denom, newOptions, options);
	var rule;
	var ruleWidth;
	var ruleSpacing;
	if (group.hasBarLine) {
		if (group.barSize) {
			ruleWidth = calculateSize(group.barSize, options);
			rule = makeLineSpan("frac-line", options, ruleWidth);
		} else rule = makeLineSpan("frac-line", options);
		ruleWidth = rule.height;
		ruleSpacing = rule.height;
	} else {
		rule = null;
		ruleWidth = 0;
		ruleSpacing = options.fontMetrics().defaultRuleThickness;
	}
	var numShift;
	var clearance;
	var denomShift;
	if (style.size === Style$1.DISPLAY.size) {
		numShift = options.fontMetrics().num1;
		if (ruleWidth > 0) clearance = 3 * ruleSpacing;
		else clearance = 7 * ruleSpacing;
		denomShift = options.fontMetrics().denom1;
	} else {
		if (ruleWidth > 0) {
			numShift = options.fontMetrics().num2;
			clearance = ruleSpacing;
		} else {
			numShift = options.fontMetrics().num3;
			clearance = 3 * ruleSpacing;
		}
		denomShift = options.fontMetrics().denom2;
	}
	var frac;
	if (!rule) {
		var candidateClearance = numShift - numerm.depth - (denomm.height - denomShift);
		if (candidateClearance < clearance) {
			numShift += .5 * (clearance - candidateClearance);
			denomShift += .5 * (clearance - candidateClearance);
		}
		frac = makeVList({
			positionType: "individualShift",
			children: [{
				type: "elem",
				elem: denomm,
				shift: denomShift
			}, {
				type: "elem",
				elem: numerm,
				shift: -numShift
			}]
		});
	} else {
		var axisHeight = options.fontMetrics().axisHeight;
		if (numShift - numerm.depth - (axisHeight + .5 * ruleWidth) < clearance) numShift += clearance - (numShift - numerm.depth - (axisHeight + .5 * ruleWidth));
		if (axisHeight - .5 * ruleWidth - (denomm.height - denomShift) < clearance) denomShift += clearance - (axisHeight - .5 * ruleWidth - (denomm.height - denomShift));
		var midShift = -(axisHeight - .5 * ruleWidth);
		frac = makeVList({
			positionType: "individualShift",
			children: [
				{
					type: "elem",
					elem: denomm,
					shift: denomShift
				},
				{
					type: "elem",
					elem: rule,
					shift: midShift
				},
				{
					type: "elem",
					elem: numerm,
					shift: -numShift
				}
			]
		});
	}
	newOptions = options.havingStyle(style);
	frac.height *= newOptions.sizeMultiplier / options.sizeMultiplier;
	frac.depth *= newOptions.sizeMultiplier / options.sizeMultiplier;
	var delimSize;
	if (style.size === Style$1.DISPLAY.size) delimSize = options.fontMetrics().delim1;
	else if (style.size === Style$1.SCRIPTSCRIPT.size) delimSize = options.havingStyle(Style$1.SCRIPT).fontMetrics().delim2;
	else delimSize = options.fontMetrics().delim2;
	var leftDelim;
	var rightDelim;
	if (group.leftDelim == null) leftDelim = makeNullDelimiter(options, ["mopen"]);
	else leftDelim = makeCustomSizedDelim(group.leftDelim, delimSize, true, options.havingStyle(style), group.mode, ["mopen"]);
	if (group.continued) rightDelim = makeSpan([]);
	else if (group.rightDelim == null) rightDelim = makeNullDelimiter(options, ["mclose"]);
	else rightDelim = makeCustomSizedDelim(group.rightDelim, delimSize, true, options.havingStyle(style), group.mode, ["mclose"]);
	return makeSpan(["mord"].concat(newOptions.sizingClasses(options)), [
		leftDelim,
		makeSpan(["mfrac"], [frac]),
		rightDelim
	], options);
};
var mathmlBuilder$3 = (group, options) => {
	var node = new MathNode("mfrac", [buildGroup(group.numer, options), buildGroup(group.denom, options)]);
	if (!group.hasBarLine) node.setAttribute("linethickness", "0px");
	else if (group.barSize) {
		var ruleWidth = calculateSize(group.barSize, options);
		node.setAttribute("linethickness", makeEm(ruleWidth));
	}
	if (group.leftDelim != null || group.rightDelim != null) {
		var withDelims = [];
		if (group.leftDelim != null) {
			var leftOp = new MathNode("mo", [new TextNode(group.leftDelim.replace("\\", ""))]);
			leftOp.setAttribute("fence", "true");
			withDelims.push(leftOp);
		}
		withDelims.push(node);
		if (group.rightDelim != null) {
			var rightOp = new MathNode("mo", [new TextNode(group.rightDelim.replace("\\", ""))]);
			rightOp.setAttribute("fence", "true");
			withDelims.push(rightOp);
		}
		return makeRow(withDelims);
	}
	return node;
};
var wrapWithStyle = (frac, style) => {
	if (!style) return frac;
	return {
		type: "styling",
		mode: frac.mode,
		style,
		body: [frac]
	};
};
defineFunction({
	type: "genfrac",
	names: [
		"\\cfrac",
		"\\dfrac",
		"\\frac",
		"\\tfrac",
		"\\dbinom",
		"\\binom",
		"\\tbinom",
		"\\\\atopfrac",
		"\\\\bracefrac",
		"\\\\brackfrac"
	],
	props: {
		numArgs: 2,
		allowedInArgument: true
	},
	handler: (_ref, args) => {
		var { parser, funcName } = _ref;
		var numer = args[0];
		var denom = args[1];
		var hasBarLine;
		var leftDelim = null;
		var rightDelim = null;
		switch (funcName) {
			case "\\cfrac":
			case "\\dfrac":
			case "\\frac":
			case "\\tfrac":
				hasBarLine = true;
				break;
			case "\\\\atopfrac":
				hasBarLine = false;
				break;
			case "\\dbinom":
			case "\\binom":
			case "\\tbinom":
				hasBarLine = false;
				leftDelim = "(";
				rightDelim = ")";
				break;
			case "\\\\bracefrac":
				hasBarLine = false;
				leftDelim = "\\{";
				rightDelim = "\\}";
				break;
			case "\\\\brackfrac":
				hasBarLine = false;
				leftDelim = "[";
				rightDelim = "]";
				break;
			default: throw new Error("Unrecognized genfrac command");
		}
		var continued = funcName === "\\cfrac";
		var style = null;
		if (continued || funcName.startsWith("\\d")) style = "display";
		else if (funcName.startsWith("\\t")) style = "text";
		return wrapWithStyle({
			type: "genfrac",
			mode: parser.mode,
			numer,
			denom,
			continued,
			hasBarLine,
			leftDelim,
			rightDelim,
			barSize: null
		}, style);
	},
	htmlBuilder: htmlBuilder$4,
	mathmlBuilder: mathmlBuilder$3
});
defineFunction({
	type: "infix",
	names: [
		"\\over",
		"\\choose",
		"\\atop",
		"\\brace",
		"\\brack"
	],
	props: {
		numArgs: 0,
		infix: true
	},
	handler(_ref2) {
		var { parser, funcName, token } = _ref2;
		var replaceWith;
		switch (funcName) {
			case "\\over":
				replaceWith = "\\frac";
				break;
			case "\\choose":
				replaceWith = "\\binom";
				break;
			case "\\atop":
				replaceWith = "\\\\atopfrac";
				break;
			case "\\brace":
				replaceWith = "\\\\bracefrac";
				break;
			case "\\brack":
				replaceWith = "\\\\brackfrac";
				break;
			default: throw new Error("Unrecognized infix genfrac command");
		}
		return {
			type: "infix",
			mode: parser.mode,
			replaceWith,
			token
		};
	}
});
var stylArray = [
	"display",
	"text",
	"script",
	"scriptscript"
];
var delimFromValue = function delimFromValue(delimString) {
	var delim = null;
	if (delimString.length > 0) {
		delim = delimString;
		delim = delim === "." ? null : delim;
	}
	return delim;
};
defineFunction({
	type: "genfrac",
	names: ["\\genfrac"],
	props: {
		numArgs: 6,
		allowedInArgument: true,
		argTypes: [
			"math",
			"math",
			"size",
			"text",
			"math",
			"math"
		]
	},
	handler(_ref3, args) {
		var { parser } = _ref3;
		var numer = args[4];
		var denom = args[5];
		var leftNode = normalizeArgument(args[0]);
		var leftDelim = leftNode.type === "atom" && leftNode.family === "open" ? delimFromValue(leftNode.text) : null;
		var rightNode = normalizeArgument(args[1]);
		var rightDelim = rightNode.type === "atom" && rightNode.family === "close" ? delimFromValue(rightNode.text) : null;
		var barNode = assertNodeType(args[2], "size");
		var hasBarLine;
		var barSize = null;
		if (barNode.isBlank) hasBarLine = true;
		else {
			barSize = barNode.value;
			hasBarLine = barSize.number > 0;
		}
		var size = null;
		var styl = args[3];
		if (styl.type === "ordgroup") {
			if (styl.body.length > 0) {
				var textOrd = assertNodeType(styl.body[0], "textord");
				size = stylArray[Number(textOrd.text)];
			}
		} else {
			styl = assertNodeType(styl, "textord");
			size = stylArray[Number(styl.text)];
		}
		return wrapWithStyle({
			type: "genfrac",
			mode: parser.mode,
			numer,
			denom,
			continued: false,
			hasBarLine,
			barSize,
			leftDelim,
			rightDelim
		}, size);
	}
});
defineFunction({
	type: "infix",
	names: ["\\above"],
	props: {
		numArgs: 1,
		argTypes: ["size"],
		infix: true
	},
	handler(_ref4, args) {
		var { parser, funcName, token } = _ref4;
		return {
			type: "infix",
			mode: parser.mode,
			replaceWith: "\\\\abovefrac",
			size: assertNodeType(args[0], "size").value,
			token
		};
	}
});
defineFunction({
	type: "genfrac",
	names: ["\\\\abovefrac"],
	props: {
		numArgs: 3,
		argTypes: [
			"math",
			"size",
			"math"
		]
	},
	handler: (_ref5, args) => {
		var { parser, funcName } = _ref5;
		var numer = args[0];
		var barSize = assertNodeType(args[1], "infix").size;
		if (!barSize) throw new Error("\\\\abovefrac expected size, but got " + String(barSize));
		var denom = args[2];
		var hasBarLine = barSize.number > 0;
		return {
			type: "genfrac",
			mode: parser.mode,
			numer,
			denom,
			continued: false,
			hasBarLine,
			barSize,
			leftDelim: null,
			rightDelim: null
		};
	}
});
var htmlBuilder$3 = (grp, options) => {
	var style = options.style;
	var supSubGroup;
	var group;
	if (grp.type === "supsub") {
		supSubGroup = grp.sup ? buildGroup$1(grp.sup, options.havingStyle(style.sup()), options) : buildGroup$1(grp.sub, options.havingStyle(style.sub()), options);
		group = assertNodeType(grp.base, "horizBrace");
	} else group = assertNodeType(grp, "horizBrace");
	var body = buildGroup$1(group.base, options.havingBaseStyle(Style$1.DISPLAY));
	var braceBody = stretchySvg(group, options);
	var vlist;
	if (group.isOver) {
		vlist = makeVList({
			positionType: "firstBaseline",
			children: [
				{
					type: "elem",
					elem: body
				},
				{
					type: "kern",
					size: .1
				},
				{
					type: "elem",
					elem: braceBody
				}
			]
		});
		vlist.children[0].children[0].children[1].classes.push("svg-align");
	} else {
		vlist = makeVList({
			positionType: "bottom",
			positionData: body.depth + .1 + braceBody.height,
			children: [
				{
					type: "elem",
					elem: braceBody
				},
				{
					type: "kern",
					size: .1
				},
				{
					type: "elem",
					elem: body
				}
			]
		});
		vlist.children[0].children[0].children[0].classes.push("svg-align");
	}
	if (supSubGroup) {
		var vSpan = makeSpan(["minner", group.isOver ? "mover" : "munder"], [vlist], options);
		if (group.isOver) vlist = makeVList({
			positionType: "firstBaseline",
			children: [
				{
					type: "elem",
					elem: vSpan
				},
				{
					type: "kern",
					size: .2
				},
				{
					type: "elem",
					elem: supSubGroup
				}
			]
		});
		else vlist = makeVList({
			positionType: "bottom",
			positionData: vSpan.depth + .2 + supSubGroup.height + supSubGroup.depth,
			children: [
				{
					type: "elem",
					elem: supSubGroup
				},
				{
					type: "kern",
					size: .2
				},
				{
					type: "elem",
					elem: vSpan
				}
			]
		});
	}
	return makeSpan(["minner", group.isOver ? "mover" : "munder"], [vlist], options);
};
var mathmlBuilder$2 = (group, options) => {
	var accentNode = stretchyMathML(group.label);
	return new MathNode(group.isOver ? "mover" : "munder", [buildGroup(group.base, options), accentNode]);
};
defineFunction({
	type: "horizBrace",
	names: [
		"\\overbrace",
		"\\underbrace",
		"\\overbracket",
		"\\underbracket"
	],
	props: { numArgs: 1 },
	handler(_ref, args) {
		var { parser, funcName } = _ref;
		return {
			type: "horizBrace",
			mode: parser.mode,
			label: funcName,
			isOver: funcName.includes("\\over"),
			base: args[0]
		};
	},
	htmlBuilder: htmlBuilder$3,
	mathmlBuilder: mathmlBuilder$2
});
defineFunction({
	type: "href",
	names: ["\\href"],
	props: {
		numArgs: 2,
		argTypes: ["url", "original"],
		allowedInText: true
	},
	handler: (_ref, args) => {
		var { parser } = _ref;
		var body = args[1];
		var href = assertNodeType(args[0], "url").url;
		if (!parser.settings.isTrusted({
			command: "\\href",
			url: href
		})) return parser.formatUnsupportedCmd("\\href");
		return {
			type: "href",
			mode: parser.mode,
			href,
			body: ordargument(body)
		};
	},
	htmlBuilder: (group, options) => {
		var elements = buildExpression$1(group.body, options, false);
		return makeAnchor(group.href, [], elements, options);
	},
	mathmlBuilder: (group, options) => {
		var math = buildExpressionRow(group.body, options);
		if (!(math instanceof MathNode)) math = new MathNode("mrow", [math]);
		math.setAttribute("href", group.href);
		return math;
	}
});
defineFunction({
	type: "href",
	names: ["\\url"],
	props: {
		numArgs: 1,
		argTypes: ["url"],
		allowedInText: true
	},
	handler: (_ref2, args) => {
		var { parser } = _ref2;
		var href = assertNodeType(args[0], "url").url;
		if (!parser.settings.isTrusted({
			command: "\\url",
			url: href
		})) return parser.formatUnsupportedCmd("\\url");
		var chars = [];
		for (var i = 0; i < href.length; i++) {
			var c = href[i];
			if (c === "~") c = "\\textasciitilde";
			chars.push({
				type: "textord",
				mode: "text",
				text: c
			});
		}
		var body = {
			type: "text",
			mode: parser.mode,
			font: "\\texttt",
			body: chars
		};
		return {
			type: "href",
			mode: parser.mode,
			href,
			body: ordargument(body)
		};
	}
});
defineFunction({
	type: "hbox",
	names: ["\\hbox"],
	props: {
		numArgs: 1,
		argTypes: ["text"],
		allowedInText: true,
		primitive: true
	},
	handler(_ref, args) {
		var { parser } = _ref;
		return {
			type: "hbox",
			mode: parser.mode,
			body: ordargument(args[0])
		};
	},
	htmlBuilder(group, options) {
		return makeFragment(buildExpression$1(group.body, options, false));
	},
	mathmlBuilder(group, options) {
		return new MathNode("mrow", buildExpression(group.body, options));
	}
});
defineFunction({
	type: "html",
	names: [
		"\\htmlClass",
		"\\htmlId",
		"\\htmlStyle",
		"\\htmlData"
	],
	props: {
		numArgs: 2,
		argTypes: ["raw", "original"],
		allowedInText: true
	},
	handler: (_ref, args) => {
		var { parser, funcName, token } = _ref;
		var value = assertNodeType(args[0], "raw").string;
		var body = args[1];
		if (parser.settings.strict) parser.settings.reportNonstrict("htmlExtension", "HTML extension is disabled on strict mode");
		var trustContext;
		var attributes = {};
		switch (funcName) {
			case "\\htmlClass":
				attributes.class = value;
				trustContext = {
					command: "\\htmlClass",
					class: value
				};
				break;
			case "\\htmlId":
				attributes.id = value;
				trustContext = {
					command: "\\htmlId",
					id: value
				};
				break;
			case "\\htmlStyle":
				attributes.style = value;
				trustContext = {
					command: "\\htmlStyle",
					style: value
				};
				break;
			case "\\htmlData":
				var data = value.split(",");
				for (var i = 0; i < data.length; i++) {
					var item = data[i];
					var firstEquals = item.indexOf("=");
					if (firstEquals < 0) throw new ParseError("\\htmlData key/value '" + item + "' missing equals sign");
					var key = item.slice(0, firstEquals);
					var _value = item.slice(firstEquals + 1);
					attributes["data-" + key.trim()] = _value;
				}
				trustContext = {
					command: "\\htmlData",
					attributes
				};
				break;
			default: throw new Error("Unrecognized html command");
		}
		if (!parser.settings.isTrusted(trustContext)) return parser.formatUnsupportedCmd(funcName);
		return {
			type: "html",
			mode: parser.mode,
			attributes,
			body: ordargument(body)
		};
	},
	htmlBuilder: (group, options) => {
		var elements = buildExpression$1(group.body, options, false);
		var classes = ["enclosing"];
		if (group.attributes.class) classes.push(...group.attributes.class.trim().split(/\s+/));
		var span = makeSpan(classes, elements, options);
		for (var attr in group.attributes) if (attr !== "class" && group.attributes.hasOwnProperty(attr)) span.setAttribute(attr, group.attributes[attr]);
		return span;
	},
	mathmlBuilder: (group, options) => {
		return buildExpressionRow(group.body, options);
	}
});
defineFunction({
	type: "htmlmathml",
	names: ["\\html@mathml"],
	props: {
		numArgs: 2,
		allowedInArgument: true,
		allowedInText: true
	},
	handler: (_ref, args) => {
		var { parser } = _ref;
		return {
			type: "htmlmathml",
			mode: parser.mode,
			html: ordargument(args[0]),
			mathml: ordargument(args[1])
		};
	},
	htmlBuilder: (group, options) => {
		return makeFragment(buildExpression$1(group.html, options, false));
	},
	mathmlBuilder: (group, options) => {
		return buildExpressionRow(group.mathml, options);
	}
});
var sizeData = function sizeData(str) {
	if (/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(str)) return {
		number: +str,
		unit: "bp"
	};
	else {
		var match = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(str);
		if (!match) throw new ParseError("Invalid size: '" + str + "' in \\includegraphics");
		var data = {
			number: +(match[1] + match[2]),
			unit: match[3]
		};
		if (!validUnit(data)) throw new ParseError("Invalid unit: '" + data.unit + "' in \\includegraphics.");
		return data;
	}
};
defineFunction({
	type: "includegraphics",
	names: ["\\includegraphics"],
	props: {
		numArgs: 1,
		numOptionalArgs: 1,
		argTypes: ["raw", "url"],
		allowedInText: false
	},
	handler: (_ref, args, optArgs) => {
		var { parser } = _ref;
		var width = {
			number: 0,
			unit: "em"
		};
		var height = {
			number: .9,
			unit: "em"
		};
		var totalheight = {
			number: 0,
			unit: "em"
		};
		var alt = "";
		if (optArgs[0]) {
			var attributes = assertNodeType(optArgs[0], "raw").string.split(",");
			for (var i = 0; i < attributes.length; i++) {
				var keyVal = attributes[i].split("=");
				if (keyVal.length === 2) {
					var str = keyVal[1].trim();
					switch (keyVal[0].trim()) {
						case "alt":
							alt = str;
							break;
						case "width":
							width = sizeData(str);
							break;
						case "height":
							height = sizeData(str);
							break;
						case "totalheight":
							totalheight = sizeData(str);
							break;
						default: throw new ParseError("Invalid key: '" + keyVal[0] + "' in \\includegraphics.");
					}
				}
			}
		}
		var src = assertNodeType(args[0], "url").url;
		if (alt === "") {
			alt = src;
			alt = alt.replace(/^.*[\\/]/, "");
			alt = alt.substring(0, alt.lastIndexOf("."));
		}
		if (!parser.settings.isTrusted({
			command: "\\includegraphics",
			url: src
		})) return parser.formatUnsupportedCmd("\\includegraphics");
		return {
			type: "includegraphics",
			mode: parser.mode,
			alt,
			width,
			height,
			totalheight,
			src
		};
	},
	htmlBuilder: (group, options) => {
		var height = calculateSize(group.height, options);
		var depth = 0;
		if (group.totalheight.number > 0) depth = calculateSize(group.totalheight, options) - height;
		var width = 0;
		if (group.width.number > 0) width = calculateSize(group.width, options);
		var style = { height: makeEm(height + depth) };
		if (width > 0) style.width = makeEm(width);
		if (depth > 0) style.verticalAlign = makeEm(-depth);
		var node = new Img(group.src, group.alt, style);
		node.height = height;
		node.depth = depth;
		return node;
	},
	mathmlBuilder: (group, options) => {
		var node = new MathNode("mglyph", []);
		node.setAttribute("alt", group.alt);
		var height = calculateSize(group.height, options);
		var depth = 0;
		if (group.totalheight.number > 0) {
			depth = calculateSize(group.totalheight, options) - height;
			node.setAttribute("valign", makeEm(-depth));
		}
		node.setAttribute("height", makeEm(height + depth));
		if (group.width.number > 0) {
			var width = calculateSize(group.width, options);
			node.setAttribute("width", makeEm(width));
		}
		node.setAttribute("src", group.src);
		return node;
	}
});
defineFunction({
	type: "kern",
	names: [
		"\\kern",
		"\\mkern",
		"\\hskip",
		"\\mskip"
	],
	props: {
		numArgs: 1,
		argTypes: ["size"],
		primitive: true,
		allowedInText: true
	},
	handler(_ref, args) {
		var { parser, funcName } = _ref;
		var size = assertNodeType(args[0], "size");
		if (parser.settings.strict) {
			var mathFunction = funcName[1] === "m";
			var muUnit = size.value.unit === "mu";
			if (mathFunction) {
				if (!muUnit) parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " supports only mu units, " + ("not " + size.value.unit + " units"));
				if (parser.mode !== "math") parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " works only in math mode");
			} else if (muUnit) parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " doesn't support mu units");
		}
		return {
			type: "kern",
			mode: parser.mode,
			dimension: size.value
		};
	},
	htmlBuilder(group, options) {
		return makeGlue(group.dimension, options);
	},
	mathmlBuilder(group, options) {
		return new SpaceNode(calculateSize(group.dimension, options));
	}
});
defineFunction({
	type: "lap",
	names: [
		"\\mathllap",
		"\\mathrlap",
		"\\mathclap"
	],
	props: {
		numArgs: 1,
		allowedInText: true
	},
	handler: (_ref, args) => {
		var { parser, funcName } = _ref;
		var body = args[0];
		return {
			type: "lap",
			mode: parser.mode,
			alignment: funcName.slice(5),
			body
		};
	},
	htmlBuilder: (group, options) => {
		var inner;
		if (group.alignment === "clap") {
			inner = makeSpan([], [buildGroup$1(group.body, options)]);
			inner = makeSpan(["inner"], [inner], options);
		} else inner = makeSpan(["inner"], [buildGroup$1(group.body, options)]);
		var fix = makeSpan(["fix"], []);
		var node = makeSpan([group.alignment], [inner, fix], options);
		var strut = makeSpan(["strut"]);
		strut.style.height = makeEm(node.height + node.depth);
		if (node.depth) strut.style.verticalAlign = makeEm(-node.depth);
		node.children.unshift(strut);
		node = makeSpan(["thinbox"], [node], options);
		return makeSpan(["mord", "vbox"], [node], options);
	},
	mathmlBuilder: (group, options) => {
		var node = new MathNode("mpadded", [buildGroup(group.body, options)]);
		if (group.alignment !== "rlap") {
			var offset = group.alignment === "llap" ? "-1" : "-0.5";
			node.setAttribute("lspace", offset + "width");
		}
		node.setAttribute("width", "0px");
		return node;
	}
});
defineFunction({
	type: "styling",
	names: ["\\(", "$"],
	props: {
		numArgs: 0,
		allowedInText: true,
		allowedInMath: false
	},
	handler(_ref, args) {
		var { funcName, parser } = _ref;
		var outerMode = parser.mode;
		parser.switchMode("math");
		var close = funcName === "\\(" ? "\\)" : "$";
		var body = parser.parseExpression(false, close);
		parser.expect(close);
		parser.switchMode(outerMode);
		return {
			type: "styling",
			mode: parser.mode,
			style: "text",
			body
		};
	}
});
defineFunction({
	type: "text",
	names: ["\\)", "\\]"],
	props: {
		numArgs: 0,
		allowedInText: true,
		allowedInMath: false
	},
	handler(context, args) {
		throw new ParseError("Mismatched " + context.funcName);
	}
});
var chooseMathStyle = (group, options) => {
	switch (options.style.size) {
		case Style$1.DISPLAY.size: return group.display;
		case Style$1.TEXT.size: return group.text;
		case Style$1.SCRIPT.size: return group.script;
		case Style$1.SCRIPTSCRIPT.size: return group.scriptscript;
		default: return group.text;
	}
};
defineFunction({
	type: "mathchoice",
	names: ["\\mathchoice"],
	props: {
		numArgs: 4,
		primitive: true
	},
	handler: (_ref, args) => {
		var { parser } = _ref;
		return {
			type: "mathchoice",
			mode: parser.mode,
			display: ordargument(args[0]),
			text: ordargument(args[1]),
			script: ordargument(args[2]),
			scriptscript: ordargument(args[3])
		};
	},
	htmlBuilder: (group, options) => {
		return makeFragment(buildExpression$1(chooseMathStyle(group, options), options, false));
	},
	mathmlBuilder: (group, options) => {
		return buildExpressionRow(chooseMathStyle(group, options), options);
	}
});
var assembleSupSub = (base, supGroup, subGroup, options, style, slant, baseShift) => {
	base = makeSpan([], [base]);
	var subIsSingleCharacter = subGroup && isCharacterBox(subGroup);
	var sub;
	var sup;
	if (supGroup) {
		var elem = buildGroup$1(supGroup, options.havingStyle(style.sup()), options);
		sup = {
			elem,
			kern: Math.max(options.fontMetrics().bigOpSpacing1, options.fontMetrics().bigOpSpacing3 - elem.depth)
		};
	}
	if (subGroup) {
		var _elem = buildGroup$1(subGroup, options.havingStyle(style.sub()), options);
		sub = {
			elem: _elem,
			kern: Math.max(options.fontMetrics().bigOpSpacing2, options.fontMetrics().bigOpSpacing4 - _elem.height)
		};
	}
	var finalGroup;
	if (sup && sub) finalGroup = makeVList({
		positionType: "bottom",
		positionData: options.fontMetrics().bigOpSpacing5 + sub.elem.height + sub.elem.depth + sub.kern + base.depth + baseShift,
		children: [
			{
				type: "kern",
				size: options.fontMetrics().bigOpSpacing5
			},
			{
				type: "elem",
				elem: sub.elem,
				marginLeft: makeEm(-slant)
			},
			{
				type: "kern",
				size: sub.kern
			},
			{
				type: "elem",
				elem: base
			},
			{
				type: "kern",
				size: sup.kern
			},
			{
				type: "elem",
				elem: sup.elem,
				marginLeft: makeEm(slant)
			},
			{
				type: "kern",
				size: options.fontMetrics().bigOpSpacing5
			}
		]
	});
	else if (sub) finalGroup = makeVList({
		positionType: "top",
		positionData: base.height - baseShift,
		children: [
			{
				type: "kern",
				size: options.fontMetrics().bigOpSpacing5
			},
			{
				type: "elem",
				elem: sub.elem,
				marginLeft: makeEm(-slant)
			},
			{
				type: "kern",
				size: sub.kern
			},
			{
				type: "elem",
				elem: base
			}
		]
	});
	else if (sup) finalGroup = makeVList({
		positionType: "bottom",
		positionData: base.depth + baseShift,
		children: [
			{
				type: "elem",
				elem: base
			},
			{
				type: "kern",
				size: sup.kern
			},
			{
				type: "elem",
				elem: sup.elem,
				marginLeft: makeEm(slant)
			},
			{
				type: "kern",
				size: options.fontMetrics().bigOpSpacing5
			}
		]
	});
	else return base;
	var parts = [finalGroup];
	if (sub && slant !== 0 && !subIsSingleCharacter) {
		var spacer = makeSpan(["mspace"], [], options);
		spacer.style.marginRight = makeEm(slant);
		parts.unshift(spacer);
	}
	return makeSpan(["mop", "op-limits"], parts, options);
};
var noSuccessor = new Set(["\\smallint"]);
var htmlBuilder$2 = (grp, options) => {
	var supGroup;
	var subGroup;
	var hasLimits = false;
	var group;
	if (grp.type === "supsub") {
		supGroup = grp.sup;
		subGroup = grp.sub;
		group = assertNodeType(grp.base, "op");
		hasLimits = true;
	} else group = assertNodeType(grp, "op");
	var style = options.style;
	var large = false;
	if (style.size === Style$1.DISPLAY.size && group.symbol && !noSuccessor.has(group.name)) large = true;
	var base;
	if (group.symbol) {
		var fontName = large ? "Size2-Regular" : "Size1-Regular";
		var stash = "";
		if (group.name === "\\oiint" || group.name === "\\oiiint") {
			stash = group.name.slice(1);
			group.name = stash === "oiint" ? "\\iint" : "\\iiint";
		}
		base = makeSymbol(group.name, fontName, "math", options, [
			"mop",
			"op-symbol",
			large ? "large-op" : "small-op"
		]);
		if (stash.length > 0) {
			var italic = base.italic;
			var oval = staticSvg(stash + "Size" + (large ? "2" : "1"), options);
			base = makeVList({
				positionType: "individualShift",
				children: [{
					type: "elem",
					elem: base,
					shift: 0
				}, {
					type: "elem",
					elem: oval,
					shift: large ? .08 : 0
				}]
			});
			group.name = "\\" + stash;
			base.classes.unshift("mop");
			base.italic = italic;
		}
	} else if (group.body) {
		var inner = buildExpression$1(group.body, options, true);
		if (inner.length === 1 && inner[0] instanceof SymbolNode) {
			base = inner[0];
			base.classes[0] = "mop";
		} else base = makeSpan(["mop"], inner, options);
	} else {
		var output = [];
		for (var i = 1; i < group.name.length; i++) output.push(mathsym(group.name[i], group.mode, options));
		base = makeSpan(["mop"], output, options);
	}
	var baseShift = 0;
	var slant = 0;
	if ((base instanceof SymbolNode || group.name === "\\oiint" || group.name === "\\oiiint") && !group.suppressBaseShift) {
		baseShift = (base.height - base.depth) / 2 - options.fontMetrics().axisHeight;
		slant = base.italic || 0;
	}
	if (hasLimits) return assembleSupSub(base, supGroup, subGroup, options, style, slant, baseShift);
	else {
		if (baseShift) {
			base.style.position = "relative";
			base.style.top = makeEm(baseShift);
		}
		return base;
	}
};
var mathmlBuilder$1 = (group, options) => {
	var node;
	if (group.symbol) {
		node = new MathNode("mo", [makeText(group.name, group.mode)]);
		if (noSuccessor.has(group.name)) node.setAttribute("largeop", "false");
	} else if (group.body) node = new MathNode("mo", buildExpression(group.body, options));
	else {
		node = new MathNode("mi", [new TextNode(group.name.slice(1))]);
		var operator = new MathNode("mo", [makeText("⁡", "text")]);
		if (group.parentIsSupSub) node = new MathNode("mrow", [node, operator]);
		else node = newDocumentFragment([node, operator]);
	}
	return node;
};
var singleCharBigOps = {
	"∏": "\\prod",
	"∐": "\\coprod",
	"∑": "\\sum",
	"⋀": "\\bigwedge",
	"⋁": "\\bigvee",
	"⋂": "\\bigcap",
	"⋃": "\\bigcup",
	"⨀": "\\bigodot",
	"⨁": "\\bigoplus",
	"⨂": "\\bigotimes",
	"⨄": "\\biguplus",
	"⨆": "\\bigsqcup"
};
defineFunction({
	type: "op",
	names: [
		"\\coprod",
		"\\bigvee",
		"\\bigwedge",
		"\\biguplus",
		"\\bigcap",
		"\\bigcup",
		"\\intop",
		"\\prod",
		"\\sum",
		"\\bigotimes",
		"\\bigoplus",
		"\\bigodot",
		"\\bigsqcup",
		"\\smallint",
		"∏",
		"∐",
		"∑",
		"⋀",
		"⋁",
		"⋂",
		"⋃",
		"⨀",
		"⨁",
		"⨂",
		"⨄",
		"⨆"
	],
	props: { numArgs: 0 },
	handler: (_ref, args) => {
		var { parser, funcName } = _ref;
		var fName = funcName;
		if (fName.length === 1) fName = singleCharBigOps[fName];
		return {
			type: "op",
			mode: parser.mode,
			limits: true,
			parentIsSupSub: false,
			symbol: true,
			name: fName
		};
	},
	htmlBuilder: htmlBuilder$2,
	mathmlBuilder: mathmlBuilder$1
});
defineFunction({
	type: "op",
	names: ["\\mathop"],
	props: {
		numArgs: 1,
		primitive: true
	},
	handler: (_ref2, args) => {
		var { parser } = _ref2;
		var body = args[0];
		return {
			type: "op",
			mode: parser.mode,
			limits: false,
			parentIsSupSub: false,
			symbol: false,
			body: ordargument(body)
		};
	},
	htmlBuilder: htmlBuilder$2,
	mathmlBuilder: mathmlBuilder$1
});
var singleCharIntegrals = {
	"∫": "\\int",
	"∬": "\\iint",
	"∭": "\\iiint",
	"∮": "\\oint",
	"∯": "\\oiint",
	"∰": "\\oiiint"
};
defineFunction({
	type: "op",
	names: [
		"\\arcsin",
		"\\arccos",
		"\\arctan",
		"\\arctg",
		"\\arcctg",
		"\\arg",
		"\\ch",
		"\\cos",
		"\\cosec",
		"\\cosh",
		"\\cot",
		"\\cotg",
		"\\coth",
		"\\csc",
		"\\ctg",
		"\\cth",
		"\\deg",
		"\\dim",
		"\\exp",
		"\\hom",
		"\\ker",
		"\\lg",
		"\\ln",
		"\\log",
		"\\sec",
		"\\sin",
		"\\sinh",
		"\\sh",
		"\\tan",
		"\\tanh",
		"\\tg",
		"\\th"
	],
	props: { numArgs: 0 },
	handler(_ref3) {
		var { parser, funcName } = _ref3;
		return {
			type: "op",
			mode: parser.mode,
			limits: false,
			parentIsSupSub: false,
			symbol: false,
			name: funcName
		};
	},
	htmlBuilder: htmlBuilder$2,
	mathmlBuilder: mathmlBuilder$1
});
defineFunction({
	type: "op",
	names: [
		"\\det",
		"\\gcd",
		"\\inf",
		"\\lim",
		"\\max",
		"\\min",
		"\\Pr",
		"\\sup"
	],
	props: { numArgs: 0 },
	handler(_ref4) {
		var { parser, funcName } = _ref4;
		return {
			type: "op",
			mode: parser.mode,
			limits: true,
			parentIsSupSub: false,
			symbol: false,
			name: funcName
		};
	},
	htmlBuilder: htmlBuilder$2,
	mathmlBuilder: mathmlBuilder$1
});
defineFunction({
	type: "op",
	names: [
		"\\int",
		"\\iint",
		"\\iiint",
		"\\oint",
		"\\oiint",
		"\\oiiint",
		"∫",
		"∬",
		"∭",
		"∮",
		"∯",
		"∰"
	],
	props: {
		numArgs: 0,
		allowedInArgument: true
	},
	handler(_ref5) {
		var { parser, funcName } = _ref5;
		var fName = funcName;
		if (fName.length === 1) fName = singleCharIntegrals[fName];
		return {
			type: "op",
			mode: parser.mode,
			limits: false,
			parentIsSupSub: false,
			symbol: true,
			name: fName
		};
	},
	htmlBuilder: htmlBuilder$2,
	mathmlBuilder: mathmlBuilder$1
});
var htmlBuilder$1 = (grp, options) => {
	var supGroup;
	var subGroup;
	var hasLimits = false;
	var group;
	if (grp.type === "supsub") {
		supGroup = grp.sup;
		subGroup = grp.sub;
		group = assertNodeType(grp.base, "operatorname");
		hasLimits = true;
	} else group = assertNodeType(grp, "operatorname");
	var base;
	if (group.body.length > 0) {
		var expression = buildExpression$1(group.body.map((child) => {
			var childText = "text" in child ? child.text : void 0;
			if (typeof childText === "string") return {
				type: "textord",
				mode: child.mode,
				text: childText
			};
			else return child;
		}), options.withFont("mathrm"), true);
		for (var i = 0; i < expression.length; i++) {
			var child = expression[i];
			if (child instanceof SymbolNode) child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
		}
		base = makeSpan(["mop"], expression, options);
	} else base = makeSpan(["mop"], [], options);
	if (hasLimits) return assembleSupSub(base, supGroup, subGroup, options, options.style, 0, 0);
	else return base;
};
var mathmlBuilder = (group, options) => {
	var expression = buildExpression(group.body, options.withFont("mathrm"));
	var isAllString = true;
	for (var i = 0; i < expression.length; i++) {
		var node = expression[i];
		if (node instanceof SpaceNode);
		else if (node instanceof MathNode) switch (node.type) {
			case "mi":
			case "mn":
			case "mspace":
			case "mtext": break;
			case "mo":
				var child = node.children[0];
				if (node.children.length === 1 && child instanceof TextNode) child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
				else isAllString = false;
				break;
			default: isAllString = false;
		}
		else isAllString = false;
	}
	if (isAllString) expression = [new TextNode(expression.map((node) => node.toText()).join(""))];
	var identifier = new MathNode("mi", expression);
	identifier.setAttribute("mathvariant", "normal");
	var operator = new MathNode("mo", [makeText("⁡", "text")]);
	if (group.parentIsSupSub) return new MathNode("mrow", [identifier, operator]);
	else return newDocumentFragment([identifier, operator]);
};
defineFunction({
	type: "operatorname",
	names: ["\\operatorname@", "\\operatornamewithlimits"],
	props: { numArgs: 1 },
	handler: (_ref, args) => {
		var { parser, funcName } = _ref;
		var body = args[0];
		return {
			type: "operatorname",
			mode: parser.mode,
			body: ordargument(body),
			alwaysHandleSupSub: funcName === "\\operatornamewithlimits",
			limits: false,
			parentIsSupSub: false
		};
	},
	htmlBuilder: htmlBuilder$1,
	mathmlBuilder
});
defineMacro("\\operatorname", "\\@ifstar\\operatornamewithlimits\\operatorname@");
defineFunctionBuilders({
	type: "ordgroup",
	htmlBuilder(group, options) {
		if (group.semisimple) return makeFragment(buildExpression$1(group.body, options, false));
		return makeSpan(["mord"], buildExpression$1(group.body, options, true), options);
	},
	mathmlBuilder(group, options) {
		return buildExpressionRow(group.body, options, true);
	}
});
defineFunction({
	type: "overline",
	names: ["\\overline"],
	props: { numArgs: 1 },
	handler(_ref, args) {
		var { parser } = _ref;
		var body = args[0];
		return {
			type: "overline",
			mode: parser.mode,
			body
		};
	},
	htmlBuilder(group, options) {
		var innerGroup = buildGroup$1(group.body, options.havingCrampedStyle());
		var line = makeLineSpan("overline-line", options);
		var defaultRuleThickness = options.fontMetrics().defaultRuleThickness;
		return makeSpan(["mord", "overline"], [makeVList({
			positionType: "firstBaseline",
			children: [
				{
					type: "elem",
					elem: innerGroup
				},
				{
					type: "kern",
					size: 3 * defaultRuleThickness
				},
				{
					type: "elem",
					elem: line
				},
				{
					type: "kern",
					size: defaultRuleThickness
				}
			]
		})], options);
	},
	mathmlBuilder(group, options) {
		var operator = new MathNode("mo", [new TextNode("‾")]);
		operator.setAttribute("stretchy", "true");
		var node = new MathNode("mover", [buildGroup(group.body, options), operator]);
		node.setAttribute("accent", "true");
		return node;
	}
});
defineFunction({
	type: "phantom",
	names: ["\\phantom"],
	props: {
		numArgs: 1,
		allowedInText: true
	},
	handler: (_ref, args) => {
		var { parser } = _ref;
		var body = args[0];
		return {
			type: "phantom",
			mode: parser.mode,
			body: ordargument(body)
		};
	},
	htmlBuilder: (group, options) => {
		return makeFragment(buildExpression$1(group.body, options.withPhantom(), false));
	},
	mathmlBuilder: (group, options) => {
		return new MathNode("mphantom", buildExpression(group.body, options));
	}
});
defineMacro("\\hphantom", "\\smash{\\phantom{#1}}");
defineFunction({
	type: "vphantom",
	names: ["\\vphantom"],
	props: {
		numArgs: 1,
		allowedInText: true
	},
	handler: (_ref2, args) => {
		var { parser } = _ref2;
		var body = args[0];
		return {
			type: "vphantom",
			mode: parser.mode,
			body
		};
	},
	htmlBuilder: (group, options) => {
		return makeSpan(["mord", "rlap"], [makeSpan(["inner"], [buildGroup$1(group.body, options.withPhantom())]), makeSpan(["fix"], [])], options);
	},
	mathmlBuilder: (group, options) => {
		var node = new MathNode("mpadded", [new MathNode("mphantom", buildExpression(ordargument(group.body), options))]);
		node.setAttribute("width", "0px");
		return node;
	}
});
defineFunction({
	type: "raisebox",
	names: ["\\raisebox"],
	props: {
		numArgs: 2,
		argTypes: ["size", "hbox"],
		allowedInText: true
	},
	handler(_ref, args) {
		var { parser } = _ref;
		var amount = assertNodeType(args[0], "size").value;
		var body = args[1];
		return {
			type: "raisebox",
			mode: parser.mode,
			dy: amount,
			body
		};
	},
	htmlBuilder(group, options) {
		var body = buildGroup$1(group.body, options);
		return makeVList({
			positionType: "shift",
			positionData: -calculateSize(group.dy, options),
			children: [{
				type: "elem",
				elem: body
			}]
		});
	},
	mathmlBuilder(group, options) {
		var node = new MathNode("mpadded", [buildGroup(group.body, options)]);
		var dy = group.dy.number + group.dy.unit;
		node.setAttribute("voffset", dy);
		return node;
	}
});
defineFunction({
	type: "internal",
	names: ["\\relax"],
	props: {
		numArgs: 0,
		allowedInText: true,
		allowedInArgument: true
	},
	handler(_ref) {
		var { parser } = _ref;
		return {
			type: "internal",
			mode: parser.mode
		};
	}
});
defineFunction({
	type: "rule",
	names: ["\\rule"],
	props: {
		numArgs: 2,
		numOptionalArgs: 1,
		allowedInText: true,
		allowedInMath: true,
		argTypes: [
			"size",
			"size",
			"size"
		]
	},
	handler(_ref, args, optArgs) {
		var { parser } = _ref;
		var shift = optArgs[0];
		var width = assertNodeType(args[0], "size");
		var height = assertNodeType(args[1], "size");
		return {
			type: "rule",
			mode: parser.mode,
			shift: shift && assertNodeType(shift, "size").value,
			width: width.value,
			height: height.value
		};
	},
	htmlBuilder(group, options) {
		var rule = makeSpan(["mord", "rule"], [], options);
		var width = calculateSize(group.width, options);
		var height = calculateSize(group.height, options);
		var shift = group.shift ? calculateSize(group.shift, options) : 0;
		rule.style.borderRightWidth = makeEm(width);
		rule.style.borderTopWidth = makeEm(height);
		rule.style.bottom = makeEm(shift);
		rule.width = width;
		rule.height = height + shift;
		rule.depth = -shift;
		rule.maxFontSize = height * 1.125 * options.sizeMultiplier;
		return rule;
	},
	mathmlBuilder(group, options) {
		var width = calculateSize(group.width, options);
		var height = calculateSize(group.height, options);
		var shift = group.shift ? calculateSize(group.shift, options) : 0;
		var color = options.color && options.getColor() || "black";
		var rule = new MathNode("mspace");
		rule.setAttribute("mathbackground", color);
		rule.setAttribute("width", makeEm(width));
		rule.setAttribute("height", makeEm(height));
		var wrapper = new MathNode("mpadded", [rule]);
		if (shift >= 0) wrapper.setAttribute("height", makeEm(shift));
		else {
			wrapper.setAttribute("height", makeEm(shift));
			wrapper.setAttribute("depth", makeEm(-shift));
		}
		wrapper.setAttribute("voffset", makeEm(shift));
		return wrapper;
	}
});
function sizingGroup(value, options, baseOptions) {
	var inner = buildExpression$1(value, options, false);
	var multiplier = options.sizeMultiplier / baseOptions.sizeMultiplier;
	for (var i = 0; i < inner.length; i++) {
		var pos = inner[i].classes.indexOf("sizing");
		if (pos < 0) Array.prototype.push.apply(inner[i].classes, options.sizingClasses(baseOptions));
		else if (inner[i].classes[pos + 1] === "reset-size" + options.size) inner[i].classes[pos + 1] = "reset-size" + baseOptions.size;
		inner[i].height *= multiplier;
		inner[i].depth *= multiplier;
	}
	return makeFragment(inner);
}
var sizeFuncs = [
	"\\tiny",
	"\\sixptsize",
	"\\scriptsize",
	"\\footnotesize",
	"\\small",
	"\\normalsize",
	"\\large",
	"\\Large",
	"\\LARGE",
	"\\huge",
	"\\Huge"
];
var htmlBuilder = (group, options) => {
	var newOptions = options.havingSize(group.size);
	return sizingGroup(group.body, newOptions, options);
};
defineFunction({
	type: "sizing",
	names: sizeFuncs,
	props: {
		numArgs: 0,
		allowedInText: true
	},
	handler: (_ref, args) => {
		var { breakOnTokenText, funcName, parser } = _ref;
		var body = parser.parseExpression(false, breakOnTokenText);
		return {
			type: "sizing",
			mode: parser.mode,
			size: sizeFuncs.indexOf(funcName) + 1,
			body
		};
	},
	htmlBuilder,
	mathmlBuilder: (group, options) => {
		var newOptions = options.havingSize(group.size);
		var node = new MathNode("mstyle", buildExpression(group.body, newOptions));
		node.setAttribute("mathsize", makeEm(newOptions.sizeMultiplier));
		return node;
	}
});
defineFunction({
	type: "smash",
	names: ["\\smash"],
	props: {
		numArgs: 1,
		numOptionalArgs: 1,
		allowedInText: true
	},
	handler: (_ref, args, optArgs) => {
		var { parser } = _ref;
		var smashHeight = false;
		var smashDepth = false;
		var tbArg = optArgs[0] && assertNodeType(optArgs[0], "ordgroup");
		if (tbArg) {
			var letter = "";
			for (var i = 0; i < tbArg.body.length; ++i) {
				var node = tbArg.body[i];
				letter = assertSymbolNodeType(node).text;
				if (letter === "t") smashHeight = true;
				else if (letter === "b") smashDepth = true;
				else {
					smashHeight = false;
					smashDepth = false;
					break;
				}
			}
		} else {
			smashHeight = true;
			smashDepth = true;
		}
		var body = args[0];
		return {
			type: "smash",
			mode: parser.mode,
			body,
			smashHeight,
			smashDepth
		};
	},
	htmlBuilder: (group, options) => {
		var node = makeSpan([], [buildGroup$1(group.body, options)]);
		if (!group.smashHeight && !group.smashDepth) return node;
		if (group.smashHeight) node.height = 0;
		if (group.smashDepth) node.depth = 0;
		if (group.smashHeight && group.smashDepth) return makeSpan(["mord", "smash"], [node], options);
		if (node.children) for (var i = 0; i < node.children.length; i++) {
			if (group.smashHeight) node.children[i].height = 0;
			if (group.smashDepth) node.children[i].depth = 0;
		}
		return makeSpan(["mord"], [makeVList({
			positionType: "firstBaseline",
			children: [{
				type: "elem",
				elem: node
			}]
		})], options);
	},
	mathmlBuilder: (group, options) => {
		var node = new MathNode("mpadded", [buildGroup(group.body, options)]);
		if (group.smashHeight) node.setAttribute("height", "0px");
		if (group.smashDepth) node.setAttribute("depth", "0px");
		return node;
	}
});
defineFunction({
	type: "sqrt",
	names: ["\\sqrt"],
	props: {
		numArgs: 1,
		numOptionalArgs: 1
	},
	handler(_ref, args, optArgs) {
		var { parser } = _ref;
		var index = optArgs[0];
		var body = args[0];
		return {
			type: "sqrt",
			mode: parser.mode,
			body,
			index
		};
	},
	htmlBuilder(group, options) {
		var inner = buildGroup$1(group.body, options.havingCrampedStyle());
		if (inner.height === 0) inner.height = options.fontMetrics().xHeight;
		inner = wrapFragment(inner, options);
		var theta = options.fontMetrics().defaultRuleThickness;
		var phi = theta;
		if (options.style.id < Style$1.TEXT.id) phi = options.fontMetrics().xHeight;
		var lineClearance = theta + phi / 4;
		var { span: img, ruleWidth, advanceWidth } = makeSqrtImage(inner.height + inner.depth + lineClearance + theta, options);
		var delimDepth = img.height - ruleWidth;
		if (delimDepth > inner.height + inner.depth + lineClearance) lineClearance = (lineClearance + delimDepth - inner.height - inner.depth) / 2;
		var imgShift = img.height - inner.height - lineClearance - ruleWidth;
		inner.style.paddingLeft = makeEm(advanceWidth);
		var body = makeVList({
			positionType: "firstBaseline",
			children: [
				{
					type: "elem",
					elem: inner,
					wrapperClasses: ["svg-align"]
				},
				{
					type: "kern",
					size: -(inner.height + imgShift)
				},
				{
					type: "elem",
					elem: img
				},
				{
					type: "kern",
					size: ruleWidth
				}
			]
		});
		if (!group.index) return makeSpan(["mord", "sqrt"], [body], options);
		else {
			var newOptions = options.havingStyle(Style$1.SCRIPTSCRIPT);
			var rootm = buildGroup$1(group.index, newOptions, options);
			return makeSpan(["mord", "sqrt"], [makeSpan(["root"], [makeVList({
				positionType: "shift",
				positionData: -(.6 * (body.height - body.depth)),
				children: [{
					type: "elem",
					elem: rootm
				}]
			})]), body], options);
		}
	},
	mathmlBuilder(group, options) {
		var { body, index } = group;
		return index ? new MathNode("mroot", [buildGroup(body, options), buildGroup(index, options)]) : new MathNode("msqrt", [buildGroup(body, options)]);
	}
});
var styleMap = {
	"display": Style$1.DISPLAY,
	"text": Style$1.TEXT,
	"script": Style$1.SCRIPT,
	"scriptscript": Style$1.SCRIPTSCRIPT
};
defineFunction({
	type: "styling",
	names: [
		"\\displaystyle",
		"\\textstyle",
		"\\scriptstyle",
		"\\scriptscriptstyle"
	],
	props: {
		numArgs: 0,
		allowedInText: true,
		primitive: true
	},
	handler(_ref, args) {
		var { breakOnTokenText, funcName, parser } = _ref;
		var body = parser.parseExpression(true, breakOnTokenText);
		var style = funcName.slice(1, funcName.length - 5);
		return {
			type: "styling",
			mode: parser.mode,
			style,
			body
		};
	},
	htmlBuilder(group, options) {
		var newStyle = styleMap[group.style];
		var newOptions = options.havingStyle(newStyle).withFont("");
		return sizingGroup(group.body, newOptions, options);
	},
	mathmlBuilder(group, options) {
		var newStyle = styleMap[group.style];
		var newOptions = options.havingStyle(newStyle);
		var node = new MathNode("mstyle", buildExpression(group.body, newOptions));
		var attr = {
			"display": ["0", "true"],
			"text": ["0", "false"],
			"script": ["1", "false"],
			"scriptscript": ["2", "false"]
		}[group.style];
		node.setAttribute("scriptlevel", attr[0]);
		node.setAttribute("displaystyle", attr[1]);
		return node;
	}
});
/**
* Sometimes, groups perform special rules when they have superscripts or
* subscripts attached to them. This function lets the `supsub` group know that
* Sometimes, groups perform special rules when they have superscripts or
* its inner element should handle the superscripts and subscripts instead of
* handling them itself.
*/
var htmlBuilderDelegate = function htmlBuilderDelegate(group, options) {
	var base = group.base;
	if (!base) return null;
	else if (base.type === "op") return base.limits && (options.style.size === Style$1.DISPLAY.size || base.alwaysHandleSupSub) ? htmlBuilder$2 : null;
	else if (base.type === "operatorname") return base.alwaysHandleSupSub && (options.style.size === Style$1.DISPLAY.size || base.limits) ? htmlBuilder$1 : null;
	else if (base.type === "accent") return isCharacterBox(base.base) ? htmlBuilder$a : null;
	else if (base.type === "horizBrace") return !group.sub === base.isOver ? htmlBuilder$3 : null;
	else return null;
};
defineFunctionBuilders({
	type: "supsub",
	htmlBuilder(group, options) {
		var builderDelegate = htmlBuilderDelegate(group, options);
		if (builderDelegate) return builderDelegate(group, options);
		var { base: valueBase, sup: valueSup, sub: valueSub } = group;
		var base = buildGroup$1(valueBase, options);
		var supm;
		var subm;
		var metrics = options.fontMetrics();
		var supShift = 0;
		var subShift = 0;
		var isCharBox = valueBase && isCharacterBox(valueBase);
		if (valueSup) {
			var newOptions = options.havingStyle(options.style.sup());
			supm = buildGroup$1(valueSup, newOptions, options);
			if (!isCharBox) supShift = base.height - newOptions.fontMetrics().supDrop * newOptions.sizeMultiplier / options.sizeMultiplier;
		}
		if (valueSub) {
			var _newOptions = options.havingStyle(options.style.sub());
			subm = buildGroup$1(valueSub, _newOptions, options);
			if (!isCharBox) subShift = base.depth + _newOptions.fontMetrics().subDrop * _newOptions.sizeMultiplier / options.sizeMultiplier;
		}
		var minSupShift;
		if (options.style === Style$1.DISPLAY) minSupShift = metrics.sup1;
		else if (options.style.cramped) minSupShift = metrics.sup3;
		else minSupShift = metrics.sup2;
		var multiplier = options.sizeMultiplier;
		var marginRight = makeEm(.5 / metrics.ptPerEm / multiplier);
		var marginLeft = null;
		if (subm) {
			var isOiint = group.base && group.base.type === "op" && group.base.name && (group.base.name === "\\oiint" || group.base.name === "\\oiiint");
			if (base instanceof SymbolNode || isOiint) marginLeft = makeEm(-base.italic);
		}
		var supsub;
		if (supm && subm) {
			supShift = Math.max(supShift, minSupShift, supm.depth + .25 * metrics.xHeight);
			subShift = Math.max(subShift, metrics.sub2);
			var maxWidth = 4 * metrics.defaultRuleThickness;
			if (supShift - supm.depth - (subm.height - subShift) < maxWidth) {
				subShift = maxWidth - (supShift - supm.depth) + subm.height;
				var psi = .8 * metrics.xHeight - (supShift - supm.depth);
				if (psi > 0) {
					supShift += psi;
					subShift -= psi;
				}
			}
			supsub = makeVList({
				positionType: "individualShift",
				children: [{
					type: "elem",
					elem: subm,
					shift: subShift,
					marginRight,
					marginLeft
				}, {
					type: "elem",
					elem: supm,
					shift: -supShift,
					marginRight
				}]
			});
		} else if (subm) {
			subShift = Math.max(subShift, metrics.sub1, subm.height - .8 * metrics.xHeight);
			supsub = makeVList({
				positionType: "shift",
				positionData: subShift,
				children: [{
					type: "elem",
					elem: subm,
					marginLeft,
					marginRight
				}]
			});
		} else if (supm) {
			supShift = Math.max(supShift, minSupShift, supm.depth + .25 * metrics.xHeight);
			supsub = makeVList({
				positionType: "shift",
				positionData: -supShift,
				children: [{
					type: "elem",
					elem: supm,
					marginRight
				}]
			});
		} else throw new Error("supsub must have either sup or sub.");
		return makeSpan([getTypeOfDomTree(base, "right") || "mord"], [base, makeSpan(["msupsub"], [supsub])], options);
	},
	mathmlBuilder(group, options) {
		var isBrace = false;
		var isOver;
		var isSup;
		if (group.base && group.base.type === "horizBrace") {
			isSup = !!group.sup;
			if (isSup === group.base.isOver) {
				isBrace = true;
				isOver = group.base.isOver;
			}
		}
		if (group.base && (group.base.type === "op" || group.base.type === "operatorname")) group.base.parentIsSupSub = true;
		var children = [buildGroup(group.base, options)];
		if (group.sub) children.push(buildGroup(group.sub, options));
		if (group.sup) children.push(buildGroup(group.sup, options));
		var nodeType;
		if (isBrace) nodeType = isOver ? "mover" : "munder";
		else if (!group.sub) {
			var base = group.base;
			if (base && base.type === "op" && base.limits && (options.style === Style$1.DISPLAY || base.alwaysHandleSupSub)) nodeType = "mover";
			else if (base && base.type === "operatorname" && base.alwaysHandleSupSub && (base.limits || options.style === Style$1.DISPLAY)) nodeType = "mover";
			else nodeType = "msup";
		} else if (!group.sup) {
			var _base = group.base;
			if (_base && _base.type === "op" && _base.limits && (options.style === Style$1.DISPLAY || _base.alwaysHandleSupSub)) nodeType = "munder";
			else if (_base && _base.type === "operatorname" && _base.alwaysHandleSupSub && (_base.limits || options.style === Style$1.DISPLAY)) nodeType = "munder";
			else nodeType = "msub";
		} else {
			var _base2 = group.base;
			if (_base2 && _base2.type === "op" && _base2.limits && options.style === Style$1.DISPLAY) nodeType = "munderover";
			else if (_base2 && _base2.type === "operatorname" && _base2.alwaysHandleSupSub && (options.style === Style$1.DISPLAY || _base2.limits)) nodeType = "munderover";
			else nodeType = "msubsup";
		}
		return new MathNode(nodeType, children);
	}
});
defineFunctionBuilders({
	type: "atom",
	htmlBuilder(group, options) {
		return mathsym(group.text, group.mode, options, ["m" + group.family]);
	},
	mathmlBuilder(group, options) {
		var node = new MathNode("mo", [makeText(group.text, group.mode)]);
		if (group.family === "bin") {
			var variant = getVariant(group, options);
			if (variant === "bold-italic") node.setAttribute("mathvariant", variant);
		} else if (group.family === "punct") node.setAttribute("separator", "true");
		else if (group.family === "open" || group.family === "close") node.setAttribute("stretchy", "false");
		return node;
	}
});
var defaultVariant = {
	"mi": "italic",
	"mn": "normal",
	"mtext": "normal"
};
defineFunctionBuilders({
	type: "mathord",
	htmlBuilder(group, options) {
		return makeOrd(group, options, "mathord");
	},
	mathmlBuilder(group, options) {
		var node = new MathNode("mi", [makeText(group.text, group.mode, options)]);
		var variant = getVariant(group, options) || "italic";
		if (variant !== defaultVariant[node.type]) node.setAttribute("mathvariant", variant);
		return node;
	}
});
defineFunctionBuilders({
	type: "textord",
	htmlBuilder(group, options) {
		return makeOrd(group, options, "textord");
	},
	mathmlBuilder(group, options) {
		var text = makeText(group.text, group.mode, options);
		var variant = getVariant(group, options) || "normal";
		var node;
		if (group.mode === "text") node = new MathNode("mtext", [text]);
		else if (/[0-9]/.test(group.text)) node = new MathNode("mn", [text]);
		else if (group.text === "\\prime") node = new MathNode("mo", [text]);
		else node = new MathNode("mi", [text]);
		if (variant !== defaultVariant[node.type]) node.setAttribute("mathvariant", variant);
		return node;
	}
});
var cssSpace = {
	"\\nobreak": "nobreak",
	"\\allowbreak": "allowbreak"
};
var regularSpace = {
	" ": {},
	"\\ ": {},
	"~": { className: "nobreak" },
	"\\space": {},
	"\\nobreakspace": { className: "nobreak" }
};
defineFunctionBuilders({
	type: "spacing",
	htmlBuilder(group, options) {
		if (regularSpace.hasOwnProperty(group.text)) {
			var className = regularSpace[group.text].className || "";
			if (group.mode === "text") {
				var ord = makeOrd(group, options, "textord");
				ord.classes.push(className);
				return ord;
			} else return makeSpan(["mspace", className], [mathsym(group.text, group.mode, options)], options);
		} else if (cssSpace.hasOwnProperty(group.text)) return makeSpan(["mspace", cssSpace[group.text]], [], options);
		else throw new ParseError("Unknown type of space \"" + group.text + "\"");
	},
	mathmlBuilder(group, options) {
		var node;
		if (regularSpace.hasOwnProperty(group.text)) node = new MathNode("mtext", [new TextNode("\xA0")]);
		else if (cssSpace.hasOwnProperty(group.text)) return new MathNode("mspace");
		else throw new ParseError("Unknown type of space \"" + group.text + "\"");
		return node;
	}
});
var pad = () => {
	var padNode = new MathNode("mtd", []);
	padNode.setAttribute("width", "50%");
	return padNode;
};
defineFunctionBuilders({
	type: "tag",
	mathmlBuilder(group, options) {
		var table = new MathNode("mtable", [new MathNode("mtr", [
			pad(),
			new MathNode("mtd", [buildExpressionRow(group.body, options)]),
			pad(),
			new MathNode("mtd", [buildExpressionRow(group.tag, options)])
		])]);
		table.setAttribute("width", "100%");
		return table;
	}
});
var textFontFamilies = {
	"\\text": void 0,
	"\\textrm": "textrm",
	"\\textsf": "textsf",
	"\\texttt": "texttt",
	"\\textnormal": "textrm"
};
var textFontWeights = {
	"\\textbf": "textbf",
	"\\textmd": "textmd"
};
var textFontShapes = {
	"\\textit": "textit",
	"\\textup": "textup"
};
var optionsWithFont = (group, options) => {
	var font = group.font;
	if (!font) return options;
	else if (textFontFamilies[font]) return options.withTextFontFamily(textFontFamilies[font]);
	else if (textFontWeights[font]) return options.withTextFontWeight(textFontWeights[font]);
	else if (font === "\\emph") return options.fontShape === "textit" ? options.withTextFontShape("textup") : options.withTextFontShape("textit");
	return options.withTextFontShape(textFontShapes[font]);
};
defineFunction({
	type: "text",
	names: [
		"\\text",
		"\\textrm",
		"\\textsf",
		"\\texttt",
		"\\textnormal",
		"\\textbf",
		"\\textmd",
		"\\textit",
		"\\textup",
		"\\emph"
	],
	props: {
		numArgs: 1,
		argTypes: ["text"],
		allowedInArgument: true,
		allowedInText: true
	},
	handler(_ref, args) {
		var { parser, funcName } = _ref;
		var body = args[0];
		return {
			type: "text",
			mode: parser.mode,
			body: ordargument(body),
			font: funcName
		};
	},
	htmlBuilder(group, options) {
		var newOptions = optionsWithFont(group, options);
		return makeSpan(["mord", "text"], buildExpression$1(group.body, newOptions, true), newOptions);
	},
	mathmlBuilder(group, options) {
		var newOptions = optionsWithFont(group, options);
		return buildExpressionRow(group.body, newOptions);
	}
});
defineFunction({
	type: "underline",
	names: ["\\underline"],
	props: {
		numArgs: 1,
		allowedInText: true
	},
	handler(_ref, args) {
		var { parser } = _ref;
		return {
			type: "underline",
			mode: parser.mode,
			body: args[0]
		};
	},
	htmlBuilder(group, options) {
		var innerGroup = buildGroup$1(group.body, options);
		var line = makeLineSpan("underline-line", options);
		var defaultRuleThickness = options.fontMetrics().defaultRuleThickness;
		return makeSpan(["mord", "underline"], [makeVList({
			positionType: "top",
			positionData: innerGroup.height,
			children: [
				{
					type: "kern",
					size: defaultRuleThickness
				},
				{
					type: "elem",
					elem: line
				},
				{
					type: "kern",
					size: 3 * defaultRuleThickness
				},
				{
					type: "elem",
					elem: innerGroup
				}
			]
		})], options);
	},
	mathmlBuilder(group, options) {
		var operator = new MathNode("mo", [new TextNode("‾")]);
		operator.setAttribute("stretchy", "true");
		var node = new MathNode("munder", [buildGroup(group.body, options), operator]);
		node.setAttribute("accentunder", "true");
		return node;
	}
});
defineFunction({
	type: "vcenter",
	names: ["\\vcenter"],
	props: {
		numArgs: 1,
		argTypes: ["original"],
		allowedInText: false
	},
	handler(_ref, args) {
		var { parser } = _ref;
		return {
			type: "vcenter",
			mode: parser.mode,
			body: args[0]
		};
	},
	htmlBuilder(group, options) {
		var body = buildGroup$1(group.body, options);
		var axisHeight = options.fontMetrics().axisHeight;
		return makeVList({
			positionType: "shift",
			positionData: .5 * (body.height - axisHeight - (body.depth + axisHeight)),
			children: [{
				type: "elem",
				elem: body
			}]
		});
	},
	mathmlBuilder(group, options) {
		return new MathNode("mpadded", [buildGroup(group.body, options)], ["vcenter"]);
	}
});
defineFunction({
	type: "verb",
	names: ["\\verb"],
	props: {
		numArgs: 0,
		allowedInText: true
	},
	handler(context, args, optArgs) {
		throw new ParseError("\\verb ended by end of line instead of matching delimiter");
	},
	htmlBuilder(group, options) {
		var text = makeVerb(group);
		var body = [];
		var newOptions = options.havingStyle(options.style.text());
		for (var i = 0; i < text.length; i++) {
			var c = text[i];
			if (c === "~") c = "\\textasciitilde";
			body.push(makeSymbol(c, "Typewriter-Regular", group.mode, newOptions, ["mord", "texttt"]));
		}
		return makeSpan(["mord", "text"].concat(newOptions.sizingClasses(options)), tryCombineChars(body), newOptions);
	},
	mathmlBuilder(group, options) {
		var node = new MathNode("mtext", [new TextNode(makeVerb(group))]);
		node.setAttribute("mathvariant", "monospace");
		return node;
	}
});
/**
* Converts verb group into body string.
*
* \verb* replaces each space with an open box \u2423
* \verb replaces each space with a no-break space \xA0
*/
var makeVerb = (group) => group.body.replace(/ /g, group.star ? "␣" : "\xA0");
/** Include this to ensure that all functions are defined. */
var functions = _functions;
/**
* The Lexer class handles tokenizing the input in various ways. Since our
* parser expects us to be able to backtrack, the lexer allows lexing from any
* given starting point.
*
* Its main exposed function is the `lex` function, which takes a position to
* lex from and a type of token to lex. It defers to the appropriate `_innerLex`
* function.
*
* The various `_innerLex` functions perform the actual lexing of different
* kinds.
*/
var spaceRegexString = "[ \r\n	]";
var controlWordRegexString = "\\\\[a-zA-Z@]+";
var controlSymbolRegexString = "\\\\[^\ud800-\udfff]";
var controlWordWhitespaceRegexString = "(" + controlWordRegexString + ")" + spaceRegexString + "*";
var controlSpaceRegexString = "\\\\(\n|[ \r	]+\n?)[ \r	]*";
var combiningDiacriticalMarkString = "[̀-ͯ]";
var combiningDiacriticalMarksEndRegex = new RegExp(combiningDiacriticalMarkString + "+$");
var tokenRegexString = "(" + spaceRegexString + "+)|" + (controlSpaceRegexString + "|") + "([!-\\[\\]-‧‪-퟿豈-￿]" + (combiningDiacriticalMarkString + "*") + "|[\ud800-\udbff][\udc00-\udfff]" + (combiningDiacriticalMarkString + "*") + "|\\\\verb\\*([^]).*?\\4|\\\\verb([^*a-zA-Z]).*?\\5" + ("|" + controlWordWhitespaceRegexString) + ("|" + controlSymbolRegexString + ")");
/** Main Lexer class */
var Lexer = class {
	constructor(input, settings) {
		this.input = input;
		this.settings = settings;
		this.tokenRegex = new RegExp(tokenRegexString, "g");
		this.catcodes = {
			"%": 14,
			"~": 13
		};
	}
	setCatcode(char, code) {
		this.catcodes[char] = code;
	}
	/**
	* This function lexes a single token.
	*/
	lex() {
		var input = this.input;
		var pos = this.tokenRegex.lastIndex;
		if (pos === input.length) return new Token("EOF", new SourceLocation(this, pos, pos));
		var match = this.tokenRegex.exec(input);
		if (match === null || match.index !== pos) throw new ParseError("Unexpected character: '" + input[pos] + "'", new Token(input[pos], new SourceLocation(this, pos, pos + 1)));
		var text = match[6] || match[3] || (match[2] ? "\\ " : " ");
		if (this.catcodes[text] === 14) {
			var nlIndex = input.indexOf("\n", this.tokenRegex.lastIndex);
			if (nlIndex === -1) {
				this.tokenRegex.lastIndex = input.length;
				this.settings.reportNonstrict("commentAtEnd", "% comment has no terminating newline; LaTeX would fail because of commenting the end of math mode (e.g. $)");
			} else this.tokenRegex.lastIndex = nlIndex + 1;
			return this.lex();
		}
		return new Token(text, new SourceLocation(this, pos, this.tokenRegex.lastIndex));
	}
};
/**
* A `Namespace` refers to a space of nameable things like macros or lengths,
* which can be `set` either globally or local to a nested group, using an
* undo stack similar to how TeX implements this functionality.
* Performance-wise, `get` and local `set` take constant time, while global
* `set` takes time proportional to the depth of group nesting.
*/
var Namespace = class {
	/**
	* Both arguments are optional.  The first argument is an object of
	* built-in mappings which never change.  The second argument is an object
	* of initial (global-level) mappings, which will constantly change
	* according to any global/top-level `set`s done.
	*/
	constructor(builtins, globalMacros) {
		if (builtins === void 0) builtins = {};
		if (globalMacros === void 0) globalMacros = {};
		this.current = globalMacros;
		this.builtins = builtins;
		this.undefStack = [];
	}
	/**
	* Start a new nested group, affecting future local `set`s.
	*/
	beginGroup() {
		this.undefStack.push({});
	}
	/**
	* End current nested group, restoring values before the group began.
	*/
	endGroup() {
		if (this.undefStack.length === 0) throw new ParseError("Unbalanced namespace destruction: attempt to pop global namespace; please report this as a bug");
		var undefs = this.undefStack.pop();
		for (var undef in undefs) if (undefs.hasOwnProperty(undef)) if (undefs[undef] == null) delete this.current[undef];
		else this.current[undef] = undefs[undef];
	}
	/**
	* Ends all currently nested groups (if any), restoring values before the
	* groups began.  Useful in case of an error in the middle of parsing.
	*/
	endGroups() {
		while (this.undefStack.length > 0) this.endGroup();
	}
	/**
	* Detect whether `name` has a definition.  Equivalent to
	* `get(name) != null`.
	*/
	has(name) {
		return this.current.hasOwnProperty(name) || this.builtins.hasOwnProperty(name);
	}
	/**
	* Get the current value of a name, or `undefined` if there is no value.
	*
	* Note: Do not use `if (namespace.get(...))` to detect whether a macro
	* is defined, as the definition may be the empty string which evaluates
	* to `false` in JavaScript.  Use `if (namespace.get(...) != null)` or
	* `if (namespace.has(...))`.
	*/
	get(name) {
		if (this.current.hasOwnProperty(name)) return this.current[name];
		else return this.builtins[name];
	}
	/**
	* Set the current value of a name, and optionally set it globally too.
	* Local set() sets the current value and (when appropriate) adds an undo
	* operation to the undo stack.  Global set() may change the undo
	* operation at every level, so takes time linear in their number.
	* A value of undefined means to delete existing definitions.
	*/
	set(name, value, global) {
		if (global === void 0) global = false;
		if (global) {
			for (var i = 0; i < this.undefStack.length; i++) delete this.undefStack[i][name];
			if (this.undefStack.length > 0) this.undefStack[this.undefStack.length - 1][name] = value;
		} else {
			var top = this.undefStack[this.undefStack.length - 1];
			if (top && !top.hasOwnProperty(name)) top[name] = this.current[name];
		}
		if (value == null) delete this.current[name];
		else this.current[name] = value;
	}
};
/**
* Predefined macros for KaTeX.
* This can be used to define some commands in terms of others.
*/
var macros = _macros;
defineMacro("\\noexpand", function(context) {
	var t = context.popToken();
	if (context.isExpandable(t.text)) {
		t.noexpand = true;
		t.treatAsRelax = true;
	}
	return {
		tokens: [t],
		numArgs: 0
	};
});
defineMacro("\\expandafter", function(context) {
	var t = context.popToken();
	context.expandOnce(true);
	return {
		tokens: [t],
		numArgs: 0
	};
});
defineMacro("\\@firstoftwo", function(context) {
	return {
		tokens: context.consumeArgs(2)[0],
		numArgs: 0
	};
});
defineMacro("\\@secondoftwo", function(context) {
	return {
		tokens: context.consumeArgs(2)[1],
		numArgs: 0
	};
});
defineMacro("\\@ifnextchar", function(context) {
	var args = context.consumeArgs(3);
	context.consumeSpaces();
	var nextToken = context.future();
	if (args[0].length === 1 && args[0][0].text === nextToken.text) return {
		tokens: args[1],
		numArgs: 0
	};
	else return {
		tokens: args[2],
		numArgs: 0
	};
});
defineMacro("\\@ifstar", "\\@ifnextchar *{\\@firstoftwo{#1}}");
defineMacro("\\TextOrMath", function(context) {
	var args = context.consumeArgs(2);
	if (context.mode === "text") return {
		tokens: args[0],
		numArgs: 0
	};
	else return {
		tokens: args[1],
		numArgs: 0
	};
});
var digitToNumber = {
	"0": 0,
	"1": 1,
	"2": 2,
	"3": 3,
	"4": 4,
	"5": 5,
	"6": 6,
	"7": 7,
	"8": 8,
	"9": 9,
	"a": 10,
	"A": 10,
	"b": 11,
	"B": 11,
	"c": 12,
	"C": 12,
	"d": 13,
	"D": 13,
	"e": 14,
	"E": 14,
	"f": 15,
	"F": 15
};
defineMacro("\\char", function(context) {
	var token = context.popToken();
	var base;
	var number = 0;
	if (token.text === "'") {
		base = 8;
		token = context.popToken();
	} else if (token.text === "\"") {
		base = 16;
		token = context.popToken();
	} else if (token.text === "`") {
		token = context.popToken();
		if (token.text[0] === "\\") number = token.text.charCodeAt(1);
		else if (token.text === "EOF") throw new ParseError("\\char` missing argument");
		else number = token.text.charCodeAt(0);
	} else base = 10;
	if (base) {
		number = digitToNumber[token.text];
		if (number == null || number >= base) throw new ParseError("Invalid base-" + base + " digit " + token.text);
		var digit;
		while ((digit = digitToNumber[context.future().text]) != null && digit < base) {
			number *= base;
			number += digit;
			context.popToken();
		}
	}
	return "\\@char{" + number + "}";
});
var newcommand = (context, existsOK, nonexistsOK, skipIfExists) => {
	var arg = context.consumeArg().tokens;
	if (arg.length !== 1) throw new ParseError("\\newcommand's first argument must be a macro name");
	var name = arg[0].text;
	var exists = context.isDefined(name);
	if (exists && !existsOK) throw new ParseError("\\newcommand{" + name + "} attempting to redefine " + (name + "; use \\renewcommand"));
	if (!exists && !nonexistsOK) throw new ParseError("\\renewcommand{" + name + "} when command " + name + " does not yet exist; use \\newcommand");
	var numArgs = 0;
	arg = context.consumeArg().tokens;
	if (arg.length === 1 && arg[0].text === "[") {
		var argText = "";
		var token = context.expandNextToken();
		while (token.text !== "]" && token.text !== "EOF") {
			argText += token.text;
			token = context.expandNextToken();
		}
		if (!argText.match(/^\s*[0-9]+\s*$/)) throw new ParseError("Invalid number of arguments: " + argText);
		numArgs = parseInt(argText);
		arg = context.consumeArg().tokens;
	}
	if (!(exists && skipIfExists)) context.macros.set(name, {
		tokens: arg,
		numArgs
	});
	return "";
};
defineMacro("\\newcommand", (context) => newcommand(context, false, true, false));
defineMacro("\\renewcommand", (context) => newcommand(context, true, false, false));
defineMacro("\\providecommand", (context) => newcommand(context, true, true, true));
defineMacro("\\message", (context) => {
	var arg = context.consumeArgs(1)[0];
	console.log(arg.reverse().map((token) => token.text).join(""));
	return "";
});
defineMacro("\\errmessage", (context) => {
	var arg = context.consumeArgs(1)[0];
	console.error(arg.reverse().map((token) => token.text).join(""));
	return "";
});
defineMacro("\\show", (context) => {
	var tok = context.popToken();
	var name = tok.text;
	console.log(tok, context.macros.get(name), functions[name], symbols.math[name], symbols.text[name]);
	return "";
});
defineMacro("\\bgroup", "{");
defineMacro("\\egroup", "}");
defineMacro("~", "\\nobreakspace");
defineMacro("\\lq", "`");
defineMacro("\\rq", "'");
defineMacro("\\aa", "\\r a");
defineMacro("\\AA", "\\r A");
defineMacro("\\textcopyright", "\\html@mathml{\\textcircled{c}}{\\char`©}");
defineMacro("\\copyright", "\\TextOrMath{\\textcopyright}{\\text{\\textcopyright}}");
defineMacro("\\textregistered", "\\html@mathml{\\textcircled{\\scriptsize R}}{\\char`®}");
defineMacro("ℬ", "\\mathscr{B}");
defineMacro("ℰ", "\\mathscr{E}");
defineMacro("ℱ", "\\mathscr{F}");
defineMacro("ℋ", "\\mathscr{H}");
defineMacro("ℐ", "\\mathscr{I}");
defineMacro("ℒ", "\\mathscr{L}");
defineMacro("ℳ", "\\mathscr{M}");
defineMacro("ℛ", "\\mathscr{R}");
defineMacro("ℭ", "\\mathfrak{C}");
defineMacro("ℌ", "\\mathfrak{H}");
defineMacro("ℨ", "\\mathfrak{Z}");
defineMacro("\\Bbbk", "\\Bbb{k}");
defineMacro("\\llap", "\\mathllap{\\textrm{#1}}");
defineMacro("\\rlap", "\\mathrlap{\\textrm{#1}}");
defineMacro("\\clap", "\\mathclap{\\textrm{#1}}");
defineMacro("\\mathstrut", "\\vphantom{(}");
defineMacro("\\underbar", "\\underline{\\text{#1}}");
defineMacro("\\not", "\\html@mathml{\\mathrel{\\mathrlap\\@not}\\nobreak}{\\char\"338}");
defineMacro("\\neq", "\\html@mathml{\\mathrel{\\not=}}{\\mathrel{\\char`≠}}");
defineMacro("\\ne", "\\neq");
defineMacro("≠", "\\neq");
defineMacro("\\notin", "\\html@mathml{\\mathrel{{\\in}\\mathllap{/\\mskip1mu}}}{\\mathrel{\\char`∉}}");
defineMacro("∉", "\\notin");
defineMacro("≘", "\\html@mathml{\\mathrel{=\\kern{-1em}\\raisebox{0.4em}{$\\scriptsize\\frown$}}}{\\mathrel{\\char`≘}}");
defineMacro("≙", "\\html@mathml{\\stackrel{\\tiny\\wedge}{=}}{\\mathrel{\\char`≘}}");
defineMacro("≚", "\\html@mathml{\\stackrel{\\tiny\\vee}{=}}{\\mathrel{\\char`≚}}");
defineMacro("≛", "\\html@mathml{\\stackrel{\\scriptsize\\star}{=}}{\\mathrel{\\char`≛}}");
defineMacro("≝", "\\html@mathml{\\stackrel{\\tiny\\mathrm{def}}{=}}{\\mathrel{\\char`≝}}");
defineMacro("≞", "\\html@mathml{\\stackrel{\\tiny\\mathrm{m}}{=}}{\\mathrel{\\char`≞}}");
defineMacro("≟", "\\html@mathml{\\stackrel{\\tiny?}{=}}{\\mathrel{\\char`≟}}");
defineMacro("⟂", "\\perp");
defineMacro("‼", "\\mathclose{!\\mkern-0.8mu!}");
defineMacro("∌", "\\notni");
defineMacro("⌜", "\\ulcorner");
defineMacro("⌝", "\\urcorner");
defineMacro("⌞", "\\llcorner");
defineMacro("⌟", "\\lrcorner");
defineMacro("©", "\\copyright");
defineMacro("®", "\\textregistered");
defineMacro("\\ulcorner", "\\html@mathml{\\@ulcorner}{\\mathop{\\char\"231c}}");
defineMacro("\\urcorner", "\\html@mathml{\\@urcorner}{\\mathop{\\char\"231d}}");
defineMacro("\\llcorner", "\\html@mathml{\\@llcorner}{\\mathop{\\char\"231e}}");
defineMacro("\\lrcorner", "\\html@mathml{\\@lrcorner}{\\mathop{\\char\"231f}}");
defineMacro("\\vdots", "{\\varvdots\\rule{0pt}{15pt}}");
defineMacro("⋮", "\\vdots");
defineMacro("\\varGamma", "\\mathit{\\Gamma}");
defineMacro("\\varDelta", "\\mathit{\\Delta}");
defineMacro("\\varTheta", "\\mathit{\\Theta}");
defineMacro("\\varLambda", "\\mathit{\\Lambda}");
defineMacro("\\varXi", "\\mathit{\\Xi}");
defineMacro("\\varPi", "\\mathit{\\Pi}");
defineMacro("\\varSigma", "\\mathit{\\Sigma}");
defineMacro("\\varUpsilon", "\\mathit{\\Upsilon}");
defineMacro("\\varPhi", "\\mathit{\\Phi}");
defineMacro("\\varPsi", "\\mathit{\\Psi}");
defineMacro("\\varOmega", "\\mathit{\\Omega}");
defineMacro("\\substack", "\\begin{subarray}{c}#1\\end{subarray}");
defineMacro("\\colon", "\\nobreak\\mskip2mu\\mathpunct{}\\mathchoice{\\mkern-3mu}{\\mkern-3mu}{}{}{:}\\mskip6mu\\relax");
defineMacro("\\boxed", "\\fbox{$\\displaystyle{#1}$}");
defineMacro("\\iff", "\\DOTSB\\;\\Longleftrightarrow\\;");
defineMacro("\\implies", "\\DOTSB\\;\\Longrightarrow\\;");
defineMacro("\\impliedby", "\\DOTSB\\;\\Longleftarrow\\;");
defineMacro("\\dddot", "{\\overset{\\raisebox{-0.1ex}{\\normalsize ...}}{#1}}");
defineMacro("\\ddddot", "{\\overset{\\raisebox{-0.1ex}{\\normalsize ....}}{#1}}");
var dotsByToken = {
	",": "\\dotsc",
	"\\not": "\\dotsb",
	"+": "\\dotsb",
	"=": "\\dotsb",
	"<": "\\dotsb",
	">": "\\dotsb",
	"-": "\\dotsb",
	"*": "\\dotsb",
	":": "\\dotsb",
	"\\DOTSB": "\\dotsb",
	"\\coprod": "\\dotsb",
	"\\bigvee": "\\dotsb",
	"\\bigwedge": "\\dotsb",
	"\\biguplus": "\\dotsb",
	"\\bigcap": "\\dotsb",
	"\\bigcup": "\\dotsb",
	"\\prod": "\\dotsb",
	"\\sum": "\\dotsb",
	"\\bigotimes": "\\dotsb",
	"\\bigoplus": "\\dotsb",
	"\\bigodot": "\\dotsb",
	"\\bigsqcup": "\\dotsb",
	"\\And": "\\dotsb",
	"\\longrightarrow": "\\dotsb",
	"\\Longrightarrow": "\\dotsb",
	"\\longleftarrow": "\\dotsb",
	"\\Longleftarrow": "\\dotsb",
	"\\longleftrightarrow": "\\dotsb",
	"\\Longleftrightarrow": "\\dotsb",
	"\\mapsto": "\\dotsb",
	"\\longmapsto": "\\dotsb",
	"\\hookrightarrow": "\\dotsb",
	"\\doteq": "\\dotsb",
	"\\mathbin": "\\dotsb",
	"\\mathrel": "\\dotsb",
	"\\relbar": "\\dotsb",
	"\\Relbar": "\\dotsb",
	"\\xrightarrow": "\\dotsb",
	"\\xleftarrow": "\\dotsb",
	"\\DOTSI": "\\dotsi",
	"\\int": "\\dotsi",
	"\\oint": "\\dotsi",
	"\\iint": "\\dotsi",
	"\\iiint": "\\dotsi",
	"\\iiiint": "\\dotsi",
	"\\idotsint": "\\dotsi",
	"\\DOTSX": "\\dotsx"
};
var dotsbGroups = new Set(["bin", "rel"]);
defineMacro("\\dots", function(context) {
	var thedots = "\\dotso";
	var next = context.expandAfterFuture().text;
	if (next in dotsByToken) thedots = dotsByToken[next];
	else if (next.slice(0, 4) === "\\not") thedots = "\\dotsb";
	else if (next in symbols.math) {
		if (dotsbGroups.has(symbols.math[next].group)) thedots = "\\dotsb";
	}
	return thedots;
});
var spaceAfterDots = {
	")": true,
	"]": true,
	"\\rbrack": true,
	"\\}": true,
	"\\rbrace": true,
	"\\rangle": true,
	"\\rceil": true,
	"\\rfloor": true,
	"\\rgroup": true,
	"\\rmoustache": true,
	"\\right": true,
	"\\bigr": true,
	"\\biggr": true,
	"\\Bigr": true,
	"\\Biggr": true,
	"$": true,
	";": true,
	".": true,
	",": true
};
defineMacro("\\dotso", function(context) {
	if (context.future().text in spaceAfterDots) return "\\ldots\\,";
	else return "\\ldots";
});
defineMacro("\\dotsc", function(context) {
	var next = context.future().text;
	if (next in spaceAfterDots && next !== ",") return "\\ldots\\,";
	else return "\\ldots";
});
defineMacro("\\cdots", function(context) {
	if (context.future().text in spaceAfterDots) return "\\@cdots\\,";
	else return "\\@cdots";
});
defineMacro("\\dotsb", "\\cdots");
defineMacro("\\dotsm", "\\cdots");
defineMacro("\\dotsi", "\\!\\cdots");
defineMacro("\\dotsx", "\\ldots\\,");
defineMacro("\\DOTSI", "\\relax");
defineMacro("\\DOTSB", "\\relax");
defineMacro("\\DOTSX", "\\relax");
defineMacro("\\tmspace", "\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax");
defineMacro("\\,", "\\tmspace+{3mu}{.1667em}");
defineMacro("\\thinspace", "\\,");
defineMacro("\\>", "\\mskip{4mu}");
defineMacro("\\:", "\\tmspace+{4mu}{.2222em}");
defineMacro("\\medspace", "\\:");
defineMacro("\\;", "\\tmspace+{5mu}{.2777em}");
defineMacro("\\thickspace", "\\;");
defineMacro("\\!", "\\tmspace-{3mu}{.1667em}");
defineMacro("\\negthinspace", "\\!");
defineMacro("\\negmedspace", "\\tmspace-{4mu}{.2222em}");
defineMacro("\\negthickspace", "\\tmspace-{5mu}{.277em}");
defineMacro("\\enspace", "\\kern.5em ");
defineMacro("\\enskip", "\\hskip.5em\\relax");
defineMacro("\\quad", "\\hskip1em\\relax");
defineMacro("\\qquad", "\\hskip2em\\relax");
defineMacro("\\tag", "\\@ifstar\\tag@literal\\tag@paren");
defineMacro("\\tag@paren", "\\tag@literal{({#1})}");
defineMacro("\\tag@literal", (context) => {
	if (context.macros.get("\\df@tag")) throw new ParseError("Multiple \\tag");
	return "\\gdef\\df@tag{\\text{#1}}";
});
defineMacro("\\bmod", "\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}\\mathbin{\\rm mod}\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}");
defineMacro("\\pod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)");
defineMacro("\\pmod", "\\pod{{\\rm mod}\\mkern6mu#1}");
defineMacro("\\mod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}{\\rm mod}\\,\\,#1");
defineMacro("\\newline", "\\\\\\relax");
defineMacro("\\TeX", "\\textrm{\\html@mathml{T\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125emX}{TeX}}");
var latexRaiseA = makeEm(fontMetricsData["Main-Regular"]["T".charCodeAt(0)][1] - .7 * fontMetricsData["Main-Regular"]["A".charCodeAt(0)][1]);
defineMacro("\\LaTeX", "\\textrm{\\html@mathml{" + ("L\\kern-.36em\\raisebox{" + latexRaiseA + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{LaTeX}}");
defineMacro("\\KaTeX", "\\textrm{\\html@mathml{" + ("K\\kern-.17em\\raisebox{" + latexRaiseA + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{KaTeX}}");
defineMacro("\\hspace", "\\@ifstar\\@hspacer\\@hspace");
defineMacro("\\@hspace", "\\hskip #1\\relax");
defineMacro("\\@hspacer", "\\rule{0pt}{0pt}\\hskip #1\\relax");
defineMacro("\\ordinarycolon", ":");
defineMacro("\\vcentcolon", "\\mathrel{\\mathop\\ordinarycolon}");
defineMacro("\\dblcolon", "\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-.9mu}\\vcentcolon}}{\\mathop{\\char\"2237}}");
defineMacro("\\coloneqq", "\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char\"2254}}");
defineMacro("\\Coloneqq", "\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char\"2237\\char\"3d}}");
defineMacro("\\coloneq", "\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char\"3a\\char\"2212}}");
defineMacro("\\Coloneq", "\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char\"2237\\char\"2212}}");
defineMacro("\\eqqcolon", "\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char\"2255}}");
defineMacro("\\Eqqcolon", "\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char\"3d\\char\"2237}}");
defineMacro("\\eqcolon", "\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char\"2239}}");
defineMacro("\\Eqcolon", "\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char\"2212\\char\"2237}}");
defineMacro("\\colonapprox", "\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char\"3a\\char\"2248}}");
defineMacro("\\Colonapprox", "\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char\"2237\\char\"2248}}");
defineMacro("\\colonsim", "\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char\"3a\\char\"223c}}");
defineMacro("\\Colonsim", "\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char\"2237\\char\"223c}}");
defineMacro("∷", "\\dblcolon");
defineMacro("∹", "\\eqcolon");
defineMacro("≔", "\\coloneqq");
defineMacro("≕", "\\eqqcolon");
defineMacro("⩴", "\\Coloneqq");
defineMacro("\\ratio", "\\vcentcolon");
defineMacro("\\coloncolon", "\\dblcolon");
defineMacro("\\colonequals", "\\coloneqq");
defineMacro("\\coloncolonequals", "\\Coloneqq");
defineMacro("\\equalscolon", "\\eqqcolon");
defineMacro("\\equalscoloncolon", "\\Eqqcolon");
defineMacro("\\colonminus", "\\coloneq");
defineMacro("\\coloncolonminus", "\\Coloneq");
defineMacro("\\minuscolon", "\\eqcolon");
defineMacro("\\minuscoloncolon", "\\Eqcolon");
defineMacro("\\coloncolonapprox", "\\Colonapprox");
defineMacro("\\coloncolonsim", "\\Colonsim");
defineMacro("\\simcolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
defineMacro("\\simcoloncolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}");
defineMacro("\\approxcolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
defineMacro("\\approxcoloncolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}");
defineMacro("\\notni", "\\html@mathml{\\not\\ni}{\\mathrel{\\char`∌}}");
defineMacro("\\limsup", "\\DOTSB\\operatorname*{lim\\,sup}");
defineMacro("\\liminf", "\\DOTSB\\operatorname*{lim\\,inf}");
defineMacro("\\injlim", "\\DOTSB\\operatorname*{inj\\,lim}");
defineMacro("\\projlim", "\\DOTSB\\operatorname*{proj\\,lim}");
defineMacro("\\varlimsup", "\\DOTSB\\operatorname*{\\overline{lim}}");
defineMacro("\\varliminf", "\\DOTSB\\operatorname*{\\underline{lim}}");
defineMacro("\\varinjlim", "\\DOTSB\\operatorname*{\\underrightarrow{lim}}");
defineMacro("\\varprojlim", "\\DOTSB\\operatorname*{\\underleftarrow{lim}}");
defineMacro("\\gvertneqq", "\\html@mathml{\\@gvertneqq}{≩}");
defineMacro("\\lvertneqq", "\\html@mathml{\\@lvertneqq}{≨}");
defineMacro("\\ngeqq", "\\html@mathml{\\@ngeqq}{≱}");
defineMacro("\\ngeqslant", "\\html@mathml{\\@ngeqslant}{≱}");
defineMacro("\\nleqq", "\\html@mathml{\\@nleqq}{≰}");
defineMacro("\\nleqslant", "\\html@mathml{\\@nleqslant}{≰}");
defineMacro("\\nshortmid", "\\html@mathml{\\@nshortmid}{∤}");
defineMacro("\\nshortparallel", "\\html@mathml{\\@nshortparallel}{∦}");
defineMacro("\\nsubseteqq", "\\html@mathml{\\@nsubseteqq}{⊈}");
defineMacro("\\nsupseteqq", "\\html@mathml{\\@nsupseteqq}{⊉}");
defineMacro("\\varsubsetneq", "\\html@mathml{\\@varsubsetneq}{⊊}");
defineMacro("\\varsubsetneqq", "\\html@mathml{\\@varsubsetneqq}{⫋}");
defineMacro("\\varsupsetneq", "\\html@mathml{\\@varsupsetneq}{⊋}");
defineMacro("\\varsupsetneqq", "\\html@mathml{\\@varsupsetneqq}{⫌}");
defineMacro("\\imath", "\\html@mathml{\\@imath}{ı}");
defineMacro("\\jmath", "\\html@mathml{\\@jmath}{ȷ}");
defineMacro("\\llbracket", "\\html@mathml{\\mathopen{[\\mkern-3.2mu[}}{\\mathopen{\\char`⟦}}");
defineMacro("\\rrbracket", "\\html@mathml{\\mathclose{]\\mkern-3.2mu]}}{\\mathclose{\\char`⟧}}");
defineMacro("⟦", "\\llbracket");
defineMacro("⟧", "\\rrbracket");
defineMacro("\\lBrace", "\\html@mathml{\\mathopen{\\{\\mkern-3.2mu[}}{\\mathopen{\\char`⦃}}");
defineMacro("\\rBrace", "\\html@mathml{\\mathclose{]\\mkern-3.2mu\\}}}{\\mathclose{\\char`⦄}}");
defineMacro("⦃", "\\lBrace");
defineMacro("⦄", "\\rBrace");
defineMacro("\\minuso", "\\mathbin{\\html@mathml{{\\mathrlap{\\mathchoice{\\kern{0.145em}}{\\kern{0.145em}}{\\kern{0.1015em}}{\\kern{0.0725em}}\\circ}{-}}}{\\char`⦵}}");
defineMacro("⦵", "\\minuso");
defineMacro("\\darr", "\\downarrow");
defineMacro("\\dArr", "\\Downarrow");
defineMacro("\\Darr", "\\Downarrow");
defineMacro("\\lang", "\\langle");
defineMacro("\\rang", "\\rangle");
defineMacro("\\uarr", "\\uparrow");
defineMacro("\\uArr", "\\Uparrow");
defineMacro("\\Uarr", "\\Uparrow");
defineMacro("\\N", "\\mathbb{N}");
defineMacro("\\R", "\\mathbb{R}");
defineMacro("\\Z", "\\mathbb{Z}");
defineMacro("\\alef", "\\aleph");
defineMacro("\\alefsym", "\\aleph");
defineMacro("\\Alpha", "\\mathrm{A}");
defineMacro("\\Beta", "\\mathrm{B}");
defineMacro("\\bull", "\\bullet");
defineMacro("\\Chi", "\\mathrm{X}");
defineMacro("\\clubs", "\\clubsuit");
defineMacro("\\cnums", "\\mathbb{C}");
defineMacro("\\Complex", "\\mathbb{C}");
defineMacro("\\Dagger", "\\ddagger");
defineMacro("\\diamonds", "\\diamondsuit");
defineMacro("\\empty", "\\emptyset");
defineMacro("\\Epsilon", "\\mathrm{E}");
defineMacro("\\Eta", "\\mathrm{H}");
defineMacro("\\exist", "\\exists");
defineMacro("\\harr", "\\leftrightarrow");
defineMacro("\\hArr", "\\Leftrightarrow");
defineMacro("\\Harr", "\\Leftrightarrow");
defineMacro("\\hearts", "\\heartsuit");
defineMacro("\\image", "\\Im");
defineMacro("\\infin", "\\infty");
defineMacro("\\Iota", "\\mathrm{I}");
defineMacro("\\isin", "\\in");
defineMacro("\\Kappa", "\\mathrm{K}");
defineMacro("\\larr", "\\leftarrow");
defineMacro("\\lArr", "\\Leftarrow");
defineMacro("\\Larr", "\\Leftarrow");
defineMacro("\\lrarr", "\\leftrightarrow");
defineMacro("\\lrArr", "\\Leftrightarrow");
defineMacro("\\Lrarr", "\\Leftrightarrow");
defineMacro("\\Mu", "\\mathrm{M}");
defineMacro("\\natnums", "\\mathbb{N}");
defineMacro("\\Nu", "\\mathrm{N}");
defineMacro("\\Omicron", "\\mathrm{O}");
defineMacro("\\plusmn", "\\pm");
defineMacro("\\rarr", "\\rightarrow");
defineMacro("\\rArr", "\\Rightarrow");
defineMacro("\\Rarr", "\\Rightarrow");
defineMacro("\\real", "\\Re");
defineMacro("\\reals", "\\mathbb{R}");
defineMacro("\\Reals", "\\mathbb{R}");
defineMacro("\\Rho", "\\mathrm{P}");
defineMacro("\\sdot", "\\cdot");
defineMacro("\\sect", "\\S");
defineMacro("\\spades", "\\spadesuit");
defineMacro("\\sub", "\\subset");
defineMacro("\\sube", "\\subseteq");
defineMacro("\\supe", "\\supseteq");
defineMacro("\\Tau", "\\mathrm{T}");
defineMacro("\\thetasym", "\\vartheta");
defineMacro("\\weierp", "\\wp");
defineMacro("\\Zeta", "\\mathrm{Z}");
defineMacro("\\argmin", "\\DOTSB\\operatorname*{arg\\,min}");
defineMacro("\\argmax", "\\DOTSB\\operatorname*{arg\\,max}");
defineMacro("\\plim", "\\DOTSB\\mathop{\\operatorname{plim}}\\limits");
defineMacro("\\bra", "\\mathinner{\\langle{#1}|}");
defineMacro("\\ket", "\\mathinner{|{#1}\\rangle}");
defineMacro("\\braket", "\\mathinner{\\langle{#1}\\rangle}");
defineMacro("\\Bra", "\\left\\langle#1\\right|");
defineMacro("\\Ket", "\\left|#1\\right\\rangle");
var braketHelper = (one) => (context) => {
	var left = context.consumeArg().tokens;
	var middle = context.consumeArg().tokens;
	var middleDouble = context.consumeArg().tokens;
	var right = context.consumeArg().tokens;
	var oldMiddle = context.macros.get("|");
	var oldMiddleDouble = context.macros.get("\\|");
	context.macros.beginGroup();
	var midMacro = (double) => (context) => {
		if (one) {
			context.macros.set("|", oldMiddle);
			if (middleDouble.length) context.macros.set("\\|", oldMiddleDouble);
		}
		var doubled = double;
		if (!double && middleDouble.length) {
			if (context.future().text === "|") {
				context.popToken();
				doubled = true;
			}
		}
		return {
			tokens: doubled ? middleDouble : middle,
			numArgs: 0
		};
	};
	context.macros.set("|", midMacro(false));
	if (middleDouble.length) context.macros.set("\\|", midMacro(true));
	var arg = context.consumeArg().tokens;
	var expanded = context.expandTokens([
		...right,
		...arg,
		...left
	]);
	context.macros.endGroup();
	return {
		tokens: expanded.reverse(),
		numArgs: 0
	};
};
defineMacro("\\bra@ket", braketHelper(false));
defineMacro("\\bra@set", braketHelper(true));
defineMacro("\\Braket", "\\bra@ket{\\left\\langle}{\\,\\middle\\vert\\,}{\\,\\middle\\vert\\,}{\\right\\rangle}");
defineMacro("\\Set", "\\bra@set{\\left\\{\\:}{\\;\\middle\\vert\\;}{\\;\\middle\\Vert\\;}{\\:\\right\\}}");
defineMacro("\\set", "\\bra@set{\\{\\,}{\\mid}{}{\\,\\}}");
defineMacro("\\angln", "{\\angl n}");
defineMacro("\\blue", "\\textcolor{##6495ed}{#1}");
defineMacro("\\orange", "\\textcolor{##ffa500}{#1}");
defineMacro("\\pink", "\\textcolor{##ff00af}{#1}");
defineMacro("\\red", "\\textcolor{##df0030}{#1}");
defineMacro("\\green", "\\textcolor{##28ae7b}{#1}");
defineMacro("\\gray", "\\textcolor{gray}{#1}");
defineMacro("\\purple", "\\textcolor{##9d38bd}{#1}");
defineMacro("\\blueA", "\\textcolor{##ccfaff}{#1}");
defineMacro("\\blueB", "\\textcolor{##80f6ff}{#1}");
defineMacro("\\blueC", "\\textcolor{##63d9ea}{#1}");
defineMacro("\\blueD", "\\textcolor{##11accd}{#1}");
defineMacro("\\blueE", "\\textcolor{##0c7f99}{#1}");
defineMacro("\\tealA", "\\textcolor{##94fff5}{#1}");
defineMacro("\\tealB", "\\textcolor{##26edd5}{#1}");
defineMacro("\\tealC", "\\textcolor{##01d1c1}{#1}");
defineMacro("\\tealD", "\\textcolor{##01a995}{#1}");
defineMacro("\\tealE", "\\textcolor{##208170}{#1}");
defineMacro("\\greenA", "\\textcolor{##b6ffb0}{#1}");
defineMacro("\\greenB", "\\textcolor{##8af281}{#1}");
defineMacro("\\greenC", "\\textcolor{##74cf70}{#1}");
defineMacro("\\greenD", "\\textcolor{##1fab54}{#1}");
defineMacro("\\greenE", "\\textcolor{##0d923f}{#1}");
defineMacro("\\goldA", "\\textcolor{##ffd0a9}{#1}");
defineMacro("\\goldB", "\\textcolor{##ffbb71}{#1}");
defineMacro("\\goldC", "\\textcolor{##ff9c39}{#1}");
defineMacro("\\goldD", "\\textcolor{##e07d10}{#1}");
defineMacro("\\goldE", "\\textcolor{##a75a05}{#1}");
defineMacro("\\redA", "\\textcolor{##fca9a9}{#1}");
defineMacro("\\redB", "\\textcolor{##ff8482}{#1}");
defineMacro("\\redC", "\\textcolor{##f9685d}{#1}");
defineMacro("\\redD", "\\textcolor{##e84d39}{#1}");
defineMacro("\\redE", "\\textcolor{##bc2612}{#1}");
defineMacro("\\maroonA", "\\textcolor{##ffbde0}{#1}");
defineMacro("\\maroonB", "\\textcolor{##ff92c6}{#1}");
defineMacro("\\maroonC", "\\textcolor{##ed5fa6}{#1}");
defineMacro("\\maroonD", "\\textcolor{##ca337c}{#1}");
defineMacro("\\maroonE", "\\textcolor{##9e034e}{#1}");
defineMacro("\\purpleA", "\\textcolor{##ddd7ff}{#1}");
defineMacro("\\purpleB", "\\textcolor{##c6b9fc}{#1}");
defineMacro("\\purpleC", "\\textcolor{##aa87ff}{#1}");
defineMacro("\\purpleD", "\\textcolor{##7854ab}{#1}");
defineMacro("\\purpleE", "\\textcolor{##543b78}{#1}");
defineMacro("\\mintA", "\\textcolor{##f5f9e8}{#1}");
defineMacro("\\mintB", "\\textcolor{##edf2df}{#1}");
defineMacro("\\mintC", "\\textcolor{##e0e5cc}{#1}");
defineMacro("\\grayA", "\\textcolor{##f6f7f7}{#1}");
defineMacro("\\grayB", "\\textcolor{##f0f1f2}{#1}");
defineMacro("\\grayC", "\\textcolor{##e3e5e6}{#1}");
defineMacro("\\grayD", "\\textcolor{##d6d8da}{#1}");
defineMacro("\\grayE", "\\textcolor{##babec2}{#1}");
defineMacro("\\grayF", "\\textcolor{##888d93}{#1}");
defineMacro("\\grayG", "\\textcolor{##626569}{#1}");
defineMacro("\\grayH", "\\textcolor{##3b3e40}{#1}");
defineMacro("\\grayI", "\\textcolor{##21242c}{#1}");
defineMacro("\\kaBlue", "\\textcolor{##314453}{#1}");
defineMacro("\\kaGreen", "\\textcolor{##71B307}{#1}");
/**
* This file contains the “gullet” where macros are expanded
* until only non-macro tokens remain.
*/
var implicitCommands = {
	"^": true,
	"_": true,
	"\\limits": true,
	"\\nolimits": true
};
var MacroExpander = class {
	constructor(input, settings, mode) {
		this.settings = settings;
		this.expansionCount = 0;
		this.feed(input);
		this.macros = new Namespace(macros, settings.macros);
		this.mode = mode;
		this.stack = [];
	}
	/**
	* Feed a new input string to the same MacroExpander
	* (with existing macros etc.).
	*/
	feed(input) {
		this.lexer = new Lexer(input, this.settings);
	}
	/**
	* Switches between "text" and "math" modes.
	*/
	switchMode(newMode) {
		this.mode = newMode;
	}
	/**
	* Start a new group nesting within all namespaces.
	*/
	beginGroup() {
		this.macros.beginGroup();
	}
	/**
	* End current group nesting within all namespaces.
	*/
	endGroup() {
		this.macros.endGroup();
	}
	/**
	* Ends all currently nested groups (if any), restoring values before the
	* groups began.  Useful in case of an error in the middle of parsing.
	*/
	endGroups() {
		this.macros.endGroups();
	}
	/**
	* Returns the topmost token on the stack, without expanding it.
	* Similar in behavior to TeX's `\futurelet`.
	*/
	future() {
		if (this.stack.length === 0) this.pushToken(this.lexer.lex());
		return this.stack[this.stack.length - 1];
	}
	/**
	* Remove and return the next unexpanded token.
	*/
	popToken() {
		this.future();
		return this.stack.pop();
	}
	/**
	* Add a given token to the token stack.  In particular, this get be used
	* to put back a token returned from one of the other methods.
	*/
	pushToken(token) {
		this.stack.push(token);
	}
	/**
	* Append an array of tokens to the token stack.
	*/
	pushTokens(tokens) {
		this.stack.push(...tokens);
	}
	/**
	* Find an macro argument without expanding tokens and append the array of
	* tokens to the token stack. Uses Token as a container for the result.
	*/
	scanArgument(isOptional) {
		var start;
		var end;
		var tokens;
		if (isOptional) {
			this.consumeSpaces();
			if (this.future().text !== "[") return null;
			start = this.popToken();
			({tokens, end} = this.consumeArg(["]"]));
		} else ({tokens, start, end} = this.consumeArg());
		this.pushToken(new Token("EOF", end.loc));
		this.pushTokens(tokens);
		return new Token("", SourceLocation.range(start, end));
	}
	/**
	* Consume all following space tokens, without expansion.
	*/
	consumeSpaces() {
		for (;;) if (this.future().text === " ") this.stack.pop();
		else break;
	}
	/**
	* Consume an argument from the token stream, and return the resulting array
	* of tokens and start/end token.
	*/
	consumeArg(delims) {
		var tokens = [];
		var isDelimited = delims && delims.length > 0;
		if (!isDelimited) this.consumeSpaces();
		var start = this.future();
		var tok;
		var depth = 0;
		var match = 0;
		do {
			tok = this.popToken();
			tokens.push(tok);
			if (tok.text === "{") ++depth;
			else if (tok.text === "}") {
				--depth;
				if (depth === -1) throw new ParseError("Extra }", tok);
			} else if (tok.text === "EOF") throw new ParseError("Unexpected end of input in a macro argument, expected '" + (delims && isDelimited ? delims[match] : "}") + "'", tok);
			if (delims && isDelimited) if ((depth === 0 || depth === 1 && delims[match] === "{") && tok.text === delims[match]) {
				++match;
				if (match === delims.length) {
					tokens.splice(-match, match);
					break;
				}
			} else match = 0;
		} while (depth !== 0 || isDelimited);
		if (start.text === "{" && tokens[tokens.length - 1].text === "}") {
			tokens.pop();
			tokens.shift();
		}
		tokens.reverse();
		return {
			tokens,
			start,
			end: tok
		};
	}
	/**
	* Consume the specified number of (delimited) arguments from the token
	* stream and return the resulting array of arguments.
	*/
	consumeArgs(numArgs, delimiters) {
		if (delimiters) {
			if (delimiters.length !== numArgs + 1) throw new ParseError("The length of delimiters doesn't match the number of args!");
			var delims = delimiters[0];
			for (var i = 0; i < delims.length; i++) {
				var tok = this.popToken();
				if (delims[i] !== tok.text) throw new ParseError("Use of the macro doesn't match its definition", tok);
			}
		}
		var args = [];
		for (var _i = 0; _i < numArgs; _i++) args.push(this.consumeArg(delimiters && delimiters[_i + 1]).tokens);
		return args;
	}
	/**
	* Increment `expansionCount` by the specified amount.
	* Throw an error if it exceeds `maxExpand`.
	*/
	countExpansion(amount) {
		this.expansionCount += amount;
		if (this.expansionCount > this.settings.maxExpand) throw new ParseError("Too many expansions: infinite loop or need to increase maxExpand setting");
	}
	/**
	* Expand the next token only once if possible.
	*
	* If the token is expanded, the resulting tokens will be pushed onto
	* the stack in reverse order, and the number of such tokens will be
	* returned.  This number might be zero or positive.
	*
	* If not, the return value is `false`, and the next token remains at the
	* top of the stack.
	*
	* In either case, the next token will be on the top of the stack,
	* or the stack will be empty (in case of empty expansion
	* and no other tokens).
	*
	* Used to implement `expandAfterFuture` and `expandNextToken`.
	*
	* If expandableOnly, only expandable tokens are expanded and
	* an undefined control sequence results in an error.
	*/
	expandOnce(expandableOnly) {
		var topToken = this.popToken();
		var name = topToken.text;
		var expansion = !topToken.noexpand ? this._getExpansion(name) : null;
		if (expansion == null || expandableOnly && expansion.unexpandable) {
			if (expandableOnly && expansion == null && name[0] === "\\" && !this.isDefined(name)) throw new ParseError("Undefined control sequence: " + name);
			this.pushToken(topToken);
			return false;
		}
		this.countExpansion(1);
		var tokens = expansion.tokens;
		var args = this.consumeArgs(expansion.numArgs, expansion.delimiters);
		if (expansion.numArgs) {
			tokens = tokens.slice();
			for (var i = tokens.length - 1; i >= 0; --i) {
				var tok = tokens[i];
				if (tok.text === "#") {
					if (i === 0) throw new ParseError("Incomplete placeholder at end of macro body", tok);
					tok = tokens[--i];
					if (tok.text === "#") tokens.splice(i + 1, 1);
					else if (/^[1-9]$/.test(tok.text)) tokens.splice(i, 2, ...args[+tok.text - 1]);
					else throw new ParseError("Not a valid argument number", tok);
				}
			}
		}
		this.pushTokens(tokens);
		return tokens.length;
	}
	/**
	* Expand the next token only once (if possible), and return the resulting
	* top token on the stack (without removing anything from the stack).
	* Similar in behavior to TeX's `\expandafter\futurelet`.
	* Equivalent to expandOnce() followed by future().
	*/
	expandAfterFuture() {
		this.expandOnce();
		return this.future();
	}
	/**
	* Recursively expand first token, then return first non-expandable token.
	*/
	expandNextToken() {
		for (;;) if (this.expandOnce() === false) {
			var token = this.stack.pop();
			if (token.treatAsRelax) token.text = "\\relax";
			return token;
		}
	}
	/**
	* Fully expand the given macro name and return the resulting list of
	* tokens, or return `undefined` if no such macro is defined.
	*/
	expandMacro(name) {
		return this.macros.has(name) ? this.expandTokens([new Token(name)]) : void 0;
	}
	/**
	* Fully expand the given token stream and return the resulting list of
	* tokens.  Note that the input tokens are in reverse order, but the
	* output tokens are in forward order.
	*/
	expandTokens(tokens) {
		var output = [];
		var oldStackLength = this.stack.length;
		this.pushTokens(tokens);
		while (this.stack.length > oldStackLength) if (this.expandOnce(true) === false) {
			var token = this.stack.pop();
			if (token.treatAsRelax) {
				token.noexpand = false;
				token.treatAsRelax = false;
			}
			output.push(token);
		}
		this.countExpansion(output.length);
		return output;
	}
	/**
	* Fully expand the given macro name and return the result as a string,
	* or return `undefined` if no such macro is defined.
	*/
	expandMacroAsText(name) {
		var tokens = this.expandMacro(name);
		if (tokens) return tokens.map((token) => token.text).join("");
		else return tokens;
	}
	/**
	* Returns the expanded macro as a reversed array of tokens and a macro
	* argument count.  Or returns `null` if no such macro.
	*/
	_getExpansion(name) {
		var definition = this.macros.get(name);
		if (definition == null) return definition;
		if (name.length === 1) {
			var catcode = this.lexer.catcodes[name];
			if (catcode != null && catcode !== 13) return;
		}
		var expansion = typeof definition === "function" ? definition(this) : definition;
		if (typeof expansion === "string") {
			var numArgs = 0;
			if (expansion.includes("#")) {
				var stripped = expansion.replace(/##/g, "");
				while (stripped.includes("#" + (numArgs + 1))) ++numArgs;
			}
			var bodyLexer = new Lexer(expansion, this.settings);
			var tokens = [];
			var tok = bodyLexer.lex();
			while (tok.text !== "EOF") {
				tokens.push(tok);
				tok = bodyLexer.lex();
			}
			tokens.reverse();
			return {
				tokens,
				numArgs
			};
		}
		return expansion;
	}
	/**
	* Determine whether a command is currently "defined" (has some
	* functionality), meaning that it's a macro (in the current group),
	* a function, a symbol, or one of the special commands listed in
	* `implicitCommands`.
	*/
	isDefined(name) {
		return this.macros.has(name) || functions.hasOwnProperty(name) || symbols.math.hasOwnProperty(name) || symbols.text.hasOwnProperty(name) || implicitCommands.hasOwnProperty(name);
	}
	/**
	* Determine whether a command is expandable.
	*/
	isExpandable(name) {
		var macro = this.macros.get(name);
		return macro != null ? typeof macro === "string" || typeof macro === "function" || !macro.unexpandable : functions.hasOwnProperty(name) && !functions[name].primitive;
	}
};
var unicodeSubRegEx = /^[₊₋₌₍₎₀₁₂₃₄₅₆₇₈₉ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵦᵧᵨᵩᵪ]/;
var uSubsAndSups = Object.freeze({
	"₊": "+",
	"₋": "-",
	"₌": "=",
	"₍": "(",
	"₎": ")",
	"₀": "0",
	"₁": "1",
	"₂": "2",
	"₃": "3",
	"₄": "4",
	"₅": "5",
	"₆": "6",
	"₇": "7",
	"₈": "8",
	"₉": "9",
	"ₐ": "a",
	"ₑ": "e",
	"ₕ": "h",
	"ᵢ": "i",
	"ⱼ": "j",
	"ₖ": "k",
	"ₗ": "l",
	"ₘ": "m",
	"ₙ": "n",
	"ₒ": "o",
	"ₚ": "p",
	"ᵣ": "r",
	"ₛ": "s",
	"ₜ": "t",
	"ᵤ": "u",
	"ᵥ": "v",
	"ₓ": "x",
	"ᵦ": "β",
	"ᵧ": "γ",
	"ᵨ": "ρ",
	"ᵩ": "ϕ",
	"ᵪ": "χ",
	"⁺": "+",
	"⁻": "-",
	"⁼": "=",
	"⁽": "(",
	"⁾": ")",
	"⁰": "0",
	"¹": "1",
	"²": "2",
	"³": "3",
	"⁴": "4",
	"⁵": "5",
	"⁶": "6",
	"⁷": "7",
	"⁸": "8",
	"⁹": "9",
	"ᴬ": "A",
	"ᴮ": "B",
	"ᴰ": "D",
	"ᴱ": "E",
	"ᴳ": "G",
	"ᴴ": "H",
	"ᴵ": "I",
	"ᴶ": "J",
	"ᴷ": "K",
	"ᴸ": "L",
	"ᴹ": "M",
	"ᴺ": "N",
	"ᴼ": "O",
	"ᴾ": "P",
	"ᴿ": "R",
	"ᵀ": "T",
	"ᵁ": "U",
	"ⱽ": "V",
	"ᵂ": "W",
	"ᵃ": "a",
	"ᵇ": "b",
	"ᶜ": "c",
	"ᵈ": "d",
	"ᵉ": "e",
	"ᶠ": "f",
	"ᵍ": "g",
	"ʰ": "h",
	"ⁱ": "i",
	"ʲ": "j",
	"ᵏ": "k",
	"ˡ": "l",
	"ᵐ": "m",
	"ⁿ": "n",
	"ᵒ": "o",
	"ᵖ": "p",
	"ʳ": "r",
	"ˢ": "s",
	"ᵗ": "t",
	"ᵘ": "u",
	"ᵛ": "v",
	"ʷ": "w",
	"ˣ": "x",
	"ʸ": "y",
	"ᶻ": "z",
	"ᵝ": "β",
	"ᵞ": "γ",
	"ᵟ": "δ",
	"ᵠ": "ϕ",
	"ᵡ": "χ",
	"ᶿ": "θ"
});
var unicodeAccents = {
	"́": {
		"text": "\\'",
		"math": "\\acute"
	},
	"̀": {
		"text": "\\`",
		"math": "\\grave"
	},
	"̈": {
		"text": "\\\"",
		"math": "\\ddot"
	},
	"̃": {
		"text": "\\~",
		"math": "\\tilde"
	},
	"̄": {
		"text": "\\=",
		"math": "\\bar"
	},
	"̆": {
		"text": "\\u",
		"math": "\\breve"
	},
	"̌": {
		"text": "\\v",
		"math": "\\check"
	},
	"̂": {
		"text": "\\^",
		"math": "\\hat"
	},
	"̇": {
		"text": "\\.",
		"math": "\\dot"
	},
	"̊": {
		"text": "\\r",
		"math": "\\mathring"
	},
	"̋": { "text": "\\H" },
	"̧": { "text": "\\c" }
};
var unicodeSymbols = {
	"á": "á",
	"à": "à",
	"ä": "ä",
	"ǟ": "ǟ",
	"ã": "ã",
	"ā": "ā",
	"ă": "ă",
	"ắ": "ắ",
	"ằ": "ằ",
	"ẵ": "ẵ",
	"ǎ": "ǎ",
	"â": "â",
	"ấ": "ấ",
	"ầ": "ầ",
	"ẫ": "ẫ",
	"ȧ": "ȧ",
	"ǡ": "ǡ",
	"å": "å",
	"ǻ": "ǻ",
	"ḃ": "ḃ",
	"ć": "ć",
	"ḉ": "ḉ",
	"č": "č",
	"ĉ": "ĉ",
	"ċ": "ċ",
	"ç": "ç",
	"ď": "ď",
	"ḋ": "ḋ",
	"ḑ": "ḑ",
	"é": "é",
	"è": "è",
	"ë": "ë",
	"ẽ": "ẽ",
	"ē": "ē",
	"ḗ": "ḗ",
	"ḕ": "ḕ",
	"ĕ": "ĕ",
	"ḝ": "ḝ",
	"ě": "ě",
	"ê": "ê",
	"ế": "ế",
	"ề": "ề",
	"ễ": "ễ",
	"ė": "ė",
	"ȩ": "ȩ",
	"ḟ": "ḟ",
	"ǵ": "ǵ",
	"ḡ": "ḡ",
	"ğ": "ğ",
	"ǧ": "ǧ",
	"ĝ": "ĝ",
	"ġ": "ġ",
	"ģ": "ģ",
	"ḧ": "ḧ",
	"ȟ": "ȟ",
	"ĥ": "ĥ",
	"ḣ": "ḣ",
	"ḩ": "ḩ",
	"í": "í",
	"ì": "ì",
	"ï": "ï",
	"ḯ": "ḯ",
	"ĩ": "ĩ",
	"ī": "ī",
	"ĭ": "ĭ",
	"ǐ": "ǐ",
	"î": "î",
	"ǰ": "ǰ",
	"ĵ": "ĵ",
	"ḱ": "ḱ",
	"ǩ": "ǩ",
	"ķ": "ķ",
	"ĺ": "ĺ",
	"ľ": "ľ",
	"ļ": "ļ",
	"ḿ": "ḿ",
	"ṁ": "ṁ",
	"ń": "ń",
	"ǹ": "ǹ",
	"ñ": "ñ",
	"ň": "ň",
	"ṅ": "ṅ",
	"ņ": "ņ",
	"ó": "ó",
	"ò": "ò",
	"ö": "ö",
	"ȫ": "ȫ",
	"õ": "õ",
	"ṍ": "ṍ",
	"ṏ": "ṏ",
	"ȭ": "ȭ",
	"ō": "ō",
	"ṓ": "ṓ",
	"ṑ": "ṑ",
	"ŏ": "ŏ",
	"ǒ": "ǒ",
	"ô": "ô",
	"ố": "ố",
	"ồ": "ồ",
	"ỗ": "ỗ",
	"ȯ": "ȯ",
	"ȱ": "ȱ",
	"ő": "ő",
	"ṕ": "ṕ",
	"ṗ": "ṗ",
	"ŕ": "ŕ",
	"ř": "ř",
	"ṙ": "ṙ",
	"ŗ": "ŗ",
	"ś": "ś",
	"ṥ": "ṥ",
	"š": "š",
	"ṧ": "ṧ",
	"ŝ": "ŝ",
	"ṡ": "ṡ",
	"ş": "ş",
	"ẗ": "ẗ",
	"ť": "ť",
	"ṫ": "ṫ",
	"ţ": "ţ",
	"ú": "ú",
	"ù": "ù",
	"ü": "ü",
	"ǘ": "ǘ",
	"ǜ": "ǜ",
	"ǖ": "ǖ",
	"ǚ": "ǚ",
	"ũ": "ũ",
	"ṹ": "ṹ",
	"ū": "ū",
	"ṻ": "ṻ",
	"ŭ": "ŭ",
	"ǔ": "ǔ",
	"û": "û",
	"ů": "ů",
	"ű": "ű",
	"ṽ": "ṽ",
	"ẃ": "ẃ",
	"ẁ": "ẁ",
	"ẅ": "ẅ",
	"ŵ": "ŵ",
	"ẇ": "ẇ",
	"ẘ": "ẘ",
	"ẍ": "ẍ",
	"ẋ": "ẋ",
	"ý": "ý",
	"ỳ": "ỳ",
	"ÿ": "ÿ",
	"ỹ": "ỹ",
	"ȳ": "ȳ",
	"ŷ": "ŷ",
	"ẏ": "ẏ",
	"ẙ": "ẙ",
	"ź": "ź",
	"ž": "ž",
	"ẑ": "ẑ",
	"ż": "ż",
	"Á": "Á",
	"À": "À",
	"Ä": "Ä",
	"Ǟ": "Ǟ",
	"Ã": "Ã",
	"Ā": "Ā",
	"Ă": "Ă",
	"Ắ": "Ắ",
	"Ằ": "Ằ",
	"Ẵ": "Ẵ",
	"Ǎ": "Ǎ",
	"Â": "Â",
	"Ấ": "Ấ",
	"Ầ": "Ầ",
	"Ẫ": "Ẫ",
	"Ȧ": "Ȧ",
	"Ǡ": "Ǡ",
	"Å": "Å",
	"Ǻ": "Ǻ",
	"Ḃ": "Ḃ",
	"Ć": "Ć",
	"Ḉ": "Ḉ",
	"Č": "Č",
	"Ĉ": "Ĉ",
	"Ċ": "Ċ",
	"Ç": "Ç",
	"Ď": "Ď",
	"Ḋ": "Ḋ",
	"Ḑ": "Ḑ",
	"É": "É",
	"È": "È",
	"Ë": "Ë",
	"Ẽ": "Ẽ",
	"Ē": "Ē",
	"Ḗ": "Ḗ",
	"Ḕ": "Ḕ",
	"Ĕ": "Ĕ",
	"Ḝ": "Ḝ",
	"Ě": "Ě",
	"Ê": "Ê",
	"Ế": "Ế",
	"Ề": "Ề",
	"Ễ": "Ễ",
	"Ė": "Ė",
	"Ȩ": "Ȩ",
	"Ḟ": "Ḟ",
	"Ǵ": "Ǵ",
	"Ḡ": "Ḡ",
	"Ğ": "Ğ",
	"Ǧ": "Ǧ",
	"Ĝ": "Ĝ",
	"Ġ": "Ġ",
	"Ģ": "Ģ",
	"Ḧ": "Ḧ",
	"Ȟ": "Ȟ",
	"Ĥ": "Ĥ",
	"Ḣ": "Ḣ",
	"Ḩ": "Ḩ",
	"Í": "Í",
	"Ì": "Ì",
	"Ï": "Ï",
	"Ḯ": "Ḯ",
	"Ĩ": "Ĩ",
	"Ī": "Ī",
	"Ĭ": "Ĭ",
	"Ǐ": "Ǐ",
	"Î": "Î",
	"İ": "İ",
	"Ĵ": "Ĵ",
	"Ḱ": "Ḱ",
	"Ǩ": "Ǩ",
	"Ķ": "Ķ",
	"Ĺ": "Ĺ",
	"Ľ": "Ľ",
	"Ļ": "Ļ",
	"Ḿ": "Ḿ",
	"Ṁ": "Ṁ",
	"Ń": "Ń",
	"Ǹ": "Ǹ",
	"Ñ": "Ñ",
	"Ň": "Ň",
	"Ṅ": "Ṅ",
	"Ņ": "Ņ",
	"Ó": "Ó",
	"Ò": "Ò",
	"Ö": "Ö",
	"Ȫ": "Ȫ",
	"Õ": "Õ",
	"Ṍ": "Ṍ",
	"Ṏ": "Ṏ",
	"Ȭ": "Ȭ",
	"Ō": "Ō",
	"Ṓ": "Ṓ",
	"Ṑ": "Ṑ",
	"Ŏ": "Ŏ",
	"Ǒ": "Ǒ",
	"Ô": "Ô",
	"Ố": "Ố",
	"Ồ": "Ồ",
	"Ỗ": "Ỗ",
	"Ȯ": "Ȯ",
	"Ȱ": "Ȱ",
	"Ő": "Ő",
	"Ṕ": "Ṕ",
	"Ṗ": "Ṗ",
	"Ŕ": "Ŕ",
	"Ř": "Ř",
	"Ṙ": "Ṙ",
	"Ŗ": "Ŗ",
	"Ś": "Ś",
	"Ṥ": "Ṥ",
	"Š": "Š",
	"Ṧ": "Ṧ",
	"Ŝ": "Ŝ",
	"Ṡ": "Ṡ",
	"Ş": "Ş",
	"Ť": "Ť",
	"Ṫ": "Ṫ",
	"Ţ": "Ţ",
	"Ú": "Ú",
	"Ù": "Ù",
	"Ü": "Ü",
	"Ǘ": "Ǘ",
	"Ǜ": "Ǜ",
	"Ǖ": "Ǖ",
	"Ǚ": "Ǚ",
	"Ũ": "Ũ",
	"Ṹ": "Ṹ",
	"Ū": "Ū",
	"Ṻ": "Ṻ",
	"Ŭ": "Ŭ",
	"Ǔ": "Ǔ",
	"Û": "Û",
	"Ů": "Ů",
	"Ű": "Ű",
	"Ṽ": "Ṽ",
	"Ẃ": "Ẃ",
	"Ẁ": "Ẁ",
	"Ẅ": "Ẅ",
	"Ŵ": "Ŵ",
	"Ẇ": "Ẇ",
	"Ẍ": "Ẍ",
	"Ẋ": "Ẋ",
	"Ý": "Ý",
	"Ỳ": "Ỳ",
	"Ÿ": "Ÿ",
	"Ỹ": "Ỹ",
	"Ȳ": "Ȳ",
	"Ŷ": "Ŷ",
	"Ẏ": "Ẏ",
	"Ź": "Ź",
	"Ž": "Ž",
	"Ẑ": "Ẑ",
	"Ż": "Ż",
	"ά": "ά",
	"ὰ": "ὰ",
	"ᾱ": "ᾱ",
	"ᾰ": "ᾰ",
	"έ": "έ",
	"ὲ": "ὲ",
	"ή": "ή",
	"ὴ": "ὴ",
	"ί": "ί",
	"ὶ": "ὶ",
	"ϊ": "ϊ",
	"ΐ": "ΐ",
	"ῒ": "ῒ",
	"ῑ": "ῑ",
	"ῐ": "ῐ",
	"ό": "ό",
	"ὸ": "ὸ",
	"ύ": "ύ",
	"ὺ": "ὺ",
	"ϋ": "ϋ",
	"ΰ": "ΰ",
	"ῢ": "ῢ",
	"ῡ": "ῡ",
	"ῠ": "ῠ",
	"ώ": "ώ",
	"ὼ": "ὼ",
	"Ύ": "Ύ",
	"Ὺ": "Ὺ",
	"Ϋ": "Ϋ",
	"Ῡ": "Ῡ",
	"Ῠ": "Ῠ",
	"Ώ": "Ώ",
	"Ὼ": "Ὼ"
};
/**
* This file contains the parser used to parse out a TeX expression from the
* input. Since TeX isn't context-free, standard parsers don't work particularly
* well.
*
* The strategy of this parser is as such:
*
* The main functions (the `.parse...` ones) take a position in the current
* parse string to parse tokens from. The lexer (found in Lexer.js, stored at
* this.gullet.lexer) also supports pulling out tokens at arbitrary places. When
* individual tokens are needed at a position, the lexer is called to pull out a
* token, which is then used.
*
* The parser has a property called "mode" indicating the mode that
* the parser is currently in. Currently it has to be one of "math" or
* "text", which denotes whether the current environment is a math-y
* one or a text-y one (e.g. inside \text). Currently, this serves to
* limit the functions which can be used in text mode.
*
* The main functions then return an object which contains the useful data that
* was parsed at its given point, and a new position at the end of the parsed
* data. The main functions can call each other and continue the parsing by
* using the returned position as a new starting point.
*
* There are also extra `.handle...` functions, which pull out some reused
* functionality into self-contained functions.
*
* The functions return ParseNodes.
*/
var Parser = class Parser {
	constructor(input, settings) {
		this.mode = "math";
		this.gullet = new MacroExpander(input, settings, this.mode);
		this.settings = settings;
		this.leftrightDepth = 0;
		this.nextToken = null;
	}
	/**
	* Checks a result to make sure it has the right type, and throws an
	* appropriate error otherwise.
	*/
	expect(text, consume) {
		if (consume === void 0) consume = true;
		if (this.fetch().text !== text) throw new ParseError("Expected '" + text + "', got '" + this.fetch().text + "'", this.fetch());
		if (consume) this.consume();
	}
	/**
	* Discards the current lookahead token, considering it consumed.
	*/
	consume() {
		this.nextToken = null;
	}
	/**
	* Return the current lookahead token, or if there isn't one (at the
	* beginning, or if the previous lookahead token was consume()d),
	* fetch the next token as the new lookahead token and return it.
	*/
	fetch() {
		if (this.nextToken == null) this.nextToken = this.gullet.expandNextToken();
		return this.nextToken;
	}
	/**
	* Switches between "text" and "math" modes.
	*/
	switchMode(newMode) {
		this.mode = newMode;
		this.gullet.switchMode(newMode);
	}
	/**
	* Main parsing function, which parses an entire input.
	*/
	parse() {
		if (!this.settings.globalGroup) this.gullet.beginGroup();
		if (this.settings.colorIsTextColor) this.gullet.macros.set("\\color", "\\textcolor");
		try {
			var parse = this.parseExpression(false);
			this.expect("EOF");
			if (!this.settings.globalGroup) this.gullet.endGroup();
			return parse;
		} finally {
			this.gullet.endGroups();
		}
	}
	/**
	* Fully parse a separate sequence of tokens as a separate job.
	* Tokens should be specified in reverse order, as in a MacroDefinition.
	*/
	subparse(tokens) {
		var oldToken = this.nextToken;
		this.consume();
		this.gullet.pushToken(new Token("}"));
		this.gullet.pushTokens(tokens);
		var parse = this.parseExpression(false);
		this.expect("}");
		this.nextToken = oldToken;
		return parse;
	}
	/**
	* Parses an "expression", which is a list of atoms.
	*
	* `breakOnInfix`: Should the parsing stop when we hit infix nodes? This
	*                 happens when functions have higher precedence than infix
	*                 nodes in implicit parses.
	*
	* `breakOnTokenText`: The text of the token that the expression should end
	*                     with, or `null` if something else should end the
	*                     expression.
	*/
	parseExpression(breakOnInfix, breakOnTokenText) {
		var body = [];
		while (true) {
			if (this.mode === "math") this.consumeSpaces();
			var lex = this.fetch();
			if (Parser.endOfExpression.has(lex.text)) break;
			if (breakOnTokenText && lex.text === breakOnTokenText) break;
			if (breakOnInfix && functions[lex.text] && functions[lex.text].infix) break;
			var atom = this.parseAtom(breakOnTokenText);
			if (!atom) break;
			else if (atom.type === "internal") continue;
			body.push(atom);
		}
		if (this.mode === "text") this.formLigatures(body);
		return this.handleInfixNodes(body);
	}
	/**
	* Rewrites infix operators such as \over with corresponding commands such
	* as \frac.
	*
	* There can only be one infix operator per group.  If there's more than one
	* then the expression is ambiguous.  This can be resolved by adding {}.
	*/
	handleInfixNodes(body) {
		var overIndex = -1;
		var funcName;
		for (var i = 0; i < body.length; i++) {
			var node = body[i];
			if (node.type === "infix") {
				if (overIndex !== -1) throw new ParseError("only one infix operator per group", node.token);
				overIndex = i;
				funcName = node.replaceWith;
			}
		}
		if (overIndex !== -1 && funcName) {
			var numerNode;
			var denomNode;
			var numerBody = body.slice(0, overIndex);
			var denomBody = body.slice(overIndex + 1);
			if (numerBody.length === 1 && numerBody[0].type === "ordgroup") numerNode = numerBody[0];
			else numerNode = {
				type: "ordgroup",
				mode: this.mode,
				body: numerBody
			};
			if (denomBody.length === 1 && denomBody[0].type === "ordgroup") denomNode = denomBody[0];
			else denomNode = {
				type: "ordgroup",
				mode: this.mode,
				body: denomBody
			};
			var _node;
			if (funcName === "\\\\abovefrac") _node = this.callFunction(funcName, [
				numerNode,
				body[overIndex],
				denomNode
			], []);
			else _node = this.callFunction(funcName, [numerNode, denomNode], []);
			return [_node];
		} else return body;
	}
	/**
	* Handle a subscript or superscript with nice errors.
	*/
	handleSupSubscript(name) {
		var symbolToken = this.fetch();
		var symbol = symbolToken.text;
		this.consume();
		this.consumeSpaces();
		var group;
		do {
			var _group;
			group = this.parseGroup(name);
		} while (((_group = group) == null ? void 0 : _group.type) === "internal");
		if (!group) throw new ParseError("Expected group after '" + symbol + "'", symbolToken);
		return group;
	}
	/**
	* Converts the textual input of an unsupported command into a text node
	* contained within a color node whose color is determined by errorColor
	*/
	formatUnsupportedCmd(text) {
		var textordArray = [];
		for (var i = 0; i < text.length; i++) textordArray.push({
			type: "textord",
			mode: "text",
			text: text[i]
		});
		var textNode = {
			type: "text",
			mode: this.mode,
			body: textordArray
		};
		return {
			type: "color",
			mode: this.mode,
			color: this.settings.errorColor,
			body: [textNode]
		};
	}
	/**
	* Parses a group with optional super/subscripts.
	*/
	parseAtom(breakOnTokenText) {
		var base = this.parseGroup("atom", breakOnTokenText);
		if ((base == null ? void 0 : base.type) === "internal") return base;
		if (this.mode === "text") return base;
		var superscript;
		var subscript;
		while (true) {
			this.consumeSpaces();
			var lex = this.fetch();
			if (lex.text === "\\limits" || lex.text === "\\nolimits") {
				if (base && base.type === "op") {
					base.limits = lex.text === "\\limits";
					base.alwaysHandleSupSub = true;
				} else if (base && base.type === "operatorname") {
					if (base.alwaysHandleSupSub) base.limits = lex.text === "\\limits";
				} else throw new ParseError("Limit controls must follow a math operator", lex);
				this.consume();
			} else if (lex.text === "^") {
				if (superscript) throw new ParseError("Double superscript", lex);
				superscript = this.handleSupSubscript("superscript");
			} else if (lex.text === "_") {
				if (subscript) throw new ParseError("Double subscript", lex);
				subscript = this.handleSupSubscript("subscript");
			} else if (lex.text === "'") {
				if (superscript) throw new ParseError("Double superscript", lex);
				var prime = {
					type: "textord",
					mode: this.mode,
					text: "\\prime"
				};
				var primes = [prime];
				this.consume();
				while (this.fetch().text === "'") {
					primes.push(prime);
					this.consume();
				}
				if (this.fetch().text === "^") primes.push(this.handleSupSubscript("superscript"));
				superscript = {
					type: "ordgroup",
					mode: this.mode,
					body: primes
				};
			} else if (uSubsAndSups[lex.text]) {
				var isSub = unicodeSubRegEx.test(lex.text);
				var subsupTokens = [];
				subsupTokens.push(new Token(uSubsAndSups[lex.text]));
				this.consume();
				while (true) {
					var token = this.fetch().text;
					if (!uSubsAndSups[token]) break;
					if (unicodeSubRegEx.test(token) !== isSub) break;
					subsupTokens.unshift(new Token(uSubsAndSups[token]));
					this.consume();
				}
				var body = this.subparse(subsupTokens);
				if (isSub) subscript = {
					type: "ordgroup",
					mode: "math",
					body
				};
				else superscript = {
					type: "ordgroup",
					mode: "math",
					body
				};
			} else break;
		}
		if (superscript || subscript) return {
			type: "supsub",
			mode: this.mode,
			base,
			sup: superscript,
			sub: subscript
		};
		else return base;
	}
	/**
	* Parses an entire function, including its base and all of its arguments.
	*/
	parseFunction(breakOnTokenText, name) {
		var token = this.fetch();
		var func = token.text;
		var funcData = functions[func];
		if (!funcData) return null;
		this.consume();
		if (name && name !== "atom" && !funcData.allowedInArgument) throw new ParseError("Got function '" + func + "' with no arguments" + (name ? " as " + name : ""), token);
		else if (this.mode === "text" && !funcData.allowedInText) throw new ParseError("Can't use function '" + func + "' in text mode", token);
		else if (this.mode === "math" && funcData.allowedInMath === false) throw new ParseError("Can't use function '" + func + "' in math mode", token);
		var { args, optArgs } = this.parseArguments(func, funcData);
		return this.callFunction(func, args, optArgs, token, breakOnTokenText);
	}
	/**
	* Call a function handler with a suitable context and arguments.
	*/
	callFunction(name, args, optArgs, token, breakOnTokenText) {
		var context = {
			funcName: name,
			parser: this,
			token,
			breakOnTokenText
		};
		var func = functions[name];
		if (func && func.handler) return func.handler(context, args, optArgs);
		else throw new ParseError("No function handler for " + name);
	}
	/**
	* Parses the arguments of a function or environment
	*/
	parseArguments(func, funcData) {
		var totalArgs = funcData.numArgs + funcData.numOptionalArgs;
		if (totalArgs === 0) return {
			args: [],
			optArgs: []
		};
		var args = [];
		var optArgs = [];
		for (var i = 0; i < totalArgs; i++) {
			var argType = funcData.argTypes && funcData.argTypes[i];
			var isOptional = i < funcData.numOptionalArgs;
			if ("primitive" in funcData && funcData.primitive && argType == null || funcData.type === "sqrt" && i === 1 && optArgs[0] == null) argType = "primitive";
			var arg = this.parseGroupOfType("argument to '" + func + "'", argType, isOptional);
			if (isOptional) optArgs.push(arg);
			else if (arg != null) args.push(arg);
			else throw new ParseError("Null argument, please report this as a bug");
		}
		return {
			args,
			optArgs
		};
	}
	/**
	* Parses a group when the mode is changing.
	*/
	parseGroupOfType(name, type, optional) {
		switch (type) {
			case "color": return this.parseColorGroup(optional);
			case "size": return this.parseSizeGroup(optional);
			case "url": return this.parseUrlGroup(optional);
			case "math":
			case "text": return this.parseArgumentGroup(optional, type);
			case "hbox":
				var group = this.parseArgumentGroup(optional, "text");
				return group != null ? {
					type: "styling",
					mode: group.mode,
					body: [group],
					style: "text"
				} : null;
			case "raw":
				var token = this.parseStringGroup("raw", optional);
				return token != null ? {
					type: "raw",
					mode: "text",
					string: token.text
				} : null;
			case "primitive":
				if (optional) throw new ParseError("A primitive argument cannot be optional");
				var _group2 = this.parseGroup(name);
				if (_group2 == null) throw new ParseError("Expected group as " + name, this.fetch());
				return _group2;
			case "original":
			case null:
			case void 0: return this.parseArgumentGroup(optional);
			default: throw new ParseError("Unknown group type as " + name, this.fetch());
		}
	}
	/**
	* Discard any space tokens, fetching the next non-space token.
	*/
	consumeSpaces() {
		while (this.fetch().text === " ") this.consume();
	}
	/**
	* Parses a group, essentially returning the string formed by the
	* brace-enclosed tokens plus some position information.
	*/
	parseStringGroup(modeName, optional) {
		var argToken = this.gullet.scanArgument(optional);
		if (argToken == null) return null;
		var str = "";
		var nextToken;
		while ((nextToken = this.fetch()).text !== "EOF") {
			str += nextToken.text;
			this.consume();
		}
		this.consume();
		argToken.text = str;
		return argToken;
	}
	/**
	* Parses a regex-delimited group: the largest sequence of tokens
	* whose concatenated strings match `regex`. Returns the string
	* formed by the tokens plus some position information.
	*/
	parseRegexGroup(regex, modeName) {
		var firstToken = this.fetch();
		var lastToken = firstToken;
		var str = "";
		var nextToken;
		while ((nextToken = this.fetch()).text !== "EOF" && regex.test(str + nextToken.text)) {
			lastToken = nextToken;
			str += lastToken.text;
			this.consume();
		}
		if (str === "") throw new ParseError("Invalid " + modeName + ": '" + firstToken.text + "'", firstToken);
		return firstToken.range(lastToken, str);
	}
	/**
	* Parses a color description.
	*/
	parseColorGroup(optional) {
		var res = this.parseStringGroup("color", optional);
		if (res == null) return null;
		var match = /^(#[a-f0-9]{3,4}|#[a-f0-9]{6}|#[a-f0-9]{8}|[a-f0-9]{6}|[a-z]+)$/i.exec(res.text);
		if (!match) throw new ParseError("Invalid color: '" + res.text + "'", res);
		var color = match[0];
		if (/^[0-9a-f]{6}$/i.test(color)) color = "#" + color;
		return {
			type: "color-token",
			mode: this.mode,
			color
		};
	}
	/**
	* Parses a size specification, consisting of magnitude and unit.
	*/
	parseSizeGroup(optional) {
		var res;
		var isBlank = false;
		this.gullet.consumeSpaces();
		if (!optional && this.gullet.future().text !== "{") res = this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/, "size");
		else res = this.parseStringGroup("size", optional);
		if (!res) return null;
		if (!optional && res.text.length === 0) {
			res.text = "0pt";
			isBlank = true;
		}
		var match = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(res.text);
		if (!match) throw new ParseError("Invalid size: '" + res.text + "'", res);
		var data = {
			number: +(match[1] + match[2]),
			unit: match[3]
		};
		if (!validUnit(data)) throw new ParseError("Invalid unit: '" + data.unit + "'", res);
		return {
			type: "size",
			mode: this.mode,
			value: data,
			isBlank
		};
	}
	/**
	* Parses an URL, checking escaped letters and allowed protocols,
	* and setting the catcode of % as an active character (as in \hyperref).
	*/
	parseUrlGroup(optional) {
		this.gullet.lexer.setCatcode("%", 13);
		this.gullet.lexer.setCatcode("~", 12);
		var res = this.parseStringGroup("url", optional);
		this.gullet.lexer.setCatcode("%", 14);
		this.gullet.lexer.setCatcode("~", 13);
		if (res == null) return null;
		var url = res.text.replace(/\\([#$%&~_^{}])/g, "$1");
		return {
			type: "url",
			mode: this.mode,
			url
		};
	}
	/**
	* Parses an argument with the mode specified.
	*/
	parseArgumentGroup(optional, mode) {
		var argToken = this.gullet.scanArgument(optional);
		if (argToken == null) return null;
		var outerMode = this.mode;
		if (mode) this.switchMode(mode);
		this.gullet.beginGroup();
		var expression = this.parseExpression(false, "EOF");
		this.expect("EOF");
		this.gullet.endGroup();
		var result = {
			type: "ordgroup",
			mode: this.mode,
			loc: argToken.loc,
			body: expression
		};
		if (mode) this.switchMode(outerMode);
		return result;
	}
	/**
	* Parses an ordinary group, which is either a single nucleus (like "x")
	* or an expression in braces (like "{x+y}") or an implicit group, a group
	* that starts at the current position, and ends right before a higher explicit
	* group ends, or at EOF.
	*/
	parseGroup(name, breakOnTokenText) {
		var firstToken = this.fetch();
		var text = firstToken.text;
		var result;
		if (text === "{" || text === "\\begingroup") {
			this.consume();
			var groupEnd = text === "{" ? "}" : "\\endgroup";
			this.gullet.beginGroup();
			var expression = this.parseExpression(false, groupEnd);
			var lastToken = this.fetch();
			this.expect(groupEnd);
			this.gullet.endGroup();
			result = {
				type: "ordgroup",
				mode: this.mode,
				loc: SourceLocation.range(firstToken, lastToken),
				body: expression,
				semisimple: text === "\\begingroup" || void 0
			};
		} else {
			result = this.parseFunction(breakOnTokenText, name) || this.parseSymbol();
			if (result == null && text[0] === "\\" && !implicitCommands.hasOwnProperty(text)) {
				if (this.settings.throwOnError) throw new ParseError("Undefined control sequence: " + text, firstToken);
				result = this.formatUnsupportedCmd(text);
				this.consume();
			}
		}
		return result;
	}
	/**
	* Form ligature-like combinations of characters for text mode.
	* This includes inputs like "--", "---", "``" and "''".
	* The result will simply replace multiple textord nodes with a single
	* character in each value by a single textord node having multiple
	* characters in its value.  The representation is still ASCII source.
	* The group will be modified in place.
	*/
	formLigatures(group) {
		var n = group.length - 1;
		for (var i = 0; i < n; ++i) {
			var a = group[i];
			if (a.type !== "textord") continue;
			var v = a.text;
			var next = group[i + 1];
			if (!next || next.type !== "textord") continue;
			if (v === "-" && next.text === "-") {
				var afterNext = group[i + 2];
				if (i + 1 < n && afterNext && afterNext.type === "textord" && afterNext.text === "-") {
					group.splice(i, 3, {
						type: "textord",
						mode: "text",
						loc: SourceLocation.range(a, afterNext),
						text: "---"
					});
					n -= 2;
				} else {
					group.splice(i, 2, {
						type: "textord",
						mode: "text",
						loc: SourceLocation.range(a, next),
						text: "--"
					});
					n -= 1;
				}
			}
			if ((v === "'" || v === "`") && next.text === v) {
				group.splice(i, 2, {
					type: "textord",
					mode: "text",
					loc: SourceLocation.range(a, next),
					text: v + v
				});
				n -= 1;
			}
		}
	}
	/**
	* Parse a single symbol out of the string. Here, we handle single character
	* symbols and special functions like \verb.
	*/
	parseSymbol() {
		var nucleus = this.fetch();
		var text = nucleus.text;
		if (/^\\verb[^a-zA-Z]/.test(text)) {
			this.consume();
			var arg = text.slice(5);
			var star = arg.charAt(0) === "*";
			if (star) arg = arg.slice(1);
			if (arg.length < 2 || arg.charAt(0) !== arg.slice(-1)) throw new ParseError("\\verb assertion failed --\n                    please report what input caused this bug");
			arg = arg.slice(1, -1);
			return {
				type: "verb",
				mode: "text",
				body: arg,
				star
			};
		}
		if (unicodeSymbols.hasOwnProperty(text[0]) && !symbols[this.mode][text[0]]) {
			if (this.settings.strict && this.mode === "math") this.settings.reportNonstrict("unicodeTextInMathMode", "Accented Unicode text character \"" + text[0] + "\" used in math mode", nucleus);
			text = unicodeSymbols[text[0]] + text.slice(1);
		}
		var match = combiningDiacriticalMarksEndRegex.exec(text);
		if (match) {
			text = text.substring(0, match.index);
			if (text === "i") text = "ı";
			else if (text === "j") text = "ȷ";
		}
		var symbol;
		if (symbols[this.mode][text]) {
			if (this.settings.strict && this.mode === "math" && extraLatin.includes(text)) this.settings.reportNonstrict("unicodeTextInMathMode", "Latin-1/Unicode text character \"" + text[0] + "\" used in math mode", nucleus);
			var group = symbols[this.mode][text].group;
			var loc = SourceLocation.range(nucleus);
			var s;
			if (ATOMS.hasOwnProperty(group)) {
				var family = group;
				s = {
					type: "atom",
					mode: this.mode,
					family,
					loc,
					text
				};
			} else s = {
				type: group,
				mode: this.mode,
				loc,
				text
			};
			symbol = s;
		} else if (text.charCodeAt(0) >= 128) {
			if (this.settings.strict) {
				if (!supportedCodepoint(text.charCodeAt(0))) this.settings.reportNonstrict("unknownSymbol", "Unrecognized Unicode character \"" + text[0] + "\"" + (" (" + text.charCodeAt(0) + ")"), nucleus);
				else if (this.mode === "math") this.settings.reportNonstrict("unicodeTextInMathMode", "Unicode text character \"" + text[0] + "\" used in math mode", nucleus);
			}
			symbol = {
				type: "textord",
				mode: "text",
				loc: SourceLocation.range(nucleus),
				text
			};
		} else return null;
		this.consume();
		if (match) for (var i = 0; i < match[0].length; i++) {
			var accent = match[0][i];
			if (!unicodeAccents[accent]) throw new ParseError("Unknown accent ' " + accent + "'", nucleus);
			var command = unicodeAccents[accent][this.mode] || unicodeAccents[accent].text;
			if (!command) throw new ParseError("Accent " + accent + " unsupported in " + this.mode + " mode", nucleus);
			symbol = {
				type: "accent",
				mode: this.mode,
				loc: SourceLocation.range(nucleus),
				label: command,
				isStretchy: false,
				isShifty: true,
				base: symbol
			};
		}
		return symbol;
	}
};
Parser.endOfExpression = new Set([
	"}",
	"\\endgroup",
	"\\end",
	"\\right",
	"&"
]);
/**
* Provides a single function for parsing an expression using a Parser
* TODO(emily): Remove this
*/
/**
* Parses an expression using a Parser, then returns the parsed result.
*/
var parseTree = function parseTree(toParse, settings) {
	if (!(typeof toParse === "string" || toParse instanceof String)) throw new TypeError("KaTeX can only parse string typed expression");
	var parser = new Parser(toParse, settings);
	delete parser.gullet.macros.current["\\df@tag"];
	var tree = parser.parse();
	delete parser.gullet.macros.current["\\current@color"];
	delete parser.gullet.macros.current["\\color"];
	if (parser.gullet.macros.get("\\df@tag")) {
		if (!settings.displayMode) throw new ParseError("\\tag works only in display equations");
		tree = [{
			type: "tag",
			mode: "text",
			body: tree,
			tag: parser.subparse([new Token("\\df@tag")])
		}];
	}
	return tree;
};
/**
* Parse and build an expression, and place that expression in the DOM node
* given.
*/
var render = function render(expression, baseNode, options) {
	baseNode.textContent = "";
	var node = renderToDomTree(expression, options).toNode();
	baseNode.appendChild(node);
};
if (typeof document !== "undefined") {
	if (document.compatMode !== "CSS1Compat") {
		typeof console !== "undefined" && console.warn("Warning: KaTeX doesn't work in quirks mode. Make sure your website has a suitable doctype.");
		render = function render() {
			throw new ParseError("KaTeX doesn't work in quirks mode.");
		};
	}
}
/**
* Parse and build an expression, and return the markup for that.
*/
var renderToString = function renderToString(expression, options) {
	return renderToDomTree(expression, options).toMarkup();
};
/**
* Parse an expression and return the parse tree.
*/
var generateParseTree = function generateParseTree(expression, options) {
	return parseTree(expression, new Settings(options));
};
/**
* If the given error is a KaTeX ParseError and options.throwOnError is false,
* renders the invalid LaTeX as a span with hover title giving the KaTeX
* error message.  Otherwise, simply throws the error.
*/
var renderError = function renderError(error, expression, options) {
	if (options.throwOnError || !(error instanceof ParseError)) throw error;
	var node = makeSpan(["katex-error"], [new SymbolNode(expression)]);
	node.setAttribute("title", error.toString());
	node.setAttribute("style", "color:" + options.errorColor);
	return node;
};
/**
* Generates and returns the katex build tree. This is used for advanced
* use cases (like rendering to custom output).
*/
var renderToDomTree = function renderToDomTree(expression, options) {
	var settings = new Settings(options);
	try {
		return buildTree(parseTree(expression, settings), expression, settings);
	} catch (error) {
		return renderError(error, expression, settings);
	}
};
var katex = {
	version: "0.16.43",
	render,
	renderToString,
	ParseError,
	SETTINGS_SCHEMA,
	__parse: generateParseTree,
	__renderToDomTree: renderToDomTree,
	__renderToHTMLTree: function renderToHTMLTree(expression, options) {
		var settings = new Settings(options);
		try {
			return buildHTMLTree(parseTree(expression, settings), expression, settings);
		} catch (error) {
			return renderError(error, expression, settings);
		}
	},
	__setFontMetrics: setFontMetrics,
	__defineSymbol: defineSymbol,
	__defineFunction: defineFunction,
	__defineMacro: defineMacro,
	__domTree: {
		Span,
		Anchor,
		SymbolNode,
		SvgNode,
		PathNode,
		LineNode
	}
};
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function r(e) {
	var t, f, n = "";
	if ("string" == typeof e || "number" == typeof e) n += e;
	else if ("object" == typeof e) if (Array.isArray(e)) {
		var o = e.length;
		for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
	} else for (f in e) e[f] && (n && (n += " "), n += f);
	return n;
}
function clsx() {
	for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
	return n;
}
//#endregion
//#region node_modules/tailwind-merge/dist/bundle-mjs.mjs
/**
* Concatenates two arrays faster than the array spread operator.
*/
var concatArrays = (array1, array2) => {
	const combinedArray = new Array(array1.length + array2.length);
	for (let i = 0; i < array1.length; i++) combinedArray[i] = array1[i];
	for (let i = 0; i < array2.length; i++) combinedArray[array1.length + i] = array2[i];
	return combinedArray;
};
var createClassValidatorObject = (classGroupId, validator) => ({
	classGroupId,
	validator
});
var createClassPartObject = (nextPart = /* @__PURE__ */ new Map(), validators = null, classGroupId) => ({
	nextPart,
	validators,
	classGroupId
});
var CLASS_PART_SEPARATOR = "-";
var EMPTY_CONFLICTS = [];
var ARBITRARY_PROPERTY_PREFIX = "arbitrary..";
var createClassGroupUtils = (config) => {
	const classMap = createClassMap(config);
	const { conflictingClassGroups, conflictingClassGroupModifiers } = config;
	const getClassGroupId = (className) => {
		if (className.startsWith("[") && className.endsWith("]")) return getGroupIdForArbitraryProperty(className);
		const classParts = className.split(CLASS_PART_SEPARATOR);
		return getGroupRecursive(classParts, classParts[0] === "" && classParts.length > 1 ? 1 : 0, classMap);
	};
	const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
		if (hasPostfixModifier) {
			const modifierConflicts = conflictingClassGroupModifiers[classGroupId];
			const baseConflicts = conflictingClassGroups[classGroupId];
			if (modifierConflicts) {
				if (baseConflicts) return concatArrays(baseConflicts, modifierConflicts);
				return modifierConflicts;
			}
			return baseConflicts || EMPTY_CONFLICTS;
		}
		return conflictingClassGroups[classGroupId] || EMPTY_CONFLICTS;
	};
	return {
		getClassGroupId,
		getConflictingClassGroupIds
	};
};
var getGroupRecursive = (classParts, startIndex, classPartObject) => {
	if (classParts.length - startIndex === 0) return classPartObject.classGroupId;
	const currentClassPart = classParts[startIndex];
	const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
	if (nextClassPartObject) {
		const result = getGroupRecursive(classParts, startIndex + 1, nextClassPartObject);
		if (result) return result;
	}
	const validators = classPartObject.validators;
	if (validators === null) return;
	const classRest = startIndex === 0 ? classParts.join(CLASS_PART_SEPARATOR) : classParts.slice(startIndex).join(CLASS_PART_SEPARATOR);
	const validatorsLength = validators.length;
	for (let i = 0; i < validatorsLength; i++) {
		const validatorObj = validators[i];
		if (validatorObj.validator(classRest)) return validatorObj.classGroupId;
	}
};
/**
* Get the class group ID for an arbitrary property.
*
* @param className - The class name to get the group ID for. Is expected to be string starting with `[` and ending with `]`.
*/
var getGroupIdForArbitraryProperty = (className) => className.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
	const content = className.slice(1, -1);
	const colonIndex = content.indexOf(":");
	const property = content.slice(0, colonIndex);
	return property ? ARBITRARY_PROPERTY_PREFIX + property : void 0;
})();
/**
* Exported for testing only
*/
var createClassMap = (config) => {
	const { theme, classGroups } = config;
	return processClassGroups(classGroups, theme);
};
var processClassGroups = (classGroups, theme) => {
	const classMap = createClassPartObject();
	for (const classGroupId in classGroups) {
		const group = classGroups[classGroupId];
		processClassesRecursively(group, classMap, classGroupId, theme);
	}
	return classMap;
};
var processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
	const len = classGroup.length;
	for (let i = 0; i < len; i++) {
		const classDefinition = classGroup[i];
		processClassDefinition(classDefinition, classPartObject, classGroupId, theme);
	}
};
var processClassDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
	if (typeof classDefinition === "string") {
		processStringDefinition(classDefinition, classPartObject, classGroupId);
		return;
	}
	if (typeof classDefinition === "function") {
		processFunctionDefinition(classDefinition, classPartObject, classGroupId, theme);
		return;
	}
	processObjectDefinition(classDefinition, classPartObject, classGroupId, theme);
};
var processStringDefinition = (classDefinition, classPartObject, classGroupId) => {
	const classPartObjectToEdit = classDefinition === "" ? classPartObject : getPart(classPartObject, classDefinition);
	classPartObjectToEdit.classGroupId = classGroupId;
};
var processFunctionDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
	if (isThemeGetter(classDefinition)) {
		processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
		return;
	}
	if (classPartObject.validators === null) classPartObject.validators = [];
	classPartObject.validators.push(createClassValidatorObject(classGroupId, classDefinition));
};
var processObjectDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
	const entries = Object.entries(classDefinition);
	const len = entries.length;
	for (let i = 0; i < len; i++) {
		const [key, value] = entries[i];
		processClassesRecursively(value, getPart(classPartObject, key), classGroupId, theme);
	}
};
var getPart = (classPartObject, path) => {
	let current = classPartObject;
	const parts = path.split(CLASS_PART_SEPARATOR);
	const len = parts.length;
	for (let i = 0; i < len; i++) {
		const part = parts[i];
		let next = current.nextPart.get(part);
		if (!next) {
			next = createClassPartObject();
			current.nextPart.set(part, next);
		}
		current = next;
	}
	return current;
};
var isThemeGetter = (func) => "isThemeGetter" in func && func.isThemeGetter === true;
var createLruCache = (maxCacheSize) => {
	if (maxCacheSize < 1) return {
		get: () => void 0,
		set: () => {}
	};
	let cacheSize = 0;
	let cache = Object.create(null);
	let previousCache = Object.create(null);
	const update = (key, value) => {
		cache[key] = value;
		cacheSize++;
		if (cacheSize > maxCacheSize) {
			cacheSize = 0;
			previousCache = cache;
			cache = Object.create(null);
		}
	};
	return {
		get(key) {
			let value = cache[key];
			if (value !== void 0) return value;
			if ((value = previousCache[key]) !== void 0) {
				update(key, value);
				return value;
			}
		},
		set(key, value) {
			if (key in cache) cache[key] = value;
			else update(key, value);
		}
	};
};
var IMPORTANT_MODIFIER = "!";
var MODIFIER_SEPARATOR = ":";
var EMPTY_MODIFIERS = [];
var createResultObject = (modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition, isExternal) => ({
	modifiers,
	hasImportantModifier,
	baseClassName,
	maybePostfixModifierPosition,
	isExternal
});
var createParseClassName = (config) => {
	const { prefix, experimentalParseClassName } = config;
	/**
	* Parse class name into parts.
	*
	* Inspired by `splitAtTopLevelOnly` used in Tailwind CSS
	* @see https://github.com/tailwindlabs/tailwindcss/blob/v3.2.2/src/util/splitAtTopLevelOnly.js
	*/
	let parseClassName = (className) => {
		const modifiers = [];
		let bracketDepth = 0;
		let parenDepth = 0;
		let modifierStart = 0;
		let postfixModifierPosition;
		const len = className.length;
		for (let index = 0; index < len; index++) {
			const currentCharacter = className[index];
			if (bracketDepth === 0 && parenDepth === 0) {
				if (currentCharacter === MODIFIER_SEPARATOR) {
					modifiers.push(className.slice(modifierStart, index));
					modifierStart = index + 1;
					continue;
				}
				if (currentCharacter === "/") {
					postfixModifierPosition = index;
					continue;
				}
			}
			if (currentCharacter === "[") bracketDepth++;
			else if (currentCharacter === "]") bracketDepth--;
			else if (currentCharacter === "(") parenDepth++;
			else if (currentCharacter === ")") parenDepth--;
		}
		const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.slice(modifierStart);
		let baseClassName = baseClassNameWithImportantModifier;
		let hasImportantModifier = false;
		if (baseClassNameWithImportantModifier.endsWith(IMPORTANT_MODIFIER)) {
			baseClassName = baseClassNameWithImportantModifier.slice(0, -1);
			hasImportantModifier = true;
		} else if (baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER)) {
			baseClassName = baseClassNameWithImportantModifier.slice(1);
			hasImportantModifier = true;
		}
		const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : void 0;
		return createResultObject(modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition);
	};
	if (prefix) {
		const fullPrefix = prefix + MODIFIER_SEPARATOR;
		const parseClassNameOriginal = parseClassName;
		parseClassName = (className) => className.startsWith(fullPrefix) ? parseClassNameOriginal(className.slice(fullPrefix.length)) : createResultObject(EMPTY_MODIFIERS, false, className, void 0, true);
	}
	if (experimentalParseClassName) {
		const parseClassNameOriginal = parseClassName;
		parseClassName = (className) => experimentalParseClassName({
			className,
			parseClassName: parseClassNameOriginal
		});
	}
	return parseClassName;
};
/**
* Sorts modifiers according to following schema:
* - Predefined modifiers are sorted alphabetically
* - When an arbitrary variant appears, it must be preserved which modifiers are before and after it
*/
var createSortModifiers = (config) => {
	const modifierWeights = /* @__PURE__ */ new Map();
	config.orderSensitiveModifiers.forEach((mod, index) => {
		modifierWeights.set(mod, 1e6 + index);
	});
	return (modifiers) => {
		const result = [];
		let currentSegment = [];
		for (let i = 0; i < modifiers.length; i++) {
			const modifier = modifiers[i];
			const isArbitrary = modifier[0] === "[";
			const isOrderSensitive = modifierWeights.has(modifier);
			if (isArbitrary || isOrderSensitive) {
				if (currentSegment.length > 0) {
					currentSegment.sort();
					result.push(...currentSegment);
					currentSegment = [];
				}
				result.push(modifier);
			} else currentSegment.push(modifier);
		}
		if (currentSegment.length > 0) {
			currentSegment.sort();
			result.push(...currentSegment);
		}
		return result;
	};
};
var createConfigUtils = (config) => ({
	cache: createLruCache(config.cacheSize),
	parseClassName: createParseClassName(config),
	sortModifiers: createSortModifiers(config),
	...createClassGroupUtils(config)
});
var SPLIT_CLASSES_REGEX = /\s+/;
var mergeClassList = (classList, configUtils) => {
	const { parseClassName, getClassGroupId, getConflictingClassGroupIds, sortModifiers } = configUtils;
	/**
	* Set of classGroupIds in following format:
	* `{importantModifier}{variantModifiers}{classGroupId}`
	* @example 'float'
	* @example 'hover:focus:bg-color'
	* @example 'md:!pr'
	*/
	const classGroupsInConflict = [];
	const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
	let result = "";
	for (let index = classNames.length - 1; index >= 0; index -= 1) {
		const originalClassName = classNames[index];
		const { isExternal, modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition } = parseClassName(originalClassName);
		if (isExternal) {
			result = originalClassName + (result.length > 0 ? " " + result : result);
			continue;
		}
		let hasPostfixModifier = !!maybePostfixModifierPosition;
		let classGroupId = getClassGroupId(hasPostfixModifier ? baseClassName.substring(0, maybePostfixModifierPosition) : baseClassName);
		if (!classGroupId) {
			if (!hasPostfixModifier) {
				result = originalClassName + (result.length > 0 ? " " + result : result);
				continue;
			}
			classGroupId = getClassGroupId(baseClassName);
			if (!classGroupId) {
				result = originalClassName + (result.length > 0 ? " " + result : result);
				continue;
			}
			hasPostfixModifier = false;
		}
		const variantModifier = modifiers.length === 0 ? "" : modifiers.length === 1 ? modifiers[0] : sortModifiers(modifiers).join(":");
		const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER : variantModifier;
		const classId = modifierId + classGroupId;
		if (classGroupsInConflict.indexOf(classId) > -1) continue;
		classGroupsInConflict.push(classId);
		const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
		for (let i = 0; i < conflictGroups.length; ++i) {
			const group = conflictGroups[i];
			classGroupsInConflict.push(modifierId + group);
		}
		result = originalClassName + (result.length > 0 ? " " + result : result);
	}
	return result;
};
/**
* The code in this file is copied from https://github.com/lukeed/clsx and modified to suit the needs of tailwind-merge better.
*
* Specifically:
* - Runtime code from https://github.com/lukeed/clsx/blob/v1.2.1/src/index.js
* - TypeScript types from https://github.com/lukeed/clsx/blob/v1.2.1/clsx.d.ts
*
* Original code has MIT license: Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
*/
var twJoin = (...classLists) => {
	let index = 0;
	let argument;
	let resolvedValue;
	let string = "";
	while (index < classLists.length) if (argument = classLists[index++]) {
		if (resolvedValue = toValue(argument)) {
			string && (string += " ");
			string += resolvedValue;
		}
	}
	return string;
};
var toValue = (mix) => {
	if (typeof mix === "string") return mix;
	let resolvedValue;
	let string = "";
	for (let k = 0; k < mix.length; k++) if (mix[k]) {
		if (resolvedValue = toValue(mix[k])) {
			string && (string += " ");
			string += resolvedValue;
		}
	}
	return string;
};
var createTailwindMerge = (createConfigFirst, ...createConfigRest) => {
	let configUtils;
	let cacheGet;
	let cacheSet;
	let functionToCall;
	const initTailwindMerge = (classList) => {
		configUtils = createConfigUtils(createConfigRest.reduce((previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig), createConfigFirst()));
		cacheGet = configUtils.cache.get;
		cacheSet = configUtils.cache.set;
		functionToCall = tailwindMerge;
		return tailwindMerge(classList);
	};
	const tailwindMerge = (classList) => {
		const cachedResult = cacheGet(classList);
		if (cachedResult) return cachedResult;
		const result = mergeClassList(classList, configUtils);
		cacheSet(classList, result);
		return result;
	};
	functionToCall = initTailwindMerge;
	return (...args) => functionToCall(twJoin(...args));
};
var fallbackThemeArr = [];
var fromTheme = (key) => {
	const themeGetter = (theme) => theme[key] || fallbackThemeArr;
	themeGetter.isThemeGetter = true;
	return themeGetter;
};
var arbitraryValueRegex = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
var arbitraryVariableRegex = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
var fractionRegex = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/;
var tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
var lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
var colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
var shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
var imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
var isFraction = (value) => fractionRegex.test(value);
var isNumber = (value) => !!value && !Number.isNaN(Number(value));
var isInteger = (value) => !!value && Number.isInteger(Number(value));
var isPercent = (value) => value.endsWith("%") && isNumber(value.slice(0, -1));
var isTshirtSize = (value) => tshirtUnitRegex.test(value);
var isAny = () => true;
var isLengthOnly = (value) => lengthUnitRegex.test(value) && !colorFunctionRegex.test(value);
var isNever = () => false;
var isShadow = (value) => shadowRegex.test(value);
var isImage = (value) => imageRegex.test(value);
var isAnyNonArbitrary = (value) => !isArbitraryValue(value) && !isArbitraryVariable(value);
var isArbitrarySize = (value) => getIsArbitraryValue(value, isLabelSize, isNever);
var isArbitraryValue = (value) => arbitraryValueRegex.test(value);
var isArbitraryLength = (value) => getIsArbitraryValue(value, isLabelLength, isLengthOnly);
var isArbitraryNumber = (value) => getIsArbitraryValue(value, isLabelNumber, isNumber);
var isArbitraryWeight = (value) => getIsArbitraryValue(value, isLabelWeight, isAny);
var isArbitraryFamilyName = (value) => getIsArbitraryValue(value, isLabelFamilyName, isNever);
var isArbitraryPosition = (value) => getIsArbitraryValue(value, isLabelPosition, isNever);
var isArbitraryImage = (value) => getIsArbitraryValue(value, isLabelImage, isImage);
var isArbitraryShadow = (value) => getIsArbitraryValue(value, isLabelShadow, isShadow);
var isArbitraryVariable = (value) => arbitraryVariableRegex.test(value);
var isArbitraryVariableLength = (value) => getIsArbitraryVariable(value, isLabelLength);
var isArbitraryVariableFamilyName = (value) => getIsArbitraryVariable(value, isLabelFamilyName);
var isArbitraryVariablePosition = (value) => getIsArbitraryVariable(value, isLabelPosition);
var isArbitraryVariableSize = (value) => getIsArbitraryVariable(value, isLabelSize);
var isArbitraryVariableImage = (value) => getIsArbitraryVariable(value, isLabelImage);
var isArbitraryVariableShadow = (value) => getIsArbitraryVariable(value, isLabelShadow, true);
var isArbitraryVariableWeight = (value) => getIsArbitraryVariable(value, isLabelWeight, true);
var getIsArbitraryValue = (value, testLabel, testValue) => {
	const result = arbitraryValueRegex.exec(value);
	if (result) {
		if (result[1]) return testLabel(result[1]);
		return testValue(result[2]);
	}
	return false;
};
var getIsArbitraryVariable = (value, testLabel, shouldMatchNoLabel = false) => {
	const result = arbitraryVariableRegex.exec(value);
	if (result) {
		if (result[1]) return testLabel(result[1]);
		return shouldMatchNoLabel;
	}
	return false;
};
var isLabelPosition = (label) => label === "position" || label === "percentage";
var isLabelImage = (label) => label === "image" || label === "url";
var isLabelSize = (label) => label === "length" || label === "size" || label === "bg-size";
var isLabelLength = (label) => label === "length";
var isLabelNumber = (label) => label === "number";
var isLabelFamilyName = (label) => label === "family-name";
var isLabelWeight = (label) => label === "number" || label === "weight";
var isLabelShadow = (label) => label === "shadow";
var getDefaultConfig = () => {
	/**
	* Theme getters for theme variable namespaces
	* @see https://tailwindcss.com/docs/theme#theme-variable-namespaces
	*/
	const themeColor = fromTheme("color");
	const themeFont = fromTheme("font");
	const themeText = fromTheme("text");
	const themeFontWeight = fromTheme("font-weight");
	const themeTracking = fromTheme("tracking");
	const themeLeading = fromTheme("leading");
	const themeBreakpoint = fromTheme("breakpoint");
	const themeContainer = fromTheme("container");
	const themeSpacing = fromTheme("spacing");
	const themeRadius = fromTheme("radius");
	const themeShadow = fromTheme("shadow");
	const themeInsetShadow = fromTheme("inset-shadow");
	const themeTextShadow = fromTheme("text-shadow");
	const themeDropShadow = fromTheme("drop-shadow");
	const themeBlur = fromTheme("blur");
	const themePerspective = fromTheme("perspective");
	const themeAspect = fromTheme("aspect");
	const themeEase = fromTheme("ease");
	const themeAnimate = fromTheme("animate");
	/**
	* Helpers to avoid repeating the same scales
	*
	* We use functions that create a new array every time they're called instead of static arrays.
	* This ensures that users who modify any scale by mutating the array (e.g. with `array.push(element)`) don't accidentally mutate arrays in other parts of the config.
	*/
	const scaleBreak = () => [
		"auto",
		"avoid",
		"all",
		"avoid-page",
		"page",
		"left",
		"right",
		"column"
	];
	const scalePosition = () => [
		"center",
		"top",
		"bottom",
		"left",
		"right",
		"top-left",
		"left-top",
		"top-right",
		"right-top",
		"bottom-right",
		"right-bottom",
		"bottom-left",
		"left-bottom"
	];
	const scalePositionWithArbitrary = () => [
		...scalePosition(),
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleOverflow = () => [
		"auto",
		"hidden",
		"clip",
		"visible",
		"scroll"
	];
	const scaleOverscroll = () => [
		"auto",
		"contain",
		"none"
	];
	const scaleUnambiguousSpacing = () => [
		isArbitraryVariable,
		isArbitraryValue,
		themeSpacing
	];
	const scaleInset = () => [
		isFraction,
		"full",
		"auto",
		...scaleUnambiguousSpacing()
	];
	const scaleGridTemplateColsRows = () => [
		isInteger,
		"none",
		"subgrid",
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleGridColRowStartAndEnd = () => [
		"auto",
		{ span: [
			"full",
			isInteger,
			isArbitraryVariable,
			isArbitraryValue
		] },
		isInteger,
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleGridColRowStartOrEnd = () => [
		isInteger,
		"auto",
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleGridAutoColsRows = () => [
		"auto",
		"min",
		"max",
		"fr",
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleAlignPrimaryAxis = () => [
		"start",
		"end",
		"center",
		"between",
		"around",
		"evenly",
		"stretch",
		"baseline",
		"center-safe",
		"end-safe"
	];
	const scaleAlignSecondaryAxis = () => [
		"start",
		"end",
		"center",
		"stretch",
		"center-safe",
		"end-safe"
	];
	const scaleMargin = () => ["auto", ...scaleUnambiguousSpacing()];
	const scaleSizing = () => [
		isFraction,
		"auto",
		"full",
		"dvw",
		"dvh",
		"lvw",
		"lvh",
		"svw",
		"svh",
		"min",
		"max",
		"fit",
		...scaleUnambiguousSpacing()
	];
	const scaleSizingInline = () => [
		isFraction,
		"screen",
		"full",
		"dvw",
		"lvw",
		"svw",
		"min",
		"max",
		"fit",
		...scaleUnambiguousSpacing()
	];
	const scaleSizingBlock = () => [
		isFraction,
		"screen",
		"full",
		"lh",
		"dvh",
		"lvh",
		"svh",
		"min",
		"max",
		"fit",
		...scaleUnambiguousSpacing()
	];
	const scaleColor = () => [
		themeColor,
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleBgPosition = () => [
		...scalePosition(),
		isArbitraryVariablePosition,
		isArbitraryPosition,
		{ position: [isArbitraryVariable, isArbitraryValue] }
	];
	const scaleBgRepeat = () => ["no-repeat", { repeat: [
		"",
		"x",
		"y",
		"space",
		"round"
	] }];
	const scaleBgSize = () => [
		"auto",
		"cover",
		"contain",
		isArbitraryVariableSize,
		isArbitrarySize,
		{ size: [isArbitraryVariable, isArbitraryValue] }
	];
	const scaleGradientStopPosition = () => [
		isPercent,
		isArbitraryVariableLength,
		isArbitraryLength
	];
	const scaleRadius = () => [
		"",
		"none",
		"full",
		themeRadius,
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleBorderWidth = () => [
		"",
		isNumber,
		isArbitraryVariableLength,
		isArbitraryLength
	];
	const scaleLineStyle = () => [
		"solid",
		"dashed",
		"dotted",
		"double"
	];
	const scaleBlendMode = () => [
		"normal",
		"multiply",
		"screen",
		"overlay",
		"darken",
		"lighten",
		"color-dodge",
		"color-burn",
		"hard-light",
		"soft-light",
		"difference",
		"exclusion",
		"hue",
		"saturation",
		"color",
		"luminosity"
	];
	const scaleMaskImagePosition = () => [
		isNumber,
		isPercent,
		isArbitraryVariablePosition,
		isArbitraryPosition
	];
	const scaleBlur = () => [
		"",
		"none",
		themeBlur,
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleRotate = () => [
		"none",
		isNumber,
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleScale = () => [
		"none",
		isNumber,
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleSkew = () => [
		isNumber,
		isArbitraryVariable,
		isArbitraryValue
	];
	const scaleTranslate = () => [
		isFraction,
		"full",
		...scaleUnambiguousSpacing()
	];
	return {
		cacheSize: 500,
		theme: {
			animate: [
				"spin",
				"ping",
				"pulse",
				"bounce"
			],
			aspect: ["video"],
			blur: [isTshirtSize],
			breakpoint: [isTshirtSize],
			color: [isAny],
			container: [isTshirtSize],
			"drop-shadow": [isTshirtSize],
			ease: [
				"in",
				"out",
				"in-out"
			],
			font: [isAnyNonArbitrary],
			"font-weight": [
				"thin",
				"extralight",
				"light",
				"normal",
				"medium",
				"semibold",
				"bold",
				"extrabold",
				"black"
			],
			"inset-shadow": [isTshirtSize],
			leading: [
				"none",
				"tight",
				"snug",
				"normal",
				"relaxed",
				"loose"
			],
			perspective: [
				"dramatic",
				"near",
				"normal",
				"midrange",
				"distant",
				"none"
			],
			radius: [isTshirtSize],
			shadow: [isTshirtSize],
			spacing: ["px", isNumber],
			text: [isTshirtSize],
			"text-shadow": [isTshirtSize],
			tracking: [
				"tighter",
				"tight",
				"normal",
				"wide",
				"wider",
				"widest"
			]
		},
		classGroups: {
			aspect: [{ aspect: [
				"auto",
				"square",
				isFraction,
				isArbitraryValue,
				isArbitraryVariable,
				themeAspect
			] }],
			container: ["container"],
			columns: [{ columns: [
				isNumber,
				isArbitraryValue,
				isArbitraryVariable,
				themeContainer
			] }],
			"break-after": [{ "break-after": scaleBreak() }],
			"break-before": [{ "break-before": scaleBreak() }],
			"break-inside": [{ "break-inside": [
				"auto",
				"avoid",
				"avoid-page",
				"avoid-column"
			] }],
			"box-decoration": [{ "box-decoration": ["slice", "clone"] }],
			box: [{ box: ["border", "content"] }],
			display: [
				"block",
				"inline-block",
				"inline",
				"flex",
				"inline-flex",
				"table",
				"inline-table",
				"table-caption",
				"table-cell",
				"table-column",
				"table-column-group",
				"table-footer-group",
				"table-header-group",
				"table-row-group",
				"table-row",
				"flow-root",
				"grid",
				"inline-grid",
				"contents",
				"list-item",
				"hidden"
			],
			sr: ["sr-only", "not-sr-only"],
			float: [{ float: [
				"right",
				"left",
				"none",
				"start",
				"end"
			] }],
			clear: [{ clear: [
				"left",
				"right",
				"both",
				"none",
				"start",
				"end"
			] }],
			isolation: ["isolate", "isolation-auto"],
			"object-fit": [{ object: [
				"contain",
				"cover",
				"fill",
				"none",
				"scale-down"
			] }],
			"object-position": [{ object: scalePositionWithArbitrary() }],
			overflow: [{ overflow: scaleOverflow() }],
			"overflow-x": [{ "overflow-x": scaleOverflow() }],
			"overflow-y": [{ "overflow-y": scaleOverflow() }],
			overscroll: [{ overscroll: scaleOverscroll() }],
			"overscroll-x": [{ "overscroll-x": scaleOverscroll() }],
			"overscroll-y": [{ "overscroll-y": scaleOverscroll() }],
			position: [
				"static",
				"fixed",
				"absolute",
				"relative",
				"sticky"
			],
			inset: [{ inset: scaleInset() }],
			"inset-x": [{ "inset-x": scaleInset() }],
			"inset-y": [{ "inset-y": scaleInset() }],
			start: [{
				"inset-s": scaleInset(),
				start: scaleInset()
			}],
			end: [{
				"inset-e": scaleInset(),
				end: scaleInset()
			}],
			"inset-bs": [{ "inset-bs": scaleInset() }],
			"inset-be": [{ "inset-be": scaleInset() }],
			top: [{ top: scaleInset() }],
			right: [{ right: scaleInset() }],
			bottom: [{ bottom: scaleInset() }],
			left: [{ left: scaleInset() }],
			visibility: [
				"visible",
				"invisible",
				"collapse"
			],
			z: [{ z: [
				isInteger,
				"auto",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			basis: [{ basis: [
				isFraction,
				"full",
				"auto",
				themeContainer,
				...scaleUnambiguousSpacing()
			] }],
			"flex-direction": [{ flex: [
				"row",
				"row-reverse",
				"col",
				"col-reverse"
			] }],
			"flex-wrap": [{ flex: [
				"nowrap",
				"wrap",
				"wrap-reverse"
			] }],
			flex: [{ flex: [
				isNumber,
				isFraction,
				"auto",
				"initial",
				"none",
				isArbitraryValue
			] }],
			grow: [{ grow: [
				"",
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			shrink: [{ shrink: [
				"",
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			order: [{ order: [
				isInteger,
				"first",
				"last",
				"none",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"grid-cols": [{ "grid-cols": scaleGridTemplateColsRows() }],
			"col-start-end": [{ col: scaleGridColRowStartAndEnd() }],
			"col-start": [{ "col-start": scaleGridColRowStartOrEnd() }],
			"col-end": [{ "col-end": scaleGridColRowStartOrEnd() }],
			"grid-rows": [{ "grid-rows": scaleGridTemplateColsRows() }],
			"row-start-end": [{ row: scaleGridColRowStartAndEnd() }],
			"row-start": [{ "row-start": scaleGridColRowStartOrEnd() }],
			"row-end": [{ "row-end": scaleGridColRowStartOrEnd() }],
			"grid-flow": [{ "grid-flow": [
				"row",
				"col",
				"dense",
				"row-dense",
				"col-dense"
			] }],
			"auto-cols": [{ "auto-cols": scaleGridAutoColsRows() }],
			"auto-rows": [{ "auto-rows": scaleGridAutoColsRows() }],
			gap: [{ gap: scaleUnambiguousSpacing() }],
			"gap-x": [{ "gap-x": scaleUnambiguousSpacing() }],
			"gap-y": [{ "gap-y": scaleUnambiguousSpacing() }],
			"justify-content": [{ justify: [...scaleAlignPrimaryAxis(), "normal"] }],
			"justify-items": [{ "justify-items": [...scaleAlignSecondaryAxis(), "normal"] }],
			"justify-self": [{ "justify-self": ["auto", ...scaleAlignSecondaryAxis()] }],
			"align-content": [{ content: ["normal", ...scaleAlignPrimaryAxis()] }],
			"align-items": [{ items: [...scaleAlignSecondaryAxis(), { baseline: ["", "last"] }] }],
			"align-self": [{ self: [
				"auto",
				...scaleAlignSecondaryAxis(),
				{ baseline: ["", "last"] }
			] }],
			"place-content": [{ "place-content": scaleAlignPrimaryAxis() }],
			"place-items": [{ "place-items": [...scaleAlignSecondaryAxis(), "baseline"] }],
			"place-self": [{ "place-self": ["auto", ...scaleAlignSecondaryAxis()] }],
			p: [{ p: scaleUnambiguousSpacing() }],
			px: [{ px: scaleUnambiguousSpacing() }],
			py: [{ py: scaleUnambiguousSpacing() }],
			ps: [{ ps: scaleUnambiguousSpacing() }],
			pe: [{ pe: scaleUnambiguousSpacing() }],
			pbs: [{ pbs: scaleUnambiguousSpacing() }],
			pbe: [{ pbe: scaleUnambiguousSpacing() }],
			pt: [{ pt: scaleUnambiguousSpacing() }],
			pr: [{ pr: scaleUnambiguousSpacing() }],
			pb: [{ pb: scaleUnambiguousSpacing() }],
			pl: [{ pl: scaleUnambiguousSpacing() }],
			m: [{ m: scaleMargin() }],
			mx: [{ mx: scaleMargin() }],
			my: [{ my: scaleMargin() }],
			ms: [{ ms: scaleMargin() }],
			me: [{ me: scaleMargin() }],
			mbs: [{ mbs: scaleMargin() }],
			mbe: [{ mbe: scaleMargin() }],
			mt: [{ mt: scaleMargin() }],
			mr: [{ mr: scaleMargin() }],
			mb: [{ mb: scaleMargin() }],
			ml: [{ ml: scaleMargin() }],
			"space-x": [{ "space-x": scaleUnambiguousSpacing() }],
			"space-x-reverse": ["space-x-reverse"],
			"space-y": [{ "space-y": scaleUnambiguousSpacing() }],
			"space-y-reverse": ["space-y-reverse"],
			size: [{ size: scaleSizing() }],
			"inline-size": [{ inline: ["auto", ...scaleSizingInline()] }],
			"min-inline-size": [{ "min-inline": ["auto", ...scaleSizingInline()] }],
			"max-inline-size": [{ "max-inline": ["none", ...scaleSizingInline()] }],
			"block-size": [{ block: ["auto", ...scaleSizingBlock()] }],
			"min-block-size": [{ "min-block": ["auto", ...scaleSizingBlock()] }],
			"max-block-size": [{ "max-block": ["none", ...scaleSizingBlock()] }],
			w: [{ w: [
				themeContainer,
				"screen",
				...scaleSizing()
			] }],
			"min-w": [{ "min-w": [
				themeContainer,
				"screen",
				"none",
				...scaleSizing()
			] }],
			"max-w": [{ "max-w": [
				themeContainer,
				"screen",
				"none",
				"prose",
				{ screen: [themeBreakpoint] },
				...scaleSizing()
			] }],
			h: [{ h: [
				"screen",
				"lh",
				...scaleSizing()
			] }],
			"min-h": [{ "min-h": [
				"screen",
				"lh",
				"none",
				...scaleSizing()
			] }],
			"max-h": [{ "max-h": [
				"screen",
				"lh",
				...scaleSizing()
			] }],
			"font-size": [{ text: [
				"base",
				themeText,
				isArbitraryVariableLength,
				isArbitraryLength
			] }],
			"font-smoothing": ["antialiased", "subpixel-antialiased"],
			"font-style": ["italic", "not-italic"],
			"font-weight": [{ font: [
				themeFontWeight,
				isArbitraryVariableWeight,
				isArbitraryWeight
			] }],
			"font-stretch": [{ "font-stretch": [
				"ultra-condensed",
				"extra-condensed",
				"condensed",
				"semi-condensed",
				"normal",
				"semi-expanded",
				"expanded",
				"extra-expanded",
				"ultra-expanded",
				isPercent,
				isArbitraryValue
			] }],
			"font-family": [{ font: [
				isArbitraryVariableFamilyName,
				isArbitraryFamilyName,
				themeFont
			] }],
			"font-features": [{ "font-features": [isArbitraryValue] }],
			"fvn-normal": ["normal-nums"],
			"fvn-ordinal": ["ordinal"],
			"fvn-slashed-zero": ["slashed-zero"],
			"fvn-figure": ["lining-nums", "oldstyle-nums"],
			"fvn-spacing": ["proportional-nums", "tabular-nums"],
			"fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
			tracking: [{ tracking: [
				themeTracking,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"line-clamp": [{ "line-clamp": [
				isNumber,
				"none",
				isArbitraryVariable,
				isArbitraryNumber
			] }],
			leading: [{ leading: [themeLeading, ...scaleUnambiguousSpacing()] }],
			"list-image": [{ "list-image": [
				"none",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"list-style-position": [{ list: ["inside", "outside"] }],
			"list-style-type": [{ list: [
				"disc",
				"decimal",
				"none",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"text-alignment": [{ text: [
				"left",
				"center",
				"right",
				"justify",
				"start",
				"end"
			] }],
			"placeholder-color": [{ placeholder: scaleColor() }],
			"text-color": [{ text: scaleColor() }],
			"text-decoration": [
				"underline",
				"overline",
				"line-through",
				"no-underline"
			],
			"text-decoration-style": [{ decoration: [...scaleLineStyle(), "wavy"] }],
			"text-decoration-thickness": [{ decoration: [
				isNumber,
				"from-font",
				"auto",
				isArbitraryVariable,
				isArbitraryLength
			] }],
			"text-decoration-color": [{ decoration: scaleColor() }],
			"underline-offset": [{ "underline-offset": [
				isNumber,
				"auto",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"text-transform": [
				"uppercase",
				"lowercase",
				"capitalize",
				"normal-case"
			],
			"text-overflow": [
				"truncate",
				"text-ellipsis",
				"text-clip"
			],
			"text-wrap": [{ text: [
				"wrap",
				"nowrap",
				"balance",
				"pretty"
			] }],
			indent: [{ indent: scaleUnambiguousSpacing() }],
			"vertical-align": [{ align: [
				"baseline",
				"top",
				"middle",
				"bottom",
				"text-top",
				"text-bottom",
				"sub",
				"super",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			whitespace: [{ whitespace: [
				"normal",
				"nowrap",
				"pre",
				"pre-line",
				"pre-wrap",
				"break-spaces"
			] }],
			break: [{ break: [
				"normal",
				"words",
				"all",
				"keep"
			] }],
			wrap: [{ wrap: [
				"break-word",
				"anywhere",
				"normal"
			] }],
			hyphens: [{ hyphens: [
				"none",
				"manual",
				"auto"
			] }],
			content: [{ content: [
				"none",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"bg-attachment": [{ bg: [
				"fixed",
				"local",
				"scroll"
			] }],
			"bg-clip": [{ "bg-clip": [
				"border",
				"padding",
				"content",
				"text"
			] }],
			"bg-origin": [{ "bg-origin": [
				"border",
				"padding",
				"content"
			] }],
			"bg-position": [{ bg: scaleBgPosition() }],
			"bg-repeat": [{ bg: scaleBgRepeat() }],
			"bg-size": [{ bg: scaleBgSize() }],
			"bg-image": [{ bg: [
				"none",
				{
					linear: [
						{ to: [
							"t",
							"tr",
							"r",
							"br",
							"b",
							"bl",
							"l",
							"tl"
						] },
						isInteger,
						isArbitraryVariable,
						isArbitraryValue
					],
					radial: [
						"",
						isArbitraryVariable,
						isArbitraryValue
					],
					conic: [
						isInteger,
						isArbitraryVariable,
						isArbitraryValue
					]
				},
				isArbitraryVariableImage,
				isArbitraryImage
			] }],
			"bg-color": [{ bg: scaleColor() }],
			"gradient-from-pos": [{ from: scaleGradientStopPosition() }],
			"gradient-via-pos": [{ via: scaleGradientStopPosition() }],
			"gradient-to-pos": [{ to: scaleGradientStopPosition() }],
			"gradient-from": [{ from: scaleColor() }],
			"gradient-via": [{ via: scaleColor() }],
			"gradient-to": [{ to: scaleColor() }],
			rounded: [{ rounded: scaleRadius() }],
			"rounded-s": [{ "rounded-s": scaleRadius() }],
			"rounded-e": [{ "rounded-e": scaleRadius() }],
			"rounded-t": [{ "rounded-t": scaleRadius() }],
			"rounded-r": [{ "rounded-r": scaleRadius() }],
			"rounded-b": [{ "rounded-b": scaleRadius() }],
			"rounded-l": [{ "rounded-l": scaleRadius() }],
			"rounded-ss": [{ "rounded-ss": scaleRadius() }],
			"rounded-se": [{ "rounded-se": scaleRadius() }],
			"rounded-ee": [{ "rounded-ee": scaleRadius() }],
			"rounded-es": [{ "rounded-es": scaleRadius() }],
			"rounded-tl": [{ "rounded-tl": scaleRadius() }],
			"rounded-tr": [{ "rounded-tr": scaleRadius() }],
			"rounded-br": [{ "rounded-br": scaleRadius() }],
			"rounded-bl": [{ "rounded-bl": scaleRadius() }],
			"border-w": [{ border: scaleBorderWidth() }],
			"border-w-x": [{ "border-x": scaleBorderWidth() }],
			"border-w-y": [{ "border-y": scaleBorderWidth() }],
			"border-w-s": [{ "border-s": scaleBorderWidth() }],
			"border-w-e": [{ "border-e": scaleBorderWidth() }],
			"border-w-bs": [{ "border-bs": scaleBorderWidth() }],
			"border-w-be": [{ "border-be": scaleBorderWidth() }],
			"border-w-t": [{ "border-t": scaleBorderWidth() }],
			"border-w-r": [{ "border-r": scaleBorderWidth() }],
			"border-w-b": [{ "border-b": scaleBorderWidth() }],
			"border-w-l": [{ "border-l": scaleBorderWidth() }],
			"divide-x": [{ "divide-x": scaleBorderWidth() }],
			"divide-x-reverse": ["divide-x-reverse"],
			"divide-y": [{ "divide-y": scaleBorderWidth() }],
			"divide-y-reverse": ["divide-y-reverse"],
			"border-style": [{ border: [
				...scaleLineStyle(),
				"hidden",
				"none"
			] }],
			"divide-style": [{ divide: [
				...scaleLineStyle(),
				"hidden",
				"none"
			] }],
			"border-color": [{ border: scaleColor() }],
			"border-color-x": [{ "border-x": scaleColor() }],
			"border-color-y": [{ "border-y": scaleColor() }],
			"border-color-s": [{ "border-s": scaleColor() }],
			"border-color-e": [{ "border-e": scaleColor() }],
			"border-color-bs": [{ "border-bs": scaleColor() }],
			"border-color-be": [{ "border-be": scaleColor() }],
			"border-color-t": [{ "border-t": scaleColor() }],
			"border-color-r": [{ "border-r": scaleColor() }],
			"border-color-b": [{ "border-b": scaleColor() }],
			"border-color-l": [{ "border-l": scaleColor() }],
			"divide-color": [{ divide: scaleColor() }],
			"outline-style": [{ outline: [
				...scaleLineStyle(),
				"none",
				"hidden"
			] }],
			"outline-offset": [{ "outline-offset": [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"outline-w": [{ outline: [
				"",
				isNumber,
				isArbitraryVariableLength,
				isArbitraryLength
			] }],
			"outline-color": [{ outline: scaleColor() }],
			shadow: [{ shadow: [
				"",
				"none",
				themeShadow,
				isArbitraryVariableShadow,
				isArbitraryShadow
			] }],
			"shadow-color": [{ shadow: scaleColor() }],
			"inset-shadow": [{ "inset-shadow": [
				"none",
				themeInsetShadow,
				isArbitraryVariableShadow,
				isArbitraryShadow
			] }],
			"inset-shadow-color": [{ "inset-shadow": scaleColor() }],
			"ring-w": [{ ring: scaleBorderWidth() }],
			"ring-w-inset": ["ring-inset"],
			"ring-color": [{ ring: scaleColor() }],
			"ring-offset-w": [{ "ring-offset": [isNumber, isArbitraryLength] }],
			"ring-offset-color": [{ "ring-offset": scaleColor() }],
			"inset-ring-w": [{ "inset-ring": scaleBorderWidth() }],
			"inset-ring-color": [{ "inset-ring": scaleColor() }],
			"text-shadow": [{ "text-shadow": [
				"none",
				themeTextShadow,
				isArbitraryVariableShadow,
				isArbitraryShadow
			] }],
			"text-shadow-color": [{ "text-shadow": scaleColor() }],
			opacity: [{ opacity: [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"mix-blend": [{ "mix-blend": [
				...scaleBlendMode(),
				"plus-darker",
				"plus-lighter"
			] }],
			"bg-blend": [{ "bg-blend": scaleBlendMode() }],
			"mask-clip": [{ "mask-clip": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }, "mask-no-clip"],
			"mask-composite": [{ mask: [
				"add",
				"subtract",
				"intersect",
				"exclude"
			] }],
			"mask-image-linear-pos": [{ "mask-linear": [isNumber] }],
			"mask-image-linear-from-pos": [{ "mask-linear-from": scaleMaskImagePosition() }],
			"mask-image-linear-to-pos": [{ "mask-linear-to": scaleMaskImagePosition() }],
			"mask-image-linear-from-color": [{ "mask-linear-from": scaleColor() }],
			"mask-image-linear-to-color": [{ "mask-linear-to": scaleColor() }],
			"mask-image-t-from-pos": [{ "mask-t-from": scaleMaskImagePosition() }],
			"mask-image-t-to-pos": [{ "mask-t-to": scaleMaskImagePosition() }],
			"mask-image-t-from-color": [{ "mask-t-from": scaleColor() }],
			"mask-image-t-to-color": [{ "mask-t-to": scaleColor() }],
			"mask-image-r-from-pos": [{ "mask-r-from": scaleMaskImagePosition() }],
			"mask-image-r-to-pos": [{ "mask-r-to": scaleMaskImagePosition() }],
			"mask-image-r-from-color": [{ "mask-r-from": scaleColor() }],
			"mask-image-r-to-color": [{ "mask-r-to": scaleColor() }],
			"mask-image-b-from-pos": [{ "mask-b-from": scaleMaskImagePosition() }],
			"mask-image-b-to-pos": [{ "mask-b-to": scaleMaskImagePosition() }],
			"mask-image-b-from-color": [{ "mask-b-from": scaleColor() }],
			"mask-image-b-to-color": [{ "mask-b-to": scaleColor() }],
			"mask-image-l-from-pos": [{ "mask-l-from": scaleMaskImagePosition() }],
			"mask-image-l-to-pos": [{ "mask-l-to": scaleMaskImagePosition() }],
			"mask-image-l-from-color": [{ "mask-l-from": scaleColor() }],
			"mask-image-l-to-color": [{ "mask-l-to": scaleColor() }],
			"mask-image-x-from-pos": [{ "mask-x-from": scaleMaskImagePosition() }],
			"mask-image-x-to-pos": [{ "mask-x-to": scaleMaskImagePosition() }],
			"mask-image-x-from-color": [{ "mask-x-from": scaleColor() }],
			"mask-image-x-to-color": [{ "mask-x-to": scaleColor() }],
			"mask-image-y-from-pos": [{ "mask-y-from": scaleMaskImagePosition() }],
			"mask-image-y-to-pos": [{ "mask-y-to": scaleMaskImagePosition() }],
			"mask-image-y-from-color": [{ "mask-y-from": scaleColor() }],
			"mask-image-y-to-color": [{ "mask-y-to": scaleColor() }],
			"mask-image-radial": [{ "mask-radial": [isArbitraryVariable, isArbitraryValue] }],
			"mask-image-radial-from-pos": [{ "mask-radial-from": scaleMaskImagePosition() }],
			"mask-image-radial-to-pos": [{ "mask-radial-to": scaleMaskImagePosition() }],
			"mask-image-radial-from-color": [{ "mask-radial-from": scaleColor() }],
			"mask-image-radial-to-color": [{ "mask-radial-to": scaleColor() }],
			"mask-image-radial-shape": [{ "mask-radial": ["circle", "ellipse"] }],
			"mask-image-radial-size": [{ "mask-radial": [{
				closest: ["side", "corner"],
				farthest: ["side", "corner"]
			}] }],
			"mask-image-radial-pos": [{ "mask-radial-at": scalePosition() }],
			"mask-image-conic-pos": [{ "mask-conic": [isNumber] }],
			"mask-image-conic-from-pos": [{ "mask-conic-from": scaleMaskImagePosition() }],
			"mask-image-conic-to-pos": [{ "mask-conic-to": scaleMaskImagePosition() }],
			"mask-image-conic-from-color": [{ "mask-conic-from": scaleColor() }],
			"mask-image-conic-to-color": [{ "mask-conic-to": scaleColor() }],
			"mask-mode": [{ mask: [
				"alpha",
				"luminance",
				"match"
			] }],
			"mask-origin": [{ "mask-origin": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }],
			"mask-position": [{ mask: scaleBgPosition() }],
			"mask-repeat": [{ mask: scaleBgRepeat() }],
			"mask-size": [{ mask: scaleBgSize() }],
			"mask-type": [{ "mask-type": ["alpha", "luminance"] }],
			"mask-image": [{ mask: [
				"none",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			filter: [{ filter: [
				"",
				"none",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			blur: [{ blur: scaleBlur() }],
			brightness: [{ brightness: [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			contrast: [{ contrast: [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"drop-shadow": [{ "drop-shadow": [
				"",
				"none",
				themeDropShadow,
				isArbitraryVariableShadow,
				isArbitraryShadow
			] }],
			"drop-shadow-color": [{ "drop-shadow": scaleColor() }],
			grayscale: [{ grayscale: [
				"",
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"hue-rotate": [{ "hue-rotate": [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			invert: [{ invert: [
				"",
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			saturate: [{ saturate: [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			sepia: [{ sepia: [
				"",
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"backdrop-filter": [{ "backdrop-filter": [
				"",
				"none",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"backdrop-blur": [{ "backdrop-blur": scaleBlur() }],
			"backdrop-brightness": [{ "backdrop-brightness": [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"backdrop-contrast": [{ "backdrop-contrast": [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"backdrop-grayscale": [{ "backdrop-grayscale": [
				"",
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"backdrop-invert": [{ "backdrop-invert": [
				"",
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"backdrop-opacity": [{ "backdrop-opacity": [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"backdrop-saturate": [{ "backdrop-saturate": [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"backdrop-sepia": [{ "backdrop-sepia": [
				"",
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"border-collapse": [{ border: ["collapse", "separate"] }],
			"border-spacing": [{ "border-spacing": scaleUnambiguousSpacing() }],
			"border-spacing-x": [{ "border-spacing-x": scaleUnambiguousSpacing() }],
			"border-spacing-y": [{ "border-spacing-y": scaleUnambiguousSpacing() }],
			"table-layout": [{ table: ["auto", "fixed"] }],
			caption: [{ caption: ["top", "bottom"] }],
			transition: [{ transition: [
				"",
				"all",
				"colors",
				"opacity",
				"shadow",
				"transform",
				"none",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"transition-behavior": [{ transition: ["normal", "discrete"] }],
			duration: [{ duration: [
				isNumber,
				"initial",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			ease: [{ ease: [
				"linear",
				"initial",
				themeEase,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			delay: [{ delay: [
				isNumber,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			animate: [{ animate: [
				"none",
				themeAnimate,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			backface: [{ backface: ["hidden", "visible"] }],
			perspective: [{ perspective: [
				themePerspective,
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"perspective-origin": [{ "perspective-origin": scalePositionWithArbitrary() }],
			rotate: [{ rotate: scaleRotate() }],
			"rotate-x": [{ "rotate-x": scaleRotate() }],
			"rotate-y": [{ "rotate-y": scaleRotate() }],
			"rotate-z": [{ "rotate-z": scaleRotate() }],
			scale: [{ scale: scaleScale() }],
			"scale-x": [{ "scale-x": scaleScale() }],
			"scale-y": [{ "scale-y": scaleScale() }],
			"scale-z": [{ "scale-z": scaleScale() }],
			"scale-3d": ["scale-3d"],
			skew: [{ skew: scaleSkew() }],
			"skew-x": [{ "skew-x": scaleSkew() }],
			"skew-y": [{ "skew-y": scaleSkew() }],
			transform: [{ transform: [
				isArbitraryVariable,
				isArbitraryValue,
				"",
				"none",
				"gpu",
				"cpu"
			] }],
			"transform-origin": [{ origin: scalePositionWithArbitrary() }],
			"transform-style": [{ transform: ["3d", "flat"] }],
			translate: [{ translate: scaleTranslate() }],
			"translate-x": [{ "translate-x": scaleTranslate() }],
			"translate-y": [{ "translate-y": scaleTranslate() }],
			"translate-z": [{ "translate-z": scaleTranslate() }],
			"translate-none": ["translate-none"],
			accent: [{ accent: scaleColor() }],
			appearance: [{ appearance: ["none", "auto"] }],
			"caret-color": [{ caret: scaleColor() }],
			"color-scheme": [{ scheme: [
				"normal",
				"dark",
				"light",
				"light-dark",
				"only-dark",
				"only-light"
			] }],
			cursor: [{ cursor: [
				"auto",
				"default",
				"pointer",
				"wait",
				"text",
				"move",
				"help",
				"not-allowed",
				"none",
				"context-menu",
				"progress",
				"cell",
				"crosshair",
				"vertical-text",
				"alias",
				"copy",
				"no-drop",
				"grab",
				"grabbing",
				"all-scroll",
				"col-resize",
				"row-resize",
				"n-resize",
				"e-resize",
				"s-resize",
				"w-resize",
				"ne-resize",
				"nw-resize",
				"se-resize",
				"sw-resize",
				"ew-resize",
				"ns-resize",
				"nesw-resize",
				"nwse-resize",
				"zoom-in",
				"zoom-out",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			"field-sizing": [{ "field-sizing": ["fixed", "content"] }],
			"pointer-events": [{ "pointer-events": ["auto", "none"] }],
			resize: [{ resize: [
				"none",
				"",
				"y",
				"x"
			] }],
			"scroll-behavior": [{ scroll: ["auto", "smooth"] }],
			"scroll-m": [{ "scroll-m": scaleUnambiguousSpacing() }],
			"scroll-mx": [{ "scroll-mx": scaleUnambiguousSpacing() }],
			"scroll-my": [{ "scroll-my": scaleUnambiguousSpacing() }],
			"scroll-ms": [{ "scroll-ms": scaleUnambiguousSpacing() }],
			"scroll-me": [{ "scroll-me": scaleUnambiguousSpacing() }],
			"scroll-mbs": [{ "scroll-mbs": scaleUnambiguousSpacing() }],
			"scroll-mbe": [{ "scroll-mbe": scaleUnambiguousSpacing() }],
			"scroll-mt": [{ "scroll-mt": scaleUnambiguousSpacing() }],
			"scroll-mr": [{ "scroll-mr": scaleUnambiguousSpacing() }],
			"scroll-mb": [{ "scroll-mb": scaleUnambiguousSpacing() }],
			"scroll-ml": [{ "scroll-ml": scaleUnambiguousSpacing() }],
			"scroll-p": [{ "scroll-p": scaleUnambiguousSpacing() }],
			"scroll-px": [{ "scroll-px": scaleUnambiguousSpacing() }],
			"scroll-py": [{ "scroll-py": scaleUnambiguousSpacing() }],
			"scroll-ps": [{ "scroll-ps": scaleUnambiguousSpacing() }],
			"scroll-pe": [{ "scroll-pe": scaleUnambiguousSpacing() }],
			"scroll-pbs": [{ "scroll-pbs": scaleUnambiguousSpacing() }],
			"scroll-pbe": [{ "scroll-pbe": scaleUnambiguousSpacing() }],
			"scroll-pt": [{ "scroll-pt": scaleUnambiguousSpacing() }],
			"scroll-pr": [{ "scroll-pr": scaleUnambiguousSpacing() }],
			"scroll-pb": [{ "scroll-pb": scaleUnambiguousSpacing() }],
			"scroll-pl": [{ "scroll-pl": scaleUnambiguousSpacing() }],
			"snap-align": [{ snap: [
				"start",
				"end",
				"center",
				"align-none"
			] }],
			"snap-stop": [{ snap: ["normal", "always"] }],
			"snap-type": [{ snap: [
				"none",
				"x",
				"y",
				"both"
			] }],
			"snap-strictness": [{ snap: ["mandatory", "proximity"] }],
			touch: [{ touch: [
				"auto",
				"none",
				"manipulation"
			] }],
			"touch-x": [{ "touch-pan": [
				"x",
				"left",
				"right"
			] }],
			"touch-y": [{ "touch-pan": [
				"y",
				"up",
				"down"
			] }],
			"touch-pz": ["touch-pinch-zoom"],
			select: [{ select: [
				"none",
				"text",
				"all",
				"auto"
			] }],
			"will-change": [{ "will-change": [
				"auto",
				"scroll",
				"contents",
				"transform",
				isArbitraryVariable,
				isArbitraryValue
			] }],
			fill: [{ fill: ["none", ...scaleColor()] }],
			"stroke-w": [{ stroke: [
				isNumber,
				isArbitraryVariableLength,
				isArbitraryLength,
				isArbitraryNumber
			] }],
			stroke: [{ stroke: ["none", ...scaleColor()] }],
			"forced-color-adjust": [{ "forced-color-adjust": ["auto", "none"] }]
		},
		conflictingClassGroups: {
			overflow: ["overflow-x", "overflow-y"],
			overscroll: ["overscroll-x", "overscroll-y"],
			inset: [
				"inset-x",
				"inset-y",
				"inset-bs",
				"inset-be",
				"start",
				"end",
				"top",
				"right",
				"bottom",
				"left"
			],
			"inset-x": ["right", "left"],
			"inset-y": ["top", "bottom"],
			flex: [
				"basis",
				"grow",
				"shrink"
			],
			gap: ["gap-x", "gap-y"],
			p: [
				"px",
				"py",
				"ps",
				"pe",
				"pbs",
				"pbe",
				"pt",
				"pr",
				"pb",
				"pl"
			],
			px: ["pr", "pl"],
			py: ["pt", "pb"],
			m: [
				"mx",
				"my",
				"ms",
				"me",
				"mbs",
				"mbe",
				"mt",
				"mr",
				"mb",
				"ml"
			],
			mx: ["mr", "ml"],
			my: ["mt", "mb"],
			size: ["w", "h"],
			"font-size": ["leading"],
			"fvn-normal": [
				"fvn-ordinal",
				"fvn-slashed-zero",
				"fvn-figure",
				"fvn-spacing",
				"fvn-fraction"
			],
			"fvn-ordinal": ["fvn-normal"],
			"fvn-slashed-zero": ["fvn-normal"],
			"fvn-figure": ["fvn-normal"],
			"fvn-spacing": ["fvn-normal"],
			"fvn-fraction": ["fvn-normal"],
			"line-clamp": ["display", "overflow"],
			rounded: [
				"rounded-s",
				"rounded-e",
				"rounded-t",
				"rounded-r",
				"rounded-b",
				"rounded-l",
				"rounded-ss",
				"rounded-se",
				"rounded-ee",
				"rounded-es",
				"rounded-tl",
				"rounded-tr",
				"rounded-br",
				"rounded-bl"
			],
			"rounded-s": ["rounded-ss", "rounded-es"],
			"rounded-e": ["rounded-se", "rounded-ee"],
			"rounded-t": ["rounded-tl", "rounded-tr"],
			"rounded-r": ["rounded-tr", "rounded-br"],
			"rounded-b": ["rounded-br", "rounded-bl"],
			"rounded-l": ["rounded-tl", "rounded-bl"],
			"border-spacing": ["border-spacing-x", "border-spacing-y"],
			"border-w": [
				"border-w-x",
				"border-w-y",
				"border-w-s",
				"border-w-e",
				"border-w-bs",
				"border-w-be",
				"border-w-t",
				"border-w-r",
				"border-w-b",
				"border-w-l"
			],
			"border-w-x": ["border-w-r", "border-w-l"],
			"border-w-y": ["border-w-t", "border-w-b"],
			"border-color": [
				"border-color-x",
				"border-color-y",
				"border-color-s",
				"border-color-e",
				"border-color-bs",
				"border-color-be",
				"border-color-t",
				"border-color-r",
				"border-color-b",
				"border-color-l"
			],
			"border-color-x": ["border-color-r", "border-color-l"],
			"border-color-y": ["border-color-t", "border-color-b"],
			translate: [
				"translate-x",
				"translate-y",
				"translate-none"
			],
			"translate-none": [
				"translate",
				"translate-x",
				"translate-y",
				"translate-z"
			],
			"scroll-m": [
				"scroll-mx",
				"scroll-my",
				"scroll-ms",
				"scroll-me",
				"scroll-mbs",
				"scroll-mbe",
				"scroll-mt",
				"scroll-mr",
				"scroll-mb",
				"scroll-ml"
			],
			"scroll-mx": ["scroll-mr", "scroll-ml"],
			"scroll-my": ["scroll-mt", "scroll-mb"],
			"scroll-p": [
				"scroll-px",
				"scroll-py",
				"scroll-ps",
				"scroll-pe",
				"scroll-pbs",
				"scroll-pbe",
				"scroll-pt",
				"scroll-pr",
				"scroll-pb",
				"scroll-pl"
			],
			"scroll-px": ["scroll-pr", "scroll-pl"],
			"scroll-py": ["scroll-pt", "scroll-pb"],
			touch: [
				"touch-x",
				"touch-y",
				"touch-pz"
			],
			"touch-x": ["touch"],
			"touch-y": ["touch"],
			"touch-pz": ["touch"]
		},
		conflictingClassGroupModifiers: { "font-size": ["leading"] },
		orderSensitiveModifiers: [
			"*",
			"**",
			"after",
			"backdrop",
			"before",
			"details-content",
			"file",
			"first-letter",
			"first-line",
			"marker",
			"placeholder",
			"selection"
		]
	};
};
var twMerge = /* @__PURE__ */ createTailwindMerge(getDefaultConfig);
//#endregion
//#region lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region components/math/math.tsx
function renderMath(math, displayMode, options) {
	return katex.renderToString(math, {
		displayMode,
		throwOnError: false,
		...options
	});
}
function MathInline({ math, className, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("span", {
		"aria-label": math,
		className: cn("inline-block", className),
		dangerouslySetInnerHTML: { __html: renderMath(math, false, options) }
	});
}
function MathBlock({ math, className, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
		"aria-label": math,
		className: cn("overflow-x-auto", className),
		dangerouslySetInnerHTML: { __html: renderMath(math, true, options) }
	});
}
//#endregion
//#region node_modules/class-variance-authority/dist/index.mjs
/**
* Copyright 2022 Joe Bell. All rights reserved.
*
* This file is licensed to you under the Apache License, Version 2.0
* (the "License"); you may not use this file except in compliance with the
* License. You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR REPRESENTATIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations under
* the License.
*/ var falsyToString = (value) => typeof value === "boolean" ? `${value}` : value === 0 ? "0" : value;
var cx = clsx;
var cva = (base, config) => (props) => {
	var _config_compoundVariants;
	if ((config === null || config === void 0 ? void 0 : config.variants) == null) return cx(base, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
	const { variants, defaultVariants } = config;
	const getVariantClassNames = Object.keys(variants).map((variant) => {
		const variantProp = props === null || props === void 0 ? void 0 : props[variant];
		const defaultVariantProp = defaultVariants === null || defaultVariants === void 0 ? void 0 : defaultVariants[variant];
		if (variantProp === null) return null;
		const variantKey = falsyToString(variantProp) || falsyToString(defaultVariantProp);
		return variants[variant][variantKey];
	});
	const propsWithoutUndefined = props && Object.entries(props).reduce((acc, param) => {
		let [key, value] = param;
		if (value === void 0) return acc;
		acc[key] = value;
		return acc;
	}, {});
	return cx(base, getVariantClassNames, config === null || config === void 0 ? void 0 : (_config_compoundVariants = config.compoundVariants) === null || _config_compoundVariants === void 0 ? void 0 : _config_compoundVariants.reduce((acc, param) => {
		let { class: cvClass, className: cvClassName, ...compoundVariantOptions } = param;
		return Object.entries(compoundVariantOptions).every((param) => {
			let [key, value] = param;
			return Array.isArray(value) ? value.includes({
				...defaultVariants,
				...propsWithoutUndefined
			}[key]) : {
				...defaultVariants,
				...propsWithoutUndefined
			}[key] === value;
		}) ? [
			...acc,
			cvClass,
			cvClassName
		] : acc;
	}, []), props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
};
//#endregion
//#region node_modules/@radix-ui/react-compose-refs/dist/index.mjs
function setRef(ref, value) {
	if (typeof ref === "function") return ref(value);
	else if (ref !== null && ref !== void 0) ref.current = value;
}
function composeRefs(...refs) {
	return (node) => {
		let hasCleanup = false;
		const cleanups = refs.map((ref) => {
			const cleanup = setRef(ref, node);
			if (!hasCleanup && typeof cleanup == "function") hasCleanup = true;
			return cleanup;
		});
		if (hasCleanup) return () => {
			for (let i = 0; i < cleanups.length; i++) {
				const cleanup = cleanups[i];
				if (typeof cleanup == "function") cleanup();
				else setRef(refs[i], null);
			}
		};
	};
}
//#endregion
//#region node_modules/@radix-ui/react-slot/dist/index.mjs
/* @__NO_SIDE_EFFECTS__ */
function createSlot(ownerName) {
	const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
	const Slot2 = import_react_react_server.forwardRef((props, forwardedRef) => {
		const { children, ...slotProps } = props;
		const childrenArray = import_react_react_server.Children.toArray(children);
		const slottable = childrenArray.find(isSlottable);
		if (slottable) {
			const newElement = slottable.props.children;
			const newChildren = childrenArray.map((child) => {
				if (child === slottable) {
					if (import_react_react_server.Children.count(newElement) > 1) return import_react_react_server.Children.only(null);
					return import_react_react_server.isValidElement(newElement) ? newElement.props.children : null;
				} else return child;
			});
			return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(SlotClone, {
				...slotProps,
				ref: forwardedRef,
				children: import_react_react_server.isValidElement(newElement) ? import_react_react_server.cloneElement(newElement, void 0, newChildren) : null
			});
		}
		return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(SlotClone, {
			...slotProps,
			ref: forwardedRef,
			children
		});
	});
	Slot2.displayName = `${ownerName}.Slot`;
	return Slot2;
}
var Slot = /* @__PURE__ */ createSlot("Slot");
/* @__NO_SIDE_EFFECTS__ */
function createSlotClone(ownerName) {
	const SlotClone = import_react_react_server.forwardRef((props, forwardedRef) => {
		const { children, ...slotProps } = props;
		if (import_react_react_server.isValidElement(children)) {
			const childrenRef = getElementRef(children);
			const props2 = mergeProps(slotProps, children.props);
			if (children.type !== import_react_react_server.Fragment) props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
			return import_react_react_server.cloneElement(children, props2);
		}
		return import_react_react_server.Children.count(children) > 1 ? import_react_react_server.Children.only(null) : null;
	});
	SlotClone.displayName = `${ownerName}.SlotClone`;
	return SlotClone;
}
var SLOTTABLE_IDENTIFIER = Symbol("radix.slottable");
function isSlottable(child) {
	return import_react_react_server.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
}
function mergeProps(slotProps, childProps) {
	const overrideProps = { ...childProps };
	for (const propName in childProps) {
		const slotPropValue = slotProps[propName];
		const childPropValue = childProps[propName];
		if (/^on[A-Z]/.test(propName)) {
			if (slotPropValue && childPropValue) overrideProps[propName] = (...args) => {
				const result = childPropValue(...args);
				slotPropValue(...args);
				return result;
			};
			else if (slotPropValue) overrideProps[propName] = slotPropValue;
		} else if (propName === "style") overrideProps[propName] = {
			...slotPropValue,
			...childPropValue
		};
		else if (propName === "className") overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
	}
	return {
		...slotProps,
		...overrideProps
	};
}
function getElementRef(element) {
	let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
	let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
	if (mayWarn) return element.ref;
	getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
	mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
	if (mayWarn) return element.props.ref;
	return element.props.ref || element.ref;
}
//#endregion
//#region components/ui/button.tsx
var buttonVariants = cva("group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
			outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
			ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
			destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
			sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
			lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
			icon: "size-8",
			"icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
			"icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
			"icon-lg": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(asChild ? Slot : "button", {
		"data-slot": "button",
		"data-variant": variant,
		"data-size": size,
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
//#endregion
//#region app/page.tsx
var page_exports$12 = /* @__PURE__ */ __exportAll({ default: () => Home });
var features = [
	{
		icon: ShieldCheck,
		title: "Protected routes",
		description: "Clerk runs in middleware.ts and keeps the /dashboard experience behind an authenticated session."
	},
	{
		icon: LockKeyhole,
		title: "Custom auth pages",
		description: "Dedicated /sign-in and /sign-up routes are ready for Clerk's prebuilt components."
	},
	{
		icon: UserRoundCheck,
		title: "Role-aware accounts",
		description: "Users choose whether they are a student or teacher during sign-up, and the app can tailor the dashboard afterward."
	}
];
var blockEquation = String.raw`\int_0^1 x^2\,dx = \frac{1}{3}`;
var inlineEquation = String.raw`e^{i\pi} + 1 = 0`;
var activityChartData = {
	labels: [
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat"
	],
	datasets: [{
		label: "Solved quizzes",
		data: [
			18,
			24,
			20,
			31,
			27,
			36
		],
		backgroundColor: [
			"#111827",
			"#1f2937",
			"#334155",
			"#0f766e",
			"#0f766e",
			"#f59e0b"
		],
		borderRadius: 999,
		borderSkipped: false,
		maxBarThickness: 26
	}]
};
var progressChartData = {
	labels: [
		"Completed",
		"In review",
		"Needs retry"
	],
	datasets: [{
		data: [
			62,
			23,
			15
		],
		backgroundColor: [
			"#111827",
			"#0f766e",
			"#f59e0b"
		],
		borderWidth: 0,
		hoverOffset: 6
	}]
};
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("main", {
		className: "relative flex flex-1 overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", { className: "absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.12),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(120,113,108,0.16),_transparent_30%)]" }), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("section", {
			className: "mx-auto grid w-full max-w-6xl gap-16 px-6 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)] lg:py-24",
			children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
				className: "flex flex-col justify-center gap-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
						className: "inline-flex w-fit items-center rounded-full border border-border/80 bg-background/80 px-4 py-2 text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase shadow-sm backdrop-blur",
						children: "Next.js 16 + Clerk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
						className: "space-y-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("h1", {
							className: "max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl",
							children: "Authentication is now first-class in PineQuest."
						}), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
							className: "max-w-2xl text-lg leading-8 text-muted-foreground",
							children: "Clerk is connected to the app router with dedicated sign-in and sign-up pages, a protected dashboard route, and role separation for student and teacher accounts."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
						className: "flex flex-col gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)(Show, {
							when: "signed-out",
							children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Button, {
								asChild: true,
								size: "lg",
								className: "min-w-40",
								children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(link_default, {
									href: "/sign-up",
									children: "Create account"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Button, {
								asChild: true,
								size: "lg",
								variant: "outline",
								className: "min-w-40",
								children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(link_default, {
									href: "/sign-in",
									children: "Open sign in"
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Show, {
							when: "signed-in",
							children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Button, {
								asChild: true,
								size: "lg",
								className: "min-w-40",
								children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(link_default, {
									href: "/dashboard",
									prefetch: false,
									children: "Open dashboard"
								})
							})
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
				className: "grid gap-4 self-center",
				children: [
					features.map((feature) => {
						const Icon = feature.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("article", {
							className: "rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
									className: "mb-5 flex size-12 items-center justify-center rounded-2xl bg-muted text-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Icon, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("h2", {
									className: "text-xl font-semibold tracking-tight",
									children: feature.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
									className: "mt-3 text-sm leading-7 text-muted-foreground",
									children: feature.description
								})
							]
						}, feature.title);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("article", {
						className: "overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
								className: "text-sm font-medium tracking-[0.22em] text-muted-foreground uppercase",
								children: "KaTeX ready"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("h2", {
								className: "mt-3 text-xl font-semibold tracking-tight",
								children: "Formula rendering is available in the app shell."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(MathBlock, {
								math: blockEquation,
								className: "mt-4 overflow-x-auto rounded-2xl bg-muted/70 px-4 py-5 text-foreground"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("p", {
								className: "mt-4 text-sm leading-7 text-muted-foreground",
								children: ["Inline math also works:", /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(MathInline, {
									math: inlineEquation,
									className: "ml-2 text-foreground"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("article", {
						className: "overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur",
						children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
							className: "flex items-start justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
									className: "text-sm font-medium tracking-[0.22em] text-muted-foreground uppercase",
									children: "Chart.js ready"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("h2", {
									className: "mt-3 text-xl font-semibold tracking-tight",
									children: "Charts now plug into the app with a single import."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("p", {
									className: "mt-3 text-sm leading-7 text-muted-foreground",
									children: [
										"The registration boilerplate lives in one wrapper, so pages can render charts directly with ",
										/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("code", { children: "BarChart" }),
										" or ",
										/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("code", { children: "DoughnutChart" }),
										"."
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
								className: "hidden rounded-full border border-border/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase sm:block",
								children: "Demo data"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
							className: "mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(220px,280px)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
								className: "rounded-2xl bg-muted/60 p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(BarChart, {
									data: activityChartData,
									className: "h-64"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
								className: "rounded-2xl bg-muted/60 p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(DoughnutChart, {
									data: progressChartData,
									className: "h-64"
								})
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
						className: "rounded-3xl border border-border/70 bg-foreground p-6 text-background shadow-lg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
								className: "text-sm font-medium tracking-[0.22em] text-background/70 uppercase",
								children: "Ready to test"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
								className: "mt-3 text-2xl font-semibold tracking-tight",
								children: "Create a Clerk user and land straight in the protected dashboard."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)(link_default, {
								href: "/dashboard",
								prefetch: false,
								className: "mt-6 inline-flex items-center gap-2 text-sm font-medium text-background/90 transition hover:text-background",
								children: ["Try the protected route", /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ArrowRight, { className: "size-4" })]
							})
						]
					})
				]
			})]
		})]
	});
}
//#endregion
//#region lib/auth-role.ts
function isUserRole(value) {
	return value === "school" || value === "student" || value === "teacher";
}
function getRoleLabel(role) {
	return role === "teacher" ? "Teacher" : "Student";
}
function getRoleHomePath(role) {
	if (role === "student") return "/student";
	if (role === "teacher") return "/teacher";
	return "/dashboard";
}
//#endregion
//#region app/auth/after-sign-in/page.tsx
var page_exports$11 = /* @__PURE__ */ __exportAll({ default: () => AfterSignInPage });
async function AfterSignInPage() {
	const user = await currentUser();
	if (!user) redirect("/sign-in");
	const role = user.unsafeMetadata?.role;
	if (!isUserRole(role)) redirect("/dashboard");
	redirect(getRoleHomePath(role));
}
var FingerprintPattern = createLucideIcon("fingerprint-pattern", [
	["path", {
		d: "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",
		key: "1nerag"
	}],
	["path", {
		d: "M14 13.12c0 2.38 0 6.38-1 8.88",
		key: "o46ks0"
	}],
	["path", {
		d: "M17.29 21.02c.12-.6.43-2.3.5-3.02",
		key: "ptglia"
	}],
	["path", {
		d: "M2 12a10 10 0 0 1 18-6",
		key: "ydlgp0"
	}],
	["path", {
		d: "M2 16h.01",
		key: "1gqxmh"
	}],
	["path", {
		d: "M21.8 16c.2-2 .131-5.354 0-6",
		key: "drycrb"
	}],
	["path", {
		d: "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",
		key: "1tidbn"
	}],
	["path", {
		d: "M8.65 22c.21-.66.45-1.32.57-2",
		key: "13wd9y"
	}],
	["path", {
		d: "M9 6.8a6 6 0 0 1 9 5.2v2",
		key: "1fr1j5"
	}]
]);
var Mail = createLucideIcon("mail", [["path", {
	d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",
	key: "132q7q"
}], ["rect", {
	x: "2",
	y: "4",
	width: "20",
	height: "16",
	rx: "2",
	key: "izxlao"
}]]);
//#endregion
//#region app/dashboard/page.tsx
var page_exports$10 = /* @__PURE__ */ __exportAll({ default: () => DashboardPage });
var checks = [
	{
		icon: ShieldCheck,
		title: "Route protection",
		description: "This page is protected by Clerk in web/middleware.ts."
	},
	{
		icon: FingerprintPattern,
		title: "Session context",
		description: "User data is available in the app router through Clerk's server helpers."
	},
	{
		icon: Mail,
		title: "Redirect flow",
		description: "Sign-in and sign-up complete by landing the user back on this page."
	}
];
async function DashboardPage() {
	const user = await currentUser();
	const displayName = user?.firstName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? "there";
	const email = user?.primaryEmailAddress?.emailAddress ?? "No primary email returned";
	const rawRole = user?.unsafeMetadata?.role;
	const rawFirstName = user?.unsafeMetadata?.firstName;
	const rawLastName = user?.unsafeMetadata?.lastName;
	const rawPhone = user?.unsafeMetadata?.phone;
	const rawGrade = user?.unsafeMetadata?.grade;
	const rawClassName = user?.unsafeMetadata?.className;
	const rawInviteCode = user?.unsafeMetadata?.inviteCode;
	const role = isUserRole(rawRole) ? rawRole : "student";
	const firstName = typeof rawFirstName === "string" && rawFirstName.trim() ? rawFirstName : displayName;
	const lastName = typeof rawLastName === "string" && rawLastName.trim() ? rawLastName : displayName;
	const phone = typeof rawPhone === "string" ? rawPhone : "";
	const grade = typeof rawGrade === "string" ? rawGrade : "";
	const className = typeof rawClassName === "string" ? rawClassName : "";
	const inviteCode = typeof rawInviteCode === "string" ? rawInviteCode : "";
	const roleLabel = getRoleLabel(role);
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("main", {
		className: "relative flex flex-1 overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", { className: "absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.08),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(120,113,108,0.12),_transparent_30%)]" }), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("section", {
			className: "mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14",
			children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("p", {
						className: "text-sm font-medium tracking-[0.22em] text-muted-foreground uppercase",
						children: [roleLabel, " dashboard"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("h1", {
						className: "text-4xl font-semibold tracking-tight text-balance sm:text-5xl",
						children: [
							"Welcome back, ",
							displayName,
							"."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
						className: "max-w-2xl text-lg leading-8 text-muted-foreground",
						children: role === "teacher" ? "Your teacher account is ready for managing learners, creating assessments, and reviewing outcomes." : "Your student account is ready for joining classes, taking exams, and following your progress."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
					className: "grid gap-4 md:grid-cols-3",
					children: checks.map((check) => {
						const Icon = check.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("article", {
							className: "rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
									className: "mb-5 flex size-12 items-center justify-center rounded-2xl bg-muted text-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Icon, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("h2", {
									className: "text-lg font-semibold tracking-tight",
									children: check.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
									className: "mt-3 text-sm leading-7 text-muted-foreground",
									children: check.description
								})
							]
						}, check.title);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("aside", {
					className: "rounded-[2rem] border border-border/70 bg-foreground p-6 text-background shadow-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
							className: "text-sm font-medium tracking-[0.22em] text-background/70 uppercase",
							children: "Active user"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
							className: "mt-3 text-2xl font-semibold tracking-tight",
							children: displayName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
							className: "mt-2 inline-flex w-fit rounded-full border border-background/20 px-3 py-1 text-xs font-medium tracking-[0.18em] text-background/80 uppercase",
							children: roleLabel
						}),
						/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("p", {
							className: "mt-2 break-all text-sm leading-7 text-background/80",
							children: email
						}),
						/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(UserButton, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(CloudflareStudentSync, {
							email,
							firstName,
							lastName,
							phone,
							grade,
							className,
							inviteCode,
							role
						}),
						/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Button, {
							asChild: true,
							variant: "secondary",
							size: "lg",
							className: "mt-8 bg-background text-foreground hover:bg-background/90",
							children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)(link_default, {
								href: "/",
								children: ["Back to home", /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ArrowRight, { className: "size-4" })]
							})
						})
					]
				})]
			})]
		})]
	});
}
//#endregion
//#region app/student/page.tsx
var page_exports$9 = /* @__PURE__ */ __exportAll({
	StudentIllustration: () => StudentIllustration,
	default: () => page_default$6
});
var StudentIllustration = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'StudentIllustration' is called on server");
}, "849cd529c11e", "StudentIllustration");
var page_default$6 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "849cd529c11e", "default");
//#endregion
//#region \0virtual:vinext-google-fonts?fonts=Inter
var Inter = /* @__PURE__ */ createFontLoader("Inter");
//#endregion
//#region app/student/layout.tsx
var layout_exports$1 = /* @__PURE__ */ __exportAll({ default: () => StudentRootLayout });
var inter = Inter({
	subsets: ["latin"],
	display: "swap"
});
function StudentRootLayout({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
		className: inter.className,
		children
	});
}
//#endregion
//#region app/student/account/page.tsx
var page_exports$8 = /* @__PURE__ */ __exportAll({ default: () => page_default$5 });
var page_default$5 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "2b381c30acd5", "default");
//#endregion
//#region app/student/_component/Header.tsx
var Header_default = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "487bf1b9ec85", "default");
//#endregion
//#region app/student/account/layout.tsx
var layout_exports = /* @__PURE__ */ __exportAll({ default: () => StudentLayout });
async function StudentLayout({ children }) {
	const user = await currentUser();
	const displayName = user?.firstName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? "Student";
	const email = user?.primaryEmailAddress?.emailAddress ?? "";
	const rawRole = user?.unsafeMetadata?.role;
	const rawFirstName = user?.unsafeMetadata?.firstName;
	const rawLastName = user?.unsafeMetadata?.lastName;
	const rawPhone = user?.unsafeMetadata?.phone;
	const rawGrade = user?.unsafeMetadata?.grade;
	const rawClassName = user?.unsafeMetadata?.className;
	const rawInviteCode = user?.unsafeMetadata?.inviteCode;
	const role = isUserRole(rawRole) ? rawRole : "student";
	const firstName = typeof rawFirstName === "string" && rawFirstName.trim() ? rawFirstName : user?.firstName ?? displayName;
	const lastName = typeof rawLastName === "string" && rawLastName.trim() ? rawLastName : "";
	const phone = typeof rawPhone === "string" ? rawPhone : "";
	const grade = typeof rawGrade === "string" ? rawGrade : "";
	const className = typeof rawClassName === "string" ? rawClassName : "";
	const inviteCode = typeof rawInviteCode === "string" ? rawInviteCode : "";
	const hasStudentSyncMetadata = Boolean(firstName && email && phone && inviteCode);
	if (role !== "student") redirect("/dashboard");
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)("div", {
		className: "min-h-screen bg-[#F7F8FC]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Header_default, {}),
			/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("div", {
				className: "mx-auto max-w-[1245px] px-8 pt-4",
				children: hasStudentSyncMetadata ? /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(CloudflareStudentSync, {
					email,
					firstName,
					lastName,
					phone,
					grade,
					className,
					inviteCode,
					role
				}) : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("main", {
				className: "mx-auto max-w-[1245px] px-8 py-10",
				children
			})
		]
	});
}
//#endregion
//#region app/student/account/myResult/page.tsx
var page_exports$7 = /* @__PURE__ */ __exportAll({ default: () => page_default$4 });
var page_default$4 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "56a3c77d9e00", "default");
//#endregion
//#region components/teacher/teacher-school-requests.tsx
var TeacherSchoolRequests = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'TeacherSchoolRequests' is called on server");
}, "89b0736211b5", "TeacherSchoolRequests");
//#endregion
//#region app/teacher/page.tsx
var page_exports$6 = /* @__PURE__ */ __exportAll({ default: () => TeacherPage });
function TeacherPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(TeacherSchoolRequests, {});
}
//#endregion
//#region app/teacher/dashboard/page.tsx
var page_exports$5 = /* @__PURE__ */ __exportAll({ default: () => page_default$3 });
var page_default$3 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "89d11b109a3a", "default");
//#endregion
//#region app/teacher/exams/page.tsx
var page_exports$4 = /* @__PURE__ */ __exportAll({ default: () => page_default$2 });
var page_default$2 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "19b34849c888", "default");
//#endregion
//#region app/teacher/dashboard/[examId]/page.tsx
var page_exports$3 = /* @__PURE__ */ __exportAll({ default: () => page_default$1 });
var page_default$1 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "0479bde36c49", "default");
//#endregion
//#region app/teacher/exams/[examId]/page.tsx
var page_exports$2 = /* @__PURE__ */ __exportAll({ default: () => page_default });
var page_default = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "474c9ed9ad0f", "default");
//#endregion
//#region components/auth/auth-screen.tsx
var AuthScreen = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'AuthScreen' is called on server");
}, "3058bae5af73", "AuthScreen");
//#endregion
//#region app/sign-in/[[...sign-in]]/page.tsx
var page_exports$1 = /* @__PURE__ */ __exportAll({ default: () => SignInPage });
function SignInPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(AuthScreen, { mode: "sign-in" });
}
//#endregion
//#region app/sign-up/[[...sign-up]]/page.tsx
var page_exports = /* @__PURE__ */ __exportAll({ default: () => SignUpPage });
function SignUpPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(AuthScreen, { mode: "sign-up" });
}
//#endregion
//#region \0virtual:vinext-rsc-entry
function renderToReadableStream(model, options) {
	const _hlFixRe = /(\d*:HL\[.*?),"stylesheet"(\]|,)/g;
	const stream = renderToReadableStream$1(model, options);
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();
	let carry = "";
	return stream.pipeThrough(new TransformStream({
		transform(chunk, controller) {
			const text = carry + decoder.decode(chunk, { stream: true });
			const lastNl = text.lastIndexOf("\n");
			if (lastNl === -1) {
				carry = text;
				return;
			}
			carry = text.slice(lastNl + 1);
			controller.enqueue(encoder.encode(text.slice(0, lastNl + 1).replace(_hlFixRe, "$1,\"style\"$2")));
		},
		flush(controller) {
			const text = carry + decoder.decode();
			if (text) controller.enqueue(encoder.encode(text.replace(_hlFixRe, "$1,\"style\"$2")));
		}
	}));
}
function _getSSRFontStyles() {
	return [...getSSRFontStyles$1(), ...getSSRFontStyles()];
}
function _getSSRFontPreloads() {
	return [...getSSRFontPreloads$1(), ...getSSRFontPreloads()];
}
var _suppressHookWarningAls = new AsyncLocalStorage();
var _origConsoleError = console.error;
console.error = (...args) => {
	if (_suppressHookWarningAls.getStore() === true && typeof args[0] === "string" && args[0].includes("Invalid hook call")) return;
	_origConsoleError.apply(console, args);
};
function setNavigationContext(ctx) {
	setNavigationContext$1(ctx);
}
async function __isrGet(key) {
	const result = await getCacheHandler().get(key);
	if (!result || !result.value) return null;
	return {
		value: result,
		isStale: result.cacheState === "stale"
	};
}
async function __isrSet(key, data, revalidateSeconds, tags) {
	await getCacheHandler().set(key, data, {
		revalidate: revalidateSeconds,
		tags: Array.isArray(tags) ? tags : []
	});
}
function __pageCacheTags(pathname, extraTags) {
	const tags = [pathname, "_N_T_" + pathname];
	tags.push("_N_T_/layout");
	const segments = pathname.split("/");
	let built = "";
	for (let i = 1; i < segments.length; i++) if (segments[i]) {
		built += "/" + segments[i];
		tags.push("_N_T_" + built + "/layout");
	}
	tags.push("_N_T_" + built + "/page");
	if (Array.isArray(extraTags)) {
		for (const tag of extraTags) if (!tags.includes(tag)) tags.push(tag);
	}
	return tags;
}
var __pendingRegenerations = /* @__PURE__ */ new Map();
function __triggerBackgroundRegeneration(key, renderFn) {
	if (__pendingRegenerations.has(key)) return;
	const promise = renderFn().catch((err) => console.error("[vinext] ISR regen failed for " + key + ":", err)).finally(() => __pendingRegenerations.delete(key));
	__pendingRegenerations.set(key, promise);
	const ctx = getRequestExecutionContext();
	if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(promise);
}
function __isrFnv1a64(s) {
	let h1 = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h1 ^= s.charCodeAt(i);
		h1 = h1 * 16777619 >>> 0;
	}
	let h2 = 84696351;
	for (let i = 0; i < s.length; i++) {
		h2 ^= s.charCodeAt(i);
		h2 = h2 * 16777619 >>> 0;
	}
	return h1.toString(36) + h2.toString(36);
}
function __isrCacheKey(pathname, suffix) {
	const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
	const prefix = "app:fcf44256-aba6-4ab6-a8ed-dba656fa3843";
	const key = prefix + ":" + normalized + ":" + suffix;
	if (key.length <= 200) return key;
	return prefix + ":__hash:" + __isrFnv1a64(normalized) + ":" + suffix;
}
function __isrHtmlKey(pathname) {
	return __isrCacheKey(pathname, "html");
}
function __isrRscKey(pathname) {
	return __isrCacheKey(pathname, "rsc");
}
function __isrRouteKey(pathname) {
	return __isrCacheKey(pathname, "route");
}
var __isrDebug = process.env.NEXT_PRIVATE_DEBUG_CACHE ? console.debug.bind(console, "[vinext] ISR:") : void 0;
function makeThenableParams(obj) {
	const plain = { ...obj };
	return Object.assign(Promise.resolve(plain), plain);
}
function __resolveChildSegments(routeSegments, treePosition, params) {
	var raw = routeSegments.slice(treePosition);
	var result = [];
	for (var j = 0; j < raw.length; j++) {
		var seg = raw[j];
		if (seg.indexOf("[[...") === 0 && seg.charAt(seg.length - 1) === "]" && seg.charAt(seg.length - 2) === "]") {
			var v = params[seg.slice(5, -2)];
			if (Array.isArray(v) && v.length === 0) continue;
			if (v == null) continue;
			result.push(Array.isArray(v) ? v.join("/") : v);
		} else if (seg.indexOf("[...") === 0 && seg.charAt(seg.length - 1) === "]") {
			var v2 = params[seg.slice(4, -1)];
			result.push(Array.isArray(v2) ? v2.join("/") : v2 || seg);
		} else if (seg.charAt(0) === "[" && seg.charAt(seg.length - 1) === "]" && seg.indexOf(".") === -1) {
			var pn3 = seg.slice(1, -1);
			result.push(params[pn3] || seg);
		} else result.push(seg);
	}
	return result;
}
function __errorDigest(str) {
	let hash = 5381;
	for (let i = str.length - 1; i >= 0; i--) hash = hash * 33 ^ str.charCodeAt(i);
	return (hash >>> 0).toString();
}
function __sanitizeErrorForClient(error) {
	if (resolveAppPageSpecialError(error)) return error;
	const msg = error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack || "" : "";
	const sanitized = /* @__PURE__ */ new Error("An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.");
	sanitized.digest = __errorDigest(msg + stack);
	return sanitized;
}
function rscOnError(error, requestInfo, errorContext) {
	if (error && typeof error === "object" && "digest" in error) return String(error.digest);
	if (requestInfo && errorContext && error) reportRequestError(error instanceof Error ? error : new Error(String(error)), requestInfo, errorContext);
	if (error) return __errorDigest((error instanceof Error ? error.message : String(error)) + (error instanceof Error ? error.stack || "" : ""));
}
function createRscOnErrorHandler(request, pathname, routePath) {
	const requestInfo = {
		path: pathname,
		method: request.method,
		headers: Object.fromEntries(request.headers.entries())
	};
	const errorContext = {
		routerKind: "App Router",
		routePath: routePath || pathname,
		routeType: "render"
	};
	return function(error) {
		return rscOnError(error, requestInfo, errorContext);
	};
}
var routes = [
	{
		pattern: "/teacher/exams/:examId/edit",
		patternParts: [
			"teacher",
			"exams",
			":examId",
			"edit"
		],
		isDynamic: true,
		params: ["examId"],
		page: page_exports$14,
		routeHandler: null,
		layouts: [layout_exports$3, layout_exports$2],
		routeSegments: [
			"teacher",
			"exams",
			"[examId]",
			"edit"
		],
		layoutTreePositions: [0, 1],
		templates: [],
		errors: [null, null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null, null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/teacher/dashboard/:examId/students/:studentId",
		patternParts: [
			"teacher",
			"dashboard",
			":examId",
			"students",
			":studentId"
		],
		isDynamic: true,
		params: ["examId", "studentId"],
		page: page_exports$13,
		routeHandler: null,
		layouts: [layout_exports$3, layout_exports$2],
		routeSegments: [
			"teacher",
			"dashboard",
			"[examId]",
			"students",
			"[studentId]"
		],
		layoutTreePositions: [0, 1],
		templates: [],
		errors: [null, null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null, null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/",
		patternParts: [],
		isDynamic: false,
		params: [],
		page: page_exports$12,
		routeHandler: null,
		layouts: [layout_exports$3],
		routeSegments: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/auth/after-sign-in",
		patternParts: ["auth", "after-sign-in"],
		isDynamic: false,
		params: [],
		page: page_exports$11,
		routeHandler: null,
		layouts: [layout_exports$3],
		routeSegments: ["auth", "after-sign-in"],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/dashboard",
		patternParts: ["dashboard"],
		isDynamic: false,
		params: [],
		page: page_exports$10,
		routeHandler: null,
		layouts: [layout_exports$3],
		routeSegments: ["dashboard"],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/student",
		patternParts: ["student"],
		isDynamic: false,
		params: [],
		page: page_exports$9,
		routeHandler: null,
		layouts: [layout_exports$3, layout_exports$1],
		routeSegments: ["student"],
		layoutTreePositions: [0, 1],
		templates: [],
		errors: [null, null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null, null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/student/account",
		patternParts: ["student", "account"],
		isDynamic: false,
		params: [],
		page: page_exports$8,
		routeHandler: null,
		layouts: [
			layout_exports$3,
			layout_exports$1,
			layout_exports
		],
		routeSegments: ["student", "account"],
		layoutTreePositions: [
			0,
			1,
			2
		],
		templates: [],
		errors: [
			null,
			null,
			null
		],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [
			null,
			null,
			null
		],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/student/account/myResult",
		patternParts: [
			"student",
			"account",
			"myResult"
		],
		isDynamic: false,
		params: [],
		page: page_exports$7,
		routeHandler: null,
		layouts: [
			layout_exports$3,
			layout_exports$1,
			layout_exports
		],
		routeSegments: [
			"student",
			"account",
			"myResult"
		],
		layoutTreePositions: [
			0,
			1,
			2
		],
		templates: [],
		errors: [
			null,
			null,
			null
		],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [
			null,
			null,
			null
		],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/teacher",
		patternParts: ["teacher"],
		isDynamic: false,
		params: [],
		page: page_exports$6,
		routeHandler: null,
		layouts: [layout_exports$3, layout_exports$2],
		routeSegments: ["teacher"],
		layoutTreePositions: [0, 1],
		templates: [],
		errors: [null, null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null, null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/teacher/dashboard",
		patternParts: ["teacher", "dashboard"],
		isDynamic: false,
		params: [],
		page: page_exports$5,
		routeHandler: null,
		layouts: [layout_exports$3, layout_exports$2],
		routeSegments: ["teacher", "dashboard"],
		layoutTreePositions: [0, 1],
		templates: [],
		errors: [null, null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null, null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/teacher/exams",
		patternParts: ["teacher", "exams"],
		isDynamic: false,
		params: [],
		page: page_exports$4,
		routeHandler: null,
		layouts: [layout_exports$3, layout_exports$2],
		routeSegments: ["teacher", "exams"],
		layoutTreePositions: [0, 1],
		templates: [],
		errors: [null, null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null, null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/teacher/dashboard/:examId",
		patternParts: [
			"teacher",
			"dashboard",
			":examId"
		],
		isDynamic: true,
		params: ["examId"],
		page: page_exports$3,
		routeHandler: null,
		layouts: [layout_exports$3, layout_exports$2],
		routeSegments: [
			"teacher",
			"dashboard",
			"[examId]"
		],
		layoutTreePositions: [0, 1],
		templates: [],
		errors: [null, null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null, null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/teacher/exams/:examId",
		patternParts: [
			"teacher",
			"exams",
			":examId"
		],
		isDynamic: true,
		params: ["examId"],
		page: page_exports$2,
		routeHandler: null,
		layouts: [layout_exports$3, layout_exports$2],
		routeSegments: [
			"teacher",
			"exams",
			"[examId]"
		],
		layoutTreePositions: [0, 1],
		templates: [],
		errors: [null, null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null, null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/sign-in/:sign-in*",
		patternParts: ["sign-in", ":sign-in*"],
		isDynamic: true,
		params: ["sign-in"],
		page: page_exports$1,
		routeHandler: null,
		layouts: [layout_exports$3],
		routeSegments: ["sign-in", "[[...sign-in]]"],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		pattern: "/sign-up/:sign-up*",
		patternParts: ["sign-up", ":sign-up*"],
		isDynamic: true,
		params: ["sign-up"],
		page: page_exports,
		routeHandler: null,
		layouts: [layout_exports$3],
		routeSegments: ["sign-up", "[[...sign-up]]"],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	}
];
var _routeTrie = buildRouteTrie(routes);
var metadataRoutes = [{
	type: "favicon",
	isDynamic: false,
	servedUrl: "/favicon.ico",
	contentType: "image/x-icon",
	fileDataBase64: "AAABAAQAEBAAAAEAIAAoBQAARgAAACAgAAABACAAKBQAAG4FAAAwMAAAAQAgACgtAACWGQAAAAAAAAEAIACNHgAAvkYAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQAAABdAAAAugAAALoAAABdAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAKAAAADyAAAA/wAAAP8AAAD/AAAA/wAAAPIAAACgAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAOAAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAOAAAAA4AAAAAAAAAAAAAAAAAAAAHwAAAOIAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA4gAAAB8AAAAAAAAAAAAAAKEAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAChAAAAAAAAACMAAAD0AAAA/wAAAP9PT0//rq6u/6urq/+rq6v/q6ur/6urq/+tra3/Z2dn/wAAAP8AAAD/AAAA9AAAACMAAABZAAAA/wAAAP8AAAD/Hx8f/+3t7f///////////////////////f39/zU1Nf8AAAD/AAAA/wAAAP8AAABZAAAAuwAAAP8AAAD/AAAA/wAAAP9ra2v//////////////////////46Ojv8AAAD/AAAA/wAAAP8AAAD/AAAAuwAAALsAAAD/AAAA/wAAAP8AAAD/CQkJ/83Nzf///////////+Tk5P8YGBj/AAAA/wAAAP8AAAD/AAAA/wAAALsAAABZAAAA/wAAAP8AAAD/AAAA/wAAAP9KSkr//f39//////9ra2v/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAABZAAAAIwAAAPQAAAD/AAAA/wAAAP8AAAD/AQEB/7a2tv/V1dX/CQkJ/wAAAP8AAAD/AAAA/wAAAP8AAAD0AAAAIwAAAAAAAAChAAAA/wAAAP8AAAD/AAAA/wAAAP8xMTH/RERE/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAoQAAAAAAAAAAAAAAHwAAAOIAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA4gAAAB8AAAAAAAAAAAAAAAAAAAA4AAAA4AAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA4AAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAACgAAAA8gAAAP8AAAD/AAAA/wAAAP8AAADyAAAAoAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQAAABdAAAAugAAALoAAABdAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAgAAAAQAAAAAEAIAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAsAAAAVQAAAIEAAADoAAAA6AAAAIEAAABVAAAALAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACoAAACFAAAA0gAAAPkAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD5AAAA0gAAAIUAAAAqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAACWAAAA8wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAPMAAACWAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABRAAAA4QAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAADhAAAAUQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcgAAAPsAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD7AAAAcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHIAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPAAAA+wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD7AAAATwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGwAAAOQAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAADjAAAAGwAAAAAAAAAAAAAAAAAAAAAAAACXAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAACXAAAAAAAAAAAAAAAAAAAAKAAAAPUAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAPQAAAAnAAAAAAAAAAAAAACGAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/ODg4/4uLi/+IiIj/iIiI/4iIiP+IiIj/iIiI/4iIiP+IiIj/iIiI/4iIiP+IiIj/iIiI/4iIiP+JiYn/X19f/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAIYAAAAAAAAABwAAANQAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8eHh7/7u7u//////////////////////////////////////////////////////////////////////9TU1P/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA1AAAAAcAAAArAAAA+gAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP9oaGj/////////////////////////////////////////////////////////////////rq6u/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD6AAAAKwAAAFQAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wgICP/Ly8v///////////////////////////////////////////////////////T09P8sLCz/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAABUAAAAggAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/0dHR//9/f3/////////////////////////////////////////////////jY2N/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAIEAAADpAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/62trf///////////////////////////////////////////+Tk5P8XFxf/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA6QAAAOkAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/Kysr//Pz8///////////////////////////////////////ampq/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAADpAAAAgQAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/i4uL/////////////////////////////////8zMzP8ICAj/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAIIAAABUAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8WFhb/4+Pj///////////////////////9/f3/SUlJ/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAVAAAACsAAAD6AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP9oaGj//////////////////////6+vr/8BAQH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAPoAAAArAAAABwAAANQAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wgICP/Ly8v////////////09PT/LCws/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA1AAAAAcAAAAAAAAAhgAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/0dHR//9/f3//////42Njf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAACGAAAAAAAAAAAAAAAnAAAA9AAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/7Gxsf/s7Oz/FxcX/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA9QAAACgAAAAAAAAAAAAAAAAAAACXAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/MzMz/19fX/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAACXAAAAAAAAAAAAAAAAAAAAAAAAABoAAADjAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA5AAAABsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE8AAAD7AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAPsAAABPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHIAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHIAAAD7AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA+wAAAHIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFEAAADhAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAOEAAABRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAACWAAAA8wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAPMAAACWAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqAAAAhQAAANIAAAD5AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA+QAAANIAAACFAAAAKgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAACwAAABVAAAAgQAAAOgAAADoAAAAgQAAAFUAAAAsAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAwAAAAYAAAAAEAIAAAAAAAAC0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJAAAAKAAAAEwAAABqAAAAswAAAPgAAAD3AAAAswAAAGoAAABLAAAAKAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATAAAAVgAAAKAAAADYAAAA+AAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA+AAAANgAAACgAAAAVQAAABMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQAAAIsAAADhAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAOEAAACLAAAAJgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAACLAAAA7wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA7wAAAIsAAAAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUQAAANwAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAADcAAAAUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAACKAAAA/gAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/gAAAIoAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAK0AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAACtAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAuAAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAuAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAACuAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAK4AAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIoAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAACKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAP0AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD9AAAATwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVAAAA3wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA3wAAABUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACLAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAIsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMAAADxAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAPEAAAAjAAAAAAAAAAAAAAAAAAAAAAAAAIwAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAACLAAAAAAAAAAAAAAAAAAAAEQAAAOQAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8kJCT/aGho/2VlZf9lZWX/ZWVl/2VlZf9lZWX/ZWVl/2VlZf9lZWX/ZWVl/2VlZf9lZWX/ZWVl/2VlZf9lZWX/ZWVl/2VlZf9lZWX/ZWVl/2VlZf9lZWX/ZWVl/1BQUP8BAQH/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAADkAAAAEQAAAAAAAAAAAAAAVQAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8cHBz/6+vr/////////////////////////////////////////////////////////////////////////////////////////////////////////////////3Nzc/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAVQAAAAAAAAAAAAAAoQAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/ZWVl////////////////////////////////////////////////////////////////////////////////////////////////////////////zMzM/wgICP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAoQAAAAAAAAAJAAAA2gAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/BwcH/8nJyf/////////////////////////////////////////////////////////////////////////////////////////////////9/f3/SEhI/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA2gAAAAkAAAAoAAAA+QAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/0VFRf/8/Pz///////////////////////////////////////////////////////////////////////////////////////////+urq7/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA+AAAACgAAABLAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP+qqqr///////////////////////////////////////////////////////////////////////////////////////T09P8sLCz/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAEwAAABqAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8pKSn/8vLy/////////////////////////////////////////////////////////////////////////////////4yMjP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAGoAAAC0AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/iIiI////////////////////////////////////////////////////////////////////////////4+Pj/xYWFv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAALMAAAD4AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/FBQU/+Hh4f//////////////////////////////////////////////////////////////////////aWlp/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAPgAAAD4AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/2VlZf/////////////////////////////////////////////////////////////////Ly8v/CAgI/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAPgAAACzAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wcHB//Jycn///////////////////////////////////////////////////////39/f9ISEj/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAALQAAABqAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP9FRUX//Pz8/////////////////////////////////////////////////66urv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAGoAAABMAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/qqqq////////////////////////////////////////////9PT0/ywsLP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAEsAAAAoAAAA+AAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/KSkp//Ly8v//////////////////////////////////////jIyM/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA+QAAACgAAAAJAAAA2gAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/4iIiP/////////////////////////////////j4+P/FhYW/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA2gAAAAkAAAAAAAAAoQAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/xQUFP/h4eH///////////////////////////9paWn/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAoQAAAAAAAAAAAAAAVQAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP9lZWX//////////////////////8zMzP8ICAj/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAVQAAAAAAAAAAAAAAEQAAAOQAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8HBwf/ycnJ/////////////f39/0hISP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAADkAAAAEQAAAAAAAAAAAAAAAAAAAIsAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/RUVF//z8/P//////rq6u/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAACMAAAAAAAAAAAAAAAAAAAAAAAAACMAAADxAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/6ysrP/7+/v/LCws/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAPEAAAAjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACLAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/zIyMv99fX3/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAIsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVAAAA3wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA3wAAABUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATwAAAP0AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD9AAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIoAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAACKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAACuAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAK4AAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAuAAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAuAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAK0AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAACtAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAACKAAAA/gAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/gAAAIoAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUgAAANwAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAADcAAAAUQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAACLAAAA7wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA7wAAAIsAAAAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJgAAAIsAAADhAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAOEAAACLAAAAJQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATAAAAVQAAAKAAAADYAAAA+AAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA+AAAANgAAACgAAAAVgAAABMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJAAAAKAAAAEsAAABqAAAAswAAAPcAAAD4AAAAswAAAGoAAABMAAAAKAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACJUE5HDQoaCgAAAA1JSERSAAABAAAAAQAIBgAAAFxyqGYAAAABc1JHQgCuzhzpAAAAOGVYSWZNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAAACoAIABAAAAAEAAAEAoAMABAAAAAEAAAEAAAAAAEQiOHMAAB4DSURBVHgB7V0JsBXVmW6UXQg8FhFRVkGW6MRoJAnKToyOMTMqiHGwwmSqBsSNqUmhiAiYRJNMMpOqKM4UKNSYMtbEmdEYGUcJi8FxX0DlsYjghoobEngIyJvvu9CPvo97b/e9vZ3T/f1V33t9u0+f5Tvn//v0+c853cKRZIGBrihEZ6AT0BE4CegD9AROALoBXYDuQAugDmgDeKURP3YADcBO4DPgPWA78DbwLvAmsAvgdeIT4CAgsZQBNgaJHQxQganQvYDBQP/DoFLTAFD5aQRaA3HKXkRO4+AagHdwvA3YDLwB0FjQaNCYSAxnQAbAzAo6GdniE3wI8DVgIHAiQAPAJ7zJsgeZc3sN63D8KvAywN4DjYXEIAZkANKvjJbIAhV8KDAS+AowAOCTPkvyFgqzBXgeWAOsBzYBBwBJSgzIAKRDfD8kS0UfBwwHTgHYfc+TfIrC8rXhGeB/AfYWaCAkCTIgA5AM2Xwvp8KPAC4ATgN6AJIjDLyPw1eAZcAK4DWA4w2SGBmQAYiP3LaI+gzgO8B5AJW+FSDxZ+BzBKkHHgZoEF4AGgBJxAzIAERMKKI7E7gEOB+g0h8LSGpngGMEHEh8CHgQoDGgy1IiBoxhgO/004GVAEfB2UCF6DlgL2AlMAPoDUjEQGoM8L1+LLAIoNtLCp8sB3QpLgbOAehJkYiBRBjogVSmAk8C+wEpfrocsA5WA+yBdQUkYiAWBuiqmw3QVSWlN5ODjaib+QBfySRiIBIGOEHn18AHgBTfDg74SvYzYBggEQM1MTAEd1HxPwak+HZy8NHhOvwy/kvEQCAGpPh2KnslI+0agkGBWoAC5ZKBXij1zwE98bNnAFzjwFeD2wGNEYAEySEGOuDfLGAb4DYU/c82FzQEM4E6QJJjBi5G2Z8DpPD55IB1PxHQPAKQkCfhFN0HgIOAlF8c3I92cDogyTgDHVG+mwEOCknxxYG3DXB7M87z0GsBSMiijEehngK8la5j8dG8DTyNNjImiwqQ1zJ1Q8H/BeDa8uaVrd/ipFQb+DPaCr0F6g2ABJuFO+68CJSqZJ0TL35tgL0BLviSWMZAe+R3LrAb8KtkXRdHldoAewNsS9zgRWIBA5z//ShQqVJ1TfxU2wYeQ5vS2gLDDcBk5O9dKb+MX0xt4D3E+z1AYhgDnM33S4DbR1Vr2RVenFXTBtjG2Nb4mikxgIEByAO7Z9VUosKKr7BtYDnaXH8D2n+us8BR/s1A2MrU/eKwljbwOtqe1V4Cm3esnQby7wG4RZdEDKTBAOcJ/DWwE+C6AuvERgPQBizfBtwK8FgiBtJkgG3wPIBuQn7y7AtAEhMDtLj3ArV013SPeIu7Dfw72mbePvEWk6ofHe1JOLUCiLsSFb84DtMGuEMx26okQga4lROnZYapGN0r/pJqA2yr3EVaEgEDwxHHJiCpylM64jqKNrABbfbrEbT/XEcxGqXnF2CiqBDFIR6TbgNsu2zDxorJXoBRYO23QE9j2VPGxEBlBrgBzbcBugi556RxYqoBcJX/BOMYU4bEQHUMcJq6sUbARANA5b8P0JO/uoam0OYyQCPAuQLG9QRMMwCjQZKUHyRIMscAXwdoBJ4HtgJGSAsjcnEoExzt/0/gRIPypKyIgagZ4HJ1bkdPV2HqYooBGAAmlgEDU2dEGRAD8TPARUTnA3RvpyrHpJr6ocQ5a4rdfim/AZWhLCTCAB94vwFSnzGYdg/gSyDhD8A5gEQM5I2BVSjwdwGuJkxF0hwE5Oqpu4ALUym5EhUD6TPQF1k4GXgEOAAkLmkagAUo7YzES6wExYBZDJyO7PBhyF2tEpe0DMA0lPTHgAljEImTrgTFQDMGuGbgA4DzBBKVNMYAxqKE/w3QLyoRA2LgEAP8/gDHA/6YJCFJG4B+hwvYN8lCKi0xYAkDbyCfEwC6CRORJLvgx6FEi4G+iZRMiYgB+xjgA/LfAOpKIpLkGMBPUaLLEymVEhED9jJAI9AOeDSJIiRlAKj4twNJ9jiS4E9piIE4GPgaIt0AvBpH5N44W3h/xHQ8FPEuB7S0NyaCFW0mGdiOUo0HXouzdHH3ANiV4S6+p8VZCMUtBjLIAL1kpwIPAPvjKl/cBuAmZHxqXJlXvGIg4wz0R/n2AaviKmecrwCjkemHgcRGNOMiSfGKgRQZ2IO0LwBiMQJxGYBOyPDjwFmARAyIgXAMvIzbOYHu43DRHH13XK8A85HUpKOT0xkxIAZqYIAD6BxP+58a7q14Sxw9gNFI8fcA90GTiAExEA0DnyMavgpEOlU4agPA9f10+anrDxIkYiBiBp5BfHwV2B1VvFG/AvwDMjYlqswpHjEgBooY6IVfDcDqorMhfkTZA+C65pUAv+ArEQNiIB4GPkG03Dp/XRTRHxNFJIijNTAXkPJHRGhS0XTo0MHp3bt3UskpnfAMUMcWAJHobiSRIDPc1usSQGIZA1OnTnWWLFnitGrVyrKc5zq7F6H03DvACOHA3/NAo2AXB8cff3zjli1bGimTJ09W/dnVhqlzRnjarpPi26X4bn3NmzevoPz8s379+sa6ujoZAbuMwA9Rl6lKX6TOVUtqOJZxMHjw4MYdO3Y0GQAezJ49W/VoVz2+Cd3rCaQmtyFlNRrLOGjRokXj3XffXaT8/PHhhx829u/fX/VpV33+U1raPwgJvy8DYJ8BHDt2bOO+ffuOMgA8sWjRIhkAuwzAp9BB7rmRuNyBFNVYLOOgbdu2jStWrCip/Dy5d+/exhEjRqhe7arXO5PW/mFI8GMZAPsM4JQpU8oqv3th+fLljXALygjYYwQ4OSjRXoCe/vY0jiZFpttvw4YNrp5X/C+3oHXGPbFegJ7+Fio/e2tet19F7cfF+vp6uQXtqmf2AoYAVUkti4HoexxXVSoKnDoDcPs5CxcudNq3bx8oL926dXM+++wz54knnggUXoFSZ4DfF+TankfizElfRK6Rf7ueDI3l3H5+vQC5Ba17DfgI+tk/TgMwH5E3vVPq2A4uxo0b17h//34/fS95XW5BO+rYo4uz4zIAXRDxRk9CMgQWGEM/t19JrfeclFvQOgOwBTraPQ4jwE96S+kt4yCI28+j7yUP5Ra0rt1/P2oD0AYR/kkGwK6GUI3br6Tme07KLWhV3f8fdJU6G5mcg5j4gQL1ACzioBq3n0fXSx7KLWhV2+cGomODaH9QNyAH/84MEqHCmMFAtW4/v1zTLbhr1y65Bf2IMuM69fog8GAU2eFGhNsBPf0t4aBWt1/JR7/npNyCVukA3fV9ojAAV0n5rar4Rrr9yq328+hzTYdyC1rVFjhwH0q4UdwqQE9/SzgI6/bzswpyC1qlC9TdlmEsAN/7d8sA2FPpV155pZ8Oh74ut6A17WEPdDfU2N2PpPzWVHYj3X4bN24MreBBIrj88svVK7SjV/gT6HBNwsUFLwGqaEs4iNLt52cE5Ba0Ri9ehA63q8UCjMBNe2UA7KjoUpt8+ilx2Os33XSTHg7mPxw4J+AbtRiAH0v57VB+uv3uueeesPpc9f1yC9rRPqDHt1VrANhlUPfffOteeALH6fbzswqLFy9WL8D8dvIC9Jmv9IHlDITkCKIq13AO4nb7+RkAuQWt0BG+yp9dSvvLfRuQ84hrGjgolYjOxcfAxIkTndGjR8eXgE/Mbdq0cRYsWKBvC/rwlPJlLgzimF4goVF4HNDT33AOknT7+fUE5BY0Xl8eg06Xe+AXGYa++MV5xDIAhnOQpNvPzwDQLdi5c2e1GXPbzAfQaep2kZRaDTgKIX5QFEo/jGOAq/3uuuuuwJt8xl0ArhbcvXu3s3r16riTUvy1MXAcbuPU4Hrv7aW6BBO8AXRsHgNw+zmzZs1yunbtalTmrr/+egffFjQqT8pMEQPji36V+NEa554D1JUzmIM03X5+rwJyCxqtO9Rt6nhZGYwr/MCADIChHKTt9vMzAHILGq071G3qeJM0fwXg98U6N13VgXEMTJo0KVW3nx8hcgv6MZTqdeo2v+zVJM0NwDebrujAOAa6d+/uzJkzx7h8Nc8QPj/uXHrppc1P67cZDJzrzYbXAPD4LO9FHZvFwIwZM5yBAwealakyubnlllucurq6Mld1OkUGvoK0m7x/XgNwAi4MSDFjSroCA3T7XX311RVCmHXp1FNPda66irvJSQxjgE+QnqXyxCWDBwANABrGQVqr/fwG/Pyua7WgkbpEHT/HNQDeHkBR18ANoP/pM8B36iuuuCL9jFSZA85TwJ4BVd6l4DEzwO4/B/sL4jUATSfdi/qfPgNw+xUG/lq1apV+ZmrIAQ3XiBGB16HUkIJuqYGBprE+1wDw/2k1RKRbYmYg7dV+YYsnt2BYBmO5n+MALbwx82uimwG9/xvEgUmr/fze9/2ua7WgUbrFr3zza99NywPpASg5MshAknQYsMnt58cQ3YJYLegXTNeTYYD6TjQZgJNx3J4nJGYwQLcfDUBWhG5Bm9yYWeG9TDk64nwvXnPHAPqXCajTKTBg6mq/sFRcd911Wi0YlsTo7h/CqFwDoAlA0REbOqaxY+10+/kVnHsGyC3ox1Ji1/sxJdcA9EksWSVUkQHb3X4VC4eLcgv6MZTY9cJDnwaAHw8svA8klrQSKsuA6av9ymY84AW5BQMSFX8wev6OpQHoBGjVRvyE+6YAt58Vq/18C+ITgK84Wi3oQ1L8l7mdVGfXANAISFJmgItnbFntF5aquXPnyi0YlsRw99MnKwMQjsPo7rZttV/YkmfNzRmWjxTu50O/E3sA9AnywwGSlBjIqtvPj86ZM2fKLehHUnzXuTdgRxqA3vGloZiDMJBVt59f2bVa0I+h2K+fRAOgKcCx81w+gay7/cqX/NAVuQX9GIr1eh8aAE4DlqTEQNbdfn60yi3ox1Cs13tyc4C/BbQXQKw8l46cm3wuXbrUuA98lM5tfGf79evnrF+/3nnllVfiS0Qxl2LgTb0ClKIloXNcHJMXt58fpXIL+jEUy/Vu7AFcCxSWBsaShCItyQDdYAsXLjTm234lM5ngSX1bMEGyjyS1kz0ALdI+QkgiR67bj41ecoQBrRY8wkVCR91pANollJiSOcxAXt1+fg1AqwX9GIr8+jHcF+wLgIZAkgADdPstW7bM6M97JUBD2STwbUFn/Pjxzpo1a8qG0YXIGPicii/lj4xP/4hs3+TTv4ThQtBALliwwLF1F+RwpU/87jYcBJyXeLI5TVBuv2AV37dvX6e+vl5uwWB0hQqlp38o+qq7mYNccvv5c8ZB0nnz5unbgv5UhQ6hHkBoCoNFMGzYMOfOO+902rXTmGsQxrhOoKGhwVm1alWQ4ApTIwPsAXxe4726LSADfKLdcMMNTpcuha3YA96lYNdee616TPE2g4M0AJ/Em4Zi56j2ZZddJiKqZIAGc86cOVXepeBVMPAhDcDBKm5Q0CoZYJf/5ptv1qh2lby5wWk4R40a5f7U/2gZaKAB2BFtnIrNy8DkyZOdc88913tKx1UwwNWC8+fPd1q35v4VkogZ+JSDgOyb9o04YkUHBnr06OEsWbJE7/4hW0OfPn2cjRs3OmvXrg0Zk25vxsBm9gA+anZSPyNigINYAwYMiCi2/EbDQVS+RtXVafPqiFvBe+wBsH96dsQR5z66oUOHyu0XYSuQWzBCMo9EtZw9gO1HfusoCgb4xLrxxhvV9Y+CTE8c11xzjdyCHj4iOHyLBmBbBBEpCg8DEyZMcDj4J4mWAfYC5BaMlNPtNABvRxplziOj248fwGzZkl9ck0TNgNyCkTJa2BJsF6LcF2m0OY6MDXTkyJE5ZiDeosstGBm/nAG8iz2AnYcRWcx5jYhuP3VR4699GljNrAzNc0HvaQA+PYzQMeY9Ag5Sye0XfyvgICsNrdyCobguMgCaCxCKS+yrDrff9OnTQ8ai24MyMGjQIIfLqyU1M8A1QIVNQbklmKYD18yj48jtF4K8ELdqW/UQ5DnOO7j7AF8BKK8f+qe/tTDA1X5y+9XCXLh79G3BUPwV3P+uAXgjVFQ5vpluP76Pyu2XTiOg4ZXXpSbuCw991wCsrykK3VQYjVYDTK8huN8W1GrBqutgC+9wDQDfBzgfQFIFA3L7VUFWjEHlFqya3D244y3e5RqA93BMSKpgQG6/KsiKMajcglWTy/U/BX13DQBdAuwFSAIyQLfftGnTAoZWsLgZoFuQy68lgRjg9P+C6981AI04sSnQrQpUYICbfHIUWmIOA1otGLgu1iFkYStA1wDwzucC357zgFrtZ2YDkFswcL285ob0GgCe5KQgSQUGtMlnBXIMuCS3oG8lUMdfckN5DcBWnHzfvaD/pRngIhRt8lmaGxPOyi3oWwscAGzaA8RrAHhB4wAV+JPbrwI5Bl2iW3DSpEkG5ciorHACUJPHz2sAiroGRmXZkMzI7WdIRfhkg25BbSJaliSO9TV9C4SbgnrlOPyQ6fQycvhYm3yWIMXgUxwQ3Lt3r7Ny5UqDc5lK1n6BVJtm/np7AMzNqwD3B5B4GNBqPw8ZFh1qteBRlUXdbvIA8GpzA8D5wXxHkHgY0Lf9PGRYdCi34FGVRd0urAFwrzQ3ANwb8Cn3ov47hc95c7Vfq1atRIeFDMgtWFRp1O2i/T+bGwCGfrzolpz/kNvP7gYgt2BR/T1W9As/mg8C8vpe4AqAA4K5Frr9li5dqg98WN4K9G3BQgV+gL8/AorG+Er1AN5EoJcLt+T8j9x+2WgAcgsW6pHz/6nbRVKqB8CFQd2A84pC5uwH3X533HGH0759+5yVPJvFlVvQuQM1+2Tz2i3VA2CYNQA/HJBLcd1+bDSS7DBAt+App5ySnQIFL0kDgq4oFbycAeCH2Iv8haVuzuo5uf2yWbM06JwhmEPZiDLXlyp3OQPAgcBHS92Q9XPuJp9y+2WzpnP66bY/oDbZCzhKyhkABnwIKPIZHnV3Bk/ktIFksCZLFymHbkG+yj9Smo3SbkA3LLcMugg4wT2R9f9y+2W9hg+Vj27BTZs2OWvX8k0388Lp/bcCB0qVtFIPgF2GZaVuyuo5uf2yWrPF5eIgLz/hnpNvCz6M0vOVvqSUcgN6A3LSwBQg8/Ng5fbzVnv2j7t16+Y0NDQ4q1atynJh96BwswDu9VFSWpQ8e+RkSxwuB0YeOZW9I35U4r777nMuvvji7BVOJSrLAA3A8OHDnXXrOEcmk7IapRoP7C9XOip4JeF7w31Apg0Au4JsBPX19U5jI+dBSfLAwLHHHpv1ad73ox7LKj/r2K8HwDB9gGeA4/lDIgbEgBUMcNuvs4CK3/uoNAjolpIbCNKPKBEDYsAeBjiAX1H5WZQgBoDh7gVyNyeABZeIAQsZYLf/7iD5DmoAuDbghSARKowYEAOpM8BX9meD5CKoAeBson8NEqHCiAExkDoD7LFTZ30lyCCgGwkHAbmlUD/3hP6LATFgHAObkKOvAx8HyVnQHgDj4o4ii4JEqjBiQAykxgDd9oGUnzmspgfA8P0Bvlt04Q+JGBADRjHAh/RwYGvQXFXTA2Cc3FL4t0EjVzgxIAYSZWApUttaTYrV9gAY9xCAWwt15g+JGBADRjDwCXJxLsDVf4Gl2h4AI14P8D1DIgbEgDkMUCerUn5mvZYeAO8bCnBugHoBZEMiBtJloKanP7NcSw+A970GqBdAJiRiIH0Ganr6M9u19gB4L3sBHAvoxB8SMSAGUmGAI/989+fGn1VLrT0AJsRegOYFVE25bhADkTLAOf81KT9zEaYHwPt7Ak8DJ/OHRAyIgUQZ4JLfbwBba03Vb0swv3j/jADcVGSCX0BdFwNiIHIG5iDGR8PEGrYHwLQ7AKuAr/KHRAyIgUQY4OrcMcBnYVIL2wNg2twnYAcwEYjCoCAaiRgQAz4MXI3rL/mE8b0cZhDQG/mD+PGQ94SOxYAYiI2B3yFmbvcdWqJ8Yp+G3PBVoC50rhSBGBAD5RjgpJ/RwNpyAao5H8UrgJse/ZGtgLHuCf0XA2IgcgZuRYwPRBVrlD0A5uk44I/A2fwhEQNiIFIGnkNs44BQA3/eHEXZA2C83IyQS4YnA37fHEAQiRgQAwEZoMt9KrAhYPhAwaI2AEz0DaA7wI0JJGJADETDwD8jmshn3kb9CuAWtQsOVgIcGJSIATEQjgF2/ccDO8NFc/TdUbkBm8fMPcmuA/Y0v6DfYkAMVMXAboT+IRC58jMXcbwCMF7KVoDjAGMAiRgQA7Ux8BPctrS2W/3viusVwE25PQ44SYjdF4kYEAPVMUCP2oVAQ3W3BQ8dtwFgTrhvwOMAVw5KxIAYCMYAV/rR5cdl97FJnK8Abqa5TuBt4K+AuMYc3LT0XwxkgYEDKMQ0YEXchUnCALAMrwKcIsy1yxIxIAYqM/ArXP5F5SDRXE3iFcDNKWcJcsGQpgq7jOi/GDiaAT71vwNw9D92SdIAsDADgMeAfvwhEQNioIiBrfjFByQn0yUiSb+Tv45S/R3AaY0SMSAGjjCwC4c/ABJTfiad1BgA03KFBeSSxguApHsgbh70XwyYxMAXyMxM4D+SzlQaBoBl5NTGjsA3+UMiBnLOwE9RfiJxScsAsKBPABwLOJ0/JGIgpwzci3L/I0DXX+KSdhe8E0rMmYKjEi+5EhQD6TPwJ2ThL4HI1vdXW6SkBwGb528nTvwN8GzzC/otBjLOANv85UBqyk9+0+4BMA+UgcAyYAB/SMRAxhnYhPKdD9Arlqqk3QNwC09CrgDedU/ovxjIKANs41OA1JWf/KY5CMj0vfIOfvBjB98GOngv6FgMZIQBLvD5HrDGlPKYZADIyVbgeUBGACRIMsUAlZ/v/CtNKpVpBoDcbAU4T0BGACRIMsEAlZ8b5a4yrTQmGgBytA1QT8C01qL81MKA++Q3TvlZGFMNAPO2FaAR+BbAWYMSMWAbAxzw4zv/SlMzbrIBIGdbgSeBkUBXQCIGbGFgMzLKbj8n+0hCMnAK7n8aaBTEgQVtgG11ECCJkIGTENdqQEZAHJjcBlagjbKtWiGmvwJ4SeSUyf8CSK4WEHmZ0bEpDPwGGfk+wA/lWiE2GQASuhfglGHOYOT+gqbMZERWJDlmgOv5fwlwTb82u0moIUxHOlxMZHJ3UHnLfv1Q4acl1OaVTDMGxuE351RL0cRBGm2AbW98szapnwkz0B/pLQfSaABKM7+8P442NyDhth55craNAZQigPsL/g7gZ8jOBjQuABIksTHA9/1fAX8PvB9bKoq4Jga4pJhTL/VkFgdxtAHO7OPkHonBDAxD3h4D4mgAijO/vD6KNsW2JbGAgbbI41yAI7RSWnEQpg3wCz1sS3zFlFjGwFjkV1OIZQBqNQAvof3Q0ySxmIE65P12QL0BGYKghoATzjjQ1w2QZISBMSiHegMyAn5G4Cm0E/n2M6L0zYvB3sBsgK5Dv4ag6/ni6CO0iZsB7T0BErIuXEx0PyAlFwcH0Q4eAE4DJDlioCXKOhHg/oMyBPnkgHV/CSDJMQN8LZgJbAdkCPLBAfecnAV0ACRioMBAP/ylt0CGILtG4GPU78+BXoBEDJRkgFs5/RrgoJB6BNnggIrPOh0KSMRAIAa+jFAyBHYbACl+oKauQJUY4PzvnwF6NbDHGHyA+tITv1Kr1rWqGeAYwXxgI6BXAzM52IK64TwP7iItEQOxMMDvE1wFPAHsB2QM0uWAdcBvR0wFegASMZAIA5xHcA6wGOCXjWUIkuWAr2SLAC74ag1IxEBqDPRGyjOAlUADIGMQDwd7DnM8Hf/5SiYJyUCLkPfr9mIGuB3ZGcB3gYsADiCypyCpnQFuwbUO4HbwnLL7PCCJiAEZgIiILBFNO5z7KnA+cCEwGGgDSPwZ4Hs9lZ678PweeBHgEl1JxAzIAERMaJno2uI8J6GMAWgQOMdAA1YgwSPv45hK/wiwBuBmHPsASYwMyADESG6FqPvjGleffQvgTsZ0W3UG8iSforCbgaeB5QAV/g1AkiADMgAJkl0mKY4RDASGACOAMwEaiJOBLAk9Ja8DVPTVwGvAJuAAIEmJARmAlIj3SbYXrtOz8BcABxLZWzgJ6Am0B0yWXcgcXXTvAlTwZ4H1wDbgLUBiEAMyAAZVhk9WuuM6DQANQT+Arw19ABoLLmnuBHwJ4HhDnML3cnbfdwIfATsAzsAj6gE+6WkAOA9fYjgDMgCGV1CA7NH16BoAGoGOAHsPJwJur+EEHNM48Ho7gMaked1/jnOfAJzDQKWmAn8IvAdQobcBbwN8wlP5aQRoACQWM/D/QN+5DmrsiuEAAAAASUVORK5CYII="
}];
var rootNotFoundModule = null;
var rootForbiddenModule = null;
var rootUnauthorizedModule = null;
var rootLayouts = [layout_exports$3];
/**
* Render an HTTP access fallback page (not-found/forbidden/unauthorized) with layouts and noindex meta.
* Returns null if no matching component is available.
*
* @param opts.boundaryComponent - Override the boundary component (for layout-level notFound)
* @param opts.layouts - Override the layouts to wrap with (for layout-level notFound, excludes the throwing layout)
*/
async function renderHTTPAccessFallbackPage(route, statusCode, isRscRequest, request, opts) {
	return renderAppPageHttpAccessFallback({
		boundaryComponent: opts?.boundaryComponent ?? null,
		buildFontLinkHeader: buildAppPageFontLinkHeader,
		clearRequestContext() {
			setHeadersContext(null);
			setNavigationContext(null);
		},
		createRscOnErrorHandler(pathname, routePath) {
			return createRscOnErrorHandler(request, pathname, routePath);
		},
		getFontLinks: getSSRFontLinks,
		getFontPreloads: _getSSRFontPreloads,
		getFontStyles: _getSSRFontStyles,
		getNavigationContext,
		globalErrorModule: null,
		isRscRequest,
		layoutModules: opts?.layouts ?? null,
		loadSsrHandler() {
			return import("./ssr/index.js");
		},
		makeThenableParams,
		matchedParams: opts?.matchedParams ?? route?.params ?? {},
		requestUrl: request.url,
		resolveChildSegments: __resolveChildSegments,
		rootForbiddenModule,
		rootLayouts,
		rootNotFoundModule,
		rootUnauthorizedModule,
		route,
		renderToReadableStream,
		statusCode
	});
}
/** Convenience: render a not-found page (404) */
async function renderNotFoundPage(route, isRscRequest, request, matchedParams) {
	return renderHTTPAccessFallbackPage(route, 404, isRscRequest, request, { matchedParams });
}
/**
* Render an error.tsx boundary page when a server component or generateMetadata() throws.
* Returns null if no error boundary component is available for this route.
*
* Next.js returns HTTP 200 when error.tsx catches an error (the error is "handled"
* by the boundary). This matches that behavior intentionally.
*/
async function renderErrorBoundaryPage(route, error, isRscRequest, request, matchedParams) {
	return renderAppPageErrorBoundary({
		buildFontLinkHeader: buildAppPageFontLinkHeader,
		clearRequestContext() {
			setHeadersContext(null);
			setNavigationContext(null);
		},
		createRscOnErrorHandler(pathname, routePath) {
			return createRscOnErrorHandler(request, pathname, routePath);
		},
		error,
		getFontLinks: getSSRFontLinks,
		getFontPreloads: _getSSRFontPreloads,
		getFontStyles: _getSSRFontStyles,
		getNavigationContext,
		globalErrorModule: null,
		isRscRequest,
		loadSsrHandler() {
			return import("./ssr/index.js");
		},
		makeThenableParams,
		matchedParams: matchedParams ?? route?.params ?? {},
		requestUrl: request.url,
		resolveChildSegments: __resolveChildSegments,
		rootLayouts,
		route,
		renderToReadableStream,
		sanitizeErrorForClient: __sanitizeErrorForClient
	});
}
function matchRoute(url) {
	const pathname = url.split("?")[0];
	return trieMatch(_routeTrie, (pathname === "/" ? "/" : pathname.replace(/\/$/, "")).split("/").filter(Boolean));
}
function matchPattern(urlParts, patternParts) {
	const params = Object.create(null);
	for (let i = 0; i < patternParts.length; i++) {
		const pp = patternParts[i];
		if (pp.endsWith("+")) {
			if (i !== patternParts.length - 1) return null;
			const paramName = pp.slice(1, -1);
			const remaining = urlParts.slice(i);
			if (remaining.length === 0) return null;
			params[paramName] = remaining;
			return params;
		}
		if (pp.endsWith("*")) {
			if (i !== patternParts.length - 1) return null;
			const paramName = pp.slice(1, -1);
			params[paramName] = urlParts.slice(i);
			return params;
		}
		if (pp.startsWith(":")) {
			if (i >= urlParts.length) return null;
			params[pp.slice(1)] = urlParts[i];
			continue;
		}
		if (i >= urlParts.length || urlParts[i] !== pp) return null;
	}
	if (urlParts.length !== patternParts.length) return null;
	return params;
}
var interceptLookup = [];
for (let ri = 0; ri < routes.length; ri++) {
	const r = routes[ri];
	if (!r.slots) continue;
	for (const [slotName, slotMod] of Object.entries(r.slots)) {
		if (!slotMod.intercepts) continue;
		for (const intercept of slotMod.intercepts) interceptLookup.push({
			sourceRouteIndex: ri,
			slotName,
			targetPattern: intercept.targetPattern,
			targetPatternParts: intercept.targetPattern.split("/").filter(Boolean),
			page: intercept.page,
			params: intercept.params
		});
	}
}
/**
* Check if a pathname matches any intercepting route.
* Returns the match info or null.
*/
function findIntercept(pathname) {
	const urlParts = pathname.split("/").filter(Boolean);
	for (const entry of interceptLookup) {
		const params = matchPattern(urlParts, entry.targetPatternParts);
		if (params !== null) return {
			...entry,
			matchedParams: params
		};
	}
	return null;
}
async function buildPageElement(route, params, opts, searchParams) {
	const PageComponent = route.page?.default;
	if (!PageComponent) return (0, import_react_react_server.createElement)("div", null, "Page has no default export");
	const layoutMods = route.layouts.filter(Boolean);
	const layoutMetaPromises = [];
	let accumulatedMetaPromise = Promise.resolve({});
	for (let i = 0; i < layoutMods.length; i++) {
		const parentForThisLayout = accumulatedMetaPromise;
		const metaPromise = resolveModuleMetadata(layoutMods[i], params, void 0, parentForThisLayout).catch((err) => {
			console.error("[vinext] Layout generateMetadata() failed:", err);
			return null;
		});
		layoutMetaPromises.push(metaPromise);
		accumulatedMetaPromise = metaPromise.then(async (result) => result ? mergeMetadata([await parentForThisLayout, result]) : await parentForThisLayout);
	}
	const pageParentPromise = accumulatedMetaPromise;
	const spObj = {};
	let hasSearchParams = false;
	if (searchParams && searchParams.forEach) searchParams.forEach(function(v, k) {
		hasSearchParams = true;
		if (k in spObj) spObj[k] = Array.isArray(spObj[k]) ? spObj[k].concat(v) : [spObj[k], v];
		else spObj[k] = v;
	});
	const [layoutMetaResults, layoutVpResults, pageMeta, pageVp] = await Promise.all([
		Promise.all(layoutMetaPromises),
		Promise.all(layoutMods.map((mod) => resolveModuleViewport(mod, params).catch((err) => {
			console.error("[vinext] Layout generateViewport() failed:", err);
			return null;
		}))),
		route.page ? resolveModuleMetadata(route.page, params, spObj, pageParentPromise) : Promise.resolve(null),
		route.page ? resolveModuleViewport(route.page, params) : Promise.resolve(null)
	]);
	const metadataList = [...layoutMetaResults.filter(Boolean), ...pageMeta ? [pageMeta] : []];
	const viewportList = [...layoutVpResults.filter(Boolean), ...pageVp ? [pageVp] : []];
	const resolvedMetadata = metadataList.length > 0 ? mergeMetadata(metadataList) : null;
	const resolvedViewport = mergeViewport(viewportList);
	const pageProps = { params: makeThenableParams(params) };
	if (searchParams) {
		pageProps.searchParams = makeThenableParams(spObj);
		if (hasSearchParams) markDynamicUsage();
	}
	let element = (0, import_react_react_server.createElement)(PageComponent, pageProps);
	element = (0, import_react_react_server.createElement)(LayoutSegmentProvider, { childSegments: [] }, element);
	{
		const headElements = [];
		headElements.push((0, import_react_react_server.createElement)("meta", { charSet: "utf-8" }));
		if (resolvedMetadata) headElements.push((0, import_react_react_server.createElement)(MetadataHead, { metadata: resolvedMetadata }));
		headElements.push((0, import_react_react_server.createElement)(ViewportHead, { viewport: resolvedViewport }));
		element = (0, import_react_react_server.createElement)(import_react_react_server.Fragment, null, ...headElements, element);
	}
	if (route.loading?.default) element = (0, import_react_react_server.createElement)(import_react_react_server.Suspense, { fallback: (0, import_react_react_server.createElement)(route.loading.default) }, element);
	{
		const lastLayoutError = route.errors ? route.errors[route.errors.length - 1] : null;
		if (route.error?.default && route.error !== lastLayoutError) element = (0, import_react_react_server.createElement)(ErrorBoundary, {
			fallback: route.error.default,
			children: element
		});
	}
	{
		const NotFoundComponent = route.notFound?.default ?? null;
		if (NotFoundComponent) element = (0, import_react_react_server.createElement)(NotFoundBoundary, {
			fallback: (0, import_react_react_server.createElement)(NotFoundComponent),
			children: element
		});
	}
	if (route.templates) for (let i = route.templates.length - 1; i >= 0; i--) {
		const TemplateComponent = route.templates[i]?.default;
		if (TemplateComponent) element = (0, import_react_react_server.createElement)(TemplateComponent, {
			children: element,
			params
		});
	}
	for (let i = route.layouts.length - 1; i >= 0; i--) {
		if (route.errors && route.errors[i]?.default) element = (0, import_react_react_server.createElement)(ErrorBoundary, {
			fallback: route.errors[i].default,
			children: element
		});
		const LayoutComponent = route.layouts[i]?.default;
		if (LayoutComponent) {
			{
				const LayoutNotFound = route.notFounds?.[i]?.default;
				if (LayoutNotFound) element = (0, import_react_react_server.createElement)(NotFoundBoundary, {
					fallback: (0, import_react_react_server.createElement)(LayoutNotFound),
					children: element
				});
			}
			const layoutProps = {
				children: element,
				params: makeThenableParams(params)
			};
			if (route.slots) for (const [slotName, slotMod] of Object.entries(route.slots)) {
				const targetIdx = slotMod.layoutIndex >= 0 ? slotMod.layoutIndex : route.layouts.length - 1;
				if (i !== targetIdx) continue;
				let SlotPage = null;
				let slotParams = params;
				if (opts && opts.interceptSlot === slotName && opts.interceptPage) {
					SlotPage = opts.interceptPage.default;
					slotParams = opts.interceptParams || params;
				} else SlotPage = slotMod.page?.default || slotMod.default?.default;
				if (SlotPage) {
					let slotElement = (0, import_react_react_server.createElement)(SlotPage, { params: makeThenableParams(slotParams) });
					const SlotLayout = slotMod.layout?.default;
					if (SlotLayout) slotElement = (0, import_react_react_server.createElement)(SlotLayout, {
						children: slotElement,
						params: makeThenableParams(slotParams)
					});
					if (slotMod.loading?.default) slotElement = (0, import_react_react_server.createElement)(import_react_react_server.Suspense, { fallback: (0, import_react_react_server.createElement)(slotMod.loading.default) }, slotElement);
					if (slotMod.error?.default) slotElement = (0, import_react_react_server.createElement)(ErrorBoundary, {
						fallback: slotMod.error.default,
						children: slotElement
					});
					layoutProps[slotName] = slotElement;
				}
			}
			element = (0, import_react_react_server.createElement)(LayoutComponent, layoutProps);
			const treePos = route.layoutTreePositions ? route.layoutTreePositions[i] : 0;
			element = (0, import_react_react_server.createElement)(LayoutSegmentProvider, { childSegments: __resolveChildSegments(route.routeSegments || [], treePos, params) }, element);
		}
	}
	return element;
}
var __mwPatternCache = /* @__PURE__ */ new Map();
function __extractConstraint(str, re) {
	if (str[re.lastIndex] !== "(") return null;
	const start = re.lastIndex + 1;
	let depth = 1;
	let i = start;
	while (i < str.length && depth > 0) {
		if (str[i] === "(") depth++;
		else if (str[i] === ")") depth--;
		i++;
	}
	if (depth !== 0) return null;
	re.lastIndex = i;
	return str.slice(start, i - 1);
}
function __compileMwPattern(pattern) {
	const hasConstraints = /:[\w-]+[*+]?\(/.test(pattern);
	if (!hasConstraints && (pattern.includes("(") || pattern.includes("\\"))) return __safeRegExp("^" + pattern + "$");
	let regexStr = "";
	const tokenRe = /\/:([\w-]+)\*|\/:([\w-]+)\+|:([\w-]+)|[.]|[^/:.]+|./g;
	let tok;
	while ((tok = tokenRe.exec(pattern)) !== null) if (tok[1] !== void 0) {
		const c1 = hasConstraints ? __extractConstraint(pattern, tokenRe) : null;
		regexStr += c1 !== null ? "(?:/(" + c1 + "))?" : "(?:/.*)?";
	} else if (tok[2] !== void 0) {
		const c2 = hasConstraints ? __extractConstraint(pattern, tokenRe) : null;
		regexStr += c2 !== null ? "(?:/(" + c2 + "))" : "(?:/.+)";
	} else if (tok[3] !== void 0) {
		const constraint = hasConstraints ? __extractConstraint(pattern, tokenRe) : null;
		const isOptional = pattern[tokenRe.lastIndex] === "?";
		if (isOptional) tokenRe.lastIndex += 1;
		const group = constraint !== null ? "(" + constraint + ")" : "([^/]+)";
		if (isOptional && regexStr.endsWith("/")) regexStr = regexStr.slice(0, -1) + "(?:/" + group + ")?";
		else if (isOptional) regexStr += group + "?";
		else regexStr += group;
	} else if (tok[0] === ".") regexStr += "\\.";
	else regexStr += tok[0];
	return __safeRegExp("^" + regexStr + "$");
}
function matchMiddlewarePattern(pathname, pattern) {
	let cached = __mwPatternCache.get(pattern);
	if (cached === void 0) {
		cached = __compileMwPattern(pattern);
		__mwPatternCache.set(pattern, cached);
	}
	return cached ? cached.test(pathname) : pathname === pattern;
}
var __middlewareConditionRegexCache = /* @__PURE__ */ new Map();
var __emptyMiddlewareRequestContext = {
	headers: new Headers(),
	cookies: {},
	query: new URLSearchParams(),
	host: ""
};
function __normalizeMiddlewareHost(hostHeader, fallbackHostname) {
	return (hostHeader ?? fallbackHostname).split(":", 1)[0].toLowerCase();
}
function __parseMiddlewareCookies(cookieHeader) {
	if (!cookieHeader) return {};
	const cookies = {};
	for (const part of cookieHeader.split(";")) {
		const eq = part.indexOf("=");
		if (eq === -1) continue;
		const key = part.slice(0, eq).trim();
		const value = part.slice(eq + 1).trim();
		if (key) cookies[key] = value;
	}
	return cookies;
}
function __middlewareRequestContextFromRequest(request) {
	if (!request) return __emptyMiddlewareRequestContext;
	const url = new URL(request.url);
	return {
		headers: request.headers,
		cookies: __parseMiddlewareCookies(request.headers.get("cookie")),
		query: url.searchParams,
		host: __normalizeMiddlewareHost(request.headers.get("host"), url.hostname)
	};
}
function __stripMiddlewareLocalePrefix(pathname, i18nConfig) {
	if (pathname === "/") return null;
	const segments = pathname.split("/");
	const firstSegment = segments[1];
	if (!firstSegment || !i18nConfig || !i18nConfig.locales.includes(firstSegment)) return null;
	const stripped = "/" + segments.slice(2).join("/");
	return stripped === "/" ? "/" : stripped.replace(/\/+$/, "") || "/";
}
function __matchMiddlewareMatcherPattern(pathname, pattern, i18nConfig) {
	if (!i18nConfig) return matchMiddlewarePattern(pathname, pattern);
	return matchMiddlewarePattern(__stripMiddlewareLocalePrefix(pathname, i18nConfig) ?? pathname, pattern);
}
function __middlewareConditionRegex(value) {
	if (__middlewareConditionRegexCache.has(value)) return __middlewareConditionRegexCache.get(value);
	const re = __safeRegExp(value);
	__middlewareConditionRegexCache.set(value, re);
	return re;
}
function __checkMiddlewareCondition(condition, ctx) {
	switch (condition.type) {
		case "header": {
			const headerValue = ctx.headers.get(condition.key);
			if (headerValue === null) return false;
			if (condition.value !== void 0) {
				const re = __middlewareConditionRegex(condition.value);
				if (re) return re.test(headerValue);
				return headerValue === condition.value;
			}
			return true;
		}
		case "cookie": {
			const cookieValue = ctx.cookies[condition.key];
			if (cookieValue === void 0) return false;
			if (condition.value !== void 0) {
				const re = __middlewareConditionRegex(condition.value);
				if (re) return re.test(cookieValue);
				return cookieValue === condition.value;
			}
			return true;
		}
		case "query": {
			const queryValue = ctx.query.get(condition.key);
			if (queryValue === null) return false;
			if (condition.value !== void 0) {
				const re = __middlewareConditionRegex(condition.value);
				if (re) return re.test(queryValue);
				return queryValue === condition.value;
			}
			return true;
		}
		case "host":
			if (condition.value !== void 0) {
				const re = __middlewareConditionRegex(condition.value);
				if (re) return re.test(ctx.host);
				return ctx.host === condition.value;
			}
			return ctx.host === condition.key;
		default: return false;
	}
}
function __checkMiddlewareHasConditions(has, missing, ctx) {
	if (has) {
		for (const condition of has) if (!__checkMiddlewareCondition(condition, ctx)) return false;
	}
	if (missing) {
		for (const condition of missing) if (__checkMiddlewareCondition(condition, ctx)) return false;
	}
	return true;
}
function __isValidMiddlewareMatcherObject(matcher) {
	if (!matcher || typeof matcher !== "object" || Array.isArray(matcher)) return false;
	if (typeof matcher.source !== "string") return false;
	for (const key of Object.keys(matcher)) if (key !== "source" && key !== "locale" && key !== "has" && key !== "missing") return false;
	if ("locale" in matcher && matcher.locale !== void 0 && matcher.locale !== false) return false;
	if ("has" in matcher && matcher.has !== void 0 && !Array.isArray(matcher.has)) return false;
	if ("missing" in matcher && matcher.missing !== void 0 && !Array.isArray(matcher.missing)) return false;
	return true;
}
function __matchMiddlewareObject(pathname, matcher, i18nConfig) {
	return matcher.locale === false ? matchMiddlewarePattern(pathname, matcher.source) : __matchMiddlewareMatcherPattern(pathname, matcher.source, i18nConfig);
}
function matchesMiddleware(pathname, matcher, request, i18nConfig) {
	if (!matcher) return true;
	if (typeof matcher === "string") return __matchMiddlewareMatcherPattern(pathname, matcher, i18nConfig);
	if (!Array.isArray(matcher)) return false;
	const requestContext = __middlewareRequestContextFromRequest(request);
	for (const m of matcher) {
		if (typeof m === "string") {
			if (__matchMiddlewareMatcherPattern(pathname, m, i18nConfig)) return true;
			continue;
		}
		if (__isValidMiddlewareMatcherObject(m)) {
			if (!__matchMiddlewareObject(pathname, m, i18nConfig)) continue;
			if (!__checkMiddlewareHasConditions(m.has, m.missing, requestContext)) continue;
			return true;
		}
	}
	return false;
}
var __basePath = "";
var __trailingSlash = false;
var __i18nConfig = null;
var __configRedirects = [];
var __configRewrites = {
	"beforeFiles": [],
	"afterFiles": [],
	"fallback": []
};
var __configHeaders = [];
var __allowedOrigins = [];
function __isSafeRegex(pattern) {
	const quantifierAtDepth = [];
	let depth = 0;
	let i = 0;
	while (i < pattern.length) {
		const ch = pattern[i];
		if (ch === "\\") {
			i += 2;
			continue;
		}
		if (ch === "[") {
			i++;
			while (i < pattern.length && pattern[i] !== "]") {
				if (pattern[i] === "\\") i++;
				i++;
			}
			i++;
			continue;
		}
		if (ch === "(") {
			depth++;
			if (quantifierAtDepth.length <= depth) quantifierAtDepth.push(false);
			else quantifierAtDepth[depth] = false;
			i++;
			continue;
		}
		if (ch === ")") {
			const hadQ = depth > 0 && quantifierAtDepth[depth];
			if (depth > 0) depth--;
			const next = pattern[i + 1];
			if (next === "+" || next === "*" || next === "{") {
				if (hadQ) return false;
				if (depth >= 0 && depth < quantifierAtDepth.length) quantifierAtDepth[depth] = true;
			}
			i++;
			continue;
		}
		if (ch === "+" || ch === "*") {
			if (depth > 0) quantifierAtDepth[depth] = true;
			i++;
			continue;
		}
		if (ch === "?") {
			const prev = i > 0 ? pattern[i - 1] : "";
			if (prev !== "+" && prev !== "*" && prev !== "?" && prev !== "}") {
				if (depth > 0) quantifierAtDepth[depth] = true;
			}
			i++;
			continue;
		}
		if (ch === "{") {
			let j = i + 1;
			while (j < pattern.length && /[\d,]/.test(pattern[j])) j++;
			if (j < pattern.length && pattern[j] === "}" && j > i + 1) {
				if (depth > 0) quantifierAtDepth[depth] = true;
				i = j + 1;
				continue;
			}
		}
		i++;
	}
	return true;
}
function __safeRegExp(pattern, flags) {
	if (!__isSafeRegex(pattern)) {
		console.warn("[vinext] Ignoring potentially unsafe regex pattern (ReDoS risk): " + pattern);
		return null;
	}
	try {
		return new RegExp(pattern, flags);
	} catch {
		return null;
	}
}
function __normalizePath(pathname) {
	if (pathname === "/" || pathname.length > 1 && pathname[0] === "/" && !pathname.includes("//") && !pathname.includes("/./") && !pathname.includes("/../") && !pathname.endsWith("/.") && !pathname.endsWith("/..")) return pathname;
	const segments = pathname.split("/");
	const resolved = [];
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i];
		if (seg === "" || seg === ".") continue;
		if (seg === "..") resolved.pop();
		else resolved.push(seg);
	}
	return "/" + resolved.join("/");
}
var __pathDelimiterRegex = /([/#?\\]|%(2f|23|3f|5c))/gi;
function __decodeRouteSegment(segment) {
	return decodeURIComponent(segment).replace(__pathDelimiterRegex, function(char) {
		return encodeURIComponent(char);
	});
}
function __decodeRouteSegmentSafe(segment) {
	try {
		return __decodeRouteSegment(segment);
	} catch (e) {
		return segment;
	}
}
function __normalizePathnameForRouteMatch(pathname) {
	const segments = pathname.split("/");
	const normalized = [];
	for (let i = 0; i < segments.length; i++) normalized.push(__decodeRouteSegmentSafe(segments[i]));
	return normalized.join("/");
}
function __normalizePathnameForRouteMatchStrict(pathname) {
	const segments = pathname.split("/");
	const normalized = [];
	for (let i = 0; i < segments.length; i++) normalized.push(__decodeRouteSegment(segments[i]));
	return normalized.join("/");
}
/**
* Build a request context from the live ALS HeadersContext, which reflects
* any x-middleware-request-* header mutations applied by middleware.
* Used for afterFiles and fallback rewrite has/missing evaluation — these
* run after middleware in the App Router execution order.
*/
function __buildPostMwRequestContext(request) {
	const url = new URL(request.url);
	const ctx = getHeadersContext();
	if (!ctx) return requestContextFromRequest(request);
	const cookiesRecord = Object.fromEntries(ctx.cookies);
	return {
		headers: ctx.headers,
		cookies: cookiesRecord,
		query: url.searchParams,
		host: normalizeHost(ctx.headers.get("host"), url.hostname)
	};
}
/**
* Maximum server-action request body size.
* Configurable via experimental.serverActions.bodySizeLimit in next.config.
* Defaults to 1MB, matching the Next.js default.
* @see https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#bodysizelimit
* Prevents unbounded request body buffering.
*/
var __MAX_ACTION_BODY_SIZE = 1048576;
/**
* Read a request body as text with a size limit.
* Enforces the limit on the actual byte stream to prevent bypasses
* via chunked transfer-encoding where Content-Length is absent or spoofed.
*/
async function __readBodyWithLimit(request, maxBytes) {
	if (!request.body) return "";
	var reader = request.body.getReader();
	var decoder = new TextDecoder();
	var chunks = [];
	var totalSize = 0;
	for (;;) {
		var result = await reader.read();
		if (result.done) break;
		totalSize += result.value.byteLength;
		if (totalSize > maxBytes) {
			reader.cancel();
			throw new Error("Request body too large");
		}
		chunks.push(decoder.decode(result.value, { stream: true }));
	}
	chunks.push(decoder.decode());
	return chunks.join("");
}
/**
* Read a request body as FormData with a size limit.
* Consumes the body stream with a byte counter and then parses the
* collected bytes as multipart form data via the Response constructor.
*/
async function __readFormDataWithLimit(request, maxBytes) {
	if (!request.body) return new FormData();
	var reader = request.body.getReader();
	var chunks = [];
	var totalSize = 0;
	for (;;) {
		var result = await reader.read();
		if (result.done) break;
		totalSize += result.value.byteLength;
		if (totalSize > maxBytes) {
			reader.cancel();
			throw new Error("Request body too large");
		}
		chunks.push(result.value);
	}
	var combined = new Uint8Array(totalSize);
	var offset = 0;
	for (var chunk of chunks) {
		combined.set(chunk, offset);
		offset += chunk.byteLength;
	}
	var contentType = request.headers.get("content-type") || "";
	return new Response(combined, { headers: { "Content-Type": contentType } }).formData();
}
var generateStaticParamsMap = {
	"/teacher/exams/:examId/edit": null,
	"/teacher/dashboard/:examId/students/:studentId": null,
	"/teacher/dashboard/:examId": null,
	"/teacher/exams/:examId": null,
	"/sign-in/:sign-in*": null,
	"/sign-up/:sign-up*": null
};
async function handler(request, ctx) {
	return runWithRequestContext(createRequestContext({
		headersContext: headersContextFromRequest(request),
		executionContext: ctx ?? getRequestExecutionContext() ?? null
	}), async () => {
		ensureFetchPatch();
		const __reqCtx = requestContextFromRequest(request);
		const response = await _handleRequest(request, __reqCtx, {
			headers: null,
			status: null
		});
		if (response && response.headers && !(response.status >= 300 && response.status < 400)) {
			if (__configHeaders.length) {
				const url = new URL(request.url);
				let pathname;
				try {
					pathname = __normalizePath(__normalizePathnameForRouteMatch(url.pathname));
				} catch {
					pathname = url.pathname;
				}
				const extraHeaders = matchHeaders(pathname, __configHeaders, __reqCtx);
				for (const h of extraHeaders) {
					const lk = h.key.toLowerCase();
					if (lk === "vary" || lk === "set-cookie") response.headers.append(h.key, h.value);
					else if (!response.headers.has(lk)) response.headers.set(h.key, h.value);
				}
			}
		}
		return response;
	});
}
async function _handleRequest(request, __reqCtx, _mwCtx) {
	const __reqStart = 0;
	const url = new URL(request.url);
	const __protoGuard = guardProtocolRelativeUrl(url.pathname);
	if (__protoGuard) return __protoGuard;
	let decodedUrlPathname;
	try {
		decodedUrlPathname = __normalizePathnameForRouteMatchStrict(url.pathname);
	} catch (e) {
		return new Response("Bad Request", { status: 400 });
	}
	let pathname = __normalizePath(decodedUrlPathname);
	if (pathname === "/__vinext/prerender/static-params") {
		if (process.env.VINEXT_PRERENDER !== "1") return new Response("Not Found", { status: 404 });
		const pattern = url.searchParams.get("pattern");
		if (!pattern) return new Response("missing pattern", { status: 400 });
		const fn = generateStaticParamsMap[pattern];
		if (typeof fn !== "function") return new Response("null", {
			status: 200,
			headers: { "content-type": "application/json" }
		});
		try {
			const parentParams = url.searchParams.get("parentParams");
			const raw = parentParams ? JSON.parse(parentParams) : {};
			const result = await fn({ params: typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw : {} });
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { "content-type": "application/json" }
			});
		} catch (e) {
			return new Response(JSON.stringify({ error: String(e) }), {
				status: 500,
				headers: { "content-type": "application/json" }
			});
		}
	}
	const __tsRedirect = normalizeTrailingSlash(pathname, __basePath, __trailingSlash, url.search);
	if (__tsRedirect) return __tsRedirect;
	if (__configRedirects.length) {
		const __redir = matchRedirect(pathname.endsWith(".rsc") ? pathname.slice(0, -4) : pathname, __configRedirects, __reqCtx);
		if (__redir) {
			const __redirDest = sanitizeDestination(__redir.destination);
			return new Response(null, {
				status: __redir.permanent ? 308 : 307,
				headers: { Location: __redirDest }
			});
		}
	}
	const isRscRequest = pathname.endsWith(".rsc") || request.headers.get("accept")?.includes("text/x-component");
	let cleanPathname = pathname.replace(/\.rsc$/, "");
	{
		const middlewareFn = proxy_default;
		if (typeof middlewareFn !== "function") throw new Error("The Proxy file must export a function named `proxy` or a `default` function.");
		if (matchesMiddleware(cleanPathname, void 0, request, __i18nConfig)) try {
			const mwUrl = new URL(request.url);
			mwUrl.pathname = cleanPathname;
			const mwRequest = new Request(mwUrl, request);
			const nextRequest = mwRequest instanceof NextRequest ? mwRequest : new NextRequest(mwRequest, void 0);
			const mwFetchEvent = new NextFetchEvent({ page: cleanPathname });
			const mwResponse = await middlewareFn(nextRequest, mwFetchEvent);
			const _mwWaitUntil = mwFetchEvent.drainWaitUntil();
			const _mwExecCtx = getRequestExecutionContext();
			if (_mwExecCtx && typeof _mwExecCtx.waitUntil === "function") _mwExecCtx.waitUntil(_mwWaitUntil);
			if (mwResponse) if (mwResponse.headers.get("x-middleware-next") === "1") {
				_mwCtx.headers = new Headers();
				for (const [key, value] of mwResponse.headers) if (key !== "x-middleware-next" && key !== "x-middleware-rewrite") _mwCtx.headers.append(key, value);
			} else {
				if (mwResponse.status >= 300 && mwResponse.status < 400) return mwResponse;
				const rewriteUrl = mwResponse.headers.get("x-middleware-rewrite");
				if (rewriteUrl) {
					const rewriteParsed = new URL(rewriteUrl, request.url);
					cleanPathname = rewriteParsed.pathname;
					url.search = rewriteParsed.search;
					if (mwResponse.status !== 200) _mwCtx.status = mwResponse.status;
					_mwCtx.headers = new Headers();
					for (const [key, value] of mwResponse.headers) if (key !== "x-middleware-next" && key !== "x-middleware-rewrite") _mwCtx.headers.append(key, value);
				} else return mwResponse;
			}
		} catch (err) {
			console.error("[vinext] Middleware error:", err);
			return new Response("Internal Server Error", { status: 500 });
		}
	}
	if (_mwCtx.headers) {
		applyMiddlewareRequestHeaders(_mwCtx.headers);
		processMiddlewareHeaders(_mwCtx.headers);
	}
	const __postMwReqCtx = __buildPostMwRequestContext(request);
	if (__configRewrites.beforeFiles && __configRewrites.beforeFiles.length) {
		const __rewritten = matchRewrite(cleanPathname, __configRewrites.beforeFiles, __postMwReqCtx);
		if (__rewritten) {
			if (isExternalUrl(__rewritten)) {
				setHeadersContext(null);
				setNavigationContext(null);
				return proxyExternalRequest(request, __rewritten);
			}
			cleanPathname = __rewritten;
		}
	}
	if (cleanPathname === "/_vinext/image") {
		const __imgResult = validateImageUrl(url.searchParams.get("url"), request.url);
		if (__imgResult instanceof Response) return __imgResult;
		return Response.redirect(new URL(__imgResult, url.origin).href, 302);
	}
	for (const metaRoute of metadataRoutes) {
		if (metaRoute.type === "sitemap" && metaRoute.isDynamic && typeof metaRoute.module.generateSitemaps === "function") {
			const sitemapPrefix = metaRoute.servedUrl.slice(0, -4);
			if (cleanPathname.startsWith(sitemapPrefix + "/") && cleanPathname.endsWith(".xml")) {
				const rawId = cleanPathname.slice(sitemapPrefix.length + 1, -4);
				if (rawId.includes("/")) continue;
				const matched = (await metaRoute.module.generateSitemaps()).find(function(s) {
					return String(s.id) === rawId;
				});
				if (!matched) return new Response("Not Found", { status: 404 });
				const result = await metaRoute.module.default({ id: matched.id });
				if (result instanceof Response) return result;
				return new Response(sitemapToXml(result), { headers: { "Content-Type": metaRoute.contentType } });
			}
			continue;
		}
		var _metaParams = null;
		if (metaRoute.patternParts) {
			_metaParams = matchPattern(cleanPathname.split("/").filter(Boolean), metaRoute.patternParts);
			if (!_metaParams) continue;
		} else if (cleanPathname !== metaRoute.servedUrl) continue;
		if (metaRoute.isDynamic) {
			const metaFn = metaRoute.module.default;
			if (typeof metaFn === "function") {
				const result = await metaFn({ params: makeThenableParams(_metaParams || {}) });
				let body;
				if (result instanceof Response) return result;
				if (metaRoute.type === "sitemap") body = sitemapToXml(result);
				else if (metaRoute.type === "robots") body = robotsToText(result);
				else if (metaRoute.type === "manifest") body = manifestToJson(result);
				else body = JSON.stringify(result);
				return new Response(body, { headers: { "Content-Type": metaRoute.contentType } });
			}
		} else try {
			const binary = atob(metaRoute.fileDataBase64);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			return new Response(bytes, { headers: {
				"Content-Type": metaRoute.contentType,
				"Cache-Control": "public, max-age=0, must-revalidate"
			} });
		} catch {
			return new Response("Not Found", { status: 404 });
		}
	}
	setNavigationContext({
		pathname: cleanPathname,
		searchParams: url.searchParams,
		params: {}
	});
	const actionId = request.headers.get("x-rsc-action");
	if (request.method === "POST" && actionId) {
		const csrfResponse = validateCsrfOrigin(request, __allowedOrigins);
		if (csrfResponse) return csrfResponse;
		if (parseInt(request.headers.get("content-length") || "0", 10) > __MAX_ACTION_BODY_SIZE) {
			setHeadersContext(null);
			setNavigationContext(null);
			return new Response("Payload Too Large", { status: 413 });
		}
		try {
			const contentType = request.headers.get("content-type") || "";
			let body;
			try {
				body = contentType.startsWith("multipart/form-data") ? await __readFormDataWithLimit(request, __MAX_ACTION_BODY_SIZE) : await __readBodyWithLimit(request, __MAX_ACTION_BODY_SIZE);
			} catch (sizeErr) {
				if (sizeErr && sizeErr.message === "Request body too large") {
					setHeadersContext(null);
					setNavigationContext(null);
					return new Response("Payload Too Large", { status: 413 });
				}
				throw sizeErr;
			}
			const temporaryReferences = createTemporaryReferenceSet();
			const args = await decodeReply(body, { temporaryReferences });
			const action = await loadServerAction(actionId);
			let returnValue;
			let actionRedirect = null;
			const previousHeadersPhase = setHeadersAccessPhase("action");
			try {
				try {
					returnValue = {
						ok: true,
						data: await action.apply(null, args)
					};
				} catch (e) {
					if (e && typeof e === "object" && "digest" in e) {
						const digest = String(e.digest);
						if (digest.startsWith("NEXT_REDIRECT;")) {
							const parts = digest.split(";");
							actionRedirect = {
								url: decodeURIComponent(parts[2]),
								type: parts[1] || "replace",
								status: parts[3] ? parseInt(parts[3], 10) : 307
							};
							returnValue = {
								ok: true,
								data: void 0
							};
						} else if (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;")) returnValue = {
							ok: false,
							data: e
						};
						else {
							console.error("[vinext] Server action error:", e);
							returnValue = {
								ok: false,
								data: __sanitizeErrorForClient(e)
							};
						}
					} else {
						console.error("[vinext] Server action error:", e);
						returnValue = {
							ok: false,
							data: __sanitizeErrorForClient(e)
						};
					}
				}
			} finally {
				setHeadersAccessPhase(previousHeadersPhase);
			}
			if (actionRedirect) {
				const actionPendingCookies = getAndClearPendingCookies();
				const actionDraftCookie = getDraftModeCookieHeader();
				setHeadersContext(null);
				setNavigationContext(null);
				const redirectHeaders = new Headers({
					"Content-Type": "text/x-component; charset=utf-8",
					"Vary": "RSC, Accept",
					"x-action-redirect": actionRedirect.url,
					"x-action-redirect-type": actionRedirect.type,
					"x-action-redirect-status": String(actionRedirect.status)
				});
				for (const cookie of actionPendingCookies) redirectHeaders.append("Set-Cookie", cookie);
				if (actionDraftCookie) redirectHeaders.append("Set-Cookie", actionDraftCookie);
				return new Response("", {
					status: 200,
					headers: redirectHeaders
				});
			}
			const match = matchRoute(cleanPathname);
			let element;
			if (match) {
				const { route: actionRoute, params: actionParams } = match;
				setNavigationContext({
					pathname: cleanPathname,
					searchParams: url.searchParams,
					params: actionParams
				});
				element = buildPageElement(actionRoute, actionParams, void 0, url.searchParams);
			} else element = (0, import_react_react_server.createElement)("div", null, "Page not found");
			const onRenderError = createRscOnErrorHandler(request, cleanPathname, match ? match.route.pattern : cleanPathname);
			const rscStream = renderToReadableStream({
				root: element,
				returnValue
			}, {
				temporaryReferences,
				onError: onRenderError
			});
			const actionPendingCookies = getAndClearPendingCookies();
			const actionDraftCookie = getDraftModeCookieHeader();
			const actionResponse = new Response(rscStream, { headers: {
				"Content-Type": "text/x-component; charset=utf-8",
				"Vary": "RSC, Accept"
			} });
			if (actionPendingCookies.length > 0 || actionDraftCookie) {
				for (const cookie of actionPendingCookies) actionResponse.headers.append("Set-Cookie", cookie);
				if (actionDraftCookie) actionResponse.headers.append("Set-Cookie", actionDraftCookie);
			}
			return actionResponse;
		} catch (err) {
			getAndClearPendingCookies();
			console.error("[vinext] Server action error:", err);
			reportRequestError(err instanceof Error ? err : new Error(String(err)), {
				path: cleanPathname,
				method: request.method,
				headers: Object.fromEntries(request.headers.entries())
			}, {
				routerKind: "App Router",
				routePath: cleanPathname,
				routeType: "action"
			});
			setHeadersContext(null);
			setNavigationContext(null);
			return new Response("Internal Server Error", { status: 500 });
		}
	}
	if (__configRewrites.afterFiles && __configRewrites.afterFiles.length) {
		const __afterRewritten = matchRewrite(cleanPathname, __configRewrites.afterFiles, __postMwReqCtx);
		if (__afterRewritten) {
			if (isExternalUrl(__afterRewritten)) {
				setHeadersContext(null);
				setNavigationContext(null);
				return proxyExternalRequest(request, __afterRewritten);
			}
			cleanPathname = __afterRewritten;
		}
	}
	let match = matchRoute(cleanPathname);
	if (!match && __configRewrites.fallback && __configRewrites.fallback.length) {
		const __fallbackRewritten = matchRewrite(cleanPathname, __configRewrites.fallback, __postMwReqCtx);
		if (__fallbackRewritten) {
			if (isExternalUrl(__fallbackRewritten)) {
				setHeadersContext(null);
				setNavigationContext(null);
				return proxyExternalRequest(request, __fallbackRewritten);
			}
			cleanPathname = __fallbackRewritten;
			match = matchRoute(cleanPathname);
		}
	}
	if (!match) {
		const notFoundResponse = await renderNotFoundPage(null, isRscRequest, request);
		if (notFoundResponse) return notFoundResponse;
		setHeadersContext(null);
		setNavigationContext(null);
		return new Response("Not Found", { status: 404 });
	}
	const { route, params } = match;
	setNavigationContext({
		pathname: cleanPathname,
		searchParams: url.searchParams,
		params
	});
	if (route.routeHandler) {
		const handler = route.routeHandler;
		const method = request.method.toUpperCase();
		const revalidateSeconds = getAppRouteHandlerRevalidateSeconds(handler);
		if (hasAppRouteHandlerDefaultExport(handler) && false);
		const { allowHeaderForOptions, handlerFn, isAutoHead, shouldAutoRespondToOptions } = resolveAppRouteHandlerMethod(handler, method);
		if (shouldAutoRespondToOptions) {
			setHeadersContext(null);
			setNavigationContext(null);
			return applyRouteHandlerMiddlewareContext(new Response(null, {
				status: 204,
				headers: { "Allow": allowHeaderForOptions }
			}), _mwCtx);
		}
		if (shouldReadAppRouteHandlerCache({
			dynamicConfig: handler.dynamic,
			handlerFn,
			isAutoHead,
			isKnownDynamic: isKnownDynamicAppRoute(route.pattern),
			isProduction: true,
			method,
			revalidateSeconds
		})) {
			const __cachedRouteResponse = await readAppRouteHandlerCacheResponse({
				basePath: __basePath,
				buildPageCacheTags: __pageCacheTags,
				cleanPathname,
				clearRequestContext: function() {
					setHeadersContext(null);
					setNavigationContext(null);
				},
				consumeDynamicUsage,
				getCollectedFetchTags,
				handlerFn,
				i18n: __i18nConfig,
				isAutoHead,
				isrDebug: __isrDebug,
				isrGet: __isrGet,
				isrRouteKey: __isrRouteKey,
				isrSet: __isrSet,
				markDynamicUsage,
				middlewareContext: _mwCtx,
				params,
				requestUrl: request.url,
				revalidateSearchParams: url.searchParams,
				revalidateSeconds,
				routePattern: route.pattern,
				runInRevalidationContext: async function(renderFn) {
					await runWithRequestContext(createRequestContext({
						headersContext: {
							headers: new Headers(),
							cookies: /* @__PURE__ */ new Map()
						},
						executionContext: getRequestExecutionContext()
					}), async () => {
						ensureFetchPatch();
						await renderFn();
					});
				},
				scheduleBackgroundRegeneration: __triggerBackgroundRegeneration,
				setNavigationContext
			});
			if (__cachedRouteResponse) return __cachedRouteResponse;
		}
		if (typeof handlerFn === "function") return executeAppRouteHandler({
			basePath: __basePath,
			buildPageCacheTags: __pageCacheTags,
			cleanPathname,
			clearRequestContext: function() {
				setHeadersContext(null);
				setNavigationContext(null);
			},
			consumeDynamicUsage,
			executionContext: getRequestExecutionContext(),
			getAndClearPendingCookies,
			getCollectedFetchTags,
			getDraftModeCookieHeader,
			handler,
			handlerFn,
			i18n: __i18nConfig,
			isAutoHead,
			isProduction: true,
			isrDebug: __isrDebug,
			isrRouteKey: __isrRouteKey,
			isrSet: __isrSet,
			markDynamicUsage,
			method,
			middlewareContext: _mwCtx,
			params,
			reportRequestError,
			request,
			revalidateSeconds,
			routePattern: route.pattern,
			setHeadersAccessPhase
		});
		setHeadersContext(null);
		setNavigationContext(null);
		return applyRouteHandlerMiddlewareContext(new Response(null, { status: 405 }), _mwCtx);
	}
	const PageComponent = route.page?.default;
	if (!PageComponent) {
		setHeadersContext(null);
		setNavigationContext(null);
		return new Response("Page has no default export", { status: 500 });
	}
	let revalidateSeconds = typeof route.page?.revalidate === "number" ? route.page.revalidate : null;
	const dynamicConfig = route.page?.dynamic;
	const dynamicParamsConfig = route.page?.dynamicParams;
	const isForceStatic = dynamicConfig === "force-static";
	const isDynamicError = dynamicConfig === "error";
	if (isForceStatic) {
		setHeadersContext({
			headers: new Headers(),
			cookies: /* @__PURE__ */ new Map()
		});
		setNavigationContext({
			pathname: cleanPathname,
			searchParams: new URLSearchParams(),
			params
		});
	}
	if (isDynamicError) {
		setHeadersContext({
			headers: new Headers(),
			cookies: /* @__PURE__ */ new Map(),
			accessError: /* @__PURE__ */ new Error("Page with `dynamic = \"error\"` used a dynamic API. This page was expected to be fully static, but headers(), cookies(), or searchParams was accessed. Remove the dynamic API usage or change the dynamic config to \"auto\" or \"force-dynamic\".")
		});
		setNavigationContext({
			pathname: cleanPathname,
			searchParams: new URLSearchParams(),
			params
		});
	}
	const isForceDynamic = dynamicConfig === "force-dynamic";
	if (!isForceDynamic && revalidateSeconds !== null && revalidateSeconds > 0 && revalidateSeconds !== Infinity) {
		const __cachedPageResponse = await readAppPageCacheResponse({
			cleanPathname,
			clearRequestContext: function() {
				setHeadersContext(null);
				setNavigationContext(null);
			},
			isRscRequest,
			isrDebug: __isrDebug,
			isrGet: __isrGet,
			isrHtmlKey: __isrHtmlKey,
			isrRscKey: __isrRscKey,
			isrSet: __isrSet,
			revalidateSeconds,
			renderFreshPageForCache: async function() {
				return runWithRequestContext(createRequestContext({
					headersContext: {
						headers: new Headers(),
						cookies: /* @__PURE__ */ new Map()
					},
					executionContext: getRequestExecutionContext()
				}), async () => {
					ensureFetchPatch();
					setNavigationContext({
						pathname: cleanPathname,
						searchParams: new URLSearchParams(),
						params
					});
					const __revalRscCapture = teeAppPageRscStreamForCapture(renderToReadableStream(await buildPageElement(route, params, void 0, new URLSearchParams()), { onError: createRscOnErrorHandler(request, cleanPathname, route.pattern) }), true);
					const __revalFontData = {
						links: getSSRFontLinks(),
						styles: _getSSRFontStyles(),
						preloads: _getSSRFontPreloads()
					};
					const __revalHtmlStream = await (await import("./ssr/index.js")).handleSsr(__revalRscCapture.responseStream, getNavigationContext(), __revalFontData);
					setHeadersContext(null);
					setNavigationContext(null);
					return {
						html: await readAppPageTextStream(__revalHtmlStream),
						rscData: await __revalRscCapture.capturedRscDataPromise,
						tags: __pageCacheTags(cleanPathname, getCollectedFetchTags())
					};
				});
			},
			scheduleBackgroundRegeneration: __triggerBackgroundRegeneration
		});
		if (__cachedPageResponse) return __cachedPageResponse;
	}
	const __dynamicParamsResponse = await validateAppPageDynamicParams({
		clearRequestContext() {
			setHeadersContext(null);
			setNavigationContext(null);
		},
		enforceStaticParamsOnly: dynamicParamsConfig === false,
		generateStaticParams: route.page?.generateStaticParams,
		isDynamicRoute: route.isDynamic,
		logGenerateStaticParamsError(err) {
			console.error("[vinext] generateStaticParams error:", err);
		},
		params
	});
	if (__dynamicParamsResponse) return __dynamicParamsResponse;
	const __interceptResult = await resolveAppPageIntercept({
		buildPageElement,
		cleanPathname,
		currentRoute: route,
		findIntercept,
		getRoutePattern(sourceRoute) {
			return sourceRoute.pattern;
		},
		getSourceRoute(sourceRouteIndex) {
			return routes[sourceRouteIndex];
		},
		isRscRequest,
		matchSourceRouteParams(pattern) {
			return matchRoute(pattern)?.params ?? {};
		},
		renderInterceptResponse(sourceRoute, interceptElement) {
			const interceptStream = renderToReadableStream(interceptElement, { onError: createRscOnErrorHandler(request, cleanPathname, sourceRoute.pattern) });
			return new Response(interceptStream, { headers: {
				"Content-Type": "text/x-component; charset=utf-8",
				"Vary": "RSC, Accept"
			} });
		},
		searchParams: url.searchParams,
		setNavigationContext,
		toInterceptOpts(intercept) {
			return {
				interceptSlot: intercept.slotName,
				interceptPage: intercept.page,
				interceptParams: intercept.matchedParams
			};
		}
	});
	if (__interceptResult.response) return __interceptResult.response;
	const interceptOpts = __interceptResult.interceptOpts;
	const __pageBuildResult = await buildAppPageElement({
		buildPageElement() {
			return buildPageElement(route, params, interceptOpts, url.searchParams);
		},
		renderErrorBoundaryPage(buildErr) {
			return renderErrorBoundaryPage(route, buildErr, isRscRequest, request, params);
		},
		renderSpecialError(__buildSpecialError) {
			return buildAppPageSpecialErrorResponse({
				clearRequestContext() {
					setHeadersContext(null);
					setNavigationContext(null);
				},
				renderFallbackPage(statusCode) {
					return renderHTTPAccessFallbackPage(route, statusCode, isRscRequest, request, { matchedParams: params });
				},
				requestUrl: request.url,
				specialError: __buildSpecialError
			});
		},
		resolveSpecialError: resolveAppPageSpecialError
	});
	if (__pageBuildResult.response) return __pageBuildResult.response;
	const element = __pageBuildResult.element;
	const _hasLoadingBoundary = !!(route.loading && route.loading.default);
	const _asyncLayoutParams = makeThenableParams(params);
	return renderAppPageLifecycle({
		cleanPathname,
		clearRequestContext() {
			setHeadersContext(null);
			setNavigationContext(null);
		},
		consumeDynamicUsage,
		createRscOnErrorHandler(pathname, routePath) {
			return createRscOnErrorHandler(request, pathname, routePath);
		},
		element,
		getDraftModeCookieHeader,
		getFontLinks: getSSRFontLinks,
		getFontPreloads: _getSSRFontPreloads,
		getFontStyles: _getSSRFontStyles,
		getNavigationContext,
		getPageTags() {
			return __pageCacheTags(cleanPathname, getCollectedFetchTags());
		},
		getRequestCacheLife() {
			return _consumeRequestScopedCacheLife();
		},
		handlerStart: __reqStart,
		hasLoadingBoundary: _hasLoadingBoundary,
		isDynamicError,
		isForceDynamic,
		isForceStatic,
		isProduction: true,
		isRscRequest,
		isrDebug: __isrDebug,
		isrHtmlKey: __isrHtmlKey,
		isrRscKey: __isrRscKey,
		isrSet: __isrSet,
		layoutCount: route.layouts?.length ?? 0,
		loadSsrHandler() {
			return import("./ssr/index.js");
		},
		middlewareContext: _mwCtx,
		params,
		probeLayoutAt(li) {
			const LayoutComp = route.layouts[li]?.default;
			if (!LayoutComp) return null;
			return LayoutComp({
				params: _asyncLayoutParams,
				children: null
			});
		},
		probePage() {
			return PageComponent({ params });
		},
		revalidateSeconds,
		renderErrorBoundaryResponse(renderErr) {
			return renderErrorBoundaryPage(route, renderErr, isRscRequest, request, params);
		},
		async renderLayoutSpecialError(__layoutSpecialError, li) {
			return buildAppPageSpecialErrorResponse({
				clearRequestContext() {
					setHeadersContext(null);
					setNavigationContext(null);
				},
				renderFallbackPage(statusCode) {
					let parentNotFound = null;
					if (route.notFounds) {
						for (let pi = li - 1; pi >= 0; pi--) if (route.notFounds[pi]?.default) {
							parentNotFound = route.notFounds[pi].default;
							break;
						}
					}
					if (!parentNotFound) parentNotFound = null;
					const parentLayouts = route.layouts.slice(0, li);
					return renderHTTPAccessFallbackPage(route, statusCode, isRscRequest, request, {
						boundaryComponent: parentNotFound,
						layouts: parentLayouts,
						matchedParams: params
					});
				},
				requestUrl: request.url,
				specialError: __layoutSpecialError
			});
		},
		async renderPageSpecialError(specialError) {
			return buildAppPageSpecialErrorResponse({
				clearRequestContext() {
					setHeadersContext(null);
					setNavigationContext(null);
				},
				renderFallbackPage(statusCode) {
					return renderHTTPAccessFallbackPage(route, statusCode, isRscRequest, request, { matchedParams: params });
				},
				requestUrl: request.url,
				specialError
			});
		},
		renderToReadableStream,
		routeHasLocalBoundary: !!route?.error?.default || !!(route?.errors && route.errors.some(function(e) {
			return e?.default;
		})),
		routePattern: route.pattern,
		runWithSuppressedHookWarning(probe) {
			return _suppressHookWarningAls.run(true, probe);
		},
		waitUntil(__cachePromise) {
			getRequestExecutionContext()?.waitUntil(__cachePromise);
		}
	});
}
//#endregion
//#region node_modules/vinext/dist/server/app-router-entry.js
/**
* Default Cloudflare Worker entry point for vinext App Router.
*
* Use this directly in wrangler.jsonc:
*   "main": "vinext/server/app-router-entry"
*
* Or import and delegate to it from a custom worker:
*   import handler from "vinext/server/app-router-entry";
*   return handler.fetch(request, env, ctx);
*
* This file runs in the RSC environment. Configure the Cloudflare plugin with:
*   cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })
*/
var app_router_entry_default = { async fetch(request, _env, ctx) {
	if (new URL(request.url).pathname.replaceAll("\\", "/").startsWith("//")) return new Response("404 Not Found", { status: 404 });
	const handleFn = () => handler(request, ctx);
	const result = await (ctx ? runWithExecutionContext(ctx, handleFn) : handleFn());
	if (result instanceof Response) return result;
	if (result === null || result === void 0) return new Response("Not Found", { status: 404 });
	return new Response(String(result), { status: 200 });
} };
//#endregion
//#region \0virtual:cloudflare/worker-entry
var worker_entry_default = { async fetch(request, env, ctx) {
	if (new URL(request.url).pathname === "/_vinext/image") return handleImageOptimization(request, {
		fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
		transformImage: async (body, { width, format, quality }) => {
			return (await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({
				format,
				quality
			})).response();
		}
	}, [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES]);
	return app_router_entry_default.fetch(request, env, ctx);
} };
//#endregion
export { worker_entry_default as default };
