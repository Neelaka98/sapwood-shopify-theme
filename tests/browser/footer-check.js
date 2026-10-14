(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const footer = document.querySelector('footer');
  assert(footer, 'Footer renders');
  assert(footer.className.includes('color-dark'), 'Footer uses the dark scheme by default');
  const form = footer.querySelector('form#FooterNewsletter');
  assert(form, 'Newsletter form renders');
  assert(new URL(form.getAttribute('action'), location.href).pathname.endsWith('/contact'), 'Newsletter posts to the customer form endpoint');
  assert(form.querySelector('input[name="contact[email]"][type="email"][required]'), 'Email field is named and required');
  assert(form.querySelector('input[name="contact[tags]"][value="newsletter"]'), 'Signups are tagged newsletter');
  assert(form.querySelector('label[for="FooterNewsletterEmail"]'), 'Email field has a label');
  assert(footer.querySelectorAll('nav a, ul a').length > 0, 'Footer menu block renders links');
  return 'footer ok';
})();
