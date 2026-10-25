/*
 * Paper theme behaviour (site-local).
 *  - Contents column: built from h2 headings, follows the scroll with a springy navy marker
 *  - Study page: tabs and subject list with sliding markers
 *  - Research notes: show one project's notes, grouped by month
 *  - Research cards: preview videos play on hover
 */
(function () {
  "use strict";

  var NAV_OFFSET = 96; // px below the top of the viewport that counts as "current"

  function relTop(el, container) {
    return el.getBoundingClientRect().top - container.getBoundingClientRect().top;
  }

  function relLeft(el, container) {
    return el.getBoundingClientRect().left - container.getBoundingClientRect().left;
  }

  // Place an absolutely positioned marker over `el`, optionally without animating.
  function placeMarker(marker, container, el, axis, instant) {
    if (!marker) return;
    if (!el) {
      marker.style.opacity = "0";
      return;
    }
    if (instant) marker.style.transition = "none";
    marker.style.opacity = "1";
    if (axis === "x") {
      marker.style.width = el.offsetWidth + "px";
      marker.style.transform = "translateX(" + relLeft(el, container) + "px)";
    } else {
      marker.style.height = el.offsetHeight + "px";
      marker.style.transform = "translateY(" + relTop(el, container) + "px)";
    }
    if (instant) {
      void marker.offsetWidth; // apply the jump before turning the animation back on
      marker.style.transition = "";
    }
  }

  function makeMarker(container, className) {
    var marker = document.createElement("span");
    marker.className = className;
    marker.setAttribute("aria-hidden", "true");
    container.appendChild(marker);
    return marker;
  }

  /* ------------------------------------------------------- research notes */

  function setupResearchNotes() {
    var box = document.querySelector("[data-research-notes]");
    if (!box) return;
    var list = box.querySelector("[data-notes-list]");
    var project = new URLSearchParams(window.location.search).get("research");
    var entries = Array.prototype.slice.call(box.querySelectorAll(".rn-entry"));
    var visible = entries.filter(function (e) {
      var keep = !project || e.getAttribute("data-project") === project;
      if (!keep) e.remove();
      return keep;
    });

    if (visible.length && project) {
      var back = box.querySelector("[data-notes-back]");
      var title = visible[0].getAttribute("data-project-title");
      var url = visible[0].getAttribute("data-project-url");
      if (back && title && url) {
        back.href = url;
        back.textContent = "← " + title;
      }
    }

    if (!visible.length) {
      var empty = document.createElement("p");
      empty.className = "empty-note";
      empty.textContent = "아직 노트가 없어요.";
      list.appendChild(empty);
      return;
    }

    // Month headings, e.g. "2026년 10월"
    var lastMonth = null;
    visible.forEach(function (e) {
      var month = e.getAttribute("data-month");
      if (month === lastMonth) return;
      lastMonth = month;
      var parts = month.split(".");
      var h = document.createElement("h2");
      h.className = "rn-month";
      h.id = "m-" + month.replace(".", "-");
      h.textContent = parts[0] + "년 " + parseInt(parts[1], 10) + "월";
      e.parentNode.insertBefore(h, e);
    });
  }

  /* ------------------------------------------------------- contents column */

  function setupToc(toc) {
    var root = document.querySelector(toc.getAttribute("data-root") || "[data-toc-root]");
    if (!root) return;
    var heads = Array.prototype.slice.call(root.querySelectorAll("h2"));
    if (!heads.length) return;

    var list = toc.querySelector(".paper-toc-list");
    var links = heads.map(function (h, i) {
      if (!h.id) h.id = "section-" + (i + 1);
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      list.appendChild(a);
      return a;
    });
    toc.hidden = false;
    var marker = makeMarker(list, "paper-toc-marker");

    var current = -1;
    function update(instant) {
      var idx = 0;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top - NAV_OFFSET <= 1) idx = i;
      }
      // At the very bottom, the last section is the current one.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) idx = heads.length - 1;
      if (idx === current && !instant) return;
      current = idx;
      links.forEach(function (a, i) {
        a.classList.toggle("active", i === idx);
      });
      placeMarker(marker, list, links[idx], "y", instant);
    }

    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          update(false);
        });
      },
      { passive: true }
    );
    window.addEventListener("resize", function () {
      update(true);
    });
    update(true);
  }

  /* ------------------------------------------------------------ study page */

  function setupStudy() {
    var box = document.querySelector("[data-study-browser]");
    var dataEl = document.getElementById("study-data");
    if (!box || !dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var tabs = data.tabs || [];
    var posts = data.posts || [];

    var tabBar = box.querySelector(".study-tabs");
    var tabMarker = box.querySelector(".study-tab-indicator");
    var side = box.querySelector(".study-subjects");
    var subjectMarker = box.querySelector(".study-subject-indicator");
    var groupsEl = box.querySelector("[data-study-groups]");
    var groupLabel = box.querySelector("[data-study-group-label]");
    var subjectLabel = box.querySelector("[data-study-subject-label]");
    var postsEl = box.querySelector("[data-study-posts]");

    function firstSubject(tab) {
      for (var g = 0; g < tab.groups.length; g++) {
        if (tab.groups[g].subjects && tab.groups[g].subjects.length) return tab.groups[g].subjects[0];
      }
      return null;
    }

    function findTab(id) {
      for (var i = 0; i < tabs.length; i++) if (tabs[i].id === id) return tabs[i];
      return null;
    }

    // Hash: #<tab> or #<tab>/<subject>. "#review" from the home page also works.
    function readHash() {
      var raw = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      var parts = raw.split("/");
      var tab = findTab(parts[0]);
      if (!tab) {
        // also accept a bare group id such as "review" or "basic"
        for (var i = 0; i < tabs.length && !tab; i++) {
          for (var g = 0; g < tabs[i].groups.length; g++) {
            if (tabs[i].groups[g].id === parts[0]) tab = tabs[i];
          }
        }
      }
      tab = tab || tabs[0];
      var subject = parts[1] || null;
      return { tab: tab, subject: subject };
    }

    var state = readHash();
    if (!state.subject) state.subject = firstSubject(state.tab);

    function render(instant) {
      var tab = state.tab;

      // tabs
      var activeBtn = null;
      Array.prototype.forEach.call(tabBar.querySelectorAll(".study-tab"), function (btn) {
        var on = btn.getAttribute("data-tab") === tab.id;
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
        if (on) activeBtn = btn;
      });
      placeMarker(tabMarker, tabBar, activeBtn, "x", instant);

      // subject list
      groupsEl.innerHTML = "";
      var activeSubjectBtn = null;
      var activeGroup = null;
      tab.groups.forEach(function (group) {
        var wrap = document.createElement("div");
        wrap.className = "study-group";
        if (group.title) {
          var h = document.createElement("h2");
          h.className = "study-group-title";
          h.textContent = group.title;
          wrap.appendChild(h);
        }
        (group.subjects || []).forEach(function (subject) {
          var count = posts.filter(function (p) {
            return p.section === group.id && p.subject === subject;
          }).length;
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "study-subject";
          btn.textContent = subject;
          if (count) {
            var c = document.createElement("span");
            c.className = "study-count";
            c.textContent = count;
            btn.appendChild(c);
          }
          var on = subject === state.subject;
          btn.classList.toggle("active", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
          if (on) {
            activeSubjectBtn = btn;
            activeGroup = group;
          }
          btn.addEventListener("click", function () {
            state.subject = subject;
            history.replaceState(null, "", "#" + tab.id + "/" + encodeURIComponent(subject));
            render(false);
          });
          wrap.appendChild(btn);
        });
        groupsEl.appendChild(wrap);
      });

      // A subject from an old link that no longer exists: fall back to the first one.
      if (!activeSubjectBtn) {
        state.subject = firstSubject(tab);
        return render(true);
      }

      // Keep the marker's slide when the subject list was rebuilt for the same tab.
      placeMarker(subjectMarker, side, activeSubjectBtn, "y", instant);

      // posts
      groupLabel.textContent = activeGroup.title || tab.label;
      subjectLabel.textContent = state.subject;
      var list = posts.filter(function (p) {
        return p.section === activeGroup.id && p.subject === state.subject;
      });
      postsEl.innerHTML = "";
      if (!list.length) {
        var empty = document.createElement("p");
        empty.className = "empty-note";
        empty.textContent = "아직 글이 없어요.";
        postsEl.appendChild(empty);
      }
      list.forEach(function (p) {
        var a = document.createElement("a");
        a.className = "study-row";
        a.href = p.url;
        var t = document.createElement("span");
        t.className = "study-row-title";
        t.textContent = p.title;
        var d = document.createElement("span");
        d.className = "paper-label";
        d.textContent = p.date;
        a.appendChild(t);
        a.appendChild(d);
        postsEl.appendChild(a);
      });
    }

    Array.prototype.forEach.call(tabBar.querySelectorAll(".study-tab"), function (btn) {
      btn.addEventListener("click", function () {
        var tab = findTab(btn.getAttribute("data-tab"));
        if (!tab || tab === state.tab) return;
        state.tab = tab;
        state.subject = firstSubject(tab);
        history.replaceState(null, "", "#" + tab.id);
        render(false);
      });
    });

    window.addEventListener("resize", function () {
      render(true);
    });
    render(true);
    // Fonts change text widths; re-measure once they are in.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        render(true);
      });
    }
  }

  /* ---------------------------------------------------- card video preview */

  function setupHoverVideos() {
    Array.prototype.forEach.call(document.querySelectorAll("video[data-hover-play]"), function (v) {
      var card = v.closest("a") || v;
      card.addEventListener("mouseenter", function () {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      });
      card.addEventListener("mouseleave", function () {
        v.pause();
      });
    });
  }

  function init() {
    setupResearchNotes();
    Array.prototype.forEach.call(document.querySelectorAll("[data-paper-toc]"), setupToc);
    setupStudy();
    setupHoverVideos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
