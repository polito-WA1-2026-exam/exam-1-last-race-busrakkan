import { Table } from "react-bootstrap";

function Leaderboard({ rankingEntries }) {
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>#</th>
          <th>Username</th>
          <th>Best Score</th>
          <th>Games Played</th>
        </tr>
      </thead>
      <tbody>
        {rankingEntries.map(entry => (
          <tr key={entry.rank}>
            <td>{entry.rank}</td>
            <td>{entry.username}</td>
            <td>{entry.bestScore}</td>
            <td>{entry.gamesPlayed}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default Leaderboard;