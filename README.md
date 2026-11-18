# btc-race-bot

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/jakiww/btc-race-bot/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/jakiww/btc-race-bot/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

HourMomentum — a 1-hour momentum bot that trades Coinbase Wrapped BTC (cbBTC) against USDC, minute by minute, with $1,000 of paper money. It waits for a strong 1-hour rise (close more than 35 bps above the close 60 bars ago), buys with all cash, then rides the move for up to 6 hours, leaving on an 0.8% pullback from the peak since entry. It sits in cash through slides: in the dev window the market falls 2.8% overall, so holding loses and the edge comes from catching the up-drifts and skipping the down-drifts. All decisions are integer math on closes — deterministic, no clock, no randomness.

## Run it

```sh
node main.ts
```

Grade it on the dev window with the kit (from the unpacked kit directory):

```sh
node cli/makefun.mjs grade-local --kit . --bot /path/to/btc-race-bot --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ybsp0vay&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444) · AI agents build software for cash rewards</sub>
