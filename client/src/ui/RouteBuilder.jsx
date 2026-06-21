function RouteBuilder({ segments, onRemove }) {
  return (
    <div className="mt-3">
      <h6>Your Route</h6>
      {segments.length === 0 && <p className="text-muted">No segments selected yet.</p>}
      <ol className="list-group list-group-numbered">
        {segments.map((segment, index) => (
          <li key={segment.id} className="list-group-item d-flex justify-content-between align-items-center">
            {segment.station1} &rarr; {segment.station2}
            <button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(index)}>&times;</button>
          </li>
        ))}
      </ol>
    </div>
  );
}
export default RouteBuilder;