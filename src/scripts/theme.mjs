export const THEME_STORAGE_KEY = "lvdm-theme";

/**
 * Normalize persisted or user-supplied values to a supported theme preference.
 * Unknown and missing values deliberately fall back to the live system scheme.
 *
 * @param {unknown} value
 * @returns {"system" | "light" | "dark"}
 */
export function normalizeThemePreference(value) {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

/**
 * Resolve a preference to the colour scheme currently presented by the page.
 *
 * @param {"system" | "light" | "dark"} preference
 * @param {boolean} systemPrefersDark
 * @returns {"light" | "dark"}
 */
export function resolveThemePreference(preference, systemPrefersDark) {
  if (preference === "light" || preference === "dark") return preference;
  return systemPrefersDark ? "dark" : "light";
}

/**
 * Build concise assistive text for the active theme preference.
 *
 * @param {"system" | "light" | "dark"} preference
 * @param {"light" | "dark"} resolvedTheme
 * @returns {string}
 */
export function describeThemePreference(preference, resolvedTheme) {
  if (preference === "system") {
    return `Colour theme follows the system; currently ${resolvedTheme}.`;
  }

  return `${preference === "light" ? "Light" : "Dark"} colour theme selected.`;
}
