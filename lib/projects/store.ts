import type { NewUniversalProject, UniversalProject } from "./models";

const PROJECTS_KEY = "charismak-universal-projects-v1";
export const PROJECTS_UPDATED_EVENT = "charismak:projects-updated";

const canUseStorage = () => typeof localStorage !== "undefined";

const makeId = () =>
  `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const notify = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROJECTS_UPDATED_EVENT));
  }
};

export function loadProjects(): UniversalProject[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return (parsed as UniversalProject[]).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  } catch {
    return [];
  }
}

export function saveProject(project: UniversalProject): UniversalProject {
  const next = { ...project, updatedAt: new Date().toISOString() };
  if (canUseStorage()) {
    const projects = loadProjects();
    const existingIndex = projects.findIndex((item) => item.id === next.id);
    if (existingIndex >= 0) projects[existingIndex] = next;
    else projects.unshift(next);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    notify();
  }
  return next;
}

export function createProject(input: NewUniversalProject): UniversalProject {
  const now = new Date().toISOString();
  return saveProject({
    ...input,
    id: makeId(),
    status: "estimating",
    createdAt: now,
    updatedAt: now,
  });
}

export function removeProject(id: string): UniversalProject[] {
  const next = loadProjects().filter((project) => project.id !== id);
  if (canUseStorage()) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
    notify();
  }
  return next;
}
