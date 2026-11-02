/* =========================================================
   PORTFOLIO — script.js
   1. Theme (light / dark)
   2. Scroll reveal + animated counters
   3. Charts (Chart.js) — built when scrolled into view
   4. Project tabs (Chart / Dashboard / Data)
   5. Nav: active link, progress bar, mobile menu
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. THEME ---------- */
  var themeButtons = document.querySelectorAll('[data-theme-toggle]');

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark');
      var label = btn.querySelector('.theme-label');
      var icon = btn.querySelector('.theme-icon');
      if (label) label.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
      if (icon) icon.innerHTML = theme === 'dark' ? '&#9788;' : '&#9790;';
    });
    // charts read their colors from CSS variables, so rebuild them
    Object.keys(charts).forEach(function (key) {
      if (charts[key].instance) buildChart(key);
    });
  }

  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next);
      try { localStorage.setItem('portfolio-theme', next); } catch (e) {}
    });
  });

  /* ---------- 2. REVEAL + COUNTERS ---------- */
  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var fmt = function (n) { return prefix + n.toFixed(decimals) + suffix; };

    if (reduceMotion) { el.textContent = fmt(target); return; }

    var duration = 1200;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll('[data-count]');
  counters.forEach(function (el) {
    // start at zero so the count-up is visible (final value stays in HTML for no-JS)
    if (!reduceMotion) {
      el.textContent = (el.dataset.prefix || '') + (0).toFixed(parseInt(el.dataset.decimals || '0', 10)) + (el.dataset.suffix || '');
    }
  });

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        entry.target.querySelectorAll('[data-count]').forEach(runCounter);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });
  } else {
    // very old browsers: just show everything
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    counters.forEach(runCounter);
  }

  /* ---------- 3. CHARTS ---------- */
  /*
    HOW TO EDIT A CHART:
    Find the chart key below (reporting / churn / market) and change the
    labels + data arrays. The numbers here are SAMPLE DATA — replace them
    with your own real results before sharing the site.
    Colors come from CSS variables (--series-1, --series-2) so they follow
    light/dark mode automatically.
  */
  var charts = {};   // key -> { canvas, instance }

  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  function themeColors() {
    return {
      s1: cssVar('--series-1'),
      s2: cssVar('--series-2'),
      surface: cssVar('--surface-2'),
      ink: cssVar('--ink'),
      soft: cssVar('--ink-soft'),
      muted: cssVar('--muted'),
      line: cssVar('--line')
    };
  }

  function axes(c, opts) {
    opts = opts || {};
    return {
      x: {
        ticks: { color: c.muted },
        grid: { display: !!opts.gridX, color: c.line },
        border: { color: c.line },
        beginAtZero: true
      },
      y: {
        ticks: { color: c.muted },
        grid: { display: !opts.noGridY, color: c.line },
        border: { display: false },
        beginAtZero: true
      }
    };
  }

  function baseOptions(c) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion ? false : { duration: 1100, easing: 'easeOutQuart' },
      layout: { padding: { top: 4 } },
      plugins: {
        legend: {
          display: false,
          labels: { color: c.soft, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, boxHeight: 10, font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: c.ink,
          titleColor: c.surface,
          bodyColor: c.surface,
          padding: 10,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4
        }
      }
    };
  }

  var chartBuilders = {
    /* Project 1 — grouped bars, 2 series (legend shown) */
    reporting: function (c) {
      var o = baseOptions(c);
      o.plugins.legend.display = true;
      o.scales = axes(c);
      o.scales.y.title = { display: true, text: 'Hours per week', color: c.muted };
      return {
        type: 'bar',
        data: {
          labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
          datasets: [
            { label: 'Manual process', data: [5, 5.2, 4.8, 5.1, 5, 4.9], backgroundColor: c.s2, borderColor: c.surface, borderWidth: 2, borderRadius: 4, maxBarThickness: 22 },
            { label: 'Automated dashboard', data: [2.5, 1.9, 1.6, 1.5, 1.4, 1.4], backgroundColor: c.s1, borderColor: c.surface, borderWidth: 2, borderRadius: 4, maxBarThickness: 22 }
          ]
        },
        options: o
      };
    },

    /* Project 2 — horizontal bars, 1 series (single hue, no legend) */
    churn: function (c) {
      var o = baseOptions(c);
      o.indexAxis = 'y';
      o.scales = axes(c, { gridX: true, noGridY: true });
      o.scales.x.title = { display: true, text: 'Feature importance (%)', color: c.muted };
      o.scales.x.grid.display = true;
      o.scales.y.beginAtZero = false;
      return {
        type: 'bar',
        data: {
          labels: ['Contract type', 'Tenure', 'Monthly charges', 'Support calls', 'Payment method'],
          datasets: [{ label: 'Feature importance (%)', data: [31, 26, 19, 14, 10], backgroundColor: c.s1, borderRadius: 4, maxBarThickness: 22 }]
        },
        options: o
      };
    },

    /* Project 3 — line, 1 series (2px line, 8px markers with surface ring) */
    market: function (c) {
      var o = baseOptions(c);
      o.scales = axes(c);
      o.scales.y.title = { display: true, text: 'Market size (USD M)', color: c.muted };
      return {
        type: 'line',
        data: {
          labels: ['2024', '2025', '2026', '2027', '2028'],
          datasets: [{
            label: 'Serviceable market (USD M)',
            data: [1.2, 1.8, 2.6, 3.7, 5.1],
            borderColor: c.s1,
            backgroundColor: c.s1 + '22',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: c.s1,
            pointBorderColor: c.surface,
            pointBorderWidth: 2
          }]
        },
        options: o
      };
    }
  };

  function buildChart(key) {
    var holder = charts[key];
    if (!holder || !window.Chart) return;
    if (holder.instance) holder.instance.destroy();
    Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";
    holder.instance = new Chart(holder.canvas, chartBuilders[key](themeColors()));
  }

  document.querySelectorAll('canvas[data-chart]').forEach(function (canvas) {
    var key = canvas.dataset.chart;
    if (!chartBuilders[key]) return;
    charts[key] = { canvas: canvas, instance: null };
  });

  // build each chart the first time it scrolls into view, so the animation plays when seen
  if ('IntersectionObserver' in window && window.Chart) {
    var chartObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var canvas = entry.target.querySelector('canvas[data-chart]');
        if (canvas) buildChart(canvas.dataset.chart);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('.chart-wrap').forEach(function (el) { chartObserver.observe(el); });
  } else if (window.Chart) {
    Object.keys(charts).forEach(buildChart);
  }

  /* ---------- 4. PROJECT TABS ---------- */
  document.querySelectorAll('.viz-tabs').forEach(function (tabs) {
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.viz-tab');
      if (!btn) return;
      var visual = btn.closest('.project-visual');

      visual.querySelectorAll('.viz-tab').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      visual.querySelectorAll('.viz-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === btn.dataset.target);
      });

      // replay the chart animation when its tab is shown again
      var canvas = visual.querySelector('canvas[data-chart]');
      if (canvas && canvas.closest('.viz-panel').id === btn.dataset.target) {
        var holder = charts[canvas.dataset.chart];
        if (holder && holder.instance) {
          holder.instance.resize();
          if (!reduceMotion) { holder.instance.reset(); holder.instance.update(); }
        } else if (holder) {
          buildChart(canvas.dataset.chart);
        }
      }
    });
  });

  /* ---------- 5. NAV ---------- */
  var navLinks = document.querySelectorAll('.sb-nav a');
  var sections = document.querySelectorAll('main .section[id]');

  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  // scroll progress bar
  var progress = document.getElementById('progress');
  var ticking = false;
  function updateProgress() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? window.scrollY / h : 0;
    if (progress) progress.style.transform = 'scaleX(' + Math.min(Math.max(p, 0), 1) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
  }, { passive: true });
  updateProgress();

  // mobile menu
  var menuBtn = document.getElementById('menuBtn');
  var scrim = document.getElementById('scrim');

  function setMenu(open) {
    document.body.classList.toggle('nav-open', open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.innerHTML = open ? '&#10005;' : '&#9776;';
    }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!document.body.classList.contains('nav-open')); });
  if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
  navLinks.forEach(function (l) { l.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // footer year
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // sync button labels with the theme the head script already applied
  setTheme(root.getAttribute('data-theme') || 'light');
})();
