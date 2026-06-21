import { Container, Button } from "react-bootstrap";
import useGame from "../hooks/useGame";
import NetworkMap from "./Map.jsx";
import StationsOnlyMap from "./StationsOnlyMap.jsx";
import Timer from "./Timer.jsx";
import SegmentPicker from "./SegmentPicker.jsx";
import RouteBuilder from "./RouteBuilder.jsx";

function Game() {
  const {
    phase, game, network, segments, selectedSegments,
    steps, currentStep, score, displayedCoins,
    startNewGame, beginPlanningPhase, addSegment, removeSegment,
    submitMyRoute, advanceStep, reset
  } = useGame();

  if (!game && phase === 'setup') {
    return (
      <Container className="mt-4 text-center">
        <h2>Last Race</h2>
        <Button variant="primary" size="lg" className="mt-3" onClick={() => startNewGame()}>
          Play
        </Button>
      </Container>
    );
  }

  if (phase === 'setup' && network) {
    return (
      <Container className="mt-3 d-flex flex-column" style={{ flex: 1, minHeight: 0 }}>
        <h3>Setup</h3>
        <p><strong>From:</strong> {game.startingStation.name} &rarr; <strong>To:</strong> {game.destinationStation.name}</p>
        <p className="text-muted">Study the map. Click Ready when you are prepared.</p>
        <div style={{ flexGrow: 1, minHeight: 0 }}>
          <NetworkMap lines={network.lines} stations={network.stations} segments={network.segments} />
        </div>
        <div className="text-center mt-3">
          <Button variant="success" size="lg" onClick={() => beginPlanningPhase()}>Ready</Button>
        </div>
      </Container>
    );
  }

  if (phase === 'planning') {
    return (
      <Container className="mt-3 d-flex flex-column" style={{ flex: 1, minHeight: 0 }}>
        <Timer onTimeout={submitMyRoute} />

        <div className="row mt-2" style={{ flex: 1, minHeight: 0 }}>
          <div className="col-md-8 d-flex flex-column" style={{ minHeight: 0 }}>
            <h3>Planning</h3>
            <p><strong>From:</strong> {game.startingStation.name} &rarr; <strong>To:</strong> {game.destinationStation.name}</p>
            <div style={{ flexGrow: 1, minHeight: 0 }}>
              <StationsOnlyMap stations={network.stations} />
            </div>
          </div>
          <div className="col-md-4">
            <SegmentPicker segments={segments} selectedSegments={selectedSegments} onAdd={addSegment} />
          </div>
        </div>

        <RouteBuilder segments={selectedSegments} onRemove={removeSegment} />

        <div className="text-center mt-3 mb-4">
          <Button variant="primary" size="lg" onClick={submitMyRoute} disabled={selectedSegments.length === 0}>
            Submit Route
          </Button>
        </div>
      </Container>
    );
  }

  if (phase === 'execution') {
    return (
      <Container className="mt-3 text-center">
        <h3>Execution</h3>
        <p>Coins: {displayedCoins}</p>
        <p className="text-muted">Step display coming soon.</p>
        {currentStep < steps.length - 1 && (
          <Button variant="primary" onClick={advanceStep}>Next</Button>
        )}
        {currentStep === steps.length - 1 && steps.length > 0 && (
          <Button variant="success" onClick={advanceStep}>See Result</Button>
        )}
      </Container>
    );
  }

  if (phase === 'result') {
    return (
      <Container className="mt-3 text-center">
        <h3>Result</h3>
        <p>Final score: {score}</p>
        <Button variant="primary" size="lg" onClick={() => startNewGame()}>
          New Game
        </Button>
      </Container>
    );
  }

  return <Container className="mt-4"><p>Loading...</p></Container>;
}

export default Game;