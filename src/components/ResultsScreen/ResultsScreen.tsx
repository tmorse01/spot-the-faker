import { useEffect, useState } from "react";
import Layout from "../common/Layout";
import Button from "../common/Button";
import { useRoom } from "../../hooks/useRoom";
import { useGameStore } from "../../stores/useGameStore";
import { useRoomStore } from "../../stores/useRoomStore";

// Sample topics for new rounds
const SAMPLE_TOPICS = [
  "Pizza Toppings",
  "Board Games",
  "Famous Paintings",
  "Olympic Sports",
  "Cartoon Characters",
  "Vegetables",
  "Breakfast Foods",
  "Horror Movies",
  "Famous Landmarks",
  "Video Game Characters",
];

export default function ResultsScreen() {
  const { roomId, isHost } = useRoomStore();
  const { players, votingResults, topic } = useGameStore();

  const { resetForNewRound } = useRoom();
  const [newTopic, setNewTopic] = useState(
    SAMPLE_TOPICS[Math.floor(Math.random() * SAMPLE_TOPICS.length)]
  );

  const [isRevealed, setIsRevealed] = useState(false);

  // Find the voted player
  const votedPlayer = players.find(
    (p) => p._id === votingResults.votedPlayerId
  );

  // Find the faker
  const faker = players.find((p) => p.isFaker);

  // Reveal the result with animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleNewRound = async () => {
    if (!roomId || !isHost) return;

    try {
      await resetForNewRound(newTopic);
    } catch (error) {
      console.error("Failed to start new round:", error);
      alert("Failed to start new round. Please try again.");
    }
  };

  const handleGetNewRandomTopic = () => {
    // Get a different random topic
    let nextTopic = newTopic;
    while (nextTopic === newTopic) {
      nextTopic =
        SAMPLE_TOPICS[Math.floor(Math.random() * SAMPLE_TOPICS.length)];
    }
    setNewTopic(nextTopic);
  };

  return (
    <Layout title="Results">
      <div className="space-y-6">
        <div className="text-center p-4">
          <h2 className="text-2xl font-bold mb-4">
            {!isRevealed ? "Revealing Results..." : "The Votes Are In!"}
          </h2>

          <div
            className={`transition-opacity duration-1000 ${
              isRevealed ? "opacity-100" : "opacity-0"
            }`}
          >
            {votingResults.isFakerCaught ? (
              <div>
                <div className="p-4 bg-green-600/30 rounded-lg mb-4">
                  <p className="text-lg mb-1">The Faker was caught!</p>
                  <p className="text-xl font-bold">
                    {faker?.displayName} was the Faker
                  </p>
                </div>

                <p className="text-sm">All regular players receive 2 points</p>
              </div>
            ) : (
              <div>
                <div className="p-4 bg-red-600/30 rounded-lg mb-4">
                  <p className="text-lg mb-1">The Faker escaped!</p>
                  <p className="text-xl font-bold">
                    {votedPlayer?.displayName} was eliminated, but wasn't the
                    Faker
                  </p>
                  <p className="mt-2">
                    The real Faker was {faker?.displayName}
                  </p>
                </div>

                <p className="text-sm">The Faker receives 3 points</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/20 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Game Summary</h3>
          <p>
            <strong>Topic:</strong> {topic}
          </p>

          {isRevealed && (
            <div className="mt-3">
              <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {/* Sort players by score */}
                {players
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((player) => (
                    <div
                      key={player._id}
                      className={`flex items-center p-2 rounded-lg ${
                        player.isFaker
                          ? "bg-red-600/30"
                          : player.isEliminated
                            ? "bg-gray-800/30"
                            : "bg-white/20"
                      }`}
                    >
                      <div className="flex-grow">
                        <span className="font-medium">
                          {player.displayName}
                        </span>
                        {player.isFaker && (
                          <span className="ml-2 text-sm">(Faker)</span>
                        )}
                      </div>
                      <div className="font-bold">{player.score} pts</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {isHost && isRevealed && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Start Next Round</h3>
            <div className="bg-white/20 p-3 rounded-lg flex items-center mb-3">
              <span className="flex-grow font-medium">{newTopic}</span>
              <Button
                type="button"
                variant="secondary"
                onClick={handleGetNewRandomTopic}
                className="text-sm py-1"
              >
                New Topic
              </Button>
            </div>

            <Button onClick={handleNewRound} fullWidth>
              Start Next Round
            </Button>
          </div>
        )}

        {!isHost && isRevealed && (
          <div className="text-center mt-6">
            <p className="mb-3">Waiting for host to start the next round...</p>
            <div className="animate-pulse flex justify-center">
              <div className="h-3 w-3 bg-white rounded-full mx-1"></div>
              <div className="h-3 w-3 bg-white rounded-full mx-1 animation-delay-200"></div>
              <div className="h-3 w-3 bg-white rounded-full mx-1 animation-delay-400"></div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
