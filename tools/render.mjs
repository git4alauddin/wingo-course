import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export async function loadConfiguration() {
  const [site, disclosures] = await Promise.all(['site', 'disclosures'].map(async name => {
    const source = await readFile(resolve(root, 'config', `${name}.json`), 'utf8');
    try { return JSON.parse(source.replace(/^\uFEFF/, '')); }
    catch (error) { throw new Error(`Invalid config/${name}.json: ${error.message}`); }
  }));
  return { site, disclosures };
}

export async function renderPage(configuration) {
  configuration ??= await loadConfiguration();
  const { site } = configuration;
  // These values enter CSS/URLs rather than ordinary text. Keep their formats narrow.
  for (const [name, color] of Object.entries(site.theme ?? {})) {
    if (!/^#[\da-f]{6}$/i.test(color)) throw new Error(`site.theme.${name} must be a six-digit hex color.`);
  }
  for (const [name, enabled] of Object.entries(site.motion ?? {})) {
    if (typeof enabled !== 'boolean') throw new Error(`site.motion.${name} must be true or false.`);
  }
  const url = site.course?.url;
  const validAnchor = typeof url === 'string' && /^#[a-z][\w-]*$/i.test(url);
  let validWebUrl = false;
  try {
    const parsed = new URL(url);
    validWebUrl = ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {}
  if (!validAnchor && !validWebUrl) throw new Error('site.course.url must be a section anchor or an http(s) URL.');

  const template = await readFile(resolve(root, 'templates/index.html'), 'utf8');
  if (validAnchor && !template.includes(`id="${url.slice(1)}"`)) throw new Error(`Course destination ${url} does not exist on the page.`);
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    const value = key.split('.').reduce((current, part) => current?.[part], configuration);
    if (!['string', 'boolean'].includes(typeof value) || value === '') throw new Error(`Missing configuration value: ${key}`);
    return escapeHtml(value);
  });
}
