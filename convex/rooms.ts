import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Generate a random 6-character room code
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new game room
export const createRoom = mutation({
  args: {
    hostName: v.string(),
  },
  handler: async (ctx, args) => {
    // Create a unique room code
    let roomCode = generateRoomCode();
    let isUnique = false;

    while (!isUnique) {
      const existingRoom = await ctx.db
        .query("rooms")
        .withIndex("by_room_code", (q) => q.eq("roomCode", roomCode))
        .first();

      isUnique = existingRoom === null;
      if (!isUnique) {
        roomCode = generateRoomCode();
      }
    }

    // Create the room first
    const roomId = await ctx.db.insert("rooms", {
      roomCode,
      hostId: "", // We'll update this after creating the player
      currentPhase: "lobby",
      playerIds: [],
      created: Date.now(),
    });

    // Now create the host player with the valid roomId
    const playerId = await ctx.db.insert("players", {
      displayName: args.hostName,
      isFaker: false,
      isEliminated: false,
      isHost: true,
      score: 0,
      roomId: roomId,
    });

    // Update the room with the host ID and player ID
    await ctx.db.patch(roomId, {
      hostId: playerId,
      playerIds: [playerId],
    });

    return { roomId, roomCode, playerId };
  },
});

// Get room by room code
export const getRoomByCode = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("roomCode", args.roomCode))
      .first();

    if (!room) {
      return null;
    }

    // Get all players in the room
    const players = await Promise.all(
      room.playerIds.map(async (playerId) => {
        return await ctx.db.get(playerId);
      }),
    );

    return { ...room, players };
  },
});

// Join an existing room
export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the room
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_code", (q) => q.eq("roomCode", args.roomCode))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.currentPhase !== "lobby") {
      throw new Error("Cannot join room, game already in progress");
    }

    // Create a player
    const playerId = await ctx.db.insert("players", {
      roomId: room._id,
      displayName: args.displayName,
      isFaker: false,
      isEliminated: false,
      isHost: false,
      score: 0,
    });

    // Update the room with the new player
    await ctx.db.patch(room._id, {
      playerIds: [...room.playerIds, playerId],
    });

    return { roomId: room._id, playerId };
  },
});

// Start the game
export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify that the player is the host
    const player = await ctx.db.get(args.playerId);
    if (!player || !player.isHost) {
      throw new Error("Only the host can start the game");
    }

    // Need at least 3 players to start
    if (room.playerIds.length < 3) {
      throw new Error("At least 3 players required to start the game");
    }

    // Randomly select a faker
    const randomIndex = Math.floor(Math.random() * room.playerIds.length);
    const fakerId = room.playerIds[randomIndex];

    // Update all players to not be the faker
    await Promise.all(
      room.playerIds.map(async (playerId) => {
        await ctx.db.patch(playerId, { isFaker: playerId === fakerId });
      }),
    );

    // Update room state
    await ctx.db.patch(args.roomId, {
      currentPhase: "game",
      topic: args.topic,
      roundNumber: 1,
      currentTurn: 0,
    });

    return { fakerId };
  },
});

// Move to next player's turn
export const nextTurn = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const currentTurn = room.currentTurn !== undefined ? room.currentTurn : 0;
    const nextTurn = (currentTurn + 1) % room.playerIds.length;

    // If we've gone around the full circle, increment the round number
    if (nextTurn === 0) {
      await ctx.db.patch(args.roomId, {
        currentTurn: nextTurn,
        roundNumber: (room.roundNumber || 1) + 1,
      });
    } else {
      await ctx.db.patch(args.roomId, {
        currentTurn: nextTurn,
      });
    }

    return { currentTurn: nextTurn };
  },
});

// Start the voting phase
export const startVotingPhase = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify that the player is the host
    const player = await ctx.db.get(args.playerId);
    if (!player || !player.isHost) {
      throw new Error("Only the host can start the voting phase");
    }

    await ctx.db.patch(args.roomId, {
      currentPhase: "voting",
    });

    return { success: true };
  },
});

// Get current game state
export const getGameState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Get all players in the room
    const players = await Promise.all(
      room.playerIds.map(async (playerId) => {
        return await ctx.db.get(playerId);
      }),
    );

    return {
      ...room,
      players,
      currentPlayer:
        room.currentTurn !== undefined ? players[room.currentTurn] : null,
    };
  },
});
