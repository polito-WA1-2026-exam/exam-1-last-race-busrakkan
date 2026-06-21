import { Button, Container } from "react-bootstrap"
import { useNavigate } from "react-router"

function HomePage() {
  const navigate = useNavigate()

  return (
    <Container className="mt-4 text-center">
      <h1>Last Race</h1>
      <p className="lead">Navigate the underground network and reach your destination!</p>
      <Button variant="primary" size="lg" onClick={() => navigate('/play')}>Play</Button>
      <div className="mt-3">
        <Button variant="outline-secondary" onClick={() => navigate('/ranking')}>Ranking</Button>
      </div>
    </Container>
  )
}

export default HomePage