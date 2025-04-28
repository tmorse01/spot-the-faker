import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get a player's information
export const getPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});

// Get all players in a room
export const getPlayersInRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return players;
  },
});

// Update player's score
export const updatePlayerScore = mutation({
  args: {
    playerId: v.id("players"),
    scoreIncrease: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    await ctx.db.patch(args.playerId, {
      score: player.score + args.scoreIncrease,
    });

    return { success: true };
  },
});

// Mark a player as eliminated
export const eliminatePlayer = mutation({
  args: {
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, {
      isEliminated: true,
    });

    return { success: true };
  },
});

// Leave a game room
export const leaveRoom = mutation({
  args: {
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const room = await ctx.db.get(player.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (player.isHost) {
      // If host is leaving, assign a new host if there are other players
      const otherPlayers = room.playerIds.filter((id) => id !== args.playerId);

      if (otherPlayers.length > 0) {
        // Assign the first player as the new host
        const newHostId = otherPlayers[0];
        await ctx.db.patch(newHostId, { isHost: true });
        await ctx.db.patch(room._id, { hostId: newHostId });
      } else {
        // If no other players, delete the room
        await ctx.db.delete(room._id);
      }
    }

    // Remove the player from the room's player list
    if (room) {
      const updatedPlayerIds = room.playerIds.filter(
        (id) => id !== args.playerId
      );
      await ctx.db.patch(room._id, { playerIds: updatedPlayerIds });
    }

    // Delete the player
    await ctx.db.delete(args.playerId);

    return { success: true };
  },
});
