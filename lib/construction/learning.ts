export type TrackId = "building" | "structures" | "steel" | "plumbing" | "electrical";
export type ModelId = "bungalow" | "concrete-frame" | "truss-bridge" | "steel-frame" | "plumbing" | "electrical";
export type Lesson = { title: string; short: string; see: string; why: string; check: string };
export type TeachingPart = { id: string; title: string; detail: string; step: number };
export type LearningModel = { id: ModelId; track: TrackId; title: string; subtitle: string; defaultStep: number; explodable: boolean; pathsLabel?: string; note: string; lessons: Lesson[]; parts: TeachingPart[]; legend: { color: string; label: string }[]; references: string[] };
const lesson = (title: string, short: string, see: string, why: string, check: string): Lesson => ({ title, short, see, why, check });
const part = (id: string, title: string, step: number, detail: string): TeachingPart => ({ id, title, step, detail });

export const LEARNING_TRACKS: { id: TrackId; title: string; description: string; color: string }[] = [
  { id: "building", title: "Building journey", description: "Ground to handover", color: "#dfbd78" },
  { id: "structures", title: "Complex structures", description: "Frames, bridges & load paths", color: "#92b5bd" },
  { id: "steel", title: "Steelwork", description: "Frames, bracing & connections", color: "#b8c4cc" },
  { id: "plumbing", title: "Plumbing", description: "Water, waste & ventilation", color: "#70bad6" },
  { id: "electrical", title: "Electrical", description: "Circuits, distribution & protection", color: "#deb373" },
];

export const LEARNING_REFERENCES: Record<string, { title: string; source: string; url: string }> = {
  loadpath: { title: "Continuous load paths", source: "US Department of Energy / PNNL", url: "https://basc.pnnl.gov/resource-guides/continuous-load-path-provided-connections-roof-through-wall-foundation" },
  steel: { title: "Steel members, connections and base plates", source: "American Institute of Steel Construction", url: "https://www.aisc.org/aisc/publications/steel-construction-manual/" },
  bracing: { title: "Erection and permanent bracing", source: "American Institute of Steel Construction", url: "https://www.aisc.org/aisc/publications/design-guides/design-guides-for-download/" },
  vents: { title: "Drainage ventilation and trap seals", source: "International Code Council", url: "https://codes.iccsafe.org/content/IPC2024V2.0/chapter-9-vents" },
  protection: { title: "Residential protection and earthing", source: "Schneider Electric — Electrical Installation Guide", url: "https://www.electrical-installation.org/enwiki/Residential_electrical_installation_-_Protection_of_people" },
  isolation: { title: "Isolation, inspection and testing", source: "Institution of Engineering and Technology", url: "https://electrical.theiet.org/wiring-matters/years/2025/107-september-2025/safe-isolation-stories-that-could-save-lives-are-you-sure-you-are-safe/" },
};

export const LEARNING_MODELS: LearningModel[] = [
  {
    id: "bungalow", track: "building", title: "The bungalow journey", subtitle: "A 120 m² home, explained in 14 stages", defaultStep: 5, explodable: true,
    note: "The house and quantities are illustrative. Ground conditions, drawings, approvals and engineered details determine the actual project.", references: ["loadpath"],
    legend: [{ color: "#b4946d", label: "Ground" }, { color: "#b6b7ad", label: "Concrete & masonry" }, { color: "#b88c56", label: "Timber" }, { color: "#45616a", label: "Roof & metalwork" }],
    lessons: [
      lesson("Planning & approvals", "Plan", "An empty site before work starts.", "The brief, ground information, coordinated drawings and budget establish what will be built.", "Confirm boundaries, access, surveys, responsibilities and required approvals."),
      lesson("Clearing & setting out", "Set out", "Profiles and strings establish the building lines.", "Setting out turns the drawing into positions and levels on the ground.", "Check setbacks, diagonals and the permanent level benchmark."),
      lesson("Foundation excavation", "Excavate", "Trenches expose the formation beneath the walls.", "The foundation must bear on suitable ground, rather than on loose or unsuitable material.", "Inspect the formation and obtain the engineer’s confirmation before covering it."),
      lesson("Footings & foundation walls", "Foundations", "Strip footings support the foundation masonry.", "The substructure transfers building loads into the ground and raises the walls to floor level.", "Inspect reinforcement, cover, concrete and the specified foundation wall/DPC details."),
      lesson("Ground floor build-up", "Floor layers", "Fill, hardcore, blinding, a membrane and the ground floor slab.", "Each layer serves a different purpose: support, levelling, moisture control or the floor itself.", "Check compaction, buried services, membrane continuity and slab specification."),
      lesson("Walls, lintels & ring beam", "Walls", "Walls rise around openings, with lintels and a ring beam above.", "Openings interrupt walling; their loads and roof support need coordinated structural details.", "Check bonding, plumb, openings, reinforcement and bearing details."),
      lesson("Roof structure", "Roof frame", "The timber framing establishes the roof shape.", "Members and connections work together to support the covering and resist the design actions.", "Check treatment, member connections, bracing and anchorage to the building."),
      lesson("Roof covering & drainage", "Roof cover", "Roof sheets, ridge details and rainwater outlets.", "A complete weathering system manages water at laps, edges and penetrations.", "Inspect flashings, fixings, gutter falls and the discharge route."),
      lesson("First-fix services", "First fix", "Concealed plumbing and electrical routes inside the building.", "Coordination before plastering avoids destructive changes to finished surfaces.", "Test and record concealed work before closing it up."),
      lesson("Plastering & screed", "Plaster", "Prepared wall faces and a level floor finish base.", "Substrate preparation affects the appearance and performance of the final finishes.", "Check levels, wet-area preparation, curing and surface readiness."),
      lesson("Ceilings, tiles & decoration", "Finishes", "Finishing layers replace the exposed construction surfaces.", "The sequence protects finished work and keeps maintenance points accessible.", "Review samples, tile layout, falls, joints and ceiling access."),
      lesson("Doors, windows & fittings", "Fit out", "Windows, doors, kitchen fittings and sanitary fixtures.", "Final fittings complete how the building is used; supply and installation are distinct scopes.", "Check seals, operation, connections and completed service tests."),
      lesson("External works", "Outside", "Paving, drainage and planting around the building.", "External levels and drainage influence access and how water moves around the structure.", "Check falls, outlets and agreed utility connections."),
      lesson("Testing & handover", "Handover", "The completed house, ready for a final inspection.", "Completion includes defect closure, records, operating information and the final account.", "Close the snag list and hand over test records, warranties and keys."),
    ],
    parts: [part("house-foundations", "Foundation system", 3, "The below-ground support of this sample bungalow."), part("house-floor", "Floor build-up", 4, "Several separate layers sit beneath the finished floor."), part("house-walls", "Walls & openings", 5, "External walls, partitions, lintels and the ring beam."), part("house-roof", "Roof framing", 6, "Framing and connections beneath the roof covering."), part("house-services", "Concealed services", 8, "Use the separate plumbing and electrical models to explore these systems."), part("house-complete", "Completed building", 13, "Explore the exterior or remove the roof to inspect the inside.")],
  },
  {
    id: "concrete-frame", track: "structures", title: "Multi-storey concrete frame", subtitle: "Four storeys, a structural core and an open stairwell", defaultStep: 4, explodable: true, pathsLabel: "Show load paths",
    note: "Floor cycles are grouped for teaching. Temporary works, foundation choice, member sizes and reinforcement require an engineered design; the paths are conceptual, not a force analysis.", references: ["loadpath"],
    legend: [{ color: "#aeb6b0", label: "Columns & beams" }, { color: "#d9c9a9", label: "Slabs" }, { color: "#7d9b9c", label: "Structural core" }, { color: "#e0ae4c", label: "Conceptual load path" }],
    lessons: [
      lesson("Foundations & ground beams", "Foundations", "Pad supports and connecting ground beams beneath the column grid.", "The support system carries the frame and core into the ground.", "Confirm foundation type and positions from the ground investigation and structural design."),
      lesson("Ground-storey columns & core", "Starters", "The first column lifts and the start of the core.", "A coordinated grid leaves space for the intended rooms, openings and vertical circulation.", "Inspect reinforcement continuity, cover and starter locations."),
      lesson("First-floor beams & slab", "First floor", "Beams support slab panels around an opening; temporary props sit below.", "The slab transfers loads to supporting members while its openings must remain coordinated.", "Use an approved formwork, propping, casting and striking sequence."),
      lesson("Repeat the structural cycle", "Upper floors", "Upper columns, beams and slabs extend the frame storey by storey.", "A regular structural arrangement makes the support relationships visible across several levels.", "Maintain geometry, concrete quality and temporary stability through each floor cycle."),
      lesson("Stairs, core & openings", "Core & stairs", "A stair rises through the reserved opening inside the core.", "Vertical circulation and the structural system must fit together without cutting through members.", "Coordinate stair landings, openings, headroom and the core design."),
      lesson("Envelope & edge details", "Envelope", "A light facade surrounds the completed frame.", "The enclosure attaches to the structure and must accommodate the designed movements.", "Check facade interfaces, edge protection and the approved connection details."),
      lesson("Follow the load path", "Load path", "Highlighted routes run from floors into beams, columns and the foundation.", "A continuous sequence of members and connections is needed to reach the ground.", "Trace each conceptual path; do not read the animation as a capacity or stability check."),
    ],
    parts: [part("rc-footings", "Footings & ground beams", 0, "The supports beneath the column grid; foundation sizes are schematic."), part("rc-columns", "Column lifts", 1, "Vertical members that receive loads from the floor framing."), part("rc-first", "First-floor framing", 2, "Beams and slab panels leave an opening for the stair."), part("rc-upper", "Upper-storey framing", 3, "Repeated floor cycles extend the supporting frame."), part("rc-core", "Structural core", 1, "A continuous core participates in the designed lateral stability system."), part("rc-stairs", "Stair flights & landings", 4, "Flights connect the storeys through a reserved opening."), part("rc-envelope", "Facade panels", 5, "Enclosure panels sit outside the structural frame.")],
  },
  {
    id: "truss-bridge", track: "structures", title: "Long-span truss bridge", subtitle: "Deck, triangulated trusses, bearings and abutments", defaultStep: 4, explodable: true, pathsLabel: "Show load paths",
    note: "This is a schematic structural-system model. Member actions, buckling, connection design, bearings and the erection method are not calculated.", references: ["steel", "bracing"],
    legend: [{ color: "#678c94", label: "Trusses" }, { color: "#d2c8ae", label: "Deck" }, { color: "#d7aa62", label: "Bearings" }, { color: "#aab3ac", label: "Abutments" }],
    lessons: [
      lesson("Abutments & supports", "Supports", "Two support zones define the ends of the crossing.", "The bridge needs a clear route for forces to reach its foundations.", "The support and ground design must suit the crossing and site conditions."),
      lesson("Bearing zones", "Bearings", "Bearings sit between the superstructure and the supporting concrete.", "The bearing arrangement transfers actions while accommodating the designed movements.", "Check the specified bearing positions, restraints and installation details."),
      lesson("Main triangulated trusses", "Trusses", "Two side trusses are made from chords and diagonal members.", "Triangulation is a structural form; the actual member forces depend on the loading and restraint.", "A separate engineered lifting and temporary-stability sequence is required."),
      lesson("Cross beams & lateral ties", "Cross ties", "Cross members and plan bracing link the side trusses.", "The two sides must work as a coordinated spatial system.", "Review lateral restraint, cross-member connections and the erection bracing plan."),
      lesson("Deck & edge protection", "Deck", "The deck sits on the supporting cross members with rails along its edges.", "Deck loads enter the supporting framing before reaching the main supports.", "Coordinate surfacing, drainage, joints and edge protection."),
      lesson("Explore the support path", "Load path", "A conceptual route links deck framing, truss nodes, bearings and supports.", "Connections and support conditions are part of the structural system.", "Use the model to explain the arrangement, not to infer member capacity."),
    ],
    parts: [part("bridge-supports", "Abutments", 0, "Concrete support zones at the ends of the span."), part("bridge-bearings", "Bearing pads", 1, "Interfaces between the steel superstructure and concrete supports."), part("bridge-trusses", "Chords & diagonals", 2, "The triangulated side frames of the crossing."), part("bridge-cross", "Cross members & plan bracing", 3, "Members linking and restraining the two side trusses."), part("bridge-deck", "Deck panels", 4, "A load-carrying surface supported by the cross framing."), part("bridge-rails", "Edge rails", 4, "The schematic edge-protection arrangement.")],
  },
  {
    id: "steel-frame", track: "steel", title: "Steel portal-frame building", subtitle: "I-sections, bolted bases, roof members and bracing", defaultStep: 3, explodable: true, pathsLabel: "Show load paths",
    note: "Sections and connection geometry are illustrative. Bolt sizes, welds, anchors, bracing and erection stability require project-specific design and inspection.", references: ["steel", "bracing"],
    legend: [{ color: "#678795", label: "Primary frame" }, { color: "#d8b469", label: "Plates & anchors" }, { color: "#b28065", label: "Bracing" }, { color: "#9eacac", label: "Secondary steel" }],
    lessons: [
      lesson("Concrete supports", "Supports", "Concrete foundations provide the starting points for the steel frame.", "Steel reactions must be carried through the bases into the foundation system.", "Confirm setting out, levels and the approved foundation details."),
      lesson("Base plates & anchors", "Bases", "Plates, grout zones and anchor rods form the column bases.", "The base assembly is an important connection rather than simply a column touching concrete.", "Check anchor setting, plate bearing, grout and the specified tightening procedure."),
      lesson("Erect the portal frames", "Portals", "Columns and rafters create the main repeated frames.", "Temporary stability must be maintained while the permanent system is assembled.", "Use the approved erection and temporary-bracing plan."),
      lesson("Bracing & connection zones", "Connections", "Permanent bracing links frames; bolted plate zones mark the joints.", "Member connections and restraint determine how the overall system behaves.", "Inspect bolts, welds, fit-up and the completed stability system."),
      lesson("Purlins & side rails", "Secondary steel", "Smaller members support the roof and wall cladding.", "Secondary members provide support and restraint according to their designed connections.", "Check orientation, spacing, restraint and fixing details."),
      lesson("Cladding & rainwater", "Cladding", "Roof and wall sheets enclose the frame.", "The enclosure and drainage details form a weathering system around the structure.", "Review laps, flashings, openings and water discharge."),
      lesson("Inspection & handover", "Handover", "The complete steel building can be explored with its covering removed.", "Fabrication records, inspections, protection and maintenance information complete the work.", "Close connection, coating and cladding defects before handover."),
    ],
    parts: [part("steel-supports", "Concrete supports", 0, "The foundation and pedestal zones beneath each steel column."), part("steel-bases", "Base plates, grout & anchors", 1, "Select and zoom in to inspect an illustrative four-anchor base."), part("steel-portals", "I-section portal frames", 2, "Primary columns and rafters with visible web and flange geometry."), part("steel-bracing", "Permanent bracing", 3, "Diagonal members connecting the frames into a stability system."), part("steel-connections", "Bolted connection zones", 3, "Schematic plates and bolts at the knees and ridge."), part("steel-secondary", "Purlins & rails", 4, "Secondary steel beneath the cladding."), part("steel-cladding", "Roof & wall sheets", 5, "Use section view to remove the enclosure and inspect the frame.")],
  },
  {
    id: "plumbing", track: "plumbing", title: "Water, waste & ventilation", subtitle: "A two-level service model with selectable pipe systems", defaultStep: 3, explodable: false, pathsLabel: "Animate water routes",
    note: "Routes and fittings are schematic. Pipe sizes, falls, pressure, water-heating safety and local approval requirements are not specified by this model.", references: ["vents"],
    legend: [{ color: "#3e9fd0", label: "Cold water" }, { color: "#cc6653", label: "Hot water" }, { color: "#a07c59", label: "Soil & waste" }, { color: "#77a77b", label: "Ventilation" }],
    lessons: [
      lesson("Water source & control", "Source", "A storage/source zone and a pump/control point feed the building.", "The supply arrangement must match the available source and the required service conditions.", "Confirm water quality, backflow protection, controls and the designed supply arrangement."),
      lesson("Cold-water distribution", "Cold water", "Blue routes rise and branch to fixtures on both levels.", "Distribution delivers water while isolation points allow sections to be maintained.", "Coordinate accessible valves, supports, penetrations and the pressure test."),
      lesson("Hot-water branches", "Hot water", "Red routes leave the local water-heater zones for hot-water outlets.", "Hot and cold distribution have different requirements; the WC receives cold water only.", "Check the heater safety system, temperature control and manufacturer’s installation requirements."),
      lesson("Soil, waste & vent stack", "Drain & vent", "Waste routes connect to a discharge stack, with a vent continuing upwards.", "Drainage removes discharge, while ventilation helps protect fixture trap seals.", "Coordinate drainage falls, vent termination, supports and access for cleaning."),
      lesson("Traps & inspection access", "Traps & access", "A basin trap and an inspection chamber are exposed.", "A water seal separates the room from drainage gases, while access permits maintenance.", "Check trap seals, approved venting and accessible cleaning points."),
      lesson("Testing & service records", "Test & handover", "The complete network can be traced with the building shell hidden.", "Concealed work needs test records and a usable maintenance arrangement.", "Complete the specified pressure, drainage and operating tests before closure and handover."),
    ],
    parts: [part("plumb-source", "Source, tank & pump", 0, "A schematic incoming-water and control arrangement."), part("plumb-cold", "Cold-water network", 1, "The blue supply rises to cold-water outlets on both levels."), part("plumb-heaters", "Heater zones", 2, "Local heaters shown to explain where the hot-water branches begin."), part("plumb-hot", "Hot-water branches", 2, "Red branches serve hot-water outlets, not the WC cistern."), part("plumb-waste", "Soil & waste stack", 3, "Wastewater leaves fixtures and reaches the external discharge route."), part("plumb-vent", "Vent continuation", 3, "The upper air path helps protect the drainage trap seals."), part("plumb-traps", "Trap & inspection chamber", 4, "A simplified U-shaped water seal and external maintenance access.")],
  },
  {
    id: "electrical", track: "electrical", title: "Electrical distribution & circuits", subtitle: "Trace a conceptual installation from supply to final circuits", defaultStep: 3, explodable: false, pathsLabel: "Highlight circuit routes",
    note: "Colours identify circuit groups, not individual cable cores. Lines represent grouped routes, not a wiring or connection diagram. Real installation and testing require competent personnel.", references: ["protection", "isolation"],
    legend: [{ color: "#dfad49", label: "Lighting circuits" }, { color: "#55a9c0", label: "Socket circuits" }, { color: "#a48ac4", label: "Dedicated loads" }, { color: "#78a36c", label: "Protective earth" }],
    lessons: [
      lesson("Supply entry & metering", "Supply", "A service-entry route reaches the meter and main isolation point.", "The incoming arrangement establishes the boundary between the supply and the installation.", "Confirm the supply characteristics and the approved service-entry arrangement."),
      lesson("Distribution & protection", "Distribution", "The board contains separate protective-device ways and an earth bar.", "Protection, isolation and earthing have different functions and must be coordinated.", "Device selection and earthing arrangements must follow the actual system design."),
      lesson("Lighting circuits", "Lighting", "Amber routes connect lighting points on the two levels.", "Separating the installation into appropriate final circuits supports control and maintenance.", "Coordinate lighting, switching routes, protective devices and inspection access."),
      lesson("Socket circuits", "Sockets", "Cyan routes connect the general socket-outlet groups.", "The circuit arrangement must suit its load, installation method and protection.", "Confirm cable selection and the required shock/fault protection through design and testing."),
      lesson("Dedicated equipment", "Dedicated loads", "Purple routes identify equipment such as an AC unit and water heater.", "Equipment requirements may call for dedicated circuits and local isolation.", "Use the equipment requirements and electrical design to determine the final arrangement."),
      lesson("Inspection, testing & handover", "Test & handover", "The supply, board, earth and final circuits can be explored together.", "A complete-looking installation still needs competent verification before use.", "Safe isolation, inspection, testing, labels and records are part of completion."),
    ],
    parts: [part("elec-supply", "Service entry & meter", 0, "The schematic supply boundary and metering zone."), part("elec-board", "Distribution board", 1, "Separate ways represent the protected final-circuit groups."), part("elec-earth", "Protective earth route", 1, "A schematic protective-conductor and earthing arrangement; no sizing or electrode design is implied."), part("elec-lights", "Lighting group", 2, "Amber routes and ceiling light points."), part("elec-sockets", "Socket group", 3, "Cyan routes and general socket-outlet positions."), part("elec-dedicated", "Dedicated equipment group", 4, "Purple routes to the schematic AC and water-heater loads.")],
  },
];

export const getLearningModel = (id: string | null | undefined) => LEARNING_MODELS.find((model) => model.id === id) ?? LEARNING_MODELS[0];
export const LESSON_COUNT = LEARNING_MODELS.reduce((count, model) => count + model.lessons.length, 0);
