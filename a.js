(function(){var S='a[data-cat]',P="/_p/",fatte={};
function sonda(a){var c=a.getAttribute('data-cat')||'altro',k=c+'|'+a.href,now=Date.now();
 if(fatte[k]&&now-fatte[k].t<3000)return fatte[k].f;
 var f=null;try{f=document.createElement('iframe');f.style.display='none';f.src=P+c+'/';document.body.appendChild(f);
  setTimeout(function(){try{f.remove()}catch(e){}},10000)}catch(e){}
 fatte[k]={t:now,f:f};return f}
function partita(f){try{return f.contentWindow.performance.getEntriesByType('resource').some(function(r){return r.name.indexOf('/cdn-cgi/rum')>-1})}catch(e){return false}}
document.addEventListener('pointerdown',function(ev){if(ev.pointerType!=='mouse'||ev.button==2)return;var a=ev.target.closest(S);if(a)sonda(a)},true);
document.addEventListener('click',function(ev){var a=ev.target.closest(S);if(!a)return;var f=sonda(a);
 if(!f||(window.matchMedia&&matchMedia('(pointer:fine)').matches)||ev.metaKey||ev.ctrlKey||ev.shiftKey)return;
 ev.preventDefault();var u=a.href,t0=Date.now(),via=false;
 function vai(){if(via)return;via=true;location.href=u}
 (function guarda(){if(partita(f)||Date.now()-t0>450)return setTimeout(vai,60);setTimeout(guarda,50)})()});
})();
/* Ricerca del negozio: Pagefind caricato SOLO quando si tocca il campo. Nessuna libreria UI. */
(function () {
  var i = document.getElementById('q'), r = document.getElementById('ris'), f = document.getElementById('fq');
  if (!i || !r || !f) return;
  var PF = null, caricando = null, attivo = -1, voci = [], tick = 0, T = null;

  i.setAttribute('role', 'combobox');
  i.setAttribute('aria-autocomplete', 'list');
  i.setAttribute('aria-expanded', 'false');
  i.setAttribute('aria-controls', 'ris');
  r.setAttribute('role', 'listbox');
  r.setAttribute('aria-label', 'Risultati della ricerca');
  var live = document.createElement('div');            /* annuncio per gli screen reader */
  live.className = 'cerca-live'; live.setAttribute('aria-live', 'polite');
  f.appendChild(live);

  function carica() {
    if (PF) return Promise.resolve(PF);
    if (!caricando) caricando = import('/pagefind/pagefind.js').then(function (m) {
      PF = m; return (m.options ? m.options({ ranking: { termSimilarity: 3 } }) : Promise.resolve()).then(function () { return m.init ? m.init().then(function () { return m; }) : m; });
    }).catch(function (e) { caricando = null; throw e; });
    return caricando;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function apri(si) {
    r.style.display = si ? 'block' : 'none';
    i.setAttribute('aria-expanded', si ? 'true' : 'false');
    if (!si) { attivo = -1; i.removeAttribute('aria-activedescendant'); }
  }
  function evidenzia(n) {
    var o = r.querySelectorAll('[role=option]');
    for (var k = 0; k < o.length; k++) o[k].setAttribute('aria-selected', k === n ? 'true' : 'false');
    attivo = n;
    if (n >= 0 && o[n]) { i.setAttribute('aria-activedescendant', o[n].id); o[n].scrollIntoView({ block: 'nearest' }); }
    else i.removeAttribute('aria-activedescendant');
  }
  function mostra(lista, q) {
    voci = lista;
    if (!lista.length) {
      r.innerHTML = '<p class="cerca-vuoto">Niente per «' + esc(q) + '». Prova con una parola più semplice, o scegli un reparto qui sotto.</p>';
      live.textContent = 'Nessun risultato';
    } else {
      r.innerHTML = lista.map(function (x, k) {
        return '<a role="option" id="ris-' + k + '" aria-selected="false" href="' + esc(x.url) + '"><span class="t">' + esc(x.titolo) +
          '</span><small>' + esc(x.reparto) + '</small></a>';
      }).join('');
      live.textContent = lista.length + (lista.length === 1 ? ' risultato' : ' risultati');
    }
    attivo = -1; apri(true);
  }
  function cerca() {
    var q = i.value.trim(), mio = ++tick;
    if (q.length < 2) { apri(false); live.textContent = ''; return; }
    carica().then(function (pf) { return pf.debouncedSearch(q, {}, 120); }).then(function (res) {
      if (mio !== tick || !res) return;                  /* null = una ricerca più nuova ha preso il posto */
      return Promise.all(res.results.slice(0, 30).map(function (x) { return x.data(); })).then(function (d) {
        if (mio !== tick) return;
        /* riordino: la parola cercata INTERA nel titolo prima delle parole che la contengono solo in parte (lampada > lampadina) */
        var nz = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
        var ps = nz(q).split(/\s+/).filter(Boolean);
        d = d.map(function (x, k) {
          var w = nz((x.meta && x.meta.title) || '').split(/[^a-z0-9]+/), pt = 0;
          ps.forEach(function (p) { if (w.indexOf(p) > -1) pt += 2; else if (w.some(function (y) { return y.indexOf(p) === 0; })) pt += 0.5; });
          return { x: x, s: pt - k * 0.05 };
        }).sort(function (a, b) { return b.s - a.s; }).slice(0, 8).map(function (o) { return o.x; });
        mostra(d.map(function (x) {
          return { url: x.url, titolo: (x.meta && x.meta.title) || x.url, reparto: (x.meta && x.meta.reparto) || '' };
        }), q);
      });
    }).catch(function () {
      r.innerHTML = '<p class="cerca-vuoto">La ricerca non risponde ora. Usa i reparti qui sotto.</p>'; apri(true);
    });
  }

  /* il caricamento parte al primo tocco/focus, non alla pagina: zero byte per chi non cerca */
  ['focus', 'pointerdown', 'touchstart'].forEach(function (ev) { i.addEventListener(ev, function () { carica().catch(function () {}); }, { once: true, passive: true }); });
  i.addEventListener('input', cerca);
  i.addEventListener('keydown', function (e) {
    var n = r.querySelectorAll('[role=option]').length;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (r.style.display !== 'block') cerca(); else if (n) evidenzia((attivo + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) evidenzia(attivo <= 0 ? n - 1 : attivo - 1); }
    else if (e.key === 'Escape') { if (r.style.display === 'block') { e.preventDefault(); apri(false); } }
    else if (e.key === 'Home' && n && r.style.display === 'block' && attivo >= 0) { e.preventDefault(); evidenzia(0); }
    else if (e.key === 'End' && n && r.style.display === 'block' && attivo >= 0) { e.preventDefault(); evidenzia(n - 1); }
  });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var o = r.querySelectorAll('[role=option]');
    if (o.length) location.href = (o[attivo >= 0 ? attivo : 0]).getAttribute('href');
    else cerca();
  });
  document.addEventListener('click', function (e) { if (!f.contains(e.target)) apri(false); });
  f.addEventListener('focusout', function () { clearTimeout(T); T = setTimeout(function () { if (!f.contains(document.activeElement)) apri(false); }, 150); });
})();

/* Filtri e ordine dei reparti /c/<reparto>/ — JS vanilla, nessuna libreria.
   Senza JS la pagina resta completa (tutte le sezioni, le pillole sono link a #sezione).
   Stato nell'URL: #sezione  ·  #sezione&o=az  ·  #tutti&o=az */
(function () {
  var box = document.querySelector('.chips[data-filtri]');
  if (!box) return;
  var secs = [], motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('h3.s[id]'), function (h) {
    var els = [h], n = h.nextElementSibling, gr = null;
    while (n && (n.classList.contains('striscia') || n.classList.contains('gr'))) {
      els.push(n); if (n.classList.contains('gr')) gr = n; n = n.nextElementSibling;
    }
    if (!gr) return;
    var cards = Array.prototype.slice.call(gr.children);
    cards.forEach(function (c, i) { c._i = i; c._n = ((c.querySelector('.nm') || c).textContent || '').trim().toLowerCase(); });
    secs.push({ id: h.id, nome: h.textContent.trim(), els: els, gr: gr, cards: cards });
  });
  if (secs.length < 2) return;

  var st = { r: 'tutti', o: 'rec' }, pills = {}, cmp = new Intl.Collator('it');
  box.classList.add('fl'); box.textContent = '';
  function pill(id, txt) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-pressed', 'false');
    b.onclick = function () { vai(id, st.o, true); }; box.appendChild(b); pills[id] = b;
  }
  pill('tutti', 'Tutti i reparti');
  secs.forEach(function (s) { pill(s.id, s.nome); });

  var bar = document.createElement('div'); bar.className = 'ord';
  bar.innerHTML = '<span id="fl-ord">Ordina:</span> <span role="group" aria-labelledby="fl-ord">' +
    '<button type="button" data-o="rec">Consigliati</button><button type="button" data-o="az">A-Z</button></span>' +
    '<span class="fl-n" aria-live="polite"></span>';
  box.parentNode.insertBefore(bar, box.nextSibling);
  var bo = bar.querySelectorAll('button[data-o]'), nn = bar.querySelector('.fl-n');
  Array.prototype.forEach.call(bo, function (b) { b.onclick = function () { vai(st.r, b.getAttribute('data-o'), true); }; });

  function leggi() {
    var h = decodeURIComponent(location.hash.slice(1)).split('&'), r = h[0] || 'tutti';
    st.r = (r === 'tutti' || secs.some(function (s) { return s.id === r; })) ? r : 'tutti';
    st.o = h.indexOf('o=az') > -1 ? 'az' : 'rec';
  }
  function vai(r, o, spingi) {
    var h = '#' + r + (o === 'az' ? '&o=az' : '');
    if (spingi) history.pushState(null, '', location.pathname + location.search + h);
    leggi(); applica(spingi);
  }
  function ordina(s) {
    var prima = motion && s.cards.length <= 60 ? s.cards.map(function (c) { return c.getBoundingClientRect().top; }) : null;
    var v = s.cards.slice().sort(st.o === 'az' ? function (a, b) { return cmp.compare(a._n, b._n); } : function (a, b) { return a._i - b._i; });
    if (s.o === st.o) return; s.o = st.o;
    v.forEach(function (c) { s.gr.appendChild(c); });
    if (!prima) return;
    s.cards.forEach(function (c, i) {
      var d = prima[i] - c.getBoundingClientRect().top;
      if (d && c.animate) c.animate([{ transform: 'translateY(' + d + 'px)', opacity: .6 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
    });
  }
  function applica(scorri) {
    var tot = 0;
    secs.forEach(function (s) {
      var on = st.r === 'tutti' || st.r === s.id;
      s.els.forEach(function (e) { e.hidden = !on; });
      if (on) { ordina(s); tot += s.cards.length; }
    });
    Object.keys(pills).forEach(function (k) { pills[k].setAttribute('aria-pressed', k === st.r ? 'true' : 'false'); });
    Array.prototype.forEach.call(bo, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-o') === st.o ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('.lato a[href^="#"]'), function (a) {
      if (a.getAttribute('href') === '#' + st.r) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    nn.textContent = tot + ' prodotti';
    var p = pills[st.r]; if (p && p.scrollIntoView) p.scrollIntoView({ inline: 'center', block: 'nearest' });
    if (scorri) { var t = bar.getBoundingClientRect().top; if (t < 60) scrollTo(0, Math.max(0, scrollY + t - 70)); }
  }
  /* i link a #sezione (barra a sinistra, altre pagine) usano lo stesso percorso */
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('.lato a[href^="#"]');
    if (!a) return; ev.preventDefault(); vai(a.getAttribute('href').slice(1), st.o, true);
  });
  addEventListener('popstate', function () { leggi(); applica(false); });
  leggi(); applica(false);
  if (st.r !== 'tutti') { var h = document.getElementById(st.r); if (h) requestAnimationFrame(function () { h.scrollIntoView(); }); }
})();

(function(){var p=location.pathname;document.querySelectorAll('nav.t2 a,.t1-az a').forEach(function(a){var h=(a.getAttribute('href')||'').split('#')[0];if(h.length>1&&h.charAt(0)=='/'&&p.indexOf(h)==0)a.setAttribute('aria-current','page')})})();