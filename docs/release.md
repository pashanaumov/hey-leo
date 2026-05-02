# Release Checklist

## Before release

- Run `npm run generate`.
- Run `npm run package:check`.
- Run `npx @vscode/vsce package --out leo-themes-<version>.vsix`.
- Install the VSIX locally and confirm all nine themes appear in VS Code.
- Confirm README, CHANGELOG, and `package.json` version match the release.

## Build GitHub release

The GitHub Actions release workflow runs on tags matching `v*`. It builds a VSIX and attaches it to a GitHub Release. No Marketplace token is required.

Release command:

```sh
git tag v1.1.0
git push origin v1.1.0
```

## After release

- Confirm the GitHub Release has the `.vsix` attached.
- Download the `.vsix` and install it locally if you want one final smoke test.
- If publishing to the VS Code Marketplace manually later, upload the generated `.vsix` through the Marketplace UI.
