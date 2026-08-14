# Notion sync

Notion stays the single source of truth for case content. This turns it into static pages in
`cases/`, committed so a content change is reviewable in `git diff` before it goes live.

```
Notion  ->  fetch.js  ->  sync/snapshot/<id>.md  ->  build.js  ->  cases/<id>.html
                          sync/snapshot/<id>.meta.json
                          cases/assets/<id>/*.png
```

Two steps on purpose. Fetching hits the network and rewrites the snapshot; building is
deterministic and offline. When a page renders wrong you re-run the second one only, and the
snapshot diff tells you whether the content moved or the renderer did.

## Running it

```bash
NOTION_TOKEN=ntn_... deno run --allow-net --allow-read --allow-write --allow-env sync/fetch.js
deno run --allow-read --allow-write sync/build.js
```

One case at a time:

```bash
NOTION_TOKEN=ntn_... deno run --allow-net --allow-read --allow-write --allow-env sync/fetch.js rag
```

`build.js` prints the `casePages` array to paste into `data.js`. That array is what decides whether
the map's **Full case study** button goes to `cases/<id>.html` or straight out to Notion, so the
rollout can go one case at a time instead of needing a flag day.

## Creating the token, once

1. <https://www.notion.so/my-integrations> -> **New integration**
2. Internal, workspace = the one holding the portfolio. Name it something like `burorichnyi-site`.
3. Capabilities: **Read content** only. It never writes.
4. Copy the token. It starts `ntn_`.
5. Open the parent page, *Vitalii Burorichnyi - AI Automation Specialist*, and use **Connections ->
   Add connection** to add the integration. Child pages inherit it, so all thirteen cases are
   covered by that one step.

The token is a workspace credential. It does not belong in this repo, in a commit, or in a chat
message. Keep it in the shell that runs the sync.

## What the sync will not do

- **Overwrite a metric silently.** `build.js` checks that the numbers in a system's `result` string
  in `data.js` still appear in its Notion page, and refuses to build that page if they do not. The
  map and the case study can disagree only deliberately.
- **Drop a block type it does not know.** An unhandled block warns in `fetch.js` and is recorded in
  `unhandledBlockTypes` in the meta file; an unsupported one throws in `render.js`. A case study
  with a hole in it that nobody notices is the failure mode worth being noisy about.
- **Hot-link an image.** Notion's image URLs are signed and expire in about five minutes.

## Known content issues, as of the 14.08.2026 audit

- **`lead-funnel` has one unfetchable image.** Its first screenshot is stored as a `file://`
  attachment record with no URL behind it. Re-upload it in Notion or that page ships one short.
- **`voice-qualifier` and `voice-retail` describe themselves as unpaid** in body text. The map
  carries no such framing by design. Rendering these pages on the site puts it back.
- **`youtube-digest` ends with four unchecked to-dos** that are author notes about missing
  screenshots. They render greyed and explicitly unfinished, which is honest but probably not
  wanted on a case page.

## Normalisation applied on the way through

The thirteen pages were written over months and do not agree with each other. The build makes them
one shape:

| Notion | Case page |
|---|---|
| Subtitle as a paragraph, an H1, or a blockquote depending on the page | one `.subtitle` |
| Em and en dashes throughout | `-`, matching the map's own copy |
| Every H2 opens with a decorative emoji | dropped |
| Leading `← Back to the map` line | dropped, the page header has one |
| Divider immediately under the subtitle | dropped, the meta strip draws that rule |
| Blank header row on a spec table | dropped |
| `colgroup` widths | dropped, they fight the responsive column |
