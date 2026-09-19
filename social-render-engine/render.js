#!/usr/bin/env node
/**
 * Universal Headless Social Media Graphic Rendering Engine
 * 
 * Brand-agnostic, layout-agnostic rendering engine powered by Puppeteer and Handlebars.
 * Compiles modular HTML/CSS templates into pixel-perfect 1080x1440 portrait graphics
 * and multi-slide carousels on local workstations or headless Linux servers.
 * 
 * Usage:
 *   node render.js --template <path|id> --output <path> [--data <path|json>] [--brand <id>] [--scale 2]
 *   node render.js --list-templates [--template-pack <pack_id>]
 */

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    brand: null,
    templatePack: null,
    template: null,
    data: null,
    output: null,
    scale: 2, // 2x deviceScaleFactor for 2160x2880 retina export (1x = 1080x1440)
    format: 'png',
    quality: 90,
    listTemplates: false,
    brandsDir: null,
    templatePacksDir: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--brand' && args[i + 1]) {
      options.brand = args[++i];
    } else if (arg === '--template-pack' && args[i + 1]) {
      options.templatePack = args[++i];
    } else if (arg === '--template' && args[i + 1]) {
      options.template = args[++i];
    } else if (arg === '--data' && args[i + 1]) {
      options.data = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === '--scale' && args[i + 1]) {
      options.scale = parseFloat(args[++i]);
    } else if (arg === '--format' && args[i + 1]) {
      options.format = args[++i].toLowerCase();
    } else if (arg === '--quality' && args[i + 1]) {
      options.quality = parseInt(args[++i], 10);
    } else if (arg === '--list-templates' || arg === '-l') {
      options.listTemplates = true;
    } else if (arg === '--brands-dir' && args[i + 1]) {
      options.brandsDir = args[++i];
    } else if (arg === '--template-packs-dir' && args[i + 1]) {
      options.templatePacksDir = args[++i];
    }
  }

  return options;
}

/**
 * Resolve root brands directory from custom flag, cwd, or parent directories
 */
function resolveBrandsDir(customDir) {
  if (customDir) return path.resolve(process.cwd(), customDir);
  const candidates = [
    path.resolve(process.cwd(), 'brands'),
    path.resolve(__dirname, '..', 'brands'),
    path.resolve(__dirname, 'brands')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve(process.cwd(), 'brands');
}

/**
 * Resolve root template-packs directory from custom flag, cwd, or parent directories
 */
function resolveTemplatePacksDir(customDir) {
  if (customDir) return path.resolve(process.cwd(), customDir);
  const candidates = [
    path.resolve(process.cwd(), 'template-packs'),
    path.resolve(__dirname, '..', 'template-packs'),
    path.resolve(__dirname, '..', 'STTF', 'template-packs'),
    path.resolve(__dirname, 'template-packs')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve(process.cwd(), 'template-packs');
}

/**
 * Locate Chrome, Chromium, or Edge executable across platforms
 */
function getExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidatePaths = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    // Linux / Debian / Ubuntu / Alpine
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return undefined;
}

/**
 * Convert local asset file into base64 Data URI
 * 
 * @param {string} filePath - Absolute or relative file path
 * @returns {string|null} Data URI or null if not found
 */
function fileToDataUri(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  };
  const mime = mimeTypes[ext] || 'application/octet-stream';
  const buf = fs.readFileSync(filePath);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

/**
 * Load a Template Pack manifest from template-packs/<pack_id>/
 * 
 * @param {string} [packId] - Template pack identifier
 * @param {string} [customPacksDir] - Optional custom template packs directory
 * @returns {Object} Object containing packDir and manifest
 */
function loadTemplatePack(packId = null, customPacksDir = null) {
  const rootPacksDir = resolveTemplatePacksDir(customPacksDir);
  const targetPack = packId || 'universal';
  const packDir = path.resolve(rootPacksDir, targetPack);
  let manifest = null;

  if (fs.existsSync(packDir)) {
    const manifestPath = path.join(packDir, 'template-pack.json');
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch (err) {
        console.warn(`[Render Engine] Warning: Failed to parse template pack manifest at ${manifestPath}:`, err.message);
      }
    }
  }

  return { packDir, manifest };
}

/**
 * Resolve template path from direct file path or template pack manifest
 * 
 * @param {string} templateInput - Direct file path or semantic template ID
 * @param {string} [templatePackId] - Optional template pack identifier
 * @param {string} [customPacksDir] - Optional custom template packs directory
 * @returns {string} Absolute path to resolved template file
 */
function resolveTemplatePath(templateInput, templatePackId = null, customPacksDir = null) {
  if (!templateInput) {
    throw new Error('Missing required argument: template identifier or file path.');
  }

  // 1. Direct file path check (relative or absolute)
  const directPath = path.resolve(process.cwd(), templateInput);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  // 2. Query Template Pack manifest
  const { packDir, manifest } = loadTemplatePack(templatePackId, customPacksDir);
  if (manifest && Array.isArray(manifest.templates)) {
    // Exact ID match
    let match = manifest.templates.find(t => t.id === templateInput);
    if (!match) {
      // Case-insensitive ID match
      match = manifest.templates.find(t => t.id.toLowerCase() === templateInput.toLowerCase());
    }
    if (!match) {
      // Check aliases if defined
      match = manifest.templates.find(t => Array.isArray(t.aliases) && t.aliases.includes(templateInput.toLowerCase()));
    }
    if (!match) {
      // Intent or filename match
      const normalizedInput = templateInput.replace(/\\/g, '/');
      const baseFilename = path.basename(normalizedInput);
      match = manifest.templates.find(t => {
        const normFile = t.file.replace(/\\/g, '/');
        return (
          normFile === normalizedInput ||
          normFile.endsWith(normalizedInput) ||
          normalizedInput.endsWith(normFile) ||
          path.basename(normFile) === baseFilename ||
          path.basename(normFile).replace(/\.html$/, '') === baseFilename.replace(/\.html$/, '') ||
          (Array.isArray(t.intents) && t.intents.includes(templateInput.toLowerCase()))
        );
      });
    }
    if (match) {
      const resolved = path.resolve(packDir, match.file);
      if (fs.existsSync(resolved)) {
        return resolved;
      }
    }
  }

  const available = manifest && Array.isArray(manifest.templates)
    ? manifest.templates.map(t => `"${t.id}" (${t.name})`).join('\n  - ')
    : 'None declared';

  throw new Error(`Template not found: "${templateInput}".\nAvailable templates in pack "${templatePackId || 'universal'}":\n  - ${available}`);
}

/**
 * Print available templates in a pack to console
 * 
 * @param {string} [templatePackId] - Template pack identifier
 * @param {string} [customPacksDir] - Optional custom template packs directory
 */
function printTemplateCatalog(templatePackId = null, customPacksDir = null) {
  const { manifest } = loadTemplatePack(templatePackId, customPacksDir);
  if (!manifest) {
    console.error(`Template pack "${templatePackId || 'universal'}" not found.`);
    return;
  }

  console.log(`\n================================================================`);
  console.log(`📦 Template Pack: ${manifest.name} (ID: ${manifest.id}, v${manifest.version || '1.0.0'})`);
  if (manifest.description) console.log(`📝 Description: ${manifest.description}`);
  console.log(`================================================================\n`);

  manifest.templates.forEach((t, i) => {
    console.log(`[${i + 1}] ID: ${t.id}`);
    console.log(`    Name:     ${t.name}`);
    console.log(`    Family:   ${t.family}`);
    console.log(`    Intents:  ${Array.isArray(t.intents) ? t.intents.join(', ') : 'none'}`);
    console.log(`    File:     ${t.file}`);
    console.log(`    Required: ${t.slots && t.slots.required ? t.slots.required.join(', ') : 'none'}`);
    console.log(`    Optional: ${t.slots && t.slots.optional ? t.slots.optional.join(', ') : 'none'}\n`);
  });
}

/**
 * Load Brand Knowledge Pack from brands/<brand_id>/ if specified
 * 
 * @param {string|null} brandId - Brand identifier (e.g. 'sttf')
 * @param {string} [customBrandsDir] - Optional custom brands directory
 * @returns {Object} Object containing brand metadata, tokens, and directory path
 */
function loadBrandPack(brandId = null, customBrandsDir = null) {
  if (!brandId) {
    return { brandDir: null, brand: null, tokens: null };
  }

  const rootBrandsDir = resolveBrandsDir(customBrandsDir);
  const brandDir = path.resolve(rootBrandsDir, brandId);
  let brand = null;
  let tokens = null;

  if (fs.existsSync(brandDir)) {
    const brandPath = path.join(brandDir, 'brand.json');
    const tokensPath = path.join(brandDir, 'tokens.json');

    if (fs.existsSync(brandPath)) {
      try {
        brand = JSON.parse(fs.readFileSync(brandPath, 'utf-8'));
      } catch (err) {
        console.warn(`[Render Engine] Warning: Failed to parse brand manifest at ${brandPath}:`, err.message);
      }
    }

    if (fs.existsSync(tokensPath)) {
      try {
        const tokensData = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
        tokens = tokensData.theme || {};
      } catch (err) {
        console.warn(`[Render Engine] Warning: Failed to parse tokens manifest at ${tokensPath}:`, err.message);
      }
    }
  }

  return { brandDir, brand, tokens };
}

/**
 * Resolve brand logo asset dynamically from explicit URL, variant, or markup hints
 * 
 * @param {string} templateSource - Template HTML markup
 * @param {string} templatePath - Path to template file
 * @param {Object} brandInfo - Loaded brand pack information
 * @param {string} [explicitLogoUrl] - Explicit logo URL or file path
 * @param {string} [logoVariant] - Explicit variant: 'light', 'dark', or 'horizontal'
 * @returns {string|null} Resolved Data URI or URL
 */
function resolveLogoUrl(templateSource, templatePath, brandInfo, explicitLogoUrl, logoVariant) {
  if (explicitLogoUrl) {
    const localPath = path.resolve(process.cwd(), explicitLogoUrl);
    if (fs.existsSync(localPath)) {
      return fileToDataUri(localPath);
    }
    return explicitLogoUrl;
  }

  if (!brandInfo || !brandInfo.brand || !brandInfo.brand.assets || !brandInfo.brand.assets.logos) {
    return null;
  }

  const { brandDir, brand } = brandInfo;
  const logos = brand.assets.logos;
  const candidateLogos = [];

  if (logoVariant && logos[logoVariant]) {
    candidateLogos.push(logos[logoVariant]);
  }

  const tpl = (templatePath || '') + (templateSource || '');
  if (tpl.includes('logo_text') || tpl.includes('logo_horizontal') || tpl.includes('horizontal')) {
    candidateLogos.push(logos.horizontal, logos.light, logos.dark);
  } else if (tpl.includes('logo_dark') || tpl.includes('dark_logo') || tpl.includes('var(--color-text-dark)')) {
    candidateLogos.push(logos.dark, logos.light, logos.horizontal);
  } else {
    candidateLogos.push(logos.light, logos.dark, logos.horizontal);
  }

  for (const candidate of candidateLogos) {
    if (!candidate) continue;
    const inBrandDir = path.resolve(brandDir, candidate);
    if (fs.existsSync(inBrandDir)) {
      return fileToDataUri(inBrandDir);
    }
    const inCwd = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(inCwd)) {
      return fileToDataUri(inCwd);
    }
  }

  return candidateLogos[0] || null;
}

/**
 * Render a template with data payload and optional brand tokens to an image
 * 
 * @param {Object} params
 * @param {string} [params.brand] - Brand ID to load from brands directory
 * @param {string} [params.templatePack] - Template pack ID
 * @param {string} params.templatePath - Direct path to HTML template or template ID
 * @param {string} params.template - Alias for templatePath
 * @param {Object|string} params.data - Data payload object, path to JSON, or raw JSON string
 * @param {string} params.outputPath - Output file path (.png or .jpeg)
 * @param {string} params.output - Alias for outputPath
 * @param {number} [params.scale=2] - Device scale factor (1 = 1080x1440, 2 = 2160x2880)
 * @param {string} [params.format='png'] - Output format ('png' or 'jpeg')
 * @param {number} [params.quality=90] - JPEG quality (1-100)
 * @param {string} [params.brandsDir] - Custom path to brands directory
 * @param {string} [params.templatePacksDir] - Custom path to template packs directory
 * @returns {Promise<string>} Absolute path to rendered image
 */
async function renderTemplate({
  brand = null,
  templatePack = null,
  templatePath,
  template,
  data,
  outputPath,
  output,
  scale = 2,
  format = 'png',
  quality = 90,
  brandsDir = null,
  templatePacksDir = null
}) {
  const templateInput = templatePath || template;
  const destPath = outputPath || output;

  if (!templateInput) {
    throw new Error('Missing required argument: template identifier or file path.');
  }
  if (!destPath) {
    throw new Error('Missing required argument: output path.');
  }

  // Dynamically resolve template file from pack or direct path
  const fullTemplatePath = resolveTemplatePath(templateInput, templatePack, templatePacksDir);
  const templateSource = fs.readFileSync(fullTemplatePath, 'utf-8');

  // Resolve data payload
  let payload = {};
  if (typeof data === 'string') {
    if (fs.existsSync(path.resolve(process.cwd(), data))) {
      payload = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), data), 'utf-8'));
    } else {
      try {
        payload = JSON.parse(data);
      } catch (err) {
        try {
          const unescaped = data.replace(/\\"/g, '"');
          payload = JSON.parse(unescaped);
        } catch (err2) {
          throw new Error(`Failed to parse data as JSON string or file path: ${data}`);
        }
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    payload = data;
  }

  // Validate slots against template manifest if declared
  const { manifest } = loadTemplatePack(templatePack, templatePacksDir);
  if (manifest && Array.isArray(manifest.templates)) {
    const matchedEntry = manifest.templates.find(t => 
      t.id === templateInput || 
      fullTemplatePath.replace(/\\/g, '/').endsWith(t.file.replace(/\\/g, '/'))
    );
    if (matchedEntry && matchedEntry.slots) {
      if (Array.isArray(matchedEntry.slots.required)) {
        matchedEntry.slots.required.forEach(slotKey => {
          if (payload[slotKey] === undefined || payload[slotKey] === null || payload[slotKey] === '') {
            console.warn(`[Render Engine] Slot Warning: Template '${matchedEntry.id}' expects required slot '${slotKey}', but none was supplied.`);
          }
        });
      }
      if (matchedEntry.slots.bounds) {
        Object.entries(matchedEntry.slots.bounds).forEach(([slotKey, bound]) => {
          const val = payload[slotKey];
          if (typeof val === 'string') {
            if (bound.max_chars && val.length > bound.max_chars) {
              console.warn(`[Render Engine] Bound Advisory: Slot '${slotKey}' length (${val.length} chars) exceeds recommended max (${bound.max_chars} chars).`);
            }
          }
        });
      }
    }
  }

  // Load brand pack and inject theme tokens if requested
  const activeBrandId = brand || payload.brand_id || null;
  const brandInfo = loadBrandPack(activeBrandId, brandsDir);

  if (brandInfo.tokens) {
    payload.theme = Object.assign({}, brandInfo.tokens, payload.theme || {});
  }
  if (brandInfo.brand) {
    payload.brand = Object.assign({}, brandInfo.brand, payload.brand || {});
  }

  // Dynamically resolve brand logo asset if not explicitly passed
  const resolvedLogo = resolveLogoUrl(templateSource, fullTemplatePath, brandInfo, payload.logo_url, payload.logo_variant);
  if (resolvedLogo) {
    payload.logo_url = resolvedLogo;
  }

  // Compile with Handlebars
  const compiled = handlebars.compile(templateSource);
  let renderedHtml = compiled(payload);

  // Inject base href for relative brand asset resolution
  if (brandInfo.brandDir && renderedHtml.includes('<head>')) {
    const baseHref = `file:///${brandInfo.brandDir.replace(/\\/g, '/')}/`;
    renderedHtml = renderedHtml.replace('<head>', `<head>\n  <base href="${baseHref}">`);
  }

  // Ensure output directory exists
  const resolvedOutputPath = path.resolve(process.cwd(), destPath);
  const outputDir = path.dirname(resolvedOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Launch headless browser
  const executablePath = getExecutablePath();
  const launchOptions = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
      '--window-size=1080,1440'
    ]
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const templateIdentifier = path.basename(fullTemplatePath);
  const brandLabel = activeBrandId || 'none';
  console.log(`[Render Engine] Launching browser (Brand: ${brandLabel}, Template: ${templateIdentifier})...`);
  if (executablePath) {
    console.log(`[Render Engine] Using browser executable: ${executablePath}`);
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();

    // Set high-DPI viewport (1080x1440 base dimensions with deviceScaleFactor)
    await page.setViewport({
      width: 1080,
      height: 1440,
      deviceScaleFactor: scale
    });

    console.log(`[Render Engine] Loading template and waiting for network idle...`);
    await page.setContent(renderedHtml, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });

    // Ensure custom web fonts and layouts are painted
    console.log(`[Render Engine] Waiting for font rendering readiness...`);
    await page.evaluate(async () => {
      if (document.fonts) {
        await document.fonts.ready;
      }
    });

    // Small delay to ensure any CSS transitions or image decodes settle
    await new Promise(resolve => setTimeout(resolve, 300));

    // Capture screenshot
    const isJpeg = format === 'jpeg' || format === 'jpg';
    const screenshotOptions = {
      type: isJpeg ? 'jpeg' : 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1080,
        height: 1440
      },
      omitBackground: false
    };

    if (isJpeg) {
      screenshotOptions.quality = quality;
    }

    console.log(`[Render Engine] Capturing 1080x1440 screenshot (scale: ${scale}x)...`);
    const buffer = await page.screenshot(screenshotOptions);

    // Write to disk with retry loop for Windows file-lock resilience
    let writeSucceeded = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        fs.writeFileSync(resolvedOutputPath, buffer);
        writeSucceeded = true;
        break;
      } catch (writeErr) {
        if (attempt < 3 && (writeErr.code === 'UNKNOWN' || writeErr.code === 'EBUSY' || writeErr.code === 'EPERM')) {
          console.warn(`[Render Engine] Target file locked by viewer/process (attempt ${attempt}/3). Retrying in 500ms...`);
          await new Promise(r => setTimeout(r, 500));
        } else {
          throw writeErr;
        }
      }
    }

    const stats = fs.statSync(resolvedOutputPath);
    console.log(`[Render Engine] Successfully generated: ${resolvedOutputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    return resolvedOutputPath;
  } finally {
    await browser.close();
  }
}

// CLI runner entrypoint
function runCli() {
  const options = parseArgs();

  if (options.listTemplates) {
    printTemplateCatalog(options.templatePack, options.templatePacksDir);
    process.exit(0);
  }

  if (!options.template || !options.output) {
    console.log(`
Universal Headless Social Media Graphic Rendering Engine

Usage:
  node render.js --template <file_path|id> --output <output_path> [options]

Required:
  --template, -t      Path to HTML template file or semantic template ID
  --output, -o        Output image destination path (.png or .jpeg)

Options:
  --data, -d          Path to JSON payload file or inline JSON string
  --brand, -b         Brand pack ID to load from brands directory
  --scale, -s         Retina device scale factor (default: 2 -> 2160x2880, 1 -> 1080x1440)
  --format            Output format: 'png' or 'jpeg' (default: 'png')
  --quality           JPEG quality 1-100 (default: 90)
  --template-pack     Template pack ID (queries template-packs/<pack_id>/)
  --template-packs-dir Custom directory containing template packs
  --brands-dir        Custom directory containing brand packs
  --list-templates    List all templates in the active template pack

Examples:
  node render.js --template templates/announcement.html --data post.json --output dist/announcement.png
  node render.js --template photo-announcement-qr --brand sttf --data mock/data.json --output dist/post.png --scale 2
`);
    process.exit(1);
  }

  renderTemplate({
    brand: options.brand,
    templatePack: options.templatePack,
    template: options.template,
    data: options.data,
    output: options.output,
    scale: options.scale,
    format: options.format,
    quality: options.quality,
    brandsDir: options.brandsDir,
    templatePacksDir: options.templatePacksDir
  })
  .then(outPath => {
    console.log(`\nRender completed successfully.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(`\n[Render Engine Error]:`, err.message);
    process.exit(1);
  });
}

if (require.main === module) {
  runCli();
}

module.exports = {
  renderTemplate,
  resolveTemplatePath,
  loadTemplatePack,
  loadBrandPack,
  printTemplateCatalog,
  resolveLogoUrl,
  runCli
};
