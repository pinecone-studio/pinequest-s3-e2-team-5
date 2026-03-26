import { i as __toESM, t as require_react } from "./react-DaHt2vt0.js";
import { a as init_navigation, d as useSelectedLayoutSegments } from "../index.js";
import { t as canUseKeyless } from "./feature-flags-DjJwcsed.js";
//#region node_modules/@clerk/nextjs/dist/esm/app-router/client/keyless-cookie-sync.js
init_navigation();
var import_react = /* @__PURE__ */ __toESM(require_react());
function KeylessCookieSync(props) {
	var _a;
	const isNotFoundRoute = ((_a = useSelectedLayoutSegments()[0]) == null ? void 0 : _a.startsWith("/_not-found")) || false;
	(0, import_react.useEffect)(() => {
		if (canUseKeyless && !isNotFoundRoute) import("./keyless-actions-C6VZW3xS.js").then((m) => m.syncKeylessConfigAction({
			...props,
			returnUrl: window.location.href
		}));
	}, [isNotFoundRoute]);
	return props.children;
}
//#endregion
//#region \0virtual:vite-rsc/client-references/group/facade:node_modules/@clerk/nextjs/dist/esm/app-router/client/keyless-cookie-sync.js
var export_a0dcee5edac6 = { KeylessCookieSync };
//#endregion
export { export_a0dcee5edac6 };
