import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    roomCode: v.string(),
    hostId: v.string(),
    currentPhase: v.string(), // "lobby", "game", "voting", "results"
    topic: v.optional(v.string()),
    playerIds: v.array(v.id("players")),
    currentTurn: v.optional(v.number()),
    roundNumber: v.optional(v.number()),
    created: v.number(), // timestamp
  }).index("by_room_code", ["roomCode"]),

  players: defineTable({
    roomId: v.id("rooms"),
    displayName: v.string(),
    isFaker: v.boolean(),
    isEliminated: v.boolean(),
    isHost: v.boolean(),
    score: v.number(),
  }).index("by_room", ["roomId"]),

  responses: defineTable({
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    roundNumber: v.number(),
    response: v.string(),
    timestamp: v.number(),
  }).index("by_room_round", ["roomId", "roundNumber"]),

  votes: defineTable({
    roomId: v.id("rooms"),
    voterId: v.id("players"),
    votedForId: v.id("players"),
    roundNumber: v.number(),
  }).index("by_room_round", ["roomId", "roundNumber"]),
});
