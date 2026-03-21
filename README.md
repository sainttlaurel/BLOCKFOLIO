# Blockfolio (Temporary) 

A crypto dashboard that somehow turned into a semi-overbuilt trading platform.
Built with React because I had time, curiosity, and no plan to stop halfway this time.

---

## Overview

This started as a simple crypto dashboard.
Then I kept adding stuff… and now it looks like a “professional” trading app (kind of).

## Let’s be clear:

- Not built by professionals
- Not a real trading platform
- Not financial advice
- ust a solo project that got out of hand

---

## Goal

Make crypto tracking and trading feel less painful:

- Portfolio-first view (see your stuff immediately)
- Charts that actually look good
- Fast updates so things don’t feel dead
- Less clicking, more doing

More detailed requirements & design: [Click here](https://file.kiwi/cbc2e8b0#SpqfZ20pidgKHlBakNFzCw)

---

## System Flow

![diagram](https://github.com/user-attachments/assets/55ac9ede-cd43-4b28-8087-0248ed4481c1)

- The flow is simple: Portfolio → Scan → Analyze → Trade → Repeat.

---

## Architecture

![diagram (1)](https://github.com/user-attachments/assets/eac07d0a-e5a6-4203-bacf-63c55cdde53c)

- The architecture separates frontend, trading interface, state management, components, and backend for clarity and speed.
  
---

## Layout & Components

- Desktop has portfolio left, market center, trading panel right. Tablet stacks portfolio, market/trading, and charts. Mobile uses vertical stack with tabs and swipeable cards. Components include a navigation bar, dashboard layout, modals for details, portfolio charts, market stats, trading panels, order books, and history.

---

## Data & Error Handling

- Portfolio shows value, holdings, allocation, and sparklines. Trading handles coin selection, amounts, totals, fees, buy/sell, and confirmations. Charts show OHLC, candlesticks, volume, and indicators. Market data shows coins, stats, top movers, and last updates. The system retries failed requests, caches offline, shows connection status, verifies balances, checks market closures, validates input, provides chart fallbacks, and parses backend errors safely.

---

## Testing & Quick Start

- Unit tests cover UI, API, and errors. Property-based tests ensure allocations sum to 100%. Integration tests cover API feeds, charts, and trading workflow.

```bash
npm install && cd client && npm install
npm run dev
```

```
npm install && cd client && npm install
npm run dev
```

---

## Tech & API

- React 18 + Tailwind CSS, Chart.js, Canvas API, Node.js/Express, SQLite.
Endpoints: /api/coins/prices (prices), /api/wallet (wallet), /api/transactions/buy & /sell (trades).

---

## File Structure

client/src/
├── components/       # UI components
├── services/         # data management
├── hooks/            # React hooks
├── styles/           # CSS
└── pages/            # Pages

---

## Why I Built This

I had time.
I didn’t want to waste it.
So instead of dropping another project halfway, I kept going.

## Now it’s this weird mix of:

overbuilt features
random optimizations
things I learned the hard way

---

## Notes
- Solo project
- Built slowly, inconsistently, and sometimes lazily
- Overthought in some parts, underthought in others

I’ll probably keep updating this whenever I feel like it.

---

## Final Thought

If you’re expecting something polished and industry-level — this isn’t it.
If you want to see a project that someone actually finished (even imperfectly) — then this is that.

Built by someone with too much time and no clear roadmap

![welp](https://github.com/user-attachments/assets/69dc1e14-2689-4c7b-aa75-ab742323f499)

