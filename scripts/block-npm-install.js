#!/usr/bin/env node

const { npm_config_user_agent: UA } = process.env;
const [packageManager] = (UA ?? "").split(" ");
const [name, _version] = packageManager.split("/");

if (name !== "pnpm") {
	console.log(
		"\x1b[31m%s\x1b[0m",
		"❌ npm install is not allowed in this project!",
	);
	console.log("\x1b[33m%s\x1b[0m", "📦 Please use pnpm instead:");
	console.log("\x1b[36m%s\x1b[0m", "   pnpm install");
	console.log("\x1b[0m%s\x1b[0m", "");
	console.log("\x1b[90m%s\x1b[0m", "💡 Why pnpm?");
	console.log("\x1b[90m%s\x1b[0m", "   • Faster installation");
	console.log("\x1b[90m%s\x1b[0m", "   • Disk space efficient");
	console.log("\x1b[90m%s\x1b[0m", "   • Strict dependency management");
	console.log("\x1b[90m%s\x1b[0m", "   • Better monorepo support");
	console.log("\x1b[0m%s\x1b[0m", "");

	process.exit(1);
}
