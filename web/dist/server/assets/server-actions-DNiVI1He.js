import { r as cookies } from "./headers-C6ItjSdi.js";
import { i as registerServerReference } from "./rsc-B87piBzi.js";
import "./encryption-runtime-Dqwz5gIq.js";
//#region node_modules/@clerk/nextjs/dist/esm/app-router/server-actions.js
async function invalidateCacheAction() {
	(await cookies()).delete(`__clerk_invalidate_cache_cookie_${Date.now()}`);
}
var $$wrap_invalidateCacheAction = /* @__PURE__ */ registerServerReference(invalidateCacheAction, "1f8ac0b3199d", "invalidateCacheAction");
//#endregion
export { $$wrap_invalidateCacheAction as invalidateCacheAction };
