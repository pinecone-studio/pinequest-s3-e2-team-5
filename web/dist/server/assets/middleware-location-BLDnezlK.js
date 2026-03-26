import { n as middlewareFileReference, t as isNext16OrHigher } from "./sdk-versions-Bb30ybd9.js";
import { n as nodeFsOrThrow, r as nodePathOrThrow, t as nodeCwdOrThrow } from "./utils-4kkA-fj2.js";
//#region node_modules/@clerk/nextjs/dist/esm/server/fs/middleware-location.js
function hasSrcAppDir() {
	const { existsSync } = nodeFsOrThrow();
	const path = nodePathOrThrow();
	const cwd = nodeCwdOrThrow();
	return !!existsSync(path.join(cwd(), "src", "app"));
}
function suggestMiddlewareLocation() {
	const fileExtensions = ["ts", "js"];
	const fileNames = isNext16OrHigher ? ["middleware", "proxy"] : ["middleware"];
	const suggestionMessage = (fileName, extension, to, from) => `Clerk: clerkMiddleware() was not run, your ${middlewareFileReference} file might be misplaced. Move your ${middlewareFileReference} file to ./${to}${fileName}.${extension}. Currently located at ./${from}${fileName}.${extension}`;
	const { existsSync } = nodeFsOrThrow();
	const path = nodePathOrThrow();
	const cwd = nodeCwdOrThrow();
	const projectWithAppSrcPath = path.join(cwd(), "src", "app");
	const projectWithAppPath = path.join(cwd(), "app");
	const checkMiddlewareLocation = (basePath, to, from) => {
		for (const fileName of fileNames) for (const fileExtension of fileExtensions) if (existsSync(path.join(basePath, `${fileName}.${fileExtension}`))) return suggestionMessage(fileName, fileExtension, to, from);
	};
	if (existsSync(projectWithAppSrcPath)) return checkMiddlewareLocation(projectWithAppSrcPath, "src/", "src/app/") || checkMiddlewareLocation(cwd(), "src/", "");
	if (existsSync(projectWithAppPath)) return checkMiddlewareLocation(projectWithAppPath, "", "app/");
}
//#endregion
export { hasSrcAppDir, suggestMiddlewareLocation };
