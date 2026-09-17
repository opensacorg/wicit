/**
 * The languages WICit ships message catalogs for.
 *
 * The list tracks the languages most spoken at home in California (American Community Survey)
 * intersected with the threshold languages California requires for public-benefit language
 * access, since WIC applicants are the audience. English is the source language: every string
 * lives in `locales/en.json`, and every other catalog falls back to it key by key.
 *
 * Codes are BCP 47. Adding a language means adding an entry here and a matching
 * `locales/<code>.json`; nothing else in the app needs to change.
 */

/** @type {string} The source language, and the fallback for every missing message. */
export const DEFAULT_LOCALE = "en";

/**
 * @typedef {Object} LocaleDescriptor
 * @property {string} name - The language's English name, for `title`/`aria-label` text.
 * @property {string} nativeName - The language's own name, shown in the language switcher.
 * @property {"ltr"|"rtl"} dir - The writing direction applied to `<html dir>`.
 */

/** @type {Record<string, LocaleDescriptor>} */
export const LOCALES = {
  en: { name: "English", nativeName: "English", dir: "ltr" },
  es: { name: "Spanish", nativeName: "Español", dir: "ltr" },
  zh: { name: "Chinese", nativeName: "中文", dir: "ltr" },
  tl: { name: "Tagalog", nativeName: "Tagalog", dir: "ltr" },
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr" },
  ko: { name: "Korean", nativeName: "한국어", dir: "ltr" },
  hy: { name: "Armenian", nativeName: "Հայերեն", dir: "ltr" },
  fa: { name: "Persian", nativeName: "فارسی", dir: "rtl" },
  ru: { name: "Russian", nativeName: "Русский", dir: "ltr" },
  ar: { name: "Arabic", nativeName: "العربية", dir: "rtl" },
  pa: { name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", dir: "ltr" },
  hmn: { name: "Hmong", nativeName: "Hmoob", dir: "ltr" },
  xyz: { name: "Mock", nativeName: "Mock", dir: "ltr" },
};

/** @type {string[]} Supported locale codes, in the order they appear in the switcher. */
export const SUPPORTED_LOCALES = Object.keys(LOCALES);

/**
 * Language tags that predate, or sit alongside, the codes used in {@link LOCALES}.
 *
 * @type {Record<string, string>}
 */
const ALIASES = {
  // The Census counts Filipino speakers with Tagalog.
  fil: "tl",
  // Hmong Daw and Hmong Njua, the two dialects spoken in California.
  mww: "hmn",
  hnj: "hmn",
};

/**
 * Resolve an arbitrary language tag onto a supported locale.
 *
 * Browsers report region-qualified tags (`es-MX`, `zh-Hans-CN`), so the base subtag is tried
 * after the full tag, and aliases are checked at both levels.
 *
 * @param {string|null|undefined} tag - A BCP 47 language tag, or anything else.
 * @return {string|null} The supported locale code, or null when nothing matches.
 *
 * @example
 * resolveLocale("es-MX"); // "es"
 * resolveLocale("de");    // null
 */
export function resolveLocale(tag) {
  if (typeof tag !== "string" || !tag) return null;
  const normalized = tag.toLowerCase().replace(/_/g, "-");
  const base = normalized.split("-")[0];
  for (const candidate of [normalized, ALIASES[normalized], base, ALIASES[base]]) {
    if (candidate && Object.hasOwn(LOCALES, candidate)) return candidate;
  }
  return null;
}
