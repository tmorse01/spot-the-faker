# Spot the Faker - Project Phases and Task List

## Phase 1: Backend Setup (Convex API and Schema)

**Goal:** Build the backend database, real-time updates, and server functions needed to power the game.

### Tasks:

- Set up Convex in the project (`npm install convex`, `npx convex dev`).
- Create schema for:
  - `rooms` collection
  - `players` collection
  - `votes` collection
- Implement Convex server functions:
  - `createRoom(hostName: string)`
  - `joinRoom(roomCode: string, playerName: string)`
  - `startGame(roomId: Id<"rooms">)`
    - Randomly assign one player as the Faker
    - Pick a random topic
    - Update room phase to "game"
  - `submitVote(roomId: Id<"rooms">, voterId: Id<"players">, suspectId: Id<"players">)`
  - `tallyVotes(roomId: Id<"rooms">)`
    - Determine if the Faker was caught
    - Update points or winning player
- Enable live query subscriptions for rooms and players.

✅ Deliverable:  
Working Convex backend — rooms, players, votes, game state transitions.

---

## Phase 2: Basic Frontend Game Loop (React + Vite + Tailwind)

**Goal:** Build the main pages and wire them to the backend API.

### Tasks:

- Set up basic frontend routing:
  - `/` (Home - Create or Join Room)
  - `/lobby/:roomCode`
  - `/game/:roomCode`
  - `/vote/:roomCode`
  - `/results/:roomCode`
- Create main UI components:
  - `Lobby.tsx`
  - `GameRound.tsx`
  - `VotingPhase.tsx`
  - `ResultsScreen.tsx`
- Connect frontend to Convex API using:
  - `useQuery` for live data
  - `useMutation` for updates
- Style the app with Tailwind CSS:
  - Bright, colorful party-game vibe.
- Handle player flow:
  - Create room ➔ Lobby ➔ Game ➔ Vote ➔ Results

✅ Deliverable:  
Players can create/join a room, start a game, and manually play through one round.

---

## Phase 3: Polish and Party Vibes (Animations, UX, Full Round Loop)

**Goal:** Add fun animations, timers, and polish to create a Jackbox-style party game feel.

### Tasks:

- Add round transition animations:
  - Countdown "Game starting in 3...2...1!"
  - Voting phase entrance ("Vote now!")
  - Results reveal ("The Faker was...")
- Add celebratory effects:
  - Confetti, fireworks, or colorful explosions when a winner is revealed.
- Implement timers:
  - Speaking timer per player (e.g., 10 seconds)
  - Voting timer (e.g., 15 seconds)
- Display round results with points leaderboard.
- Add "Play Again" flow to start a new round easily.
- Ensure mobile responsiveness:
  - Big, colorful touch targets
  - Smooth layouts on smaller screens

✅ Deliverable:  
A fully playable, lively game that’s fun for multiple players on desktop or mobile.
