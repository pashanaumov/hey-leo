import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const themesDir = path.join(rootDir, "themes");

const SHARED = {
  error: "#F07878",
};

const THEME_DEFINITIONS = [
  {
    fileStem: "LeoVelvet",
    label: "Leo Velvet",
    accent: "#F088C0",
    text: "#E0D8EC",
    texts: {
      light: "#4A3546",
    },
    backgrounds: {
      dark: "#1C1626",
      deep: "#100D16",
      light: "#FFF0F7",
    },
    accents: {
      light: "#B83F82",
    },
    hues: {
      string: "#6CD8C8",
      callable: "#84B8E4",
      type: "#E0BC68",
      constant: "#F4A080",
      enum: "#88C890",
    },
    variantHues: {
      light: {
        string: "#007A73",
        callable: "#2B6F9F",
        type: "#8F6500",
        constant: "#B85A35",
        enum: "#4F873F",
      },
    },
  },
  {
    fileStem: "LeoDew",
    label: "Leo Dew",
    accent: "#C48EF0",
    text: "#E0DEE8",
    texts: {
      light: "#3D3654",
    },
    backgrounds: {
      dark: "#1A1828",
      deep: "#0D0B14",
      light: "#F5F1FF",
    },
    accents: {
      light: "#8B4CC8",
    },
    hues: {
      string: "#7CE4D8",
      callable: "#80C0E8",
      type: "#E4C478",
      constant: "#F0A888",
      enum: "#B4D088",
    },
    variantHues: {
      light: {
        string: "#007A73",
        callable: "#286FA3",
        type: "#9A6A00",
        constant: "#B35435",
        enum: "#5F7F1B",
      },
    },
  },
  {
    fileStem: "LeoMorning",
    label: "Leo Morning",
    accent: "#88D4A0",
    text: "#DDE8E0",
    texts: {
      light: "#2F4438",
    },
    backgrounds: {
      dark: "#161C19",
      deep: "#0D100F",
      light: "#F1FAF4",
    },
    accents: {
      light: "#2F8F57",
    },
    hues: {
      string: "#72D4C4",
      callable: "#80B4DC",
      type: "#D4B462",
      constant: "#E898A8",
      enum: "#A0D892",
    },
    variantHues: {
      light: {
        string: "#007A68",
        callable: "#286D9F",
        type: "#8A6500",
        constant: "#B35672",
        enum: "#438A32",
      },
    },
  },
];

function resolveDefinition(definition, variant) {
  return {
    ...definition,
    accent: definition.accents?.[variant] ?? definition.accent,
    error: variant === "light" ? "#C93D45" : SHARED.error,
    hues: {
      ...definition.hues,
      ...(definition.variantHues?.[variant] ?? {}),
    },
    text: definition.texts?.[variant] ?? definition.text,
  };
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(color) {
  const hex = color.replace("#", "");
  if (hex.length !== 6) {
    throw new Error(`Expected 6-digit hex color, received ${color}`);
  }

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mix(colorA, colorB, amount) {
  const from = hexToRgb(colorA);
  const to = hexToRgb(colorB);

  return rgbToHex({
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  });
}

function shade(color, amount) {
  if (amount === 0) {
    return color;
  }

  return amount > 0 ? mix(color, "#FFFFFF", amount) : mix(color, "#000000", -amount);
}

function opacity(color, alpha) {
  const hex = color.replace("#", "").toUpperCase();
  const channel = clampChannel(alpha * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();

  return `#${hex}${channel}`;
}

function buildPalette(definition, variant) {
  const base = definition.backgrounds[variant];
  const text = mix(base, definition.text, 0.9);
  const mantle = shade(base, -0.09);
  const crust = shade(base, -0.16);
  const surface0 = mix(base, text, 0.08);
  const surface1 = mix(base, text, 0.14);
  const surface2 = mix(base, text, 0.22);
  const overlay0 = mix(surface2, text, 0.28);
  const overlay1 = mix(surface2, text, 0.45);
  const overlay2 = mix(surface2, text, 0.62);

  return {
    base,
    text,
    mantle,
    crust,
    surface0,
    surface1,
    surface2,
    overlay0,
    overlay1,
    overlay2,
    accentMuted: mix(text, definition.accent, 0.36),
    parameter: mix(text, definition.accent, 0.24),
    regex: mix(definition.hues.string, definition.accent, 0.35),
    escape: mix(definition.hues.string, definition.accent, 0.48),
  };
}

function buildColors(definition, variant) {
  const palette = buildPalette(definition, variant);
  const error = definition.error ?? SHARED.error;
  const { hues } = definition;

  return {
    "editor.background": palette.base,
    "editor.foreground": palette.text,
    "editorCursor.foreground": definition.accent,
    "editor.lineHighlightBackground": opacity(palette.text, 0.06),
    "editor.selectionBackground": opacity(palette.overlay2, 0.24),
    "editor.inactiveSelectionBackground": opacity(palette.overlay1, 0.18),
    "editor.wordHighlightBackground": opacity(palette.overlay2, 0.14),
    "editor.wordHighlightStrongBackground": opacity(hues.callable, 0.18),
    "editor.findMatchBackground": opacity(hues.constant, 0.34),
    "editor.findMatchHighlightBackground": opacity(hues.callable, 0.24),
    "editorLineNumber.foreground": palette.overlay0,
    "editorLineNumber.activeForeground": definition.accent,
    "editorIndentGuide.background": palette.surface1,
    "editorIndentGuide.activeBackground": palette.surface2,
    "editorWhitespace.foreground": opacity(palette.overlay2, 0.35),
    "editorBracketMatch.background": opacity(palette.overlay2, 0.1),
    "editorBracketMatch.border": palette.overlay2,
    "editorBracketHighlight.foreground1": definition.accent,
    "editorBracketHighlight.foreground2": hues.string,
    "editorBracketHighlight.foreground3": hues.type,
    "editorBracketHighlight.foreground4": hues.constant,
    "editorBracketHighlight.foreground5": hues.callable,
    "editorBracketHighlight.foreground6": hues.enum,
    "editorError.foreground": error,
    "editorWarning.foreground": hues.constant,
    "editorInfo.foreground": hues.callable,
    "editorGutter.modifiedBackground": hues.callable,
    "editorGutter.addedBackground": hues.enum,
    "editorGutter.deletedBackground": error,
    "editorOverviewRuler.border": palette.surface1,
    "editorOverviewRuler.errorForeground": error,
    "editorOverviewRuler.warningForeground": hues.constant,
    "editorOverviewRuler.infoForeground": hues.callable,
    "sideBar.background": palette.mantle,
    "sideBar.foreground": palette.text,
    "sideBarTitle.foreground": definition.accent,
    "sideBarSectionHeader.background": palette.mantle,
    "sideBarSectionHeader.foreground": palette.text,
    "list.activeSelectionBackground": palette.surface0,
    "list.activeSelectionForeground": palette.text,
    "list.hoverBackground": opacity(palette.surface0, 0.55),
    "list.focusBackground": palette.surface0,
    "list.highlightForeground": definition.accent,
    "list.inactiveSelectionBackground": palette.surface0,
    "activityBar.background": palette.crust,
    "activityBar.foreground": definition.accent,
    "activityBar.inactiveForeground": palette.overlay0,
    "activityBarBadge.background": definition.accent,
    "activityBarBadge.foreground": palette.crust,
    "statusBar.background": palette.crust,
    "statusBar.foreground": palette.text,
    "statusBar.debuggingBackground": hues.constant,
    "statusBar.debuggingForeground": palette.crust,
    "statusBar.noFolderBackground": palette.crust,
    "titleBar.activeBackground": palette.crust,
    "titleBar.activeForeground": palette.text,
    "titleBar.inactiveBackground": palette.crust,
    "titleBar.inactiveForeground": palette.overlay0,
    "editorGroupHeader.tabsBackground": palette.crust,
    "tab.activeBackground": palette.base,
    "tab.inactiveBackground": palette.mantle,
    "tab.activeForeground": definition.accent,
    "tab.inactiveForeground": palette.overlay0,
    "tab.activeBorderTop": definition.accent,
    "tab.hoverBackground": shade(palette.base, 0.04),
    "tab.border": palette.mantle,
    "panel.background": palette.base,
    "panel.border": palette.surface2,
    "panelTitle.activeForeground": palette.text,
    "panelTitle.activeBorder": definition.accent,
    "panelTitle.inactiveForeground": palette.overlay0,
    "terminal.background": palette.base,
    "terminal.foreground": palette.text,
    "terminal.ansiBlack": palette.surface0,
    "terminal.ansiRed": error,
    "terminal.ansiGreen": hues.enum,
    "terminal.ansiYellow": hues.type,
    "terminal.ansiBlue": hues.callable,
    "terminal.ansiMagenta": definition.accent,
    "terminal.ansiCyan": hues.string,
    "terminal.ansiWhite": palette.overlay2,
    "terminal.ansiBrightBlack": palette.overlay0,
    "terminal.ansiBrightRed": shade(error, 0.08),
    "terminal.ansiBrightGreen": shade(hues.enum, 0.08),
    "terminal.ansiBrightYellow": shade(hues.type, 0.08),
    "terminal.ansiBrightBlue": shade(hues.callable, 0.08),
    "terminal.ansiBrightMagenta": shade(definition.accent, 0.08),
    "terminal.ansiBrightCyan": shade(hues.string, 0.08),
    "terminal.ansiBrightWhite": palette.text,
    "focusBorder": definition.accent,
    "input.background": palette.surface0,
    "input.foreground": palette.text,
    "input.border": palette.surface2,
    "input.placeholderForeground": palette.overlay0,
    "inputOption.activeBorder": definition.accent,
    "button.background": definition.accent,
    "button.foreground": palette.crust,
    "button.hoverBackground": shade(definition.accent, 0.06),
    "button.secondaryBackground": palette.surface1,
    "button.secondaryForeground": palette.text,
    "button.secondaryHoverBackground": shade(palette.surface1, 0.08),
    "dropdown.background": palette.mantle,
    "dropdown.foreground": palette.text,
    "dropdown.border": palette.surface2,
    "badge.background": palette.surface1,
    "badge.foreground": palette.text,
    "progressBar.background": definition.accent,
    "scrollbarSlider.background": opacity(palette.surface2, 0.5),
    "scrollbarSlider.hoverBackground": palette.overlay0,
    "scrollbarSlider.activeBackground": opacity(palette.surface0, 0.45),
    "minimap.selectionHighlight": opacity(palette.surface2, 0.75),
    "minimapSlider.background": opacity(definition.accent, 0.2),
    "minimapSlider.hoverBackground": opacity(definition.accent, 0.4),
    "minimapSlider.activeBackground": opacity(definition.accent, 0.6),
    "breadcrumb.foreground": palette.overlay1,
    "breadcrumb.focusForeground": definition.accent,
    "breadcrumb.activeSelectionForeground": definition.accent,
    "notificationCenter.border": definition.accent,
    "notifications.background": palette.mantle,
    "notifications.foreground": palette.text,
    "notificationLink.foreground": hues.callable,
    "peekView.border": definition.accent,
    "peekViewEditor.background": palette.mantle,
    "peekViewResult.background": palette.mantle,
    "peekViewTitle.background": palette.base,
    "peekViewEditor.matchHighlightBackground": opacity(hues.callable, 0.3),
    "peekViewResult.matchHighlightBackground": opacity(hues.callable, 0.3),
    "gitDecoration.modifiedResourceForeground": hues.callable,
    "gitDecoration.deletedResourceForeground": error,
    "gitDecoration.untrackedResourceForeground": hues.enum,
    "gitDecoration.ignoredResourceForeground": palette.overlay0,
    "gitDecoration.conflictingResourceForeground": definition.accent,
    "diffEditor.insertedTextBackground": opacity(hues.enum, 0.18),
    "diffEditor.removedTextBackground": opacity(error, 0.18),
    "editorWidget.background": palette.mantle,
    "editorWidget.border": palette.surface2,
    "editorSuggestWidget.background": palette.mantle,
    "editorSuggestWidget.border": palette.surface2,
    "editorSuggestWidget.foreground": palette.text,
    "editorSuggestWidget.selectedBackground": palette.surface0,
    "editorSuggestWidget.highlightForeground": definition.accent,
    "editorHoverWidget.background": palette.mantle,
    "editorHoverWidget.border": palette.surface2,
  };
}

function buildSemanticTokens(definition, variant) {
  const palette = buildPalette(definition, variant);
  const error = definition.error ?? SHARED.error;
  const { hues } = definition;

  return {
    enumMember: { foreground: hues.enum },
    function: { foreground: hues.callable, fontStyle: "italic" },
    method: { foreground: hues.callable, fontStyle: "italic" },
    keyword: { foreground: definition.accent },
    number: { foreground: hues.constant },
    boolean: { foreground: hues.constant },
    parameter: { foreground: palette.parameter, fontStyle: "italic" },
    property: { foreground: palette.text },
    "variable.defaultLibrary": { foreground: palette.parameter },
    "variable.readonly": { foreground: palette.text },
    "property.readonly": { foreground: palette.text },
    class: { foreground: hues.type, fontStyle: "italic" },
    type: { foreground: hues.type, fontStyle: "italic" },
    interface: { foreground: hues.type, fontStyle: "italic" },
    enum: { foreground: hues.type, fontStyle: "italic" },
    namespace: { foreground: hues.type },
    typeParameter: { foreground: palette.parameter },
    decorator: { foreground: hues.constant, fontStyle: "italic" },
    macro: { foreground: hues.callable },
    selfKeyword: { foreground: error },
  };
}

function buildTokenColors(definition, variant) {
  const palette = buildPalette(definition, variant);
  const error = definition.error ?? SHARED.error;
  const { hues } = definition;

  return [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: {
        foreground: palette.overlay0,
        fontStyle: "italic",
      },
    },
    {
      scope: ["text", "source", "variable", "variable.other.readwrite"],
      settings: {
        foreground: palette.text,
      },
    },
    {
      scope: ["keyword", "keyword.control", "keyword.other"],
      settings: {
        foreground: definition.accent,
        fontStyle: "",
      },
    },
    {
      scope: ["storage.type", "storage.modifier", "storage"],
      settings: {
        foreground: definition.accent,
        fontStyle: "",
      },
    },
    {
      scope: ["keyword.control.import", "keyword.control.export", "keyword.control.from"],
      settings: {
        foreground: palette.accentMuted,
        fontStyle: "",
      },
    },
    {
      scope: "string",
      settings: {
        foreground: hues.string,
      },
    },
    {
      scope: "string.regexp",
      settings: {
        foreground: palette.regex,
      },
    },
    {
      scope: "constant.character.escape",
      settings: {
        foreground: palette.escape,
      },
    },
    {
      scope: "variable.parameter",
      settings: {
        foreground: palette.parameter,
        fontStyle: "italic",
      },
    },
    {
      scope: ["variable.other.property", "support.variable.property", "variable.object.property"],
      settings: {
        foreground: palette.text,
      },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call", "meta.function-call.method"],
      settings: {
        foreground: hues.callable,
        fontStyle: "italic",
      },
    },
    {
      scope: ["entity.name.type", "support.class", "entity.name.class", "entity.name.namespace"],
      settings: {
        foreground: hues.type,
        fontStyle: "italic",
      },
    },
    {
      scope: ["entity.name.enum", "entity.name.type.enum"],
      settings: {
        foreground: hues.type,
        fontStyle: "italic",
      },
    },
    {
      scope: ["constant", "constant.language", "support.constant", "variable.other.constant"],
      settings: {
        foreground: hues.constant,
      },
    },
    {
      scope: ["constant.numeric", "number"],
      settings: {
        foreground: hues.constant,
      },
    },
    {
      scope: ["keyword.operator", "operator", "punctuation.accessor"],
      settings: {
        foreground: hues.string,
      },
    },
    {
      scope: "punctuation",
      settings: {
        foreground: palette.overlay1,
      },
    },
    {
      scope: [
        "punctuation.definition.block",
        "punctuation.definition.parameters",
        "punctuation.section",
        "punctuation.definition.arguments",
      ],
      settings: {
        foreground: palette.overlay2,
      },
    },
    {
      scope: "entity.name.tag",
      settings: {
        foreground: definition.accent,
      },
    },
    {
      scope: "entity.other.attribute-name",
      settings: {
        foreground: hues.callable,
        fontStyle: "italic",
      },
    },
    {
      scope: ["meta.decorator", "punctuation.decorator"],
      settings: {
        foreground: hues.constant,
        fontStyle: "italic",
      },
    },
    {
      scope: ["support.type", "meta.type", "meta.type-alias"],
      settings: {
        foreground: hues.type,
      },
    },
    {
      scope: ["support.function.builtin", "variable.language.this"],
      settings: {
        foreground: error,
      },
    },
    {
      scope: "markup.heading",
      settings: {
        foreground: definition.accent,
        fontStyle: "bold",
      },
    },
    {
      scope: "markup.bold",
      settings: {
        fontStyle: "bold",
      },
    },
    {
      scope: "markup.italic",
      settings: {
        fontStyle: "italic",
      },
    },
    {
      scope: "markup.underline",
      settings: {
        fontStyle: "underline",
      },
    },
    {
      scope: "markup.inserted",
      settings: {
        foreground: hues.enum,
      },
    },
    {
      scope: "markup.deleted",
      settings: {
        foreground: error,
      },
    },
    {
      scope: "markup.changed",
      settings: {
        foreground: hues.callable,
      },
    },
    {
      scope: ["markup.inline.raw", "markup.fenced_code"],
      settings: {
        foreground: hues.string,
      },
    },
    {
      scope: "meta.embedded",
      settings: {
        foreground: palette.text,
      },
    },
    {
      scope: "invalid",
      settings: {
        foreground: error,
        fontStyle: "underline",
      },
    },
  ];
}

function buildTheme(definition, variant) {
  const themeDefinition = resolveDefinition(definition, variant);
  const variantLabel = variant === "dark" ? "Dark" : variant === "deep" ? "Dark Deep" : "Light";

  return {
    $schema: "vscode://schemas/color-theme",
    name: `${themeDefinition.label} ${variantLabel}`,
    type: variant === "light" ? "light" : "vs-dark",
    colors: buildColors(themeDefinition, variant),
    semanticHighlighting: true,
    semanticTokenColors: buildSemanticTokens(themeDefinition, variant),
    tokenColors: buildTokenColors(themeDefinition, variant),
  };
}

async function writeTheme(definition, variant) {
  const theme = buildTheme(definition, variant);
  const fileName =
    variant === "dark"
      ? `${definition.fileStem}-dark-color-theme.json`
      : variant === "deep"
        ? `${definition.fileStem}-dark-deep-color-theme.json`
        : `${definition.fileStem}-light-color-theme.json`;

  await fs.writeFile(
    path.join(themesDir, fileName),
    `${JSON.stringify(theme, null, "\t")}\n`,
    "utf8",
  );
}

async function main() {
  await Promise.all(
    THEME_DEFINITIONS.flatMap((definition) => [
      writeTheme(definition, "dark"),
      writeTheme(definition, "deep"),
      writeTheme(definition, "light"),
    ]),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
