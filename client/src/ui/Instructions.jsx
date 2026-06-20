import { Container, Accordion } from "react-bootstrap"
import instructionsLogo from '../assets/instructions.png';
import playIcon from '../assets/play.png';
import rulesIcon from '../assets/rules.png';

function InstructionsPage() {
  return (
    <Container className="mt-4">
      <div className="title-with-icon">
        <img src={instructionsLogo} alt="Instructions Icon" className="title-logo" />
        <h3 className="game-instructions-title">Game Instructions</h3>
      </div>

      <p>Welcome to Last Race! Plan your route through the underground network and reach your destination before time runs out. Random events may help or hinder you along the way.</p>

      <Accordion defaultActiveKey="0" className="mb-3">
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <div className="title-with-icon" style={{ marginBottom: 0 }}>
              <img src={playIcon} alt="Play" className="title-logo" />
              <span>How to Play</span>
            </div>
          </Accordion.Header>
          <Accordion.Body>
            <ul>
              <li><strong>Setup:</strong> Study the network map with all stations, lines, and connections. Click "Ready" when you are prepared.</li>
              <li><strong>Planning:</strong> You have 90 seconds to build a route from your assigned starting station to your destination. Select segments from the list, each segment can be used only once. The map shows only station names (no lines).</li>
              <li><strong>Execution:</strong> Your route is validated. For each step, a random event occurs. You may gain or lose coins. If your route is invalid, you lose all 20 coins.</li>
              <li><strong>Result:</strong> Your final score is shown. Try to get the highest score possible!</li>
            </ul>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1">
          <Accordion.Header>
            <div className="title-with-icon" style={{ marginBottom: 0 }}>
              <img src={rulesIcon} alt="Rules" className="title-logo" />
              <span>Rules</span>
            </div>
          </Accordion.Header>
          <Accordion.Body>
            <ul>
              <li>You start with 20 coins.</li>
              <li>Line changes are only allowed at interchange stations (stations served by more than one line).</li>
              <li>Reaching the same station more than once is allowed, but no segment may be used more than once.</li>
              <li>If the final score is negative, it will be shown as zero.</li>
            </ul>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <p className="text-muted">Log in to play and compete in the ranking!</p>
    </Container>
  )
}

export default InstructionsPage