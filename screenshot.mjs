import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error('Usage: node screenshot.mjs <http://localhost:5173> [label]');
  process.exit(1);
}

const outputDir = path.resolve('temporary screenshots');
fs.mkdirSync(outputDir, { recursive: true });

const existing = fs
  .readdirSync(outputDir)
  .map((file) => file.match(/^screenshot-(\d+)/)?.[1])
  .filter(Boolean)
  .map(Number)
  .sort((a, b) => b - a);

const next = (existing[0] ?? 0) + 1;
const suffix = label ? `-${label.replace(/[^a-zA-Z0-9_-]+/g, '-')}` : '';
const fileName = `screenshot-${next}${suffix}.png`;
const outputPath = path.join(outputDir, fileName);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.setViewport({ width: 1600, height: 2200, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
await page.screenshot({ path: outputPath, fullPage: true });

await browser.close();
console.log(outputPath);
