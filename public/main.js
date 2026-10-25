import { initLearnReturn } from './ui/learn-return.js';
import { initPositionPeriod } from './ui/position-period.js';
import { initMatchedComparison } from './ui/matched-comparison.js';
import { initRangeFeeFlow } from './ui/range-fee-flow.js';
import { initWidthComparison } from './ui/width-comparison.js';
import { initWorkspaces } from './ui/workspaces.js';
import { initPositionFees } from './ui/position-fees.js';
import { initExamples } from './ui/examples.js';
import { initPageAccess } from './ui/page-access.js';
import { initPositionSnapshots } from './ui/positions.js';
import { initSnapshotNavigation } from './ui/snapshot-navigation.js';
import { initSandbox } from './ui/sandbox.js';
import { initLabNavigation } from './ui/lab-navigation.js';
import { initFullRangeLab } from './ui/full-range.js';
import { initRangeLab } from './ui/range.js';
import { initPoolSnapshots } from './ui/pools.js';
import { initSavedExperiments } from './ui/saved-experiments.js';

// Compose controllers explicitly. Data adapters and calculation models never initialize UI.
const pageAccess = initPageAccess();
const workspaces = initWorkspaces();
const navigation = initLabNavigation({ activate: () => { workspaces.select('experiment'); pageAccess.refreshOffsets(); } });
const snapshots = initSnapshotNavigation({ activate: () => workspaces.select('inspect') });
initSandbox();
const fullRangeLab = initFullRangeLab({ navigation });
const rangeLab = initRangeLab({ navigation });
initLearnReturn({ fullRangeLab, rangeLab, navigation });
initPoolSnapshots({ fullRangeLab, rangeLab });
const positionFees = initPositionFees();
const positionSnapshots = initPositionSnapshots({ rangeLab, positionFees });
snapshots.restoreLocation();
navigation.restoreLocation();
initExamples({
  positionSnapshots, snapshotNavigation: snapshots,
  restoreScenario: () => { fullRangeLab.restoreLocation(); rangeLab.restoreLocation(); navigation.restoreLocation(); },
});
initSavedExperiments({ labs: { 'cp50-v1': fullRangeLab, 'cl-range-v1': rangeLab } });
initPositionPeriod({ rangeLab });
initMatchedComparison({ rangeLab });
let widthComparison;
const feeFlow = initRangeFeeFlow({ rangeLab, onChange: () => widthComparison.saveFees() });
widthComparison = initWidthComparison({ rangeLab, feeFlow });

workspaces.restoreLocation();
