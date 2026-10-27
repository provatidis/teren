import { calculateRange } from './cl-range-v1.js';

export const MANAGEMENT_IDS = Object.freeze(['range-width', 'fee-tiers', 'range-management']);
export const MANAGEMENT_VARIANTS = 3;
export function managementCase(id, variant = 0) {
  if (!MANAGEMENT_IDS.includes(id) || !Number.isInteger(variant) || variant < 0 || variant >= MANAGEMENT_VARIANTS) throw new Error('Choose a supported range lesson and variation.');
  const initialPrice = 2000;
  const investment = 5000;
  const position = (width, price) => calculateRange({
    investment, initialPrice, futurePrice: price,
    lowerPrice: initialPrice * (1 - width),
    upperPrice: initialPrice * (1 + width),
    fees: 0, fullRangeFees: 0,
  });
  if (id === 'range-width') {
    const price = [2300,1700,2000][variant], narrow = position(.05,price), wide = position(.25,price);
    const active = narrow.state === 'inside' && wide.state === 'inside' ? 'both' : wide.state === 'inside' ? 'wide' : 'none';
    const application = ['mix', 'wide-mix', 'own-basket'][variant];
    const next = variant === 1 ? {price:1800, narrow:position(.05,1800), wide:position(.25,1800)} : null;
    return {id, variant, price, narrow, wide, next, prediction:active, reason:'bounds', application};
  }
  if (id === 'fee-tiers') {
    // Supplied teaching facts, not an earnings estimate or observations from a real pool.
    const rates = [.05, .3];
    const volumes = [24000000, 2000000];
    const activeShare = .001;
    const poolFees = volumes.map((volume, index) => volume * rates[index] / 100);
    const fees = poolFees.map(total => total * activeShare);
    const competition = {
      deposit: investment,
      yesterday: {share: activeShare, income: fees[0], apr: fees[0] / investment * 365 * 100},
      today: {share: activeShare / 2, income: fees[0] / 2},
    };
    const reinvestment = {
      ownBefore: 100, othersBefore: 900,
      ownAfter: 120, othersAfter: 1800,
    };
    reinvestment.shareBefore = reinvestment.ownBefore / (reinvestment.ownBefore + reinvestment.othersBefore);
    reinvestment.shareAfter = reinvestment.ownAfter / (reinvestment.ownAfter + reinvestment.othersAfter);
    const application = ['more-volume', 'smaller-share', 'competition-offset'][variant];
    return {
      id, variant, rates, volumes, activeShare, poolFees, fees, competition, reinvestment,
      prediction: 'unknown', reason: 'trades', application,
    };
  }
  const prices = [[1600,1400],[2400,2800],[1400,1600]][variant];
  const first=position(.1,prices[0]), second=position(.1,prices[1]), returned=position(.1,initialPrice);
  const difference=second.lpBeforeFees-first.lpBeforeFees;
  // A supplied path for comparing two actions, not a historical replay or an
  // optimization rule. Both alternatives start with the same existing position.
  const cost = 15;
  // Fund the moved position in whole cents. Any fraction left over stays in the
  // wallet, so rounding never spends money the existing position does not own.
  const available = first.lpBeforeFees - cost;
  const movedInvestment = Math.floor(available * 100) / 100;
  const cashRemainder = available - movedInvestment;
  const rebalance = variant === 2 ? {
    before: first,
    unchanged: returned,
    cost,
    cashRemainder,
    moved: calculateRange({investment:movedInvestment,initialPrice:prices[0],futurePrice:initialPrice,
      lowerPrice:1260,upperPrice:1540,fees:0,fullRangeFees:0}),
  } : null;
  return {
    id, variant, prices, first, second, returned, rebalance,
    prediction: Math.abs(difference) < 1e-8 ? 'same' : difference < 0 ? 'falls' : 'rises',
    reason: 'asset', application: ['automatic','removed','sold-earlier'][variant],
  };
}
export function checkManagementUnderstanding(id, variant, reason, answer) {
  const result=managementCase(id,variant);
  const reasoning=reason===result.reason, application=answer===result.application;
  return {reasoning,application,passed:reasoning&&application};
}
