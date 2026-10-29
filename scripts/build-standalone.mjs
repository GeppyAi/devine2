import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const ROOT = process.cwd();

async function buildStandalone() {
  console.log('0. Auto-incrementing semantic version for standalone release...');
  const versionJsonPath = path.join(ROOT, 'version.json');
  let prevVersion = '1.1.0';
  try {
    if (fs.existsSync(versionJsonPath)) {
      const parsedVer = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
      if (parsedVer && typeof parsedVer.version === 'string') {
        prevVersion = parsedVer.version.trim();
      }
    }
  } catch {
    // Fallback to 1.1.0
  }

  const shouldBump = process.env.DIVINE_BUMP_VERSION !== 'false';
  let nextVersion = prevVersion;
  if (shouldBump) {
    const parts = prevVersion.split('.').map((n) => parseInt(n, 10));
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      nextVersion = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    } else {
      nextVersion = '1.1.1';
    }
  }
  console.log(`   Version bumped: v${prevVersion} -> v${nextVersion}`);

  // Sync APP_CURRENT_VERSION in src/app/page.tsx and package.json before transpiling
  const pageTsxPath = path.join(ROOT, 'src', 'app', 'page.tsx');
  if (fs.existsSync(pageTsxPath)) {
    const rawPage = fs.readFileSync(pageTsxPath, 'utf8');
    const updatedPage = rawPage.replace(
      /const APP_CURRENT_VERSION = ['"][^'"]+['"];/,
      `const APP_CURRENT_VERSION = '${nextVersion}';`
    );
    if (updatedPage !== rawPage) {
      fs.writeFileSync(pageTsxPath, updatedPage, 'utf8');
    }
  }
  const pkgJsonPath = path.join(ROOT, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkgObj = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      pkgObj.version = nextVersion;
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgObj, null, 2) + '\n', 'utf8');
    } catch {
      // Ignore package.json write errors
    }
  }

  console.log('1. Optimizing Divine.png into an embedded Base64 Data URI...');
  const tempThumb = path.join(ROOT, 'public', 'divine-logo-thumb.png');
  try {
    execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Image]::FromFile('${path.join(
        ROOT,
        'Divine.png'
      )}'); $bmp = New-Object System.Drawing.Bitmap(160, 160); $g = [System.Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; $g.DrawImage($img, 0, 0, 160, 160); $bmp.Save('${tempThumb}', [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose(); $img.Dispose();"`
    );
  } catch (err) {
    console.warn('Fallback to original Divine.png:', err.message);
  }

  const logoPath = fs.existsSync(tempThumb)
    ? tempThumb
    : path.join(ROOT, 'public', 'divine-logo.png');
  const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
  if (fs.existsSync(tempThumb)) {
    fs.unlinkSync(tempThumb);
  }

  console.log('2. Compiling Tailwind CSS...');
  const rawCss = fs.readFileSync(path.join(ROOT, 'src/app/globals.css'), 'utf8');
  const tailwindConfig = require(path.join(ROOT, 'tailwind.config.js'));
  const cssResult = await postcss([tailwindcss(tailwindConfig), autoprefixer]).process(rawCss, {
    from: path.join(ROOT, 'src/app/globals.css'),
  });

  console.log('3. Extracting used Lucide icons...');
  const usedIcons = [
    'ShieldAlert',
    'FileSpreadsheet',
    'Truck',
    'CreditCard',
    'Clock',
    'ClipboardCheck',
    'Copy',
    'Check',
    'AlertTriangle',
    'Sparkles',
    'Upload',
    'Lock',
    'Calendar',
    'FileText',
    'Send',
    'UserCheck',
    'Building2',
    'Ban',
    'Download',
    'Globe',
    'Paperclip',
    'Trash2',
    'CheckCircle2',
    'FileEdit',
    'RefreshCw',
    'Bug',
    'Lightbulb',
    'MessageSquarePlus',
    'X',
  ];

  const toKebab = (str) =>
    str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
      .replace(/([a-zA-Z])([0-9]+)/g, '$1-$2')
      .toLowerCase();

  const iconDefs = {};
  for (const iconName of usedIcons) {
    const kebab = toKebab(iconName);
    let iconFile = path.join(ROOT, 'node_modules/lucide-react/dist/esm/icons', `${kebab}.js`);
    let content = fs.readFileSync(iconFile, 'utf8');
    const reExportMatch = content.match(/export\s*\{\s*default\s*\}\s*from\s*['"]\.\/([^'"]+)['"]/);
    if (reExportMatch) {
      iconFile = path.join(ROOT, 'node_modules/lucide-react/dist/esm/icons', reExportMatch[1]);
      content = fs.readFileSync(iconFile, 'utf8');
    }
    const match = content.match(/createLucideIcon\("[^"]+",\s*(\[[\s\S]*?\])\);/);
    if (!match) {
      throw new Error(`Could not parse icon: ${iconName} (${iconFile})`);
    }
    iconDefs[iconName] = match[1];
  }

  const lucideShimCode = `
    (function() {
      const React = window.__MODULES__['react'];
      function createLucideIcon(iconName, iconNode) {
        const Component = React.forwardRef(function({ className = '', size = 24, color = 'currentColor', strokeWidth = 2, children, ...rest }, ref) {
          return React.createElement(
            'svg',
            Object.assign({
              ref: ref,
              xmlns: 'http://www.w3.org/2000/svg',
              width: size,
              height: size,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: color,
              strokeWidth: strokeWidth,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              className: ('lucide ' + className).trim()
            }, rest),
            iconNode.map(function(entry) {
              return React.createElement(entry[0], entry[1]);
            }),
            children
          );
        });
        Component.displayName = iconName;
        return Component;
      }
      const exports = {};
      ${Object.entries(iconDefs)
        .map(([name, nodeStr]) => `exports.${name} = createLucideIcon(${JSON.stringify(name)}, ${nodeStr});`)
        .join('\n      ')}
      window.__MODULES__['lucide-react'] = exports;
    })();
  `;

  console.log('4. Loading offline React 19 production runtime...');
  const wrapCjsModule = (moduleName, filePath) => {
    const code = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
    return `
      (function() {
        const module = { exports: {} };
        const exports = module.exports;
        const process = { env: { NODE_ENV: 'production' } };
        const require = function(id) {
          if (window.__MODULES__[id]) return window.__MODULES__[id];
          throw new Error('Module not found: ' + id);
        };
        ${code}
        window.__MODULES__[${JSON.stringify(moduleName)}] = module.exports;
      })();
    `;
  };

  const reactRuntimeBundle = [
    `window.__MODULES__ = {};`,
    wrapCjsModule('scheduler', 'node_modules/scheduler/cjs/scheduler.production.js'),
    wrapCjsModule('react', 'node_modules/react/cjs/react.production.js'),
    wrapCjsModule('react-dom', 'node_modules/react-dom/cjs/react-dom.production.js'),
    wrapCjsModule('react-dom/client', 'node_modules/react-dom/cjs/react-dom-client.production.js'),
    lucideShimCode,
  ].join('\n');

  console.log('5. Transpiling Divine TypeScript / TSX modules...');
  const transpileTsModule = (moduleId, relPath) => {
    let source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    // Replace /divine-logo.png with embedded Base64 Data URI
    source = source.replace(/\/divine-logo\.png/g, logoBase64);

    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
      fileName: relPath,
    });

    return `
      (function() {
        const module = { exports: {} };
        const exports = module.exports;
        const require = function(id) {
          if (window.__MODULES__[id]) return window.__MODULES__[id];
          throw new Error('Module not found: ' + id);
        };
        ${output.outputText}
        window.__MODULES__[${JSON.stringify(moduleId)}] = module.exports;
      })();
    `;
  };

  const appModulesBundle = [
    transpileTsModule('@/types/divine', 'src/types/divine.ts'),
    transpileTsModule('@/data/mockData', 'src/data/mockData.ts'),
    transpileTsModule('@/data/houzzKnowledge', 'src/data/houzzKnowledge.ts'),
    transpileTsModule('@/components/StatusBadge', 'src/components/StatusBadge.tsx'),
    transpileTsModule('@/components/FeedbackWidget', 'src/components/FeedbackWidget.tsx'),
    transpileTsModule('@/app/page', 'src/app/page.tsx'),
    `
      (function() {
        const React = window.__MODULES__['react'];
        const ReactDOMClient = window.__MODULES__['react-dom/client'];
        const DivineDashboard = window.__MODULES__['@/app/page'].default;
        const rootEl = document.getElementById('root');
        const root = ReactDOMClient.createRoot(rootEl);
        root.render(React.createElement(DivineDashboard));
      })();
    `,
  ].join('\n');

  const fullJs = `${reactRuntimeBundle}\n${appModulesBundle}`;
  // Escape any closing </script> tags inside string literals so HTML parser never breaks
  const safeJs = fullJs.replace(/<\/script>/gi, '<\\/script>');

  console.log('5b. Pre-rendering initial HTML and verifying component tree...');
  const vm = require('vm');
  const React = require('react');
  const ReactDOMServer = require('react-dom/server');
  const codeForSsr = fullJs
    .replace('window.__MODULES__["react"] = module.exports;', 'window.__MODULES__["react"] = __HOST_REACT__;')
    .replace(/const rootEl = document\.getElementById\('root'\)[\s\S]*$/, '})();');
  const sandbox = {
    __HOST_REACT__: React,
    window: {},
    document: {},
    navigator: {},
    console,
    setTimeout,
    clearTimeout,
    Date,
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    JSON,
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(codeForSsr, sandbox);
  const prerenderedHtml = ReactDOMServer.renderToString(
    React.createElement(sandbox.__MODULES__['@/app/page'].default)
  );
  console.log(`   Verified SSR output (${Math.round(prerenderedHtml.length / 1024)} KB of rendered DOM).`);

  const buildId = `build-${Date.now()}`;
  const builtAtStr = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';

  const buildMetaBootstrap = `window.__DIVINE_APP_VERSION__ = ${JSON.stringify(
    nextVersion
  )}; window.__DIVINE_BUILD_ID__ = ${JSON.stringify(
    buildId
  )}; window.__DIVINE_BUILT_AT__ = ${JSON.stringify(builtAtStr)};`;

  const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Divine — AI Operations & Procurement Assistant | Sixth Sense Studio (v${nextVersion})</title>
  <link rel="icon" type="image/png" href="${logoBase64}" />
  <style>${cssResult.css}</style>
  <script>${buildMetaBootstrap}</script>
</head>
<body class="min-h-screen antialiased bg-[#faf8f6] text-slate-900">
  <div id="root">${prerenderedHtml}</div>
  <script>${safeJs}</script>
</body>
</html>`;

  const outHtmlPath = path.join(ROOT, 'Divine_Sixth_Sense_Studio_Standalone.html');
  fs.writeFileSync(outHtmlPath, standaloneHtml, 'utf8');

  const versionData = {
    version: nextVersion,
    buildId,
    repository: 'https://github.com/GeppyAi/devine2',
    builtAt: builtAtStr,
    releaseNotes: `v${nextVersion} — Self-contained standalone build with Auto-Incrementing Version Detection, GitHub Bug Relay -> GitBridge Auto-Fix Listener -> Republish to GitHub, Reset/Clear Test Data button, PDF/CSV/File Upload, Bilingual EN/ES toggle, AI Chat Co-Pilot, and 6 Houzz Pro workflow guides.`,
  };
  fs.writeFileSync(path.join(ROOT, 'version.json'), JSON.stringify(versionData, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(ROOT, 'public', 'version.json'),
    JSON.stringify(versionData, null, 2),
    'utf8'
  );

  const readmePath = path.join(ROOT, 'README_HOW_TO_OPEN.txt');
  const readmeText = `========================================================================
DIVINE — AI OPERATIONS & PROCUREMENT ASSISTANT (SIXTH SENSE STUDIO)
SELF-CONTAINED PORTABLE APPLICATION (v${nextVersion})
========================================================================

HOW TO USE THIS APP (NO INSTALLATION REQUIRED):
1. Double-click "Divine_Sixth_Sense_Studio_Standalone.html".
2. It will open immediately in your default web browser (Chrome, Edge, Safari, or Firefox).
3. Works 100% offline and air-gapped on Windows, Mac, iPad, or Chromebook.

ONE-CLICK UPDATES FROM GITHUB (NO NEED TO RE-EMAIL):
- Click the "Update from GitHub (v1.1.0)" button in the top header bar of the app.
- Connected to: https://github.com/GeppyAi/devine2
- You can either click "Hot-Load Latest Version Now" to load the newest version immediately in your browser, or click "Download Updated HTML File" to save the latest standalone file to your computer.

FEATURES INCLUDED:
- Bilingual Interface: Switch between English (EN) and Español (ES) at the top right.
- Divine AI Chat Co-Pilot (Main Page): Ask questions, check Houzz Pro workflows, or test firm safety limits.
- Upload PDF / CSV / Excel / Image: Click "Upload PDF / File" or drag-and-drop vendor quotes, POs, acknowledgments, invoices, Houzz CSV exports, or W-2 timesheets directly into the app.
- 5 Core Operational Pillars:
  1. Procurement & Mafer Coordination (Quote Comparisons, 3-Way Match, Open Order Tracker)
  2. Houzz Pro Tracker & Budget Support (Staging Table, Merge PO Detector, 6 Indexed Houzz Guides)
  3. Vendor Payment Preparation (Approval Packets, Zelle Handle Verification, W-9/COI/Lien Release Checks)
  4. W-2 Payroll Preparation (Hours Summary, Anomaly Detector, QuickBooks Verification Checklist)
  5. Daily Reminders, End-of-Day Brief, Weekly Digest & Monthly Vendor Scorecard
`;
  fs.writeFileSync(readmePath, readmeText, 'utf8');

  const outZipPath = path.join(ROOT, 'Divine_Sixth_Sense_Studio_Email_Package.zip');
  if (fs.existsSync(outZipPath)) {
    fs.unlinkSync(outZipPath);
  }

  console.log('6. Creating compressed Email Package (.zip)...');
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${outHtmlPath}', '${readmePath}' -DestinationPath '${outZipPath}' -Force"`
  );

  const htmlSizeKb = Math.round(fs.statSync(outHtmlPath).size / 1024);
  const zipSizeKb = Math.round(fs.statSync(outZipPath).size / 1024);
  console.log(`SUCCESS!`);
  console.log(`- Standalone HTML App: ${outHtmlPath} (${htmlSizeKb} KB)`);
  console.log(`- Email-Ready ZIP:     ${outZipPath} (${zipSizeKb} KB)`);
}

buildStandalone().catch((err) => {
  console.error(err);
  process.exit(1);
});
