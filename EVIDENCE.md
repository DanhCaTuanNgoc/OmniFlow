# OmniFlow on-chain evidence

**Reactive Omni Buildathon | Set It and Forget It**

**Four verified full loops on public testnets.** Stop-Loss and Take-Profit each demonstrate a successful swap and a callback that skips the swap after the price reverses.

| Scenario | Verified result at the Base Vault | Origin (Base Sepolia) | Reaction (Lasna) | Callback (Base Sepolia) |
| --- | --- | --- | --- | --- |
| Stop-Loss (BP-01) | **Payout.** Price stayed below the threshold. | [Pool transaction](https://sepolia.basescan.org/tx/0x1876c679c51deae2e771e527eb976bbfa9bc0dc07d82c48ed804727df83bd6c4) | [Reactive transaction](https://lasna.reactscan.net/tx/0xc5e558a2008aea26898e9cc5a48d0a82d7c59281c4c083648a1f396d1331d37f) | [StopLossExecuted](https://sepolia.basescan.org/tx/0x43f5ec81177a1e6a2ccd770c119cdace8857345b57a00377c978043145c7214b) |
| Stop-Loss (BP-01) | **Skip.** Price rebounded above the threshold. | [Pool transaction](https://sepolia.basescan.org/tx/0x00583f8d10d5597b609a3162017281d00645d94bab304ea951cb2b4e9be20d4f) | [Reactive transaction](https://lasna.reactscan.net/tx/0xa3ae846e4d0c2a570c938f233f9eebaafe05c9ea025e1ce30348463024e68a7c) | [OrderSkipped](https://sepolia.basescan.org/tx/0x8f17be4877e5d0edf037501fe4e21deab49394d7b40061c3265d2f332efaaa1f) |
| Take-Profit (BP-03) | **Payout.** Price stayed above the threshold. | [Pool transaction](https://sepolia.basescan.org/tx/0xed538e7f062a69f2a3a04c1f57b30e0144830ea827a456d9a41643b792df4730) | [Reactive transaction](https://lasna.reactscan.net/tx/0x556769ab75fc1fa4ecb561867dc079d7fe04c2dffb2b993e90a0b916464c509f) | [OrderSettled](https://sepolia.basescan.org/tx/0x7116e64316d1fcd25ad249824475109dd0983145131e98b70c7b762013754390) |
| Take-Profit (BP-03) | **Skip.** Price fell below the threshold. | [Pool transaction](https://sepolia.basescan.org/tx/0x26046d6ebc0c859d4212dc2d16d6fbae65a9129624fa4a7aee969cd778cb9971) | [Reactive transaction](https://lasna.reactscan.net/tx/0x1ac829d081432cd2699ce91f22ae50ac78df413a12098286c0b70815bcd9dd03) | [OrderSkipped](https://sepolia.basescan.org/tx/0x19477929819164b1a7c7f69f8b06ac8f78cd7030c6223ac2dc07b2eb6a8ccddc) |

## How to verify a run

1. Open the origin transaction and find the test pool's `Sync` event.
2. Open the Lasna transaction to inspect the Reactive processing that requested the callback.
3. Open the Base callback and inspect the Vault event in the transaction logs. `StopLossExecuted` and `OrderSettled` record executed swaps. A successful receipt with `OrderSkipped` records a completed callback that left the swap unexecuted.

The runs use test pools and tokens on Base Sepolia (84532), with Reactive processing on Lasna (5318007). The [evidence manifest](FULL_LOOP_EVIDENCE.json) contains full hashes, block numbers and additional verification details.

## Additional evidence

**Stop-Loss cooldown (BP-11).** A second pool event within the 300-second cooldown produced zero callback requests. [Pool transaction](https://sepolia.basescan.org/tx/0x4a0b9fe55692cd6ead9e1d4e5b84c41c41b24e39d3ac38b389e67a6fd27eb836) | [Lasna transaction](https://lasna.reactscan.net/tx/0xe9690e6f2b66823cdb046c06e938b9c8a6341a347b15c34a0b6ce575770b33e2)
