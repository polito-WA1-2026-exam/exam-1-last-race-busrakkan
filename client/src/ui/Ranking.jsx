import { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { getRanking } from "../api/api";
import Leaderboard from "./Leaderboard.jsx";

function Ranking() {
  const [rankingEntries, setRankingEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRanking().then(data => {
      setRankingEntries(data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Container className="mt-4"><p>Loading ranking...</p></Container>;

  return (
    <Container className="mt-4">
      <h3>Ranking</h3>
      {rankingEntries.length === 0 ? (
        <p className="text-muted">No games have been played yet.</p>
      ) : (
        <Leaderboard rankingEntries={rankingEntries} />
      )}
    </Container>
  );
}

export default Ranking;