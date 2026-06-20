// temporary test script 

const BASE_URL = "http://localhost:3001";

let cookie = null;

function logResult(label, passed, details = "") {
  const status = passed ? "PASS" : "FAIL";
  console.log(`[${status}] ${label}${details ? " - " + details : ""}`);
  if (!passed) process.exitCode = 1;
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;

  const response = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];

  let data = null;
  try {
    data = await response.json();
  } catch {
    // some responses have no body
  }

  return { status: response.status, data };
}

async function login(username, password) {
  const { status, data } = await request("POST", "/api/sessions", { username, password });
  logResult(`login as ${username}`, status === 201, `status=${status}`);
  return data;
}

async function createGame() {
  const { status, data } = await request("POST", "/api/games");
  logResult("create game", status === 201 && data?.minDistance >= 3, `status=${status} minDistance=${data?.minDistance}`);
  return data;
}

async function startPlanning(gameId) {
  const { status, data } = await request("POST", `/api/games/${gameId}/start`);
  logResult(`start planning (game ${gameId})`, status === 200 && data?.success === true, `status=${status}`);
}

async function submitRoute(gameId, segmentIds, expectedValid, expectedStatus = 200) {
  const { status, data } = await request("POST", `/api/games/${gameId}/route`, { segmentIds });
  const passed = status === expectedStatus && data?.valid === expectedValid;
  logResult(
    `submit route [${segmentIds.join(",")}] (game ${gameId})`,
    passed,
    `status=${status} valid=${data?.valid} score=${data?.score} message=${data?.message ?? ""}`
  );
  return data;
}

async function fetchNetwork() {
  const { status, data } = await request("GET", "/api/network");
  logResult("fetch network", status === 200 && Array.isArray(data?.segments), `status=${status}`);
  return data;
}

// find a connected path (list of segment ids) between two station ids using BFS over the network
function findPathSegments(network, startId, destId) {
  const segmentsByStationPair = new Map();
  const adjacency = {};
  for (const station of network.stations) adjacency[station.id] = [];

  const stationIdByName = {};
  for (const station of network.stations) stationIdByName[station.name] = station.id;

  for (const segment of network.segments) {
    const a = stationIdByName[segment.station1];
    const b = stationIdByName[segment.station2];
    adjacency[a].push({ to: b, segmentId: segment.id });
    adjacency[b].push({ to: a, segmentId: segment.id });
  }

  const visited = new Set([startId]);
  const queue = [{ stationId: startId, path: [] }];

  while (queue.length > 0) {
    const { stationId, path } = queue.shift();
    if (stationId === destId) return path;

    for (const edge of adjacency[stationId]) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push({ stationId: edge.to, path: [...path, edge.segmentId] });
      }
    }
  }
  return null;
}

async function run() {
  console.log("=== Last Race API test ===\n");

  await login("Rachel", "password_rachel");

  // test 1: valid route, correct scoring
  const network = await fetchNetwork();
  const game1 = await createGame();
  await startPlanning(game1.id);

  const path = findPathSegments(network, game1.startingStation.id, game1.destinationStation.id);
  if (!path) {
    logResult("find valid path for game 1", false, "no path found - check network connectivity");
  } else {
    const result = await submitRoute(game1.id, path, true);
    const mathChecksOut = result?.steps?.every(s => s.coinsAfter === s.coinsBefore + s.event.effect);
    logResult("scoring math is consistent", mathChecksOut);
  }

  // test 2: empty route 
  const game2 = await createGame();
  await startPlanning(game2.id);
  await submitRoute(game2.id, [], false);

  // test 3: duplicate segment
  const game3 = await createGame();
  await startPlanning(game3.id);
  await submitRoute(game3.id, [1, 1], false);

  // test 4: resubmitting a completed game
  await submitRoute(game3.id, [1, 2, 3], false, 400);

  // test 5: unauthenticated request is rejected 
  const savedCookie = cookie;
  cookie = null;
  const { status: unauthStatus } = await request("POST", "/api/games");
  logResult("unauthenticated request rejected", unauthStatus === 401, `status=${unauthStatus}`);
  cookie = savedCookie;

  console.log("\n Done ");
}

run().catch(err => {
  console.error("Test run crashed:", err);
  process.exitCode = 1;
});