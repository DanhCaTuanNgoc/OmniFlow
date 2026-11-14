Reactive Omni Buildathon
From November 5th to December 5th, we're running a month-long buildathon to put Reactive Omni through its paces, with $5,500 in prizes, paid in REACT, across three tracks.

Omni is the new version of Reactive Network, built on CometBFT consensus. Reactive contracts watch for events on other chains and act on them automatically. On the previous version they ran on ~7s blocks, which ruled out anything where a few seconds decide the outcome. Omni cuts that to ~1s blocks with instant finality, so strategies that used to be too slow are now within reach. This buildathon is about finding out what that opens up.

Tracks
Every Second Counts: time-sensitive DeFi on Unichain Sepolia and/or Base Sepolia

Set It and Forget It: personal automations anyone can build, no contract experience needed

Reactive Meets AI: neural networks working alongside reactive contracts

Each track's section has the full brief, ideas, and network requirements.

Prizes
Prizes are denominated in USD and paid in REACT.

Every Second Counts: $2,000 for the first place, $250 for the runner-up

Set It and Forget It: $2,000 for the first place, $250 for the runner-up

Reactive Meets AI: $1,000 for the first place

Judging
Every entry is scored from 1 to 5 on four equally weighted criteria:

Execution: Does it run? We want to see the reactive transactions and the callbacks they trigger on-chain. Entries without them aren't scored further.

Integration: Does the reactive contract do real work, or is it bolted on? Each track's brief says what this means there.

Usefulness: Does it solve a problem real users have?

Craft: Readable code, a working demo, and documentation someone else could follow.

Entries are judged by Reactive team, and we'll announce any guest judges on this page.

Submission
Submit your build on this page with:

A link to your public repository

Deployed contract addresses

A few transaction hashes showing the full loop, from origin event to callback

A demo video under three minutes

Ground Rules
Repositories need to be public and open-source by the time you submit.

Everything should be built during the event. Prior work can come in as a dependency, but not as the submission itself.

Base Sepolia now produces blocks every 200ms, so use timestamps rather than block counts for any timers, cooldowns, or deadlines there.

Resources
[Reactive Network docs](https://dev.reactive.network/)

https://dev.reactive.network/origins-and-destinations#mainnet-chains

https://dev.reactive.network/origins-and-destinations#mainnet-chains







TRACK 

**Every Second Counts**
Low-latency DeFi on Unichain Sepolia or Base Sepolia

Build reactive contracts for liquidity where reaction time matters. Unichain Sepolia produces 1s blocks, Base Sepolia produces 200ms blocks since its Denim upgrade, and Reactive Omni runs at ~1s with instant finality. Every loop runs from an event, through Reactive, to a callback, and every second in it counts.

Ideas

Arbitrage on price gaps between pools
Stop-loss and take-profit orders for DEX positions
Vaults that rebalance as conditions shift
Liquidity that moves to wherever it’s needed
Withdrawal queues that settle the moment they can
What we’re looking for

A working prototype or clear technical demo on Unichain Sepolia, Base Sepolia, or both
Latency numbers measured across the full loop, showing why the idea needs Reactive Omni
Network: Reactive mainnet/Lasna testnet with Unichain Sepolia and/or Base Sepolia

**Set It and Forget It**
Build something useful for yourself, on any supported chain

Open to anyone, including people who’ve never written a contract and are building with AI coding tools. The brief is simple: build a reactive contract that solves a problem for you. Latency matters less here than usefulness.

Ideas

A portfolio tracker
An alert when a liquidity position hits a price
Custom rebalancing rules
An automation nobody’s thought of yet
What we’re looking for

A tool you’d actually keep running
A clear personal purpose
A creative take on event-driven logic
Network: Reactive mainnet/Lasna testnet, with any supported chain [Mainnet available chains](https://dev.reactive.network/origins-and-destinations#mainnet-chains) | [Testnet available chains](https://dev.reactive.network/origins-and-destinations#testnet-chains)

**Reactive Meets AI**
Neural networks and reactive contracts, working together

This track is deliberately open. Bring a neural network into the loop and show us how it works alongside Reactive. How the two fit together is up to you.

Ideas

A model that decides what a reactive contract does next
A model that interprets the events a reactive contract picks up
On-chain events that trigger a model
One rule: the AI has to be part of the running system, not just the tool you used to build it. Projects where AI only wrote the code belong in Set It and Forget It.

Network: Reactive mainnet/Lasna testnet