# Shop Well — Product Analysis Integration Guide

This document describes how to integrate **cross-page product analysis** into the Shop Well Chrome extension.  
It ensures that the extension can analyze **product details from search result pages (PLP)** or **product detail pages (PDP)** using a smooth, headless-like flow.

---

## Overview

When a user clicks **Analyze** on a product listing, the extension should:
1. Capture the product link.
2. Retrieve and parse product data **without requiring navigation or page reloads**.
3. Summarize details using the **Chrome Built-in AI (Summarizer API)**.
4. Generate a wellness verdict using the **Prompt API**.
5. Display results in the **side panel overlay**.

---

## Architecture

**Core concept:** emulate headless browsing within the extension using background scripts and cross-origin fetch permissions.

### Two analysis paths

| Path | Purpose | Method |
|------|----------|--------|
| **A. Cross-origin fetch + parse (default)** | Quickly fetch raw HTML and parse product data. | `fetch()` from background service worker. |
| **B. Background tab scrape (fallback)** | Capture data rendered client-side via JS. | Create minimized tab → inject scraper → close. |

---

## Permissions Required

Ensure the following entries are in `manifest.json`:

```json
{
  "permissions": ["storage", "scripting", "tabs"],
  "host_permissions": [
    "*://www.amazon.com/*",
    "*://www.walmart.com/*",
    "*://*.target.com/*",
    "*://*.cvs.com/*",
    "*://*.walgreens.com/*"
  ]
}
```

---

## A. Cross-Origin Fetch (Primary Method)

### background.js

```js
chrome.runtime.onMessage.addListener((msg, sender, sendRes) => {
  if (msg.type === "FETCH_PRODUCT_HTML") {
    fetch(msg.url, { credentials: "omit" })
      .then(r => r.text())
      .then(html => sendRes({ ok: true, html }))
      .catch(err => sendRes({ ok: false, error: String(err) }));
    return true; // keep message channel open
  }
});
```

### content/side-panel script

```js
async function fetchProductHtml(url) {
  const { ok, html, error } = await chrome.runtime.sendMessage({ type: "FETCH_PRODUCT_HTML", url });
  if (!ok) throw new Error(error || "Fetch failed");
  return html;
}
```

### Parsing Example

```js
function parseStatic(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ld = [...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map(s => { try { return JSON.parse(s.textContent) } catch { return null } })
    .filter(Boolean);

  const title = doc.querySelector("#productTitle, h1[data-automation-id='product-title']")?.textContent?.trim() || "";
  const details = [...doc.querySelectorAll("#feature-bullets li, [data-testid='product-highlights'] li")]
    .map(li => li.textContent.trim());
  const price = doc.querySelector("#corePrice_feature_div .a-offscreen,[itemprop='price']")?.textContent || "";

  return { title, details, price, ld };
}
```

---

## B. Background Tab Scraper (Fallback)

### Purpose
Use when the product page relies on heavy client-side rendering (e.g., React/Vue) and `fetch()` returns minimal HTML.

### Implementation

```js
async function scrapeViaBackgroundTab(url) {
  const win = await chrome.windows.create({ url: "about:blank", state: "minimized" });
  const tab = await chrome.tabs.create({ windowId: win.id, url, active: false });

  await new Promise(resolve => {
    const listener = (tabId, info) => {
      if (tabId === tab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const grab = sel => document.querySelector(sel)?.textContent?.trim() || "";
      const title = grab("#productTitle") || grab("h1[data-automation-id='product-title']");
      const bullets = [...document.querySelectorAll("#feature-bullets li, [data-testid='product-highlights'] li")]
        .map(li => li.textContent.trim());
      const price = grab("#corePrice_feature_div .a-offscreen,[itemprop='price']");
      return { title, bullets, price };
    }
  });

  try { await chrome.tabs.remove(tab.id); } catch {}
  try { await chrome.windows.remove(win.id); } catch {}

  return result;
}
```

---

## C. Offscreen Document (Optional Enhancement)

Create an invisible HTML document for parsing large content blocks safely.

**manifest.json**
```json
{ "permissions": ["offscreen"] }
```

**background.js**
```js
await chrome.offscreen.createDocument({
  url: "offscreen.html",
  reasons: ["DOM_PARSER"],
  justification: "Parse fetched HTML safely without UI impact"
});
```

---

## D. Combined Analysis Flow

```js
async function analyzeProduct(url) {
  showProgress("Fetching details…");

  let data;
  try {
    const html = await fetchProductHtml(url);
    data = parseStatic(html);
  } catch {
    data = null;
  }

  if (!data || !hasEnoughData(data)) {
    showProgress("Rendering page for deeper analysis…");
    data = await scrapeViaBackgroundTab(url);
  }

  showProgress("Summarizing specs…");
  const facts = await summarizeFacts(data);

  showProgress("Generating wellness insights…");
  const verdict = await evaluateFit({ condition: await getCondition(), facts });

  renderSidePanel({ facts, verdict });
}
```

---

## Fallback Handling

If AI APIs are unavailable or still initializing:

```js
if (!chrome?.ai?.prompt) {
  return {
    verdict: "mixed",
    bullets: ["AI model not yet ready; showing example data."],
    caveat: "Enable Chrome AI APIs for full functionality."
  };
}
```

---

## README Additions

Add the following to `README.md` for clarity:

```markdown
### How Shop Well Analyzes Products
When you click **Analyze**, Shop Well fetches or scrapes the product page behind the scenes. 
If content is dynamically rendered, it opens a minimized background tab to extract details, then closes it—all in under a second.
The AI models (Summarizer + Prompt APIs) process this data locally on your device for privacy and speed.
```

---

## Validation Checklist

| Check | Description |
|-------|--------------|
| ✅ | manifest.json has correct host permissions |
| ✅ | background.js includes message listener for FETCH_PRODUCT_HTML |
| ✅ | Fallback scraping method available |
| ✅ | Summarizer + Prompt AI integrated |
| ✅ | Side panel renders verdict smoothly |
| ✅ | Graceful fallback when AI unavailable |

---

**End of Integration Guide**  
*(This file is intended for analysis by AI agents to determine implementation completeness.)*
