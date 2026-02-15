#!/usr/bin/env node

/**
 * scrape-images.js
 *
 * Scrapes blueprint images from the Arc Raiders wiki and optionally
 * updates a local blueprints JSON file with the downloaded image paths.
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
const cheerio = require("cheerio");

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
 * Fetch the HTML content of the wiki page.
 */
async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "arcbp-editor-scraper/1.0 (https://github.com/xtbe/arcbp-editor)",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/**
 * Parse the wiki page and extract blueprint names and their image URLs.
 * Returns an array of { name, imageUrl }.
 */
function extractBlueprints(html) {
  const $ = cheerio.load(html);
  const results = [];

  // The Fandom wiki Blueprints page typically uses tables or card layouts.
  // We look for links with images inside article content.
  $(".mw-parser-output table")
    .find("tr")
    .each((_i, tr) => {
      const $tr = $(tr);

      // Try to find the blueprint name from a link in the row
      const nameLink = $tr.find("a[title]").first();
      const name = nameLink.attr("title") || nameLink.text().trim();
      if (!name) return;

      // Try to find an image in the row
      const img = $tr.find("img").first();
      if (!img.length) return;

      // Prefer data-src (lazy-loaded) over src; strip scaling params
      let imageUrl = img.attr("data-src") || img.attr("src") || "";
      if (!imageUrl) return;

      // Remove Fandom's image scaling parameters (e.g. /scale-to-width-down/40)
      imageUrl = imageUrl.replace(/\/scale-to-width-down\/\d+/, "");
      imageUrl = imageUrl.replace(/\/revision\/latest.*$/, "/revision/latest");

      results.push({ name: name.trim(), imageUrl });
    });

  // Fallback: also scan gallery items and figure elements
  $(".mw-parser-output .wikia-gallery-item, .mw-parser-output figure").each(
    (_i, el) => {
      const $el = $(el);
      const caption =
        $el.find(".lightbox-caption, figcaption").text().trim() ||
        $el.find("a[title]").attr("title") ||
        "";
      if (!caption) return;

      const img = $el.find("img").first();
      let imageUrl = img.attr("data-src") || img.attr("src") || "";
      if (!imageUrl) return;

      imageUrl = imageUrl.replace(/\/scale-to-width-down\/\d+/, "");
      imageUrl = imageUrl.replace(/\/revision\/latest.*$/, "/revision/latest");

      // Avoid duplicates
      if (!results.some((r) => r.name === caption)) {
        results.push({ name: caption, imageUrl });
      }
    }
  );

  return results;
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

  const html = await fetchPage(WIKI_URL);
  const blueprints = extractBlueprints(html);

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
