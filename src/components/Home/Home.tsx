import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../common/Layout";
import Button from "../common/Button";
import { useRoom } from "../../hooks/useRoom";
import { useRoomStore } from "../../stores/useRoomStore";

export default function Home() {
  const navigate = useNavigate();
  const { setPlayerName } = useRoomStore();
  const { createRoom, joinRoom } = useRoom();

  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsLoading(true);
    setError("");

    try {
      setPlayerName(name);
      await createRoom(name);
      navigate("/game");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error creating room:", err);
      setError("Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !roomCode) return;

    setIsLoading(true);
    setError("");

    try {
      setPlayerName(name);
      await joinRoom(roomCode.toUpperCase(), name);
      navigate("/game");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error joining room:", err);
      setError(err.message || "Failed to join room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const showJoinForm = () => {
    setIsJoining(true);
    setIsCreating(false);
  };

  const showCreateForm = () => {
    setIsCreating(true);
    setIsJoining(false);
  };

  const goBack = () => {
    setIsJoining(false);
    setIsCreating(false);
    setError("");
  };

  return (
    <Layout title="Spot the Faker">
      <div className="animate-fade-in mb-8 text-center">
        <p className="text-lg">
          The party game of deception and detective skills!
        </p>
      </div>

      {!isJoining && !isCreating ? (
        <div className="animate-bounce-in space-y-4">
          <Button onClick={showCreateForm} fullWidth className="py-3 text-lg">
            Create New Game
          </Button>
          <Button
            onClick={showJoinForm}
            fullWidth
            variant="secondary"
            className="py-3 text-lg"
          >
            Join Game
          </Button>
        </div>
      ) : isCreating ? (
        <form onSubmit={handleCreate} className="animate-fade-in space-y-4">
          <h2 className="text-center text-xl font-bold">Create New Game</h2>

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-white/30 bg-white/20 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={goBack}
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!name || isLoading}
            >
              {isLoading ? "Creating..." : "Create Game"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="animate-fade-in space-y-4">
          <h2 className="text-center text-xl font-bold">Join Game</h2>

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-white/30 bg-white/20 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="roomCode"
              className="mb-1 block text-sm font-medium"
            >
              Room Code
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-letter code"
              className="w-full rounded-lg border border-white/30 bg-white/20 p-2 tracking-widest uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={goBack}
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!name || !roomCode || isLoading}
            >
              {isLoading ? "Joining..." : "Join Game"}
            </Button>
          </div>
        </form>
      )}
    </Layout>
  );
}
