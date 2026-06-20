import { HouseDoorFill } from "react-bootstrap-icons";

const positions = {
  "Fermi": [40, 80],
  "Paradiso": [100, 80],
  "Marche": [160, 80],
  "Massaua": [220, 80],
  "Pozzo Strada": [280, 80],
  "Monte Grappa": [160, 140],
  "Rivoli": [220, 140],
  "Racconigi": [280, 140],
  "Bernini": [340, 140],
  "Principi d'Acaja": [160, 200],
  "XVIII Dicembre": [240, 200],
  "Vinzaglio": [220, 200],
  "Re Umberto": [280, 200],
  "Porta Susa": [340, 200],
};

const labelOffsets = {
  "Fermi": { dx: 8, dy: -4 },
  "Paradiso": { dx: 8, dy: -4 },
  "Marche": { dx: 8, dy: -4 },
  "Massaua": { dx: 8, dy: -4 },
  "Pozzo Strada": { dx: 8, dy: -4 },
  "Monte Grappa": { dx: 8, dy: 5 },
  "Rivoli": { dx: 8, dy: 5 },
  "Racconigi": { dx: 8, dy: 5 },
  "Bernini": { dx: 8, dy: 5 },
  "Principi d'Acaja": { dx: 8, dy: -6 },
  "XVIII Dicembre": { dx: 8, dy: 5 },
  "Vinzaglio": { dx: -8, dy: 4 },
  "Re Umberto": { dx: 8, dy: 5 },
  "Porta Susa": { dx: 8, dy: 5 },
};

function NetworkMap({ lines, stations, segments }) {
  const lineColors = {};
  for (const line of lines) {
    lineColors[line.name] = line.color;
  }

  const sortStationNames = (a, b) => (a > b ? [b, a] : [a, b]);
  const drawnSegments = new Set();

  return (
    <div className="p-2" style={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', height: '100%' }}>
      <svg viewBox="20 65 360 160" preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}>
          {segments.map((segment) => {
            const fromPosition = positions[segment.station1];
            const toPosition = positions[segment.station2];
            if (!fromPosition || !toPosition) return null;
            const key = sortStationNames(segment.station1, segment.station2).join('-');
            if (drawnSegments.has(key)) return null;
            drawnSegments.add(key);
            return (
              <line key={segment.id} x1={fromPosition[0]} y1={fromPosition[1]} x2={toPosition[0]} y2={toPosition[1]}
                stroke={lineColors[segment.line] || '#888'} strokeWidth="1" />
            );
          })}

          {stations.map((station) => {
            const position = positions[station.name];
            if (!position) return null;
            const iconSize = station.isInterchange ? 9 : 6;
            const halfIconSize = iconSize / 2;
            const offset = labelOffsets[station.name] || { dx: 8, dy: 2 };
            const labelAnchor = offset.dx < 0 ? "end" : "start";
            return (
              <g key={station.id}>
                {station.isInterchange && (
                  <circle cx={position[0]} cy={position[1]} r={halfIconSize + 0.5} fill="none" stroke="#fff" strokeWidth="0.8" />
                )}
                <g transform={`translate(${position[0] - halfIconSize}, ${position[1] - halfIconSize})`}>
                  <HouseDoorFill color="white" size={iconSize} />
                </g>
                <text
                  x={position[0] + offset.dx}
                  y={position[1] + offset.dy}
                  fontSize="4"
                  fill="#fff"
                  textAnchor={labelAnchor}
                >{station.name}</text>
              </g>
            );
          })}
        </svg>
    </div>
  );
}

export default NetworkMap;