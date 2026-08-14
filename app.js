/* ==========================================================================
   burorichnyi.com - interactive portfolio map
   Plain vanilla JS. No framework, no build step, no dependencies.
   Works from file:// as well as from a server.

   Bands, click-to-detail, hash deep links, related-node highlighting, curved
   SVG connectors, guided tours, light and dark themes, and three responsive
   layouts. Everything except deployment.
   ========================================================================== */

(function () {
  "use strict";

  var DATA = window.PORTFOLIO_DATA;

  var mapEl = document.getElementById("map");
  var panelEl = document.getElementById("panel");

  /* Node keys are "kind:id" because a system and a capability may share an id
     (both "rag"). The URL hash keeps systems on the bare id so that
     burorichnyi.com/#rag opens the RAG Support Knowledge Agent. */
  var nodes = {};        // "kind:id" -> node
  var related = {};      // "kind:id" -> [node keys]
  var pillEls = {};      // "kind:id" -> button element
  var bandOf = {};       // kind -> band definition

  var activeKey = null;
  var suppressScroll = false;

  /* ------------------------------------------------------------- helpers -- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function key(kind, id) {
    return kind + ":" + id;
  }

  function kindClass(kind) {
    return "k-" + kind;
  }

  function labelOf(node) {
    return node.kind === "system" ? node.name : node.label;
  }

  /* "solo" -> "Solo build", anything else -> itself, capitalised, so a team of
     four later reads correctly without touching this file. */
  function teamLabel(team) {
    if (team === "solo") return "Solo build";
    return team.charAt(0).toUpperCase() + team.slice(1);
  }

  /* --------------------------------------------------------- index build -- */

  function buildIndex() {
    DATA.bands.forEach(function (band) {
      bandOf[band.kind] = band;
    });

    DATA.problems.forEach(function (p) {
      nodes[key("problem", p.id)] = {
        kind: "problem",
        id: p.id,
        label: p.label,
        blurb: p.blurb
      };
    });

    DATA.capabilities.forEach(function (c) {
      nodes[key("capability", c.id)] = {
        kind: "capability",
        id: c.id,
        label: c.label,
        blurb: c.blurb
      };
    });

    DATA.systems.forEach(function (s) {
      var node = {};
      Object.keys(s).forEach(function (k) { node[k] = s[k]; });
      node.kind = "system";
      nodes[key("system", s.id)] = node;
    });

    /* Relationships only where they carry meaning:
       problem -> systems that solved it, system -> its capabilities and
       problems, capability -> systems that prove it. No system->system. */
    Object.keys(nodes).forEach(function (k) { related[k] = []; });

    DATA.systems.forEach(function (s) {
      var sk = key("system", s.id);

      (s.problems || []).forEach(function (pid) {
        var pk = key("problem", pid);
        if (!nodes[pk]) return;
        related[sk].push(pk);
        related[pk].push(sk);
      });

      (s.capabilities || []).forEach(function (cid) {
        var ck = key("capability", cid);
        if (!nodes[ck]) return;
        related[sk].push(ck);
        related[ck].push(sk);
      });
    });
  }

  /* ----------------------------------------------------------- hash i/o -- */

  function hashFor(node) {
    if (node.kind === "system") return node.id;
    if (node.kind === "problem") return "p-" + node.id;
    return "c-" + node.id;
  }

  function keyFromHash(raw) {
    var h = String(raw || "").replace(/^#/, "");
    if (!h) return null;

    if (h.indexOf("p-") === 0 && nodes[key("problem", h.slice(2))]) {
      return key("problem", h.slice(2));
    }
    if (h.indexOf("c-") === 0 && nodes[key("capability", h.slice(2))]) {
      return key("capability", h.slice(2));
    }
    /* Systems own the bare id; fall back to the other bands for tolerance. */
    if (nodes[key("system", h)]) return key("system", h);
    if (nodes[key("problem", h)]) return key("problem", h);
    if (nodes[key("capability", h)]) return key("capability", h);
    return null;
  }

  /* --------------------------------------------------------- band render -- */

  function buildPill(node) {
    var pill = el("button", "pill pill--" + node.kind + " " + kindClass(node.kind));
    pill.type = "button";
    pill.setAttribute("aria-pressed", "false");
    pill.dataset.key = key(node.kind, node.id);

    pill.appendChild(el("span", "pill__name", labelOf(node)));

    pill.addEventListener("click", function () {
      var k = pill.dataset.key;
      /* Going off-script means the visitor has stopped following the tour. */
      exitTourSilently();
      suppressScroll = true;
      setHash(k === activeKey ? null : k);
    });

    pillEls[key(node.kind, node.id)] = pill;
    return pill;
  }

  function buildBand(band, items) {
    var section = el("section", "band " + kindClass(band.kind));
    section.setAttribute("aria-label", band.label);

    var header = el("div", "band__header");
    header.appendChild(el("h2", "band__label", band.label));
    header.appendChild(el("span", "band__descriptor", band.descriptor));

    section.appendChild(header);

    var pills = el("div", "band__pills");
    items.forEach(function (item) {
      pills.appendChild(buildPill(nodes[key(band.kind, item.id)]));
    });
    section.appendChild(pills);

    return section;
  }

  function renderMap() {
    var byKind = {
      problem: DATA.problems,
      system: DATA.systems,
      capability: DATA.capabilities
    };

    DATA.bands.forEach(function (band) {
      mapEl.appendChild(buildBand(band, byKind[band.kind]));
    });
  }

  /* -------------------------------------------------------- panel render -- */

  function renderIntro() {
    /* A tour can land on a step that has no node. Intercept before the normal
       "nothing selected" panel takes over. */
    var step = currentStep();
    if (step && step.kind === "contact") return renderTourContact(step);

    panelEl.className = "panel";
    panelEl.replaceChildren();

    panelEl.appendChild(el("p", "panel__kicker", "Start anywhere"));
    /* Counted from the data so adding a case never leaves a stale number here. */
    panelEl.appendChild(
      el(
        "h2",
        "panel__title",
        DATA.systems.length + " systems, and what they were actually for"
      )
    );
    panelEl.appendChild(
      el(
        "p",
        "intro__lede",
        "Click any pill. The panel fills here, related work in the other bands lights up, and the page never navigates away. Everything opens out to the full case study in Notion, and to the code where the code is public."
      )
    );

    var bands = el("ul", "intro__bands");
    DATA.bands.forEach(function (band) {
      var li = el("li", kindClass(band.kind));
      li.appendChild(el("strong", null, band.label));
      li.appendChild(document.createTextNode(band.descriptor));
      bands.appendChild(li);
    });
    panelEl.appendChild(bands);

    panelEl.appendChild(
      el(
        "p",
        "intro__prompt",
        "Not sure where to start? Pick the problem that sounds like your week."
      )
    );
  }

  function connectedSection(node) {
    var links = related[key(node.kind, node.id)];
    if (!links || !links.length) return null;

    var section = el("div", "panel__section");
    section.appendChild(el("p", "panel__section-label", "Connected to"));

    var chips = el("div", "chips");
    links.forEach(function (k) {
      var target = nodes[k];
      var chip = el("button", "chip chip--link " + kindClass(target.kind), labelOf(target));
      chip.type = "button";
      chip.addEventListener("click", function () {
        suppressScroll = false;
        setHash(k);
      });
      chips.appendChild(chip);
    });

    section.appendChild(chips);
    return section;
  }

  function renderNode(node) {
    panelEl.className = "panel " + kindClass(node.kind);
    panelEl.replaceChildren();

    /* Only visible below 1100px, where the panel is a sheet or a full-screen
       view and needs its own way out. CSS decides; the markup is always here so
       the button exists to receive focus the moment the sheet opens. */
    var back = el("button", "panel__back", "←  Back to the map");
    back.type = "button";
    back.addEventListener("click", function () {
      exitTour();
      suppressScroll = true;
      setHash(null);
    });
    panelEl.appendChild(back);

    /* Tour chrome wraps the normal detail rather than replacing it, so a step
       still shows the full case: hook, result, stack, links. */
    var step = currentStep();
    var onStep = step && stepKey(step) === key(node.kind, node.id);
    if (onStep) {
      /* Bar and controls both sit at the top. Next used to be under the whole
         case detail, where it was below the fold and the tour read as a dead
         end. */
      panelEl.appendChild(tourBar());
      panelEl.appendChild(tourNav());
    }

    panelEl.appendChild(el("p", "panel__kicker", bandOf[node.kind].label));
    panelEl.appendChild(el("h2", "panel__title", labelOf(node)));

    /* Team attribution stays: it is about who did the work, not about how the
       engagement came about. A shared build is never presented as solo, and it
       names the role owned, so "team of 3" reads as a credential rather than as
       a third of the credit. Both strings come from the data, so a future team
       size or role cannot leave a stale label here. */
    if (node.kind === "system" && node.team) {
      var meta = el("div", "panel__meta");
      meta.appendChild(el("span", null, teamLabel(node.team)));
      if (node.role) {
        meta.appendChild(el("span", "dot", "·"));
        meta.appendChild(el("span", null, node.role));
      }
      panelEl.appendChild(meta);
    }

    if (onStep) panelEl.appendChild(el("p", "tour-say", step.say));

    panelEl.appendChild(el("p", "panel__hook", node.kind === "system" ? node.hook : node.blurb));

    if (node.kind === "system" && node.result) {
      var result = el("div", "panel__result");
      result.appendChild(el("span", "panel__result-label", "Result"));
      result.appendChild(el("span", "panel__result-text", node.result));
      panelEl.appendChild(result);
    }

    if (node.kind === "system" && node.stack && node.stack.length) {
      var stack = el("div", "panel__section");
      stack.appendChild(el("p", "panel__section-label", "Stack"));
      var chips = el("div", "chips");
      node.stack.forEach(function (item) {
        chips.appendChild(el("span", "chip", item));
      });
      stack.appendChild(chips);
      panelEl.appendChild(stack);
    }

    var connected = connectedSection(node);
    if (connected) panelEl.appendChild(connected);

    if (node.kind === "system") {
      var actions = el("div", "panel__actions");

      /* A case is read on this site once its page has been generated from
         Notion, and on Notion until then. Rolling out one page at a time
         means the two states have to coexist, so the list drives the link
         rather than a flag day. */
      var built = (DATA.casePages || []).indexOf(node.id) !== -1;

      if (built) {
        var pageLink = el("a", "btn btn--primary", "Full case study →");
        pageLink.href = "cases/" + node.id + ".html";
        actions.appendChild(pageLink);
      } else if (node.notion) {
        var caseLink = el("a", "btn btn--primary", "Full case study →");
        caseLink.href = node.notion;
        caseLink.target = "_blank";
        caseLink.rel = "noopener";
        actions.appendChild(caseLink);
      }

      /* No dead buttons: the Code button only exists when there is a repo. */
      if (node.github) {
        var codeLink = el("a", "btn", "Code →");
        codeLink.href = node.github;
        codeLink.target = "_blank";
        codeLink.rel = "noopener";
        actions.appendChild(codeLink);
      }

      if (actions.childNodes.length) panelEl.appendChild(actions);
    }

    if (!onStep) {
      var clear = el("button", "panel__clear", "Clear selection");
      clear.type = "button";
      clear.addEventListener("click", function () {
        suppressScroll = true;
        setHash(null);
      });
      panelEl.appendChild(clear);
    }

    panelEl.scrollTop = 0;
  }

  /* ----------------------------------------------------------------- tours -- */

  /* A tour is a fixed sequence of steps. Each step drives the same hash the map
     already uses, so highlighting, connectors and deep links keep working with
     no special cases; the tour only adds chrome on top of the normal panel.
     Clicking any pill leaves the tour, because at that point the visitor has
     stopped following it. */

  var tourState = null; // { tour: <tour object>, i: <step index> }

  function currentStep() {
    return tourState ? tourState.tour.steps[tourState.i] : null;
  }

  function stepKey(step) {
    return step && step.kind !== "contact" ? key(step.kind, step.id) : null;
  }

  function renderTourButtons() {
    var host = document.getElementById("tours");
    if (!host || !DATA.tours) return;

    DATA.tours.forEach(function (tour) {
      var btn = el("button", "tour-btn", tour.label);
      btn.type = "button";
      btn.dataset.tour = tour.id;
      btn.title = tour.forWhom;
      btn.addEventListener("click", function () {
        if (tourState && tourState.tour.id === tour.id) exitTour();
        else startTour(tour);
      });
      host.appendChild(btn);
    });
  }

  function syncTourButtons() {
    var buttons = document.querySelectorAll(".tour-btn");
    Array.prototype.forEach.call(buttons, function (btn) {
      var on = !!tourState && btn.dataset.tour === tourState.tour.id;
      btn.classList.toggle("is-running", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function startTour(tour) {
    tourState = { tour: tour, i: 0 };
    syncTourButtons();
    goToStep(0);
  }

  function exitTour() {
    var wasOn = !!tourState;
    tourState = null;
    syncTourButtons();
    if (wasOn) {
      suppressScroll = true;
      setHash(null);
    }
  }

  /* Drop the tour without also clearing the selection: used when the visitor
     clicks a pill, where the click itself is already choosing what to show. */
  function exitTourSilently() {
    if (!tourState) return;
    tourState = null;
    syncTourButtons();
  }

  function goToStep(i) {
    if (!tourState) return;
    var steps = tourState.tour.steps;
    if (i < 0 || i >= steps.length) return;

    tourState.i = i;
    var k = stepKey(steps[i]);

    /* setHash re-renders through the normal path. If the hash is already what
       we want, it re-selects rather than silently doing nothing. */
    suppressScroll = false;
    setHash(k);
  }

  /* Chrome shared by every tour step, node or contact. */
  function tourBar() {
    var bar = el("div", "tour-bar");
    bar.appendChild(el("span", "tour-bar__name", tourState.tour.label));
    bar.appendChild(
      el(
        "span",
        "tour-bar__count",
        "Step " + (tourState.i + 1) + " of " + tourState.tour.steps.length
      )
    );
    return bar;
  }

  function tourNav() {
    var nav = el("div", "tour-nav");
    var last = tourState.i === tourState.tour.steps.length - 1;

    var back = el("button", "btn", "Back");
    back.type = "button";
    if (tourState.i === 0) back.disabled = true;
    back.addEventListener("click", function () { goToStep(tourState.i - 1); });
    nav.appendChild(back);

    if (!last) {
      var next = el("button", "btn btn--primary", "Next →");
      next.type = "button";
      next.addEventListener("click", function () { goToStep(tourState.i + 1); });
      nav.appendChild(next);
    }

    nav.appendChild(el("span", "tour-nav__spacer"));

    var exit = el("button", "panel__clear", last ? "Finish" : "Exit tour");
    exit.type = "button";
    exit.addEventListener("click", exitTour);
    nav.appendChild(exit);

    return nav;
  }

  /* The one step that is not a node: the hiring tour's closing card. */
  function renderTourContact(step) {
    panelEl.className = "panel k-system";
    panelEl.replaceChildren();

    panelEl.appendChild(tourBar());
    panelEl.appendChild(tourNav());
    panelEl.appendChild(el("h2", "panel__title", "Where to find me"));
    panelEl.appendChild(el("p", "tour-say", step.say));

    var meta = DATA.meta || {};
    var section = el("div", "panel__section");
    section.appendChild(el("p", "panel__section-label", "Contact"));

    var chips = el("div", "chips");
    [
      [meta.email, "mailto:" + meta.email, meta.email],
      [meta.linkedin, meta.linkedin, "LinkedIn"],
      [meta.github, meta.github, "GitHub"]
    ].forEach(function (row) {
      if (!row[0]) return;
      var a = el("a", "chip chip--link k-system", row[2]);
      a.href = row[1];
      if (row[1].indexOf("mailto:") !== 0) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      chips.appendChild(a);
    });

    section.appendChild(chips);
    panelEl.appendChild(section);
    panelEl.scrollTop = 0;
  }

  /* ------------------------------------------------------------ connectors -- */

  /* Curved paths from the active pill to its related pills. Coordinates are
     relative to the map, not the viewport, so scrolling needs no redraw. Only
     the meaningful directions exist in `related`, so there is nothing to filter
     here: no system draws to another system.

     No cap. The spec suggested about 8, but exactly one node exceeds it
     (Structured output, at 9) and there is no strength value in the data to
     rank by, so any subset would be arbitrary. Arbitrary is worse than nine. */

  var SVG_NS = "http://www.w3.org/2000/svg";
  var connectorLayer = null;

  function buildConnectorLayer() {
    connectorLayer = document.createElementNS(SVG_NS, "svg");
    connectorLayer.setAttribute("class", "connectors");
    connectorLayer.setAttribute("aria-hidden", "true");
    connectorLayer.setAttribute("focusable", "false");
    mapEl.appendChild(connectorLayer);
  }

  function connectorsHidden() {
    return (
      !connectorLayer ||
      (window.matchMedia && window.matchMedia("(max-width: 767px)").matches)
    );
  }

  function anchor(rect, mapRect, edge) {
    return {
      x: rect.left - mapRect.left + rect.width / 2,
      y: edge === "top" ? rect.top - mapRect.top : rect.bottom - mapRect.top
    };
  }

  function drawConnectors(k) {
    if (!connectorLayer) return;
    connectorLayer.replaceChildren();

    if (!k || connectorsHidden()) return;

    var fromPill = pillEls[k];
    var links = related[k] || [];
    if (!fromPill || !links.length) return;

    var mapRect = mapEl.getBoundingClientRect();
    var fromRect = fromPill.getBoundingClientRect();

    var reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    links.forEach(function (rk) {
      var toPill = pillEls[rk];
      if (!toPill || toPill.offsetParent === null) return;

      var toRect = toPill.getBoundingClientRect();
      var downwards = toRect.top >= fromRect.top;

      var a = anchor(fromRect, mapRect, downwards ? "bottom" : "top");
      var b = anchor(toRect, mapRect, downwards ? "top" : "bottom");

      /* Pull the control points vertically so the curve travels through the gap
         between bands instead of cutting straight across the pills. */
      var lift = Math.max(18, Math.abs(b.y - a.y) * 0.45);
      var c1 = a.y + (downwards ? lift : -lift);
      var c2 = b.y - (downwards ? lift : -lift);

      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute(
        "d",
        "M " + a.x + " " + a.y +
        " C " + a.x + " " + c1 + ", " + b.x + " " + c2 + ", " + b.x + " " + b.y
      );
      /* Coloured by the node it points at, so a line into the problems band
         reads violet and a line into capabilities reads green. */
      path.setAttribute("class", "connector " + kindClass(nodes[rk].kind));

      connectorLayer.appendChild(path);

      if (!reduced) {
        var len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        /* Force a reflow so the transition has a start value to animate from. */
        void path.getBoundingClientRect();
        path.style.transition = "stroke-dashoffset 460ms var(--ease)";
        path.style.strokeDashoffset = "0";
      }
    });
  }

  /* ------------------------------------------------------------ selection -- */

  function applyHighlight(k) {
    var relatedSet = {};
    if (k) (related[k] || []).forEach(function (r) { relatedSet[r] = true; });

    Object.keys(pillEls).forEach(function (pk) {
      var pill = pillEls[pk];
      var isActive = k != null && pk === k;
      var isRelated = relatedSet[pk] === true;

      pill.classList.toggle("is-active", isActive);
      pill.classList.toggle("is-related", isRelated);
      pill.classList.toggle("is-dimmed", k != null && !isActive && !isRelated);
      pill.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  /* Below 1100px the panel stops being a column beside the map and becomes a
     sheet over it, so the layout has to know whether anything is selected. */
  function isNarrow() {
    return window.matchMedia && window.matchMedia("(max-width: 1099px)").matches;
  }

  function select(k) {
    var selected = !!(k && nodes[k]);
    var opening = selected && !activeKey;

    activeKey = k;
    applyHighlight(k);
    document.body.classList.toggle("has-selection", selected);
    drawConnectors(k);

    if (selected) {
      renderNode(nodes[k]);

      /* Moving focus into the sheet is what makes the back button reachable
         without hunting for it, and it is where a screen reader should land.
         Only on the narrow layouts, and only when the sheet is newly opening,
         so stepping between related chips does not yank focus each time. */
      if (opening && isNarrow()) {
        var back = panelEl.querySelector(".panel__back");
        if (back) back.focus({ preventScroll: true });
      } else if (!suppressScroll && pillEls[k]) {
        pillEls[k].scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    } else {
      renderIntro();
    }

    suppressScroll = false;
  }

  /* Hash is the single source of truth, so deep links, clicks and the browser
     back/forward buttons all go through exactly one code path. */
  function setHash(k) {
    var next = k && nodes[k] ? "#" + hashFor(nodes[k]) : "";

    if (!next) {
      if (!location.hash || location.hash === "#") {
        select(null);
        return;
      }
      location.hash = "";
      return;
    }

    if (location.hash === next) {
      select(k);
      return;
    }
    location.hash = next;
  }

  function onHashChange() {
    select(keyFromHash(location.hash));
  }

  /* -------------------------------------------------------------- footer -- */

  function wireFooter() {
    var meta = DATA.meta || {};
    var email = document.getElementById("footer-email");
    var linkedin = document.getElementById("footer-linkedin");
    var github = document.getElementById("footer-github");

    if (email && meta.email) {
      email.href = "mailto:" + meta.email;
      email.textContent = meta.email;
    }
    if (linkedin && meta.linkedin) linkedin.href = meta.linkedin;
    if (github && meta.github) github.href = meta.github;
  }

  /* --------------------------------------------------------------- theme -- */

  /* The inline script in <head> has already set data-theme before first paint.
     This only handles switching it afterwards. localStorage is wrapped because
     it throws on file:// in some browsers, and a failed write must never stop
     the theme from changing for the current page view. */

  function storedTheme() {
    try {
      var v = localStorage.getItem("theme");
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  function wireTheme() {
    var btn = document.getElementById("theme-toggle");
    applyTheme(document.documentElement.getAttribute("data-theme") || "dark");

    if (btn) {
      btn.addEventListener("click", function () {
        var next =
          document.documentElement.getAttribute("data-theme") === "dark"
            ? "light"
            : "dark";
        applyTheme(next);
        try {
          localStorage.setItem("theme", next);
        } catch (e) { /* nothing to do; the page is already switched */ }
      });
    }

    /* Follow the system if the visitor has never chosen manually. */
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: light)");
      var onChange = function (e) {
        if (!storedTheme()) applyTheme(e.matches ? "light" : "dark");
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ---------------------------------------------------------------- init -- */

  function init() {
    if (!DATA || !mapEl || !panelEl) return;

    buildIndex();
    renderMap();
    buildConnectorLayer();
    renderTourButtons();
    wireFooter();
    wireTheme();

    /* Pills rewrap as the window changes, so the geometry has to be recomputed.
       Debounced because resize fires continuously while dragging. */
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        drawConnectors(activeKey);
      }, 120);
    });

    /* The avatar is a second, always-visible way out of a selection, next to
       the panel's own Clear button and Escape. */
    var home = document.getElementById("clear-home");
    if (home) {
      home.addEventListener("click", function () {
        suppressScroll = true;
        setHash(null);
      });
    }

    window.addEventListener("hashchange", onHashChange);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && (activeKey || tourState)) {
        exitTour();
        suppressScroll = true;
        setHash(null);
        return;
      }

      /* Arrow keys step a running tour. */
      if (!tourState) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToStep(tourState.i + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToStep(tourState.i - 1);
      }
    });

    onHashChange();
  }

  init();
})();
