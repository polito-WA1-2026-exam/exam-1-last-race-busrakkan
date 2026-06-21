import express from "express";
import morgan from "morgan";
import cors from "cors";

import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import { check, validationResult } from "express-validator";

import {
  initDb, getUser, getNetwork, getSegmentsOnly, getAllStations, getAllSegments, addGame,
  getGame, startPlanning, getLineStationsForStation, submitRoute, completeGameInvalid,
  getInterchangeStationIds, getRanking
} from "./dao.js";

import {
  buildAdjacencyList, findValidStationPairs,
  allSegmentsExist, hasNoDuplicateSegments, startsAtStation, endsAtStation,
  isContinuous, lineChangesAreAtInterchanges
} from "./gameHelpers.js";

const app = express();
const port = 3001;

app.use(express.json());
app.use(morgan("dev"));

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));


passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await getUser(username, password);
  if (!user)
    return cb(null, false, "incorrect username or password");
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "not authorized" });
};

app.use(session({
  secret: "it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate("session"));

//       -routes:

// POST /api/sessions
app.post("/api/sessions", passport.authenticate("local"), function (req, res) {
  return res.status(201).json(req.user);
});

// GET /api/sessions/current
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "not authenticated" });
  }
});

// DELETE /api/sessions/current
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// GET /api/instructions (public, no auth)
app.get("/api/instructions", (req, res) => {
  res.json({
    title: "Game Instructions",
    content: "Last Race begins.. You get to plan your route based on the metro network map, the goal is to reach your destination before time runs out. Some events happen randomly, you lose or win points based on your luck!"
  });
});


// GET /api/network (auth required)
app.get("/api/network", isLoggedIn, async (req, res) => {
  try {
    const network = await getNetwork();
    res.json(network);
  } catch {
    res.status(500).end();
  }
});

// GET /api/network/segments (auth required, no line info)
app.get("/api/network/segments", isLoggedIn, async (req, res) => {
  try {
    const segments = await getSegmentsOnly();
    res.json(segments);
  } catch {
    res.status(500).end();
  }
});

// POST /api/games (start new game)
app.post("/api/games", isLoggedIn, async (req, res) => {
  try {
    const stations = await getAllStations();
    const segments = await getAllSegments();

    const adjacencyList = buildAdjacencyList(stations, segments);
    const validPairs = findValidStationPairs(stations, adjacencyList, 3);

    if (validPairs.length === 0) {
      return res.status(500).json({ error: "no valid station pairs found" });
    }

    const pair = validPairs[Math.floor(Math.random() * validPairs.length)];
    const startId = Math.random() < 0.5 ? pair.stationA : pair.stationB;
    const destId = startId === pair.stationA ? pair.stationB : pair.stationA;

    const gameId = await addGame(req.user.id, startId, destId);

    const startStation = stations.find(station => station.id === startId);
    const destStation = stations.find(station => station.id === destId);

    res.status(201).json({
      id: gameId,
      startingStation: { id: startStation.id, name: startStation.name },
      destinationStation: { id: destStation.id, name: destStation.name },
      minDistance: pair.d,
    });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});


// POST /api/games/:id/start (begin planning)
app.post("/api/games/:id/start", isLoggedIn, async (req, res) => {
  try {
    const game = await getGame(req.params.id);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (game.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
    await startPlanning(req.params.id);
    res.status(200).json({ success: true });
  } catch {
    res.status(500).end();
  }
});


// shared "fail" path: mark the game as invalid (score 0) and send the standard response
async function rejectInvalidRoute(gameId, res) {
  await completeGameInvalid(gameId);
  return res.json({ valid: false, score: 0, message: "Invalid route" });
}

// POST /api/games/:id/route (submit route)
app.post("/api/games/:id/route", isLoggedIn, [
  check("segmentIds").isArray()   // allow empty arrays, treated as invalid route
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const segmentIds = req.body.segmentIds;
    const game = await getGame(req.params.id);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    if (game.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (game.status === 'completed') {
      return res.status(400).json({ valid: false, score: 0, message: "Game already completed" });
    }

    const segments = await getAllSegments();
    const segmentsById = {};
    for (const segment of segments) {
      segmentsById[segment.id] = segment;
    }

    if (segmentIds.length === 0) {
      return rejectInvalidRoute(req.params.id, res);
    }
    if (!allSegmentsExist(segmentIds, segmentsById)) {
      return rejectInvalidRoute(req.params.id, res);
    }
    if (!hasNoDuplicateSegments(segmentIds)) {
      return rejectInvalidRoute(req.params.id, res);
    }

    const startId = game.startingStation;
    const destId = game.destinationStation;
    const firstSegment = segmentsById[segmentIds[0]];
    const lastSegment = segmentsById[segmentIds[segmentIds.length - 1]];

    if (!startsAtStation(firstSegment, startId)) {
      return rejectInvalidRoute(req.params.id, res);
    }
    if (!endsAtStation(lastSegment, destId)) {
      return rejectInvalidRoute(req.params.id, res);
    }
    if (!isContinuous(segmentIds, segmentsById)) {
      return rejectInvalidRoute(req.params.id, res);
    }

    const interchangeStationIds = await getInterchangeStationIds();
    if (!lineChangesAreAtInterchanges(segmentIds, segmentsById, interchangeStationIds)) {
      return rejectInvalidRoute(req.params.id, res);
    }

    const lineIds = segmentIds.map(id => segmentsById[id].line_id);
    const result = await submitRoute(req.params.id, segmentIds, lineIds);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

// GET /api/ranking (auth required)
app.get("/api/ranking", isLoggedIn, async (req, res) => {
  try {
    const ranking = await getRanking();
    res.json(ranking);
  } catch {
    res.status(500).end();
  }
});

initDb().then(() => {
  app.listen(port, () => { console.log(`API server started at http://localhost:${port}`) });
});