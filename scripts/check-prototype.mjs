import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), 'utf8');
const pkg = JSON.parse(read('package.json'));
const index = read('src/pages/index.astro');
const header = read('src/components/Header.astro');
const globalCss = read('src/styles/global.css');
const tokenCss = read('src/styles/tokens.css');
const hero = read('src/components/Hero.astro');
const footer = read('src/components/FooterStatus.astro');
const about = read('src/pages/about.astro');
const contact = read('src/pages/contact.astro');
const themeToggle = read('src/components/ThemeToggle.astro');
const contentConfig = read('src/content.config.ts');
const projectsData = read('src/data/projects.ts');
const notesIndex = read('src/pages/notes.astro');
const noteDetail = read('src/pages/notes/[slug].astro');
const labDetail = read('src/pages/labs/[slug].astro');
const siteConfig = read('src/config/site.ts');
const siteHead = read('src/components/SiteHead.astro');
const astroConfig = read('astro.config.mjs');
const robotsTxt = read('public/robots.txt');
const cloudflareHeaders = read('public/_headers');
const sitemap = read('src/pages/sitemap.xml.ts');
const noteFiles = walk('src/content/notes').filter((file) => file.endsWith('.md'));

for (const id of ['about', 'work', 'contact']) {
  assert.match(index + read('src/components/FooterStatus.astro'), new RegExp(`id=["']${id}["']`), `missing section id #${id}`);
}

const pageLayout = read('src/layouts/PageLayout.astro');

for (const href of ['/about', '/labs']) {
  assert.match(header, new RegExp(`href: ['"]${href}['"]`), `header navbar missing ${href}`);
  assert.match(pageLayout, new RegExp(`href: ['"]${href}['"]`), `page layout navbar missing ${href}`);
}

// WORK remains a homepage section, while LABS is the dedicated project index.
assert.match(index, /<section id="work"[\s\S]*href="\/labs"/, 'homepage work section should link to the labs index');

const navSource = header + pageLayout;
assert.match(
  navSource,
  /label:\s*['"]LABS['"],\s*href:\s*['"]\/labs['"]/,
  'primary LABS nav should point to the labs index page',
);



assert.match(about + contact + footer, /mailto:ktythaung@gmail\.com/, 'contact surfaces must use Freddie\'s real email');
assert.doesNotMatch(about + contact + footer, /hello@ktt\.dev/, 'placeholder email must not appear in live contact surfaces');
assert.doesNotMatch(footer, /SYSTEM OPERATIONAL|footer-status/, 'footer should not show the old system operational status block');
assert.match(footer, /Freddie K\./, 'footer should show the Freddie K. brand');
assert.doesNotMatch(footer, /ktt\.dev|kt\.dev/i, 'footer must not show old KTT/KT.DEV branding');
assert.match(themeToggle, /class="theme-toggle is-dark"/, 'theme toggle should render a default visible dark icon before JS runs');
assert.doesNotMatch(themeToggle, /class="nav-pill theme-toggle/, 'theme toggle should not inherit full nav-pill sizing');
assert.match(themeToggle, /width:\s*2\.75rem/, 'theme toggle should stay compact instead of becoming a large nav tile');
assert.match(themeToggle, /height:\s*2\.75rem/, 'theme toggle should keep a compact square hit area');
assert.match(themeToggle, /theme-icon-svg/, 'theme toggle should use an SVG icon, not the old CSS-only dot');
assert.match(themeToggle, /class="moon-icon"/, 'theme toggle needs a visible moon icon group');
assert.match(themeToggle, /class="sun-icon"/, 'theme toggle needs a visible sun icon group');
assert.match(themeToggle, /sun-rays/, 'theme toggle should include light-mode rays');
assert.match(themeToggle, /freddie-portfolio-theme/, 'theme toggle should use the freddie-portfolio localStorage key');
assert.doesNotMatch(themeToggle + pageLayout, /ktt-dev-theme/, 'no source file should reference the old ktt-dev-theme localStorage key');
assert.match(themeToggle, /vector-effect="non-scaling-stroke"/, 'theme icon strokes should render crisply and reliably');
assert.doesNotMatch(themeToggle, /@keyframes|animation:/, 'theme toggle icon swaps instantly (motion is colour-only)');
assert.match(index, /<SiteHead\s*\/>/, 'homepage should use shared SiteHead metadata component');
assert.match(read('src/layouts/PageLayout.astro'), /<SiteHead[\s\S]*path=\{path\}/, 'inner pages should use shared SiteHead metadata component');
assert.match(siteHead, /rel="canonical"/, 'shared head should render canonical URLs');
assert.match(siteHead, /og:url/, 'shared head should render Open Graph URLs');
assert.match(siteHead, /twitter:image/, 'shared head should render Twitter image metadata');
assert.match(siteHead, /rel="icon" href="\/favicon\.ico\?v=offscript-k-black2"/, 'shared head should use the Offscript K favicon for browser tabs');
assert.match(siteHead, /rel="icon" type="image\/png" sizes="512x512" href="\/favicon\.png\?v=offscript-k-black2"/, 'shared head should expose the Offscript K PNG favicon');
assert.match(siteHead, /rel="apple-touch-icon" href="\/apple-touch-icon\.png\?v=offscript-k-black2"/, 'shared head should expose the Offscript K Apple touch icon');
assert.match(astroConfig, /PUBLIC_SITE_URL/, 'Astro config should allow production site URL override');
assert.match(siteConfig, /freddie-portfolio\.pages\.dev/, 'site config should include a free Cloudflare Pages fallback origin');
assert.match(robotsTxt, /Sitemap:\s*https:\/\/freddie-portfolio\.pages\.dev\/sitemap\.xml/, 'robots.txt should point crawlers at the sitemap');
assert.match(cloudflareHeaders, /X-Frame-Options:\s*DENY/, 'Cloudflare headers should include clickjacking protection');
assert.match(sitemap, /getCollection\('notes'\)/, 'sitemap should include content collection notes');
assert.match(sitemap, /projects\.map/, 'sitemap should include labs project routes');
assert.doesNotMatch(header, /brand-symbol|sirius-lunar-node\.png/, 'Sirius mark should be favicon-only and must not render inside the page header');
for (const asset of [
  'public/favicon.png',
  'public/favicon.ico',
  'public/apple-touch-icon.png',
]) {
  assert.ok(statSync(join(root, asset)).size > 0, `${asset} should exist and be non-empty`);
}

assert.ok(!pkg.dependencies?.gsap && !pkg.devDependencies?.gsap, 'gsap must not be installed: motion is CSS colour-only (see docs/superpowers/specs/2026-10-14-motion-refactor-design.md)');
assert.match(index, /class="section-pointer" href="\/about"/, 'homepage about section should point to the full about page');
assert.match(index, /class="section-pointer" href="\/labs"/, 'homepage labs section should point to the labs index page');
assert.doesNotMatch(index, /mini-preview-grid/, 'homepage should avoid dense preview-card grids');
assert.match(hero, /profile-about\.jpg/, 'main hero must reuse the existing About portrait asset');
assert.match(hero, /\.\.\/assets\/images\/profile-about\.jpg/, 'main hero must import the portrait from a repo-local asset path');
assert.match(about, /\.\.\/assets\/images\/profile-about\.jpg/, 'about page must import the portrait from a repo-local asset path');
assert.doesNotMatch(hero + about, /imported\/freddie-portfolio-v2/, "buildable pages must not import assets from Freddie's local imported folder");
assert.match(hero, /<Image[\s\S]*alt=/, 'main hero portrait must render as an accessible responsive Astro image');
assert.match(hero, /font-size:\s*clamp\(1\.55rem, 3\.15vw, 3\.05rem\)/, 'hero headline should be reduced so text is not visually dominant');
assert.match(hero, /max-width:\s*20ch/, 'hero headline should use a wider measure to reduce poster-like line breaks');
assert.ok(Number(hero.match(/width=\{(\d+)\}/)?.[1]) >= 352, 'hero image needs at least 2x desktop pixel density for Retina displays');
assert.match(hero, /width:\s*11rem/, 'main hero desktop CSS image size should match the original portfolio md:w-44 sizing');
assert.match(hero, /width:\s*7rem/, 'main hero mobile CSS image size should match the original portfolio w-28 sizing');

assert.match(globalCss, /width:\s*min\(1080px, calc\(100% - 2rem\)\)/, 'page shell should use the approved balanced desktop layout width');
assert.match(globalCss, /\.grid-tags\s*>\s*span\s*{/, 'grid tag styles must target only direct child tag labels');
assert.doesNotMatch(globalCss, /\.grid-tags\s+span\s*{/, 'broad grid tag selector makes nested tag dots render as large pills');
assert.match(contentConfig, /publisher:\s*z\.string\(\)\.optional\(\)\.default\('Freddie K\.'\)/, 'notes schema should include a default publisher');
for (const file of noteFiles) {
  assert.match(read(file), /^publisher:\s*["']Freddie K\.["']/m, `${file} missing Freddie K. publisher frontmatter`);
}
assert.match(notesIndex + noteDetail, /note\.data\.publisher/, 'notes pages should render note publisher metadata');
assert.match(projectsData, /sourceUrl:\s*'https:\/\/github\.com\/FreddieKT\/xlab-agent-platform'/, 'labs project data should link to a current public source');
assert.doesNotMatch(projectsData, /pos-starter-kit|ktm-cargo|paperclip/, 'labs project data should not include replaced project entries');
assert.match(labDetail, /project\.sourceUrl/, 'labs detail should render the public source link');
assert.match(tokenCss, /--panel-overlay:/, 'theme tokens need theme-aware panel overlay');
assert.doesNotMatch(globalCss, /rgba\(10, 13, 18, 0\.92\)/, 'global styles still contain stale hardcoded dark panel rgba');

function walk(dir) {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = join(dir, name);
    const abs = join(root, rel);
    return statSync(abs).isDirectory() ? walk(rel) : [rel];
  });
}

const sourceFiles = walk('src').filter((file) => /\.(astro|css|ts)$/.test(file));

// Motion guard: colour-only feedback. See docs/superpowers/specs/2026-10-14-motion-refactor-design.md
const motionSpec = 'docs/superpowers/specs/2026-10-14-motion-refactor-design.md';
function motionViolations(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, ''); // comments are prose, not declarations
  const found = [];
  if (/\bgsap\b|data-animate/.test(text)) found.push('entrance animation (gsap/data-animate)');
  // Allowlist from the spec: only colour-ish properties (and small-icon opacity) may transition.
  const allowed = /^(none|color|opacity|outline-color|background(-color)?|border(-(top|right|bottom|left))?-color)$/;
  for (const [, value] of text.matchAll(/transition(?:-property)?:\s*([^;]+);/g)) {
    for (const part of value.split(',')) {
      const prop = part.trim().split(/\s+/)[0];
      if (!allowed.test(prop)) found.push(`transition of "${prop}"`);
    }
  }
  for (const [, body] of text.matchAll(/:(?:hover|active|focus-visible)[^{]*\{([^}]*)\}/g)) {
    if (/(^|[;{\s])(transform|translate|scale|rotate|margin(-\w+)?|padding(-\w+)?|top|right|bottom|left|gap|width|height)\s*:/.test(body)) {
      found.push(`moving state rule: ${body.trim()}`);
    }
  }
  // Keyframes (incl. view-transition overrides) may only animate opacity.
  for (const [, name, body] of text.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
    for (const [, prop] of body.matchAll(/([\w-]+)\s*:/g)) {
      if (prop !== 'opacity') found.push(`keyframes ${name} animates "${prop}"`);
    }
  }
  return found;
}
// Self-check: each sample must be caught, so the guard cannot silently weaken.
for (const sample of [
  '.a { transition-property: transform; }',
  '.a { transition: translate 150ms ease; }',
  '.a { transition: margin-left 150ms ease; }',
  '.a:hover { translate: 0 -2px; }',
  '.a:hover { margin-top: -3px; }',
  '.a:focus-visible { transform: scale(1.1); }',
  '@keyframes slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }',
]) {
  assert.notDeepEqual(motionViolations(sample), [], `motion guard missed: ${sample}`);
}
assert.deepEqual(motionViolations('/* Page transition: the browser fades */ .a { transition: color var(--motion-fast) ease, border-left-color var(--motion-fast) ease; } .a:focus-visible { outline-offset: 2px; text-underline-offset: 0.25rem; }'), [], 'motion guard flags allowed colour transitions');
for (const file of sourceFiles) {
  assert.deepEqual(motionViolations(read(file)), [], `${file}: motion must be colour-only (${motionSpec})`);
}
// Page transition: native cross-document fade, off under reduced motion, header held still.
assert.match(globalCss, /@media \(prefers-reduced-motion: no-preference\) \{\s*@view-transition \{\s*navigation: auto;/, 'page transitions use native @view-transition, enabled only without reduced motion');
assert.match(globalCss, /::view-transition-group\(site-header\)\s*\{\s*animation: none;/, 'header must not animate during page transitions');
assert.match(header, /view-transition-name: site-header;/, 'header needs a view-transition-name so it stays still across pages');
assert.match(tokenCss, /--motion-page: 200ms;/, 'page transition duration comes from one token');
assert.ok(siteHead.indexOf("addEventListener('touchstart'") < siteHead.indexOf('localStorage'), 'touchstart listener must register before localStorage access, which can throw when storage is blocked');
assert.match(siteHead, /addEventListener\('touchstart',\s*\(\)\s*=>\s*\{\},\s*\{\s*passive:\s*true\s*\}\)/, 'SiteHead must register a passive touchstart listener so iOS Safari applies :active');
// Drops every `@media (hover: hover) { ... }` block, matching braces so one-line rules inside are handled.
function stripHoverMedia(css) {
  const open = /@media\s*\(hover:\s*hover\)\s*\{/g;
  let out = '';
  let from = 0;
  for (let m; (m = open.exec(css)); ) {
    out += css.slice(from, m.index);
    let depth = 1;
    let i = open.lastIndex;
    while (depth && i < css.length) depth += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0, i++;
    from = open.lastIndex = i;
  }
  return out + css.slice(from);
}
for (const file of sourceFiles.filter((f) => f.endsWith('.astro') || f.endsWith('.css'))) {
  const text = read(file);
  const ungated = stripHoverMedia(text).match(/[^\n]*:hover[^\n]*/g) ?? [];
  assert.deepEqual(ungated, [], `${file}: :hover must live inside @media (hover: hover)`);
}
const staleDarkPattern = /background:\s*rgba\(10, 13, 18, 0\.92\)/;
const stale = sourceFiles.filter((file) => staleDarkPattern.test(read(file)));
assert.deepEqual(stale, [], `stale hardcoded dark component backgrounds: ${stale.join(', ')}`);

console.log('prototype checks passed');
