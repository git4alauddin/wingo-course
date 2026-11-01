import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { renderPage, loadConfiguration } from '../tools/render.mjs';

test('root and deployment HTML are fully rendered static entry points', async () => {
  const expected = await renderPage();
  for (const file of ['index.html', 'dist/index.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.ok(!/\{\{[\w.]+\}\}/.test(html), `${file} must not expose template placeholders`);
    assert.equal(html, expected, `${file} must reflect the latest configuration; run npm run build`);
  }
  const published = await readdir(new URL('../dist/', import.meta.url));
  assert.ok(!published.includes('templates'));
  assert.ok(!published.includes('config'));
});

test('both configuration files render complete, knowledge-first static HTML', async () => {
  const config = await loadConfiguration();
  const html = await renderPage(config);
  assert.ok(!html.includes('{{'), 'No template markers reach the published page');
  assert.ok(html.includes(config.disclosures.noticeText));
  assert.ok(html.includes(config.disclosures.heroNote));
  assert.ok(html.includes(config.disclosures.footerNote));
  assert.ok(html.includes(config.disclosures.profitAnswer));
  assert.ok(html.includes(config.site.course.accessAnswer));
  assert.equal((html.match(/class="button[^\"]*" href="#course"/g) ?? []).length, 4);
});

test('one course URL updates every course CTA and content is escaped as text', async () => {
  const config = await loadConfiguration();
  config.site.course.url = 'https://example.com/course?source=site&version=1';
  config.site.brand.name = 'Learning <first> & "always"';
  config.disclosures.noticeText = 'Treat <script>alert(1)</script> as text.';
  config.site.motion.scrollReveals = false;
  config.site.motion.floatingArtwork = false;
  const html = await renderPage(config);
  assert.equal((html.match(/href="https:\/\/example.com\/course\?source=site&amp;version=1"/g) ?? []).length, 4);
  assert.ok(html.includes('Learning &lt;first&gt; &amp; &quot;always&quot;'));
  assert.ok(html.includes('Treat &lt;script&gt;alert(1)&lt;/script&gt; as text.'));
  assert.ok(html.includes('data-scroll-reveals="false"'));
  assert.ok(html.includes('data-floating-artwork="false"'));
});

test('configuration errors fail clearly before producing a broken page', async () => {
  for (const url of ['javascript:alert(1)', '//example.com', '#missing', '']) {
    const config = await loadConfiguration();
    config.site.course.url = url;
    await assert.rejects(renderPage(config), /Course destination|site.course.url/);
  }
  const config = await loadConfiguration();
  config.site.theme.gold = 'red;display:none';
  await assert.rejects(renderPage(config), /six-digit hex/);
  config.site.theme.gold = '#e9cc86';
  config.site.motion.scrollReveals = 'false';
  await assert.rejects(renderPage(config), /must be true or false/);
  config.site.motion.scrollReveals = false;
  delete config.disclosures.noticeText;
  await assert.rejects(renderPage(config), /Missing configuration value: disclosures.noticeText/);
});
