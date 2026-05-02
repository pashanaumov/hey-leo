# Contributing

Thanks for helping improve Leo.

## Development

Leo themes are generated from `scripts/generate-themes.mjs`. Treat that script as the source of truth for supported themes and palette decisions.

```sh
npm run generate
```

Generated theme files live in `themes/`.

## Testing locally

1. Run `npm run generate`.
2. Press `F5` in VS Code to launch an Extension Development Host, or package and install locally:

```sh
npm run package
code --install-extension leo-themes-*.vsix --force
```

3. Confirm all nine contributed themes appear:
   - Leo Dew Dark / Dark Deep / Light
   - Leo Morning Dark / Dark Deep / Light
   - Leo Velvet Dark / Dark Deep / Light

## Package validation

Check the VSIX file list before release:

```sh
npm run package:check
```

The package should include only `package.json`, `README.md`, `LICENSE`, `CHANGELOG.md`, `icons/icon.png`, and the nine contributed theme files.

## Palette changes

- Keep syntax roles consistent across theme families.
- Prefer muted UI surfaces with accents reserved for active states.
- Validate dark, dark deep, and light variants together.
- Do not hand-edit generated JSON unless debugging a specific issue.
