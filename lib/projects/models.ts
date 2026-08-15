export type ProjectAudience =
  | "beginner"
  | "builder"
  | "professional"
  | "company";

export type ProjectEntryRoute =
  | "guided-questions"
  | "upload-plan"
  | "enter-dimensions"
  | "measured-quantities"
  | "import-boq"
  | "drawing-takeoff";

export type ProjectType =
  | "new-building"
  | "renovation"
  | "fence-boundary"
  | "external-works"
  | "civil-infrastructure"
  | "structural-steel"
  | "mep-services"
  | "specialist-work";

export type ProjectDiscipline =
  | "preliminaries"
  | "building-civil"
  | "structural"
  | "architectural-finishes"
  | "electrical"
  | "mechanical-plumbing"
  | "fire-security"
  | "external-works"
  | "fence-boundary"
  | "furniture-joinery";

export type ProjectStatus = "draft" | "estimating" | "active" | "archived";

export type UniversalProject = {
  id: string;
  name: string;
  clientName: string;
  location: string;
  currency: string;
  measurementSystem: "metric" | "imperial";
  audience: ProjectAudience;
  entryRoute: ProjectEntryRoute;
  projectType: ProjectType;
  disciplines: ProjectDiscipline[];
  status: ProjectStatus;
  linkedEstimateId?: string | null;
  linkedBillId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewUniversalProject = Omit<
  UniversalProject,
  "id" | "status" | "createdAt" | "updatedAt"
>;
