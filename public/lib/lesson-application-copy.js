import { lessonApplication } from '../models/lesson-application.js';
import { checkLiquidityChallenge } from '../models/liquidity-challenge.js';
import { usd, fmt } from './format.js';
import { deeperPoolQuestion, untradedMarketQuestion } from './lesson-narration.js';

// One question follows each figure. It takes the lesson's idea to a case the
// figure does not show, in the lesson's own numbers. Every wrong answer is a
// belief that is false in that case, never a true statement placed under the
// wrong verdict. Each question has a hint and feedback for every answer.
// task: the reader's own example in the challenge, when they have one.
export function lessonApplicationCopy(id, outcome, task) {
  const application = lessonApplication(id, outcome), s = outcome.setup;
  const base = {application, expected: application.expected};
  if (id === 'swap-impact') return {...base, ...deeperPoolQuestion(outcome)};
  // "Share" is the percentage; "claim" is the tokens behind it. The scene shows
  // a trade changing the tokens behind a fixed share. This is the other case:
  // the share changes and the tokens stay.
  if (id === 'pool-share' && application.kind === 'later-deposit') return {...base,
    context: 'Another provider adds both tokens in the pool’s current ratio. Nobody trades. Your share gets smaller.',
    question: 'What happens to the tokens you could withdraw right now?',
    choices: [['same-tokens', 'They stay the same.'], ['follow-share', 'They shrink with my share.'], ['follow-pool', 'They grow with the pool.']],
    hint: 'The new provider receives new LP tokens for the tokens they add.',
    feedbackByChoice: {
      'follow-share': 'Your smaller share applies to a larger pool. A proportional deposit adds tokens and LP tokens together, so the tokens behind your claim stay the same.',
      'follow-pool': 'The new provider’s tokens back their own claim, not yours. They receive LP tokens for what they add, so your share falls exactly as the pool grows.',
    },
    feedback: 'You own a smaller share of a larger pool. A proportional deposit adds tokens and ownership together, so the tokens you could withdraw are unchanged.'};
  if (id === 'pool-share') return {...base,
    context: 'Another provider withdraws their share of both tokens. Nobody trades. Your share gets larger.',
    question: 'What happens to the tokens you could withdraw right now?',
    choices: [['same-tokens', 'They stay the same.'], ['follow-share', 'They grow with my share.'], ['follow-pool', 'They shrink with the pool.']],
    hint: 'The leaving provider returns LP tokens and takes the tokens behind them.',
    feedbackByChoice: {
      'follow-share': 'Your larger share applies to a smaller pool. The leaving provider takes only the tokens behind their own claim, so yours stay the same.',
      'follow-pool': 'The leaving provider takes only the tokens behind their own claim. Their LP tokens are removed with them, so your share rises exactly as the pool shrinks.',
    },
    feedback: 'You own a larger share of a smaller pool. A withdrawal removes tokens and ownership together, so the tokens you could withdraw are unchanged.'};
  if (id === 'token-balances') return {...base, ...untradedMarketQuestion(outcome)};
  if (id === 'loss-vs-profit') {
    // Both numbers are true. Each wrong answer folds the two comparisons into one,
    // and which fold is false depends on whether the claim is up or down.
    const r = application.result, start = application.setup.investment, up = application.returnPercent > 0;
    const change = fmt(Math.abs(application.returnPercent), 2) + '%', behind = fmt(application.behindPercent, 2) + '%';
    const moved = usd(Math.abs(r.lpBeforeFees - start)), gap = usd(r.breakEvenFees);
    return {...base,
      context: 'Your dashboard says you are ' + (up ? 'up ' : 'down ') + change + ' on what you started with. Another view says you are ' + behind + ' behind holding.',
      question: 'Can both be right?',
      choices: [['both-right', 'Yes. One compares with what I started with, the other with holding.'],
        ['profit-only', up ? 'No. A claim that is up ' + change + ' cannot be behind.' : 'No. A claim that is down ' + change + ' is ' + change + ' behind holding.'],
        ['gap-only', up ? 'No. A claim that is behind holding has lost money.' : 'No. A claim that is ' + behind + ' behind holding has lost only ' + behind + '.']],
      hint: 'Ask what each number is measured against.',
      feedbackByChoice: {
        'profit-only': up
          ? 'Up and behind are measured against different things. Your claim rose from ' + usd(start) + ' to ' + usd(r.lpBeforeFees) + '. Holding the same tokens rose further, to ' + usd(r.holdValue) + '.'
          : 'Holding fell too: it is worth ' + usd(r.holdValue) + ', down from ' + usd(start) + '. Your claim, at ' + usd(r.lpBeforeFees) + ', is ' + gap + ' behind that, which is ' + behind + '.',
        'gap-only': up
          ? 'Being behind holding is not a loss of money. Your claim is worth ' + moved + ' more than you started with. Holding would be worth ' + gap + ' more still.'
          : 'The ' + behind + ' compares your claim with holding, and holding itself has fallen. Against the ' + usd(start) + ' you started with, your claim is down ' + moved + '.',
      },
      feedback: 'Against the ' + usd(start) + ' you started with, your claim is ' + (up ? 'up ' : 'down ') + moved + '. Against holding, worth ' + usd(r.holdValue) + ', it is ' + gap + ' behind. Say what you compare with: your start, or holding.'};
  }
  if (id === 'fee-break-even') return {...base,
    context: (application.gap >= .005 ? 'Enter more than ' + usd(application.gap) + ' in fees' : 'Enter any fees') + ' and the figure shows your claim ahead of holding.',
    question: 'What would you need before saying a real claim beat holding?',
    choices: [['record', 'A record of the fees it actually earned.'], ['figure', 'Nothing more. The figure already shows it ahead.'], ['fee-rate', 'The pool’s 0.3% fee. It fixes what a claim earns.']],
    hint: 'Ask where the fee amount in this figure came from.',
    feedbackByChoice: {
      figure: 'The figure is ahead because of the fee amount you entered. It cannot show what a real claim earned.',
      'fee-rate': 'The 0.3% fee is the rate each trade pays. What a claim earns also depends on how much trading the pool saw and on the claim’s share of the pool.',
    },
    feedback: 'The fees in this figure are an amount you chose. To say a real claim beat holding, you need the fees it actually earned over that time. Its costs count too, and this figure leaves them out.'};
  if (id === 'range-boundaries') {
    // The end state fixes the tokens. It says nothing about the trades on the way,
    // so the question asks what the end can tell you, not which path paid more.
    const pooled = outcome.result.pooled, at = usd(s.futurePrice);
    const ends = pooled.eth === 0 ? fmt(pooled.usdc, 2) + ' USDC' : pooled.usdc === 0 ? fmt(pooled.eth, 4) + ' ETH' : fmt(pooled.eth, 4) + ' ETH + ' + fmt(pooled.usdc, 2) + ' USDC';
    return {...base,
      context: (s.futurePrice === s.initialPrice ? 'ETH can stay at ' + at + ', or return to it after weeks of moving up and down inside your range.'
        : 'ETH can reach ' + at + ' in one move, or after weeks of moving up and down inside your range.') + ' Either way your claim ends as ' + ends + '.',
      question: 'Does ending with the same tokens tell you it earned the same fees?',
      choices: [['path', 'No. The end does not record the trades on the way.'], ['same-end', 'Yes. The same end means the same fees.'], ['range-only', 'Yes. Fees depend on the range, not on the path.']],
      hint: 'Fees are paid by trades. Ask how much trading each path sends through your range.',
      feedbackByChoice: {
        'same-end': 'The end fixes which tokens your claim holds. Its fees were paid by the trades on the way, and the two paths did not have the same trades.',
        'range-only': 'The range decides at which prices your claim can earn. How much it earns there depends on how much trading happens inside it.',
      },
      // It says what the end can and cannot show. Which path paid more is not
      // settled by time alone, so it makes no claim about that.
      feedback: 'Fees come from trades, and only trades inside your range pay your claim. The tokens you end with show what your claim holds, not the trades that paid it. To know what it earned, you need a record of its fees over that time.'};
  }
  // The reader's own example can sit anywhere when they answer: solved, not yet
  // matching, or at a price where holding has lost nothing. The feedback on the
  // wrong answer describes the bars they are looking at.
  const check = checkLiquidityChallenge(s, task), start = s.investment;
  const hold = check.valid ? check.result.holdValue : NaN, lost = usd(start - hold);
  const restored = !check.valid ? 'Matching holding closes the gap to holding. When holding itself is below your start, that dollar loss remains.'
    : hold >= start - .01 ? 'In your example holding is ' + (hold > start + .01 ? 'above' : 'at') + ' your start, so there is no loss on screen to cover. Choose a lower price. A claim that matches holding there is still worth less than you started with.'
      : check.matchesHolding ? 'In your example your claim and holding are both worth ' + usd(hold) + ', which is ' + lost + ' less than you started with. Fees closed the gap to holding. That loss remains.'
        : 'In your example holding is worth ' + usd(hold) + ', which is ' + lost + ' less than you started with. A claim that matches it is worth the same, so the gap to holding closes and that loss remains.';
  return {...base,
    // The reader's example is on screen above the question: no case to set up.
    context: '',
    question: 'When your claim matches holding below your start, what have its fees covered?',
    choices: [['relative-gap', 'The gap to holding. A dollar loss remains on both sides.'], ['capital-restored', 'The whole loss since the start, because the claim now matches holding.']],
    hint: 'When the two bars line up, where are they relative to the dashed starting line?',
    feedbackByChoice: {'capital-restored': restored},
    feedback: 'Matching holding closes the gap to holding. Holding itself can be below your start, so both can still lose dollars. The fees in this task are an amount you chose, not recorded earnings.'};
}
