import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const packageJsonPath = path.join(rootDir, "package.json");
const globalExtensionsPath = path.join(os.homedir(), ".vscode", "extensions", "extensions.json");
const defaultProfileExtensionsPath = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "Code",
  "User",
  "profiles",
  "1484df15",
  "extensions.json",
);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function buildFallbackEntry(extensionId, version) {
  const relativeLocation = `${extensionId}-${version}`;
  const installedPath = path.join(os.homedir(), ".vscode", "extensions", relativeLocation);

  return {
    identifier: {
      id: extensionId,
    },
    version,
    location: {
      $mid: 1,
      fsPath: installedPath,
      external: `file://${installedPath}`,
      path: installedPath,
      scheme: "file",
    },
    relativeLocation,
    metadata: {
      installedTimestamp: Date.now(),
      pinned: true,
      source: "vsix",
    },
  };
}

async function main() {
  const profileExtensionsPath =
    process.env.LEO_VSCODE_PROFILE_EXTENSIONS_JSON ?? defaultProfileExtensionsPath;
  const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  const extensionId = `${pkg.publisher}.${pkg.name}`;
  const vsixName = `${pkg.name}-${pkg.version}.vsix`;
  const vsixPath = path.join(rootDir, vsixName);

  await run("npm", ["run", "generate"]);
  await run("vsce", ["package", "--out", vsixName]);
  await run("code", ["--install-extension", vsixPath, "--force"]);

  const installedExtensions = JSON.parse(await fs.readFile(globalExtensionsPath, "utf8"));
  const installedEntry =
    installedExtensions.find((entry) => entry.identifier?.id === extensionId) ??
    buildFallbackEntry(extensionId, pkg.version);

  const currentProfileEntries = JSON.parse(await fs.readFile(profileExtensionsPath, "utf8"));
  const nextProfileEntries = [...currentProfileEntries];
  const existingIndex = nextProfileEntries.findIndex(
    (entry) => entry.identifier?.id === extensionId,
  );

  if (existingIndex === -1) {
    nextProfileEntries.push(installedEntry);
  } else {
    nextProfileEntries[existingIndex] = installedEntry;
  }

  await fs.writeFile(profileExtensionsPath, `${JSON.stringify(nextProfileEntries, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
