# Social Render Engine

A brand-agnostic, layout-agnostic headless rendering engine powered by Puppeteer and Handlebars. Compiles modular HTML/CSS templates into pixel-perfect 1080×1440 portrait social media graphics and carousels.

The engine bundles **zero layout templates** and **zero brand identities**. It operates strictly as an execution compiler: the caller supplies the template and the data, and the engine handles headless Chromium orchestration, font readiness synchronization, CSS variable binding, and high-DPI screenshot capture.

---

## 1. Quick Start

### Installation

```bash
cd social-render-engine
npm install
```

### System Requirements
- Node.js >= 18.0.0
- Google Chrome, Microsoft Edge, or Puppeteer-bundled Chromium

---

## 2. CLI Usage

### Basic Rendering (Direct Template File)

Pass any local HTML file directly into the engine:

```bash
node render.js \
  --template path/to/my-template.html \
  --data path/to/data.json \
  --output dist/my-post.png \
  --scale 2
```

### Rendering with Pluggable Template Packs & Brands

When using modular template packs (`template-packs/<pack_id>/`) and brand knowledge packs (`brands/<brand_id>/`):

```bash
node render.js \
  --template-pack universal \
  --template photo-announcement-qr \
  --brand acme_brand \
  --data mock/post_data.json \
  --output dist/announcement.png \
  --scale 2
```

### Discovering Templates in a Pack

```bash
node render.js --list-templates [--template-pack <pack_id>]
```

---

## 3. CLI Options Reference

| Flag | Shorthand | Type | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `--template` | `-t` | `string` | Path to HTML file or semantic template ID | *(Required)* |
| `--output` | `-o` | `string` | Destination image path (`.png` or `.jpeg`) | *(Required)* |
| `--data` | `-d` | `string` | Path to JSON file or raw JSON string | `{}` |
| `--scale` | `-s` | `number` | Device scale factor (`1` = 1080×1440, `2` = 2160×2880) | `2` |
| `--format` | | `string` | Output image format (`png` or `jpeg`) | `png` |
| `--quality` | | `number` | JPEG quality from 1 to 100 | `90` |
| `--brand` | `-b` | `string` | Brand identifier to load from brand directory | `null` |
| `--template-pack` | | `string` | Template pack identifier | `null` |
| `--template-packs-dir` | | `string` | Custom root directory for template packs | Auto-detected |
| `--brands-dir` | | `string` | Custom root directory for brand packs | Auto-detected |
| `--list-templates` | `-l` | `flag` | List all templates declared in template pack | `false` |

---

## 4. Programmatic API

```javascript
const { renderTemplate, resolveTemplatePath } = require('./render');

async function main() {
  const resultPath = await renderTemplate({
    template: 'templates/announcement.html',
    data: {
      title: 'Community Innovation Lab',
      body: 'Hands-on mentorship and collaborative workshop spaces.',
      bg_image_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80',
      theme: {
        colorPrimary: '#3B82F6',
        colorBgPaper: '#F8FAFC',
        fontHeading: '"Inter", sans-serif'
      }
    },
    outputPath: 'dist/announcement.png',
    scale: 2 // 2160x2880 retina export
  });

  console.log('Successfully generated graphic at:', resultPath);
}

main();
```

---

## 5. Supplying Templates (Tier 2 Contract)

Templates are authored as standard HTML documents containing Handlebars slot tags (`{{...}}`).

### Minimal Template Example (`my-template.html`)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    :root {
      --color-primary: {{#if theme.colorPrimary}}{{theme.colorPrimary}}{{else}}#2563EB{{/if}};
      --font-main: {{#if theme.fontHeading}}{{{theme.fontHeading}}}{{else}}sans-serif{{/if}};
    }
    body {
      width: 1080px;
      height: 1440px;
      margin: 0;
      padding: 80px;
      background: #0F172A;
      color: #FFFFFF;
      font-family: var(--font-main);
      box-sizing: border-box;
    }
    h1 { font-size: 64px; color: var(--color-primary); }
    p { font-size: 28px; line-height: 1.5; color: #E2E8F0; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <p>{{body}}</p>
</body>
</html>
```

---

## 6. AI Agent Execution

This engine is equipped with an agent skill definition at [`SKILL.md`](SKILL.md). Autonomous AI coding and marketing agents can invoke the engine deterministically via CLI following the 4-step execution lifecycle (Resolve $\rightarrow$ Construct Payload $\rightarrow$ Render $\rightarrow$ Verify).
