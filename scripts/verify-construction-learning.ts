import assert from "node:assert/strict";
import * as THREE from "three";
import { LEARNING_MODELS, LEARNING_REFERENCES, LEARNING_TRACKS, LESSON_COUNT, getLearningModel } from "../lib/construction/learning";
import { buildTeachingModel } from "../components/construction/teaching-models";

assert.equal(LEARNING_MODELS.length, 6);
assert.equal(LESSON_COUNT, 46);
assert.equal(new Set(LEARNING_MODELS.map(model => model.id)).size, 6);
assert.equal(getLearningModel("invalid-link").id, "bungalow");
for (const track of LEARNING_TRACKS) assert.ok(LEARNING_MODELS.some(model => model.track === track.id));
let meshCount = 0;
for (const model of LEARNING_MODELS) {
  assert.ok(model.defaultStep >= 0 && model.defaultStep < model.lessons.length);
  assert.equal(new Set(model.parts.map(part => part.id)).size, model.parts.length);
  for (const part of model.parts) assert.ok(part.step >= 0 && part.step < model.lessons.length, `${part.id}: component must exist in its lesson`);
  for (const reference of model.references) assert.ok(LEARNING_REFERENCES[reference]?.url.startsWith("https://"));
  for (const lesson of model.lessons) assert.ok(lesson.see && lesson.why && lesson.check, `${model.id}: incomplete lesson`);
  if (model.id === "bungalow") continue;
  for (const software of [false, true]) {
    const built = buildTeachingModel(THREE, model.id, software);
    assert.equal(built.stages.length, model.lessons.length);
    assert.deepEqual([...built.parts.keys()].sort(), model.parts.map(part => part.id).sort(), `${model.id}: every selectable component must have geometry and teaching text`);
    for (const part of model.parts) for (const group of built.parts.get(part.id)!) assert.equal(group.userData.step >= part.step, true);
    built.root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(built.root);
    assert.ok(!bounds.isEmpty() && bounds.min.toArray().every(Number.isFinite) && bounds.max.toArray().every(Number.isFinite));
    const materials = new Set<THREE.Material>();
    built.root.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.geometry) return;
      const positions = mesh.geometry.getAttribute("position");
      assert.ok(positions.count > 0 && Array.from(positions.array).every(Number.isFinite), `${model.id}: invalid geometry could make the model disappear`);
      if (mesh.isMesh) meshCount++;
      mesh.geometry.dispose();
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => materials.add(material));
    });
    materials.forEach(material => material.dispose());
    for (const route of built.paths) {
      assert.ok(built.parts.has(route.partId) && route.step < model.lessons.length);
      assert.ok(route.points.every(point => point.every(Number.isFinite)));
      for (let n = 1; n < route.points.length; n++) assert.ok(new THREE.Vector3(...route.points[n]).distanceTo(new THREE.Vector3(...route.points[n - 1])) > 0, `${model.id}: a zero-length route breaks animated markers`);
    }
    if (model.id === "plumbing") {
      assert.ok(!built.paths.some(path => path.partId === "plumb-vent"), "Drainage ventilation must not be animated as a water outlet");
      const vent = new THREE.Box3().setFromObject(built.parts.get("plumb-vent")![0]);
      assert.ok(vent.max.y > 6.5, "The vent must continue above the roof, rather than terminate inside the building");
      const hot = new THREE.Box3().setFromObject(built.parts.get("plumb-hot")![0]);
      assert.ok(hot.min.x > -0.1, "Hot water serves the basin/shower zone and must not route to the WC at x=-2");
    }
    if (model.id === "steel-frame") {
      assert.ok(built.parts.get("steel-bases")![0].children.length >= 80, "Base inspection must include plates and anchors, rather than empty support markers");
    }
  }
}
console.log(`Construction education verified: 6 models, 46 lessons, all selectable components, ${meshCount} meshes across hardware/software geometry, finite route animation and service-system checks.`);
