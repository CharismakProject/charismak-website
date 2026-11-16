import type { ModelPart, ProjectStage, ScheduledStage } from "./project";

export type ProjectVisibility = { day: number; schedule: ScheduledStage[]; hidden?: ProjectStage[]; section?: boolean };

/** Setting-out profiles and pegs belong to temporary works, not the finished building. */
export function visibleProjectParts(parts: ModelPart[], state: ProjectVisibility): Set<string> {
  const end = Math.max(1, ...state.schedule.map(stage => stage.finish));
  const substructure = state.schedule.filter(stage => stage.id === "foundations" || stage.id === "slabs");
  const removeSettingOutAt = substructure.length
    ? Math.max(...substructure.map(stage => stage.finish))
    : state.schedule.find(stage => stage.id === "walls")?.start ?? end;
  const groups = new Map<ProjectStage, ModelPart[]>();
  for (const part of parts) {
    const group = groups.get(part.stage) ?? []; group.push(part); groups.set(part.stage, group);
  }
  const visible = new Set<string>();
  for (const [id, group] of groups) {
    if (state.hidden?.includes(id)) continue;
    if (id === "setting-out" && (state.day >= removeSettingOutAt || state.day >= end)) continue;
    const stage = state.schedule.find(item => item.id === id);
    const fraction = !stage || state.day >= end ? 1 : Math.min(1, Math.max(0, (state.day - stage.start) / stage.days));
    group.forEach((part, index) => {
      if (state.section && part.cutaway) return;
      if (fraction >= 1 || index < Math.ceil(fraction * group.length) || (part.line && state.day >= (stage?.start ?? 0))) visible.add(part.id);
    });
  }
  // Covering finishes replace their substrates; evaluate against the pre-cover visible set.
  const covered = parts.filter(part => visible.has(part.id)).flatMap(part => part.covers ?? []);
  for (const id of covered) visible.delete(id);
  return visible;
}
