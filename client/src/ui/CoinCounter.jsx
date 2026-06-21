function CoinCounter({ coins }) {
  return (
    <div className="my-2">
      <span className="fw-bold" style={{ fontSize: '32px' }}>{coins}</span>
      <span className="text-muted ms-2">coins</span>
    </div>
  );
}

export default CoinCounter;