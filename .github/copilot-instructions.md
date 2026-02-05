# Klaverjassen Score Tracker - AI Agent Guide

## Project Overview
Klaverjassen is a Dutch card game score tracking PWA with a Python backend and vanilla JavaScript frontend. Tracks team-based scoring (Team Wij vs Team Zij) with detailed round-by-round breakdowns and game history.

## Architecture

### Frontend-Backend Separation
- **Frontend** (`app.js`): Vanilla JS game engine + UI rendering
- **Backend** (`server.py`): Python HTTP server with SQLite persistence
- **Storage**: LocalStorage for current game state + SQLite for game history (API endpoints: `/api/save-game`, `/api/games`, `/api/stats`)
- When user clicks "Nieuw Spel", current game auto-saves to database before reset

### Data Flow: Player Inputs → Score Calculation → UI Update → Persistence
1. User enters round data (card points, roem, bonuses) via HTML form
2. `addRound()` validates and calculates scores with detailed breakdown
3. Breakdown stored in round object: `{wij: {cardPoints, roem, lastTrick, pit, total}, zij: {...}}`
4. `renderRoundsList()` displays rounds; `calculateTotalBreakdown()` shows game summary
5. `saveGameState()` persists to localStorage; `saveGameToDatabase()` persists completed games

## Critical Game Rules (Implemented in `addRound()`)

- **Card Points**: 162 total per round - auto-calculate `cardPointsZij = 162 - cardPointsWij`
- **Roem** (passed to `calculateRoem(team)`):
  - Driekaart: +20, Vierkaart: +50, Stuk: +20, Vier gelijken: +100, Vier boeren: +200
- **Bonuses**:
  - Last trick (`lastTrickWinner`): +10 points to winning team
  - Pit (`pitWij`/`pitZij` checkboxes): +100 points to team
- **NAT Rule** (line ~400 in `addRound()`): 
  - If playing team's card points < 82, **opponent gets all points** from that round
  - Triggered by `whoPlayed` field; all player scores become 0 for losing team

## UI State Management

- **Game Setup Modal**: Shown until 2 players per team are added via `startGameFromSetup()`
- **Team Card Display**: Color-coded (green = Wij, orange = Zij); shows per-player scores accumulated over rounds
- **Round Scoring Form**: Hidden until game starts; auto-calculates opponent's card points
- **Message System**: `showMessage(text, type)` displays toast notifications (success/warning/error/info)
- **Score Preview**: `updateScorePreview()` shows real-time calculated totals as user inputs form data

## Important Developer Patterns

### Player & Round Data Structure
```javascript
// Player object (stored in this.players.wij / this.players.zij)
{ name: "Alice", scores: [52, 48], total: 100 }

// Round object with full breakdown (prevents score recalculation discrepancies)
{
  round: 1,
  whoPlayed: "wij",
  breakdown: {
    wij: { cardPoints: 80, roem: 20, lastTrick: 10, pit: 0, total: 110 },
    zij: { cardPoints: 82, roem: 0, lastTrick: 0, pit: 0, total: 82 }
  },
  scores: { wij: 110, zij: 82 },
  natApplied: false,
  timestamp: "2026-02-05T..."
}
```

### Critical Methods - Don't Break These
- `recalculateScores()`: Rebuilds all player scores from rounds array - called after any round edit/delete
- `calculateTotalBreakdown()`: Sums all rounds for game summary; supports legacy rounds without breakdown
- `saveGameState()` (localStorage) and `saveGameToDatabase()` (API) must both be called for data integrity
- `addRound()`: Single source of truth for score calculation; all changes here propagate to UI automatically

### Common Pitfalls
- **Modifying round scores directly** without re-running recalculation will desync player totals; always use `this.rounds` as source of truth
- **NAT rule**: Check `cardPointsWij + cardPointsZij === 162` before applying (line ~410); only applies if playing team has card points data
- **Roem values**: Use `setRoemCheckboxes()` when editing (reconstructs checkboxes from total roem value, may lose exact combination info)
- **Form reset**: `clearRoundForm()` clears all inputs + checkboxes; called automatically after `addRound()`

## Server API Contracts

### POST /api/save-game
Expects JSON game object with:
- `players.wij`, `players.zij`: arrays of player names
- `rounds`: array of full round objects with breakdown
- `teamTotals.wij/zij`: final team scores
- `winner`: "Wij" | "Zij"
- `start_time`: ISO timestamp for duration calculation (optional)

Returns: `{ success: true, gameId: <int> }`

### GET /api/games
Returns array of all games with parsed JSON fields (players, rounds)

### GET /api/stats
Returns aggregated stats: total_games, wij_wins, zij_wins, avg_score_wij/zij, top_players (top 5)

### GET /admin
Renders HTML dashboard with stats grid and games table; statically generated server-side

## Running & Testing

### Start Server
```bash
python3 server.py  # Runs on http://localhost:8000 by default
```

### Database
- SQLite file: `klaverjassen_games.db` (auto-created on first save)
- Schema auto-initialized in `init_database()`
- Games table includes all fields from `save_game()` args

### PWA Features
- Service Worker (`sw.js`) caches static assets for offline use
- `manifest.json`: defines app name, icons, display mode
- iOS: Supports `apple-mobile-web-app-capable` meta tag

## When Modifying Game Logic

1. **Add new round bonus?** Update `addRound()` score calculation + `calculateRoem()`
2. **Add new fields to round?** Update breakdown structure in `addRound()` and handle legacy rounds in `calculateTotalBreakdown()`
3. **Change player count?** Update validation in `startGameFromSetup()`, `checkGameState()`, `updateAddRoundButton()`
4. **Persist new data?** Update both localStorage (game state) and server.py schema + `save_game()` function

---
**Last updated**: February 2026 | **Language**: Dutch UI/Dutch rules | **Status**: Production PWA with database
