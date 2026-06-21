import { Card } from "react-bootstrap";

function StepDisplay({ step, stepNumber, totalSteps }) {
  const effect = step.event.effect;
  const effectColor = effect > 0 ? 'text-success' : effect < 0 ? 'text-danger' : 'text-muted';
  const effectSign = effect > 0 ? '+' : '';

  return (
    <Card className="mt-3 mx-auto" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <Card.Subtitle className="mb-2 text-muted">Step {stepNumber} of {totalSteps}</Card.Subtitle>
        <Card.Title>{step.event.description}</Card.Title>
        <Card.Text>
          Effect: <span className={effectColor}>{effectSign}{effect} coins</span>
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

export default StepDisplay;