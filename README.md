# WICit: Where to Shop with WIC

### The California deployment of WICit is live!

#### ~~Check it out at [findwic.com](http://findwic.com)!~~ Currently offline until version 2.0.0 is released.

---

### Development Environment Setup

1. [Install Vite+](https://viteplus.dev/guide)
2. [Fork the repository and setup a local clone](https://help.github.com/articles/fork-a-repo)
3. Move into your local wicit directory: `cd <yourdirectory>/wicit`
4. Copy the `.env.dist` file to a file called `.env`
   1. Navigate to https://www.mapbox.com/studio/
   2. Click "New style"
   3. Select "Classic styles" → "Streets"
   4. Click "Customize"
   5. Click "Share"
   6. In the Production URL section, copy the "Preview only" URL and update the MAPBOX_INTEGRATION_URL parameter in the .env file.

### Development

1. Setup the app using the relevant instructions above.
2. Start the server: `vp dev`
3. [Try it out](http://localhost:5173)

### Translations

WICit renders every string through a message catalog, so the app can be read in the languages
Californians actually speak. English (`src/js/i18n/locales/en.json`) is the source of truth;
lookups fall back to it key by key, so a partial catalog renders translated where it can and
English everywhere else.

**The other twelve languages are stubs.** The runtime, the switcher, and the catalogs are in
place, but no strings have been translated yet.

- Pick a language from the header, or append `?lang=<code>` to any URL to link straight into one.
  The choice is remembered, and the browser's own language is used on a first visit.
- To translate, edit the catalog for the language and follow
  [`src/js/i18n/locales/README.md`](src/js/i18n/locales/README.md).
- To add a language, add an entry to `src/js/i18n/locales.js` and a matching JSON catalog. The
  switcher, the `<html lang>`/`dir` attributes, and number formatting all read that registry.

### License

WICit is free software, and may be redistributed under the MIT-LICENSE.
