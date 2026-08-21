/* Notion enhanced-markdown -> HTML.
 *
 * Handles exactly the ten block types the 14.08.2026 audit found across all
 * thirteen case pages, and nothing else. If a future page introduces a toggle,
 * a column list or a callout block, this throws rather than dropping it
 * silently: a case study that quietly loses a section is worse than a build
 * that fails.
 *
 * Deliberately not a general markdown parser. The input is one known
 * generator's output, so the rules can be exact instead of forgiving.
 */

/* ------------------------------------------------------------- inline -- */

const ESCAPES = /\\([\\$<>~:*_`#\[\]()!|-])/g;

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Inline formatting, applied in an order that stops the markers inside a code
   span from being read as formatting. Code is pulled out first and put back
   last, which is the only reliable way without a real tokenizer. */
export function inline(src) {
  const codes = [];

  /* Em and en dashes are normalised to "-", the same rule the map's own copy
     follows. Notion is full of them; without this the case pages and the map
     read as two different voices. Code spans are protected below, and fenced
     code never reaches this function, so the box-drawing diagrams survive. */
  src = src.replace(/\s*—\s*/g, " - ").replace(/–/g, "-");

  let s = src.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return "@@CODE" + (codes.length - 1) + "@@";
  });

  /* Notion's soft line break is the one tag allowed through. It has to be
     hidden before escaping, or it comes out the other side as visible text. */
  s = s.replace(/<br\s*\/?>/gi, " LINEBREAK ");

  s = escapeHtml(s);

  /* Links before emphasis: a link title can contain underscores. */
  s = s.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (_, text, href) => {
    const safe = href.replace(/"/g, "%22");
    const ext = /^https?:\/\//.test(safe)
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
    return '<a href="' + safe + '"' + ext + ">" + text + "</a>";
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  /* Bare URLs that were never wrapped in a link. */
  s = s.replace(
    /(^|[\s(])(https?:\/\/[^\s<)]+)/g,
    (_, pre, url) =>
      pre + '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + "</a>"
  );

  s = s.replace(ESCAPES, "$1");
  s = s.replace(/ ?LINEBREAK ?/g, "<br>");

  return s.replace(/@@CODE(\d+)@@/g, (_, i) => "<code>" + escapeHtml(codes[i]) + "</code>");
}

/* ------------------------------------------------------------- blocks -- */

function table(lines) {
  /* Notion emits real HTML for tables, so this reads the tags rather than
     pipe syntax. colgroup widths are dropped on purpose: they are Notion's
     editor layout and they fight the responsive column here. */
  const headerRow = /header-row="true"/.test(lines[0]);
  const rows = [];
  let cur = null;

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("<tr>")) cur = [];
    else if (t.startsWith("</tr>")) {
      if (cur) rows.push(cur);
      cur = null;
    } else if (t.startsWith("<td>")) {
      const m = t.match(/^<td>([\s\S]*)<\/td>$/);
      if (cur) cur.push(m ? m[1] : "");
    }
  }
  if (!rows.length) return "";

  /* A "header row" whose cells are all empty is Notion's blank spec-table
     header. Rendering it produces an empty grey strip, so drop it. */
  const firstIsBlank = rows[0].every((c) => !c.trim());
  const useHeader = headerRow && !firstIsBlank;
  const body = firstIsBlank ? rows.slice(1) : rows;

  let out = '<div class="table-wrap"><table>';
  body.forEach((cells, i) => {
    const tag = useHeader && i === 0 ? "th" : "td";
    const scope = tag === "th" ? ' scope="col"' : "";
    out +=
      "<tr>" +
      cells.map((c) => "<" + tag + scope + ">" + inline(c) + "</" + tag + ">").join("") +
      "</tr>";
  });
  return out + "</table></div>";
}

function loom(src) {
  /* Linked, not iframed. An iframe would be a third-party request on a page
     that otherwise makes none, and it cannot be lazy without script. */
  const l = src.match(/loom\.com\/share\/([a-z0-9]+)/i);
  if (l) {
    return (
      '<p class="walkthrough"><a href="https://www.loom.com/share/' +
      l[1] +
      '" target="_blank" rel="noopener noreferrer">Watch the walkthrough on Loom</a></p>'
    );
  }
  /* Walkthroughs moved to YouTube from case #14 on, because Loom's free plan
     caps at 25 videos and will not export an MP4. Same treatment: a link. */
  const y = src.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{6,})/i);
  if (y) {
    return (
      '<p class="walkthrough"><a href="https://www.youtube.com/watch?v=' +
      y[1] +
      '" target="_blank" rel="noopener noreferrer">Watch the walkthrough on YouTube</a></p>'
    );
  }
  return "";
}

/* The caption sits either before or after its image depending on the page, so
   position cannot be trusted. Captions are carried in the snapshot instead,
   keyed by image path, and paired here. */
function image(path, captions) {
  const cap = captions[path];
  const alt = cap ? escapeHtml(cap) : "";
  let out = '<figure><img src="../' + path + '" alt="' + alt + '" loading="lazy">';
  if (cap) out += "<figcaption>" + inline(cap) + "</figcaption>";
  return out + "</figure>";
}

const KNOWN_UNSUPPORTED = /^<(toggle|column_list|column|callout|synced_block|child_database|bookmark|embed|equation)\b/;

export function render(markdown, opts) {
  const captions = (opts && opts.captions) || {};
  const lines = markdown.split("\n");
  const out = [];
  let i = 0;

  const flushList = (items, ordered, todo) => {
    if (!items.length) return;
    if (todo) {
      out.push(
        '<ul class="todo">' +
          items.map((t) => "<li>" + inline(t) + "</li>").join("") +
          "</ul>"
      );
    } else {
      const tag = ordered ? "ol" : "ul";
      out.push(
        "<" + tag + ">" + items.map((t) => "<li>" + inline(t) + "</li>").join("") + "</" + tag + ">"
      );
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t || t === "<empty-block/>" || t === "<br>") {
      i++;
      continue;
    }

    if (KNOWN_UNSUPPORTED.test(t)) {
      throw new Error("unsupported block type on this page: " + t.slice(0, 60));
    }

    /* divider */
    if (/^---+$/.test(t)) {
      out.push("<hr>");
      i++;
      continue;
    }

    /* heading */
    const h = t.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      /* The page <h1> is the case title, so Notion's own H1 (used on some
         pages as a subtitle) drops to h2 alongside H2. Shifting everything
         down by one instead would leave every page jumping h1 -> h3. */
      const level2 = Math.max(2, h[1].length);
      /* Every Notion heading opens with a decorative emoji. The map has none
         anywhere, and a case page is one click from it, so they are dropped
         rather than left to read as pasted-in. Deleting this line brings
         them all back. */
      const text = h[2].replace(/^(?:[\p{Extended_Pictographic}️‍⃣])+\s*/u, "");
      out.push("<h" + level2 + ">" + inline(text) + "</h" + level2 + ">");
      i++;
      continue;
    }

    /* fenced code */
    if (t.startsWith("```")) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push("<pre><code>" + escapeHtml(buf.join("\n")) + "</code></pre>");
      continue;
    }

    /* table */
    if (t.startsWith("<table")) {
      const buf = [];
      while (i < lines.length && !lines[i].trim().startsWith("</table>")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push(table(buf));
      continue;
    }

    /* video */
    if (t.startsWith("<video")) {
      out.push(loom(t));
      i++;
      continue;
    }

    /* image, alone on its line */
    const img = t.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
    if (img) {
      out.push(image(img[1], captions));
      i++;
      continue;
    }

    /* blockquote, possibly several lines */
    if (t.startsWith(">")) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        buf.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      out.push("<blockquote>" + inline(buf.join("<br>")) + "</blockquote>");
      continue;
    }

    /* to-do */
    if (/^- \[[ x]\]\s/.test(t)) {
      const items = [];
      while (i < lines.length && /^- \[[ x]\]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^- \[[ x]\]\s/, ""));
        i++;
      }
      flushList(items, false, true);
      continue;
    }

    /* bulleted */
    if (/^[-*]\s/.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim()) && !/^- \[[ x]\]/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ""));
        i++;
      }
      flushList(items, false, false);
      continue;
    }

    /* numbered */
    if (/^\d+\.\s/.test(t)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      flushList(items, true, false);
      continue;
    }

    /* paragraph */
    out.push("<p>" + inline(t) + "</p>");
    i++;
  }

  return out.join("\n");
}
