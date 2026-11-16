import { validateProject, type ConstructionProject } from "./project";
function openProjects(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open("charismak-construction-studio", 1); request.onupgradeneeded = () => { request.result.createObjectStore("projects", { keyPath: "id" }); request.result.createObjectStore("summaries", { keyPath: "id" }); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error("Browser project storage is unavailable. Export a project file to keep your work.")); }); }
let pendingSave: Promise<void> = Promise.resolve();
export function saveConstructionProject(project: ConstructionProject): Promise<void> {
  // Serialize writes so a slow earlier edit cannot replace a newer project snapshot.
  const save = pendingSave.catch(() => {}).then(async () => {
    const db = await openProjects();
    try { await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(["projects", "summaries"], "readwrite");
      transaction.objectStore("projects").put(project);
      transaction.objectStore("summaries").put({ id: project.id, name: project.name, updatedAt: new Date().toISOString() });
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(new Error("Could not save this project. Browser storage may be full; download an optional backup."));
    }); } finally { db.close(); }
  });
  pendingSave = save; return save;
}
const lastProjectKey = "charismak-construction-last-project";
export function lastConstructionProject(): string | null { try { return localStorage.getItem(lastProjectKey); } catch { return null; } }
export function rememberConstructionProject(id: string | null) { try { if (id) localStorage.setItem(lastProjectKey, id); else localStorage.removeItem(lastProjectKey); } catch { /* IndexedDB saving remains available if localStorage is disabled. */ } }
export async function listConstructionProjects(): Promise<{ id: string; name: string; updatedAt: string }[]> { const db = await openProjects(); try { return await new Promise((resolve, reject) => { const request = db.transaction("summaries").objectStore("summaries").getAll(); request.onsuccess = () => resolve(request.result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))); request.onerror = () => reject(request.error); }); } finally { db.close(); } }
export async function loadConstructionProject(id: string): Promise<ConstructionProject> { const db = await openProjects(); try { return await new Promise((resolve, reject) => { const request = db.transaction("projects").objectStore("projects").get(id); request.onsuccess = () => { try { resolve(validateProject(request.result)); } catch (error) { reject(error); } }; request.onerror = () => reject(request.error); }); } finally { db.close(); } }
