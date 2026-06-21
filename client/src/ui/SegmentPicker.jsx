function SegmentPicker({ segments, selectedSegments, onAdd }) {
  const selectedSegmentIds = selectedSegments.map(s => s.id);
  return (
    <div className="border rounded p-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <h6>Segments</h6>
      {segments.map((segment) => {
        const isSelected = selectedSegmentIds.includes(segment.id);
        return (
          <div key={segment.id}
            className={'p-1 mb-1 rounded ' + (isSelected ? 'bg-primary text-white' : 'bg-light')}
            style={{ cursor: isSelected ? 'default' : 'pointer', fontSize: '13px' }}
            onClick={() => { if (!isSelected) onAdd(segment); }}>
            {segment.station1} &mdash; {segment.station2}
          </div>
        );
      })}
    </div>
  );
}
export default SegmentPicker;