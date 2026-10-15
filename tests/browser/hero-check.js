(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const hero = document.querySelector('[data-hero]');
  assert(hero, 'Hero renders');
  const headings = document.querySelectorAll('h1');
  assert(headings.length === 1 && hero.contains(headings[0]), 'The first hero heading is the only h1 on the page');
  assert(headings[0].textContent.trim() !== '', 'The hero heading has text');
  assert(hero.getAttribute('aria-labelledby') === headings[0].id, 'The hero section is named by its heading');
  assert(hero.querySelectorAll('a.btn').length >= 1, 'The hero shows its button');
  assert(hero.querySelector('img, svg, video'), 'The hero shows media or a placeholder');
  const video = hero.querySelector('[data-hero-video]');
  if (video) {
    const toggle = video.querySelector('[data-video-toggle]');
    assert(!toggle.hidden, 'The pause button shows once the script runs');
    assert(toggle.querySelector('[data-video-label]').textContent.trim() !== '', 'The pause button has a name');
  }
  return 'hero ok';
})();
