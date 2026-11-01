# WinGo Study

An educational course landing page exploring WinGo mechanics, probability, statistics, and the evaluation of observed patterns. Game components are illustrations; the page contains no playable simulations, prediction tools, or payment flows.

## Run locally

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
npm start
```

Open http://127.0.0.1:4173/. Set `PORT` to use a different port.

```sh
npm run check
npm test
npm run build
```

Use `npm run preview` to build and preview the exact `dist/` files used for deployment.

The build renders the configured page, refreshes the root `index.html`, and copies public files to `dist/`; it does not deploy. The root page is a generated static fallback for ordinary preview servers. Browser checks require local Chrome or Edge (or `CHROME_PATH`) and save screenshots in ignored `preview/`.

## Two configuration files

| File | Controls |
| --- | --- |
| [`config/disclosures.json`](config/disclosures.json) | Education-only notice, hero/footer disclaimers, illustration labels, history caveats, and transparency FAQ answers. |
| [`config/site.json`](config/site.json) | Brand, page title/description, hero copy, course destination and button labels, enrollment/access information, core colors, and motion switches. |

Edit the JSON values and save. Refresh the local site to see changes; no server restart is needed. For a hosted site, rebuild and deploy. Disclosures are rendered into HTML and remain readable without JavaScript. Values are plain text, not HTML. Both files contain public-facing settings; keep credentials and private lesson access tokens out of them.

Set `course.url` to a full `https://...` URL when ready; it updates all four main course buttons. The default `#course` leads to the course overview. Navigation and secondary curriculum links stay on the page. Update `status`, `enrollmentAnswer`, and `accessAnswer` to match the actual enrollment process.

Colors accept six-digit hex values. Motion switches accept `true` or `false`; visitors' reduced-motion preferences always take priority. Curriculum paragraphs and layout remain in `templates/index.html` to keep configuration compact. Edit that template for layout/content changes; do not edit the generated root page. `npm start` renders it live. For any other static preview server, run `npm run build` after configuration changes so the root page is refreshed.

For the current **Cloudflare Workers** pipeline, keep build command **`npm run build`** and deploy command **`npx wrangler deploy`**. The root `wrangler.jsonc` declares `assets.directory` as `./dist`, so Wrangler uploads the generated static site without a Worker script. Set the project root to this repository's root.

If you deliberately use **Cloudflare Pages** instead, use build command `npm run build` and output directory `dist` in its dashboard. The tracked Wrangler configuration targets Workers, so use a Pages-specific configuration for that separate workflow rather than mixing Pages settings with `wrangler deploy`.

Deploy the generated `dist/` contents rather than `templates/`. Configuration files, source templates, and development tools are not copied into the public build. If you see literal `{{site...}}` text or a white hero, an old raw-template deployment is being served: correct the build settings and redeploy the latest commit.

## Content and behavior

Emerald-and-gold course page with the original ball artwork, static category/history/chart illustrations, expandable curriculum and FAQs, mobile navigation, scroll reveals, and reduced-motion support.

The WinGo polish adds emerald category panels, orange/blue size badges, a hero result sequence, and a personal-history illustration with both wins and losses. The chart draws once on entry, navigation stays available while scrolling, and the active section is indicated. Initial lesson access through restricted Google Drive sharing is described in the FAQ; Drive links and enrollment are not yet configured.

The temporary brand name is **WinGo Study**. The curriculum is proposed copy for review. All course CTAs point to the course outline until a destination is supplied. Enrollment and pricing are not configured. Google Fonts supplies DM Sans and Manrope when online; system fallbacks remain available.

## References

- Component screenshots are in `ref_components/`.
- Game simulation and reusable component source: [wingo-aff](https://github.com/git4alauddin/wingo-aff).

Number-ball SVG artwork was reused from this owner-provided reference repository.

The reference repository is maintained separately and is excluded from this repository. To obtain a local copy from the project root:

```sh
git clone https://github.com/git4alauddin/wingo-aff.git ref_components/wingo-aff
```

The reference simulator uses configured outcomes. Scripted demonstrations are educational examples and do not establish real-world prediction accuracy or profitability.
