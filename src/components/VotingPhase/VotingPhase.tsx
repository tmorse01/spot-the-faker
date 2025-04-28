import { useState } from "react";
import Layout from "../common/Layout";
import Button from "../common/Button";
import { useRoom } from "../../hooks/useRoom";
import { useGameStore } from "../../stores/useGameStore";
import { useRoomStore } from "../../stores/useRoomStore";
import { Id } from "../../convex/_generated/dataModel";

export default function VotingPhase() {
  const { roomId, isHost, playerId } = useRoomStore();
  const { players, myVote, allVotes } = useGameStore();

  const { submitVote, calculateResults } = useRoom();
  const [selectedPlayer, setSelectedPlayer] = useState<Id<"players"> | null>(
    myVote,
  );
  const [voteSubmitted, setVoteSubmitted] = useState(Boolean(myVote));

  // Filter out eliminated players
  const activePlayers = players.filter((p) => !p.isEliminated);

  // Count total votes submitted
  const votesSubmitted = Object.keys(allVotes).length;

  const handleVote = async () => {
    if (!roomId || !playerId || !selectedPlayer) return;

    try {
      await submitVote(selectedPlayer);
      setVoteSubmitted(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert("Failed to submit vote. Please try again.");
    }
  };

  const handleCalculateResults = async () => {
    if (!roomId || !isHost) return;

    try {
      await calculateResults();
    } catch (error) {
      console.error("Error calculating results:", error);
      alert("Failed to calculate results. Please try again.");
    }
  };

  return (
    <Layout title="Voting Phase">
      <div className="space-y-6">
        <div className="rounded-lg bg-white/20 p-4 text-center">
          <h2 className="mb-2 text-xl font-semibold">Vote for the Faker</h2>
          <p>Who do you think is the Faker?</p>
        </div>

        <div className="space-y-3">
          {activePlayers.map((player) => {
            // Don't let players vote for themselves
            const isCurrentPlayer = playerId === player._id;

            return (
              <button
                key={player._id}
                disabled={voteSubmitted || isCurrentPlayer}
                onClick={() => setSelectedPlayer(player._id)}
                className={`flex w-full items-center rounded-lg p-3 transition-colors ${
                  isCurrentPlayer
                    ? "cursor-not-allowed bg-white/10 opacity-50"
                    : selectedPlayer === player._id
                      ? "border-2 border-white bg-indigo-600"
                      : "bg-white/20 hover:bg-white/30"
                }`}
              >
                <div className="flex-grow text-left font-medium">
                  {player.displayName}
                  {isCurrentPlayer && " (You)"}
                </div>

                {/* Show who has voted for this player */}
                {Object.entries(allVotes).filter(
                  ([_, targetId]) => targetId === player._id,
                ).length > 0 && (
                  <div className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                    {
                      Object.entries(allVotes).filter(
                        ([_, targetId]) => targetId === player._id,
                      ).length
                    }{" "}
                    votes
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {!voteSubmitted ? (
            <Button onClick={handleVote} fullWidth disabled={!selectedPlayer}>
              Submit Vote
            </Button>
          ) : (
            <div className="rounded-lg bg-white/10 p-3 text-center">
              <p>Your vote has been submitted</p>
              <p className="mt-1 text-sm">Waiting for other players...</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <p>
              {votesSubmitted} of {activePlayers.length} votes submitted
            </p>
          </div>

          {isHost && (
            <div className="mt-4 text-center">
              <Button
                onClick={handleCalculateResults}
                variant="secondary"
                disabled={votesSubmitted < activePlayers.length}
              >
                Reveal Results
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
