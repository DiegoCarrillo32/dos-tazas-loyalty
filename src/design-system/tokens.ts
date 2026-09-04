/**
 * Dos Tazas Design System — design tokens
 *
 * This is a *documentation* mirror of the real tokens, which live in
 * `src/app/globals.css` (Tailwind v4, CSS-first). Components never read from
 * this file — they use the generated Tailwind utilities (`bg-warm-roast`,
 * `text-expresso/70`, `rounded-2xl`, …). The data here drives the showcase
 * specimens (swatches, type scale, radii ramps) and serves as a quick reference.
 *
 * Golden rule of the brand: build depth with **opacity modifiers** on the five
 * brand colors, never new shades or raw hex in markup.
 */

export interface ColorToken {
  /** Tailwind utility stem, e.g. `expresso` → `bg-expresso` / `text-expresso`. */
  token: string;
  /**
   * The literal `bg-*` utility. Written out in full (not interpolated) so the
   * Tailwind v4 scanner actually generates the class for the swatch.
   */
  swatch: string;
  light: string;
  dark: string;
  role: string;
}

export const brandColors: ColorToken[] = [
  { token: "expresso", swatch: "bg-expresso", light: "#410505", dark: "#fff5e1", role: "Primary text, headings" },
  { token: "warm-roast", swatch: "bg-warm-roast", light: "#7a1318", dark: "#c2b5a3", role: "Secondary text, borders, CTAs" },
  { token: "coffee-fruit", swatch: "bg-coffee-fruit", light: "#b92323", dark: "#b92323", role: "Primary accent, rings, hover" },
  { token: "white-pergamino", swatch: "bg-white-pergamino", light: "#fff5e1", dark: "#140d0d", role: "Page background" },
  { token: "fruit-light", swatch: "bg-fruit-light", light: "#d64545", dark: "#d64545", role: "Light accent" },
];

/** Semantic (shadcn) tokens mapped onto the brand palette. */
export const semanticColors: ColorToken[] = [
  { token: "background", swatch: "bg-background", light: "#fff5e1", dark: "#140d0d", role: "App canvas" },
  { token: "card", swatch: "bg-card", light: "#ffffff", dark: "#241616", role: "Raised surface" },
  { token: "foreground", swatch: "bg-foreground", light: "#410505", dark: "#fff5e1", role: "Default text" },
  { token: "muted", swatch: "bg-muted", light: "#fbf9f4", dark: "#241616", role: "Subtle fill" },
  { token: "primary", swatch: "bg-primary", light: "#b92323", dark: "#b92323", role: "Accent / coffee-fruit" },
  { token: "secondary", swatch: "bg-secondary", light: "#7a1318", dark: "#c2b5a3", role: "Warm-roast" },
  { token: "border", swatch: "bg-border", light: "#7a131826", dark: "#410505", role: "Hairline border" },
];

/**
 * Opacity ramp on `expresso`. Each step is a full literal class (again, so the
 * scanner emits it) paired with the modifier label for documentation.
 */
export const opacitySteps = [
  { className: "bg-expresso/70", step: "/70" },
  { className: "bg-expresso/60", step: "/60" },
  { className: "bg-expresso/50", step: "/50" },
  { className: "bg-expresso/40", step: "/40" },
  { className: "bg-expresso/30", step: "/30" },
  { className: "bg-expresso/20", step: "/20" },
  { className: "bg-expresso/10", step: "/10" },
  { className: "bg-expresso/5", step: "/5" },
] as const;

/** Status tones — the one place soft Tailwind tints + `dark:` are expected. */
export const statusTones = ["success", "warning", "danger", "info", "accent", "emerald", "neutral"] as const;

export interface TypeSpecimen {
  name: string;
  className: string;
  sample: string;
  usage: string;
}

export const typeScale: TypeSpecimen[] = [
  { name: "Display", className: "text-4xl font-heading", sample: "Dos Tazas", usage: "Hero / marketing" },
  { name: "Page title", className: "text-3xl font-heading", sample: "Roasting calculator", usage: "PageHeader h1" },
  { name: "Section", className: "text-xl font-heading", sample: "Recent orders", usage: "Card / section titles" },
  { name: "Subhead", className: "text-lg font-heading", sample: "Inventory summary", usage: "Inline group titles" },
  { name: "Body", className: "text-sm", sample: "The quick brown coffee bean.", usage: "Default UI / body copy" },
  { name: "Body bold", className: "text-sm font-bold", sample: "Total: ₡12,500", usage: "Emphasis (Gotham Bold)" },
  { name: "Caption", className: "text-xs text-expresso/60", usage: "Hints, metadata", sample: "Updated 2 min ago" },
];

export interface ScaleSpecimen {
  name: string;
  className: string;
  px: string;
}

/** Radius ramp — derived from `--radius: 0.625rem` (10px) in globals.css. */
export const radiusScale: ScaleSpecimen[] = [
  { name: "sm", className: "rounded-sm", px: "~6px" },
  { name: "md", className: "rounded-md", px: "~8px" },
  { name: "lg", className: "rounded-lg", px: "10px — controls" },
  { name: "xl", className: "rounded-xl", px: "~14px — cards" },
  { name: "2xl", className: "rounded-2xl", px: "~18px — containers" },
  { name: "3xl", className: "rounded-3xl", px: "~22px" },
  { name: "full", className: "rounded-full", px: "pills, avatars, CTAs" },
];

export const spacingScale: ScaleSpecimen[] = [
  { name: "1", className: "size-1", px: "4px" },
  { name: "2", className: "size-2", px: "8px" },
  { name: "3", className: "size-3", px: "12px" },
  { name: "4", className: "size-4", px: "16px" },
  { name: "6", className: "size-6", px: "24px" },
  { name: "8", className: "size-8", px: "32px" },
  { name: "12", className: "size-12", px: "48px" },
];

export interface ShadowSpecimen {
  name: string;
  className: string;
  usage: string;
}

/** Warm-tinted elevation — never hard gray shadows. */
export const elevation: ShadowSpecimen[] = [
  { name: "Flat", className: "border border-warm-roast/10", usage: "Inputs, dividers" },
  { name: "Resting", className: "shadow-sm shadow-warm-roast/5 border border-warm-roast/10", usage: "Default card" },
  { name: "Raised", className: "shadow-md shadow-warm-roast/10 border border-warm-roast/10", usage: "Hover / popover" },
  { name: "Floating", className: "shadow-lg shadow-warm-roast/15 border border-warm-roast/10", usage: "Modal / menu" },
];
