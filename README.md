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

The build copies public files to `dist/`; it does not deploy. Browser checks require local Chrome or Edge (or `CHROME_PATH`) and save screenshots in ignored `preview/`.

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
