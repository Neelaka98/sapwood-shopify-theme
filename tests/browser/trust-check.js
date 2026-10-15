(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const certs = document.querySelector('[data-certifications]');
  assert(certs, 'Certifications render');
  assert(certs.querySelector('h2'), 'Certifications have a section heading');
  const rows = [...certs.querySelectorAll('ul > li')];
  assert(rows.length >= 1, 'Each certification block is a list item');
  rows.forEach((row) => {
    assert(row.querySelector('h3'), 'Each certification is named by an h3');
    const logo = row.querySelector('img');
    if (!logo) assert(row.firstElementChild.tagName === 'H3', 'A certification without a logo has no empty logo cell');
    if (logo) assert(logo.getAttribute('alt') === '', 'Logos are decorative because the name sits beside them');
  });

  const strip = document.querySelector('[data-trust-strip]');
  assert(strip, 'Trust strip renders');
  const items = strip.querySelectorAll('ul > li');
  assert(items.length >= 2, 'Each trust block is a list item');
  assert([...items].every((item) => item.textContent.trim() !== ''), 'Every trust item has text');
  assert([...document.querySelectorAll('h1,h2,h3,h4')].every((h) => h.textContent.trim() !== ''), 'The page has no empty headings');
  assert([...certs.querySelectorAll('a')].every((a) => a.textContent.trim() !== ''), 'Certifications have no empty links');
  return 'trust ok';
})();
