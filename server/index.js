import express from "express";
import morgan from "morgan";
import cors from "cors";

import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import { initDb, getUser } from "./dao.js";

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
    title: "Last Race - Game Instructions",
    content: "Last Race begins.. You get to plan your route based on the metro network map, the goal is to reach your destination before time runs out. Some events happen randomly, you lose or win points based on your luck!"
  });
});



initDb().then(() => {
  app.listen(port, () => { console.log(`API server started at http://localhost:${port}`) });
});