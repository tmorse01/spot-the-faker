import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Submit a response for a player's turn
export const submitResponse = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the room to check the current phase and round number
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.currentPhase !== "game") {
      throw new Error("Cannot submit response outside of game phase");
    }

    // Check if player is the current player
    const currentPlayerId = room.playerIds[room.currentTurn ?? 0];
    if (!currentPlayerId || currentPlayerId !== args.playerId) {
      throw new Error("Not your turn to submit a response");
    }

    // Add the response to the database
    await ctx.db.insert("responses", {
      roomId: args.roomId,
      playerId: args.playerId,
      roundNumber: room.roundNumber || 1,
      response: args.response,
      timestamp: Date.now(),
    });

    // Automatically move to the next turn
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

    return { success: true };
  },
});

// Get all responses for the current round in a room
export const getResponses = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get the room to check the current round
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const roundNumber = room.roundNumber || 1;

    // Query all responses for this room and round
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_room_round", (q) =>
        q.eq("roomId", args.roomId).eq("roundNumber", roundNumber),
      )
      .collect();

    // For each response, get the player information
    const enrichedResponses = await Promise.all(
      responses.map(async (response) => {
        const player = await ctx.db.get(response.playerId);
        return {
          ...response,
          playerName: player?.displayName || "Unknown Player",
        };
      }),
    );

    // Sort by timestamp so they appear in order
    return enrichedResponses.sort((a, b) => a.timestamp - b.timestamp);
  },
});
