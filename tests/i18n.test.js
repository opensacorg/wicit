import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { LOCALES, SUPPORTED_LOCALES, resolveLocale } from "../src/js/i18n/locales.js";
import enCatalog from "../src/js/i18n/locales/en.json";

/**
 * A minimal in-memory localStorage stand-in, so the test doesn't require a DOM environment.
 */
function makeStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
}

/**
 * Import a fresh copy of the runtime with the browser globals it reads stubbed.
 * Resetting modules clears the module-level catalog cache and active locale between cases.
 *
 * @param {Object} [options]
 * @param {string} [options.search] - The query string `detectLocale` should see.
 * @param {string[]} [options.languages] - The browser's preferred languages.
 * @param {Record<string,string>} [options.stored] - Seed values for localStorage.
 */
async function loadRuntime({ search = "", languages = [], stored = {} } = {}) {
  const localStorage = makeStorage(stored);
  const documentElement = { lang: "", dir: "" };
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("window", { localStorage, location: { search } });
  vi.stubGlobal("navigator", { languages });
  vi.stubGlobal("document", { documentElement });
  vi.resetModules();
  return { ...(await import("../src/js/i18n/index.js")), documentElement, localStorage };
}

describe("locale registry", () => {
  it("describes every supported locale", () => {
    for (const code of SUPPORTED_LOCALES) {
      expect(LOCALES[code].nativeName).toBeTruthy();
      expect(["ltr", "rtl"]).toContain(LOCALES[code].dir);
    }
  });

  it("resolves region-qualified and aliased tags onto supported locales", () => {
    expect(resolveLocale("es-MX")).toBe("es");
    expect(resolveLocale("zh-Hans-CN")).toBe("zh");
    expect(resolveLocale("en_US")).toBe("en");
    // The Census counts Filipino with Tagalog.
    expect(resolveLocale("fil-PH")).toBe("tl");
  });

  it("returns null for unsupported and malformed tags", () => {
    expect(resolveLocale("de")).toBeNull();
    expect(resolveLocale("")).toBeNull();
    expect(resolveLocale(null)).toBeNull();
    expect(resolveLocale(42)).toBeNull();
  });
});

describe("i18n runtime", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts in English and translates from the source catalog", async () => {
    const { initI18n, getLocale, t } = await loadRuntime();

    await initI18n();

    expect(getLocale()).toBe("en");
    expect(t("nav.map")).toBe(enCatalog["nav.map"]);
  });

  it("prefers the ?lang= parameter over the stored and browser languages", async () => {
    const { initI18n } = await loadRuntime({
      search: "?lang=vi",
      languages: ["ko"],
      stored: { locale: "ru" },
    });

    await expect(initI18n()).resolves.toBe("vi");
  });

  it("prefers the stored choice over the browser languages", async () => {
    const { initI18n } = await loadRuntime({ languages: ["ko"], stored: { locale: "ru" } });

    await expect(initI18n()).resolves.toBe("ru");
  });

  it("falls back to English when no requested language is supported", async () => {
    const { initI18n } = await loadRuntime({ languages: ["de-DE", "fr"] });

    await expect(initI18n()).resolves.toBe("en");
  });

  it("falls back to the English message for a key a catalog does not translate", async () => {
    const { initI18n, t, getLocale } = await loadRuntime();
    await initI18n("xyz");

    expect(getLocale()).toBe("xyz");
    expect(t("nav.map")).toBe(enCatalog["nav.map"]);
  });

  it("returns the key and warns when a message is defined nowhere", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { initI18n, t } = await loadRuntime();
    await initI18n();

    expect(t("nope.not.a.key")).toBe("nope.not.a.key");
    expect(warn).toHaveBeenCalled();
  });

  it("interpolates placeholders and leaves unknown ones visible", async () => {
    const { initI18n, t } = await loadRuntime();
    await initI18n();

    expect(t("map.initFailed", { reason: "boom" })).toContain("boom");
    // A translator's typo should surface in the UI rather than blank the value.
    expect(t("map.initFailed")).toContain("{reason}");
  });

  it("escapes interpolated values in HTML contexts but not in text contexts", async () => {
    const { initI18n, t, tHtml } = await loadRuntime();
    await initI18n();

    const query = '<img src=x onerror="alert(1)">';
    expect(tHtml("search.noResults", { query })).not.toContain("<img");
    expect(tHtml("search.noResults", { query })).toContain("&lt;img");
    // Text destinations set textContent, where escaping would show the entities literally.
    expect(t("search.noResults", { query })).toContain("<img");
  });

  it("selects the plural form matching the count", async () => {
    const { initI18n, tCount } = await loadRuntime();
    await initI18n();

    expect(tCount("search.resultCount", 1, { shown: 1, total: 1 })).toBe("1 of 1 result.");
    expect(tCount("search.resultCount", 25, { shown: 25, total: 132 })).toBe("25 of 132 results.");
  });

  it("formats numbers and currency for the active locale", async () => {
    const { initI18n, setLocale, formatCurrency, formatNumber } = await loadRuntime();
    await initI18n();

    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatCurrency(23850)).toBe("$23,850");

    await setLocale("es");
    // Spanish groups thousands with a period rather than a comma.
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("persists the chosen language and notifies subscribers", async () => {
    const { initI18n, setLocale, onLocaleChange, getLocale, localStorage } = await loadRuntime();
    await initI18n();

    const listener = vi.fn();
    const unsubscribe = onLocaleChange(listener);
    await setLocale("ko");

    expect(getLocale()).toBe("ko");
    expect(listener).toHaveBeenCalledWith("ko");
    expect(localStorage.getItem("locale")).toBe("ko");

    unsubscribe();
    await setLocale("vi");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reflects the language and its writing direction onto the document", async () => {
    const { initI18n, setLocale, getDirection, documentElement } = await loadRuntime();
    await initI18n();

    expect(documentElement.lang).toBe("en");
    expect(documentElement.dir).toBe("ltr");

    await setLocale("ar");

    expect(documentElement.lang).toBe("ar");
    expect(documentElement.dir).toBe("rtl");
    expect(getDirection()).toBe("rtl");
  });

  it("keeps English active when asked for an unsupported language", async () => {
    const { initI18n, setLocale } = await loadRuntime();
    await initI18n();

    await expect(setLocale("de")).resolves.toBe("en");
  });
});
