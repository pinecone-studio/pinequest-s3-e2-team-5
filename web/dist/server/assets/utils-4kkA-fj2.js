import { t as __commonJSMin } from "./chunk-Cvx0f2q0.js";
import { t as __commonJS } from "./chunk-BUSYA2B4-BpQGAHDp.js";
import * as m$1 from "node:fs";
import * as m from "node:path";
//#region builtin:esm-external-require-node:fs
var require_builtin_esm_external_require_node_fs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = m$1.default;
}));
//#endregion
//#region builtin:esm-external-require-node:path
var require_builtin_esm_external_require_node_path = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = m.default;
}));
var safe_node_apis_default = __commonJS({ "src/runtime/node/safe-node-apis.js"(exports, module) {
	const { existsSync, writeFileSync, readFileSync, appendFileSync, mkdirSync, rmSync } = require_builtin_esm_external_require_node_fs();
	const path = require_builtin_esm_external_require_node_path();
	const fs = {
		existsSync,
		writeFileSync,
		readFileSync,
		appendFileSync,
		mkdirSync,
		rmSync
	};
	const cwd = () => process.cwd();
	module.exports = {
		fs,
		path,
		cwd
	};
} })();
//#endregion
//#region node_modules/@clerk/nextjs/dist/esm/server/fs/utils.js
function assertNotNullable(value, moduleName) {
	if (!value) throw new Error(`Clerk: ${moduleName} is missing. This is an internal error. Please contact Clerk's support.`);
}
var nodeFsOrThrow = () => {
	assertNotNullable(safe_node_apis_default.fs, "fs");
	return safe_node_apis_default.fs;
};
var nodePathOrThrow = () => {
	assertNotNullable(safe_node_apis_default.path, "path");
	return safe_node_apis_default.path;
};
var nodeCwdOrThrow = () => {
	assertNotNullable(safe_node_apis_default.cwd, "cwd");
	return safe_node_apis_default.cwd;
};
//#endregion
export { nodeFsOrThrow as n, nodePathOrThrow as r, nodeCwdOrThrow as t };
