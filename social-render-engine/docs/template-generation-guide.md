# Authoring Custom Social Media Templates: A Practical Guide

This guide defines the procedure for human designers and autonomous AI agents to author, register, and validate new visual layouts within the decoupled 3-tier social media platform:
1. **Tier 1: Generation Engine** (`social-render-engine/` or `engine/`) — Headless Chromium (Puppeteer) and Handlebars compiler. Agnostic of brands and layouts; supplies zero templates.
2. **Tier 2: Pluggable Template Packs** (`template-packs/<pack_id>/`) — Modular catalogs of Handlebars HTML templates supplied and owned by users/designers.
3. **Tier 3: Brand Knowledge Packs** (`brands/<brand_id>/`) — Encapsulated organizational identity, design tokens (`tokens.json`), and logos (`assets/logos/`).

---

## 1. The 4 Architectural Constraints

Every template must satisfy these four rules to remain compatible with the rendering engine:

1. **Fixed Canvas**: Layout must be strictly **1080×1440px** (4:5 vertical portrait aspect ratio).
2. **Brand-Agnostic Theming**: All colors, fonts, and background themes must use CSS Custom Properties (`:root`) with fallback values. Never hardcode organizational hex values, slogans, or brand-specific font files.
3. **Flex Column Rhythm Over Hardcoded Offsets**: Related text elements (e.g. title + description, quote + author, stat + narrative) must be enclosed inside a single positioned container using `display: flex; flex-direction: column; gap: <px>`. Never position title and body text using independent, hardcoded absolute `top` coordinates.
4. **Self-Contained Single File**: A template is a single standalone HTML document containing inline `<style>` rules and Handlebars interpolation slots.

---

## 2. The 6-Step Template Generation Workflow

```
[Step 1: Define Intent & Semantic ID]
                 │
                 ▼
[Step 2: Scaffold HTML Canvas & CSS Token Bindings]
                 │
                 ▼
[Step 3: Add Semantic Slots & Fallbacks]
                 │
                 ▼
[Step 4: Register in template-pack.json]
                 │
                 ▼
[Step 5: Run Cross-Brand Smoke Tests]
                 │
                 ▼
[Step 6: Verify Against Visual QA Criteria]
```

---

### Step 1: Define Intent & Semantic ID

Pick a descriptive, kebab-case identifier and 3–5 search intents representing the template's purpose.

- **Naming Convention**: `<family>-<role>`, e.g.:
  - `photo-event-speaker` (Family: `photo`, Role: Conference/event guest)
  - `minimal-infographic-list` (Family: `minimal`, Role: 3-point list)
  - `carousel-summary-slide` (Family: `carousel`, Role: Sequence recap)
- **Select Family**: `photo` (photo-dominant hero), `minimal` (editorial paper/geometry), or `carousel` (swipe sequence).
- **Declare Intents**: Search keywords an agent uses to find this layout (e.g. `["speaker", "event", "conference", "guest"]`).

> **Completion Criterion**: You have an assigned unique `id`, `family`, target file path, and intent list.

---

### Step 2: Scaffold HTML Canvas & CSS Token Bindings

Create the HTML file in `template-packs/<pack_id>/<family>/<template_file>.html`.

#### Canvas Skeleton
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Template Name</title>
  <!-- Google Fonts: Import primary brand font pairings -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap" rel="stylesheet">
  
  <style>
    /* CSS Custom Properties injected at render time from tokens.json */
    :root {
      --color-primary: {{#if theme.colorPrimary}}{{theme.colorPrimary}}{{else}}#FFAA00{{/if}};
      --color-primary-light: {{#if theme.colorPrimaryLight}}{{theme.colorPrimaryLight}}{{else}}#FFBB33{{/if}};
      --color-bg-paper: {{#if theme.colorBgPaper}}{{theme.colorBgPaper}}{{else}}#FFF9EE{{/if}};
      --color-bg-dark: {{#if theme.colorBgDark}}{{theme.colorBgDark}}{{else}}#242424{{/if}};
      --color-bg-dark-alt: {{#if theme.colorBgDarkAlt}}{{theme.colorBgDarkAlt}}{{else}}#313131{{/if}};
      --color-text-dark: {{#if theme.colorTextDark}}{{theme.colorTextDark}}{{else}}#313131{{/if}};
      --color-text-light: {{#if theme.colorTextLight}}{{theme.colorTextLight}}{{else}}#FFF9EE{{/if}};
      --font-heading: {{#if theme.fontHeading}}{{{theme.fontHeading}}}{{else}}"Lora", serif{{/if}};
      --font-body: {{#if theme.fontBody}}{{{theme.fontBody}}}{{else}}"Plus Jakarta Sans", sans-serif{{/if}};
      --radius-sm: {{#if theme.radiusSm}}{{theme.radiusSm}}{{else}}4px{{/if}};
      --radius-md: {{#if theme.radiusMd}}{{theme.radiusMd}}{{else}}8px{{/if}};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* Fixed Canvas Boundaries */
    body, .artboard {
      width: 1080px;
      height: 1440px;
      overflow: hidden;
      position: relative;
      background-color: var(--color-bg-dark);
    /* Flex Column Pattern: Prevents text overlap and awkward gaps */
    .content-group {
      position: absolute;
      top: 1072px;
      left: 72px;
      width: 936px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .headline {
      font-family: var(--font-heading);
      font-size: 64px;
      line-height: 100%;
      color: var(--color-primary);
    }
    .description {
      font-family: var(--font-body);
      font-size: 24px;
      line-height: 140%;
      color: var(--color-text-light);
    }
    /* Stat Leading Compensation: Tightens excess font box leading */
    .stat-number {
      font-family: var(--font-heading);
      font-size: 156px;
      line-height: 100%;
      color: var(--color-primary);
    }
    .has-stat .post-body {
      margin-top: -24px;
    }
  </style>
</head>
<body>
  <div class="artboard">
    <!-- Visual content goes here -->
  </div>
</body>
</html>
```

> **Completion Criterion**: HTML file exists with exact 1080×1440 canvas dimensions, font links, CSS Custom Properties mapped to fallback values, and flex column layout containers.

---

### Step 3: Add Semantic Slots & Fallbacks

Wrap all dynamic elements in Handlebars tags. Always provide a sensible fallback using `{{#if slot}}{{slot}}{{else}}Fallback{{/if}}` so the template renders beautifully even when optional data is omitted.

#### Standard Slot Conventions

| Slot Key | Data Type | Usage | Example Fallback |
| :--- | :--- | :--- | :--- |
| `{{title}}` | String | Main headline | `{{#if title}}{{title}}{{else}}Community Leadership Announcement{{/if}}` |
| `{{body}}` | String | Narrative or program description | `{{#if body}}{{body}}{{else}}Together we build supportive spaces...{{/if}}` |
| `{{badge}}` | String | Category pill or tag | `{{#if badge}}{{badge}}{{else}}Program Update{{/if}}` |
| `{{bg_image_url}}` | URL | High-resolution background photo | `https://images.unsplash.com/photo-...` |
| `{{logo_url}}` | URL / Path | Brand logo SVG | `assets/logos/logo_white.svg` |
| `{{qr_code_url}}` | URL | Scannable QR code image | Dynamic QR API URL |

#### Logo Integration Pattern
Always enclose the logo inside an anchor container with `object-fit: contain`:
```html
<div class="brand-logo-container" style="position: absolute; top: 60px; left: 80px; width: 80px; height: 80px;">
  <img src="{{#if logo_url}}{{logo_url}}{{else}}assets/logos/logo_white.svg{{/if}}" alt="Brand Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
</div>
```

> **Completion Criterion**: All text, photo, and logo areas bind to dynamic Handlebars slots with working aesthetic defaults.

---

### Step 4: Register in Template Pack Manifest (`template-pack.json`)

Open `template-packs/<pack_id>/template-pack.json` and append the new template definition under the `"templates"` array.

```json
{
  "id": "photo-event-speaker",
  "name": "Featured Speaker & Community Leader Card",
  "family": "photo",
  "intents": ["speaker", "event", "guest", "conference", "feature"],
  "file": "photo/photo-event-speaker.html",
  "aspect_ratio": "4:5",
  "dimensions": { "width": 1080, "height": 1440 },
  "slots": {
    "required": ["title", "body"],
    "optional": ["badge", "bg_image_url", "logo_url"],
    "bounds": {
      "badge": { "max_words": 3, "max_chars": 25, "description": "Speaker title or track name" },
      "title": { "max_words": 8, "max_chars": 50, "description": "Speaker name or session hook" },
      "body": { "max_words": 40, "max_chars": 260, "description": "Bio or session overview" }
    }
  }
}
```

#### Why Slot Bounds Matter
The engine validates these bounds during pre-render. If an AI agent drafts copy with 350 characters for a slot with a 260-character bound, the engine issues a warning:
`[Render Engine] Bound Advisory: Slot 'body' length (350 chars) exceeds recommended max (260 chars).`
This advisory empowers the agent to re-draft shorter copy before finalizing the post.

> **Completion Criterion**: `template-pack.json` contains the valid entry, and running `node engine/render.js --list-templates` outputs the new template in the catalog.

---

### Step 5: Run Cross-Brand Smoke Tests

Validate that the new template works across different organizational color palettes without layout clipping.

#### 1. Direct Standalone Render (No Brand Pack / Inline Theme)
Test the template purely as an isolated HTML layout with inline data:
```bash
node ../social-render-engine/render.js \
  --template path/to/new-template.html \
  --data '{"title": "Standalone Smoke Test", "body": "Verifying pure rendering execution without external brand packs."}' \
  --output dist/test_direct.png \
  --scale 2
```

#### 2. Template Pack Catalog Verification
```bash
node engine/render.js --list-templates
```
*Verify that the new template ID appears in the terminal list.*

#### 3. Organization Brand Smoke Test (e.g. STTF)
```bash
node engine/render.js \
  --brand sttf \
  --template <new_template_id> \
  --data '{"title": "STTF Test Post", "body": "Testing dynamic layout bounds and font rendering."}' \
  --output dist/test_<new_template_id>_sttf.png \
  --scale 2
```
*Verify: Gold accents (`#FFAA00`), serif heading, white logo.*

> **Completion Criterion**: All CLI commands exit with code `0` and output retina 2160×2880 PNG files into `dist/`.

---

### Step 6: Verify Against Visual QA Criteria

Before publishing the template for production use, inspect the rendered images against this checklist:

- [ ] **Exact Dimensions**: Image is 2160×2880 pixels (scale 2x) or 1080×1440 pixels (scale 1x).
- [ ] **Dynamic Theming**: Primary color matches the active brand's palette (`#FFAA00` for STTF, `#0D9488` for demo).
- [ ] **Typography Hierarchy**: Clear visual distinction between headline font (`var(--font-heading)`) and body font (`var(--font-body)`).
- [ ] **No Text Overflow**: Maximum character bounds prevent text from colliding with logos, accent bars, or bottom edges.
- [ ] **Zero Template Bleed**: No raw Handlebars expressions (e.g. `{{title}}`) appear in the rendered PNG.
- [ ] **High Contrast**: Copy on dark overlays passes WCAG AA legibility standards.

---

## 3. Disclosed References

- **Standalone Generation Engine**: [`social-render-engine/render.js`](file:///C:/Users/aeche/Documents/agent-repo/social-render-engine/render.js)
- **Engine Agent Skill**: [`social-render-engine/SKILL.md`](file:///C:/Users/aeche/Documents/agent-repo/social-render-engine/SKILL.md)
- **Template Pack Specification**: [`docs/spec/template-pack-spec.md`](file:///C:/Users/aeche/Documents/agent-repo/STTF/docs/spec/template-pack-spec.md)
- **JSON Schema**: [`schemas/template-pack.schema.json`](file:///C:/Users/aeche/Documents/agent-repo/STTF/schemas/template-pack.schema.json)
- **Universal Template Pack (8 Layouts)**: [`template-packs/universal/template-pack.json`](file:///C:/Users/aeche/Documents/agent-repo/STTF/template-packs/universal/template-pack.json)
- **Stock Photography Protocol**: [`docs/photo-protocol.md`](file:///C:/Users/aeche/Documents/agent-repo/STTF/docs/photo-protocol.md)
