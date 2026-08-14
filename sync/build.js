/* Snapshot -> cases/<id>.html
 *
 *   deno run --allow-read --allow-write sync/build.js
 *
 * Reads sync/snapshot/<id>.md (raw Notion markdown, diffable) plus
 * sync/snapshot/<id>.meta.json, and writes one static page per case.
 * Generated output is committed so a content change shows up in `git diff`
 * before it goes live.
 *
 * Refuses to write a page whose `result` string in data.js no longer appears
 * in its Notion content. That is the drift guard: the audited metric on the
 * map and the case page can never quietly disagree.
 */

import { render, inline } from "./render.js";

const ROOT = new URL("..", import.meta.url).pathname;
const SNAP = ROOT + "sync/snapshot/";

globalThis.window = {};
new Function(Deno.readTextFileSync(ROOT + "data.js")).call(globalThis);
const DATA = globalThis.window.PORTFOLIO_DATA;

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* The first line of every Notion page is the back-link we inserted on
   10.08.2026. The case page has its own, so drop it. */
function stripBackLink(md) {
  const lines = md.split("\n");
  if (/Back to the map/i.test(lines[0])) lines.shift();
  return lines.join("\n");
}

/* The audit found four different shapes for the line under the back-link:
   plain paragraph, H1, or blockquote depending on the page. Pull whichever
   it is and render it as one subtitle, so all thirteen pages open the same
   way. */
function takeSubtitle(md) {
  const lines = md.split("\n");
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (i >= lines.length) return { subtitle: "", rest: md };

  const t = lines[i].trim();
  if (/^---+$/.test(t) || t.startsWith("##")) return { subtitle: "", rest: md };

  let text = null;
  if (/^#\s+/.test(t)) text = t.replace(/^#\s+/, "");
  else if (t.startsWith(">")) text = t.replace(/^>\s?/, "");
  else if (!/^[-*<`]/.test(t) && !/^\d+\./.test(t)) text = t;

  if (text === null) return { subtitle: "", rest: md };
  lines.splice(i, 1);
  return { subtitle: text.replace(/<br>/g, " "), rest: lines.join("\n") };
}

function page(sys, meta, body, subtitle) {
  const title = esc(meta.title.replace(/\s*#\d+\s*$/, ""));
  const desc = esc(sys.hook);
  const links = [
    '<a class="btn" href="' + sys.notion + '" target="_blank" rel="noopener noreferrer">Read the original on Notion</a>'
  ];
  if (sys.github) {
    links.push(
      '<a class="btn" href="' + sys.github + '" target="_blank" rel="noopener noreferrer">Code on GitHub</a>'
    );
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} - Vitalii Burorichnyi</title>
<meta name="description" content="${desc}">
<link rel="icon" href="../avatar.png">
<link rel="apple-touch-icon" href="../avatar.png">

<!-- Same pre-paint theme script as the map, so moving between them never flashes. -->
<script>
  (function () {
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (e) { /* blocked */ }
    var theme = (stored === "light" || stored === "dark") ? stored
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  })();
</script>

<link rel="stylesheet" href="../styles.css">
<link rel="stylesheet" href="../case.css">
</head>
<body class="case-body">

<header class="case-header">
  <a class="case-back" href="../#${sys.id}">
    <img src="../avatar.png" alt="" width="36" height="36">
    <span>Back to the map</span>
  </a>
  <button id="theme-toggle" class="icon-btn" type="button" aria-label="Switch to light theme">
    <svg class="icon icon--sun" viewBox="0 0 24 24" width="18" height="18" fill="none"
         stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2"/>
      <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5"/>
    </svg>
    <svg class="icon icon--moon" viewBox="0 0 24 24" width="18" height="18" fill="none"
         stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.1 14.3A8.2 8.2 0 0 1 9.7 3.9a8.6 8.6 0 1 0 10.4 10.4Z"/>
    </svg>
  </button>
</header>

<main class="case">
  <p class="eyebrow">Case study</p>
  <h1>${title}</h1>
  ${subtitle ? '<p class="subtitle">' + inline(subtitle) + "</p>" : ""}

  <div class="case-meta">
    <span>${esc(sys.team === "solo" ? "Solo build" : sys.team)}</span>
    ${sys.stack.map((s) => "<span>" + esc(s) + "</span>").join("")}
  </div>

  <div class="case-body-text">
${body}
  </div>

  <div class="case-links">${links.join("")}</div>
</main>

<script src="../case.js"></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------------ */

let built = 0;
let failed = 0;
const ids = [];

for (const sys of DATA.systems) {
  let md;
  try {
    md = Deno.readTextFileSync(SNAP + sys.id + ".md");
  } catch {
    continue; /* not snapshotted yet */
  }

  const meta = JSON.parse(Deno.readTextFileSync(SNAP + sys.id + ".meta.json"));

  /* Drift guard. The map's headline number has to still be in the source. */
  const plain = md.replace(/\\/g, "").replace(/\s+/g, " ");
  const claim = sys.result.replace(/\s+/g, " ");
  const firstClaim = claim.split(".")[0].trim();
  const loose = firstClaim.replace(/[~()%,]/g, "").split(/\s+/).filter((w) => /\d/.test(w));
  const missing = loose.filter((n) => !plain.replace(/[~()%,]/g, "").includes(n));
  if (missing.length) {
    console.error(
      "DRIFT  " + sys.id + ": data.js result cites " + missing.join(", ") +
      " which no longer appears in the Notion content.\n" +
      "       map:    " + sys.result
    );
    failed++;
    continue;
  }

  const noBack = stripBackLink(md);
  const { subtitle, rest } = takeSubtitle(noBack);

  /* Every page opens with a divider under the subtitle. The meta strip
     already draws a rule there, so the first one would double up. */
  const trimmed = rest.replace(/^(?:\s*\n)*\s*---+\s*\n/, "");

  let body;
  try {
    body = render(trimmed, { captions: meta.captions || {} });
  } catch (e) {
    console.error("RENDER " + sys.id + ": " + e.message);
    failed++;
    continue;
  }

  Deno.writeTextFileSync(ROOT + "cases/" + sys.id + ".html", page(sys, meta, body, subtitle));
  ids.push(sys.id);
  built++;
}

console.log("\nbuilt " + built + " case page(s): " + (ids.join(", ") || "none"));
console.log("not yet snapshotted: " + (DATA.systems.length - built - failed));
if (failed) {
  console.error(failed + " failure(s).");
  Deno.exit(1);
}
console.log("\nAdd to data.js:  casePages: " + JSON.stringify(ids));
