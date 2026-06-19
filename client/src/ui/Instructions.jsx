import { Container } from "react-bootstrap"

function InstructionsPage() {
  return (
    <Container className="mt-4">
      <h2>How to Play</h2>
      <p>
        You'll be assigned a starting station and a destination somewhere in the underground network.
        During the planning phase, you have 90 seconds to reconstruct your route from a list of station
        pairs and submit it before time runs out.
      </p>
      <p>
        Once submitted, your journey begins. Random events along the way will add or subtract coins from
        your total of 20. Reach your destination with as many coins as possible to set a high score!
      </p>
      <p>
        Log in to play and check your best score on the general ranking.
      </p>
    </Container>
  )
}

export default InstructionsPage