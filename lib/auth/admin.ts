const adminEmails = (
  process.env.NEXT_PUBLIC_ESTIMATOR_ADMIN_EMAILS
  ?? "md@charismakproject.com,info@charismakproject.com"
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && adminEmails.includes(email.trim().toLowerCase()));
}
