import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Submit a vote
export const submitVote = mutation({
  args: {
    roomId: v.id("rooms"),
    voterId: v.id("players"),
    votedForId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.currentPhase !== "voting") {
      throw new Error("Voting is not currently active");
    }

    // Check if player has already voted in this round
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_room_round", (q) =>
        q.eq("roomId", args.roomId).eq("roundNumber", room.roundNumber || 1),
      )
      .filter((q) => q.eq(q.field("voterId"), args.voterId))
      .first();

    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, {
        votedForId: args.votedForId,
      });
    } else {
      // Create new vote
      await ctx.db.insert("votes", {
        roomId: args.roomId,
        voterId: args.voterId,
        votedForId: args.votedForId,
        roundNumber: room.roundNumber || 1,
      });
    }

    return { success: true };
  },
});

// Get all votes for the current round in a room
export const getVotes = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room_round", (q) =>
        q.eq("roomId", args.roomId).eq("roundNumber", room.roundNumber || 1),
      )
      .collect();

    return votes;
  },
});

// Calculate and reveal voting results
export const calculateResults = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Get all votes for this round
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room_round", (q) =>
        q.eq("roomId", args.roomId).eq("roundNumber", room.roundNumber || 1),
      )
      .collect();

    // Count votes for each player
    const voteCounts: Record<string, number> = {};
    votes.forEach((vote) => {
      const votedForId = vote.votedForId.toString();
      voteCounts[votedForId] = (voteCounts[votedForId] || 0) + 1;
    });

    // Find player with the most votes
    let mostVotedPlayerId: Id<"players"> | null = null;
    let maxVotes = 0;

    Object.entries(voteCounts).forEach(([playerId, voteCount]) => {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        mostVotedPlayerId = playerId as unknown as Id<"players">;
      }
    });

    if (!mostVotedPlayerId) {
      throw new Error("No votes were cast");
    }

    // Get the voted player
    const votedPlayer = (await ctx.db.get(mostVotedPlayerId)) as {
      _id: Id<"players">;
      _creationTime: number;
      roomId: Id<"rooms">;
      displayName: string;
      isFaker: boolean;
      isEliminated: boolean;
      isHost: boolean;
      score: number;
    };
    if (!votedPlayer) {
      throw new Error("Voted player not found");
    }

    // Check if the voted player is the faker
    const isFakerCaught = votedPlayer.isFaker;

    // Mark the voted player as eliminated
    await ctx.db.patch(mostVotedPlayerId, {
      isEliminated: true,
    });

    // Award points
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (isFakerCaught) {
      // If faker was caught, regular players get points
      await Promise.all(
        players
          .filter((player) => !player.isFaker)
          .map((player) =>
            ctx.db.patch(player._id, {
              score: player.score + 2,
            }),
          ),
      );
    } else {
      // If innocent was caught, faker gets points
      const faker = players.find((player) => player.isFaker);
      if (faker) {
        await ctx.db.patch(faker._id, {
          score: faker.score + 3,
        });
      }
    }

    // Move to results phase
    await ctx.db.patch(args.roomId, {
      currentPhase: "results",
    });

    return {
      votedPlayerId: mostVotedPlayerId,
      isFakerCaught,
      voteCounts,
    };
  },
});

// Reset the game for a new round
export const resetGameForNewRound = mutation({
  args: {
    roomId: v.id("rooms"),
    newTopic: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Get all non-eliminated players
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("isEliminated"), false))
      .collect();

    // Need at least 3 players to continue
    if (players.length < 3) {
      throw new Error("Not enough players to continue");
    }

    // Randomly select a new faker
    const randomIndex = Math.floor(Math.random() * players.length);
    const fakerId = players[randomIndex]._id;

    // Reset player faker status
    await Promise.all(
      players.map((player) =>
        ctx.db.patch(player._id, {
          isFaker: player._id === fakerId,
        }),
      ),
    );

    // Update room state
    await ctx.db.patch(args.roomId, {
      currentPhase: "game",
      topic: args.newTopic,
      roundNumber: (room.roundNumber || 1) + 1,
      currentTurn: 0,
    });

    return { success: true };
  },
});
