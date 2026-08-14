/* Theme toggle for case study pages.
 *
 * The map's app.js is 26KB of graph rendering that a case page has no use for,
 * so this is the one behaviour worth carrying across: the same localStorage
 * key, so a choice made on the map survives the click into a case and back.
 */
(function () {
  "use strict";

  var btn = document.getElementById("theme-toggle");

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (btn) {
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  function stored() {
    try {
      var v = localStorage.getItem("theme");
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;
    }
  }

  apply(document.documentElement.getAttribute("data-theme") || "dark");

  if (btn) {
    btn.addEventListener("click", function () {
      var next =
        document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) { /* page is already switched */ }
    });
  }

  /* Follow the system only while the visitor has never chosen manually. */
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: light)");
    var onChange = function (e) {
      if (!stored()) apply(e.matches ? "light" : "dark");
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();
