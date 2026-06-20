import express from "express";
import morgan from "morgan";
import cors from "cors";

import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import { initDb, getUser, getNetwork, getSegmentsOnly, getAllStations, getAllSegments, addGame,
  getGame, startPlanning
 } from "./dao.js";

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

//  routes:

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

    // BFS to find shortest path distances between all station pairs
    const adj = {};
    for (const s of stations) {
      adj[s.id] = [];
    }
    for (const seg of segments) {
      adj[seg.station1_id].push(seg.station2_id);
      adj[seg.station2_id].push(seg.station1_id);
    }

    function bfs(start) {
      const dist = {};
      for (const s of stations) dist[s.id] = Infinity;
      dist[start] = 0;
      const q = [start];
      while (q.length > 0) {
        const cur = q.shift();
        for (const nb of adj[cur]) {
          if (dist[nb] === Infinity) {
            dist[nb] = dist[cur] + 1;
            q.push(nb);
          }
        }
      }
      return dist;
    }

    const allPairs = [];
    for (let i = 0; i < stations.length; i++) {
      allPairs.push(bfs(stations[i].id));
    }

    // find pairs with distance >= 3
    const validPairs = [];
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const d = allPairs[i][stations[j].id];
        if (d >= 3 && d < Infinity) {
          validPairs.push({ a: stations[i].id, b: stations[j].id, d });
        }
      }
    }

    if (validPairs.length === 0) {
      return res.status(500).json({ error: "No valid station pairs found" });
    }

    const pair = validPairs[Math.floor(Math.random() * validPairs.length)];
    const startId = Math.random() < 0.5 ? pair.a : pair.b;
    const destId = startId === pair.a ? pair.b : pair.a;

    const gameId = await addGame(req.user.id, startId, destId);

    const startStation = stations.find(s => s.id === startId);
    const destStation = stations.find(s => s.id === destId);

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


initDb().then(() => {
  app.listen(port, () => { console.log(`API server started at http://localhost:${port}`) });
});