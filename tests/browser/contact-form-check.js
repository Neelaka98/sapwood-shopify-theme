(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const form = document.querySelector('form[id^="ContactForm-"]');
  assert(form, 'Contact form renders');
  assert(new URL(form.action).pathname.endsWith('/contact'), 'It posts to the contact endpoint');
  assert(form.querySelector('input[name="form_type"][value="contact"]'), 'It is a Shopify contact form');
  const email = form.querySelector('input[name="contact[email]"]');
  assert(email && email.type === 'email' && email.required, 'Email is required and typed');
  const fields = [...form.querySelectorAll('input:not([type="hidden"]), textarea')];
  fields.forEach((field) => assert(form.querySelector(`label[for="${field.id}"]`), `${field.name} has a label`));
  assert(new Set(fields.map((f) => f.id)).size === fields.length, 'Field ids are unique');
  const required = (name) => form.querySelector(`[name="contact[${name}]"]`)?.required;
  if (form.querySelector('[name="contact[business]"]')) {
    ['business', 'country', 'volume'].forEach((name) => assert(required(name), `Trade field ${name} is required`));
    assert(required('body') === false, 'The message is optional on the trade form');
  } else {
    assert(required('body'), 'The message is required on the contact form');
    assert(required('name') === false, 'The name is optional on the contact form');
  }
  assert(form.querySelector('button[type="submit"]'), 'It has a submit button');
  return 'contact form ok';
})();
