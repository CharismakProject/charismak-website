import assert from "node:assert/strict";

import { MAX_TOTAL_ATTACHMENT_BYTES, checkAttachments, isValidEmail } from "../lib/enquiry/validation";

assert.ok(isValidEmail("client@example.com"));
assert.ok(!isValidEmail("client@"));
assert.ok(!isValidEmail("client example.com"));
assert.ok(!isValidEmail(""));

const pdf = { name: "drawing.pdf", size: 1024, type: "application/pdf" };
assert.equal(checkAttachments([]), null);
assert.equal(checkAttachments([pdf]), null);
assert.equal(checkAttachments([{ ...pdf, name: "boq.xlsx", type: "" }]), null, "extension accepted when browser omits type");
assert.match(checkAttachments([pdf, pdf, pdf, pdf]) ?? "", /maximum of 3/);
assert.match(checkAttachments([{ name: "virus.exe", size: 10, type: "application/x-msdownload" }]) ?? "", /not a supported/);
assert.match(checkAttachments([{ name: "renamed.exe", size: 10, type: "application/pdf" }]) ?? "", /not a supported/, "extension must also match");
assert.match(checkAttachments([{ ...pdf, size: MAX_TOTAL_ATTACHMENT_BYTES + 1 }]) ?? "", /limit is 4 MB/);
assert.equal(checkAttachments([{ ...pdf, size: MAX_TOTAL_ATTACHMENT_BYTES }]), null);

console.log("Enquiry validation verification passed.");
