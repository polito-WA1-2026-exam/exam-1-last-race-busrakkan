// pure functions. no database access, no Express



//      -station graph / BFS helpers (used by POST /api/games)-

// build an undirected adjacency list { stationId: [neighborStationId, ...] }
export function buildAdjacencyList(stations, segments) {
  const adjacencyList = {};
  for (const station of stations) {
    adjacencyList[station.id] = [];
  }
  for (const segment of segments) {
    adjacencyList[segment.station1_id].push(segment.station2_id);
    adjacencyList[segment.station2_id].push(segment.station1_id);
  }
  return adjacencyList;
}

// BFS shortest-path distances (in segments) from one station to every other station
export function bfsDistancesFrom(startStationId, stations, adjacencyList) {
  const distances = {};
  for (const station of stations) distances[station.id] = Infinity;
  distances[startStationId] = 0;

  const queue = [startStationId];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const neighbor of adjacencyList[current]) {
      if (distances[neighbor] === Infinity) {
        distances[neighbor] = distances[current] + 1;
        queue.push(neighbor);
      }
    }
  }
  return distances;
}

// every unordered station pair whose shortest-path distance is >= minSegments
export function findValidStationPairs(stations, adjacencyList, minSegments) {
  const distancesFromEach = stations.map(station => bfsDistancesFrom(station.id, stations, adjacencyList));

  const validPairs = [];
  for (let i = 0; i < stations.length; i++) {
    for (let j = i + 1; j < stations.length; j++) {
      const distance = distancesFromEach[i][stations[j].id];
      if (distance >= minSegments && distance < Infinity) {
        validPairs.push({ stationA: stations[i].id, stationB: stations[j].id, d: distance });
      }
    }
  }
  return validPairs;
}

//      -route validation helpers (used by POST /api/games/:id/route)-

// every submitted segment id must reference a real segment
export function allSegmentsExist(segmentIds, segmentsById) {
  return segmentIds.every(id => segmentsById[id]);
}

// no segment may be used twice
export function hasNoDuplicateSegments(segmentIds) {
  return new Set(segmentIds).size === segmentIds.length;
}

// the route's first segment must touch the assigned starting station
export function startsAtStation(firstSegment, startId) {
  return firstSegment.station1_id === startId || firstSegment.station2_id === startId;
}

// the route's last segment must touch the assigned destination station
export function endsAtStation(lastSegment, destId) {
  return lastSegment.station1_id === destId || lastSegment.station2_id === destId;
}

// the station shared between two consecutive segments (or null if they don't connect)
export function sharedStation(segmentA, segmentB) {
  if (segmentA.station1_id === segmentB.station1_id || segmentA.station1_id === segmentB.station2_id) {
    return segmentA.station1_id;
  }
  if (segmentA.station2_id === segmentB.station1_id || segmentA.station2_id === segmentB.station2_id) {
    return segmentA.station2_id;
  }
  return null;
}

// every consecutive pair of segments must connect at a shared station
export function isContinuous(segmentIds, segmentsById) {
  for (let i = 1; i < segmentIds.length; i++) {
    const prev = segmentsById[segmentIds[i - 1]];
    const current = segmentsById[segmentIds[i]];
    if (sharedStation(prev, current) === null) return false;
  }
  return true;
}

// whenever the line changes between consecutive segments, the junction must be an interchange
export function lineChangesAreAtInterchanges(segmentIds, segmentsById, interchangeStationIds) {
  for (let i = 1; i < segmentIds.length; i++) {
    const prev = segmentsById[segmentIds[i - 1]];
    const current = segmentsById[segmentIds[i]];
    if (prev.line_id === current.line_id) continue;

    const junction = sharedStation(prev, current);
    if (!interchangeStationIds.includes(junction)) return false;
  }
  return true;
}