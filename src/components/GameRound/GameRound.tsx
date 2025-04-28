import { useState, FormEvent, useEffect } from "react";
import Layout from "../common/Layout";
import Button from "../common/Button";
import { useRoom } from "../../hooks/useRoom";
import { useGameStore } from "../../stores/useGameStore";
import { useRoomStore } from "../../stores/useRoomStore";

export default function GameRound() {
  const { roomId, playerId, isHost } = useRoomStore();
  const {
    players,
    currentPhase,
    topic,
    currentPlayer,
    isMyTurn,
    iAmFaker,
    myPlayer,
    roundNumber,
    responses, // Use responses from the store
  } = useGameStore();

  const { nextTurn, startVoting, submitResponse } = useRoom();
  const [showConfirm, setShowConfirm] = useState(false);
  const [responseInput, setResponseInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePlayers = players.filter((p) => !p.isEliminated);

  // Check if the current player has already submitted a response
  const currentPlayerHasResponded = responses.some(
    (response) => currentPlayer && response.playerId === currentPlayer._id,
  );

  // Reset submission state when the current player changes
  useEffect(() => {
    setHasSubmitted(false);
    setIsSubmitting(false);
  }, [currentPlayer?._id]);

  const handleStartVoting = async () => {
    if (!roomId || !isHost) return;
    try {
      await startVoting();
    } catch (error) {
      console.error("Error starting voting phase:", error);
    }
  };

  const handleSubmitResponse = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !roomId ||
      !playerId ||
      !responseInput.trim() ||
      !currentPlayer ||
      !myPlayer
    )
      return;

    try {
      setIsSubmitting(true);
      // Submit to the backend - this will automatically advance to the next player
      await submitResponse(responseInput.trim());
      setResponseInput("");
      setHasSubmitted(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting response:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Game Round">
      <div className="space-y-6">
        {/* Display topic for non-fakers */}
        <div className="rounded-lg bg-white/20 p-4 text-center">
          <h2 className="mb-2 text-xl font-semibold">Topic</h2>
          {iAmFaker ? (
            <p className="text-lg font-bold text-red-400">
              You are the Faker! Try to figure out the topic!
            </p>
          ) : (
            <p className="text-2xl font-bold">{topic}</p>
          )}
        </div>

        {/* Current player indicator */}
        <div className="rounded-lg bg-white/20 p-4">
          <h2 className="mb-2 text-xl font-semibold">Current Turn</h2>
          {currentPlayer ? (
            <div className="text-center">
              <p className="text-lg">
                {isMyTurn ? (
                  <span className="font-bold text-yellow-300">
                    It's your turn!
                  </span>
                ) : (
                  <span className="font-medium">
                    {currentPlayer.displayName}'s turn
                  </span>
                )}
              </p>

              {isMyTurn && !hasSubmitted && !currentPlayerHasResponded && (
                <form
                  onSubmit={handleSubmitResponse}
                  className="mt-3 space-y-3"
                >
                  <p className="mb-2">
                    Enter an example related to the topic
                    {iAmFaker && " (try to guess what it might be)"}
                  </p>
                  <input
                    type="text"
                    value={responseInput}
                    onChange={(e) => setResponseInput(e.target.value)}
                    placeholder="Your response..."
                    className="w-full rounded-lg border border-white/30 bg-white/20 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={!responseInput.trim() || isSubmitting}
                    className="mt-2"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                  </Button>
                </form>
              )}

              {isMyTurn && (hasSubmitted || currentPlayerHasResponded) && (
                <div className="mt-3">
                  <p className="mb-3">Your answer has been submitted!</p>
                  <p className="text-sm text-yellow-200">
                    Game will automatically continue to the next player...
                  </p>
                </div>
              )}

              {!isMyTurn && (
                <p className="mt-2 text-sm">
                  Waiting for {currentPlayer.displayName} to submit an answer...
                </p>
              )}
            </div>
          ) : (
            <p className="text-center">Loading...</p>
          )}
        </div>

        {/* Responses for this round */}
        <div className="rounded-lg bg-white/20 p-4">
          <h2 className="mb-3 text-xl font-semibold">Responses This Round</h2>
          {responses && responses.length > 0 ? (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {responses.map((response) => (
                <div key={response._id} className="rounded-lg bg-white/10 p-3">
                  <span className="font-medium">{response.playerName}: </span>
                  <span>{response.response}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm">No responses yet</p>
          )}
        </div>

        {/* Player list */}
        <div>
          <h2 className="mb-3 text-xl font-semibold">Players</h2>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {activePlayers.map((player) => {
              // Check if this player has already submitted a response
              const hasResponded = responses.some(
                (response) => response.playerId === player._id,
              );

              return (
                <div
                  key={player._id}
                  className={`flex items-center rounded-lg p-3 ${
                    currentPlayer && currentPlayer._id === player._id
                      ? "bg-indigo-700"
                      : "bg-white/20"
                  }`}
                >
                  <div className="flex-grow font-medium">
                    {player.displayName}
                    {hasResponded && (
                      <span className="ml-2 text-xs text-green-300">
                        (responded)
                      </span>
                    )}
                  </div>
                  {player.isHost && (
                    <span className="rounded-full bg-yellow-500 px-2 py-1 text-xs text-yellow-900">
                      Host
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Host controls */}
        {isHost && (
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-semibold">Host Controls</h2>

            {showConfirm ? (
              <div className="rounded-lg bg-white/20 p-4 text-center">
                <p className="mb-3">
                  Are you sure you want to start the voting phase?
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    onClick={handleStartVoting}
                    className="flex-1"
                  >
                    Yes, Start Voting
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowConfirm(true)}
              >
                End Discussion & Start Voting
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
