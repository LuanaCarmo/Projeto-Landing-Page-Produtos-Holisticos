/* Raiz & Lua — interações do site */
(function () {
  'use strict';

  var CART_KEY = 'raizelua:sacola';

  // ---------- Sacola (guardada no navegador) ----------
  function readCart() {
    try {
      var n = parseInt(localStorage.getItem(CART_KEY), 10);
      return isNaN(n) ? 0 : n;
    } catch (e) {
      return 0;
    }
  }

  function writeCart(n) {
    try { localStorage.setItem(CART_KEY, String(n)); } catch (e) { /* sem armazenamento: segue só na página */ }
  }

  var cartCount = readCart();

  function renderCart(bump) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = cartCount;
    });
    document.querySelectorAll('.bag-btn').forEach(function (btn) {
      btn.setAttribute('aria-label', 'Sacola, ' + cartCount + (cartCount === 1 ? ' item' : ' itens'));
      if (bump) {
        btn.classList.remove('bump');
        void btn.offsetWidth;
        btn.classList.add('bump');
      }
    });
  }

  function addToCart(qty, name) {
    cartCount += qty;
    writeCart(cartCount);
    renderCart(true);
    toast((name ? name + ' foi adicionado' : 'Produto adicionado') + ' à sacola');
  }

  // ---------- Aviso rápido ----------
  var toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  var toastTimer;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  renderCart(false);

  // Botões "Adicionar à sacola" dos cards
  document.querySelectorAll('.add-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.card');
      var title = card ? card.querySelector('h3') : null;
      addToCart(1, title ? title.textContent.trim() : '');
      btn.classList.add('added');
      btn.textContent = 'Adicionado';
      setTimeout(function () {
        btn.classList.remove('added');
        btn.textContent = 'Adicionar à sacola';
      }, 1800);
    });
  });

  document.querySelectorAll('.bag-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      toast(cartCount === 0 ? 'Sua sacola está vazia' : 'Você tem ' + cartCount + (cartCount === 1 ? ' item' : ' itens') + ' na sacola');
    });
  });

  // ---------- Menu mobile ----------
  var menu = document.getElementById('menu-mobile');
  var openBtn = document.querySelector('.menu-toggle');
  if (menu && openBtn) {
    var closeBtn = menu.querySelector('[data-close-menu]');
    function setMenu(open) {
      menu.classList.toggle('open', open);
      openBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) closeBtn.focus(); else openBtn.focus();
    }
    openBtn.addEventListener('click', function () { setMenu(true); });
    closeBtn.addEventListener('click', function () { setMenu(false); });
    menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // ---------- Newsletter ----------
  document.querySelectorAll('[data-newsletter]').forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var msg = form.querySelector('.form-msg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      msg.className = 'form-msg ' + (ok ? 'ok' : 'err');
      msg.textContent = ok ? 'Pronto! Você vai receber o próximo calendário lunar.' : 'Confira o e-mail digitado.';
      if (ok) form.reset();
    });
  });

  // ---------- Página de categoria: filtros ----------
  var grid = document.querySelector('[data-product-grid]');
  if (grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
    var chips = document.querySelectorAll('[data-intent-chip]');
    var formats = document.querySelectorAll('[data-format]');
    var countEl = document.querySelector('[data-count]');
    var emptyEl = document.querySelector('[data-empty]');
    var sortEl = document.getElementById('ordenar');
    var intent = 'Todas';

    cards.forEach(function (c, i) { c.dataset.order = i; });

    function applyFilters() {
      var chosenFormats = Array.prototype.filter.call(formats, function (f) { return f.checked; })
        .map(function (f) { return f.value; });
      var visible = 0;
      cards.forEach(function (c) {
        var show = (intent === 'Todas' || c.dataset.intent === intent) &&
          (chosenFormats.length === 0 || chosenFormats.indexOf(c.dataset.format) !== -1);
        c.hidden = !show;
        if (show) visible++;
      });
      countEl.textContent = visible + (visible === 1 ? ' produto' : ' produtos');
      emptyEl.hidden = visible !== 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        intent = chip.dataset.intentChip;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        applyFilters();
      });
    });
    formats.forEach(function (f) { f.addEventListener('change', applyFilters); });

    if (sortEl) {
      sortEl.addEventListener('change', function () {
        var mode = sortEl.value;
        var sorted = cards.slice().sort(function (a, b) {
          if (mode === 'az') return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent, 'pt-BR');
          if (mode === 'novidades') return (b.dataset.new === '1') - (a.dataset.new === '1') || a.dataset.order - b.dataset.order;
          return a.dataset.order - b.dataset.order;
        });
        sorted.forEach(function (c) { grid.appendChild(c); });
      });
    }

    var toggle = document.querySelector('.filters-toggle');
    var filters = document.getElementById('filtros');
    if (toggle && filters) {
      toggle.addEventListener('click', function () {
        var open = filters.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'Esconder filtros' : 'Mostrar filtros';
      });
    }

    applyFilters();
  }

  // ---------- Página de produto ----------
  var product = document.querySelector('[data-product]');
  if (product) {
    var main = document.querySelector('.gallery-main');
    document.querySelectorAll('.thumbs button').forEach(function (b, _, all) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(all, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        main.style.backgroundColor = b.dataset.tint;
      });
    });

    var aromaLabel = document.querySelector('[data-aroma-label]');
    var aromaChips = document.querySelectorAll('[data-aroma]');
    aromaChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        aromaChips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        aromaLabel.textContent = chip.dataset.aroma;
      });
    });

    var qtyOut = document.querySelector('[data-qty]');
    var qty = 1;
    function setQty(n) { qty = Math.max(1, Math.min(20, n)); qtyOut.textContent = qty; }
    document.querySelector('[data-qty-dec]').addEventListener('click', function () { setQty(qty - 1); });
    document.querySelector('[data-qty-inc]').addEventListener('click', function () { setQty(qty + 1); });

    document.querySelector('[data-add-product]').addEventListener('click', function () {
      addToCart(qty, product.dataset.product + ' (' + aromaLabel.textContent + ')');
    });

    var fav = document.querySelector('.fav-btn');
    fav.addEventListener('click', function () {
      var on = fav.getAttribute('aria-pressed') !== 'true';
      fav.setAttribute('aria-pressed', String(on));
      toast(on ? 'Salvo nos favoritos' : 'Removido dos favoritos');
    });
  }
})();
