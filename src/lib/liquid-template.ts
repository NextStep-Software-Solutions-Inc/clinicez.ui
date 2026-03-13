import { Liquid } from "liquidjs";

// Single shared Liquid engine instance
// strictVariables: false — unknown variables render as empty string (same behaviour as old regex approach)
// outputEscape: false — variables are output as raw HTML (required for medicine lists, sig markup, etc.)
const engine = new Liquid({
  strictFilters: false,
  strictVariables: false,
  outputEscape: false,
});

/**
 * Renders a document template string using LiquidJS.
 *
 * Backward-compatible: legacy `@{variable}` placeholders are automatically
 * converted to `{{ variable }}` before rendering so that templates created
 * before the Liquid migration continue to work without modification.
 */
export function renderLiquidTemplate(
  template: string,
  variables: Record<string, unknown>
): string {
  // Convert legacy @{variable} → {{ variable }}
  const migratedTemplate = template.replace(/@\{(\w+)\}/g, "{{ $1 }}");
  return engine.parseAndRenderSync(migratedTemplate, variables);
}

