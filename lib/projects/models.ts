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

export type FinishLevel = "basic" | "standard" | "premium";

export type ProjectSpace = {
  id: string;
  name: string;
  category: "living" | "bedroom" | "kitchen" | "bathroom" | "work" | "circulation" | "other";
  count: number;
  lengthM?: number | null;
  widthM?: number | null;
  heightM?: number | null;
};

export type ProjectScope = {
  landLengthM?: number | null;
  landWidthM?: number | null;
  landAreaM2?: number | null;
  buildingLengthM?: number | null;
  buildingWidthM?: number | null;
  floorAreaM2?: number | null;
  floors?: number;
  finishLevel?: FinishLevel;
  includeExternalWorks?: boolean;
  preliminariesMode?: "none" | "percentage" | "recommended";
  preliminariesPercent?: number;
  spaces?: ProjectSpace[];
  source?: "guided" | "dimensions" | "drawing" | "measured" | "imported";
  confidence?: "rough" | "detailed" | "professional";
  assumptions?: string[];
};

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
  scope?: ProjectScope | null;
  createdAt: string;
  updatedAt: string;
};

export type NewUniversalProject = Omit<
  UniversalProject,
  "id" | "status" | "createdAt" | "updatedAt"
>;
