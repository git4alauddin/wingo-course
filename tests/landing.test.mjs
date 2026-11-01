import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { startServer } from '../tools/serve.mjs';

test('course-only page: navigation, responsive layouts, and motion', { timeout: 90000 }, async () => {
  const executable = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(file => file && fs.existsSync(file));
  assert.ok(executable, 'Chrome or Edge is required; set CHROME_PATH if needed.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wingo-course-qa-'));
  const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let diagnostics = '';
  browser.stderr.on('data', chunk => { diagnostics += chunk; });
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const server = await startServer(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  let socket;
  const errors = [];
  try {
    let port;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch {}
      if (port) break;
      await sleep(100);
    }
    assert.ok(port, `Browser did not start: ${diagnostics.slice(-1000)}`);
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl.replace('localhost', '127.0.0.1'));
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let id = 0;
    const pending = new Map();
    socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
      if (message.id) {
        const callback = pending.get(message.id);
        if (callback) { pending.delete(message.id); callback(message); }
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const current = ++id;
      const timer = setTimeout(() => { pending.delete(current); reject(new Error(`Timed out: ${method}`)); }, 10000);
      pending.set(current, message => { clearTimeout(timer); message.error ? reject(new Error(message.error.message)) : resolve(message.result); });
      socket.send(JSON.stringify({ id: current, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const waitFor = async expression => {
      for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(100); }
      throw new Error(`Condition not reached: ${expression}`);
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: base });
    await waitFor("document.readyState === 'complete' && !!document.querySelector('.reading-progress')");
    await evaluate('document.fonts.ready');
    await sleep(1300);
    assert.equal(await evaluate("document.querySelector('.hero-description').textContent.startsWith('There’s more')"), true, 'Unicode typography stays intact');
    assert.equal(await evaluate('document.querySelectorAll("form, input, select, dialog, canvas").length'), 0, 'No playable simulations, calculators, or quizzes');
    assert.deepEqual(await evaluate("[...document.querySelectorAll('a[href^=\"#\"]')].filter(a => a.hash && !document.getElementById(a.hash.slice(1))).map(a => a.hash)"), [], 'All section links have destinations');
    for (const asset of ['assets/images/ball-red.svg', 'assets/images/ball-green.svg', 'assets/images/ball-red-violet.svg', 'assets/images/ball-green-violet.svg']) {
      assert.equal((await fetch(`${base}/${asset}`)).status, 200);
    }
    for (const privatePath of ['/.git/config', '/README.md', '/ref_components/history.png', '/package.json', '/tools/serve.mjs']) {
      assert.equal((await fetch(base + privatePath)).status, 404, `${privatePath} remains outside public files`);
    }
    const screenshot = async (name, full = false) => {
      const clip = full ? await evaluate('({x:0,y:0,width:innerWidth,height:document.documentElement.scrollHeight,scale:1})') : undefined;
      const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, ...(clip ? { clip } : {}) });
      fs.mkdirSync('preview', { recursive: true });
      fs.writeFileSync(`preview/${name}.png`, Buffer.from(result.data, 'base64'));
    };
    await screenshot('desktop-hero');
    await evaluate('(async () => { for (let y=0;y<document.documentElement.scrollHeight;y+=650) { scrollTo({top:y,behavior:"instant"}); await new Promise(r=>setTimeout(r,100)); } scrollTo({top:0,behavior:"instant"}); })()');
    await sleep(900);
    assert.equal(await evaluate("[...document.querySelectorAll('.reveal')].every(el=>el.classList.contains('is-visible'))"), true, 'Scrolling reveals every section');
    await screenshot('desktop-full', true);
    for (const width of [1440, 1024, 768, 600, 393, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 600 });
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `${width}px: no horizontal overflow`);
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 1, mobile: true });
    await evaluate("document.querySelector('.menu-toggle').click()");
    assert.equal(await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"), 'true');
    await evaluate("document.querySelector('#navigation a[href=\"#course\"]').click()");
    assert.equal(await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"), 'false');
    await sleep(900);
    assert.equal(await evaluate('location.hash'), '#course');
    await evaluate("document.querySelectorAll('.curriculum summary')[2].click()");
    assert.equal(await evaluate("document.querySelectorAll('.curriculum details')[2].open"), true);
    await evaluate("document.querySelector('.faq-list summary').click()");
    assert.equal(await evaluate("document.querySelector('.faq-list details').open"), true);
    await evaluate('scrollTo(0,0)');
    await sleep(900);
    await screenshot('mobile-hero');
    await screenshot('mobile-full', true);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await waitFor("!document.documentElement.classList.contains('js-motion')");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.specimen')).animationName"), 'none');
    assert.equal(await evaluate("[...document.querySelectorAll('.reveal')].every(el=>getComputedStyle(el).opacity === '1')"), true);
    assert.deepEqual(errors, [], 'No uncaught JavaScript errors');
    console.log('Verified six viewport widths, section links, course-only scope, mobile menu, accordions, reduced motion, assets, and public-file boundaries.');
  } finally {
    socket?.close();
    browser.kill();
    await new Promise(resolve => server.close(resolve));
    const temporaryRoot = path.resolve(os.tmpdir()) + path.sep;
    if (path.resolve(profile).startsWith(temporaryRoot) && path.basename(profile).startsWith('wingo-course-qa-')) {
      try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch {}
    }
  }
});
