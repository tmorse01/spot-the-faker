import { ConvexProvider, ConvexReactClient } from "convex/react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useRoomStore } from "./stores/useRoomStore";

// Import components
import Home from "./components/Home/Home";
import Lobby from "./components/Lobby/Lobby";
import GameRound from "./components/GameRound/GameRound";
import VotingPhase from "./components/VotingPhase/VotingPhase";
import ResultsScreen from "./components/ResultsScreen/ResultsScreen";
import { useGameStore } from "./stores/useGameStore";
import { useRoom } from "./hooks/useRoom";

// Initialize the Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Component to handle redirects based on game phase
function GamePhaseRouter() {
  const { roomId } = useRoomStore();
  const { currentPhase } = useGameStore();

  // Use the room hook to sync with Convex
  useRoom();

  if (!roomId) {
    return <Navigate to="/" />;
  }

  switch (currentPhase) {
    case "lobby":
      return <Lobby />;
    case "game":
      return <GameRound />;
    case "voting":
      return <VotingPhase />;
    case "results":
      return <ResultsScreen />;
    default:
      return <Navigate to="/" />;
  }
}

function App() {
  return (
    <ConvexProvider client={convex}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<GamePhaseRouter />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ConvexProvider>
  );
}

export default App;
