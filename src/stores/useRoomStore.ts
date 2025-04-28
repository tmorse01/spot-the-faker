import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Id } from "../../convex/_generated/dataModel";

interface RoomState {
  roomId: Id<"rooms"> | null;
  playerId: Id<"players"> | null;
  roomCode: string | null;
  isHost: boolean;
  playerName: string;
  
  // Actions
  setRoomData: (data: { 
    roomId: Id<"rooms">; 
    playerId: Id<"players">; 
    roomCode: string;
    isHost?: boolean;
  }) => void;
  setPlayerName: (name: string) => void;
  clearRoomData: () => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      roomId: null,
      playerId: null,
      roomCode: null,
      isHost: false,
      playerName: '',

      setRoomData: (data) => set({
        roomId: data.roomId,
        playerId: data.playerId,
        roomCode: data.roomCode,
        isHost: data.isHost ?? false,
      }),

      setPlayerName: (name) => set({
        playerName: name,
      }),

      clearRoomData: () => set({
        roomId: null,
        playerId: null,
        roomCode: null,
        isHost: false,
      }),
    }),
    {
      name: "spot-the-faker-room-storage",
    }
  )
);
