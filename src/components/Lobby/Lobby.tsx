import { useState, FormEvent } from "react";
import Layout from "../common/Layout";
import Button from "../common/Button";
import { useRoom } from "../../hooks/useRoom";
import { useRoomStore } from "../../stores/useRoomStore";
import { useGameStore, Player } from "../../stores/useGameStore";

// Sample topics for the game
const SAMPLE_TOPICS = [
  "Types of Cheese",
  "Ice Cream Flavors",
  "Countries in Europe",
  "Famous Actors",
  "Superhero Movies",
  "Dog Breeds",
  "Musical Instruments",
  "Sports Played with a Ball",
  "Car Brands",
  "Popular Vacation Destinations",
];

export default function Lobby() {
  const { roomId, roomCode, isHost } = useRoomStore();
  const { players } = useGameStore();
  const { startGame } = useRoom();

  const [topic, setTopic] = useState("");
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [randomTopic, setRandomTopic] = useState(
    SAMPLE_TOPICS[Math.floor(Math.random() * SAMPLE_TOPICS.length)],
  );

  // Use a random topic or let the host set a custom topic
  const actualTopic = isCustomTopic ? topic : randomTopic;

  const handleStartGame = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomId || !isHost || !actualTopic) return;

    try {
      await startGame(actualTopic);
      // The game state will be updated automatically via our useRoom hook
    } catch (error) {
      console.error("Failed to start game:", error);
      alert("Failed to start the game. Please try again.");
    }
  };

  const handleGetNewRandomTopic = () => {
    // Get a different random topic
    let newTopic = randomTopic;
    while (newTopic === randomTopic) {
      newTopic =
        SAMPLE_TOPICS[Math.floor(Math.random() * SAMPLE_TOPICS.length)];
    }
    setRandomTopic(newTopic);
  };

  const copyRoomCode = () => {
    if (!roomCode) return;

    navigator.clipboard
      .writeText(roomCode)
      .then(() => alert("Room code copied to clipboard!"))
      .catch((err) => console.error("Failed to copy room code:", err));
  };

  return (
    <Layout title="Game Lobby">
      <div className="space-y-6">
        {roomId && (
          <div className="text-center">
            <div className="mb-2 rounded-lg bg-white/20 p-3">
              <h2 className="mb-1 text-lg font-medium">Room Code</h2>
              <div className="text-3xl font-bold tracking-widest">
                {roomCode}
              </div>
              <p className="mt-2 text-sm">
                Share this code with your friends to join
              </p>
            </div>
            <Button variant="secondary" className="mt-2" onClick={copyRoomCode}>
              Copy Room Code
            </Button>
          </div>
        )}

        <div>
          <h2 className="mb-3 text-xl font-semibold">Players</h2>
          <div className="space-y-2">
            {players.length > 0 ? (
              players.map((player: Player) => (
                <div
                  key={player._id}
                  className="flex items-center rounded-lg bg-white/20 p-3"
                >
                  <div className="flex-grow font-medium">
                    {player.displayName}
                  </div>
                  {player.isHost && (
                    <span className="rounded-full bg-yellow-500 px-2 py-1 text-xs text-yellow-900">
                      Host
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-white/10 p-4 text-center">
                No players have joined yet
              </div>
            )}
          </div>

          <div className="mt-4 text-center text-sm">
            <p>
              {players.length} player{players.length !== 1 ? "s" : ""} in the
              lobby
            </p>
            <p className="mt-1">At least 3 players needed to start</p>
          </div>
        </div>

        {isHost && (
          <form onSubmit={handleStartGame} className="mt-6 space-y-4">
            <div>
              <h2 className="mb-3 text-xl font-semibold">Game Settings</h2>

              <div className="space-y-3">
                <div>
                  <label className="flex cursor-pointer items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!isCustomTopic}
                      onChange={() => setIsCustomTopic(false)}
                      className="rounded"
                    />
                    <span>Use random topic</span>
                  </label>

                  {!isCustomTopic && (
                    <div className="mt-2 flex items-center rounded-lg bg-white/20 p-3">
                      <span className="flex-grow font-medium">
                        {randomTopic}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleGetNewRandomTopic}
                        className="py-1 text-sm"
                      >
                        New Topic
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex cursor-pointer items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isCustomTopic}
                      onChange={() => setIsCustomTopic(true)}
                      className="rounded"
                    />
                    <span>Create custom topic</span>
                  </label>

                  {isCustomTopic && (
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter custom topic"
                      className="mt-2 w-full rounded-lg border border-white/30 bg-white/20 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required={isCustomTopic}
                    />
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={players.length < 3 || (isCustomTopic && !topic)}
              className="mt-4"
            >
              Start Game
            </Button>
          </form>
        )}

        {!isHost && (
          <div className="mt-6 text-center">
            <p className="mb-3">Waiting for host to start the game...</p>
            <div className="flex animate-pulse justify-center">
              <div className="mx-1 h-3 w-3 rounded-full bg-white"></div>
              <div className="animation-delay-200 mx-1 h-3 w-3 rounded-full bg-white"></div>
              <div className="animation-delay-400 mx-1 h-3 w-3 rounded-full bg-white"></div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
