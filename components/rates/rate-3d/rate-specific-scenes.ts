import * as THREE from "three";

import type { RateBankItem, RateCostLine } from "@/lib/rates/defaults";
import type { RateScene } from "./scenes";

/**
 * Hand-authored, item-specific construction scenes for the Charismak Rate Bank.
 * Each rate slug has its own construction operation and end-state description.
 * Dimensions are illustrative viewing geometry unless the rate itself states a size.
 */

type Point = [number, number, number];
type RateScenePreset = {
  kind: string;
  process: [string, string, string];
  result: string;
  parameter?: number;
};

const PRESETS: Record<string, RateScenePreset> = {
  "mechanical-excavation-wall-trenches": { kind: "mechanical-trench", process: ["Set out the wall trench and check excavation limits.", "The excavator removes soil in passes; a labourer trims the sides and bottom.", "Check line, level and bearing before the next foundation operation."], result: "An open, trimmed foundation trench. Excavated spoil is shown beside the cut; off-site disposal is excluded." },
  "manual-trench-excavation": { kind: "manual-trench", process: ["Mark the foundation line and required depth.", "A labourer digs with a shovel and trims the sides by hand.", "Dress and level the trench bottom for inspection."], result: "A clean, open foundation trench, ready for inspection. Spoil disposal is excluded." },
  "backfill-excavated-material": { kind: "backfill", process: ["Confirm that excavated material is suitable for reuse.", "Return fill in thin layers around the foundation and spread evenly.", "Moisten as required and compact each layer before adding the next."], result: "Compacted reused soil beside the foundation, with the fill brought up in layers." },
  "imported-laterite-fill": { kind: "laterite-fill", process: ["Deliver approved laterite to the prepared area.", "Spread the laterite in controlled layers to the required formation level.", "Moisten and compact each layer using suitable light compaction plant."], result: "A level, compacted laterite formation. The model distinguishes the red-brown laterite from excavated soil." },
  "hardcore-fill-compacted": { kind: "hardcore-fill", process: ["Spread imported hardcore over the prepared formation.", "Distribute the coarse stone evenly and correct low areas.", "Compact the granular layer and check levels before the next floor layer."], result: "A dense, level hardcore sub-base with visible coarse aggregate texture." },
  "sharp-sand-blinding": { kind: "sand-bed", process: ["Place sharp sand on the prepared formation.", "Spread and rake the sand to an even level and required thickness.", "Lightly compact and check the finished surface."], result: "A shallow, smooth sand blinding/filling layer — not a column or structural concrete member." },
  "dpm-1000-gauge": { kind: "dpm", process: ["Prepare and smooth the floor-filling surface.", "Roll out 1000-gauge polythene and overlap adjacent sheets.", "Trim edges and protect the membrane before following floor work."], result: "A continuous damp-proof membrane over the prepared floor with visible sheet laps." },
  "brc-mesh-a142-laid": { kind: "mesh", process: ["Clean the prepared base and set out the mesh sheets.", "Place A142 welded mesh on suitable spacers and overlap the sheets.", "Tie laps where required and maintain the specified cover."], result: "A flat welded reinforcement mesh layer over the slab base, with sheet laps shown." },
  "c15-blinding-1-3-6": { kind: "blinding", process: ["Measure and batch nominal 1:3:6 cement, sand and coarse aggregate.", "Mix, place and spread the plain concrete over the formation.", "Screed the top to a thin, even blinding layer and protect it while curing."], result: "A thin, level plain-concrete blinding layer on the ground. Reinforcement and formwork are excluded." },
  "c20-nominal-concrete-1-2-4": { kind: "concrete-slab", process: ["Batch the nominal 1:2:4 materials in the specified proportions.", "Mix, place and compact the concrete in the prepared receiving area.", "Strike off to level and cure in accordance with the project specification."], result: "A horizontal concrete pour sample illustrating the concrete supply-and-place scope; final element geometry follows the project drawings." , parameter: 0.28 },
  "c25-structural-concrete-310kg": { kind: "concrete-slab", process: ["Batch the C25 mix to the specified minimum cement content and mix design.", "Place concrete into the prepared element and compact with a concrete vibrator.", "Strike off, finish and cure the concrete; reinforcement and formwork are measured separately."], result: "A dense structural-concrete pour sample with a finished top and exposed concrete section. This is not a column design; the actual element follows drawings.", parameter: 0.34 },
  "high-yield-reinforcement-supply-fix": { kind: "rebar-cage", process: ["Measure and mark high-yield bars to the bar-bending schedule.", "Cut, bend and position bars to the scheduled shapes and spacing.", "Tie intersections, fit spacers and verify cover before concrete placement."], result: "A tied reinforcement cage with longitudinal bars, links and a small bending/cutting work area." },
  "230mm-hollow-sandcrete-blockwork": { kind: "block-wall", process: ["Set out the wall line and level the first course.", "Lay 230 mm hollow sandcrete blocks in staggered bond with mortar joints.", "Check plumb, line and course level as the wall rises."], result: "A 230 mm hollow-block wall sample in staggered bond with visible bed and perpend joints." , parameter: 0.23 },
  "150mm-hollow-sandcrete-blockwork": { kind: "block-wall", process: ["Set out the wall line and level the first course.", "Lay 150 mm hollow sandcrete blocks in staggered bond using cement-sand mortar.", "Check line, plumb and joint thickness as courses are added."], result: "A thinner 150 mm hollow-block partition/wall sample, visually distinct from the 230 mm wall." , parameter: 0.15 },
  "15mm-cement-sand-plaster": { kind: "plaster", process: ["Dampen and prepare the blockwork substrate as required.", "Apply cement-sand plaster to approximately 15 mm average thickness.", "Rule, float and finish the render to an even plane."], result: "Blockwork with a 15 mm floated plaster/render coat applied to the face; the substrate remains visible at the cut edge." , parameter: 0.015 },
  "20mm-wall-tile-backing": { kind: "wall-backing", process: ["Prepare and key the wall substrate.", "Apply approximately 20 mm cement-sand backing and rule it true.", "Leave a sound, plane surface ready to receive tile adhesive and tiles."], result: "A 20 mm cement-sand wall-backing layer ready for tiling; no decorative tile finish is included." , parameter: 0.02 },
  "30mm-floor-screed": { kind: "floor-screed", process: ["Prepare and bond the receiving concrete floor as specified.", "Place 30 mm cement-sand screed and compact the material.", "Rule to level, steel-trowel and protect the surface while curing."], result: "A 30 mm cement-sand floor screed with a smooth level top over the structural slab.", parameter: 0.03 },
  "600x600-floor-tiling": { kind: "floor-tiling", process: ["Check the prepared screed, set out tile grid and dry-check cuts.", "Comb adhesive, lay 600 × 600 porcelain tiles and use spacers for even joints.", "Grout, clean and protect the completed tiled floor."], result: "A porcelain tiled floor laid in a square 600 × 600 grid with aligned grout joints." },
  "600x300-wall-tiling": { kind: "wall-tiling", process: ["Confirm the backing is flat and mark level datum lines.", "Comb tile adhesive and fix 600 × 300 wall tiles with consistent joints.", "Fit edge trims where needed, grout the joints and clean the surface."], result: "A vertical porcelain-tiled wall with horizontal 600 × 300 modules and aligned grout joints." },
  "three-coat-emulsion-paint": { kind: "paint-wall", process: ["Prepare the plastered wall, fill defects and remove dust.", "Apply the specified three coats, allowing suitable drying between coats.", "Cut in edges and roll an even finish, checking for uniform coverage."], result: "A prepared plaster wall with a uniform finished emulsion coat; separate paint passes are suggested by the finish bands." },
  "timber-formwork-foundation-sides": { kind: "foundation-formwork", process: ["Set out the footing/ground-beam width and fix straight plank facing.", "Brace and stake both sides, close joints and apply release agent.", "Check dimensions, line and stability before the below-ground concrete pour."], result: "Temporary timber shuttering to the sides of a foundation footing/ground beam. The concrete is not included in this formwork rate." },
  "plywood-formwork-columns": { kind: "column-formwork", process: ["Set out the column and erect the 18 mm plywood panels around the reinforcement.", "Fit studs, walers and braces; seal joints and apply release agent.", "Check column size, plumb and bracing before concrete placement."], result: "A square RC column shutter with plywood faces, timber studs, walers and external braces. Concrete is excluded." },
  "plywood-formwork-beams-lintels": { kind: "beam-formwork", process: ["Set out beam soffit level and support the soffit with props and bearers.", "Fix plywood bottom and side cheeks with timber runners and walers.", "Brace the shutter, check line/level and prepare it for reinforcement and concrete."], result: "A suspended beam/lintel shutter with soffit, side cheeks, bearers and vertical supports; concrete is excluded." },
  "plywood-formwork-slab-soffit": { kind: "slab-formwork", process: ["Position adjustable props and primary/secondary support members.", "Fix joists and reusable 18 mm plywood panels to form the soffit.", "Level and brace the deck before placing reinforcement and concrete."], result: "The underside shutter deck of a suspended slab, showing plywood sheets, joists, bearers and props. Concrete is excluded." },
  "plywood-formwork-staircase": { kind: "stair-formwork", process: ["Set out the stair pitch, landing level and riser positions.", "Fix inclined soffit plywood, stringers and individual riser boards.", "Brace the stair shutter and verify tread/riser geometry before concreting."], result: "An inclined staircase shutter with defined risers, soffit and support stringers; concrete is excluded." },
  "aluminium-window-installation": { kind: "window", process: ["Check opening size, sill level and frame diagonals.", "Pack, plumb and fix the aluminium frame; install glazing with gaskets/beads.", "Seal the perimeter, adjust opening sashes and clean the glass."], result: "A glazed aluminium window installed square in a prepared masonry opening with a sealed perimeter." },
  "door-installation-dressing": { kind: "door", process: ["Check the opening and set the door frame plumb and square.", "Pack and securely fix the frame, hang the leaf and fit the hardware.", "Adjust clearances, test the swing/latch and dress the frame perimeter."], result: "A working door leaf in a fixed frame with hinges and handle/lock hardware." },
  "wc-wash-basin-fixing": { kind: "wc-basin", process: ["Confirm the water-supply and waste points are at the correct locations.", "Fix the WC pan/cistern and wash-hand basin with the specified supports and connections.", "Connect fittings, seal edges and test for leaks and correct discharge."], result: "A WC and wash-hand basin set fixed against a bathroom wall with service connections indicated." },
  "kitchen-sink-fixing": { kind: "kitchen-sink", process: ["Check the prepared countertop cut-out, cabinet support and plumbing points.", "Seat and secure the sink, fit the mixer tap and connect supply/waste components.", "Seal the rim and test tap operation, drainage and leaks."], result: "A kitchen sink and mixer fixed to a countertop with trap and water connections." },
  "shower-control-fixing": { kind: "shower", process: ["Verify the shower outlets and control-valve position on the finished wall.", "Fix the control, riser pipe, shower head and exposed accessories.", "Connect and test water flow, temperature control and leakage."], result: "A shower control set with riser, head and valve mounted on a tiled bathroom wall." },
  "bathroom-mirror-fixing": { kind: "mirror", process: ["Set out the mirror height and mark safe fixing points.", "Drill or fix the specified brackets/adhesive and carefully mount the mirror.", "Align the mirror, secure it and seal/finish edges as specified."], result: "A bathroom mirror neatly mounted above a basin against the finished wall." },
  "floor-drain-fixing": { kind: "floor-drain", process: ["Confirm the drain body aligns with the waste pipe and finished floor level.", "Set the stainless-steel drain body into the floor finish and connect it to the outlet.", "Check the grate is flush and perform a water-flow test."], result: "A flush stainless-steel floor drain integrated into a tiled floor with falls toward the grate." },
  "marine-plywood-formwork-shear-wall": { kind: "shear-wall-formwork", process: ["Set out the RC wall thickness and erect large plywood shutter panels.", "Fit walers, ties/spacers and stiffeners on both faces and brace the panels.", "Check alignment, thickness and stability before the wall concrete pour."], result: "Two-sided wall shuttering with ties and horizontal walers around a vertical RC shear-wall form. Concrete is excluded." },
  "plank-formwork-columns": { kind: "plank-column-formwork", process: ["Cut straight 1×12 planks to the column height and assemble the box.", "Fit 2×3 studs, 2×2 cleats and external braces; apply release agent.", "Plumb and secure the timber shutter before concrete placement."], result: "A column box made from plank facing with visible studs and braces; this is not plywood formwork." },
  "plank-formwork-beams-lintels": { kind: "plank-beam-formwork", process: ["Set soffit level and install the supporting bearers/props.", "Fix plank soffit and side cheeks with cleats and bracing.", "Check beam width, depth, line and support before concreting."], result: "Plank shuttering to a beam/lintel, with distinct bottom and side boards and temporary support." },
  "plank-formwork-slab-edges-upstands": { kind: "slab-edge-formwork", process: ["Set the slab edge/upstand line and finished concrete level.", "Fix narrow planks to stakes or cleats at the required height.", "Brace and check the edge shutter before the concrete pour."], result: "A low, narrow edge shutter/upstand form rather than a full-height column or full slab deck." },
  "premium-marine-formwork-slab-soffit": { kind: "premium-slab-formwork", process: ["Set out the suspended slab and install the prop/primary-beam grid.", "Fix premium reusable marine plywood with close, aligned joints and denser support.", "Level, brace and inspect the soffit deck before concrete placement."], result: "A suspended soffit deck with marine-plywood panels and a denser reusable support grid; concrete is excluded." },
  "10mm-levelling-screed-1-4-admix": { kind: "thin-screed", process: ["Clean and prime/prepare the substrate to the admixture system.", "Apply a thin 10 mm 1:4 levelling screed modified with acrylic/SBR admixture.", "Rule the patch smooth and check levels before the final floor finish."], result: "A very thin 10 mm levelling coat over the substrate; visually distinct from a thick floor build-up.", parameter: 0.01 },
  "20mm-levelling-screed-1-4-admix": { kind: "thin-screed", process: ["Prepare the substrate and apply the specified bonding/admixture treatment.", "Place 20 mm 1:4 cement-sand levelling screed with acrylic/SBR admixture.", "Rule and steel-trowel the surface, then protect it while curing."], result: "A 20 mm modified cement-sand levelling layer, with the thickness exposed at the cut edge.", parameter: 0.02 },
  "23mm-levelling-screed-1-4-admix": { kind: "thin-screed", process: ["Prepare and prime the substrate in accordance with the screed system.", "Place 23 mm 1:4 cement-sand levelling screed with acrylic/SBR admixture.", "Rule to the set level and steel-trowel for the receiving finish."], result: "A 23 mm modified levelling coat; the model uses the rate's specified thickness rather than a generic slab.", parameter: 0.023 },
  "32mm-levelling-screed-1-4-admix": { kind: "thin-screed", process: ["Prepare the concrete substrate and apply the specified bonding treatment.", "Place 32 mm 1:4 cement-sand levelling screed with acrylic/SBR admixture.", "Compact, rule level and steel-trowel the surface before curing."], result: "A 32 mm modified levelling screed over concrete, with the full layer depth visible in section.", parameter: 0.032 },
  "marble-field-laying-20mm": { kind: "marble-field", process: ["Set out the field, check stone selection and prepare the bed.", "Lay employer-supplied 20 mm marble on the 10 mm bedding layer and adjust level.", "Grout joints, clean the stone and protect the completed field."], result: "A field of large-format 20 mm marble slabs with narrow, aligned joints and a visible bedding section." },
  "marble-narrow-border-laying": { kind: "marble-border", process: ["Snap straight control lines and set out the 60/100 mm border width.", "Cut and lay narrow marble strips to the string line with multiple edge cuts.", "Grout, clean and protect the precise border."], result: "Narrow marble border strips framed by the adjacent floor field; the border is not shown as full floor slabs." },
  "marble-mitred-flowerbed-top-laying": { kind: "marble-mitred-top", process: ["Template the flowerbed top and mark exposed edge mitres.", "Cut the employer-supplied marble and fit the pieces over the bedding.", "Align the mitres, grout joints and clean/protect the exposed edges."], result: "A marble-capped flowerbed/planter with visible 45-degree mitred meeting edges and a dressed top." },
  "patterned-stone-band-laying": { kind: "stone-band", process: ["Mark the centreline and set out the decorative band module pattern.", "Lay employer-supplied stone modules to the pattern on the prepared bed.", "Align the border, grout joints and protect the finished floor band."], result: "A contrasting patterned stone band embedded within a larger floor field, rather than plain uniform tiling." },
  "stone-adhesive-14kg-per-m2": { kind: "adhesive", process: ["Prepare the substrate and mix the specified high-performance cement-based adhesive.", "Spread adhesive with a notched trowel to form even ridges at the specified consumption.", "The stone is then bedded into the adhesive under the separate stone-laying operation."], result: "A measured adhesive bed with visible notched-trowel ridges. This material-only rate does not include a separate laying-labour line." },
  "engineered-oak-straight-laying": { kind: "oak-straight", process: ["Condition boards and establish a straight reference line with required perimeter gaps.", "Apply the specified adhesive and lay engineered oak boards in parallel rows.", "Trim edges, fit the finishing details and protect the floor."], result: "Engineered oak strip flooring in straight, parallel runs with staggered end joints." },
  "engineered-oak-chevron-laying": { kind: "oak-chevron", process: ["Establish centreline and angle controls for the chevron pattern.", "Cut/position board ends and lay alternating left/right boards with accurate points.", "Trim the perimeter, fit edges and protect the completed chevron field."], result: "Engineered oak flooring in a repeated chevron/V pattern with aligned points; not a straight-strip layout." },
  "decorative-wood-tile-laying": { kind: "wood-tile", process: ["Set out the repeating decorative module and dry-lay the pattern.", "Apply adhesive and align the wood-look decorative tiles consistently.", "Cut the perimeter pieces, fit trims and protect the finished pattern."], result: "A decorative repeating wood-tile pattern with visible module boundaries rather than long straight oak strips." },
  "3mm-hd-foam-underlay": { kind: "foam-underlay", process: ["Vacuum the substrate and check it is dry and sufficiently level.", "Roll out the 3 mm high-density foam underlay and cut around edges/obstacles.", "Butt or lap joints as the specified system requires, then install the separate floor finish."], result: "A continuous thin foam underlay roll laid over the substrate. The engineered wood finish is a separate operation.", parameter: 0.003 },
  "flat-gypsum-board-ceiling": { kind: "ceiling-flat", process: ["Set ceiling datum and install hangers from the supporting structure.", "Fix main channels, furring profiles and 12.5 mm gypsum boards.", "Tape and compound joints, sand and leave a flat ceiling ready for decoration."], result: "A flat suspended gypsum-board ceiling with exposed support grid in the section view." },
  "straight-gypsum-ceiling-drop": { kind: "ceiling-step", process: ["Set the upper ceiling datum and mark the stepped perimeter.", "Frame the straight vertical drop with channels and fix the gypsum board faces.", "Tape, fill and finish the corners and joints."], result: "A rectangular stepped ceiling drop with straight fascia faces and a lower perimeter band." },
  "curved-gypsum-ceiling-drop": { kind: "ceiling-curved", process: ["Set out the curved drop radius and install flexible curved framing.", "Form/fix the bendable gypsum board around the curved perimeter.", "Tape, skim and sand the curved transition to a smooth finish."], result: "A curved ceiling drop with a rounded, continuous perimeter rather than square stepped corners." },
  "recessed-curved-gypsum-ceiling": { kind: "ceiling-recess", process: ["Set out the recessed centre and curved perimeter levels.", "Install the suspended frame, raised border and dropped/recessed curved centre.", "Board, tape and skim all transitions to a continuous finished profile."], result: "A recessed/inverted ceiling feature with a lower central panel and curved raised border." },
  "grooved-pop-edge-detail": { kind: "pop-groove", process: ["Set a straight 150 mm wide POP edge profile along the ceiling perimeter.", "Form or carve repeated longitudinal grooves in the 30 mm thick profile.", "Sand the profile and finish the grooves with clean, consistent edges."], result: "A narrow decorative POP cornice/edge strip with repeated grooves, not a full ceiling panel." , parameter: 0.15 },
  "bespoke-pop-column-crown": { kind: "pop-crown", process: ["Measure and template the crown around the top of the column.", "Fix support/reinforcement and form the bespoke POP moulding.", "Sculpt, sand and align the crown, then finish the joint to the column."], result: "A decorative moulded POP crown around a column head — this specific rate does involve a column." },
  "standard-pop-ceiling": { kind: "pop-ceiling", process: ["Prepare supports/brandering and set the ceiling level.", "Apply/form the conventional POP ceiling system to the support.", "Float and sand the surface smooth, ready for decoration."], result: "A plain, smooth traditional POP ceiling plane with support above; distinct from a gypsum-board suspended ceiling." },
  "pop-skim-coat-soffit": { kind: "pop-skim", process: ["Prepare the concrete/plastered soffit and remove dust or loose particles.", "Apply a thin POP skim coat to the underside of the slab.", "Float and sand the finish smooth, ready for painting."], result: "A thin smooth POP skim finish on the underside of a horizontal concrete soffit; the structural slab remains above." },
  "055mm-aluminium-roof-covering": { kind: "roof-cover", process: ["Lay sheets on the prepared timber purlins with the specified side/end laps.", "Fix the 0.55 mm oven-baked aluminium sheets using roofing screws and washers.", "Dress laps and accessories and check the roof line for secure fixing."], result: "A pitched roof plane with visible corrugated aluminium sheets, screw fixings and a timber support structure." },
  "600mm-ridge-capping": { kind: "ridge-cap", process: ["Align the 600 mm wide ridge capping over the roof apex.", "Lap the capping lengths and fasten through the crown into the prepared support.", "Dress the edges and check the ridge is weather-shedding."], result: "Aluminium ridge capping bridging the two roof slopes at the apex, with visible overlaps/fixings." , parameter: 0.6 },
  "300mm-aluminium-fascia": { kind: "fascia", process: ["Check the eaves line and prepared fascia backing.", "Fix the 300 mm aluminium fascia, aligning joints and fixing points.", "Dress edges and joints for a straight, clean eaves finish."], result: "A 300 mm aluminium fascia fixed vertically along the roof eaves, shown below the roof sheet edge." , parameter: 0.3 },
  "50x150-wall-plate-tie-beam": { kind: "wall-plate", process: ["Position the treated 50×150 mm timber plate on the wall top.", "Cut to length, make joints and secure it to the prepared roof support line.", "Check alignment before rafters or roof members are fixed."], result: "A single 50×150 mm treated wall plate/tie beam seated along the top of a masonry wall." },
  "50x100-rafter": { kind: "rafter", process: ["Mark the rafter length, pitch and birdsmouth/seat cut from the roof layout.", "Lift and fix the treated 50×100 mm rafter between the wall plate and ridge/support.", "Check spacing, bearing and alignment before purlins are added."], result: "A single 50×100 mm inclined timber rafter installed on a roof frame; not a complete roof truss." },
  "50x100-strut-tie": { kind: "roof-strut", process: ["Set out the strut/tie location from the roof framing drawing.", "Cut the treated 50×100 mm member to fit and secure its end connections.", "Check that the member is aligned and provides the specified bracing/tie action."], result: "A single diagonal 50×100 mm roof strut/tie connecting framing members in its intended direction." },
  "50x75-purlin": { kind: "purlin", process: ["Mark purlin positions and spacing across the rafters.", "Place and fix the treated 50×75 mm purlin perpendicular to the rafters.", "Check the roof bearing line and alignment for sheet fixing."], result: "A single 50×75 mm longitudinal purlin crossing several rafters, ready to support roof sheets." },
  "50x75-noggin": { kind: "noggin", process: ["Measure the gap between adjacent roof members.", "Cut a short 50×75 mm noggin to fit tightly between the members.", "Nail/fix the blocking in line to prevent movement and maintain spacing."], result: "A short 50×75 mm timber blocking piece fitted between adjacent roof framing members." },
  "fibre-cement-external-ceiling": { kind: "fibre-ceiling", process: ["Install and level the external soffit framing beneath the roof/eaves.", "Cut and fix fibre-cement ceiling boards with suitable exterior fixings.", "Align joints and finish edges to provide a neat external soffit."], result: "Fibre-cement boards fixed to the underside of the eaves/roof overhang. Material selection must be confirmed; the model does not assume asbestos content." },
};

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function texture(base: string, fleck: string, seed: number, repeat = 1) {
  if (typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  const random = rng(seed);
  for (let i = 0; i < 3200; i += 1) {
    ctx.globalAlpha = 0.025 + random() * 0.14;
    ctx.fillStyle = fleck;
    ctx.fillRect(random() * 256, random() * 256, 1 + random() * 2.5, 1 + random() * 2);
  }
  ctx.globalAlpha = 1;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.anisotropy = 8;
  return map;
}

function mat(color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.84, metalness: 0, ...extra });
}

function cube(
  w: number, h: number, d: number, p: Point, color: string,
  extra: Partial<THREE.MeshStandardMaterialParameters> = {},
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
  mesh.position.set(...p);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(radius: number, height: number, p: Point, color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20), mat(color, extra));
  mesh.position.set(...p);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function rod(a: Point, b: Point, radius: number, color: string, metalness = 0.1) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const axis = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, axis.length(), 10),
    mat(color, { roughness: 0.48, metalness }),
  );
  mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Rectangular sawn timber member between two points, unlike circular steel rods. */
function timberMember(a: Point, b: Point, width: number, depth: number, color = "#B9824C", seed = 301) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const axis = end.clone().sub(start);
  const member = new THREE.Mesh(
    new THREE.BoxGeometry(width, axis.length(), depth),
    mat(color, { map: texture(color, "#54351F", seed, 1.1), roughness: 0.86 }),
  );
  member.position.copy(start.clone().add(end).multiplyScalar(0.5));
  member.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  member.castShadow = true;
  member.receiveShadow = true;
  return member;
}

function addAt<T extends THREE.Object3D>(object: T, p: Point): T {
  object.position.set(...p);
  return object;
}

function rock(seed: number, color = "#928D84", size = 0.1) {
  const random = rng(seed);
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(size, 0),
    mat(color, { roughness: 1, metalness: 0 }),
  );
  mesh.scale.set(0.8 + random() * 0.65, 0.55 + random() * 0.6, 0.75 + random() * 0.6);
  mesh.rotation.set(random() * 0.8, random() * Math.PI, random() * 0.8);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function pile(height: number, color: string, seed: number) {
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(height * 0.8, height, 28),
    mat("#FFFFFF", { map: texture(color, "#594839", seed, 1.6), roughness: 1 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function meshGrid(width: number, depth: number, y: number, spacing: number, color = "#6E5747") {
  const group = new THREE.Group();
  for (let x = -width / 2; x <= width / 2 + 0.001; x += spacing) {
    group.add(rod([x, y, -depth / 2], [x, y, depth / 2], 0.009, color, 0.52));
  }
  for (let z = -depth / 2; z <= depth / 2 + 0.001; z += spacing) {
    group.add(rod([-width / 2, y, z], [width / 2, y, z], 0.009, color, 0.52));
  }
  return group;
}

function worker(tool: string, uniform = "#F08A24", scale = 1) {
  const g = new THREE.Group();
  g.userData.rateSceneRole = "worker";
  g.userData.workTool = tool;
  // Rounded torso and limbs, two reflective vest bands, safety boots, gloves and hard hat.
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.17, 4, 12), mat(uniform, { roughness: 0.74 }));
  torso.position.set(0, 0.91, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  g.add(torso);
  g.add(cube(0.2, 0.026, 0.012, [0, 0.82, 0.111], "#F7D875", { roughness: 0.48, metalness: 0.05 }));
  g.add(cube(0.2, 0.026, 0.012, [0, 0.99, 0.111], "#F7D875", { roughness: 0.48, metalness: 0.05 }));
  [-0.07, 0.07].forEach((x) => {
    const trouserLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.26, 4, 10), mat("#34485A", { roughness: 0.88 }));
    trouserLeg.position.set(x, 0.47, 0);
    trouserLeg.castShadow = true;
    trouserLeg.receiveShadow = true;
    g.add(trouserLeg);
  });
  g.add(cube(0.105, 0.07, 0.16, [-0.07, 0.27, 0.025], "#242A30"));
  g.add(cube(0.105, 0.07, 0.16, [0.07, 0.27, 0.025], "#242A30"));
  g.add(rod([-0.15, 1.05, 0], [-0.22, 0.74, 0.11], 0.043, "#B9825B"));
  g.add(rod([0.15, 1.05, 0], [0.25, 0.78, 0.1], 0.043, "#B9825B"));
  g.add(sphere(0.038, -0.22, 0.74, 0.11, "#343A40"));
  g.add(sphere(0.038, 0.25, 0.78, 0.1, "#343A40"));
  g.add(cylinder(0.045, 0.13, [0, 1.22, 0], "#B9825B", { roughness: 0.74 }));
  g.add(sphere(0.125, 0, 1.34, 0, "#B9825B"));
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat("#F2B544", { roughness: 0.64 }));
  hat.position.set(0, 1.43, 0);
  hat.castShadow = true;
  hat.receiveShadow = true;
  g.add(hat);
  const hatBrim = cylinder(0.15, 0.025, [0, 1.405, 0], "#F2B544", { roughness: 0.62 });
  g.add(hatBrim);
  if (tool === "shovel" || tool === "rake") {
    g.add(rod([0.34, 0.7, 0.08], [0.49, 1.27, 0.12], 0.014, "#826143"));
    g.add(cube(tool === "rake" ? 0.2 : 0.085, 0.025, 0.03, [0.49, 1.27, 0.12], "#747C83", { metalness: 0.6 }));
    if (tool === "rake") {
      for (let i = 0; i < 5; i += 1) g.add(rod([0.41 + i * 0.04, 1.27, 0.12], [0.41 + i * 0.04, 1.21, 0.12], 0.006, "#7A838A", 0.6));
    }
  } else if (tool === "trowel" || tool === "float") {
    g.add(rod([0.25, 0.79, 0.11], [0.4, 0.95, 0.2], 0.012, "#826143"));
    g.add(cube(0.17, 0.012, 0.08, [0.43, 0.96, 0.2], "#AEB6BC", { metalness: 0.5, roughness: 0.35 }));
  } else if (tool === "roller") {
    g.add(rod([0.24, 0.77, 0.1], [0.3, 1.12, 0.1], 0.012, "#816345"));
    g.add(rod([0.3, 1.12, 0.1], [0.45, 1.12, 0.1], 0.014, "#A7ADB4"));
    g.add(cylinder(0.045, 0.14, [0.45, 1.12, 0.1], "#E5E7E8", { roughness: 0.82 }));
  } else if (tool === "drill") {
    g.add(cube(0.1, 0.18, 0.1, [0.27, 0.82, 0.12], "#E4B23C", { metalness: 0.12 }));
    g.add(rod([0.31, 0.82, 0.12], [0.44, 0.82, 0.12], 0.012, "#7F8A93", 0.7));
  } else if (tool === "wrench") {
    g.add(rod([0.25, 0.8, 0.1], [0.43, 0.96, 0.1], 0.014, "#9BA5AD", 0.8));
    g.add(cylinder(0.035, 0.03, [0.44, 0.98, 0.1], "#9BA5AD", { metalness: 0.8 }));
  } else if (tool === "tile") {
    g.add(rod([0.24, 0.78, 0.12], [0.4, 0.95, 0.2], 0.012, "#826143"));
    g.add(cube(0.12, 0.012, 0.07, [0.44, 0.96, 0.2], "#9EA7AD", { metalness: 0.5 }));
  }
  g.scale.setScalar(scale);
  g.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function excavator() {
  const g = new THREE.Group();
  // tracked mini-excavator, articulated boom and bucket
  g.add(cube(0.74, 0.15, 0.25, [0, 0.16, 0], "#2A3036"));
  g.add(cube(0.72, 0.11, 0.13, [0, 0.16, -0.18], "#313941"));
  g.add(cube(0.72, 0.11, 0.13, [0, 0.16, 0.18], "#313941"));
  g.add(cube(0.48, 0.25, 0.44, [0, 0.35, 0], "#E5A526", { metalness: 0.12, roughness: 0.52 }));
  g.add(cube(0.25, 0.35, 0.35, [-0.07, 0.62, 0], "#D5E0E4", { transparent: true, opacity: 0.72, roughness: 0.2, metalness: 0.12 }));
  g.add(rod([0.18, 0.48, 0], [0.58, 0.88, 0], 0.075, "#E5A526"));
  g.add(rod([0.58, 0.88, 0], [0.89, 0.51, 0], 0.052, "#D99A20"));
  g.add(rod([0.89, 0.51, 0], [1.02, 0.36, 0], 0.035, "#59636B", 0.38));
  g.add(cube(0.18, 0.1, 0.14, [1.02, 0.31, 0], "#59636B", { metalness: 0.38 }));
  return g;
}

function mixer() {
  const g = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.31, 0.56, 24), mat("#E39B2D", { roughness: 0.5, metalness: 0.18 }));
  drum.rotation.z = Math.PI / 3;
  drum.position.set(0, 0.55, 0);
  g.add(drum);
  g.add(cube(0.62, 0.07, 0.38, [0, 0.16, 0], "#444E57", { metalness: 0.35 }));
  [-0.24, 0.24].forEach((x) => {
    const w = cylinder(0.12, 0.05, [x, 0.11, 0.23], "#252B30");
    w.rotation.x = Math.PI / 2;
    g.add(w);
  });
  g.add(rod([-0.15, 0.23, -0.06], [-0.32, 0.08, -0.06], 0.018, "#747E87", 0.45));
  return g;
}

function plateCompactor() {
  const g = new THREE.Group();
  g.add(cube(0.48, 0.1, 0.34, [0, 0.1, 0], "#D8A027", { metalness: 0.15 }));
  g.add(cube(0.22, 0.22, 0.2, [0, 0.28, -0.02], "#363D43", { metalness: 0.2 }));
  g.add(rod([0.08, 0.35, 0], [0.35, 0.78, 0], 0.018, "#343B41", 0.45));
  g.add(rod([-0.08, 0.35, 0], [0.22, 0.78, 0], 0.018, "#343B41", 0.45));
  g.add(rod([0.22, 0.78, 0], [0.43, 0.78, 0], 0.018, "#343B41", 0.45));
  return g;
}

function bag(p: Point, color = "#A8ADB2") {
  const g = new THREE.Group();
  g.add(cube(0.34, 0.105, 0.23, [0, 0.055, 0], color, { map: texture(color, "#555B62", 551), roughness: 0.96 }));
  g.add(cube(0.26, 0.012, 0.01, [0, 0.11, 0], "#E3E5E6"));
  return addAt(g, p);
}

function palletSample(line: RateCostLine, p: Point) {
  const label = (line.id + " " + line.label).toLowerCase();
  if (/sand|granite|aggregate|hardcore|laterite|soil|stone/.test(label)) {
    const g = pile(0.18, /sand|laterite|soil/.test(label) ? "#C7A778" : "#7E7C77", line.id.length * 17 + 13);
    g.position.set(p[0], p[1] + 0.08, p[2]);
    return g;
  }
  if (/cement/.test(label)) return bag(p, "#A6ABB0");
  if (/plywood|timber|wood|board|sheet|plank|rafter|purlin|noggin/.test(label)) return cube(0.42, 0.065, 0.22, p, "#B9824C", { map: texture("#B9824C", "#573A23", 88), roughness: 0.88 });
  if (/rebar|reinforc|steel|mesh|rod|nail|bolt|screw|waler|metal/.test(label)) return rod([p[0] - 0.2, p[1] + 0.12, p[2]], [p[0] + 0.2, p[1] + 0.12, p[2]], 0.018, "#79838B", 0.6);
  if (/pipe|cable|wire|conduit/.test(label)) return rod([p[0] - 0.22, p[1] + 0.1, p[2]], [p[0] + 0.22, p[1] + 0.1, p[2]], 0.035, "#3D8AB8");
  if (line.category === "plant" || line.category === "logistics" || /hire|diesel|transport|mobilis|delivery/.test(label)) {
    const g = new THREE.Group();
    g.add(cube(0.52, 0.18, 0.26, [0, 0.18, 0], "#D69A25"));
    [-0.16, 0.16].forEach((x) => [-0.13, 0.13].forEach((z) => g.add(cylinder(0.07, 0.04, [x, 0.08, z], "#252B31"))));
    return addAt(g, p);
  }
  return cube(0.24, 0.12, 0.18, p, /tile|marble|porcelain|stone/.test(label) ? "#D9D7D0" : "#B9BFC4");
}

class SceneBuilder {
  readonly parts: RateScene["parts"] = [];
  readonly context: THREE.Object3D[] = [];
  readonly colors: Record<string, string> = {};
  readonly represented = new Set<string>();
  private readonly item: RateBankItem;
  private readonly preset: RateScenePreset;

  constructor(item: RateBankItem, preset: RateScenePreset) {
    this.item = item;
    this.preset = preset;
    item.lines.forEach((line) => { this.colors[line.id] = colour(line); });
  }

  find(pattern: RegExp) {
    // Trade names like "mason" and "carpenter" can occur in material labels too.
    // Include costed labour only when the pattern explicitly says labour/labor.
    const explicitlyLabour = /labou?r/i.test(pattern.source);
    return this.item.lines.filter((line) => pattern.test(line.label) && (explicitlyLabour || line.category !== "labour"));
  }

  first(category: RateCostLine["category"]) {
    return this.item.lines.find((line) => line.category === category);
  }

  add(
    pattern: RegExp | string | string[],
    object: THREE.Object3D,
    dir: Point = [0, 0.28, 0.05],
    opts: { appearOnExplode?: boolean; hideOnExplode?: boolean } = {},
    fallbackCategory: RateCostLine["category"] = "material",
  ) {
    let lines: RateCostLine[] = [];
    if (pattern instanceof RegExp) lines = this.find(pattern);
    else {
      const ids = Array.isArray(pattern) ? pattern : [pattern];
      lines = this.item.lines.filter((line) => ids.includes(line.id));
    }
    if (!lines.length) {
      // Only use a fallback from the requested cost category. Never attach a generic
      // visual to the first available line (which could be labour and suppress the human).
      const fallback = this.first(fallbackCategory);
      if (fallback) lines = [fallback];
    }
    const lineIds = [...new Set(lines.map((line) => line.id))];
    lineIds.forEach((id) => {
      this.represented.add(id);
      const row = this.item.lines.find((line) => line.id === id);
      if (row) this.colors[id] = colour(row);
    });
    this.parts.push({
      lineId: lineIds.length === 0 ? "__context" : lineIds.length === 1 ? lineIds[0] : lineIds,
      object,
      dir: new THREE.Vector3(...dir),
      ...opts,
    });
    return object;
  }

  floor(color = "#C9C5BC", z = 0) {
    const floor = cube(4.6, 0.12, 3.6, [0, -0.06, z], color, { map: texture(color, "#69645C", 11, 2), roughness: 0.94 });
    this.context.push(floor);
    return floor;
  }

  earth() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 22),
      mat("#B99D78", { map: texture("#B99D78", "#59432F", 15, 16), roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.09;
    ground.receiveShadow = true;
    ground.userData.keepVisible = true;
    this.context.push(ground);
  }

  room() {
    this.floor("#C9C5BC");
    this.context.push(cube(4.6, 2.8, 0.12, [0, 1.35, -1.75], "#E8E5DE", { roughness: 0.94 }));
    this.context.push(cube(0.12, 2.8, 3.5, [-2.3, 1.35, 0], "#E3E0D8", { roughness: 0.94 }));
  }

  wallTexture() {
    return texture("#C4BDB1", "#786D60", 21, 1.2);
  }

  addLabourPeople(tool: string) {
    const labour = this.item.lines.filter((line) => line.category === "labour");
    const elevatedWork = /ceiling|pop-skim|pop-groove|slab-formwork|beam-formwork|stair-formwork|roof-cover|ridge-cap|fascia|fibre-ceiling/.test(this.preset.kind);
    if (elevatedWork && labour.length) {
      // A modest work platform and four legs put the first trade worker at working height.
      this.context.push(cube(0.98, 0.08, 0.66, [-1.5, 1.16, 0.95], "#89949D", { metalness: 0.48, roughness: 0.54 }));
      for (const x of [-1.92, -1.08]) {
        for (const z of [0.68, 1.22]) {
          this.context.push(rod([x, 0.08, z], [x, 1.13, z], 0.025, "#737E87", 0.58));
        }
      }
      this.context.push(rod([-1.92, 0.55, 0.68], [-1.08, 1.08, 1.22], 0.014, "#737E87", 0.56));
      this.context.push(rod([-1.92, 1.08, 1.22], [-1.08, 0.55, 0.68], 0.014, "#737E87", 0.56));
    }
    labour.forEach((line, index) => {
      if (this.represented.has(line.id)) return;
      const positions: Point[] = [
        [-1.5, elevatedWork ? 1.2 : 0, 0.95],
        [1.48, 0, 1.0],
        [-1.5, 0, -0.95],
        [1.45, 0, -0.95],
      ];
      const person = worker(tool, index % 2 ? "#E7A13C" : "#EF8129", 0.8);
      person.position.set(...positions[index % positions.length]);
      this.add(line.id, person, [index % 2 ? 0.12 : -0.1, 0.06, 0.12], {}, "labour");
    });
  }

  addResiduals() {
    this.item.lines.forEach((line, index) => {
      if (this.represented.has(line.id)) return;
      const col = index % 4;
      const row = Math.floor(index / 4);
      const p: Point = [1.6 + (col % 2) * 0.42, 0.08 + row * 0.04, -0.95 + col * 0.33];
      this.context.push(cube(0.57, 0.05, 0.34, [p[0], 0.025, p[2]], "#856648", { roughness: 0.95 }));
      this.add(line.id, palletSample(line, p), [0.06, 0.22, 0.08], { appearOnExplode: true }, line.category);
    });
  }

  build(): RateScene {
    const kind = this.preset.kind;
    const t = this.preset.parameter ?? 0;
    this.earth();

    // The scenes below are selected by the exact rate slug, not by section/keyword.
    switch (kind) {
      case "mechanical-trench": {
        this.context.push(cube(2.3, 0.6, 1.7, [-0.75, 0.23, -0.06], "#96724F", { map: texture("#96724F", "#493425", 31), roughness: 1 }));
        this.context.push(cube(2.3, 0.6, 1.7, [0.75, 0.23, -0.06], "#A17C54", { map: texture("#A17C54", "#493425", 32), roughness: 1 }));
        this.add(/excavat|trench|earth/, cube(0.42, 0.035, 1.56, [0, 0.02, -0.06], "#5D4A38", { roughness: 1 }), [0, -0.1, 0.2]);
        this.context.push(cube(0.16, 0.84, 1.68, [-0.19, 0.39, -0.06], "#C5A47C", { roughness: 1 }));
        this.context.push(cube(0.16, 0.84, 1.68, [0.19, 0.39, -0.06], "#C5A47C", { roughness: 1 }));
        const machine = excavator(); machine.position.set(1.35, 0, 1.0);
        this.add(/excavator|hire|plant|diesel/, machine, [0.28, 0.06, 0.18], { appearOnExplode: true }, "plant");
        const spoil = pile(0.48, "#96724F", 35); spoil.position.set(-1.36, 0.24, 1.0);
        this.add(/excavat|spoil|soil/, spoil, [-0.15, 0.14, 0.16], { appearOnExplode: true });
        this.addLabourPeople("shovel");
        break;
      }
      case "manual-trench": {
        this.context.push(cube(1.08, 0.74, 1.75, [-0.7, 0.35, -0.05], "#97724E", { map: texture("#97724E", "#4D3726", 36), roughness: 1 }));
        this.context.push(cube(1.08, 0.74, 1.75, [0.7, 0.35, -0.05], "#97724E", { map: texture("#97724E", "#4D3726", 37), roughness: 1 }));
        this.add(/excavat|trench/, cube(0.3, 0.09, 1.58, [0, 0.04, -0.05], "#6E5740", { roughness: 1 }), [0, -0.15, 0.15]);
        const spoil = pile(0.43, "#A4825B", 38); spoil.position.set(1.27, 0.21, 1.05);
        this.add(/excavat|soil/, spoil, [0.15, 0.16, 0.12], { appearOnExplode: true });
        this.addLabourPeople("shovel");
        break;
      }
      case "backfill": {
        // A foundation trench being returned in visible compacted lifts.
        this.context.push(cube(0.9, 0.76, 1.5, [-1.05, 0.38, -0.2], "#95724F", { map: texture("#95724F", "#493425", 39), roughness: 1 }));
        this.context.push(cube(0.9, 0.76, 1.5, [1.05, 0.38, -0.2], "#95724F", { map: texture("#95724F", "#493425", 391), roughness: 1 }));
        this.context.push(cube(0.5, 0.82, 1.6, [-0.43, 0.41, -0.2], "#A4A8AA", { roughness: 0.94 }));
        this.context.push(cube(0.5, 0.82, 1.6, [0.43, 0.41, -0.2], "#A4A8AA", { roughness: 0.94 }));
        // Compacted lift layers sit in the trench beside the foundation, not inside a solid soil block.
        for (const x of [-0.72, 0.72]) {
          const fill1 = cube(0.12, 0.18, 1.35, [x, 0.14, -0.2], "#A4835E", { map: texture("#A4835E", "#5C442E", 40), roughness: 1 });
          this.add(/backfill|spreading|excavated material/, fill1, [0, 0.22, 0.15]);
          const fill2 = cube(0.12, 0.18, 1.35, [x, 0.32, -0.2], "#B39772", { map: texture("#B39772", "#5C442E", 41), roughness: 1 });
          this.add(/backfill|spreading|excavated material/, fill2, [0, 0.25, -0.15]);
        }
        const comp = plateCompactor(); comp.position.set(1.18, 0, 0.9);
        this.add(/compactor|plant|light compaction/, comp, [0.25, 0.08, 0.15], { appearOnExplode: true }, "plant");
        this.addLabourPeople("shovel");
        break;
      }
      case "laterite-fill": {
        this.floor("#A98A64");
        for (let row = 0; row < 3; row += 1) {
          const lift = cube(2.8, 0.12, 2.0, [0, 0.07 + row * 0.12, -0.25], row === 2 ? "#AF6E48" : "#B8774E", { map: texture(row === 2 ? "#AF6E48" : "#B8774E", "#573A29", 44 + row, 2), roughness: 1 });
          this.add(/laterite/, lift, [0, 0.25, 0]);
        }
        const delivery = new THREE.Group();
        delivery.add(cube(0.72, 0.25, 0.38, [0, 0.24, 0], "#D5A02B"));
        delivery.add(cube(0.28, 0.28, 0.36, [-0.2, 0.49, 0], "#E1E7E9"));
        [-0.24, 0.24].forEach((x) => [-0.16, 0.16].forEach((z) => delivery.add(cylinder(0.09, 0.05, [x, 0.12, z], "#242A30"))));
        delivery.position.set(1.55, 0, 0.92);
        this.add(/laterite|transport|delivery/, delivery, [0.26, 0.08, 0.18], { appearOnExplode: true });
        const comp = plateCompactor(); comp.position.set(1.08, 0, 1.35);
        this.add(/spreading|compaction|plant|light compaction/, comp, [0.2, 0.08, 0.1], { appearOnExplode: true }, "plant");
        this.addLabourPeople("rake");
        break;
      }
      case "hardcore-fill": {
        this.floor("#AB9A84");
        const subbase = cube(2.8, 0.24, 2.0, [0, 0.12, -0.25], "#807D77", { roughness: 1 });
        this.add(/hardcore|stone|aggregate/, subbase, [0, 0.26, 0]);
        for (let i = 0; i < 100; i += 1) {
          const x = -1.32 + (i % 15) * 0.18;
          const z = -1.13 + Math.floor(i / 15) * 0.28;
          const stone = rock(i + 201, i % 2 ? "#8D8982" : "#A09A90", 0.055 + (i % 3) * 0.012);
          stone.position.set(x, 0.24 + (i % 4) * 0.014, z);
          this.add(/hardcore|stone|aggregate/, stone, [0, 0.18, 0], { hideOnExplode: true });
        }
        const comp = plateCompactor(); comp.position.set(1.18, 0.25, 1.15);
        this.add(/compaction|plant|light compaction/, comp, [0.25, 0.1, 0.15], { appearOnExplode: true }, "plant");
        this.addLabourPeople("rake");
        break;
      }
      case "sand-bed": {
        this.floor("#BAA384");
        const bed = cube(2.85, 0.12, 2.1, [0, 0.06, -0.2], "#D6BC8A", { map: texture("#D6BC8A", "#8A6D46", 60, 3), roughness: 1 });
        this.add(/sharp sand|sandfill|sand/, bed, [0, 0.22, 0]);
        const loose = pile(0.3, "#D6BC8A", 61); loose.position.set(-1.05, 0.15, 0.9);
        this.add(/sharp sand|sandfill|sand/, loose, [-0.2, 0.14, 0.12], { appearOnExplode: true });
        this.addLabourPeople("rake");
        break;
      }
      case "dpm": {
        this.floor("#B5A28B");
        const membrane = cube(2.85, 0.018, 2.1, [0, 0.08, -0.2], "#292E33", { roughness: 0.4, metalness: 0.12 });
        this.add(/dpm|membrane|polythene/, membrane, [0, 0.35, 0], { hideOnExplode: true });
        // Visible laps: the top sheet is offset so the overlap is understandable.
        this.add(/dpm|membrane|polythene/, cube(1.55, 0.018, 2.1, [0.67, 0.098, -0.2], "#363B40", { roughness: 0.36 }), [0.25, 0.25, 0]);
        const roll = cylinder(0.12, 0.48, [1.34, 0.18, 0.95], "#34393D", { roughness: 0.42 });
        roll.rotation.z = Math.PI / 2;
        this.add(/dpm|membrane|polythene/, roll, [0.2, 0.12, 0.15], { appearOnExplode: true });
        this.addLabourPeople("tile");
        break;
      }
      case "mesh": {
        this.floor("#B9B5AB");
        const slab = cube(2.8, 0.16, 2.0, [0, 0.08, -0.18], "#B9B8B2", { map: texture("#B9B8B2", "#686761", 62, 2) });
        this.add(/slab|concrete|base/, slab, [0, -0.15, 0]);
        this.add(/brc|mesh|reinforc/, meshGrid(2.45, 1.7, 0.19, 0.24), [0, 0.4, 0]);
        [-0.85, 0, 0.85].forEach((x) => [-0.55, 0.45].forEach((z) => this.add(/brc|mesh|reinforc/, rod([x, 0.13, z], [x, 0.2, z], 0.018, "#929AA1", 0.5))));
        this.addLabourPeople("tile");
        break;
      }
      case "blinding":
      case "concrete-slab": {
        this.floor("#AD9B82");
        const h = kind === "blinding" ? 0.075 : Math.max(0.2, t || 0.28);
        const y = 0.06 + h / 2;
        const colour = kind === "blinding" ? "#BAB6AD" : "#A9AAA7";
        const cast = cube(2.8, h, 1.95, [0, y, -0.15], colour, { map: texture(colour, "#625F58", kind === "blinding" ? 70 : kind === "concrete-slab" ? 72 : 73, 2), roughness: 0.96 });
        this.add(/concrete|blinding|cement|sand|granite|aggregate/, cast, [0, 0.55, 0], { hideOnExplode: true });
        // Exposed cut-edge aggregate and a top-finished plane.
        this.add(/concrete|blinding|cement|sand|granite|aggregate/, cube(2.8, 0.025, 1.95, [0, y + h / 2 + 0.006, -0.15], kind === "blinding" ? "#C8C4BA" : "#B8B8B2", { roughness: 0.83 }), [0, 0.25, 0], { hideOnExplode: true });
        const ingredients = [
          { re: /cement/, p: [-1.2, 0.11, 1.1] as Point, c: "#A5ABB0" },
          { re: /sand/, p: [-0.45, 0.1, 1.1] as Point, c: "#D3B784" },
          { re: /granite|aggregate|stone/, p: [0.3, 0.11, 1.1] as Point, c: "#8A8985" },
        ];
        ingredients.forEach((ing, i) => {
          const p = pile(0.25, ing.c, 80 + i); p.position.set(...ing.p);
          this.add(ing.re, p, [ing.p[0] < 0 ? -0.16 : 0.16, 0.14, 0.15], { appearOnExplode: true });
        });
        for (let i = 0; i < 3; i += 1) this.add(/cement/, bag([-1.42 + i * 0.36, 0.07, 1.55]), [-0.1, 0.12, 0.1], { appearOnExplode: true });
        if (kind === "blinding") {
          const screedRule = cube(1.35, 0.03, 0.035, [0.55, y + h / 2 + 0.03, 0.9], "#7A858D", { metalness: 0.3 });
          this.context.push(screedRule);
        } else {
          const mix = mixer(); mix.position.set(1.45, 0, 1.12);
          this.add(/mixer|plant|vibrator/, mix, [0.25, 0.12, 0.12], { appearOnExplode: true }, "plant");
          if (/c25/.test(this.item.slug)) {
            this.add(/vibrator|plant/, rod([0.8, 0.52, 0.45], [0.8, 0.11, 0.45], 0.026, "#333C43", 0.28), [0.1, 0.15, 0], { appearOnExplode: true }, "plant");
          }
        }
        this.addLabourPeople(kind === "blinding" ? "float" : "shovel");
        break;
      }
      case "rebar-cage": {
        this.floor("#BFB8AC");
        // Bar-bending bench and a tied sample cage, not a generic mesh layer.
        this.context.push(cube(0.95, 0.16, 0.6, [-1.12, 0.72, -0.2], "#B9824C", { map: texture("#B9824C", "#59391F", 83) }));
        const cage = new THREE.Group();
        for (const x of [-0.52, -0.17, 0.17, 0.52]) cage.add(rod([x, 0.12, -0.52], [x, 1.5, -0.52], 0.025, "#6E5141", 0.62));
        for (let y = 0.25; y <= 1.4; y += 0.23) {
          cage.add(rod([-0.62, y, -0.52], [0.62, y, -0.52], 0.016, "#777F84", 0.56));
          cage.add(rod([-0.62, y, 0.52], [0.62, y, 0.52], 0.016, "#777F84", 0.56));
          cage.add(rod([-0.62, y, -0.52], [-0.62, y, 0.52], 0.016, "#777F84", 0.56));
          cage.add(rod([0.62, y, -0.52], [0.62, y, 0.52], 0.016, "#777F84", 0.56));
        }
        this.add(/reinforc|rebar|steel/, cage, [0.16, 0.35, 0.15]);
        const lengths = new THREE.Group();
        for (let i = 0; i < 8; i += 1) lengths.add(rod([-0.42, 0.06 + i * 0.018, 0], [0.42, 0.06 + i * 0.018, 0], 0.018, "#6F5140", 0.6));
        lengths.position.set(1.25, 0, 1.0);
        this.add(/reinforc|rebar|steel/, lengths, [0.2, 0.1, 0.12], { appearOnExplode: true });
        this.addLabourPeople("drill");
        break;
      }
      case "block-wall": {
        const thickness = t || 0.15;
        this.floor("#C0B9AE");
        const courses = 6, width = 0.43, height = 0.19, joint = 0.012;
        for (let row = 0; row < courses; row += 1) {
          const offset = row % 2 ? width / 2 : 0;
          for (let col = -2; col <= 2; col += 1) {
            const x = col * (width + joint) + offset - 0.08;
            const block = cube(width, height, thickness, [x, height / 2 + row * (height + joint) + 0.08, -0.12], "#BDB5A8", { map: texture("#BDB5A8", "#796F63", row * 8 + col + 100, 1.2), roughness: 0.98 });
            this.add(/block|sandcrete/, block, [x * 0.14, (row - 2) * 0.06, -0.35]);
          }
        }
        for (let row = 1; row < courses; row += 1) {
          const mortar = cube(2.12, 0.014, thickness + 0.025, [-0.08, 0.08 + row * (height + joint) - joint / 2, -0.12], "#D4CEC3", { roughness: 1 });
          this.add(/cement|mortar|sand/, mortar, [0, (row - 2) * 0.07, 0.15]);
        }
        const cutBlock = cube(width, height, thickness, [1.3, 0.08 + height / 2, 1.0], "#B7B0A4", { map: texture("#B7B0A4", "#74695D", 115) });
        this.add(/block|sandcrete/, cutBlock, [0.16, 0.1, 0.12], { appearOnExplode: true });
        const mortarPile = pile(0.27, "#C6BDAE", 116); mortarPile.position.set(0.72, 0.14, 1.05);
        this.add(/sand|mortar/, mortarPile, [0.12, 0.12, 0.12], { appearOnExplode: true });
        this.addLabourPeople("trowel");
        break;
      }
      case "plaster":
      case "wall-backing": {
        this.floor("#C8C2B9");
        this.context.push(cube(2.45, 2.45, 0.26, [0, 1.22, -0.35], "#BDB4A7", { map: this.wallTexture(), roughness: 0.98 }));
        const thickness = kind === "plaster" ? 0.045 : 0.06;
        this.add(/plaster|render|backing|screed|cement|sand/, cube(2.28, 2.27, thickness, [0, 1.22, -0.18], kind === "plaster" ? "#D0C9BD" : "#C7C0B6", { map: texture(kind === "plaster" ? "#D0C9BD" : "#C7C0B6", "#897D70", 117, 1.4), roughness: 0.95 }), [0, 0.28, 0.25]);
        // A clear exposed strip reveals the coat thickness; plaster/backing are not tiled.
        this.add(/plaster|render|backing|screed/, cube(0.12, 2.27, thickness + 0.01, [1.14, 1.22, -0.15], "#A99D8F", { roughness: 1 }), [0.1, 0.2, 0.15]);
        this.addLabourPeople("float");
        break;
      }
      case "floor-screed":
      case "thin-screed": {
        this.floor("#B6B0A5");
        const thickness = kind === "floor-screed" ? 0.05 : Math.max(0.01, t * 1.6);
        this.context.push(cube(2.85, 0.18, 2.05, [0, 0.09, -0.1], "#A9A8A2", { map: texture("#A9A8A2", "#696761", 121), roughness: 0.98 }));
        this.add(/cement|sand|screed/, cube(2.82, thickness, 2.02, [0, 0.18 + thickness / 2, -0.1], "#C7C4BD", { map: texture("#C7C4BD", "#847E75", 122, 2), roughness: 0.96 }), [0, 0.28, 0], { hideOnExplode: true });
        // Raised cutaway edge communicates the actual named thickness.
        this.context.push(cube(0.06, Math.max(thickness, 0.015), 2.02, [-1.4, 0.18 + thickness / 2, -0.1], "#978F84"));
        const rule = cube(1.38, 0.025, 0.035, [0.6, 0.24 + thickness, 0.86], "#7C878E", { metalness: 0.36 });
        this.context.push(rule);
        if (kind === "thin-screed") this.add(/admix|acrylic|sbr/, cube(0.23, 0.2, 0.18, [1.3, 0.1, 1.05], "#398A9A"), [0.14, 0.1, 0.12], { appearOnExplode: true });
        this.addLabourPeople("float");
        break;
      }
      case "floor-tiling":
      case "wall-tiling": {
        const wall = kind === "wall-tiling";
        if (wall) {
          this.floor("#C9C5BC");
          this.context.push(cube(2.7, 2.65, 0.24, [0, 1.28, -0.4], "#C6BDB1", { map: this.wallTexture() }));
          for (let row = 0; row < 8; row += 1) {
            for (let col = 0; col < 5; col += 1) {
              const tile = cube(0.48, 0.235, 0.035, [(col - 2) * 0.49, 0.28 + row * 0.245, -0.245], (row + col) % 4 === 0 ? "#DFE6E9" : "#F2F1EC", { roughness: 0.23, metalness: 0.04 });
              this.add(/tile/, tile, [0.04, 0.15, 0]);
            }
          }
          this.add(/adhesive/, cube(0.19, 0.28, 0.07, [1.3, 0.6, -0.26], "#B8B6AF", { roughness: 0.96 }), [0.2, 0.1, 0.1], { appearOnExplode: true });
        } else {
          this.floor("#AAA8A1");
          this.context.push(cube(2.85, 0.13, 2.0, [0, 0.065, -0.1], "#A6A59F", { roughness: 0.98 }));
          for (let row = 0; row < 4; row += 1) {
            for (let col = 0; col < 5; col += 1) {
              const tile = cube(0.53, 0.035, 0.53, [(col - 2) * 0.55, 0.16, (row - 1.5) * 0.52 - 0.1], (row + col) % 4 === 0 ? "#D8D5CE" : "#F1F0EA", { map: texture((row + col) % 4 === 0 ? "#D8D5CE" : "#F1F0EA", "#929087", row * 10 + col + 130), roughness: 0.28 });
              this.add(/tile/, tile, [0, 0.24, 0]);
            }
          }
          this.add(/adhesive/, cube(0.24, 0.1, 0.2, [1.25, 0.08, 1.05], "#B7B7B2"), [0.1, 0.1, 0.1], { appearOnExplode: true });
        }
        this.add(/spacer|grout|trim|accessor/, cube(0.2, 0.1, 0.16, [1.42, 0.1, 0.95], "#919DA5"), [0.12, 0.1, 0.12], { appearOnExplode: true });
        this.addLabourPeople("tile");
        break;
      }
      case "paint-wall": {
        this.floor("#C8C2B9");
        this.context.push(cube(2.55, 2.6, 0.25, [0, 1.28, -0.3], "#C8BFB3", { map: this.wallTexture() }));
        // The finished wall is uniform; separate coat passes are described in the method steps,
        // not shown as three misleading coloured stripes on the final wall.
        this.add(/emulsion|paint/, cube(2.42, 2.35, 0.035, [0, 1.25, -0.14], "#EEECE5", { roughness: 0.78 }), [0, 0.28, 0], { hideOnExplode: true });
        this.add(/emulsion|paint/, cube(0.13, 2.2, 0.04, [1.16, 1.25, -0.11], "#C8BFB2", { roughness: 0.92 }), [0.1, 0.2, 0]);
        this.context.push(cube(0.16, 0.16, 0.1, [1.3, 0.1, 0.98], "#E6E1D5", { roughness: 0.86 }));
        this.addLabourPeople("roller");
        break;
      }
      case "foundation-formwork":
      case "column-formwork":
      case "plank-column-formwork": {
        const column = kind !== "foundation-formwork";
        this.floor("#AC997F");
        const size = kind === "foundation-formwork" ? 2.1 : 0.55;
        const h = kind === "foundation-formwork" ? 0.48 : 2.2;
        const z = column ? -0.1 : -0.1;
        const originY = 0.08 + h / 2;
        if (kind === "foundation-formwork") {
          this.context.push(cube(1.4, 0.22, 1.6, [0, 0.13, -0.1], "#A8A6A0", { map: texture("#A8A6A0", "#615E58", 140) }));
          this.add(/plank|facing/, cube(size, h, 0.04, [0, originY, -0.94], "#B9824C", { map: texture("#B9824C", "#5D3C25", 141, 1.3) }), [0, 0.2, 0.4]);
          this.add(/plank|facing/, cube(size, h, 0.04, [0, originY, 0.74], "#B9824C", { map: texture("#B9824C", "#5D3C25", 142, 1.3) }), [0, 0.2, -0.4]);
        } else {
          const face = kind === "column-formwork" ? "#C28B51" : "#B07B47";
          const tex = texture(face, "#59381F", 143, 1.2);
          this.add(/plywood|plank|facing/, cube(size + 0.04, h, 0.035, [0, originY, z - size / 2], face, { map: tex, roughness: 0.82 }), [-0.32, 0.1, -0.18]);
          this.add(/plywood|plank|facing/, cube(size + 0.04, h, 0.035, [0, originY, z + size / 2], face, { map: tex, roughness: 0.82 }), [0.32, 0.1, 0.18]);
          this.add(/plywood|plank|facing/, cube(0.035, h, size, [-size / 2, originY, z], face, { map: tex, roughness: 0.82 }), [-0.18, 0.1, 0]);
          this.add(/plywood|plank|facing/, cube(0.035, h, size, [size / 2, originY, z], face, { map: tex, roughness: 0.82 }), [0.18, 0.1, 0]);
        }
        for (let y = kind === "foundation-formwork" ? 0.12 : 0.42; y < h + 0.06; y += kind === "foundation-formwork" ? 0.22 : 0.55) {
          this.add(/waler|stud|bearer|2x3|2x2|timber/, cube(size + 0.18, 0.075, 0.085, [0, y, z + size / 2 + 0.07], "#906139", { map: texture("#906139", "#59391F", 144) }), [0, (y / h - 0.5) * 0.15, 0.55]);
        }
        const braces = new THREE.Group();
        braces.add(timberMember([0, 0.12, 0], [0.1, h - 0.1, size / 2 + 0.58], 0.075, 0.075, "#B9824C", 142));
        braces.position.set(0.5, 0, z);
        this.add(/brace|cleat|2x2/, braces, [0.25, 0.2, 0.45]);
        this.add(/nail|release|consumable|tie/, cube(0.2, 0.08, 0.16, [1.25, 0.06, 0.9], "#7B8790", { metalness: 0.32 }), [0.12, 0.1, 0.1], { appearOnExplode: true }, "consumable");
        this.addLabourPeople("drill");
        break;
      }
      case "beam-formwork":
      case "plank-beam-formwork": {
        this.floor("#BBA88F");
        const face = kind === "beam-formwork" ? "#C18B50" : "#AE7A47";
        const beamGroup = new THREE.Group();
        beamGroup.add(cube(2.5, 0.045, 0.48, [0, 1.55, -0.15], face, { map: texture(face, "#59391F", 151) }));
        beamGroup.add(cube(2.5, 0.4, 0.045, [0, 1.77, -0.41], face, { map: texture(face, "#59391F", 152) }));
        beamGroup.add(cube(2.5, 0.4, 0.045, [0, 1.77, 0.11], face, { map: texture(face, "#59391F", 153) }));
        for (let x = -1.12; x <= 1.12; x += 0.42) {
          beamGroup.add(cube(0.06, 0.07, 0.62, [x, 1.82, -0.15], "#8F633B", { map: texture("#8F633B", "#53371F", 154) }));
        }
        this.add(/plywood|plank|formwork|facing/, beamGroup, [0, 0.42, 0], { hideOnExplode: true });
        const support = new THREE.Group();
        [-0.9, 0.9].forEach((x) => {
          support.add(rod([x, 0.12, -0.15], [x, 1.46, -0.15], 0.035, "#6D7780", 0.62));
          support.add(cube(0.28, 0.035, 0.25, [x, 0.12, -0.15], "#535E68", { metalness: 0.42 }));
        });
        this.add(/peri|h20|bearer|support/, support, [0.12, 0.25, 0.08], { appearOnExplode: true }, "material");
        this.addLabourPeople("drill");
        break;
      }
      case "slab-formwork":
      case "premium-slab-formwork": {
        this.floor("#BDB2A2");
        const deck = this.add(/plywood|facing/, cube(2.75, 0.055, 2.05, [0, 2.05, -0.1], kind === "premium-slab-formwork" ? "#B98B5C" : "#C49159", { map: texture(kind === "premium-slab-formwork" ? "#B98B5C" : "#C49159", "#5B3B23", 160, 1.3), roughness: 0.82 }), [0, 0.65, 0], { hideOnExplode: true });
        // Seams are panel joints, not masonry joints.
        for (let x = -0.9; x <= 0.91; x += 0.9) this.add(/plywood|facing/, rod([x, 2.08, -1.12], [x, 2.08, 0.91], 0.006, "#8E653D"), [0, 0.55, 0]);
        const rows = kind === "premium-slab-formwork" ? 8 : 6;
        for (let i = 0; i < rows; i += 1) {
          const x = -1.25 + i * (2.5 / (rows - 1));
          this.add(/joist|runner|2x3|furring/, cube(0.055, 0.11, 2.05, [x, 1.94, -0.1], "#E0BD89", { map: texture("#E0BD89", "#6B4728", 161) }), [0, 0.42, 0]);
        }
        for (const z of [-0.88, -0.12, 0.64]) this.add(/bearer|2x6|primary beam|h20|peri/, cube(2.95, 0.14, 0.09, [0, 1.78, z], "#9F7448", { map: texture("#9F7448", "#5B3B23", 162) }), [0, 0.35, 0]);
        for (const x of [-1.1, 0, 1.1]) for (const z of [-0.88, 0.64]) {
          this.add(/prop|support|primary beam/, rod([x, 0.12, z], [x, 1.68, z], 0.045, "#6F7982", 0.63), [0.04, 0.15, 0], { appearOnExplode: true }, "plant");
          this.context.push(cube(0.26, 0.035, 0.26, [x, 0.12, z], "#4F5962", { metalness: 0.45 }));
        }
        this.addLabourPeople("drill");
        break;
      }
      case "stair-formwork": {
        this.floor("#BDB3A2");
        const stair = new THREE.Group();
        // Inclined soffit/stringers and individual riser faces.
        const slope = cube(2.3, 0.06, 0.75, [0, 0.72, 0], "#BD8954", { map: texture("#BD8954", "#5C3B23", 169) });
        slope.rotation.z = -0.42; stair.add(slope);
        for (let i = 0; i < 7; i += 1) {
          const x = -0.95 + i * 0.31, y = 0.26 + i * 0.19;
          stair.add(cube(0.33, 0.04, 0.76, [x, y, 0], "#C99660", { map: texture("#C99660", "#624126", 170 + i) }));
          stair.add(cube(0.04, 0.2, 0.76, [x + 0.145, y - 0.12, 0], "#B7814B"));
        }
        this.add(/plywood|facing|riser|stair/, stair, [0, 0.42, 0], { hideOnExplode: true });
        this.add(/stringer|bearer|2x6|support/, rod([-1.1, 0.18, 0.52], [1.05, 1.48, 0.52], 0.07, "#9F6F40"), [0.2, 0.25, 0], { appearOnExplode: true });
        this.addLabourPeople("drill");
        break;
      }
      case "shear-wall-formwork": {
        this.floor("#B7A38A");
        for (const z of [-0.36, 0.36]) {
          this.add(/plywood|facing|formwork/, cube(2.65, 2.25, 0.05, [0, 1.2, z], "#BF8B50", { map: texture("#BF8B50", "#603C20", z < 0 ? 171 : 172, 1.2) }), [0, 0.45, z < 0 ? -0.3 : 0.3]);
          for (let y = 0.42; y < 2.25; y += 0.48) this.add(/waler|stiffener|timber/, cube(2.82, 0.11, 0.09, [0, y, z * 1.3], "#986B3F", { map: texture("#986B3F", "#4E331F", 173) }), [0, (y - 1.2) * 0.12, z < 0 ? -0.55 : 0.55]);
        }
        for (let x = -1.0; x <= 1.01; x += 0.5) for (const y of [0.5, 1.35, 2.1]) {
          this.add(/tie|spacer|bolt/, rod([x, y, -0.42], [x, y, 0.42], 0.025, "#6D7780", 0.72), [0, 0.25, 0]);
        }
        this.addLabourPeople("drill");
        break;
      }
      case "slab-edge-formwork": {
        this.floor("#A9A69E");
        this.context.push(cube(2.8, 0.24, 2.0, [0, 0.12, -0.1], "#B6B4AE", { map: texture("#B6B4AE", "#66645F", 177) }));
        this.add(/plank|edge|facing|formwork/, cube(2.8, 0.25, 0.04, [0, 0.38, 0.93], "#B7814B", { map: texture("#B7814B", "#55391F", 178) }), [0, 0.3, 0]);
        for (let x = -1.25; x <= 1.26; x += 0.5) {
          this.add(/stake|cleat|brace|2x2/, rod([x, 0.08, 1.05], [x, 0.56, 1.05], 0.025, "#98693D"), [0, 0.2, 0]);
          this.add(/stake|cleat|brace|2x2/, rod([x, 0.18, 1.05], [x - 0.25, 0.4, 1.25], 0.018, "#98693D"));
        }
        this.addLabourPeople("hammer");
        break;
      }
      case "window":
      case "door": {
        this.room();
        const masonry = this.wallTexture();
        if (kind === "window") {
          // Four surrounding wall returns form a real aperture; glass is not laid over solid masonry.
          this.context.push(cube(0.48, 2.7, 0.25, [-1.11, 1.35, -0.45], "#C6BDB1", { map: masonry, roughness: 0.97 }));
          this.context.push(cube(0.48, 2.7, 0.25, [1.11, 1.35, -0.45], "#C6BDB1", { map: masonry, roughness: 0.97 }));
          this.context.push(cube(2.7, 0.8, 0.25, [0, 0.4, -0.45], "#C6BDB1", { map: masonry, roughness: 0.97 }));
          this.context.push(cube(2.7, 0.5, 0.25, [0, 2.45, -0.45], "#C6BDB1", { map: masonry, roughness: 0.97 }));
          this.add(/frame|aluminium|window/, cube(1.72, 1.32, 0.09, [0, 1.52, -0.29], "#667E90", { metalness: 0.58, roughness: 0.34 }), [0.16, 0.08, 0]);
          this.add(/glass|glazing/, cube(1.56, 1.2, 0.018, [0, 1.52, -0.235], "#9DC4D8", { transparent: true, opacity: 0.52, roughness: 0.12, metalness: 0.18 }), [0, 0.12, 0], { hideOnExplode: true });
          this.add(/sash|frame|aluminium/, cube(0.025, 1.22, 0.035, [0, 1.52, -0.2], "#536B7B", { metalness: 0.62, roughness: 0.34 }));
          this.add(/seal|dressing|fixing/, rod([-0.88, 0.82, -0.21], [0.88, 0.82, -0.21], 0.01, "#728B9C"), [0, 0.18, 0]);
        } else {
          // The door leaf sits within an actual open doorway with masonry jambs and a header.
          this.context.push(cube(0.82, 2.7, 0.25, [-0.94, 1.35, -0.45], "#C6BDB1", { map: masonry, roughness: 0.97 }));
          this.context.push(cube(0.82, 2.7, 0.25, [0.94, 1.35, -0.45], "#C6BDB1", { map: masonry, roughness: 0.97 }));
          this.context.push(cube(1.06, 0.45, 0.25, [0, 2.475, -0.45], "#C6BDB1", { map: masonry, roughness: 0.97 }));
          this.add(/door frame|frame|jamb/, cube(1.05, 2.25, 0.1, [0, 1.2, -0.26], "#94643C", { map: texture("#94643C", "#4D2E1A", 181) }), [0, 0.1, 0]);
          this.add(/door leaf|door/, cube(0.91, 2.08, 0.045, [0, 1.18, -0.18], "#A87548", { map: texture("#A87548", "#5C3922", 182), roughness: 0.72 }), [0.35, 0.08, 0], { hideOnExplode: true });
          [0.45, 1.65].forEach(y => this.add(/hinge|hardware|fixing/, cube(0.045, 0.16, 0.045, [-0.44, y, -0.14], "#C4C9CE", { metalness: 0.78, roughness: 0.32 })));
          this.add(/handle|lock|hardware/, cube(0.06, 0.13, 0.045, [0.32, 1.18, -0.12], "#D7B56B", { metalness: 0.7, roughness: 0.3 }), [0.18, 0.08, 0]);
        }
        this.addLabourPeople("drill");
        break;
      }
      case "wc-basin": {
        this.room();
        this.context.push(cube(2.6, 2.6, 0.16, [0, 1.28, -1.35], "#C7C1B8", { roughness: 0.96 }));
        // WC pan and cistern.
        this.add(/wc|water closet|sanitary|pan/, cylinder(0.26, 0.38, [-0.76, 0.28, -0.34], "#F5F4F0", { roughness: 0.22 }), [0, 0.14, 0]);
        this.add(/wc|cistern/, cube(0.45, 0.55, 0.23, [-0.76, 0.62, -0.48], "#F5F4F0", { roughness: 0.22 }), [0.05, 0.12, 0]);
        this.add(/basin|wash/, new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat("#F4F3EF", { roughness: 0.2 })), [0, 0.15, 0]);
        const basin = this.parts[this.parts.length - 1].object; basin.position.set(0.72, 0.95, -0.35); basin.scale.set(1.4, 0.25, 0.9);
        this.add(/pedestal|basin|support/, cube(0.26, 0.82, 0.26, [0.72, 0.48, -0.37], "#F0F0EC", { roughness: 0.24 }));
        this.add(/tap|mixer|fitting/, rod([0.78, 1.15, -0.5], [0.78, 1.32, -0.5], 0.03, "#AEB7BE", 0.78));
        this.add(/pipe|water|waste|plumb/, rod([-0.76, 0.05, -0.12], [-0.76, 0.4, -0.12], 0.045, "#3D8AB8"));
        this.add(/pipe|water|waste|plumb/, rod([0.72, 0.32, -0.12], [0.72, 0.6, -0.12], 0.035, "#3D8AB8"));
        this.addLabourPeople("wrench");
        break;
      }
      case "kitchen-sink": {
        this.room();
        this.context.push(cube(2.45, 0.2, 0.78, [0, 0.92, -0.28], "#D4D0C7", { roughness: 0.44 }));
        this.context.push(cube(2.4, 0.86, 0.7, [0, 0.42, -0.26], "#A77C52", { map: texture("#A77C52", "#57391F", 185) }));
        this.add(/sink/, cube(1.02, 0.16, 0.62, [-0.22, 1.06, -0.28], "#AEB7BF", { metalness: 0.72, roughness: 0.26 }), [0, 0.2, 0]);
        this.add(/mixer|tap/, rod([0.2, 1.1, -0.46], [0.2, 1.38, -0.46], 0.035, "#B7C0C7", 0.8), [0.12, 0.12, 0]);
        this.add(/waste|pipe|plumb/, rod([-0.22, 0.98, -0.26], [-0.22, 0.55, -0.26], 0.035, "#3D8AB8"));
        this.addLabourPeople("wrench");
        break;
      }
      case "shower": {
        this.room();
        this.context.push(cube(2.6, 2.55, 0.18, [0, 1.27, -0.85], "#AEB8BE", { roughness: 0.3 }));
        for (let row = 0; row < 6; row += 1) for (let col = 0; col < 5; col += 1) this.context.push(cube(0.48, 0.4, 0.025, [(col - 2) * 0.51, 0.25 + row * 0.41, -0.74], "#D8D9D5", { roughness: 0.32 }));
        this.add(/shower|riser|pipe/, rod([0.62, 0.3, -0.57], [0.62, 2.1, -0.57], 0.035, "#909DA6", 0.72));
        this.add(/shower|head/, cylinder(0.16, 0.035, [0.62, 2.1, -0.57], "#B5BFC6", { metalness: 0.72, roughness: 0.24 }), [0, 0.2, 0]);
        this.add(/control|valve|shower/, cube(0.22, 0.22, 0.1, [0.62, 1.0, -0.53], "#AEB9C0", { metalness: 0.68, roughness: 0.28 }));
        this.add(/control|valve|fitting/, cylinder(0.1, 0.04, [0.62, 1.0, -0.45], "#CFD5D8", { metalness: 0.8, roughness: 0.2 }));
        this.addLabourPeople("wrench");
        break;
      }
      case "mirror": {
        this.room();
        this.context.push(cube(2.6, 2.6, 0.18, [0, 1.27, -0.55], "#C7C1B7", { map: this.wallTexture() }));
        this.add(/mirror|glass/, cube(1.1, 1.45, 0.045, [0, 1.55, -0.42], "#9AB8C6", { metalness: 0.3, roughness: 0.14 }), [0, 0.18, 0], { hideOnExplode: true });
        this.add(/bracket|fix|adhesive|sundry/, cube(1.16, 1.5, 0.025, [0, 1.55, -0.38], "#737D85", { roughness: 0.4 }), [0, 0.25, 0]);
        this.addLabourPeople("drill");
        break;
      }
      case "floor-drain": {
        this.room();
        const tiled = cube(2.8, 0.13, 2.1, [0, 0.065, -0.1], "#DAD8D2", { roughness: 0.28 });
        this.context.push(tiled);
        for (let x = -1.2; x <= 1.21; x += 0.6) this.context.push(rod([x, 0.14, -1.1], [x, 0.14, 0.95], 0.004, "#96958E"));
        for (let z = -1.1; z <= 0.96; z += 0.6) this.context.push(rod([-1.4, 0.14, z], [1.4, 0.14, z], 0.004, "#96958E"));
        this.add(/drain|stainless|grate/, cube(0.34, 0.04, 0.34, [0, 0.16, -0.1], "#939DA4", { metalness: 0.75, roughness: 0.26 }), [0, 0.28, 0]);
        for (let i = -2; i <= 2; i += 1) this.add(/drain|grate/, rod([i * 0.055, 0.185, -0.26], [i * 0.055, 0.185, 0.06], 0.006, "#515D66", 0.68));
        this.add(/waste|pipe|outlet/, rod([0, 0.13, -0.1], [0, -0.38, -0.1], 0.06, "#3D8AB8"), [0, -0.2, 0]);
        this.addLabourPeople("wrench");
        break;
      }
      case "marble-field":
      case "marble-border":
      case "marble-mitred-top":
      case "stone-band":
      case "oak-straight":
      case "oak-chevron":
      case "wood-tile": {
        this.floor("#A9A69E");
        const isMarble = ["marble-field", "marble-border", "marble-mitred-top", "stone-band"].includes(kind);
        const isPattern = kind === "stone-band" || kind === "oak-chevron" || kind === "wood-tile";
        const baseLayer = cube(2.85, 0.17, 2.05, [0, 0.085, -0.08], "#A7A6A0", { map: texture("#A7A6A0", "#5F5B54", 191) });
        this.add(/bedding|adhesive|consumable|material/, baseLayer, [0, -0.12, 0]);
        if (kind === "marble-mitred-top") {
          const planter = cube(1.5, 0.66, 0.88, [0, 0.5, -0.15], "#7C7E7D", { roughness: 0.96 });
          this.context.push(planter);
          this.add(/marble|stone|top|bedding/, cube(1.72, 0.12, 1.07, [0, 0.89, -0.15], "#D7D2C8", { map: texture("#D7D2C8", "#827C70", 192), roughness: 0.26 }), [0, 0.3, 0]);
          // 45-degree mitre cues are separate thin light strips along the top perimeter.
          for (const x of [-0.82, 0.82]) this.add(/marble|stone|top/, rod([x, 0.96, -0.64], [x * 0.92, 0.96, 0.34], 0.018, "#9A9489"));
        } else if (kind === "marble-border") {
          // Each narrow 80 mm strip forms a short length along the 80 mm band.
          for (let i = 0; i < 9; i += 1) {
            const strip = cube(0.29, 0.055, 0.08, [-1.16 + i * 0.29, 0.21, -0.08], "#D7D1C5", { map: texture("#D7D1C5", "#958C7F", 193 + i), roughness: 0.25 });
            this.add(/marble|border|bedding/, strip, [0, 0.22, 0]);
          }
          this.context.push(cube(2.8, 0.035, 0.14, [0, 0.19, -0.08], "#969995"));
        } else if (kind === "marble-field") {
          for (let row = 0; row < 3; row += 1) for (let col = 0; col < 3; col += 1) {
            const tile = cube(0.87, 0.065, 0.62, [(col - 1) * 0.91, 0.22, (row - 1) * 0.65 - 0.08], "#D8D3C9", { map: texture("#D8D3C9", "#94897C", 200 + row * 4 + col), roughness: 0.25 });
            this.add(/marble|stone|laying/, tile, [0, 0.24, 0]);
          }
        } else if (kind === "stone-band") {
          this.context.push(cube(2.75, 0.045, 1.65, [0, 0.2, -0.08], "#BBAE97"));
          for (let row = 0; row < 5; row += 1) for (let col = 0; col < 9; col += 1) {
            const band = Math.abs(col - 4) <= 1 || row === 0 || row === 4;
            const tile = cube(0.29, 0.035, 0.29, [(col - 4) * 0.3, 0.245, (row - 2) * 0.31 - 0.08], band ? "#817B73" : "#D7D4CE", { roughness: 0.27, map: texture(band ? "#817B73" : "#D7D4CE", "#68625B", 219 + row * 9 + col) });
            this.add(/stone|module|consumable|laying/, tile, [0, 0.18, 0]);
          }
        } else if (kind === "oak-chevron") {
          for (let row = 0; row < 5; row += 1) for (let col = 0; col < 6; col += 1) {
            const board = cube(0.22, 0.045, 0.58, [(col - 2.5) * 0.38, 0.22, (row - 2) * 0.34 - 0.08], "#A87548", { map: texture("#A87548", "#56331B", 220 + row * 6 + col), roughness: 0.43 });
            board.rotation.y = ((row + col) % 2 ? -1 : 1) * Math.PI / 4;
            this.add(/oak|board|flooring|consumable/, board, [0, 0.2, 0]);
          }
        } else if (kind === "oak-straight") {
          // Long parallel strips with staggered end joints; boards are not square tiles.
          for (let col = 0; col < 10; col += 1) for (let row = 0; row < 3; row += 1) {
            const z = -0.69 + row * 0.53 + (col % 2 ? 0.26 : 0);
            const board = cube(0.25, 0.045, 0.51, [(col - 4.5) * 0.28, 0.22, z], "#A87548", { map: texture("#A87548", "#56331B", 230 + col * 3 + row), roughness: 0.43 });
            this.add(/oak|board|flooring|consumable/, board, [0, 0.2, 0]);
          }
        } else {
          // Decorative wood tiles are smaller modules, not long strip flooring.
          for (let row = 0; row < 5; row += 1) for (let col = 0; col < 6; col += 1) {
            const board = cube(0.35, 0.045, 0.32, [(col - 2.5) * 0.37, 0.22, (row - 2) * 0.34 - 0.08], (row + col) % 2 ? "#B78351" : "#9D6B3E", { map: texture((row + col) % 2 ? "#B78351" : "#9D6B3E", "#59391F", 240 + row * 6 + col), roughness: 0.35 });
            if (kind === "wood-tile") board.rotation.y = (row % 2) * Math.PI / 2;
            this.add(/wood|tile|pattern|consumable|laying/, board, [0, 0.2, 0]);
          }
        }
        this.addLabourPeople("tile");
        break;
      }
      case "adhesive": {
        this.floor("#A8A59E");
        const substrate = cube(2.75, 0.16, 1.8, [0, 0.08, -0.12], "#B9B8B3", { roughness: 0.98 });
        this.context.push(substrate);
        const bed = cube(2.52, 0.035, 1.58, [0, 0.18, -0.12], "#C7B9A0", { roughness: 0.96 });
        this.add(/adhesive/, bed, [0, 0.3, 0]);
        // Fine, parallel adhesive ridges laid with a notched trowel.
        for (let x = -1.15; x <= 1.16; x += 0.12) this.add(/adhesive/, cube(0.025, 0.028, 1.52, [x, 0.21, -0.12], "#DDCFB8", { roughness: 0.9 }), [0, 0.16, 0]);
        this.add(/adhesive/, bag([1.15, 0.06, 0.94], "#B0B4B8"), [0.15, 0.08, 0.1], { appearOnExplode: true });
        // Material-only line: illustrate a spreader tool, not labour priced in the rate.
        this.context.push(rod([0.72, 0.25, 0.7], [0.96, 0.28, 0.85], 0.014, "#816345"));
        this.context.push(cube(0.18, 0.015, 0.08, [0.98, 0.28, 0.86], "#9DA6AC", { metalness: 0.45 }));
        break;
      }
      case "foam-underlay": {
        this.floor("#AAA8A0");
        this.context.push(cube(2.82, 0.14, 2.0, [0, 0.07, -0.1], "#A8A6A0"));
        this.add(/underlay|foam/, cube(2.75, 0.02, 1.94, [0, 0.16, -0.1], "#6A9A9A", { roughness: 0.65 }), [0, 0.35, 0], { hideOnExplode: true });
        const roll = cylinder(0.15, 0.58, [1.14, 0.2, 0.95], "#4D898A", { roughness: 0.65 });
        roll.rotation.z = Math.PI / 2;
        this.add(/underlay|foam/, roll, [0.22, 0.1, 0.12], { appearOnExplode: true });
        this.addLabourPeople("tile");
        break;
      }
      case "ceiling-flat":
      case "ceiling-step":
      case "ceiling-curved":
      case "ceiling-recess": {
        this.room();
        this.context.push(cube(4.2, 0.12, 3.2, [0, 2.8, -0.12], "#B5B5B0", { roughness: 0.9 }));
        const profileColor = "#7B8790";
        // Hangers and framing are visible separately in the exploded view.
        for (let x = -1.65; x <= 1.66; x += 0.55) {
          for (const z of [-1.05, -0.05, 0.95]) {
            this.add(/hanger|rod|wire|fixing/, rod([x, 2.04, z], [x, 2.73, z], 0.014, profileColor, 0.6), [0, 0.34, 0]);
          }
        }
        for (let z = -1.08; z <= 0.99; z += 0.52) {
          this.add(/main|channel|profile|furring|frame/, cube(3.65, 0.045, 0.045, [0, 2.01, z], profileColor, { metalness: 0.58, roughness: 0.45 }), [0, 0.25, 0]);
        }
        if (kind === "ceiling-flat") {
          this.add(/board|gypsum/, cube(3.8, 0.045, 2.45, [0, 1.96, -0.05], "#E9E8E2", { roughness: 0.8 }), [0, 0.55, 0], { hideOnExplode: true });
          this.add(/board|gypsum/, cube(3.8, 0.045, 0.05, [0, 1.99, -0.05], "#D8D8D1"), [0, 0.3, 0]);
        } else if (kind === "ceiling-step") {
          this.add(/board|gypsum/, cube(3.7, 0.045, 1.85, [0, 1.95, -0.03], "#EAE9E3", { roughness: 0.8 }), [0, 0.5, 0], { hideOnExplode: true });
          // Recessed central height and raised perimeter make the step obvious.
          this.add(/board|gypsum/, cube(3.7, 0.045, 0.52, [0, 2.22, 1.12], "#EAE9E3", { roughness: 0.8 }), [0, 0.4, 0], { hideOnExplode: true });
          this.add(/board|gypsum/, cube(0.09, 0.29, 0.56, [-1.82, 2.07, 1.08], "#E0DFD8"), [-0.2, 0.28, 0]);
          this.add(/board|gypsum/, cube(0.09, 0.29, 0.56, [1.82, 2.07, 1.08], "#E0DFD8"), [0.2, 0.28, 0]);
        } else if (kind === "ceiling-curved") {
          const ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1.58, 64), mat("#E9E8E2", { roughness: 0.78 }));
          ring.rotation.x = -Math.PI / 2; ring.position.set(0, 2.02, -0.05); ring.scale.set(1.1, 1.0, 1.0);
          this.add(/board|gypsum/, ring, [0, 0.5, 0], { hideOnExplode: true });
          const fascia = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.07, 10, 64), mat("#D6D4CE", { roughness: 0.82 }));
          fascia.rotation.x = Math.PI / 2; fascia.position.set(0, 1.8, -0.05);
          this.add(/board|gypsum/, fascia, [0, 0.35, 0]);
          const inner = new THREE.Mesh(new THREE.CircleGeometry(0.82, 64), mat("#F0EFE9", { roughness: 0.8 }));
          inner.rotation.x = -Math.PI / 2; inner.position.set(0, 2.08, -0.05);
          this.add(/board|gypsum/, inner, [0, 0.35, 0], { hideOnExplode: true });
        } else {
          const outer = new THREE.Mesh(new THREE.RingGeometry(0.82, 1.65, 64), mat("#E8E7E0", { roughness: 0.8 }));
          outer.rotation.x = -Math.PI / 2; outer.position.set(0, 2.2, -0.05);
          this.add(/board|gypsum/, outer, [0, 0.45, 0], { hideOnExplode: true });
          const lower = new THREE.Mesh(new THREE.CircleGeometry(0.82, 64), mat("#D9D8D1", { roughness: 0.8 }));
          lower.rotation.x = -Math.PI / 2; lower.position.set(0, 1.96, -0.05);
          this.add(/board|gypsum/, lower, [0, 0.38, 0], { hideOnExplode: true });
          const fascia = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.07, 10, 64), mat("#D1D0C9", { roughness: 0.8 }));
          fascia.rotation.x = Math.PI / 2; fascia.position.set(0, 2.06, -0.05);
          this.add(/board|gypsum/, fascia, [0, 0.3, 0]);
        }
        this.addLabourPeople("drill");
        break;
      }
      case "pop-groove": {
        this.room();
        this.context.push(cube(4.1, 0.09, 3.1, [0, 2.55, -0.1], "#E8E6DF"));
        const strip = cube(3.8, 0.12, t || 0.15, [0, 2.48, 1.35], "#E9E6DE", { roughness: 0.88 });
        this.add(/pop|material/, strip, [0, 0.28, 0]);
        for (let i = 0; i < 5; i += 1) this.add(/pop|groove|material/, cube(3.78, 0.012, 0.012, [0, 2.43 + i * 0.025, 1.43], "#AAA69D"), [0, 0.24, 0]);
        this.addLabourPeople("trowel");
        break;
      }
      case "pop-crown": {
        this.room();
        this.context.push(cylinder(0.42, 2.35, [0, 1.18, -0.12], "#C6C1B8", { map: texture("#C6C1B8", "#82786D", 230), roughness: 0.92 }));
        const crown = new THREE.Group();
        crown.add(cylinder(0.6, 0.16, [0, 2.35, -0.12], "#E9E6DE", { roughness: 0.78 }));
        crown.add(cylinder(0.53, 0.12, [0, 2.49, -0.12], "#DCD8CF", { roughness: 0.78 }));
        crown.add(cylinder(0.62, 0.1, [0, 2.6, -0.12], "#EAE7DF", { roughness: 0.78 }));
        crown.add(cylinder(0.48, 0.09, [0, 2.69, -0.12], "#D7D3CA", { roughness: 0.78 }));
        this.add(/pop|mould|crown|material/, crown, [0, 0.35, 0], { hideOnExplode: true });
        this.addLabourPeople("trowel");
        break;
      }
      case "pop-ceiling": {
        this.room();
        this.context.push(cube(4.1, 0.12, 3.1, [0, 2.62, -0.05], "#B5B5AF"));
        this.add(/pop|support|material/, cube(3.85, 0.07, 2.85, [0, 2.5, -0.05], "#E9E7DF", { roughness: 0.92 }), [0, 0.36, 0], { hideOnExplode: true });
        for (let x = -1.55; x <= 1.56; x += 0.52) this.add(/support|brandering|material/, cube(0.045, 0.065, 2.9, [x, 2.47, -0.05], "#98714A", { map: texture("#98714A", "#55371F", x * 20 + 245) }), [0, 0.25, 0]);
        this.addLabourPeople("trowel");
        break;
      }
      case "pop-skim": {
        this.room();
        const slab = cube(4.05, 0.18, 3.0, [0, 2.65, -0.1], "#A5A6A3", { map: texture("#A5A6A3", "#666660", 250) });
        this.context.push(slab);
        this.add(/pop|skim|material/, cube(3.95, 0.018, 2.88, [0, 2.55, -0.1], "#E7E5DE", { roughness: 0.88 }), [0, 0.3, 0], { hideOnExplode: true });
        // Work platform shows how an overhead skim coat is accessed.
        this.context.push(cube(0.55, 0.9, 0.55, [1.35, 0.48, 0.82], "#87939C", { metalness: 0.45 }));
        this.addLabourPeople("float");
        break;
      }
      case "roof-cover": {
        // Pitched roof with supporting timber, sheet laps, and eaves.
        const frame = new THREE.Group();
        const half = 1.55, rise = 0.65;
        for (let x = -1.5; x <= 1.51; x += 0.75) {
          frame.add(timberMember([x, 2.06, -1.4], [x, 2.06 + rise, 0], 0.09, 0.14, "#A77A4B", 260 + Math.round((x + 2) * 10)));
          frame.add(timberMember([x, 2.06, 1.4], [x, 2.06 + rise, 0], 0.09, 0.14, "#A77A4B", 280 + Math.round((x + 2) * 10)));
        }
        for (const z of [-1.2, -0.6, 0, 0.6, 1.2]) {
          frame.add(cube(3.25, 0.06, 0.07, [0, 2.14 + rise * (1 - Math.abs(z) / 1.4), z], "#8D6843", { map: texture("#8D6843", "#53381F", 260 + Math.round(z * 10)) }));
        }
        this.context.push(frame);
        const roof = new THREE.Group();
        const sheetMat = mat("#D4D9DC", { metalness: 0.42, roughness: 0.36, side: THREE.DoubleSide });
        const pitchAngle = Math.atan2(0.65, 1.4);
        for (const side of [-1, 1]) {
          const slopeGroup = new THREE.Group();
          for (let i = 0; i < 5; i += 1) {
            const shape = new THREE.Shape();
            shape.moveTo(-0.35, 0);
            for (let x = -0.35; x < 0.35; x += 0.14) {
              shape.lineTo(x + 0.035, 0);
              shape.lineTo(x + 0.06, 0.024);
              shape.lineTo(x + 0.09, 0.024);
              shape.lineTo(Math.min(x + 0.115, 0.35), 0);
            }
            shape.lineTo(0.35, -0.008); shape.lineTo(-0.35, -0.008);
            const geometry = new THREE.ExtrudeGeometry(shape, { depth: 2.02, bevelEnabled: false });
            geometry.translate(0, 0, -1.01);
            const panel = new THREE.Mesh(geometry, sheetMat.clone());
            panel.castShadow = true; panel.receiveShadow = true;
            panel.position.set((i - 2) * 0.7, 0, 0);
            slopeGroup.add(panel);
          }
          slopeGroup.rotation.x = side * pitchAngle;
          slopeGroup.position.set(0, 2.43, side * 0.7);
          roof.add(slopeGroup);
        }
        this.add(/aluminium|roofing sheet|roof cover/, roof, [0, 0.62, 0], { hideOnExplode: true });
        const screws = new THREE.Group();
        for (let i = 0; i < 5; i += 1) for (let j = 0; j < 7; j += 1) screws.add(cylinder(0.012, 0.035, [(i - 2) * 0.7, 0, (j - 3) * 0.29], "#8A929A", { metalness: 0.82, roughness: 0.3 }));
        screws.position.set(0, 2.48, 0);
        this.add(/screws|washer|accessories/, screws, [0, 0.8, 0], { appearOnExplode: true }, "consumable");
        this.addLabourPeople("drill");
        break;
      }
      case "ridge-cap": {
        // Two corrugated roof slopes meet at the ridge, with cap above the apex.
        this.floor("#BBA88F");
        for (const side of [-1, 1]) {
          const slope = new THREE.Group();
          for (let i = 0; i < 4; i += 1) slope.add(cube(0.58, 0.035, 1.42, [(i - 1.5) * 0.6, 0, side * 0.37], "#6F8797", { metalness: 0.28, roughness: 0.4 }));
          slope.rotation.x = side * 0.35;
          slope.position.set(0, 1.88, 0);
          this.context.push(slope);
        }
        const capProfile = new THREE.Shape();
        capProfile.moveTo(-0.3, -0.06);
        capProfile.lineTo(0, 0.09);
        capProfile.lineTo(0.3, -0.06);
        capProfile.lineTo(0.27, -0.1);
        capProfile.lineTo(0, 0.025);
        capProfile.lineTo(-0.27, -0.1);
        capProfile.closePath();
        const capGeometry = new THREE.ExtrudeGeometry(capProfile, { depth: 2.55, bevelEnabled: false });
        capGeometry.translate(0, 0, -1.275);
        const cap = new THREE.Mesh(capGeometry, mat("#BCC8CE", { metalness: 0.5, roughness: 0.33, side: THREE.DoubleSide }));
        cap.position.set(0, 2.28, 0);
        cap.castShadow = true; cap.receiveShadow = true;
        this.add(/ridge|aluminium|capping/, cap, [0, 0.34, 0], { hideOnExplode: true });
        this.add(/screws|rivets|fixings/, cube(0.24, 0.035, 0.22, [1.25, 2.24, 0.1], "#858F97", { metalness: 0.7 }), [0.12, 0.2, 0], { appearOnExplode: true }, "consumable");
        this.addLabourPeople("drill");
        break;
      }
      case "fascia": {
        this.floor("#B8A58D");
        const eave = new THREE.Group();
        eave.add(cube(2.85, 0.06, 1.05, [0, 2.1, -0.45], "#8E6843", { map: texture("#8E6843", "#51351F", 270) }));
        eave.add(cube(2.9, 0.035, 0.75, [0, 2.2, -0.45], "#8597A2", { metalness: 0.32, roughness: 0.4 }));
        this.context.push(eave);
        this.add(/fascia|aluminium/, cube(2.8, 0.3, 0.045, [0, 2.02, 0.11], "#AEBFC7", { metalness: 0.48, roughness: 0.33 }), [0, 0.35, 0], { hideOnExplode: true });
        this.add(/screw|rivet|fixing/, rod([-1.1, 1.82, 0.15], [-1.1, 1.82, 0.09], 0.014, "#69747C", 0.7), [0, 0.18, 0], { appearOnExplode: true }, "consumable");
        this.addLabourPeople("drill");
        break;
      }
      case "wall-plate":
      case "rafter":
      case "roof-strut":
      case "purlin":
      case "noggin": {
        this.floor("#BEAD95");
        // Roof bay context is the same, but the priced member is uniquely isolated/highlighted for each rate.
        const wall = cube(3.3, 1.15, 0.28, [0, 0.58, -1.0], "#C2B9AD", { map: this.wallTexture(), roughness: 0.96 });
        this.context.push(wall);
        const plate = cube(3.0, 0.15, 0.15, [0, 1.25, -0.92], "#9B7045", { map: texture("#9B7045", "#55361E", 280) });
        this.context.push(plate);
        const rafters = new THREE.Group();
        for (const x of [-1.15, -0.4, 0.4, 1.15]) {
          rafters.add(timberMember([x, 1.32, -0.9], [x, 2.32, 0.05], 0.075, 0.13, "#B0824E", 280));
          rafters.add(timberMember([x, 1.32, -0.9], [x, 2.32, 0.95], 0.075, 0.13, "#B0824E", 281));
        }
        this.context.push(rafters);
        if (kind === "wall-plate") {
          this.add(/treated timber|timber material|wall plate/, cube(3.15, 0.15, 0.18, [0, 1.25, -0.92], "#C09056", { map: texture("#C09056", "#613E21", 281) }), [0, 0.25, 0], { hideOnExplode: true });
          for (const x of [-1.2, -0.4, 0.4, 1.2]) this.add(/wall plate|fixing|timber/, cylinder(0.025, 0.18, [x, 1.34, -0.92], "#7C858C", { metalness: 0.62 }), [0, 0.15, 0], { appearOnExplode: true });
        } else if (kind === "rafter") {
          this.add(/treated timber|timber material|rafter/, timberMember([0.4, 1.34, -0.9], [0.4, 2.34, 0.05], 0.075, 0.13, "#C08B4D", 282), [0.18, 0.28, 0], { hideOnExplode: true });
        } else if (kind === "roof-strut") {
          this.add(/treated timber|timber material|strut|tie/, timberMember([-0.3, 1.35, 0.02], [0.75, 2.28, 0.06], 0.075, 0.13, "#C08B4D", 283), [0.18, 0.3, 0], { hideOnExplode: true });
        } else if (kind === "purlin") {
          this.add(/treated timber|timber material|purlin/, cube(3.15, 0.15, 0.18, [0, 1.85, 0.12], "#C08B4D", { map: texture("#C08B4D", "#613E21", 282) }), [0, 0.3, 0], { hideOnExplode: true });
        } else {
          this.add(/treated timber|timber material|noggin/, cube(0.72, 0.15, 0.15, [0.4, 1.8, 0.52], "#C08B4D", { map: texture("#C08B4D", "#613E21", 283) }), [0.1, 0.25, 0], { hideOnExplode: true });
        }
        this.addLabourPeople("drill");
        break;
      }
      case "fibre-ceiling": {
        this.floor("#B8A58D");
        const roof = new THREE.Group();
        roof.add(rod([-1.5, 2.3, -0.7], [-1.5, 2.5, 0.9], 0.06, "#A77A4B"));
        roof.add(rod([-0.5, 2.3, -0.7], [-0.5, 2.5, 0.9], 0.06, "#A77A4B"));
        roof.add(rod([0.5, 2.3, -0.7], [0.5, 2.5, 0.9], 0.06, "#A77A4B"));
        roof.add(rod([1.5, 2.3, -0.7], [1.5, 2.5, 0.9], 0.06, "#A77A4B"));
        this.context.push(roof);
        this.add(/external ceiling board|fibre|ceiling/, cube(3.25, 0.045, 1.75, [0, 2.22, 0.1], "#C6C6C0", { roughness: 0.85 }), [0, 0.4, 0], { hideOnExplode: true });
        for (let x = -1.35; x <= 1.36; x += 0.45) this.add(/fixings|screws|ceiling/, cylinder(0.014, 0.025, [x, 2.25, 0.1], "#737E86", { metalness: 0.6 }), [0, 0.18, 0], { appearOnExplode: true }, "consumable");
        this.addLabourPeople("drill");
        break;
      }
      default:
        throw new Error("No item-specific 3D scene handler for rate slug: " + this.item.slug);
    }

    const labourTool = /earth|trench|fill|sand/.test(kind) ? "shovel"
      : /concrete|screed|plaster|blinding|pop/.test(kind) ? "float"
        : /paint/.test(kind) ? "roller"
          : /til|marble|oak|wood|stone|adhesive/.test(kind) ? "tile"
            : /plumb|basin|wc|shower|drain|mirror/.test(kind) ? "wrench" : "drill";
    this.addLabourPeople(labourTool);
    this.addResiduals();

    const target = kind.startsWith("ceiling") || kind.startsWith("pop") || kind === "roof-cover" || kind === "fibre-ceiling"
      ? new THREE.Vector3(0, 1.65, -0.1)
      : kind === "mechanical-trench" || kind === "manual-trench" || kind === "backfill"
        ? new THREE.Vector3(0, 0.45, 0)
        : new THREE.Vector3(0, 0.95, 0);
    const distance = kind === "ceiling-curved" || kind === "ceiling-recess" ? 7.8 : 7.2;
    return {
      parts: this.parts,
      context: this.context,
      colors: this.colors,
      process: this.preset.process,
      endResult: this.preset.result,
      overview: { target: new THREE.Vector3(0, 1.0, 0), position: new THREE.Vector3(distance, 4.2, distance * 1.05) },
      focus: { target, position: new THREE.Vector3(target.x + 3.3, target.y + 1.9, target.z + 4.4) },
    };
  }
}

function colour(line: RateCostLine) {
  const text = (line.id + " " + line.label).toLowerCase();
  if (/cement|concrete|mortar|grout|screed|plaster|pop/.test(text)) return "#B6B4AE";
  if (/sand|laterite|hardcore|soil|granite|aggregate|stone/.test(text)) return "#C4A477";
  if (/rebar|reinforc|steel|rod|mesh|nail|bolt|screw|metal|profile|channel/.test(text)) return "#75838D";
  if (/plywood|timber|wood|carpentry|waler|rafter|plank|board/.test(text)) return "#B9824C";
  if (/cable|wire|electri|conduit|switch|socket/.test(text)) return "#E39B2D";
  if (/pipe|plumb|drain|water|sanitary|pvc/.test(text)) return "#3D8AB8";
  if (/tile|ceramic|marble|porcelain|paver|kerb/.test(text)) return "#D4D3CD";
  if (line.category === "labour") return "#E77C24";
  if (line.category === "plant") return "#D9A42F";
  if (line.category === "logistics") return "#536D83";
  return "#9BA6AD";
}

export const RATE_3D_ITEM_SLUGS = Object.keys(PRESETS);

export function buildAccurateRateScene(item: RateBankItem): RateScene {
  const preset = PRESETS[item.slug];
  if (!preset) throw new Error("Rate Bank 3D preset missing for " + item.slug);
  return new SceneBuilder(item, preset).build();
}
