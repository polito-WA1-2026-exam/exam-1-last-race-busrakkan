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
  "XVIII Dicembre": [100, 200],
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

function StationsOnlyMap({ stations }) {
  return (
    <div className="p-2" style={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', height: '100%' }}>
      <svg viewBox="20 65 360 160" preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}>
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

export default StationsOnlyMap;