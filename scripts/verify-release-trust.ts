import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const marketplaceData = read("lib/platform/marketplace.ts");
const marketplaceUi = read("components/marketplace/marketplace-directory.tsx");
const priceBrowser = read("components/pricing/market-price-browser.tsx");
const publicCopy = [
  read("app/page.tsx"),
  read("app/about/page.tsx"),
  read("app/services/page.tsx"),
  read("app/estimator/page.tsx"),
  read("app/components/Footer.tsx"),
].join("\n");

const failures: string[] = [];

const reject = (condition: boolean, message: string) => {
  if (condition) failures.push(message);
};

reject(marketplaceData.includes("LOCAL_REVIEW_KEY"), "Marketplace reviews must not fall back to localStorage.");
reject(marketplaceData.includes("submitMarketplaceReview"), "Public review submission must stay disabled until it is fully persisted and moderated.");
reject(marketplaceUi.includes("Review saved on this device"), "Marketplace UI must not present device-only reviews as public feedback.");
reject(marketplaceUi.includes("Leave a review"), "Public review controls must stay disabled until the review system is production-ready.");
reject(priceBrowser.includes("const previewImages"), "Public price cards must not use third-party preview-image maps.");
reject(/<img[\s\S]*?src=\{?['\"]https?:\/\//i.test(priceBrowser), "Public price cards must not hotlink remote product images.");

const discouragedCopy = [
  "commercial awareness",
  "practical commercial control",
  "structured execution",
  "technical control",
  "controlled project delivery",
  "disciplined supervision",
];

for (const phrase of discouragedCopy) {
  reject(publicCopy.toLowerCase().includes(phrase), `Public copy must not regress to the phrase: ${phrase}`);
}

if (failures.length) {
  console.error("Release trust checks failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Release trust checks passed.");
