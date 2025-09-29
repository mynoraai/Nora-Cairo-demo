# SwipeMatch – Minimal Starknet Dating Demo

This repo contains two pieces:

- `dating_contract/src/lib.cairo` – a barebones Starknet contract where users save a
  single profile value, like other addresses, and automatically mark a match when both
  sides like each other.
- `frontend/index.html` – a static demo page that connects to a Starknet wallet
  (Argent X or Braavos) and drives the contract.

## Contract quickstart

```bash
cd dating_contract
scarb build               # compile Sierra & CASM
scarb test                # run unit tests (requires Scarb cache permissions)
```

> The CLI sandbox may block Scarb from writing to `~/Library/Caches`. If the command
> fails with `Operation not permitted`, rerun outside the sandbox or allow the cache
> directory.

Key entrypoints:

- `set_profile(felt252)` – store any non-zero felt as the caller’s profile value.
- `like_profile(address)` – like another address (both users need set profiles).
- `has_liked(address,address)` / `has_match(address,address)` – read helpers for the
  frontend.

Deploy with Starknet CLI, Voyager, or Devnet, then copy the contract address for the
demo UI.

## Frontend demo

1. Ensure you have a Starknet wallet extension installed (Argent X or Braavos).
2. Open `frontend/index.html` directly in a browser (no build step needed).
3. Connect your wallet, paste the deployed contract address, and interact:
   - Set your profile value (text is auto-encoded to a felt).
   - Enter another address and press “Send Like”.
   - Use the status buttons to verify likes and matches.

Because this is a barebones showcase, you’re responsible for deploying the contract on
devnet/testnet and prefunding demo accounts.
