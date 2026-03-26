import { i as __toESM, t as require_react } from "./react-DaHt2vt0.js";
import { a as init_navigation, d as useSelectedLayoutSegments } from "../index.js";
import { createOrReadKeylessAction } from "./keyless-actions-C6VZW3xS.js";
//#region node_modules/@clerk/nextjs/dist/esm/app-router/client/keyless-creator-reader.js
init_navigation();
var import_react = /* @__PURE__ */ __toESM(require_react());
var KeylessCreatorOrReader = (props) => {
	var _a;
	const { children } = props;
	const isNotFoundRoute = ((_a = useSelectedLayoutSegments()[0]) == null ? void 0 : _a.startsWith("/_not-found")) || false;
	const [state, fetchKeys] = import_react.useActionState(createOrReadKeylessAction, null);
	(0, import_react.useEffect)(() => {
		if (isNotFoundRoute) return;
		import_react.startTransition(() => {
			fetchKeys();
		});
	}, [isNotFoundRoute]);
	if (!import_react.isValidElement(children)) return children;
	return import_react.cloneElement(children, {
		key: state == null ? void 0 : state.publishableKey,
		publishableKey: state == null ? void 0 : state.publishableKey,
		__internal_keyless_claimKeylessApplicationUrl: state == null ? void 0 : state.claimUrl,
		__internal_keyless_copyInstanceKeysUrl: state == null ? void 0 : state.apiKeysUrl,
		__internal_bypassMissingPublishableKey: true
	});
};
//#endregion
export { KeylessCreatorOrReader };
