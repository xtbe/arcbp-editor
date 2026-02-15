#!/usr/bin/env node

/**
 * scrape-images.js
 *
 * Scrapes blueprint images from the Arc Raiders wiki using a headless browser
 * (Puppeteer) and optionally updates a local blueprints JSON file with the
 * downloaded image paths.
 *
 * A headless browser is required because the Fandom wiki renders its content
 * dynamically with JavaScript.
 *
 * Usage:
 *   node scrape-images.js [--output <dir>] [--blueprints <file>]
 *
 * Options:
 *   --output, -o      Directory to save images to (default: ./images)
 *   --blueprints, -b  Path to a blueprints JSON file to update image fields
 *                     (only updates entries whose image field is empty)
 *
 * Examples:
 *   node scrape-images.js
 *   node scrape-images.js --output ./images --blueprints blueprints.json
 */

const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const puppeteer = require("puppeteer");

const WIKI_URL = "https://arc-raiders.fandom.com/wiki/Blueprints";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { output: "./images", blueprints: null };
  for (let i = 2; i < argv.length; i++) {
    if ((argv[i] === "--output" || argv[i] === "-o") && argv[i + 1]) {
      args.output = argv[++i];
    } else if (
      (argv[i] === "--blueprints" || argv[i] === "-b") &&
      argv[i + 1]
    ) {
      args.blueprints = argv[++i];
    }
  }
  return args;
}

/**
 * Launch a headless browser, navigate to the wiki page, wait for the content
 * to render, then extract blueprint names and image URLs from the DOM.
 * Returns an array of { name, imageUrl }.
 */
async function scrapeBlueprints(url) {
  console.log("  Launching headless browser …");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "arcbp-editor-scraper/1.0 (https://github.com/xtbe/arcbp-editor)"
    );

    console.log("  Navigating to wiki page …");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait for the article content to be present
    await page.waitForSelector(".mw-parser-output", { timeout: 30000 });

    // Scroll down to trigger any lazy-loaded images
    await autoScroll(page);

    console.log("  Extracting blueprint data from the page …\n");

    // Extract data from the fully rendered DOM
    const results = await page.evaluate(() => {
      const entries = [];
      const seen = new Set();

      // Strategy 1: Look for table rows with links and images
      document
        .querySelectorAll(".mw-parser-output table tr")
        .forEach((tr) => {
          const link = tr.querySelector("a[title]");
          const name = link
            ? (link.getAttribute("title") || link.textContent || "").trim()
            : "";
          if (!name) return;

          const img = tr.querySelector("img");
          if (!img) return;

          let imageUrl =
            img.getAttribute("data-src") || img.getAttribute("src") || "";
          if (!imageUrl) return;

          // Remove scaling parameters to get the full-size image
          imageUrl = imageUrl.replace(/\/scale-to-width-down\/\d+/, "");
          imageUrl = imageUrl.replace(/\/revision\/latest.*$/, "/revision/latest");

          if (!seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            entries.push({ name, imageUrl });
          }
        });

      // Strategy 2: Gallery items and figure elements (fallback)
      document
        .querySelectorAll(
          ".mw-parser-output .wikia-gallery-item, .mw-parser-output figure"
        )
        .forEach((el) => {
          const captionEl =
            el.querySelector(".lightbox-caption") ||
            el.querySelector("figcaption");
          const linkEl = el.querySelector("a[title]");
          const caption = captionEl
            ? captionEl.textContent.trim()
            : linkEl
              ? (linkEl.getAttribute("title") || "").trim()
              : "";
          if (!caption) return;

          const img = el.querySelector("img");
          if (!img) return;

          let imageUrl =
            img.getAttribute("data-src") || img.getAttribute("src") || "";
          if (!imageUrl) return;

          imageUrl = imageUrl.replace(/\/scale-to-width-down\/\d+/, "");
          imageUrl = imageUrl.replace(/\/revision\/latest.*$/, "/revision/latest");

          if (!seen.has(caption.toLowerCase())) {
            seen.add(caption.toLowerCase());
            entries.push({ name: caption, imageUrl });
          }
        });

      return entries;
    });

    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Scroll through the entire page to trigger lazy-loaded images.
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  // Small pause to let final lazy images load
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

/**
 * Normalize a blueprint name for case-insensitive matching.
 */
function normalizeKey(name) {
  return name.trim().toLowerCase();
}

/**
 * Sanitize a blueprint name into a safe filename.
 */
function toFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Download a single image if it does not already exist locally.
 * Returns the relative path (e.g. "images/anvil.png") or null on failure.
 */
async function downloadImage(imageUrl, name, outputDir) {
  // Determine file extension from URL
  let ext = ".png";
  try {
    const parsed = new URL(imageUrl);
    const urlPath = parsed.pathname;
    const match = urlPath.match(/\.(png|jpe?g|gif|webp|svg)/i);
    if (match) ext = "." + match[1].toLowerCase();
  } catch {
    // keep default .png
  }

  const filename = toFilename(name) + ext;
  const filePath = path.join(outputDir, filename);

  // Do not overwrite existing files
  if (fs.existsSync(filePath)) {
    console.log(`  ⏭  Skipping "${name}" — file already exists: ${filePath}`);
    return path.posix.join(path.basename(outputDir), filename);
  }

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "arcbp-editor-scraper/1.0 (https://github.com/xtbe/arcbp-editor)",
      },
    });
    if (!res.ok) {
      console.warn(
        `  ⚠  Failed to download image for "${name}": ${res.status}`
      );
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`  ✅ Downloaded "${name}" → ${filePath}`);
    return path.posix.join(path.basename(outputDir), filename);
  } catch (err) {
    console.warn(`  ⚠  Error downloading image for "${name}": ${err.message}`);
    return null;
  }
}

/**
 * Update a blueprints JSON file: set the image field for any blueprint
 * whose name matches a scraped entry and whose image field is currently empty.
 */
function updateBlueprintsFile(jsonPath, imageMap) {
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.blueprints)) {
    console.warn("  ⚠  No blueprints array found in", jsonPath);
    return;
  }

  let updated = 0;
  for (const bp of data.blueprints) {
    // Only update if image is empty / not already set
    if (bp.image) continue;

    const key = bp.name ? normalizeKey(bp.name) : "";
    if (key && imageMap.has(key)) {
      bp.image = imageMap.get(key);
      updated++;
    }
  }

  if (updated > 0) {
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n");
    console.log(`\n📝 Updated ${updated} blueprint(s) in ${jsonPath}`);
  } else {
    console.log(`\nNo blueprints needed updating in ${jsonPath}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  console.log(`\n🔍 Fetching blueprint data from:\n   ${WIKI_URL}\n`);

  const blueprints = await scrapeBlueprints(WIKI_URL);

  if (blueprints.length === 0) {
    console.log(
      "⚠  No blueprints found on the page. The page structure may have changed."
    );
    console.log(
      "   Please check the wiki URL and update the parsing logic if needed."
    );
    process.exit(1);
  }

  console.log(`Found ${blueprints.length} blueprint(s) with images.\n`);

  // Ensure output directory exists
  fs.mkdirSync(args.output, { recursive: true });

  // Download images (name → relative path)
  const imageMap = new Map();
  for (const bp of blueprints) {
    const relPath = await downloadImage(bp.imageUrl, bp.name, args.output);
    if (relPath) {
      imageMap.set(normalizeKey(bp.name), relPath);
    }
  }

  console.log(
    `\n🎉 Done! ${imageMap.size} image(s) saved to ${args.output}/\n`
  );

  // Optionally update a blueprints JSON file
  if (args.blueprints) {
    if (!fs.existsSync(args.blueprints)) {
      console.warn(`⚠  Blueprints file not found: ${args.blueprints}`);
    } else {
      updateBlueprintsFile(args.blueprints, imageMap);
    }
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
