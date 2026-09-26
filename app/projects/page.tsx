import { loadPublishedProjects } from "@/lib/content/website-cms";
import ProjectsClient from "./ProjectsClient";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Construction Projects in Abuja & Nigeria",
  description:
    "Explore Charismak construction, renovation, steelwork, quantity surveying and project-management experience across Abuja, Nigeria and East Africa.",
  path: "/projects",
  keywords: ["construction projects Abuja", "building projects Nigeria", "renovation projects Abuja", "construction portfolio Nigeria"],
});

export const revalidate = 300;

export default async function ProjectsPage() {
  const projects = await loadPublishedProjects();
  return <ProjectsClient initialProjects={projects} />;
}
