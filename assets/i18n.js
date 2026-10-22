/* EN / 中文 switch, shared by every page.
   English is the page's own HTML. Chinese lives next to it:
     data-zh="..."      → replaces the element's innerHTML
     data-zh-alt="..."  → replaces an <img> alt
     data-zh-src="..."  → replaces an <img> src (charts that have a Chinese version)
     data-lang-only="en" / "zh" → element shown in one language only
   The choice is remembered per browser; ?lang=zh in the URL also works. */
(() => {
  const swap = (el, attr, store, value) => {
    if (!(store in el.dataset)) el.dataset[store] = attr ? el.getAttribute(attr) : el.innerHTML;
    if (attr) el.setAttribute(attr, value); else el.innerHTML = value;
  };
  function apply(lang) {
    const zh = lang === 'zh';
    document.documentElement.lang = zh ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-zh]').forEach(el => swap(el, null, 'en', zh ? el.dataset.zh : el.dataset.en ?? el.innerHTML));
    document.querySelectorAll('[data-zh-alt]').forEach(el => swap(el, 'alt', 'enAlt', zh ? el.dataset.zhAlt : el.dataset.enAlt ?? el.alt));
    document.querySelectorAll('[data-zh-src]').forEach(el => swap(el, 'src', 'enSrc', zh ? el.dataset.zhSrc : el.dataset.enSrc ?? el.getAttribute('src')));
    document.querySelectorAll('[data-lang-only]').forEach(el => { el.hidden = el.dataset.langOnly !== lang; });
    document.querySelectorAll('.lang-toggle').forEach(b => {
      b.innerHTML = zh ? 'EN / <b>中文</b>' : '<b>EN</b> / 中文';
      b.setAttribute('aria-label', zh ? 'Switch to English' : '切换到中文');
    });
  }
  let lang = new URLSearchParams(location.search).get('lang');
  if (lang !== 'en' && lang !== 'zh') { try { lang = localStorage.getItem('lang'); } catch {} }
  if (lang !== 'zh') lang = 'en';
  apply(lang);
  document.addEventListener('click', e => {
    if (!e.target.closest('.lang-toggle')) return;
    lang = lang === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem('lang', lang); } catch {}
    apply(lang);
  });
})();
