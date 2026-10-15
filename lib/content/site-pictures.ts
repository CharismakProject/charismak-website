/**
 * Site Pictures: admin-managed photographs (table website_project_updates)
 * that feed the homepage "Site progress & project updates" slider.
 */
export type SitePictureStatus = "draft" | "published" | "archived";

export type SitePicture = {
  id: string;
  projectSlug: string;
  projectTitle: string;
  projectLocation: string;
  title: string;
  summary: string;
  imageUrl: string;
  altText: string;
  updateDate: string;
  featured: boolean;
  displayOrder: number;
  published: boolean;
  archived: boolean;
};

export const SLIDER_LIMIT = 12;
export const MAX_SITE_PICTURE_BYTES = 25 * 1024 * 1024;
export const SITE_PICTURE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const pictureStatus = (picture: Pick<SitePicture, "published" | "archived">): SitePictureStatus =>
  picture.archived ? "archived" : picture.published ? "published" : "draft";

export const statusFlags = (status: SitePictureStatus) => ({
  published: status === "published",
  archived: status === "archived",
});

/**
 * Homepage slider selection:
 * 1. Only published, non-archived pictures with an image, linked to a public
 *    Charismak company project (professional-experience projects are excluded).
 * 2. Pinned (featured) pictures first, by the admin's display order, then newest.
 * 3. All other pictures newest first, so fresh site updates are not crowded out
 *    by old photographs unless an admin deliberately pins them.
 */
export function selectSliderPictures(pictures: SitePicture[], companyProjectSlugs: Set<string>, limit = SLIDER_LIMIT): SitePicture[] {
  const eligible = pictures.filter(
    (picture) => picture.published && !picture.archived && picture.imageUrl && companyProjectSlugs.has(picture.projectSlug),
  );
  const time = (picture: SitePicture) => new Date(picture.updateDate).getTime() || 0;
  const featured = eligible
    .filter((picture) => picture.featured)
    .sort((a, b) => a.displayOrder - b.displayOrder || time(b) - time(a));
  const rest = eligible.filter((picture) => !picture.featured).sort((a, b) => time(b) - time(a));
  return [...featured, ...rest].slice(0, limit);
}

export const rowToSitePicture = (row: Record<string, unknown>): SitePicture => ({
  id: String(row.id),
  projectSlug: String(row.project_slug ?? ""),
  projectTitle: String(row.project_title ?? ""),
  projectLocation: String(row.project_location ?? ""),
  title: String(row.title ?? ""),
  summary: String(row.summary ?? ""),
  imageUrl: String(row.image_url ?? ""),
  altText: String(row.alt_text ?? ""),
  updateDate: String(row.update_date ?? ""),
  featured: Boolean(row.featured),
  displayOrder: Number(row.display_order ?? 100),
  published: Boolean(row.published),
  archived: Boolean(row.archived),
});
