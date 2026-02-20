# LinkedIn Games Time Tracker

Small web app to track daily completion times for:
- Zip
- Mini Sudoku
- Queens

Includes:
- Player management (create/rename/delete)
- Daily score entry with upsert behavior
- History by date range
- Statistics (per-game and strict-overall)
- Win counts with tie handling (1 win per tied player)

## Tech Stack
- Next.js (App Router, TypeScript)
- Prisma ORM
- SQLite (`prisma/dev.db`)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env:
   ```bash
   copy .env.example .env
   ```
3. Create/update database schema:
   ```bash
   npm run db:push
   npm run db:generate
   ```
4. Optional seed (creates `Tim` and `Alex`):
   ```bash
   npm run db:seed
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Notes
- Time input accepts:
  - `mm:ss` (recommended)
  - `hh:mm:ss`
  - raw seconds (e.g. `222`)
- Overall stats are computed only for days where all 3 game times exist for that player.
- Unique player names are enforced case-insensitively.
