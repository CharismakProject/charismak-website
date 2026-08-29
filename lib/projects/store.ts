import { deleteProjectCloud, persistProjectCloud } from "@/lib/estimator/cloud";
import type { NewUniversalProject, UniversalProject } from "./models";

const PROJECTS_KEY = "charismak-universal-projects-v1";
const ACTIVE_PROJECT_KEY = "charismak-active-project-v1";
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

export function loadProject(id: string): UniversalProject | null {
  return loadProjects().find((project) => project.id === id) ?? null;
}

export function setActiveProject(project: UniversalProject | string | null) {
  if (!canUseStorage()) return;
  const id = typeof project === "string" ? project : project?.id ?? null;
  if (id) localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  else localStorage.removeItem(ACTIVE_PROJECT_KEY);
}

export function loadActiveProject(): UniversalProject | null {
  if (!canUseStorage()) return null;
  const id = localStorage.getItem(ACTIVE_PROJECT_KEY);
  return id ? loadProject(id) : null;
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
  if (canUseStorage() && localStorage.getItem(ACTIVE_PROJECT_KEY) === project.id) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
  }
  persistProjectCloud(next);
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
    if (localStorage.getItem(ACTIVE_PROJECT_KEY) === id) {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
    notify();
  }
  deleteProjectCloud(id);
  return next;
}
