---
name: social-render-engine
description: Render 1080x1440 portrait social media graphics and carousels using headless Puppeteer and Handlebars. Use when compiling HTML/CSS templates to image, generating publication-ready social graphics, or rendering multi-slide carousels from structured JSON data.
---

# Social Media Graphic Rendering Engine (Agent Execution Skill)

This skill executes headless Chromium compilation of modular HTML/CSS Handlebars templates into pixel-perfect **1080×1440** (or **2160×2880** retina 2×) portrait social media graphics.

The engine is **brand-agnostic** and **template-agnostic**. It bundles no layout templates and enforces no organization-specific branding. All layout templates and brand tokens are supplied externally by the caller or loaded from user-specified packs.

---

## 1. Information Hierarchy & Sibling References

- **In-Skill Execution Procedure**: Below, steps 1 through 4 guide the render lifecycle.
- **In-Skill CLI & API Reference**: Section 3 details flags, parameters, and payload schemas.
- **External Schema Contracts**:
  - [`schemas/template-pack.schema.json`](schemas/template-pack.schema.json) — Template catalog manifest schema.
  - [`schemas/tokens.schema.json`](schemas/tokens.schema.json) — CSS variable theme token schema.
  - [`schemas/brand-pack.schema.json`](schemas/brand-pack.schema.json) — Brand identity and asset schema.

---

## 2. The 4-Step Render Procedure

```
[Step 1: Resolve Template & Declare Slots]
                    │
                    ▼
[Step 2: Construct Structured Data Payload]
                    │
                    ▼
[Step 3: Execute Headless Puppeteer Render]
                    │
                    ▼
[Step 4: Verify Rendered Asset Quality]
```

### Step 1: Resolve Template & Declare Slots
1. Determine the layout template source:
   - **Direct File**: A relative or absolute path to an HTML file (e.g. `path/to/template.html`).
   - **Template Pack Catalog**: A semantic template ID (e.g. `photo-announcement-qr`) resolved against an active template pack manifest.
2. Inspect the template markup or pack manifest to identify all Handlebars slot placeholders:
   - Required text slots (e.g. `{{title}}`, `{{body}}`, `{{quote}}`).
   - Media slots (e.g. `{{bg_image_url}}`, `{{logo_url}}`, `{{qr_code_url}}`).
   - Dynamic CSS variable slots (e.g. `{{theme.colorPrimary}}`, `{{theme.fontHeading}}`).

> **Completion Criterion**: The template file path exists on disk, and a complete checklist of expected text, media, and theme slots is identified.

---

### Step 2: Construct Structured Data Payload
1. Build a JSON object matching the slots identified in Step 1.
2. Supply theme tokens under the optional `theme` key to populate CSS custom properties:
   ```json
   {
     "title": "Youth Leadership Summit 2026",
     "body": "Empowering next-generation innovators across the community.",
     "bg_image_url": "https://example.com/photo.jpg",
     "theme": {
       "colorPrimary": "#0D9488",
       "colorBgPaper": "#F0FDF4",
       "colorTextDark": "#134E4A",
       "fontHeading": "\"Inter\", sans-serif",
       "fontBody": "\"Inter\", sans-serif"
     }
   }
   ```
3. Save the payload to a JSON file (e.g. `data.json`) or prepare an inline JSON string for the CLI.

> **Completion Criterion**: The payload contains valid JSON, satisfies all required template slots, and declares theme overrides if custom branding is needed.

---

### Step 3: Execute Headless Puppeteer Render
1. Execute the engine CLI via terminal:
   ```bash
   node render.js \
     --template path/to/template.html \
     --data path/to/data.json \
     --output dist/rendered_post.png \
     --scale 2
   ```
2. When using pluggable template packs and brand directories:
   ```bash
   node render.js \
     --template-pack universal \
     --template photo-announcement-qr \
     --brand acme_corp \
     --data data.json \
     --output dist/acme_announcement.png \
     --scale 2
   ```
3. Monitor stdout for successful browser launch, font readiness synchronization, and screenshot capture.

> **Completion Criterion**: The CLI command exits with code `0` and outputs `Successfully generated: <output_path> (<size> KB)`.

---

### Step 4: Verify Rendered Asset Quality
Inspect the generated image file against these observable criteria:
- **Canvas Resolution**: File resolution matches requested scale (2160×2880 at scale 2x, or 1080×1440 at scale 1x).
- **Template Hygiene**: Zero raw Handlebars tokens (`{{...}}`) remain visible in the image.
- **Content Flow**: Text fits comfortably within containers with no overlapping lines or uncontained clipping.
- **Media Assets**: Background imagery and logos load cleanly with full opacity and correct aspect ratios.

> **Completion Criterion**: Output image file exists on disk with size > 50 KB, verified free of unparsed Handlebars expressions or visual clipping defects.

---

## 3. CLI & Programmatic Reference

### CLI Arguments

| Flag | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `--template`, `-t` | `string` | Path to HTML template file or semantic template ID | *(Required)* |
| `--output`, `-o` | `string` | Output image destination path (`.png` or `.jpeg`) | *(Required)* |
| `--data`, `-d` | `string` | Path to JSON payload file or inline JSON string | `{}` |
| `--brand`, `-b` | `string` | Brand pack ID to resolve from brands directory | `null` |
| `--scale`, `-s` | `number` | Device scale factor (`1` = 1080×1440, `2` = 2160×2880 retina) | `2` |
| `--format` | `string` | Image format: `png` or `jpeg` | `png` |
| `--quality` | `number` | JPEG compression quality (1–100) | `90` |
| `--template-pack` | `string` | Template pack ID to query | `null` |
| `--template-packs-dir` | `string` | Custom path to template packs root directory | Auto-detected |
| `--brands-dir` | `string` | Custom path to brand knowledge packs root directory | Auto-detected |
| `--list-templates`, `-l` | `flag` | Print catalog of templates available in template pack | `false` |

---

### Node.js Programmatic API

```javascript
const { renderTemplate, printTemplateCatalog } = require('./render');

// Render a single post programmatically
const outputPath = await renderTemplate({
  template: 'path/to/template.html',
  data: {
    title: 'Headline Here',
    body: 'Body description text here.',
    bg_image_url: 'https://images.unsplash.com/photo-12345'
  },
  outputPath: 'dist/output.png',
  scale: 2 // 2160x2880 retina
});

console.log('Generated:', outputPath);
```

---

### Multi-Slide Carousel Rendering Pattern

For multi-slide carousel sets, iterate through the slide definitions and invoke the renderer sequentially:

```javascript
const slides = [
  { template: 'templates/cover.html', data: { title: 'Hook Headline' }, output: 'dist/slide_1.png' },
  { template: 'templates/editorial.html', data: { body: 'Core point.' }, output: 'dist/slide_2.png' },
  { template: 'templates/cta.html', data: { body: 'Final takeaway.' }, output: 'dist/slide_3.png' }
];

for (const slide of slides) {
  await renderTemplate({
    template: slide.template,
    data: slide.data,
    outputPath: slide.output,
    scale: 2
  });
}
```
