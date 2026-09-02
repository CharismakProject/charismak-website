import type { ReactNode } from "react";

import { loadPublishedProjects } from "@/lib/content/website-cms";

export const revalidate = 300;

export async function generateStaticParams() {
  const projects = await loadPublishedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export default function ProjectDetailsLayout({ children }: { children: ReactNode }) {
  return children;
}
