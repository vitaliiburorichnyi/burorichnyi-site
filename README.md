# burorichnyi.com

An interactive map of thirteen published AI automation systems built for support, sales and operations
work.

Three labelled bands: the problems businesses actually arrive with, the systems built to solve them,
and the capabilities underneath. Clicking any pill fills a detail panel, highlights the related work
in the other bands, and draws connectors between them. The page never navigates away. Full case
studies live in Notion, and the public repositories are linked from each case.

## Running it

There is no build step and nothing to install. Open `index.html` in a browser.

It also works over a static server if you prefer one:

```
python3 -m http.server 8000
```

## Files

```
index.html    markup and the pre-paint theme script
styles.css    all styling, both themes, three layouts
app.js        rendering, selection, connectors, tours
data.js       the single source of truth for every node and number
avatar.png    header image, also the favicon
```

## Constraints it is built to

- Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no dependencies, and no
  network requests at runtime.
- **It must open correctly from `file://`.** That is why the data lives in `data.js` as
  `window.PORTFOLIO_DATA` rather than in `data.json`: a `fetch` of a local `.json` file is blocked by
  the browser when a page is opened from the filesystem, which would leave the map empty in exactly
  the case that has to work.
- Both themes meet WCAG AA on every text role. Measured on the rendered colours: dark lowest 6.05:1,
  light lowest 5.16:1.

## What it does

- Click a pill to fill the panel, highlight related nodes in the other bands, and draw curved
  connectors. Lines are only drawn where a relationship exists: problem to system, system to
  capability, capability to system. Never system to system.
- Deep links work and survive back and forward, for example `/#rag`.
- Three guided tours, each a fixed sequence with narration, for business owners, recruiters and
  engineers.
- Light and dark themes. Follows the operating system by default, and a manual choice is remembered.
- Keyboard: `Escape` clears the selection or leaves a tour, arrow keys step through a running tour.

## Layouts

| Width | Panel |
|---|---|
| 1100px and up | fixed column beside the map |
| 768 to 1099px | bottom sheet over the map |
| below 768px | full-screen detail with a back button, connectors hidden |

## A note on the data

Every number rendered on the page comes from `data.js`, which is the single source of truth. The
figures are verified case records used verbatim; nothing in the interface computes, rounds or
estimates them.

Systems carry a `team` value so that a build shared with other people is never presented as solo
work. The map deliberately shows no badge describing how a piece of work came about.
