# Sapwood plan 2: homepage and content sections

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every section in the spec's section table that plan 1 did not build exists, works without JavaScript, passes Theme Check, and is laid out on the homepage, plus a contact page template.

**Architecture:** One Liquid file per section in `sections/`, styled with Tailwind utilities in the markup (as `main-collection.liquid` and `footer.liquid` already are), so no new CSS files. The featured product section reuses plan 1's price, variant picker, buy buttons and variant JSON snippets and `product.ts`, and the cart's delegated submit handler picks its form up with no cart changes. The only new script is `src/ts/video.ts`, registered per section root with `registerSection`. The wholesale inquiry and the contact page share one `contact-form` section with a setting that switches on the trade fields.

**Tech stack:** as plan 1. Shopify CLI 4.9.3, Liquid with LiquidDoc, Tailwind CSS 4.3.3, esbuild 0.28.2, TypeScript 6.0.3, Node 24, agent-browser, Lighthouse 13.5.0. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-14-sapwood-theme-design.md`, section table rows Hero, Image with text, Origin map, Process steps, Featured product, Product grid, Certifications, Trust strip, Wholesale inquiry, Video, FAQ and Reviews, plus the `page.contact` template.

**Left for later plans:** GSAP motion, including the pinned desktop process section, its progress line and step buttons, and selecting a step block in the editor (plan 3). The FAQ section's product metafield option, the nutrition, pack details and how-to-use blocks, and `scripts/create-metafields.mjs` (plan 3). Natural Treacle copy in `templates/index.json` and presets, `demo/products.csv` and demo images (plan 4). The concept's `WholesaleSheet` side sheet is not built: wholesale links point at the homepage section or the contact page.

**Concept source:** `~/Development/Raala-pitch` (Astro). Read-only. Layouts port from the files each task names. None of its copy, product data or images ship.

## Global constraints

- Node 24 for every command: run `source ~/.nvm/nvm.sh && nvm use` in the repo first (reads `.nvmrc`). The shell defaults to Node 20.
- Exact dev dependency versions stay as plan 1 set them. No new dependencies.
- Every string a shopper sees and the theme supplies goes in `locales/en.default.json`. Every editor label goes in `locales/en.default.schema.json` and is referenced as `t:...`. Liquid never hard-codes these strings. Setting defaults and preset copy are merchant copy and may be plain English in the schema, as plan 1 does.
- No RaaLa assets, names or copy anywhere in the theme. Default copy makes no health claims and does not use the words "organic", "sugar free" or "low GI".
- Colour scheme ids are `light`, `band` and `dark`. Every section has a `color_scheme` setting and puts `color-{{ section.settings.color_scheme }}` on its outer element.
- Use the scheme utilities (`text-ink`, `text-heading`, `text-muted`, `bg-tint`, `border-line`, `border-hairline`, `bg-accent`, `text-on-accent`) or `var(--scheme-*)`. Never a hex colour in a section.
- Section headings are `h2`, item titles under them `h3`. The only `h1` on the homepage is the first hero's heading.
- Every new section has a `presets` entry so merchants can add it in the theme editor.
- Every image uses `image_url | image_tag` with `widths` and `sizes`, and `loading: 'lazy'` unless the task says otherwise. An empty image setting shows a `placeholder_svg_tag`.
- No em dash character (U+2014) in any copy, comment, locale string or commit message.
- Comments explain why, never what. Snippets document their parameters with `{% doc %}`.
- `npm run check` (Theme Check) must report no errors at the end of every task.
- The local dev server is `http://127.0.0.1:9292`, run with `npm run dev`. Browser checks run with `agent-browser --session theme open <url> && agent-browser --session theme eval --stdin < tests/browser/<file>`.
- Commit messages end with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

```
sections/hero.liquid                 image or Shopify video, heading (h1 when first), text, two buttons
sections/image-with-text.liquid      image left or right, heading, rich text, link
sections/origin-map.liquid           heading, rich text, map image with a pin set in percent, caption
sections/process-steps.liquid        ordered list of step blocks, stacked image and copy
sections/featured-product.liquid     one product with price, variant picker, quantity and add to cart
sections/product-grid.liquid         cards from a collection, count and image fit settings
sections/certifications.liquid       logo blocks with name, text and optional link
sections/trust-strip.liquid          short text blocks in one row
sections/video.liquid                Shopify video, or YouTube/Vimeo behind a cover image
sections/faq.liquid                  question and answer blocks as <details>
sections/reviews.liquid              @app block slot, renders nothing when empty
sections/contact-form.liquid         contact form, with optional trade fields for wholesale
snippets/contact-field.liquid        one labelled contact form field
src/ts/video.ts                      hero video pause button, click-to-load video embeds
templates/index.json                 homepage, built up task by task
templates/page.contact.json          page content plus the contact form
tests/browser/hero-check.js tests/browser/story-check.js tests/browser/process-check.js
tests/browser/featured-product-check.js tests/browser/product-grid-check.js tests/browser/trust-check.js
tests/browser/video-check.js tests/browser/faq-check.js tests/browser/reviews-check.js tests/browser/contact-form-check.js
```

Modified: `snippets/icon.liquid` (play, pause), `snippets/product-card.liquid` (`image_fit`), `snippets/buy-buttons.liquid` and `snippets/variant-picker.liquid` (doc lines only), `sections/main-product.liquid` (`data-updates-url`), `src/ts/product.ts`, `src/ts/theme.ts`, `templates/product.json`, both locale files, `README.md`.

## Task 0: store setup (done by Neelaka, not an agent)

Plan 1's Task 0 store is still needed: Kithul Treacle (`kithul-treacle`, sizes 250 ml on sale, 375 ml sold out, 1000 ml with 2 in stock) and Kithul Jaggery (`kithul-jaggery`).

- [ ] **Step 1:** Products > Collections > Create collection: title **Shop**, handle `shop`, manual, add both products.
- [ ] **Step 2:** Online Store > Pages > Add page: title **Contact**, handle `contact`, a line of body text, theme template `contact`. The template list comes from the published theme. If it has no `contact` template, leave it on the default; the checks below then use `/pages/contact?view=contact`, which loads `templates/page.contact.json` from the development theme.
- [ ] **Step 3:** Settings > Notifications > Staff notifications: confirm the store's sender email is one you can read, so contact form submissions in Task 9 can be checked.

## Task 1: hero section and video script

**Files:**
- Create: `sections/hero.liquid`, `src/ts/video.ts`, `tests/browser/hero-check.js`
- Modify: `snippets/icon.liquid`, `src/ts/theme.ts`, `templates/index.json`, `locales/en.default.json`, `locales/en.default.schema.json`

**Interfaces:**
- Consumes: `registerSection(selector, init)` from `src/ts/sections.ts`; `.btn`, `.btn-primary`, `.btn-outline`, `.icon-btn`, `.wrap` from `src/css/theme.css`.
- Produces: icons `play` and `pause` in `snippets/icon.liquid`; `src/ts/video.ts` (Task 7 adds to it); locale keys `video.play`, `video.pause`.

Layout ported from the concept's `src/components/home/Hero.astro`, simplified to one image or video. The serving-tabs slideshow is not ported.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/hero-check.js`:
```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run dev` in another terminal, then `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/hero-check.js`
Expected: FAIL with `Hero renders`.

- [ ] **Step 3: Add the play and pause icons**

In `snippets/icon.liquid`, change the `name` doc line to:
```liquid
  @param {string} name - search, bag, menu, close, chevron-down, chevron-left, chevron-right, expand, minus, plus, play or pause
```
and add two cases after `when 'plus'`:
```liquid
    when 'play'
      assign paths = '<path d="M7 5v14l12-7L7 5Z"/>'
    when 'pause'
      assign paths = '<path d="M8 5v14M16 5v14"/>'
```

- [ ] **Step 4: Add the locale strings**

In `locales/en.default.json`, add a top-level key after `"footer"`:
```json
  "video": {
    "play": "Play video",
    "pause": "Pause video"
  },
```

In `locales/en.default.schema.json`, add under `"sections"` after `"all"`:
```json
    "hero": {
      "name": "Hero",
      "image": "Image",
      "video": "Video",
      "video_info": "Plays muted on a loop in place of the image, with a pause button. Visitors who ask for reduced motion see it paused.",
      "heading": "Heading",
      "heading_info": "The first section on a page shows this as the page's main heading.",
      "text": "Text",
      "button_label_1": "First button label",
      "button_link_1": "First button link",
      "button_label_2": "Second button label",
      "button_link_2": "Second button link"
    },
```

- [ ] **Step 5: Write the hero section**

`sections/hero.liquid`:
```liquid
{%- liquid
  assign is_first = false
  if section.index == 1
    assign is_first = true
  endif
  assign heading_tag = 'h2'
  assign image_loading = 'lazy'
  assign image_priority = 'auto'
  if is_first
    assign heading_tag = 'h1'
    assign image_loading = 'eager'
    assign image_priority = 'high'
  endif
-%}
<section
  class="color-{{ section.settings.color_scheme }}"
  aria-labelledby="Hero-{{ section.id }}"
  data-hero
>
  <div class="wrap grid gap-8 py-10 lg:grid-cols-12 lg:items-center lg:gap-x-6 lg:py-16">
    <div class="lg:col-span-5">
      <{{ heading_tag }} id="Hero-{{ section.id }}" class="text-[clamp(2.5rem,1.6rem+4vw,5.25rem)] leading-none">
        {{- section.settings.heading | escape -}}
      </{{ heading_tag }}>
      {%- if section.settings.text != blank -%}
        <p class="mt-5 text-lg text-heading lg:text-xl">{{ section.settings.text }}</p>
      {%- endif -%}
      <div class="mt-8 flex flex-wrap gap-3">
        {%- if section.settings.button_label_1 != blank and section.settings.button_link_1 != blank -%}
          <a href="{{ section.settings.button_link_1 }}" class="btn btn-primary">
            {{- section.settings.button_label_1 | escape -}}
          </a>
        {%- endif -%}
        {%- if section.settings.button_label_2 != blank and section.settings.button_link_2 != blank -%}
          <a href="{{ section.settings.button_link_2 }}" class="btn btn-outline">
            {{- section.settings.button_label_2 | escape -}}
          </a>
        {%- endif -%}
      </div>
    </div>
    <div class="relative aspect-[6/5] overflow-hidden lg:col-span-7 lg:aspect-[4/3]">
      {%- if section.settings.video != blank -%}
        <div class="group size-full" data-hero-video>
          {{
            section.settings.video
            | video_tag:
              image_size: '1600x',
              muted: true,
              loop: true,
              playsinline: true,
              preload: 'metadata',
              class: 'size-full object-cover'
          }}
          {%- comment -%}Hidden until video.ts runs: without JavaScript the video never plays, so there is nothing to pause.{%- endcomment -%}
          <button
            type="button"
            class="icon-btn absolute bottom-3 left-3 bg-ground text-ink"
            data-video-toggle
            data-play-label="{{ 'video.play' | t }}"
            data-pause-label="{{ 'video.pause' | t }}"
            hidden
          >
            <span class="group-data-playing:hidden">{% render 'icon', name: 'play', size: 18 %}</span>
            <span class="hidden group-data-playing:inline">{% render 'icon', name: 'pause', size: 18 %}</span>
            <span class="sr-only" data-video-label>{{ 'video.play' | t }}</span>
          </button>
        </div>
      {%- elsif section.settings.image != blank -%}
        {{
          section.settings.image
          | image_url: width: 1920
          | image_tag:
            widths: '480, 720, 960, 1280, 1600, 1920',
            sizes: '(min-width: 64rem) 58vw, 100vw',
            loading: image_loading,
            fetchpriority: image_priority,
            class: 'size-full object-cover'
        }}
      {%- else -%}
        {{ 'lifestyle-1' | placeholder_svg_tag: 'size-full bg-tint' }}
      {%- endif -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "t:sections.hero.name",
  "settings": [
    { "type": "image_picker", "id": "image", "label": "t:sections.hero.image" },
    { "type": "video", "id": "video", "label": "t:sections.hero.video", "info": "t:sections.hero.video_info" },
    { "type": "text", "id": "heading", "label": "t:sections.hero.heading", "info": "t:sections.hero.heading_info", "default": "Made in small batches by the people who grow it" },
    { "type": "inline_richtext", "id": "text", "label": "t:sections.hero.text", "default": "For the breakfast table, the tea pot and the baking tin." },
    { "type": "text", "id": "button_label_1", "label": "t:sections.hero.button_label_1", "default": "Shop the range" },
    { "type": "url", "id": "button_link_1", "label": "t:sections.hero.button_link_1", "default": "/collections/all" },
    { "type": "text", "id": "button_label_2", "label": "t:sections.hero.button_label_2", "default": "Buy for your business" },
    { "type": "url", "id": "button_link_2", "label": "t:sections.hero.button_link_2" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "presets": [{ "name": "t:sections.hero.name" }]
}
{% endschema %}
```

- [ ] **Step 6: Write the video script**

`src/ts/video.ts`:
```ts
import { registerSection } from './sections.ts';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

registerSection('[data-hero-video]', (root, signal) => {
  const video = root.querySelector('video');
  const toggle = root.querySelector<HTMLButtonElement>('[data-video-toggle]');
  const label = toggle?.querySelector('[data-video-label]');
  if (!video || !toggle || !label) return;

  const sync = () => {
    root.toggleAttribute('data-playing', !video.paused);
    label.textContent = (video.paused ? toggle.dataset.playLabel : toggle.dataset.pauseLabel) ?? '';
  };
  toggle.hidden = false;
  toggle.addEventListener(
    'click',
    () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    },
    { signal },
  );
  video.addEventListener('play', sync, { signal });
  video.addEventListener('pause', sync, { signal });
  // Moving video longer than 5 seconds needs a pause control (WCAG 2.2.2), and reduced motion means no autoplay at all.
  video.muted = true;
  if (!reducedMotion.matches) video.play().catch(() => {});
  sync();
});
```

In `src/ts/theme.ts`, add `import './video.ts';` after `import './product.ts';`.

- [ ] **Step 7: Put the hero on the homepage**

`templates/index.json`:
```json
{
  "sections": {
    "hero": {
      "type": "hero",
      "settings": {
        "heading": "Made in small batches by the people who grow it",
        "text": "For the breakfast table, the tea pot and the baking tin.",
        "button_label_1": "Shop the range",
        "button_link_1": "shopify://collections/shop",
        "button_label_2": "Buy for your business",
        "button_link_2": "shopify://pages/contact",
        "color_scheme": "light"
      }
    }
  },
  "order": ["hero"]
}
```

- [ ] **Step 8: Run the checks**

Run: `npm run build && npm run typecheck && npm run check && agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/hero-check.js`
Expected: no type or Theme Check errors, then `hero ok`.

- [ ] **Step 9: Check the video by hand**

In the theme editor (`shopify theme dev` prints the editor link), upload any short MP4 to the hero's Video setting. Expected: the video plays muted and loops; the button bottom left reads "Pause video" to a screen reader (inspect the `sr-only` span) and pauses it; pressing it again plays. Rerun `hero-check.js` on the editor preview: `hero ok`. With `agent-browser --session theme set media prefers-reduced-motion reduce` and a reload, the video stays paused with "Play video". Remove the video from the setting afterwards so later checks run on the image path.

- [ ] **Step 10: Commit**

```bash
git add sections/hero.liquid snippets/icon.liquid src/ts assets templates/index.json locales tests/browser/hero-check.js
git commit -m "Add hero section with image or looping video and a pause button

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 2: image with text and origin map sections

**Files:**
- Create: `sections/image-with-text.liquid`, `sections/origin-map.liquid`, `tests/browser/story-check.js`
- Modify: `templates/index.json`, `locales/en.default.schema.json`

**Interfaces:**
- Consumes: `.wrap`, `.rte`, `.display-caps` from `src/css/theme.css`.
- Produces: nothing used by later tasks.

Image with text is ported from the concept's `src/components/home/GivingBack.astro`. The origin map is ported from `KithulStory.astro` and `SriLankaMap.astro`, with the generated SVG replaced by a merchant image and one pin.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/story-check.js`:
```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/story-check.js`
Expected: FAIL with `Image with text renders`.

- [ ] **Step 3: Add the schema strings**

In `locales/en.default.schema.json`, add under `"sections"`:
```json
    "image_with_text": {
      "name": "Image with text",
      "image": "Image",
      "image_position": "Image position",
      "left": "Left",
      "right": "Right",
      "heading": "Heading",
      "text": "Text",
      "link_label": "Link label",
      "link": "Link"
    },
    "origin_map": {
      "name": "Origin map",
      "heading": "Heading",
      "text": "Text",
      "map": "Map image",
      "map_info": "Write the pinned place into the image's alt text. Screen readers do not read the pin or its label.",
      "pin_x": "Pin position across",
      "pin_y": "Pin position down",
      "pin_label": "Pin label",
      "caption": "Caption",
      "caption_info": "For example the map's source and licence."
    },
```

- [ ] **Step 4: Write the image with text section**

`sections/image-with-text.liquid`:
```liquid
{%- assign heading_id = 'ImageWithText-' | append: section.id -%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  {% if section.settings.heading != blank %}
    aria-labelledby="{{ heading_id }}"
  {% endif %}
  data-image-with-text
>
  <div class="wrap grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-6">
    <div class="-mx-4 overflow-hidden sm:-mx-6 lg:col-span-7 lg:mx-0{% if section.settings.image_position == 'right' %} lg:order-last{% endif %}">
      {%- if section.settings.image != blank -%}
        {{
          section.settings.image
          | image_url: width: 1400
          | image_tag:
            widths: '480, 720, 960, 1200, 1400',
            sizes: '(min-width: 64rem) 58vw, 100vw',
            loading: 'lazy',
            class: 'aspect-[3/2] w-full object-cover'
        }}
      {%- else -%}
        {{ 'lifestyle-2' | placeholder_svg_tag: 'aspect-[3/2] w-full bg-tint' }}
      {%- endif -%}
    </div>
    <div class="lg:col-span-5">
      {%- if section.settings.heading != blank -%}
        <h2 id="{{ heading_id }}">{{ section.settings.heading | escape }}</h2>
      {%- endif -%}
      {%- if section.settings.text != blank -%}
        <div class="rte mt-6 text-lg">{{ section.settings.text }}</div>
      {%- endif -%}
      {%- if section.settings.link_label != blank and section.settings.link != blank -%}
        <a
          href="{{ section.settings.link }}"
          class="mt-6 inline-flex min-h-11 items-center font-semibold text-heading underline underline-offset-4"
        >
          {{- section.settings.link_label | escape -}}
        </a>
      {%- endif -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "t:sections.image_with_text.name",
  "settings": [
    { "type": "image_picker", "id": "image", "label": "t:sections.image_with_text.image" },
    {
      "type": "select",
      "id": "image_position",
      "label": "t:sections.image_with_text.image_position",
      "default": "left",
      "options": [
        { "value": "left", "label": "t:sections.image_with_text.left" },
        { "value": "right", "label": "t:sections.image_with_text.right" }
      ]
    },
    { "type": "text", "id": "heading", "label": "t:sections.image_with_text.heading", "default": "Who makes it" },
    { "type": "richtext", "id": "text", "label": "t:sections.image_with_text.text", "default": "<p>Tell customers who grows, picks and cooks what you sell, and where.</p>" },
    { "type": "text", "id": "link_label", "label": "t:sections.image_with_text.link_label" },
    { "type": "url", "id": "link", "label": "t:sections.image_with_text.link" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "presets": [{ "name": "t:sections.image_with_text.name" }]
}
{% endschema %}
```

- [ ] **Step 5: Write the origin map section**

`sections/origin-map.liquid`:
```liquid
{%- assign heading_id = 'OriginMap-' | append: section.id -%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  {% if section.settings.heading != blank %}
    aria-labelledby="{{ heading_id }}"
  {% endif %}
  data-origin-map
>
  <div class="wrap grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-6">
    <div class="lg:col-span-6">
      {%- if section.settings.heading != blank -%}
        <h2 id="{{ heading_id }}">{{ section.settings.heading | escape }}</h2>
      {%- endif -%}
      {%- if section.settings.text != blank -%}
        <div class="rte mt-8 max-w-prose text-lg">{{ section.settings.text }}</div>
      {%- endif -%}
    </div>
    <figure class="lg:col-span-5 lg:col-start-8">
      {%- comment -%}w-fit makes the box match the rendered image, so the pin's percentages land on the map, not on empty space.{%- endcomment -%}
      <div class="relative mx-auto w-fit">
        {%- if section.settings.map != blank -%}
          {{
            section.settings.map
            | image_url: width: 1000
            | image_tag:
              widths: '400, 600, 800, 1000',
              sizes: '(min-width: 64rem) 34vw, 90vw',
              loading: 'lazy',
              class: 'block h-auto max-h-[34rem] w-auto max-w-full'
          }}
        {%- else -%}
          {{ 'image' | placeholder_svg_tag: 'block aspect-[3/4] w-72 max-w-full bg-tint' }}
        {%- endif -%}
        <span
          class="absolute size-4 -translate-1/2 rounded-full border-2 border-ink bg-accent"
          style="left: {{ section.settings.pin_x }}%; top: {{ section.settings.pin_y }}%"
          aria-hidden="true"
          data-map-pin
        ></span>
        {%- if section.settings.pin_label != blank -%}
          <span
            class="display-caps absolute translate-x-3 -translate-y-1/2 whitespace-nowrap text-base leading-none sm:text-lg"
            style="left: {{ section.settings.pin_x }}%; top: {{ section.settings.pin_y }}%"
            aria-hidden="true"
          >
            {{- section.settings.pin_label | escape -}}
          </span>
        {%- endif -%}
      </div>
      {%- if section.settings.caption != blank -%}
        <figcaption class="mt-4 text-center text-sm text-muted">{{ section.settings.caption | escape }}</figcaption>
      {%- endif -%}
    </figure>
  </div>
</section>

{% schema %}
{
  "name": "t:sections.origin_map.name",
  "settings": [
    { "type": "text", "id": "heading", "label": "t:sections.origin_map.heading", "default": "Where it comes from" },
    { "type": "richtext", "id": "text", "label": "t:sections.origin_map.text", "default": "<p>Name the place, the land and the people behind what you sell.</p>" },
    { "type": "image_picker", "id": "map", "label": "t:sections.origin_map.map", "info": "t:sections.origin_map.map_info" },
    { "type": "range", "id": "pin_x", "label": "t:sections.origin_map.pin_x", "min": 0, "max": 100, "step": 1, "unit": "%", "default": 40 },
    { "type": "range", "id": "pin_y", "label": "t:sections.origin_map.pin_y", "min": 0, "max": 100, "step": 1, "unit": "%", "default": 70 },
    { "type": "text", "id": "pin_label", "label": "t:sections.origin_map.pin_label", "default": "Our farm" },
    { "type": "text", "id": "caption", "label": "t:sections.origin_map.caption", "info": "t:sections.origin_map.caption_info" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "presets": [{ "name": "t:sections.origin_map.name" }]
}
{% endschema %}
```

Superseded during execution: the label now flips to the left of the pin when `pin_x` is above 60 (commit 1373035), so it never pushes the page wider on a phone.

- [ ] **Step 6: Add both to the homepage**

In `templates/index.json`, add to `"sections"`:
```json
    "image_with_text": {
      "type": "image-with-text",
      "settings": {
        "image_position": "left",
        "heading": "Who makes it",
        "text": "<p>Tell customers who grows, picks and cooks what you sell, and where.</p>",
        "link_label": "Read our story",
        "link": "shopify://pages/contact",
        "color_scheme": "light"
      }
    },
    "origin_map": {
      "type": "origin-map",
      "settings": {
        "heading": "Where it comes from",
        "text": "<p>Name the place, the land and the people behind what you sell.</p>",
        "pin_x": 40,
        "pin_y": 70,
        "pin_label": "Our farm",
        "caption": "Map: your source and licence here",
        "color_scheme": "light"
      }
    }
```
and append `"image_with_text", "origin_map"` to `"order"`.

- [ ] **Step 7: Run the checks**

Run: `npm run build && npm run check && agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/story-check.js`
Expected: no Theme Check errors, then `story ok`.

- [ ] **Step 8: Check the layout by hand**

In the theme editor, upload any portrait image as the map and drag both pin sliders. Expected: the pin moves over the image and stays inside it at 0 and 100 percent, at 390 px and 1440 px wide. Set image with text to Right: the image moves right on desktop and stays above the text on a phone. Clear the map image afterwards.

- [ ] **Step 9: Commit**

```bash
git add sections/image-with-text.liquid sections/origin-map.liquid templates/index.json locales tests/browser/story-check.js assets
git commit -m "Add image with text and origin map sections

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 3: process steps section

**Files:**
- Create: `sections/process-steps.liquid`, `tests/browser/process-check.js`
- Modify: `templates/index.json`, `locales/en.default.schema.json`

**Interfaces:**
- Consumes: `.wrap` from `src/css/theme.css`.
- Produces: the stacked markup plan 3's motion script will pin. Plan 3 adds its own data attributes.

Ported from the concept's `src/components/home/HomeProcess.astro`, stacked layout only: the drip clip paths, sap track and bottle are dropped (spec, "Dropped from the concept"), and the pinned desktop version comes in plan 3.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/process-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const section = document.querySelector('[data-process]');
  assert(section, 'Process steps render');
  assert(section.querySelector('h2'), 'Process steps have a section heading');
  const steps = [...section.querySelectorAll('ol > li')];
  assert(steps.length >= 2, 'Each step block is an item of an ordered list');
  steps.forEach((step, i) => {
    assert(step.querySelector('h3'), `Step ${i + 1} has an h3 title`);
    assert(step.querySelector('img, svg'), `Step ${i + 1} shows an image or a placeholder`);
    const number = step.querySelector('[data-step-number]');
    assert(number.textContent.trim() === String(i + 1).padStart(2, '0'), `Step ${i + 1} shows its number`);
    assert(number.getAttribute('aria-hidden') === 'true', 'The visible number is hidden because the list already announces position');
    assert(step.getBoundingClientRect().height > 0, `Step ${i + 1} is visible`);
  });
  return 'process ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/process-check.js`
Expected: FAIL with `Process steps render`.

- [ ] **Step 3: Add the schema strings**

In `locales/en.default.schema.json`, add under `"sections"`:
```json
    "process_steps": {
      "name": "Process steps",
      "heading": "Heading",
      "blocks": {
        "step": {
          "name": "Step",
          "image": "Image",
          "label": "Small label",
          "heading": "Heading",
          "text": "Text",
          "link_label": "Link label",
          "link": "Link"
        }
      }
    },
```

- [ ] **Step 4: Write the section**

`sections/process-steps.liquid`:
```liquid
{%- assign heading_id = 'Process-' | append: section.id -%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  {% if section.settings.heading != blank %}
    aria-labelledby="{{ heading_id }}"
  {% endif %}
  data-process
>
  <div class="wrap">
    {%- if section.settings.heading != blank -%}
      <h2 id="{{ heading_id }}">{{ section.settings.heading | escape }}</h2>
    {%- endif -%}
    <ol class="mt-10 grid gap-14 lg:gap-20" role="list">
      {%- for block in section.blocks -%}
        {%- capture padded -%}0{{ forloop.index }}{%- endcapture -%}
        <li
          class="grid gap-5 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-center md:gap-10"
          {{ block.shopify_attributes }}
        >
          <div class="overflow-hidden">
            {%- if block.settings.image != blank -%}
              {{
                block.settings.image
                | image_url: width: 1280
                | image_tag:
                  widths: '480, 720, 960, 1280',
                  sizes: '(min-width: 64rem) 58vw, (min-width: 48rem) 55vw, 92vw',
                  loading: 'lazy',
                  class: 'aspect-[3/2] w-full object-cover'
              }}
            {%- else -%}
              {{ 'lifestyle-1' | placeholder_svg_tag: 'aspect-[3/2] w-full bg-tint' }}
            {%- endif -%}
          </div>
          <div>
            <p class="flex items-baseline gap-4 text-sm text-muted">
              <span class="font-display text-[1.75rem] text-heading" aria-hidden="true" data-step-number>
                {{- padded | slice: -2, 2 -}}
              </span>
              {{- block.settings.label | escape -}}
            </p>
            <h3 class="mt-3">{{ block.settings.heading | escape }}</h3>
            {%- if block.settings.text != blank -%}
              <p class="mt-4 max-w-[34ch]">{{ block.settings.text | escape | newline_to_br }}</p>
            {%- endif -%}
            {%- if block.settings.link_label != blank and block.settings.link != blank -%}
              <a href="{{ block.settings.link }}" class="mt-3 inline-flex min-h-11 items-center text-muted underline-offset-4 hover:underline">
                {{- block.settings.link_label | escape -}}
              </a>
            {%- endif -%}
          </div>
        </li>
      {%- endfor -%}
    </ol>
  </div>
</section>

{% schema %}
{
  "name": "t:sections.process_steps.name",
  "settings": [
    { "type": "text", "id": "heading", "label": "t:sections.process_steps.heading", "default": "From field to jar" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "dark" }
  ],
  "blocks": [
    {
      "type": "step",
      "name": "t:sections.process_steps.blocks.step.name",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "t:sections.process_steps.blocks.step.image" },
        { "type": "text", "id": "label", "label": "t:sections.process_steps.blocks.step.label", "default": "By hand" },
        { "type": "text", "id": "heading", "label": "t:sections.process_steps.blocks.step.heading", "default": "Picking" },
        { "type": "textarea", "id": "text", "label": "t:sections.process_steps.blocks.step.text", "default": "Say what happens at this step, in one or two sentences." },
        { "type": "text", "id": "link_label", "label": "t:sections.process_steps.blocks.step.link_label" },
        { "type": "url", "id": "link", "label": "t:sections.process_steps.blocks.step.link" }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.process_steps.name",
      "blocks": [
        { "type": "step", "settings": { "label": "By hand", "heading": "Picking" } },
        { "type": "step", "settings": { "label": "The same day", "heading": "Preparing" } },
        { "type": "step", "settings": { "label": "Over a slow fire", "heading": "Cooking" } },
        { "type": "step", "settings": { "label": "Ready for your table", "heading": "Packing" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 5: Add it to the homepage**

In `templates/index.json`, add to `"sections"`:
```json
    "process_steps": {
      "type": "process-steps",
      "blocks": {
        "step_1": { "type": "step", "settings": { "label": "By hand", "heading": "Picking", "text": "Say what happens at this step, in one or two sentences." } },
        "step_2": { "type": "step", "settings": { "label": "The same day", "heading": "Preparing", "text": "Say what happens at this step, in one or two sentences." } },
        "step_3": { "type": "step", "settings": { "label": "Over a slow fire", "heading": "Cooking", "text": "Say what happens at this step, in one or two sentences." } },
        "step_4": { "type": "step", "settings": { "label": "Ready for your table", "heading": "Packing", "text": "Say what happens at this step, in one or two sentences.", "link_label": "See the range", "link": "shopify://collections/shop" } }
      },
      "block_order": ["step_1", "step_2", "step_3", "step_4"],
      "settings": { "heading": "From field to jar", "color_scheme": "dark" }
    }
```
and append `"process_steps"` to `"order"`.

- [ ] **Step 6: Run the checks**

Run: `npm run build && npm run check && agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/process-check.js`
Expected: no Theme Check errors, then `process ok`.

- [ ] **Step 7: Commit**

```bash
git add sections/process-steps.liquid templates/index.json locales tests/browser/process-check.js assets
git commit -m "Add process steps section in its stacked layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 4: featured product section

**Files:**
- Create: `sections/featured-product.liquid`, `tests/browser/featured-product-check.js`
- Modify: `src/ts/product.ts`, `sections/main-product.liquid`, `snippets/buy-buttons.liquid`, `snippets/variant-picker.liquid`, `templates/index.json`, both locale files

**Interfaces:**
- Consumes: snippets `product-price` (`variant`), `variant-picker` (`product`, `form_id`, `block`), `buy-buttons` (`product`, `current_variant`, `form_id`, `block`), `product-variants-json` (`product`) from plan 1; `product.ts` initialises every `[data-product-root]`; `cart.ts` handles every `form[data-product-form]` submit.
- Produces: `data-updates-url` on a product root means "write `?variant=` into the address bar"; only the main product section sets it.

Ported from the concept's `src/components/home/TreacleSelector.astro`. The saved selection and its checkbox are dropped (spec).

- [ ] **Step 1: Write the failing browser check**

`tests/browser/featured-product-check.js`:
```js
(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const waitFor = async (test, message) => {
    const deadline = performance.now() + 8000;
    while (!test()) {
      if (performance.now() > deadline) throw Error(message);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  const root = document.querySelector('[data-featured-product]');
  assert(root, 'Featured product renders');
  assert(root.matches('[data-product-root]'), 'It reuses the product script');
  assert(!root.hasAttribute('data-updates-url'), 'It does not write ?variant= into the homepage address');
  const form = root.querySelector('form[data-product-form]');
  assert(form.getAttribute('action').endsWith('/cart/add'), 'Add to cart is a real form for no-JS buying');
  assert(form.querySelector('[data-quantity-input]').max === '20', 'Quantity goes up to 20');
  assert(root.querySelector('a[href*="/products/"]'), 'It links to the product page');

  const variants = JSON.parse(root.querySelector('[data-product-variants]').textContent);
  const soldOut = variants.find((v) => !v.available);
  const onSale = variants.find((v) => v.available && v.compareHtml !== null);
  const radios = [...root.querySelectorAll('[data-variant-picker] input')];
  const pick = (v) => {
    const target = radios.find((i) => i.value === v.options[0]);
    if (target.checked) radios.find((i) => i !== target).click();
    target.click();
  };
  const before = location.href;
  pick(soldOut);
  assert(root.querySelector('[data-add-button]').disabled, 'A sold out size disables add to cart');
  assert(location.href === before, 'Choosing a size leaves the address alone');
  pick(onSale);
  assert(!root.querySelector('[data-price-was]').hidden, 'A size on sale shows its old price');

  const drawer = document.querySelector('[data-cart-drawer]');
  form.requestSubmit();
  await waitFor(() => drawer.open, 'Adding opens the cart drawer');
  await waitFor(() => drawer.textContent.includes(onSale.options[0]), 'The drawer lists the chosen size');
  drawer.close();
  return 'featured product ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/featured-product-check.js`
Expected: FAIL with `Featured product renders`.

- [ ] **Step 3: Only the main product writes the address**

In `src/ts/product.ts`, replace the last three lines of `update()`:
```ts
    const url = new URL(location.href);
    url.searchParams.set('variant', String(variant.id));
    history.replaceState(history.state, '', url);
```
with:
```ts
    if (root.hasAttribute('data-updates-url')) {
      const url = new URL(location.href);
      url.searchParams.set('variant', String(variant.id));
      history.replaceState(history.state, '', url);
    }
```

In `sections/main-product.liquid`, add `data-updates-url` to the `<section>` after `data-product-root`:
```liquid
  data-product-root
  data-updates-url
>
```

- [ ] **Step 4: Widen the snippet docs**

The featured product passes its section as `block`: sections have `settings.max_quantity` like the buy buttons block, and `section.shopify_attributes` is empty, which is what a section needs. In `snippets/buy-buttons.liquid` replace the `block` line with:
```liquid
  @param {object} block - The buy buttons block, or a section with a max_quantity setting
```
In `snippets/variant-picker.liquid` replace the `block` line with:
```liquid
  @param {object} block - The variant picker block, or the section that holds the picker
```

- [ ] **Step 5: Add the locale strings**

In `locales/en.default.json`, add `"details": "Product details"` to `"products"`, and a top-level key after `"video"`:
```json
  "onboarding": {
    "featured_product": "Pick a product for this section in the theme editor.",
    "product_title": "Example product"
  },
```

In `locales/en.default.schema.json`, add under `"sections"`:
```json
    "featured_product": {
      "name": "Featured product",
      "heading": "Heading",
      "product": "Product",
      "max_quantity": "Largest quantity per add"
    },
```

- [ ] **Step 6: Write the section**

`sections/featured-product.liquid`:
```liquid
{%- liquid
  assign featured_product = section.settings.product
  assign current_variant = featured_product.selected_or_first_available_variant
  assign form_id = 'ProductForm-' | append: section.id
  assign title_id = 'FeaturedProduct-' | append: section.id
  assign media = current_variant.featured_media | default: featured_product.featured_media
  assign title_tag = 'h2'
  if section.settings.heading != blank
    assign title_tag = 'h3'
  endif
-%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  aria-labelledby="{{ title_id }}"
  data-featured-product
  data-product-root
>
  <div class="wrap">
    {%- if section.settings.heading != blank -%}
      <h2 class="mb-8">{{ section.settings.heading | escape }}</h2>
    {%- endif -%}
    {%- if featured_product == blank -%}
      <p id="{{ title_id }}">{{ 'onboarding.featured_product' | t }}</p>
    {%- else -%}
      <div class="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-center md:gap-10">
        <div class="aspect-square overflow-hidden bg-white">
          {%- if media -%}
            {{
              media
              | image_url: width: 900
              | image_tag:
                widths: '360, 540, 720, 900',
                sizes: '(min-width: 48rem) 40vw, 100vw',
                loading: 'lazy',
                class: 'size-full object-contain'
            }}
          {%- else -%}
            {{ 'product-1' | placeholder_svg_tag: 'size-full' }}
          {%- endif -%}
        </div>
        <div class="flex min-w-0 flex-col gap-4">
          <{{ title_tag }} id="{{ title_id }}" class="text-card">{{ featured_product.title | escape }}</{{ title_tag }}>
          {% render 'product-price', variant: current_variant %}
          <a href="{{ featured_product.url }}" class="inline-flex min-h-11 items-center self-start underline underline-offset-4">
            {{- 'products.details' | t -}}
          </a>
          {% render 'variant-picker', product: featured_product, form_id: form_id, block: section %}
          {% render 'buy-buttons',
            product: featured_product,
            current_variant: current_variant,
            form_id: form_id,
            block: section
          %}
        </div>
      </div>
      {% render 'product-variants-json', product: featured_product %}
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "t:sections.featured_product.name",
  "settings": [
    { "type": "text", "id": "heading", "label": "t:sections.featured_product.heading", "default": "Our best seller" },
    { "type": "product", "id": "product", "label": "t:sections.featured_product.product" },
    { "type": "range", "id": "max_quantity", "label": "t:sections.featured_product.max_quantity", "min": 1, "max": 99, "step": 1, "default": 20 },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "band" }
  ],
  "presets": [{ "name": "t:sections.featured_product.name" }]
}
{% endschema %}
```

The heading falls back to h2 for the product title when the section heading is blank, so no level is skipped either way. The `band` scheme default matches the concept's red shop band; check in Step 9 that the price, sale stamp and option boxes read on it.

- [ ] **Step 7: Add it to the homepage**

In `templates/index.json`, add to `"sections"`:
```json
    "featured_product": {
      "type": "featured-product",
      "settings": { "heading": "Our best seller", "product": "kithul-treacle", "max_quantity": 20, "color_scheme": "band" }
    }
```
and append `"featured_product"` to `"order"`.

- [ ] **Step 8: Run the checks**

Run: `npm run build && npm run typecheck && npm test && npm run check && agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/featured-product-check.js`
Expected: no errors, unit tests pass, then `featured product ok`.

Then rerun plan 1's product checks to confirm the main product still writes the address: open `http://127.0.0.1:9292/products/kithul-treacle` and run `tests/browser/product-check.js` and `tests/browser/product-cart-check.js`. Expected: both `ok`.

- [ ] **Step 9: Check by hand**

On the homepage at 390 px and 1440 px: the price, the struck-out price, the sale stamp, the option boxes and the add button are all readable on the band scheme, and focus rings show on every control. With JavaScript off (`agent-browser --session theme open http://127.0.0.1:9292/ --disable-javascript`, or Chrome DevTools > Settings > Debugger > Disable JavaScript), the noscript size select shows and Add to cart lands on `/cart` with the item. Clear the cart afterwards.

- [ ] **Step 10: Commit**

```bash
git add sections/featured-product.liquid sections/main-product.liquid snippets src/ts assets templates/index.json locales tests/browser/featured-product-check.js
git commit -m "Add featured product section reusing the product page buy box

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 5: product grid section

**Files:**
- Create: `sections/product-grid.liquid`, `tests/browser/product-grid-check.js`
- Modify: `snippets/product-card.liquid`, `templates/index.json`, `locales/en.default.schema.json`

**Interfaces:**
- Consumes: `{% render 'product-card', product: p, sizes: '...', heading_tag: 'h3' %}` from plan 1; locale key `onboarding.product_title` from Task 4.
- Produces: `product-card` takes `image_fit` (`contain` default, or `cover`).

Ported from the concept's `src/components/home/Shop.astro` ("More from the palm" grid). The spec's "card style" setting is the image fit: `contain` shows the whole pack on a white ground, `cover` crops photos to fill the square.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/product-grid-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const grid = document.querySelector('[data-product-grid]');
  assert(grid, 'Product grid renders');
  const heading = grid.querySelector('h2');
  assert(heading, 'The grid has a section heading');
  const cards = [...grid.querySelectorAll('.product-card')];
  const limit = Number(grid.dataset.limit);
  assert(cards.length >= 2 && cards.length <= limit, `The grid shows between 2 and ${limit} cards`);
  assert(cards.every((card) => card.querySelector('h3 a[href*="/products/"]')), 'Each card title is an h3 link under the h2');
  return 'product grid ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/product-grid-check.js`
Expected: FAIL with `Product grid renders`.

- [ ] **Step 3: Add the image fit parameter to the card**

In `snippets/product-card.liquid`, add to the doc block after the `heading_tag` line:
```liquid
  @param {string} [image_fit] - contain (default) shows the whole image on white, cover crops it to fill the square
```
In the `liquid` tag, add after `assign card_heading = ...`:
```liquid
  assign image_class = 'size-full object-contain transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none'
  if image_fit == 'cover'
    assign image_class = 'size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none'
  endif
```
and replace the image tag's `class:` line with `class: image_class`.

- [ ] **Step 4: Add the schema strings**

In `locales/en.default.schema.json`, add under `"sections"`:
```json
    "product_grid": {
      "name": "Product grid",
      "heading": "Heading",
      "text": "Text",
      "collection": "Collection",
      "products_to_show": "Products to show",
      "image_fit": "Card images",
      "contain": "Show the whole image",
      "cover": "Fill the card"
    },
```

- [ ] **Step 5: Write the section**

`sections/product-grid.liquid`:
```liquid
{%- liquid
  assign heading_id = 'ProductGrid-' | append: section.id
  assign limit = section.settings.products_to_show
  assign grid_collection = section.settings.collection
-%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  {% if section.settings.heading != blank %}
    aria-labelledby="{{ heading_id }}"
  {% endif %}
  data-product-grid
  data-limit="{{ limit }}"
>
  <div class="wrap">
    <div class="grid gap-6 lg:grid-cols-2 lg:items-start">
      {%- if section.settings.heading != blank -%}
        <h2 id="{{ heading_id }}">{{ section.settings.heading | escape }}</h2>
      {%- endif -%}
      {%- if section.settings.text != blank -%}
        <div class="rte max-w-prose">{{ section.settings.text }}</div>
      {%- endif -%}
    </div>
    <ul class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:mt-12 lg:grid-cols-4 lg:gap-x-8" role="list">
      {%- if grid_collection != blank -%}
        {%- for product in grid_collection.products limit: limit -%}
          <li>
            {% render 'product-card',
              product: product,
              heading_tag: 'h3',
              image_fit: section.settings.image_fit
            %}
          </li>
        {%- endfor -%}
      {%- else -%}
        {%- for i in (1..limit) -%}
          <li>
            <article class="product-card flex flex-col">
              <div class="aspect-square overflow-hidden bg-white">
                {{ 'product-' | append: i | placeholder_svg_tag: 'size-full' }}
              </div>
              <h3 class="mt-3 text-card">{{ 'onboarding.product_title' | t }}</h3>
              <p class="tabular mt-1">{{ 1999 | money }}</p>
            </article>
          </li>
        {%- endfor -%}
      {%- endif -%}
    </ul>
  </div>
</section>

{% schema %}
{
  "name": "t:sections.product_grid.name",
  "settings": [
    { "type": "text", "id": "heading", "label": "t:sections.product_grid.heading", "default": "The range" },
    { "type": "richtext", "id": "text", "label": "t:sections.product_grid.text" },
    { "type": "collection", "id": "collection", "label": "t:sections.product_grid.collection" },
    { "type": "range", "id": "products_to_show", "label": "t:sections.product_grid.products_to_show", "min": 2, "max": 6, "step": 1, "default": 4 },
    {
      "type": "select",
      "id": "image_fit",
      "label": "t:sections.product_grid.image_fit",
      "default": "contain",
      "options": [
        { "value": "contain", "label": "t:sections.product_grid.contain" },
        { "value": "cover", "label": "t:sections.product_grid.cover" }
      ]
    },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "presets": [{ "name": "t:sections.product_grid.name" }]
}
{% endschema %}
```

The range setting stops at 6 because Shopify's placeholder SVGs run `product-1` to `product-6`.

- [ ] **Step 6: Add it to the homepage**

In `templates/index.json`, add to `"sections"`:
```json
    "product_grid": {
      "type": "product-grid",
      "settings": {
        "heading": "The range",
        "text": "<p>Everything we make, in the sizes we sell.</p>",
        "collection": "shop",
        "products_to_show": 4,
        "image_fit": "contain",
        "color_scheme": "light"
      }
    }
```
and append `"product_grid"` to `"order"`.

- [ ] **Step 7: Run the checks**

Run: `npm run build && npm run check && agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/product-grid-check.js`
Expected: no Theme Check errors, then `product grid ok`. Then open `http://127.0.0.1:9292/collections/all` and run `tests/browser/browse-check.js`: `browse ok`, so the card change did not break the collection page.

- [ ] **Step 8: Check the empty state by hand**

In the theme editor, clear the grid's collection. Expected: the chosen number of placeholder cards, each titled "Example product". Set the collection back to Shop.

- [ ] **Step 9: Commit**

```bash
git add sections/product-grid.liquid snippets/product-card.liquid templates/index.json locales tests/browser/product-grid-check.js assets
git commit -m "Add product grid section with an image fit setting for cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 6: certifications and trust strip sections

**Files:**
- Create: `sections/certifications.liquid`, `sections/trust-strip.liquid`, `tests/browser/trust-check.js`
- Modify: `templates/index.json`, `locales/en.default.schema.json`

**Interfaces:**
- Consumes: `.wrap`, `.rte` from `src/css/theme.css`.
- Produces: nothing used by later tasks.

Certifications is ported from the concept's `src/components/home/Quality.astro` (spec sheet rows). The trust strip replaces `TradeStrip.astro`'s shipping-mark table with the spec's plain row of short text blocks.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/trust-check.js`:
```js
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
    if (logo) assert(logo.getAttribute('alt') === '', 'Logos are decorative because the name sits beside them');
  });

  const strip = document.querySelector('[data-trust-strip]');
  assert(strip, 'Trust strip renders');
  const items = strip.querySelectorAll('ul > li');
  assert(items.length >= 2, 'Each trust block is a list item');
  assert([...items].every((item) => item.textContent.trim() !== ''), 'Every trust item has text');
  return 'trust ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/trust-check.js`
Expected: FAIL with `Certifications render`.

- [ ] **Step 3: Add the schema strings**

In `locales/en.default.schema.json`, add under `"sections"`:
```json
    "certifications": {
      "name": "Certifications",
      "heading": "Heading",
      "text": "Text",
      "blocks": {
        "certification": {
          "name": "Certification",
          "image": "Logo",
          "title": "Name",
          "text": "Text",
          "link": "Link",
          "link_info": "For example the certificate or the certifier's register entry."
        }
      }
    },
    "trust_strip": {
      "name": "Trust strip",
      "blocks": {
        "item": {
          "name": "Text",
          "text": "Text"
        }
      }
    },
```

- [ ] **Step 4: Write the certifications section**

`sections/certifications.liquid`:
```liquid
{%- assign heading_id = 'Certifications-' | append: section.id -%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  {% if section.settings.heading != blank %}
    aria-labelledby="{{ heading_id }}"
  {% endif %}
  data-certifications
>
  <div class="wrap grid gap-10 lg:grid-cols-12 lg:gap-x-6">
    <div class="lg:col-span-5">
      {%- if section.settings.heading != blank -%}
        <h2 id="{{ heading_id }}">{{ section.settings.heading | escape }}</h2>
      {%- endif -%}
      {%- if section.settings.text != blank -%}
        <div class="rte mt-4 text-lg">{{ section.settings.text }}</div>
      {%- endif -%}
    </div>
    <ul class="border-b border-ink lg:col-span-7 lg:col-start-6" role="list">
      {%- for block in section.blocks -%}
        <li
          class="grid grid-cols-[4rem_1fr] gap-x-5 gap-y-2 border-t border-ink py-6 sm:grid-cols-[5rem_12rem_1fr] sm:items-center sm:gap-x-8 sm:py-8"
          {{ block.shopify_attributes }}
        >
          <div class="row-span-2 self-start sm:row-span-1 sm:self-center">
            {%- if block.settings.image != blank -%}
              {{
                block.settings.image
                | image_url: width: 160
                | image_tag: widths: '80, 160', sizes: '80px', loading: 'lazy', alt: '', class: 'h-auto w-16 object-contain sm:w-20'
              }}
            {%- endif -%}
          </div>
          <h3 class="text-card">
            {%- if block.settings.link != blank -%}
              <a href="{{ block.settings.link }}" class="underline underline-offset-4">{{ block.settings.title | escape }}</a>
            {%- else -%}
              {{ block.settings.title | escape }}
            {%- endif -%}
          </h3>
          {%- if block.settings.text != blank -%}
            <p class="text-heading">{{ block.settings.text | escape }}</p>
          {%- endif -%}
        </li>
      {%- endfor -%}
    </ul>
  </div>
</section>

{% schema %}
{
  "name": "t:sections.certifications.name",
  "settings": [
    { "type": "text", "id": "heading", "label": "t:sections.certifications.heading", "default": "Quality and certifications" },
    { "type": "richtext", "id": "text", "label": "t:sections.certifications.text", "default": "<p>The standards we are checked against.</p>" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "blocks": [
    {
      "type": "certification",
      "name": "t:sections.certifications.blocks.certification.name",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "t:sections.certifications.blocks.certification.image" },
        { "type": "text", "id": "title", "label": "t:sections.certifications.blocks.certification.title", "default": "Food safety certificate" },
        { "type": "textarea", "id": "text", "label": "t:sections.certifications.blocks.certification.text", "default": "Say what the certificate covers and who issued it." },
        { "type": "url", "id": "link", "label": "t:sections.certifications.blocks.certification.link", "info": "t:sections.certifications.blocks.certification.link_info" }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.certifications.name",
      "blocks": [{ "type": "certification" }, { "type": "certification" }]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 5: Write the trust strip section**

`sections/trust-strip.liquid`:
```liquid
<div class="color-{{ section.settings.color_scheme }}" data-trust-strip>
  <ul
    class="wrap flex flex-wrap items-center justify-center gap-x-10 gap-y-2 py-4 text-center text-sm font-semibold"
    role="list"
  >
    {%- for block in section.blocks -%}
      <li {{ block.shopify_attributes }}>{{ block.settings.text }}</li>
    {%- endfor -%}
  </ul>
</div>

{% schema %}
{
  "name": "t:sections.trust_strip.name",
  "max_blocks": 6,
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "band" }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "t:sections.trust_strip.blocks.item.name",
      "settings": [
        { "type": "inline_richtext", "id": "text", "label": "t:sections.trust_strip.blocks.item.text", "default": "Packed by hand" }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.trust_strip.name",
      "blocks": [
        { "type": "item", "settings": { "text": "Packed by hand" } },
        { "type": "item", "settings": { "text": "Ships worldwide" } },
        { "type": "item", "settings": { "text": "Trade prices on request" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 6: Add both to the homepage**

In `templates/index.json`, add to `"sections"`:
```json
    "trust_strip": {
      "type": "trust-strip",
      "blocks": {
        "item_1": { "type": "item", "settings": { "text": "Packed by hand" } },
        "item_2": { "type": "item", "settings": { "text": "Ships worldwide" } },
        "item_3": { "type": "item", "settings": { "text": "Trade prices on request" } }
      },
      "block_order": ["item_1", "item_2", "item_3"],
      "settings": { "color_scheme": "band" }
    },
    "certifications": {
      "type": "certifications",
      "blocks": {
        "cert_1": { "type": "certification", "settings": { "title": "Food safety certificate", "text": "Say what the certificate covers and who issued it." } },
        "cert_2": { "type": "certification", "settings": { "title": "Export licence", "text": "Say what the licence covers and who issued it." } }
      },
      "block_order": ["cert_1", "cert_2"],
      "settings": {
        "heading": "Quality and certifications",
        "text": "<p>The standards we are checked against.</p>",
        "color_scheme": "light"
      }
    }
```
and append `"trust_strip", "certifications"` to `"order"`.

- [ ] **Step 7: Run the checks**

Run: `npm run build && npm run check && agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/trust-check.js`
Expected: no Theme Check errors, then `trust ok`.

- [ ] **Step 8: Commit**

```bash
git add sections/certifications.liquid sections/trust-strip.liquid templates/index.json locales tests/browser/trust-check.js assets
git commit -m "Add certifications and trust strip sections

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 7: video section

**Files:**
- Create: `sections/video.liquid`, `tests/browser/video-check.js`
- Modify: `src/ts/video.ts`, `templates/index.json`, both locale files

**Interfaces:**
- Consumes: `src/ts/video.ts` and `registerSection` (Task 1); icon `play` (Task 1); locale key `video.play` (Task 1).
- Produces: nothing used by later tasks.

Ported from the concept's `src/components/home/VideoSlot.astro`. A Shopify-hosted video uses native controls. A YouTube or Vimeo video shows the cover image as a link to the video, so it works without JavaScript; with JavaScript a click swaps in the player, so no third-party script loads until the visitor asks for it.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/video-check.js`:
```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/video-check.js`
Expected: FAIL with `Video section renders`.

- [ ] **Step 3: Add the locale strings**

In `locales/en.default.json`, add `"title": "Video"` to `"video"`.

In `locales/en.default.schema.json`, add under `"sections"`:
```json
    "video": {
      "name": "Video",
      "heading": "Heading",
      "video": "Shopify-hosted video",
      "video_url": "YouTube or Vimeo link",
      "video_url_info": "Used when no Shopify-hosted video is chosen.",
      "cover_image": "Cover image",
      "cover_image_info": "Shown over a YouTube or Vimeo video until it is played."
    },
```

- [ ] **Step 4: Write the section**

`sections/video.liquid`:
```liquid
{%- liquid
  assign heading_id = 'Video-' | append: section.id
  assign external = section.settings.video_url
  assign frame_title = section.settings.heading
  if section.settings.heading == blank
    assign frame_title = 'video.title' | t
  endif
  if external.type == 'youtube'
    assign embed_url = 'https://www.youtube-nocookie.com/embed/' | append: external.id | append: '?autoplay=1&rel=0'
  elsif external.type == 'vimeo'
    assign embed_url = 'https://player.vimeo.com/video/' | append: external.id | append: '?autoplay=1'
  endif
-%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  {% if section.settings.heading != blank %}
    aria-labelledby="{{ heading_id }}"
  {% endif %}
  data-video-root
>
  <div class="wrap">
    {%- if section.settings.heading != blank -%}
      <h2 id="{{ heading_id }}" class="mb-8">{{ section.settings.heading | escape }}</h2>
    {%- endif -%}
    <div class="relative aspect-video overflow-hidden bg-tint">
      {%- if section.settings.video != blank -%}
        {{
          section.settings.video
          | video_tag: image_size: '1600x', controls: true, preload: 'none', playsinline: true, class: 'size-full object-cover'
        }}
      {%- elsif embed_url -%}
        <a href="{{ external }}" class="group block size-full" data-video-embed>
          {%- if section.settings.cover_image != blank -%}
            {{
              section.settings.cover_image
              | image_url: width: 1600
              | image_tag:
                widths: '480, 720, 960, 1280, 1600',
                sizes: '(min-width: 80rem) 76rem, 100vw',
                loading: 'lazy',
                alt: '',
                class: 'size-full object-cover'
            }}
          {%- else -%}
            {{ 'lifestyle-2' | placeholder_svg_tag: 'size-full' }}
          {%- endif -%}
          <span class="btn btn-primary absolute bottom-4 left-4 group-hover:bg-ink group-hover:text-ground">
            {% render 'icon', name: 'play', size: 18 %}
            {{ 'video.play' | t }}<span class="sr-only">: {{ frame_title | escape }}</span>
          </span>
        </a>
        <template data-video-frame>
          <iframe
            src="{{ embed_url }}"
            title="{{ frame_title | escape }}"
            class="absolute inset-0 size-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowfullscreen
          ></iframe>
        </template>
      {%- else -%}
        {{ 'lifestyle-2' | placeholder_svg_tag: 'size-full' }}
      {%- endif -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "t:sections.video.name",
  "settings": [
    { "type": "text", "id": "heading", "label": "t:sections.video.heading", "default": "See how it is made" },
    { "type": "video", "id": "video", "label": "t:sections.video.video" },
    {
      "type": "video_url",
      "id": "video_url",
      "accept": ["youtube", "vimeo"],
      "label": "t:sections.video.video_url",
      "info": "t:sections.video.video_url_info",
      "default": "https://www.youtube.com/watch?v=_9VUPq3SxOc"
    },
    { "type": "image_picker", "id": "cover_image", "label": "t:sections.video.cover_image", "info": "t:sections.video.cover_image_info" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "presets": [{ "name": "t:sections.video.name" }]
}
{% endschema %}
```

- [ ] **Step 5: Add the embed loader to the video script**

Append to `src/ts/video.ts`:
```ts

registerSection('[data-video-root]', (root, signal) => {
  const link = root.querySelector<HTMLAnchorElement>('[data-video-embed]');
  const template = root.querySelector<HTMLTemplateElement>('[data-video-frame]');
  if (!link || !template) return;
  link.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      link.replaceWith(template.content.cloneNode(true));
      // The link that had focus is gone; moving focus to the player keeps keyboard users in place.
      root.querySelector('iframe')?.focus();
    },
    { signal },
  );
});
```

- [ ] **Step 6: Add it to the homepage**

In `templates/index.json`, add to `"sections"`:
```json
    "video": {
      "type": "video",
      "settings": {
        "heading": "See how it is made",
        "video_url": "https://www.youtube.com/watch?v=_9VUPq3SxOc",
        "color_scheme": "light"
      }
    }
```
and append `"video"` to `"order"`.

- [ ] **Step 7: Run the checks**

Run: `npm run build && npm run typecheck && npm run check && agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/video-check.js`
Expected: no errors, then `video ok`.

- [ ] **Step 8: Check by hand**

Tab to the video's Play button and press Enter. Expected: the player loads in place, takes focus, and starts. In the theme editor, choose a Shopify-hosted video: native controls show and nothing autoplays. Switch the link to a Vimeo URL: the cover link and the player both work. Restore the YouTube link and clear the Shopify video.

- [ ] **Step 9: Commit**

```bash
git add sections/video.liquid src/ts/video.ts assets templates/index.json locales tests/browser/video-check.js
git commit -m "Add video section that loads YouTube or Vimeo on click

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 8: FAQ and reviews sections

**Files:**
- Create: `sections/faq.liquid`, `sections/reviews.liquid`, `tests/browser/faq-check.js`, `tests/browser/reviews-check.js`
- Modify: `templates/index.json`, `templates/product.json`, `locales/en.default.schema.json`

**Interfaces:**
- Consumes: icon `plus` from plan 1.
- Produces: `faq` section with `question` blocks (plan 3 adds the product metafield setting to it); `reviews` section on the product template.

- [ ] **Step 1: Write the failing browser checks**

`tests/browser/faq-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const faq = document.querySelector('[data-faq]');
  assert(faq, 'FAQ renders');
  assert(faq.querySelector('h2'), 'FAQ has a section heading');
  const items = [...faq.querySelectorAll('details')];
  assert(items.length >= 2, 'Each question is a details element');
  assert(items.every((item) => !item.open), 'Answers start closed');
  const summary = items[0].querySelector('summary');
  assert(summary.textContent.trim() !== '', 'The question is the summary text');
  assert(summary.getBoundingClientRect().height >= 44, 'The question is a 44px touch target');
  summary.click();
  assert(items[0].open, 'Clicking the question opens the answer');
  assert(items[0].querySelector('.rte').textContent.trim() !== '', 'The answer has text');
  summary.click();
  return 'faq ok';
})();
```

`tests/browser/reviews-check.js` (run on a product page):
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const wrapper = [...document.querySelectorAll('.shopify-section')].find((el) => el.id.endsWith('__reviews'));
  assert(wrapper, 'The product template includes the reviews section');
  assert(wrapper.textContent.trim() === '' && wrapper.children.length === 0, 'With no app block the section renders nothing');
  return 'reviews ok';
})();
```

- [ ] **Step 2: Run them to verify they fail**

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/faq-check.js`
Expected: FAIL with `FAQ renders`.

Run: `agent-browser --session theme open http://127.0.0.1:9292/products/kithul-treacle && agent-browser --session theme eval --stdin < tests/browser/reviews-check.js`
Expected: FAIL with `The product template includes the reviews section`.

- [ ] **Step 3: Add the schema strings**

In `locales/en.default.schema.json`, add under `"sections"`:
```json
    "faq": {
      "name": "FAQ",
      "heading": "Heading",
      "text": "Text",
      "blocks": {
        "question": {
          "name": "Question",
          "question": "Question",
          "answer": "Answer"
        }
      }
    },
    "reviews": {
      "name": "Reviews",
      "info": "Add the block from your reviews app. Nothing shows until you do."
    },
```

- [ ] **Step 4: Write the FAQ section**

`sections/faq.liquid`:
```liquid
{%- assign heading_id = 'Faq-' | append: section.id -%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  {% if section.settings.heading != blank %}
    aria-labelledby="{{ heading_id }}"
  {% endif %}
  data-faq
>
  <div class="wrap max-w-3xl">
    {%- if section.settings.heading != blank -%}
      <h2 id="{{ heading_id }}">{{ section.settings.heading | escape }}</h2>
    {%- endif -%}
    {%- if section.settings.text != blank -%}
      <div class="rte mt-4 text-lg">{{ section.settings.text }}</div>
    {%- endif -%}
    <div class="mt-8 border-t border-line">
      {%- for block in section.blocks -%}
        <details class="group border-b border-line" {{ block.shopify_attributes }}>
          <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            <span>{{ block.settings.question | escape }}</span>
            {% render 'icon',
              name: 'plus',
              size: 20,
              class: 'shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none'
            %}
          </summary>
          <div class="rte max-w-prose pb-6">{{ block.settings.answer }}</div>
        </details>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "t:sections.faq.name",
  "settings": [
    { "type": "text", "id": "heading", "label": "t:sections.faq.heading", "default": "Questions" },
    { "type": "richtext", "id": "text", "label": "t:sections.faq.text" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "blocks": [
    {
      "type": "question",
      "name": "t:sections.faq.blocks.question.name",
      "settings": [
        { "type": "text", "id": "question", "label": "t:sections.faq.blocks.question.question", "default": "How long does delivery take?" },
        { "type": "richtext", "id": "answer", "label": "t:sections.faq.blocks.question.answer", "default": "<p>Say how long orders take to reach each place you ship to.</p>" }
      ]
    }
  ],
  "presets": [
    {
      "name": "t:sections.faq.name",
      "blocks": [
        { "type": "question", "settings": { "question": "How long does delivery take?", "answer": "<p>Say how long orders take to reach each place you ship to.</p>" } },
        { "type": "question", "settings": { "question": "How should I store it?", "answer": "<p>Say how to store it before and after opening.</p>" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 5: Write the reviews section**

`sections/reviews.liquid`:
```liquid
{%- if section.blocks.size > 0 -%}
  <div class="color-{{ section.settings.color_scheme }} py-12 lg:py-16">
    <div class="wrap">
      {%- for block in section.blocks -%}
        {% render block %}
      {%- endfor -%}
    </div>
  </div>
{%- endif -%}

{% schema %}
{
  "name": "t:sections.reviews.name",
  "settings": [
    { "type": "paragraph", "content": "t:sections.reviews.info" },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "blocks": [{ "type": "@app" }],
  "presets": [{ "name": "t:sections.reviews.name" }]
}
{% endschema %}
```

- [ ] **Step 6: Add them to the templates**

In `templates/index.json`, add to `"sections"`:
```json
    "faq": {
      "type": "faq",
      "blocks": {
        "question_1": { "type": "question", "settings": { "question": "How long does delivery take?", "answer": "<p>Say how long orders take to reach each place you ship to.</p>" } },
        "question_2": { "type": "question", "settings": { "question": "How should I store it?", "answer": "<p>Say how to store it before and after opening.</p>" } },
        "question_3": { "type": "question", "settings": { "question": "Do you sell to shops and restaurants?", "answer": "<p>Yes. Use the trade form below and we will reply with prices.</p>" } }
      },
      "block_order": ["question_1", "question_2", "question_3"],
      "settings": { "heading": "Questions", "color_scheme": "light" }
    }
```
and append `"faq"` to `"order"`.

In `templates/product.json`, add to `"sections"` after `"main"`:
```json
    "reviews": {
      "type": "reviews",
      "settings": { "color_scheme": "light" }
    }
```
and change `"order"` to `["main", "reviews"]`.

- [ ] **Step 7: Run the checks**

Run: `npm run build && npm run check`, then the two browser checks from Step 2.
Expected: no Theme Check errors, then `faq ok` and `reviews ok`.

- [ ] **Step 8: Check the keyboard by hand**

Tab to the first question, press Enter, then Space. Expected: the answer opens, then closes, the plus turns into a cross while open, and the focus ring stays on the question.

- [ ] **Step 9: Commit**

```bash
git add sections/faq.liquid sections/reviews.liquid templates locales tests/browser/faq-check.js tests/browser/reviews-check.js assets
git commit -m "Add FAQ section and an app block slot for reviews

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 9: contact form section for wholesale and the contact page

**Files:**
- Create: `sections/contact-form.liquid`, `snippets/contact-field.liquid`, `templates/page.contact.json`, `tests/browser/contact-form-check.js`
- Modify: `templates/index.json`, both locale files

**Interfaces:**
- Consumes: `.field`, `.field-error`, `.btn-primary` from `src/css/theme.css`; locale key `general.error` from plan 1.
- Produces: `{% render 'contact-field', form_id: f, name: 'email', label: l, type: 'email', autocomplete: 'email', required: true, value: v, error: e %}`.

Ported from the concept's `src/components/home/Wholesale.astro` and `WholesaleForm.astro`. The spec's field names are kept: `contact[business]`, `contact[country]`, `contact[volume]`, `contact[body]`, plus `contact[email]`, which Shopify's contact form needs to send a reply address. The "I would like" checkboxes and the volume unit select are dropped: the volume is one text field, so "200 bottles" or "3 cartons" both fit.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/contact-form-check.js` (run on the homepage and on the contact page):
```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/contact-form-check.js`
Expected: FAIL with `Contact form renders`.

- [ ] **Step 3: Add the locale strings**

In `locales/en.default.json`, add a top-level key after `"onboarding"`:
```json
  "contact": {
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "business": "Business name",
    "country": "Country",
    "volume": "Expected volume a month",
    "volume_hint": "For example 200 bottles or 3 cartons.",
    "message": "Message",
    "optional": "(optional)",
    "submit": "Send",
    "success": "Thanks for your message. We will reply by email."
  },
```

In `locales/en.default.schema.json`, add under `"sections"`:
```json
    "contact_form": {
      "name": "Contact form",
      "wholesale_preset": "Wholesale inquiry",
      "heading": "Heading",
      "text": "Text",
      "trade_fields": "Ask for business details",
      "trade_fields_info": "Replaces name and phone with business name, country and expected volume, for wholesale inquiries. Submissions arrive at the store's sender email."
    },
```

- [ ] **Step 4: Write the field snippet**

`snippets/contact-field.liquid`:
```liquid
{% doc %}
  One labelled field of the contact form section.

  @param {string} form_id - Id of the form, prefixes the field id so two forms on a page never share ids
  @param {string} name - Key inside contact[...], for example email or body
  @param {string} label - Visible label
  @param {string} [type] - Input type, or textarea (default text)
  @param {string} [autocomplete] - Autocomplete token
  @param {boolean} [required] - Whether the field must be filled in. Optional fields say so in the label.
  @param {string} [value] - Value to restore after a failed submit
  @param {string} [hint] - Help text under the field
  @param {string} [error] - Error message for this field
  @param {string} [class] - Extra classes for the wrapper
{% enddoc %}
{%- liquid
  assign field_id = form_id | append: '-' | append: name
  assign field_type = type | default: 'text'
  assign described_by = ''
  if hint != blank
    assign described_by = field_id | append: '-hint'
  endif
  if error != blank
    assign described_by = described_by | append: ' ' | append: field_id | append: '-error' | strip
  endif
-%}
<div class="field {{ class }}">
  <label for="{{ field_id }}">
    {{- label -}}
    {%- unless required %} <span class="font-normal text-muted">{{ 'contact.optional' | t }}</span>{% endunless -%}
  </label>
  {%- if field_type == 'textarea' -%}
    <textarea
      id="{{ field_id }}"
      name="contact[{{ name }}]"
      rows="5"
      {% if required %}
        required
      {% endif %}
      {% if described_by != blank %}
        aria-describedby="{{ described_by }}"
      {% endif %}
      {% if error != blank %}
        aria-invalid="true"
      {% endif %}
    >{{ value | escape }}</textarea>
  {%- else -%}
    <input
      id="{{ field_id }}"
      type="{{ field_type }}"
      name="contact[{{ name }}]"
      value="{{ value | escape }}"
      {% if autocomplete != blank %}
        autocomplete="{{ autocomplete }}"
      {% endif %}
      {% if required %}
        required
      {% endif %}
      {% if described_by != blank %}
        aria-describedby="{{ described_by }}"
      {% endif %}
      {% if error != blank %}
        aria-invalid="true"
      {% endif %}
    >
  {%- endif -%}
  {%- if hint != blank -%}
    <p id="{{ field_id }}-hint" class="text-sm text-muted">{{ hint }}</p>
  {%- endif -%}
  {%- if error != blank -%}
    <p id="{{ field_id }}-error" class="field-error">
      <span aria-hidden="true">!</span><span class="sr-only">{{ 'general.error' | t }}</span>
      {{ error }}
    </p>
  {%- endif -%}
</div>
```

- [ ] **Step 5: Write the section**

`sections/contact-form.liquid`:
```liquid
{%- liquid
  assign form_id = 'ContactForm-' | append: section.id
  assign heading_id = form_id | append: '-heading'
  assign trade = section.settings.trade_fields
-%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  {% if section.settings.heading != blank %}
    aria-labelledby="{{ heading_id }}"
  {% endif %}
>
  <div class="wrap grid gap-10 lg:grid-cols-12 lg:gap-x-6">
    <div class="lg:col-span-5">
      {%- if section.settings.heading != blank -%}
        <h2 id="{{ heading_id }}">{{ section.settings.heading | escape }}</h2>
      {%- endif -%}
      {%- if section.settings.text != blank -%}
        <div class="rte mt-4 text-lg">{{ section.settings.text }}</div>
      {%- endif -%}
    </div>
    <div class="lg:col-span-7">
      {%- form 'contact', id: form_id, class: 'grid gap-5 sm:grid-cols-2' -%}
        {%- liquid
          assign email_error = ''
          if form.errors contains 'email'
            assign email_error = form.errors.translated_fields['email'] | capitalize | append: ' ' | append: form.errors.messages['email']
          endif
          assign body_error = ''
          if form.errors contains 'body'
            assign body_error = form.errors.translated_fields['body'] | capitalize | append: ' ' | append: form.errors.messages['body']
          endif
          assign label_name = 'contact.name' | t
          assign label_email = 'contact.email' | t
          assign label_phone = 'contact.phone' | t
          assign label_business = 'contact.business' | t
          assign label_country = 'contact.country' | t
          assign label_volume = 'contact.volume' | t
          assign label_message = 'contact.message' | t
          assign hint_volume = 'contact.volume_hint' | t
        -%}
        {%- if form.posted_successfully? -%}
          <p class="border border-line bg-tint p-4 font-semibold sm:col-span-2" role="status">{{ 'contact.success' | t }}</p>
        {%- endif -%}
        {%- if trade -%}
          {% render 'contact-field', form_id: form_id, name: 'business', label: label_business, autocomplete: 'organization', required: true %}
          {% render 'contact-field', form_id: form_id, name: 'email', label: label_email, type: 'email', autocomplete: 'email', required: true, value: form.email, error: email_error %}
          {% render 'contact-field', form_id: form_id, name: 'country', label: label_country, autocomplete: 'country-name', required: true %}
          {% render 'contact-field', form_id: form_id, name: 'volume', label: label_volume, required: true, hint: hint_volume %}
          {% render 'contact-field', form_id: form_id, name: 'body', label: label_message, type: 'textarea', required: false, value: form.body, error: body_error, class: 'sm:col-span-2' %}
        {%- else -%}
          {% render 'contact-field', form_id: form_id, name: 'name', label: label_name, autocomplete: 'name', required: false, value: form.name %}
          {% render 'contact-field', form_id: form_id, name: 'email', label: label_email, type: 'email', autocomplete: 'email', required: true, value: form.email, error: email_error %}
          {% render 'contact-field', form_id: form_id, name: 'phone', label: label_phone, type: 'tel', autocomplete: 'tel', required: false, value: form.phone, class: 'sm:col-span-2' %}
          {% render 'contact-field', form_id: form_id, name: 'body', label: label_message, type: 'textarea', required: true, value: form.body, error: body_error, class: 'sm:col-span-2' %}
        {%- endif -%}
        <div class="sm:col-span-2">
          <button type="submit" class="btn btn-primary">{{ 'contact.submit' | t }}</button>
        </div>
      {%- endform -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "t:sections.contact_form.name",
  "settings": [
    { "type": "text", "id": "heading", "label": "t:sections.contact_form.heading", "default": "Get in touch" },
    { "type": "richtext", "id": "text", "label": "t:sections.contact_form.text" },
    { "type": "checkbox", "id": "trade_fields", "label": "t:sections.contact_form.trade_fields", "info": "t:sections.contact_form.trade_fields_info", "default": false },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "presets": [
    { "name": "t:sections.contact_form.name" },
    {
      "name": "t:sections.contact_form.wholesale_preset",
      "settings": {
        "heading": "Wholesale and trade",
        "text": "<p>For shops, restaurants and importers. Tell us what you need and we will reply with prices and pack options.</p>",
        "trade_fields": true
      }
    }
  ]
}
{% endschema %}
```

Labels are translated in the section and passed as text, so the snippet stays a plain field and never guesses whether it got a key.

- [ ] **Step 6: Add the wholesale form to the homepage and write the contact page**

In `templates/index.json`, add to `"sections"`:
```json
    "wholesale": {
      "type": "contact-form",
      "settings": {
        "heading": "Wholesale and trade",
        "text": "<p>For shops, restaurants and importers. Tell us what you need and we will reply with prices and pack options.</p>",
        "trade_fields": true,
        "color_scheme": "light"
      }
    }
```
and append `"wholesale"` to `"order"`.

`templates/page.contact.json`:
```json
{
  "sections": {
    "main": {
      "type": "main-page",
      "settings": { "color_scheme": "light" }
    },
    "form": {
      "type": "contact-form",
      "settings": { "heading": "Send us a message", "trade_fields": false, "color_scheme": "light" }
    }
  },
  "order": ["main", "form"]
}
```

- [ ] **Step 7: Run the checks**

Run: `npm run build && npm run check`, then run `contact-form-check.js` on `http://127.0.0.1:9292/` and on `http://127.0.0.1:9292/pages/contact` (or `/pages/contact?view=contact`, see Task 0 Step 2).
Expected: no Theme Check errors, then `contact form ok` on both pages.

- [ ] **Step 8: Submit both forms by hand**

Fill in the homepage trade form with an address you control and submit. Shopify may show a captcha first. Expected: the page reloads at the form with "Thanks for your message. We will reply by email.", and the store's sender inbox gets an email listing Business, Email, Country, Volume and Body. Repeat on the contact page and expect Name, Email, Phone and Body. Then set `document.getElementById(form.id).noValidate = true` with `agent-browser --session theme eval`, submit `not-an-email`, and confirm the email field shows the "!" error and keeps the message text.

- [ ] **Step 9: Commit**

```bash
git add sections/contact-form.liquid snippets/contact-field.liquid templates locales tests/browser/contact-form-check.js assets
git commit -m "Add contact form section with trade fields for wholesale inquiries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 10: homepage order, full-page checks and README

**Files:**
- Modify: `templates/index.json`, `README.md`
- Modify: any file a failing check below points to

- [ ] **Step 1: Set the final homepage order**

In `templates/index.json`, replace `"order"` with:
```json
  "order": [
    "hero",
    "trust_strip",
    "featured_product",
    "product_grid",
    "image_with_text",
    "origin_map",
    "process_steps",
    "certifications",
    "video",
    "faq",
    "wholesale"
  ]
```
The hero's second button keeps `shopify://pages/contact` from Task 1. An anchor to the homepage form would break, because Shopify prefixes section ids with a theme-specific template id.

- [ ] **Step 2: Run every check**

Run: `npm run build && npm run typecheck && npm test && npm run check`
Expected: no errors and all unit tests pass.

Then on `http://127.0.0.1:9292/`, run in turn: `theme-base-check.js`, `header-check.js`, `footer-check.js`, `hero-check.js`, `story-check.js`, `process-check.js`, `product-grid-check.js`, `trust-check.js`, `faq-check.js`, `contact-form-check.js`, `featured-product-check.js`, then `video-check.js` last (it replaces the cover). Expected: each prints its `ok` line. Clear the cart afterwards.

- [ ] **Step 3: Lighthouse on mobile**

Run plan 1 Task 8 Step 1's Lighthouse loop unchanged (home, `products/kithul-treacle`, `collections/all`).
Expected: average performance at least 60 and average accessibility at least 90 across the three. The homepage now carries the new sections, so if it fails, list the failing audits from `.lighthouse/home.json` and fix them in the section they name. Common ones: a heading level skipped (check each section's heading falls back as written), a link without a name, contrast on the band scheme. Do not lower the bar.

- [ ] **Step 4: Keyboard and reduced motion pass by hand**

At 1440 px and 390 px, Tab through the whole homepage. Expected: every link, button, radio, summary and field shows a focus ring and is at least 44 px tall; the hero pause button, the variant radios, the FAQ questions and the video cover all work with Enter or Space. With reduced motion on, the hero video does not autoplay and every process step is visible.

- [ ] **Step 5: Update the README**

In `README.md`, change the first paragraph to:
```markdown
A Shopify Online Store 2.0 theme for small producers who sell what they make.
```
(the theme is named Sapwood now, so "Working name." is out of date), and add before `## Tests`:
````markdown
## Sections

| Section | Notes |
|---|---|
| Hero | The first section on a page renders its heading as the page's `h1`, and loads its image eagerly. A Shopify video replaces the image, plays muted and has a pause button; it stays paused for visitors who ask for reduced motion. |
| Image with text | Image left or right of a heading, rich text and a link. |
| Origin map | Upload a map image and set the pin in percent. Screen readers skip the pin, so describe the place in the image's alt text. The pin label sits right of the pin, and moves to its left when the pin is more than 60 percent across. |
| Process steps | One block per step, stacked. |
| Featured product | Uses the product page's price, variant picker and add to cart. Does not change the page address when a variant is picked. |
| Product grid | Collection, 2 to 6 products, and whether card images show whole or fill the card. |
| Certifications | Logo, name, text and link per block. Logos are decorative because the name is beside them. |
| Trust strip | Up to 6 short text blocks in one row. |
| Video | Shopify video with native controls, or a YouTube or Vimeo link behind a cover image. The player only loads when the visitor presses play, and without JavaScript the cover links to the video's own site. |
| FAQ | Question and answer blocks as `<details>`. |
| Reviews | An app block slot on the product template. Renders nothing until a reviews app block is added. |
| Contact form | Name, email, phone and message. With "Ask for business details" on, it asks for business name, email, country, volume and message instead, for wholesale inquiries. Both send to the store's sender email. |
````

- [ ] **Step 6: Commit**

```bash
git add templates/index.json README.md
git add -u
git commit -m "Order the homepage sections and document them in the README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
