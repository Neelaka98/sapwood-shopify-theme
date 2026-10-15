(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const waitFor = async (test, message) => {
    const deadline = performance.now() + 8000;
    while (!test()) {
      if (performance.now() > deadline) throw Error(message);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  const root = document.querySelector('[data-video-root]');
  assert(root, 'Video section renders');
  assert(!root.querySelector('iframe'), 'No player loads before the visitor asks for it');
  const link = root.querySelector('a[data-video-embed]');
  assert(link, 'The cover is a link');
  assert(/youtube\.com|vimeo\.com/.test(link.href), 'Without JavaScript the link opens the video on its own site');
  assert(link.textContent.trim() !== '', 'The cover link has a name');
  link.click();
  await waitFor(() => root.querySelector('iframe'), 'Clicking the cover loads the player');
  const frame = root.querySelector('iframe');
  assert(/youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\//.test(frame.src), 'The player uses the privacy-friendly embed URL');
  assert(frame.title.trim() !== '', 'The player has a title');
  assert(!root.querySelector('a[data-video-embed]'), 'The cover link is replaced');
  return 'video ok';
})();
