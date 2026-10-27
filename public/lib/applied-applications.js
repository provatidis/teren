import { usd, fmt, formatTokenQuantity } from './format.js';
import { periodDuration } from './period-presentation.js';

export function appliedPriceExposure(question) {
  const { view } = question;
  const lpETHRaw = view.principal.amount1 + view.earned1;
  if (view.state !== 'above' || !(view.price > view.range.upperPrice)
      || view.principal.amount1 !== 0n || !(view.holding.amount1 > lpETHRaw)) {
    throw new Error('The price-rise question requires an above-range position with less ETH than holding.');
  }
  return {
    principalETH: Number(view.principal.amount1) / 1e18,
    feeETH: Number(view.earned1) / 1e18,
    lpETH: Number(lpETHRaw) / 1e18,
    holdingETH: Number(view.holding.amount1) / 1e18,
    principalUSDC: Number(view.principal.amount0) / 1e6,
    feeUSDC: Number(view.earned0) / 1e6,
    lpUSDC: Number(view.principal.amount0 + view.earned0) / 1e6,
    holdingUSDC: Number(view.holding.amount0) / 1e6,
    ethDifference: Number(lpETHRaw - view.holding.amount1) / 1e18,
  };
}

export function appliedApplication(id, question) {
  if (id === 'fees-over-time') {
    const view = question.view;
    const amount = (usdc, eth) => formatTokenQuantity(Number(usdc) / 1e6, 4) + ' USDC + '
      + formatTokenQuantity(Number(eth) / 1e18, 6) + ' WETH';
    return {
      expected: 'same', label: 'Collecting without reinvesting',
      reasonEvidence: {
        title: 'New earnings and the collectable balance',
        rows: [
          ['New fees during this record', amount(view.earned0, view.earned1)],
          ['All tokens available to collect at the end', amount(view.point.snapshot.fees.collectable0Raw, view.point.snapshot.fees.collectable1Raw)],
        ],
        note: 'Recorded period: ' + periodDuration(view.durationSeconds) + '. The full balance includes tokens that were already collectable at the start.',
      },
      context: 'The owner collects only the new fee tokens into their wallet. They leave the liquidity and range untouched. Prices stay the same; ignore gas.',
      question: 'Which tokens continue providing liquidity after collection?',
      choices: [
        ['same', 'The same principal as before collection.'],
        ['less', 'The principal, reduced by the collected fees.'],
        ['more', 'The principal plus the collected fee tokens.'],
      ],
      hint: 'Follow where the collected tokens went: the wallet or the position.',
      feedback: 'The principal stays in place. Collected fees now sit in the wallet; putting them to work would require adding liquidity.',
      feedbackByChoice: {
        less: 'Fees were separate from principal before collection. Moving those fees to the wallet does not take any principal away.',
        more: 'The collected tokens are in the wallet. They provide liquidity only if the owner deposits them in a separate action.',
      },
    };
  }
  if (id === 'between-samples') {
    const {placement}=question;
    return {
    expected: 'edge-placement', label: 'Width and placement',
    reasonEvidence: {
      title: 'Activity between the two observations',
      rows: [
        ['Earlier price', 'Above range · block ' + question.interval.start.number],
        ['Later price', 'Above range · block ' + question.interval.end.number],
        ['Recorded time inside the range', periodDuration(question.interval.secondsInRange)],
        ['Position bounds', 'Unchanged throughout'],
      ],
      note: 'The active-time counter covers the interval between these observations. It does not show the exact moments of each crossing.',
    },
    evidence: {
      title: 'Where this range started',
      priceRange: {
        ...placement.range, startPrice: placement.startPrice, showScaleEndpoints: false,
        markerDescription: 'The starting price marker is close to the upper bound, with most of the range below it.',
      },
    },
    context: 'The owner keeps these bounds fixed. Compare the room for ETH to rise and fall from the recorded starting price.',
    question: 'From this starting price, which direction reaches a boundary after the smaller move?',
    choices: [
      ['edge-placement','A rise.'],
      ['lower-bound','A fall.'],
      ['centered','Equal room in either direction.'],
    ],
    hint: 'Compare the starting price with each bound. Width and placement describe different parts of the setup.',
    feedback: 'A rise of just '+fmt(placement.upwardRoomPercent,2)+'% from the starting price reaches the upper bound. Most of the width is below it. A wide range can still be close to an exit; it depends where the price sits within the bounds.',
    feedbackByChoice: {
      centered: 'The range is not centered on its starting price. The lower bound is far away, while the upper bound is less than 1% above it.',
      'lower-bound': 'The starting price is far from the lower bound. It takes a much smaller rise to reach the nearby upper bound than a fall to reach the lower one.',
    },
  };
  }
  if (id !== 'period-vs-holding') throw new Error('Choose an applied exercise.');
  const exposure = appliedPriceExposure(question);
  return {expected: exposure.ethDifference < 0 ? 'smaller-lead' : exposure.ethDifference > 0 ? 'larger-lead' : 'same-lead', exposure,
    context: 'ETH rises from the final recorded price and stays above the range. The owner leaves the position unchanged, with no new fees or costs. USDC stays at $1.',
    question: 'What happens to the LP’s lead over holding?',
    choices: [['larger-lead','It grows.'],['smaller-lead','It shrinks.'],['same-lead','It stays the same.']],
    hint: 'Look at how much ETH each side owns, including the LP’s earned fee tokens.',
    feedback: 'Holding owns more ETH than the LP’s small ETH fee balance. Both gain value as ETH rises, but holding gains more, so the LP’s lead shrinks. A small rise need not erase the lead.'};
}
// A hypothetical cost applied to the final observation, not a change to the record.
export function appliedCostExample(question) {
  const costUSD = 1, lpUSD = question.view.lpUSD - costUSD, gapUSD = lpUSD - question.view.holdingUSD;
  return {costUSD, lpUSD, gapUSD,
    text: 'Worked example: add a hypothetical ' + usd(costUSD) + ' LP-only cost at the final checkpoint, with no added holding cost. LP: ' + usd(lpUSD) + '; holding: ' + usd(question.view.holdingUSD) + '. '
      + (gapUSD < 0 ? 'That cost exceeds the small before-cost advantage, leaving holding ahead.' : gapUSD > 0 ? 'The LP remains ahead after that cost.' : 'The cost exactly closes the difference.')
      + ' The historical record is unchanged.'};
}
export function checkAppliedUnderstanding(question, application, reason, answer) {
  const reasoning = reason === question.reason, applied = answer === application.expected;
  return {reasoning, application: applied, passed: reasoning && applied};
}
