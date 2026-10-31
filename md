# Operation Pacific Shield Interactive Simulator

This repository now includes a working Vite-based OPS mission prototype that preserves the existing `opt.html` design as a reference and adds a modular, playable game engine centered on the first mission.

## What was preserved

- The prior proof-of-concept prototype remains in `opt.html` and was not overwritten.
- The original visual language (military dashboard UI, board, and role structure) was used as a design foundation.

## What is implemented

- A playable solo mission built around a fictional FOS establishment objective.
- Interactive map board with selectable sites and an active objective panel.
- A central state model that tracks mission turn, readiness, assignments, log, messages, and debrief.
- Rules validation for RFI requests, resource assignment, CAOC approval, and objective completion.
- AI support actions for non-player stations.
- Save/load using browser storage.
- A lightweight multiplayer backend with room creation and synchronized state sharing via Socket.IO.
- Automated tests for the first mission rule set.

## Scripts

- `npm install`
- `npm run dev` -> runs the Vite front end and the multiplayer backend together
- `npm run build` -> production build
- `npm run test` -> rule tests

## Run in a browser

1. Install dependencies:
   `npm install`
2. Start the application:
   `npm run dev`
3. Open the Vite URL shown in the terminal, typically `http://localhost:5173`.

## Multiplayer backend

The backend runs at `http://localhost:3001` and supports room creation and game-state broadcasts for synchronized play.

## Important note

This is a public, fictional educational game prototype built around original scenario data and operational concepts, not restricted official execution materials.
