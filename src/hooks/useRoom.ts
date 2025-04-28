import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRoomStore } from "../stores/useRoomStore";
import { useGameStore, GamePhase, Player } from "../stores/useGameStore";
import { useEffect, useRef } from "react";
import { Id } from "../../convex/_generated/dataModel";

type ConvexGameState = {
  currentPhase: GamePhase;
  topic: string | null;
  currentTurn: number;
  roundNumber: number;
  players?: (Player | null)[];
};

type Vote = {
  voterId: string;
  votedForId: string;
};

/**
 * Custom hook to manage room data and synchronize with Convex
 */
export const useRoom = () => {
  // Get room data from our stores
  const { roomId, playerId, roomCode, isHost } = useRoomStore();
  const gameStore = useGameStore();

  // Use refs to track previous data and prevent unnecessary updates
  const prevPlayersRef = useRef<Player[] | null>(null);
  const prevGameStateRef = useRef<ConvexGameState | null>(null);

  const prevVotesRef = useRef<Vote[] | null>(null);
  const prevResponsesRef = useRef<unknown[] | null>(null);

  // Query the current game state from Convex
  const gameState = useQuery(
    api.rooms.getGameState,
    roomId ? { roomId } : "skip",
  );

  // Subscribe to players in the room
  const players = useQuery(
    api.players.getPlayersInRoom,
    roomId ? { roomId } : "skip",
  );

  // Subscribe to votes
  const votes = useQuery(api.votes.getVotes, roomId ? { roomId } : "skip");

  // Subscribe to responses
  const responses = useQuery(
    api.responses.getResponses,
    roomId ? { roomId } : "skip",
  );

  // Mutations
  const createRoomMutation = useMutation(api.rooms.createRoom);
  const joinRoomMutation = useMutation(api.rooms.joinRoom);
  const startGameMutation = useMutation(api.rooms.startGame);
  const nextTurnMutation = useMutation(api.rooms.nextTurn);
  const startVotingMutation = useMutation(api.rooms.startVotingPhase);
  const submitVoteMutation = useMutation(api.votes.submitVote);
  const calculateResultsMutation = useMutation(api.votes.calculateResults);
  const resetForNewRoundMutation = useMutation(api.votes.resetGameForNewRound);
  const leaveRoomMutation = useMutation(api.players.leaveRoom);
  const submitResponseMutation = useMutation(api.responses.submitResponse);

  // Check if two arrays of players are equal
  const arePlayersEqual = (
    playersA: Player[] | null,
    playersB: Player[] | null,
  ): boolean => {
    if (!playersA || !playersB) return playersA === playersB;
    if (playersA.length !== playersB.length) return false;

    // Compare each player by id and essential properties
    return playersA.every((playerA, index) => {
      const playerB = playersB[index];
      return (
        playerA._id === playerB._id &&
        playerA.isFaker === playerB.isFaker &&
        playerA.isEliminated === playerB.isEliminated &&
        playerA.score === playerB.score
      );
    });
  };

  // Sync players data when it changes
  useEffect(() => {
    if (players && Array.isArray(players)) {
      // Only update if the players data has actually changed
      if (!arePlayersEqual(players as Player[], prevPlayersRef.current)) {
        gameStore.setPlayers(players as Player[]);
        prevPlayersRef.current = [...players] as Player[];

        // Make sure we set the myPlayer information
        if (playerId) {
          gameStore.setMyPlayerId(playerId);
        }
      }
    }
  }, [players, playerId]);

  // Sync votes when they change
  useEffect(() => {
    if (votes && Array.isArray(votes)) {
      // Check if votes have changed
      const votesChanged =
        !prevVotesRef.current ||
        prevVotesRef.current.length !== votes.length ||
        JSON.stringify(prevVotesRef.current) !== JSON.stringify(votes);

      if (votesChanged) {
        gameStore.resetVotes();
        votes.forEach((vote) => {
          gameStore.addVote(vote.voterId, vote.votedForId);
        });
        prevVotesRef.current = [...votes];
      }
    }
  }, [votes]);

  // Sync responses when they change
  useEffect(() => {
    if (responses && Array.isArray(responses)) {
      // Check if responses have changed
      const responsesChanged =
        !prevResponsesRef.current ||
        prevResponsesRef.current.length !== responses.length ||
        JSON.stringify(prevResponsesRef.current) !== JSON.stringify(responses);

      if (responsesChanged) {
        gameStore.setResponses(responses);
        prevResponsesRef.current = [...responses];
      }
    }
  }, [responses]);

  // Sync game state when it changes
  useEffect(() => {
    if (gameState && roomId) {
      // Check if game state has changed in meaningful ways
      const hasChanged =
        !prevGameStateRef.current ||
        prevGameStateRef.current.currentPhase !== gameState.currentPhase ||
        prevGameStateRef.current.topic !== gameState.topic ||
        prevGameStateRef.current.currentTurn !== gameState.currentTurn ||
        prevGameStateRef.current.roundNumber !== gameState.roundNumber;

      if (hasChanged) {
        // Map convex phase to our store phase type
        const phase = gameState.currentPhase as GamePhase;

        // Process players to ensure they're in the right format
        const processedPlayers = gameState.players
          ? gameState.players
              .filter((p) => p !== null)
              .map((p) => {
                const { _creationTime, ...player } = p!;
                return player as Player;
              })
          : [];

        gameStore.setGameState({
          currentPhase: phase,
          topic: gameState.topic || null,
          players: processedPlayers,
          currentTurnIndex: gameState.currentTurn,
          roundNumber: gameState.roundNumber,
        });

        // Update ref to avoid unnecessary updates
        prevGameStateRef.current = { ...gameState };
      }
    }
  }, [gameState, roomId]);

  // Function to create a new room
  const createRoom = async (hostName: string) => {
    try {
      const result = await createRoomMutation({ hostName });
      if (result) {
        const roomStore = useRoomStore.getState();
        roomStore.setRoomData({
          roomId: result.roomId,
          playerId: result.playerId,
          roomCode: result.roomCode,
          isHost: true,
        });
        return result;
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  };

  // Function to join an existing room
  const joinRoom = async (roomCode: string, displayName: string) => {
    try {
      const result = await joinRoomMutation({ roomCode, displayName });
      if (result) {
        const roomStore = useRoomStore.getState();
        roomStore.setRoomData({
          roomId: result.roomId,
          playerId: result.playerId,
          roomCode,
        });
        return result;
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  };

  // Function to start the game
  const startGame = async (topic: string) => {
    if (!roomId || !playerId || !isHost) return;

    try {
      await startGameMutation({
        roomId,
        playerId,
        topic,
      });
    } catch (error) {
      console.error("Failed to start game:", error);
      throw error;
    }
  };

  // Function to go to the next turn
  const nextTurn = async () => {
    if (!roomId) return;

    try {
      await nextTurnMutation({ roomId });
    } catch (error) {
      console.error("Failed to move to next turn:", error);
      throw error;
    }
  };

  // Function to start the voting phase
  const startVoting = async () => {
    if (!roomId || !playerId || !isHost) return;

    try {
      await startVotingMutation({ roomId, playerId });
    } catch (error) {
      console.error("Failed to start voting phase:", error);
      throw error;
    }
  };

  // Function to submit a response
  const submitResponse = async (response: string) => {
    if (!roomId || !playerId) return;

    try {
      await submitResponseMutation({
        roomId,
        playerId,
        response,
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to submit response:", error);
      throw error;
    }
  };

  // Function to submit a vote
  const submitVote = async (votedForId: Id<"players">) => {
    if (!roomId || !playerId) return;

    try {
      await submitVoteMutation({
        roomId,
        voterId: playerId,
        votedForId,
      });
      gameStore.setMyVote(votedForId);
    } catch (error) {
      console.error("Failed to submit vote:", error);
      throw error;
    }
  };

  // Function to calculate results
  const calculateResults = async () => {
    if (!roomId || !isHost) return;

    try {
      const results = await calculateResultsMutation({ roomId });
      if (results) {
        gameStore.setVotingResults(results);
      }
      return results;
    } catch (error) {
      console.error("Failed to calculate results:", error);
      throw error;
    }
  };

  // Function to reset for a new round
  const resetForNewRound = async (newTopic: string) => {
    if (!roomId || !isHost) return;

    try {
      await resetForNewRoundMutation({ roomId, newTopic });
      gameStore.resetVotes();
    } catch (error) {
      console.error("Failed to reset for new round:", error);
      throw error;
    }
  };

  // Function to leave the room
  const leaveRoom = async () => {
    if (!playerId) return;

    try {
      await leaveRoomMutation({ playerId });
      const roomStore = useRoomStore.getState();
      roomStore.clearRoomData();
      gameStore.resetGame();
    } catch (error) {
      console.error("Failed to leave room:", error);
      throw error;
    }
  };

  return {
    // State
    gameState,
    players,
    votes,
    responses,
    isLoading: roomId !== null && gameState === undefined,
    isConnected: gameState !== undefined,

    // Actions
    createRoom,
    joinRoom,
    startGame,
    nextTurn,
    startVoting,
    submitResponse,
    submitVote,
    calculateResults,
    resetForNewRound,
    leaveRoom,
  };
};
