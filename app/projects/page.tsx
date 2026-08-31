import { loadPublishedProjects } from "@/lib/content/website-cms";
import ProjectsClient from "./ProjectsClient";

export const metadata = {
  title: "Our Projects",
  description:
    "Explore Charismak Project Nigeria Limited's construction, renovation, and consultancy project portfolio across Nigeria and East Africa.",
};

export const revalidate = 300;

export default async function ProjectsPage() {
  const projects = await loadPublishedProjects();
  return <ProjectsClient initialProjects={projects} />;
}
