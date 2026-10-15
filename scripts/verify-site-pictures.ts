import assert from "node:assert/strict";

import { pictureStatus, rowToSitePicture, selectSliderPictures, statusFlags, type SitePicture } from "../lib/content/site-pictures";

let n = 0;
const pic = (overrides: Partial<SitePicture>): SitePicture => ({
  id: `p${++n}`,
  projectSlug: "jahi-project-development",
  projectTitle: "Jahi",
  projectLocation: "Jahi, Abuja",
  title: "Roof slab",
  summary: "",
  imageUrl: "https://example.test/a.webp",
  altText: "Roof slab formwork",
  updateDate: "2026-10-01T12:00:00Z",
  featured: false,
  displayOrder: 100,
  published: true,
  archived: false,
  ...overrides,
});
const company = new Set(["jahi-project-development", "coco-gwarimpa-project"]);

// Status model.
assert.equal(pictureStatus({ published: false, archived: false }), "draft");
assert.equal(pictureStatus({ published: true, archived: false }), "published");
assert.equal(pictureStatus({ published: false, archived: true }), "archived");
assert.deepEqual(statusFlags("archived"), { published: false, archived: true }, "archiving always unpublishes");
assert.deepEqual(statusFlags("published"), { published: true, archived: false });

// Eligibility: drafts, archived, missing images and non-company projects are excluded.
const draft = pic({ published: false });
const archived = pic({ published: false, archived: true });
const noImage = pic({ imageUrl: "" });
const professional = pic({ projectSlug: "hillside-mansions" });
const ok = pic({});
assert.deepEqual(selectSliderPictures([draft, archived, noImage, professional, ok], company).map((p) => p.id), [ok.id]);

// Ordering: pinned by display order, then newest; unpinned newest first.
const oldPinned = pic({ featured: true, displayOrder: 2, updateDate: "2026-01-01T00:00:00Z" });
const firstPinned = pic({ featured: true, displayOrder: 1, updateDate: "2026-02-01T00:00:00Z" });
const newest = pic({ updateDate: "2026-10-14T00:00:00Z" });
const older = pic({ updateDate: "2026-09-01T00:00:00Z" });
assert.deepEqual(
  selectSliderPictures([older, oldPinned, newest, firstPinned], company).map((p) => p.id),
  [firstPinned.id, oldPinned.id, newest.id, older.id],
);
// Old unpinned photos never outrank newer unpinned ones.
assert.equal(selectSliderPictures([older, newest], company)[0].id, newest.id);
// Limit.
assert.equal(selectSliderPictures(Array.from({ length: 20 }, () => pic({})), company, 12).length, 12);
// Empty input → empty slider (homepage then shows the honest portfolio fallback).
assert.deepEqual(selectSliderPictures([], company), []);

// Row mapping tolerates rows from before the migration (no new columns).
const legacy = rowToSitePicture({ id: "x", project_slug: "jahi-project-development", title: "T", image_url: "u", update_date: "2026-09-01", published: true });
assert.equal(legacy.featured, false);
assert.equal(legacy.archived, false);
assert.equal(legacy.displayOrder, 100);
assert.equal(selectSliderPictures([legacy], company).length, 1);

console.log("Site pictures verification passed.");
