import { create } from "zustand";
import { Id } from "../../convex/_generated/dataModel";

export type GamePhase = "lobby" | "game" | "voting" | "results";

export interface Player {
  _id: Id<"players">;
  displayName: string;
  isFaker?: boolean;
  isEliminated: boolean;
  isHost: boolean;
  score: number;
  roomId: Id<"rooms">;
}

export interface PlayerResponse {
  _id: Id<"responses">;
  playerId: Id<"players">;
  playerName: string;
  response: string;
  roundNumber: number;
  timestamp: number;
}

interface GameState {
  // Game state
  currentPhase: GamePhase;
  topic: string | null;
  players: Player[];
  currentTurnIndex: number | null;
  roundNumber: number | null;

  // Client-side calculated state
  currentPlayer: Player | null;
  isMyTurn: boolean;
  iAmFaker: boolean;
  myPlayer: Player | null;

  // Player responses
  responses: PlayerResponse[];

  // Vote tracking
  myVote: Id<"players"> | null;
  allVotes: Record<string, Id<"players">>; // voterId -> votedForId

  // Results
  votingResults: {
    votedPlayerId: Id<"players"> | null;
    isFakerCaught: boolean | null;
    voteCounts: Record<string, number> | null;
  };

  // Actions
  setGameState: (state: {
    currentPhase: GamePhase;
    topic?: string | null;
    players: Player[];
    currentTurnIndex?: number | null;
    roundNumber?: number | null;
  }) => void;
  setPlayers: (players: Player[]) => void;
  setMyPlayerId: (playerId: Id<"players">) => void;
  setMyVote: (votedForId: Id<"players">) => void;
  addVote: (voterId: Id<"players">, votedForId: Id<"players">) => void;
  resetVotes: () => void;
  setTopic: (topic: string) => void;
  setResponses: (responses: PlayerResponse[]) => void;
  setVotingResults: (results: {
    votedPlayerId: Id<"players">;
    isFakerCaught: boolean;
    voteCounts: Record<string, number>;
  }) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  currentPhase: "lobby",
  topic: null,
  players: [],
  currentTurnIndex: null,
  roundNumber: null,

  currentPlayer: null,
  isMyTurn: false,
  iAmFaker: false,
  myPlayer: null,

  responses: [],

  myVote: null,
  allVotes: {},

  votingResults: {
    votedPlayerId: null,
    isFakerCaught: null,
    voteCounts: null,
  },

  // Actions
  setGameState: (state) => {
    const { players, myPlayer } = get();

    // Calculate current player based on turn index
    const currentPlayer =
      state.currentTurnIndex !== undefined &&
      state.currentTurnIndex !== null &&
      state.players.length > 0
        ? state.players[state.currentTurnIndex]
        : null;

    // Calculate if it's my turn
    const myPlayerId = myPlayer?._id;
    const isMyTurn = Boolean(
      myPlayerId && currentPlayer && currentPlayer._id === myPlayerId,
    );

    // Calculate if I am the faker
    const myNewPlayerData = myPlayerId
      ? state.players.find((p) => p._id === myPlayerId)
      : null;

    const iAmFaker = Boolean(myNewPlayerData?.isFaker);

    set({
      currentPhase: state.currentPhase,
      topic: state.topic !== undefined ? state.topic : get().topic,
      players: state.players,
      currentTurnIndex:
        state.currentTurnIndex !== undefined
          ? state.currentTurnIndex
          : get().currentTurnIndex,
      roundNumber:
        state.roundNumber !== undefined ? state.roundNumber : get().roundNumber,
      currentPlayer,
      isMyTurn,
      iAmFaker,
      myPlayer: myNewPlayerData || get().myPlayer,
    });
  },

  setPlayers: (players) => {
    const { myPlayer, currentTurnIndex } = get();
    const myPlayerId = myPlayer?._id;

    // Find myself in the new players array
    const myNewPlayerData = myPlayerId
      ? players.find((p) => p._id === myPlayerId)
      : null;

    // Calculate current player
    const currentPlayer =
      currentTurnIndex !== null &&
      players.length > 0 &&
      currentTurnIndex < players.length
        ? players[currentTurnIndex]
        : null;

    // Calculate if it's my turn
    const isMyTurn = Boolean(
      myPlayerId && currentPlayer && currentPlayer._id === myPlayerId,
    );

    // Calculate if I am the faker
    const iAmFaker = Boolean(myNewPlayerData?.isFaker);

    set({
      players,
      currentPlayer,
      isMyTurn,
      iAmFaker,
      myPlayer: myNewPlayerData || get().myPlayer,
    });
  },

  setMyPlayerId: (playerId) => {
    const { players } = get();
    const myPlayer = players.find((p) => p._id === playerId) || null;

    if (myPlayer) {
      set({
        myPlayer,
        iAmFaker: Boolean(myPlayer.isFaker),
      });
    }
  },

  setResponses: (responses) => {
    set({ responses });
  },

  setMyVote: (votedForId) => {
    const { myPlayer, allVotes } = get();
    if (!myPlayer) return;

    const myPlayerId = myPlayer._id;
    const newVotes = { ...allVotes };
    newVotes[myPlayerId.toString()] = votedForId;

    set({
      myVote: votedForId,
      allVotes: newVotes,
    });
  },

  addVote: (voterId, votedForId) => {
    set((state) => ({
      allVotes: {
        ...state.allVotes,
        [voterId.toString()]: votedForId,
      },
    }));
  },

  resetVotes: () => {
    set({
      myVote: null,
      allVotes: {},
    });
  },

  setTopic: (topic) => {
    set({ topic });
  },

  setVotingResults: (results) => {
    set({
      votingResults: {
        votedPlayerId: results.votedPlayerId,
        isFakerCaught: results.isFakerCaught,
        voteCounts: results.voteCounts,
      },
    });
  },

  resetGame: () => {
    set({
      currentPhase: "lobby",
      topic: null,
      currentTurnIndex: null,
      roundNumber: null,
      myVote: null,
      allVotes: {},
      responses: [],
      votingResults: {
        votedPlayerId: null,
        isFakerCaught: null,
        voteCounts: null,
      },
    });
  },
}));
