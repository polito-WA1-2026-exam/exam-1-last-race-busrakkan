import { Card } from "react-bootstrap";

function ScoreDisplay({ score }) {
  return (
    <Card className="mt-3 mx-auto" style={{ maxWidth: '400px' }}>
      <Card.Body className="text-center">
        <Card.Title>Final Score</Card.Title>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: score > 0 ? '#2ecc71' : '#e74c3c' }}>
          {score}
        </div>
        <Card.Text className="text-muted">coins</Card.Text>
      </Card.Body>
    </Card>
  );
}

export default ScoreDisplay;