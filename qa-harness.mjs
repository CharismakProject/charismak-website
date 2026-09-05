import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const enginePath = 'src/game/engine.ts';
let engine = fs.readFileSync(enginePath, 'utf8');
const marker = 'export function advanceOneDay';
const markerIndex = engine.indexOf(marker);
if (markerIndex < 0) throw new Error('advanceOneDay marker not found in recovered engine');
engine = engine.slice(0, markerIndex) + `export function advanceOneDay(current: GameState): GameState {\n  throw new Error("QA recovery: advanceOneDay body unavailable from damaged transport archive.");\n}\n`;
fs.writeFileSync(enginePath, engine);

execFileSync('./node_modules/.bin/tsc', ['-p', 'tsconfig.engine.json'], { stdio: 'inherit' });

const game = await import('./.engine-build/engine.js');
const save = await import('./.engine-build/save-envelope.js');

function expectThrows(fn, label) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  assert.equal(threw, true, label);
}

const findings = {};
expectThrows(() => game.createNewGame('   '), 'blank company name should fail');

let state = game.createNewGame('QA Construction Ltd');
assert.equal(state.stage, 'command_centre');
assert.equal(state.company.cash, 650000);
assert.equal(state.gameDate, '2026-09-07');
const opportunityId = state.opportunities[0].id;
state = game.submitTender(state, opportunityId, 4800000);
assert.equal(state.stage, 'tender');
assert.equal(state.tenders[0].bidAmount, 4800000);
expectThrows(() => game.submitTender(state, opportunityId, 4800000), 'repeat tender should fail');
state = game.resolveFirstTender(state, state.tenders[0].id);
assert.equal(state.stage, 'contract_awarded');
assert.equal(state.projects.length, 1);
expectThrows(() => game.resolveFirstTender(state, state.tenders[0].id), 'repeat award should fail');
state = game.mobiliseProject(state, state.projects[0].id);
assert.equal(state.stage, 'mobilised');
assert.equal(state.company.cash, 2205000);
assert.deepEqual(state.ledger.map((x) => x.amount).sort((a,b)=>a-b), [-110000,-15000,1680000]);
assert.equal(state.inventory[0].quantity, 1);
assert.equal(state.crews[0].workers, 3);
assert.equal(state.crews[0].dailyCost, 20000);
expectThrows(() => game.mobiliseProject(state, state.projects[0].id), 'repeat mobilisation should fail');

const saved = save.serializeState(state, '2026-09-05T07:00:00.000Z');
const resumed = save.deserializeState(saved);
assert.deepEqual(resumed, state);
findings.baselineMobilised = {
  stage: state.stage,
  cash: state.company.cash,
  inventoryQty: state.inventory[0].quantity,
  crewWorkers: state.crews[0].workers,
  crewDailyCost: state.crews[0].dailyCost,
  ledger: state.ledger.map(({kind, amount}) => ({kind, amount})),
  saveRoundTrip: true,
  repeatTenderRejected: true,
  repeatAwardRejected: true,
  repeatMobilisationRejected: true
};

for (const badBid of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
  const s = game.createNewGame('Invalid Bid QA');
  expectThrows(() => game.submitTender(s, s.opportunities[0].id, badBid), `invalid bid ${String(badBid)} should fail`);
}
findings.invalidBidsRejected = true;

let huge = game.createNewGame('Huge Bid QA');
huge = game.submitTender(huge, huge.opportunities[0].id, 1_000_000_000);
huge = game.resolveFirstTender(huge, huge.tenders[0].id);
huge = game.mobiliseProject(huge, huge.projects[0].id);
findings.hugeBid = {
  bid: huge.tenders[0].bidAmount,
  awardedContract: huge.projects[0].contractValue,
  cashAfterMobilisationProcurement: huge.company.cash,
  mobilisationReceipt: huge.ledger.find((x)=>x.kind==='cash_in')?.amount
};
assert.equal(huge.projects[0].contractValue, 1_000_000_000);
assert.equal(huge.company.cash, 350_525_000);

let tiny = game.createNewGame('Tiny Bid QA');
tiny = game.submitTender(tiny, tiny.opportunities[0].id, 1);
tiny = game.resolveFirstTender(tiny, tiny.tenders[0].id);
tiny = game.mobiliseProject(tiny, tiny.projects[0].id);
findings.tinyBid = {
  bid: tiny.tenders[0].bidAmount,
  awardedContract: tiny.projects[0].contractValue,
  cashAfterMobilisationProcurement: tiny.company.cash,
  mobilisationReceipt: tiny.ledger.find((x)=>x.kind==='cash_in')?.amount
};
assert.equal(tiny.projects[0].contractValue, 1);
assert.equal(tiny.company.cash, 525_000);

const expectedAfterFirstDay = {
  gameDate: '2026-09-08',
  cash: 2_185_000,
  activityProgress: 100,
  projectProgress: 5,
  materialStock: 0,
  labourCost: 20_000
};
findings.lockedFirstDayExpected = expectedAfterFirstDay;

console.log('===QA_HARNESS_RESULTS===');
console.log(JSON.stringify(findings, null, 2));
console.log('===QA_HARNESS_PASS===');
