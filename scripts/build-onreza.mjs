import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "dist");

const run = (command, args) => {
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
};

const copyPackage = (name) => {
  const source = resolve(root, "node_modules", name);
  if (!existsSync(source)) {
    throw new Error(`Missing runtime package: ${name}`);
  }

  cpSync(source, resolve(target, "node_modules", name), { recursive: true });
};

run("npm", ["run", "build"]);

rmSync(target, { recursive: true, force: true });
cpSync(resolve(root, "apps", "client", "dist"), target, { recursive: true });

await build({
  entryPoints: [resolve(root, "apps", "server", "src", "index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: resolve(target, "server.cjs"),
  external: ["better-sqlite3"],
});

mkdirSync(resolve(target, "node_modules"), { recursive: true });
for (const packageName of ["better-sqlite3", "bindings", "file-uri-to-path"]) {
  copyPackage(packageName);
}

const manifest = {
  version: 1,
  layers: [{ name: "app", target: "COMPUTE", directory: ".", entry: "server.cjs" }],
  routes: [{ pattern: "^/.*$", layer: "app", priority: 0 }],
  meta: {
    framework: {
      name: "node",
    },
  },
};

mkdirSync(resolve(target, ".onreza"), { recursive: true });
writeFileSync(
  resolve(target, ".onreza", "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`
);

console.log("Onreza build output created in dist/");
