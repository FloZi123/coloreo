import puppeteer from "puppeteer-core";

const CHROME = "C:/Users/user/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe";
const BASE = "http://localhost:3100";
const pages = process.argv.slice(2);
if (pages.length === 0) pages.push("de:home");

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

for (const spec of pages) {
  const url = spec.split(":")[0];
  const name = spec.split(":")[1] ?? url.replace(/\//g, "_");
  await page.goto(`${BASE}/${url}`, { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `shot-${name}.png`, fullPage: true });
  console.log(`shot-${name}.png`);
}
await browser.close();
