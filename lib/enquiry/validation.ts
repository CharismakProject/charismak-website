/** Shared enquiry rules used by the browser forms and the API routes. */
export const MAX_ATTACHMENTS = 3;
/** Vercel rejects request bodies above ~4.5 MB, so the whole upload must stay below this. */
export const MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = /\.(pdf|jpe?g|png|webp|xlsx|docx)$/i;

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) && value.length <= 254;

export type AttachmentInfo = { name: string; size: number; type: string };

/** Returns an error message, or null when the attachments are acceptable. */
export function checkAttachments(files: AttachmentInfo[]): string | null {
  if (files.length > MAX_ATTACHMENTS) return `Attach a maximum of ${MAX_ATTACHMENTS} files.`;
  for (const file of files) {
    const typeOk = file.type ? ALLOWED_ATTACHMENT_TYPES.has(file.type) : ALLOWED_EXTENSIONS.test(file.name);
    if (!typeOk || !ALLOWED_EXTENSIONS.test(file.name)) return `${file.name} is not a supported PDF, image, Excel (.xlsx) or Word (.docx) file.`;
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
    return `Attachments total ${(total / 1024 / 1024).toFixed(1)} MB; the limit is 4 MB. For larger drawings, paste a Google Drive or Dropbox link in the project details, or email them to info@charismakproject.com.`;
  }
  return null;
}
