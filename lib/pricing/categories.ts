export const WORK_CATEGORIES = [
  { id: "preliminaries", title: "Preliminaries", discipline: "General" },
  { id: "substructure", title: "Substructure", discipline: "Building" },
  { id: "superstructure", title: "Superstructure", discipline: "Building" },
  { id: "frame", title: "Frame and Upper Floors", discipline: "Building" },
  { id: "roof", title: "Roofing", discipline: "Building" },
  { id: "walls", title: "Walls and Partitions", discipline: "Building" },
  { id: "doors-windows", title: "Doors and Windows", discipline: "Building" },
  { id: "finishes", title: "Finishes", discipline: "Building" },
  { id: "fittings", title: "Fittings and Equipment", discipline: "Building" },
  { id: "electrical", title: "Electrical Services", discipline: "Electrical" },
  { id: "mechanical", title: "Mechanical and Plumbing Services", discipline: "Mechanical" },
  { id: "external", title: "External Works", discipline: "Civil" },
  { id: "fence", title: "Fence and Security", discipline: "Civil" },
  { id: "custom", title: "Custom Work Section", discipline: "Custom" },
] as const;

export function getWorkCategoryTitle(id?: string): string {
  return WORK_CATEGORIES.find((category) => category.id === id)?.title ?? "General Works";
}
