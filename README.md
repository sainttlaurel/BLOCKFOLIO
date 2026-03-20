# BLOCKFOLIO

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Frontend](https://img.shields.io/badge/frontend-React%2018-blue)
![Backend](https://img.shields.io/badge/backend-Node.js-green)
![Database](https://img.shields.io/badge/database-SQLite-lightgrey)
![License](https://img.shields.io/badge/license-MIT-black)

Professional cryptocurrency trading platform built with React.  
Focused on clean UI, solid UX, and fast performance without unnecessary complexity.

---

## Overview

BLOCKFOLIO upgrades a basic crypto dashboard into a more usable trading interface.

Main goals:
- make portfolio data easier to read  
- improve charts and market visibility  
- keep trading interactions simple and fast  

Not a full crypto clone something like — just something that feels real and works well. (maybe)

---

## Preview

P.S: Later my bro. 

---

## Quick Start

``` bash

# install dependencies
npm install
cd client && npm install

# run dev servers
npm run dev

```

``` bash
Runs:

- React app: http://localhost:3000
- API server: http://localhost:5001
``` 

---

## Project Status

- Completed (Phase 1–3)

- Responsive layout and base UI
- Portfolio dashboard (value, charts, holdings)
- Market data (stats, top movers, crypto table)
- Real-time updates (~5s)
- In Progress (Phase 4–5)
- Interactive price charts (candlesticks, timeframes)
- Trading panel (buy/sell, order flow)

---

# Features

## Portfolio
- Large portfolio value display
- Performance charts (1D, 7D, 1M, 3M, 1Y)
- Holdings with profit/loss
- Allocation breakdown

## Market
- Global market stats
- Top movers with filters
- Sortable + searchable crypto table
- Price change indicators

## Visualization

- Sparkline charts
- Market cap and volume bars
- Real-time updates
- Smooth UI transitions

---

``` 
Tech Stack

## Frontend
- React 18
- Tailwind CSS
- Chart.js
- Canvas API

## Backend
- Node.js
- Express
- SQLite
```

---


# Roadmap

## Phase 4: Charts
- Candlestick charts
- Timeframe switching
- Basic indicators (MA, RSI)
- Zoom / pan

## Phase 5: Trading
- Buy / sell panel
- Fee + total calculation
- Trade confirmation
- Order history
- Later (Optional)
- Better navigation flow
- Search improvements
- Performance optimization
- Accessibility improvements
- Testing (basic coverage)

```
Deployment

API Endpoints
Endpoint	Method	Description
/api/coins/prices	GET	Get crypto prices
/api/wallet	GET	Get user wallet
/api/transactions/buy	POST	Buy crypto
/api/transactions/sell	POST	Sell crypto
```

## Contributing

This is a solo dev project, but feel free to fork or suggest improvements.
