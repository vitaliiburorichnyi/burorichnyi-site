/* Notion REST API -> sync/snapshot/
 *
 *   NOTION_TOKEN=ntn_... deno run --allow-net --allow-read --allow-write --allow-env sync/fetch.js
 *   NOTION_TOKEN=ntn_... deno run ... sync/fetch.js rag stale-deals   (subset)
 *
 * Reads typed blocks rather than the connector's markdown view. That is the
 * whole reason this file exists: the markdown view flattens an image caption
 * into a neighbouring paragraph, and the thirteen pages disagree about which
 * side it lands on, so captions cannot be recovered from it. The API returns
 * caption as a field on the image block, which is unambiguous.
 *
 * Images are downloaded here, not linked. Notion serves them from signed S3
 * URLs with a five-minute expiry, so a link would be dead before anyone read
 * the page.
 */

const VERSION = "2022-06-28";
const ROOT = new URL("..", import.meta.url).pathname;
const TOKEN = Deno.env.get("NOTION_TOKEN");

if (!TOKEN) {
  console.error("NOTION_TOKEN is not set. See sync/README.md.");
  Deno.exit(1);
}

globalThis.window = {};
new Function(Deno.readTextFileSync(ROOT + "data.js")).call(globalThis);
const DATA = globalThis.window.PORTFOLIO_DATA;

const only = Deno.args.length ? new Set(Deno.args) : null;

async function api(path) {
  const res = await fetch("https://api.notion.com/v1" + path, {
    headers: {
      Authorization: "Bearer " + TOKEN,
      "Notion-Version": VERSION
    }
  });
  if (!res.ok) {
    throw new Error(path + " -> " + res.status + " " + (await res.text()).slice(0, 300));
  }
  return res.json();
}

async function children(id) {
  const out = [];
  let cursor;
  do {
    const q = "?page_size=100" + (cursor ? "&start_cursor=" + cursor : "");
    const page = await api("/blocks/" + id + "/children" + q);
    out.push(...page.results);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return out;
}

/* --------------------------------------------------------- rich text -- */

function rich(arr) {
  if (!arr || !arr.length) return "";
  return arr
    .map((t) => {
      let s = t.plain_text;
      const a = t.annotations || {};
      if (a.code) return "`" + s + "`";
      /* A soft line break inside one paragraph is a newline in the API and a
         <br> in the markdown dialect the renderer reads. */
      s = s.replace(/\n/g, "<br>");
      if (a.bold) s = "**" + s + "**";
      if (a.italic) s = "*" + s + "*";
      const href = t.href || (t.text && t.text.link && t.text.link.url);
      if (href) s = "[" + s + "](" + href + ")";
      return s;
    })
    .join("");
}

/* ------------------------------------------------------------ images -- */

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("image " + res.status + " " + url.slice(0, 80));
  await Deno.writeFile(dest, new Uint8Array(await res.arrayBuffer()));
}

function extensionOf(url) {
  const m = url.split("?")[0].match(/\.(png|jpe?g|gif|webp|svg)$/i);
  return m ? m[1].toLowerCase() : "png";
}

/* ------------------------------------------------------------ blocks -- */

async function toMarkdown(blocks, ctx) {
  const lines = [];

  for (const b of blocks) {
    switch (b.type) {
      case "paragraph":
        lines.push(rich(b.paragraph.rich_text));
        break;
      case "heading_1":
        lines.push("# " + rich(b.heading_1.rich_text));
        break;
      case "heading_2":
        lines.push("## " + rich(b.heading_2.rich_text));
        break;
      case "heading_3":
        lines.push("### " + rich(b.heading_3.rich_text));
        break;
      case "bulleted_list_item":
        lines.push("- " + rich(b.bulleted_list_item.rich_text));
        break;
      case "numbered_list_item":
        lines.push("1. " + rich(b.numbered_list_item.rich_text));
        break;
      case "to_do":
        lines.push("- [" + (b.to_do.checked ? "x" : " ") + "] " + rich(b.to_do.rich_text));
        break;
      case "quote":
        lines.push("> " + rich(b.quote.rich_text));
        break;
      case "divider":
        lines.push("---");
        break;
      case "code":
        lines.push("```" + (b.code.language || "plain text"));
        lines.push(rich(b.code.rich_text).replace(/<br>/g, "\n"));
        lines.push("```");
        break;

      case "image": {
        const src = b.image.type === "external" ? b.image.external.url : b.image.file.url;
        ctx.n += 1;
        const name = String(ctx.n).padStart(2, "0") + "." + extensionOf(src);
        const rel = "cases/assets/" + ctx.id + "/" + name;
        await download(src, ROOT + rel);
        lines.push("![](" + rel + ")");
        const cap = rich(b.image.caption);
        if (cap) ctx.captions[rel] = cap.replace(/<br>/g, " ");
        break;
      }

      case "video": {
        const src = b.video.type === "external" ? b.video.external.url : b.video.file.url;
        lines.push('<video src="' + src + '"></video>');
        break;
      }

      case "table": {
        const rows = await children(b.id);
        lines.push('<table header-row="' + (b.table.has_column_header ? "true" : "false") + '">');
        for (const r of rows) {
          lines.push("<tr>");
          for (const cell of r.table_row.cells) lines.push("<td>" + rich(cell) + "</td>");
          lines.push("</tr>");
        }
        lines.push("</table>");
        break;
      }

      case "callout":
        /* Rendered as a quote. No page used one as of the 14.08.2026 audit,
           so this is here to stop a new one disappearing silently. */
        lines.push("> " + rich(b.callout.rich_text));
        break;

      default:
        /* Loud on purpose. A silently dropped block is a case study with a
           hole in it that nobody notices. */
        console.warn("  ! unhandled block type: " + b.type + " (" + b.id + ")");
        ctx.unhandled.push(b.type);
    }
  }

  return lines.join("\n");
}

/* ------------------------------------------------------------------------ */

let ok = 0;
let bad = 0;

for (const sys of DATA.systems) {
  if (only && !only.has(sys.id)) continue;
  if (!sys.notion) continue;

  const pageId = sys.notion.split("/p/")[1].replace(/[^a-f0-9]/gi, "").slice(0, 32);
  const ctx = { id: sys.id, n: 0, captions: {}, unhandled: [] };

  try {
    console.log("fetching " + sys.id + " ...");
    const meta = await api("/pages/" + pageId);
    await Deno.mkdir(ROOT + "cases/assets/" + sys.id, { recursive: true });

    const blocks = await children(pageId);
    const md = await toMarkdown(blocks, ctx);

    const title =
      (meta.properties && meta.properties.title && rich(meta.properties.title.title)) ||
      sys.name;

    Deno.writeTextFileSync(ROOT + "sync/snapshot/" + sys.id + ".md", md + "\n");
    Deno.writeTextFileSync(
      ROOT + "sync/snapshot/" + sys.id + ".meta.json",
      JSON.stringify(
        {
          id: sys.id,
          title: title,
          notion: sys.notion,
          fetchedAt: new Date().toISOString(),
          fetchedVia: "Notion REST API " + VERSION,
          images: ctx.n,
          captions: ctx.captions,
          unhandledBlockTypes: [...new Set(ctx.unhandled)]
        },
        null,
        2
      ) + "\n"
    );

    console.log("  " + ctx.n + " image(s), " + Object.keys(ctx.captions).length + " caption(s)");
    ok++;
  } catch (e) {
    console.error("  FAILED " + sys.id + ": " + e.message);
    bad++;
  }
}

console.log("\nsnapshotted " + ok + " page(s)" + (bad ? ", " + bad + " failed" : ""));
console.log("next:  deno run --allow-read --allow-write sync/build.js");
Deno.exit(bad ? 1 : 0);
