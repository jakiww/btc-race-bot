// main.ts — HourMomentum: a 1-hour momentum bot for the make.fun
// btc-race-24h-20261118-1444 bounty (agent-fun/bars-replay/v1, Node 22).
//
// Idea, from my own read of the dev window: the 24-hour dev window falls
// 2.8% overall, so holding BTC loses and every baseline loses with it.
// What the window does have is medium-term drift: a few hours run up
// 0.4-0.7% an hour while the rest chop sideways or slide. A bot that
// waits for a strong 1-hour rise, rides it for up to 6 hours, and cuts
// out on an 0.8% pullback from the peak catches the up-drifts and sits
// in cash through the slides. Short-horizon signals drown in 1-minute
// noise (6.7 bps/min) against a ~26-36 bps round trip, and dip-buying
// loses in a falling window, so neither is used here.
//
// Rules, all in integer math on closes (deterministic, no clock, no
// randomness, no reads outside this repository):
//   enter (flat only): the close is more than 35 bps above the close
//     60 bars ago (a 1-hour return over +0.35%), full cash.
//   exit (holding): the close falls 80 bps below the highest close
//     since entry, or 360 bars have passed since entry.
//   cooldown: after any exit, 30 bars must pass before the next entry,
//     so a stop-out is not followed by an immediate re-entry into the
//     same fading move.
//   sizing: one full-size buy of all cash; one full sell of the whole
//     position. max_slippage_bps 200 guards against gap opens.
// Warm-up batches never order. A batch with no CBBTC bar adds no close.

import { runBars } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
// 60 one-minute bars make one hour of history.
const LOOKBACK = 60;
// Enter when the 60-bar return beats +35 bps.
const ENTRY_BPS = 35n;
// Leave when the close drops 80 bps under the peak since entry.
const TRAIL_BPS = 80n;
// Leave after 360 bars (6 hours) in a position, whatever the price did.
const MAX_HOLD = 360;
// Reject a fill more than 200 bps away from the latest close.
const MAX_SLIPPAGE_BPS = 200;

// Closes of CBBTC as they arrive, oldest first.
const closes: bigint[] = [];
// Highest close since the current position opened, null while flat.
let peakClose: bigint | null = null;
// Bars held in the current position.
let heldBars = 0;
// Bar count (closes.length) before which no new entry is allowed;
// set on every exit, 0 until the first exit.
let cooldownUntil = 0;

await runBars({
  onBatch(state, batch) {
    const bar = batch.bars.find((b) => b.symbol === SYMBOL);
    if (bar !== undefined) closes.push(BigInt(bar.c));
    const close = state.close(SYMBOL);
    if (close === null) return [];

    // Warm-up batches build history only; their orders are rejected.
    if (state.warmingUp) return [];

    const held = state.positions.get(SYMBOL);
    const qty = held === undefined ? 0n : held.qty;

    if (qty === 0n) {
      peakClose = null;
      heldBars = 0;
      if (closes.length > LOOKBACK && closes.length > cooldownUntil) {
        const old = closes[closes.length - 1 - LOOKBACK];
        // close / old - 1 > ENTRY_BPS / 10000, in integers.
        if (close * 10000n > old * (10000n + ENTRY_BPS)) {
          return [
            {
              side: 'buy',
              symbol: SYMBOL,
              notional_quote_units: state.cash,
              max_slippage_bps: MAX_SLIPPAGE_BPS,
            },
          ];
        }
      }
      return [];
    }

    // Holding: track the peak close and the bars held.
    if (peakClose === null) {
      peakClose = close;
      heldBars = 0;
    } else if (close > peakClose) {
      peakClose = close;
    }
    // close / peakClose - 1 < -TRAIL_BPS / 10000, in integers.
    const fell = close * 10000n < peakClose * (10000n - TRAIL_BPS);
    if (fell || heldBars >= MAX_HOLD) {
      // No re-entry for the next 30 bars.
      cooldownUntil = closes.length + 30;
      return [
        {
          side: 'sell',
          symbol: SYMBOL,
          qty,
          max_slippage_bps: MAX_SLIPPAGE_BPS,
        },
      ];
    }
    heldBars += 1;
    return [];
  },
});
