import BlogManager from "@/components/blog/blog-manager";

export const metadata = {
  title: "Manage Construction Blog",
  robots: { index: false, follow: false },
};

export default function BlogManagePage() {
  return <BlogManager />;
}
