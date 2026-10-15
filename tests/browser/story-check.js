(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const story = document.querySelector('[data-image-with-text]');
  assert(story, 'Image with text renders');
  assert(story.querySelector('h2'), 'Image with text has a section heading');
  assert(story.querySelector('img, svg'), 'Image with text shows an image or a placeholder');

  const map = document.querySelector('[data-origin-map]');
  assert(map, 'Origin map renders');
  assert(map.querySelector('h2'), 'Origin map has a section heading');
  const pin = map.querySelector('[data-map-pin]');
  assert(pin, 'The map has a pin');
  assert(/^\d+(\.\d+)?%$/.test(pin.style.left) && /^\d+(\.\d+)?%$/.test(pin.style.top), 'The pin is placed in percent');
  assert(pin.getAttribute('aria-hidden') === 'true', 'The pin is hidden from screen readers; the image alt describes the place');
  assert(map.querySelector('figure figcaption'), 'The map caption is a figcaption');
  return 'story ok';
})();
