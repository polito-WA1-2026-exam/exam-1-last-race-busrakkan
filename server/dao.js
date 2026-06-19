import sqlite from "sqlite3";
import crypto from "crypto";

const db = new sqlite.Database("database.sqlite");

export function initDb() {
  return new Promise((resolve) => {
    db.serialize(() => {
      db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)");
      db.run("CREATE TABLE IF NOT EXISTS lines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, color TEXT NOT NULL)");
      db.run("CREATE TABLE IF NOT EXISTS stations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL)");
      db.run("CREATE TABLE IF NOT EXISTS line_stations (id INTEGER PRIMARY KEY AUTOINCREMENT, line_id INTEGER REFERENCES lines(id), station_id INTEGER REFERENCES stations(id), position INTEGER NOT NULL)");
      db.run("CREATE TABLE IF NOT EXISTS segments (id INTEGER PRIMARY KEY AUTOINCREMENT, station1_id INTEGER REFERENCES stations(id), station2_id INTEGER REFERENCES stations(id), line_id INTEGER REFERENCES lines(id), UNIQUE(station1_id, station2_id, line_id))");
      db.run("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT NOT NULL, effect INTEGER NOT NULL CHECK(effect >= -4 AND effect <= 4))");
      db.run("CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id) NOT NULL, status TEXT NOT NULL DEFAULT 'planning', starting_station_id INTEGER REFERENCES stations(id), destination_station_id INTEGER REFERENCES stations(id), coins INTEGER DEFAULT 20, score INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, planning_started_at TEXT, submitted_at TEXT, completed_at TEXT)");
      db.run("CREATE TABLE IF NOT EXISTS game_route_segments (id INTEGER PRIMARY KEY AUTOINCREMENT, game_id INTEGER REFERENCES games(id), segment_id INTEGER REFERENCES segments(id), line_id INTEGER REFERENCES lines(id) NOT NULL, position INTEGER NOT NULL)");
      db.run("CREATE TABLE IF NOT EXISTS game_step_events (id INTEGER PRIMARY KEY AUTOINCREMENT, game_id INTEGER REFERENCES games(id), segment_position INTEGER NOT NULL, event_id INTEGER REFERENCES events(id), coins_before INTEGER, coins_after INTEGER)", resolve);
    });
  });
}

export function getUser(username, password) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [username], (err, row) => {
      if (err) { reject(err); }
      else if (row === undefined) { resolve(false); }
      else {
        crypto.scrypt(password, row.salt, 32, (err, hashed) => {
          if (err) reject(err);
          if (!crypto.timingSafeEqual(Buffer.from(row.password_hash, "hex"), hashed))
            resolve(false);
          else
            resolve({ id: row.id, username: row.username });
        });
      }
    });
  });
}

export function getNetwork() {
  return new Promise((resolve, reject) => {
    const network = { lines: [], stations: [], segments: [] };

    db.all("SELECT * FROM lines", [], (err, lines) => {
      if (err) { reject(err); return; }

      db.all("SELECT * FROM stations", [], (err, stations) => {
        if (err) { reject(err); return; }

        let doneCount = 0;
        for (let i = 0; i < stations.length; i++) {
          db.all("SELECT line_id FROM line_stations WHERE station_id = ?", [stations[i].id], (err, ls) => {
            if (err) reject(err);
            const isInterchange = ls.length >= 2;
            network.stations.push({ id: stations[i].id, name: stations[i].name, isInterchange });
            doneCount++;
            if (doneCount === stations.length + lines.length) resolve(network);
          });
        }

        for (const line of lines) {
          db.all(
            "SELECT s.id, s.name FROM line_stations ls JOIN stations s ON ls.station_id = s.id WHERE ls.line_id = ? ORDER BY ls.position",
            [line.id],
            (err, sts) => {
              if (err) reject(err);
              network.lines.push({ id: line.id, name: line.name, color: line.color, stations: sts });
              doneCount++;
              if (doneCount === stations.length + lines.length) resolve(network);
            }
          );
        }

        db.all(
          "SELECT seg.id, s1.name AS station1, s2.name AS station2, l.name AS line FROM segments seg JOIN stations s1 ON seg.station1_id = s1.id JOIN stations s2 ON seg.station2_id = s2.id JOIN lines l ON seg.line_id = l.id",
          [],
          (err, segs) => {
            if (err) reject(err);
            network.segments = segs.map(s => ({ id: s.id, station1: s.station1, station2: s.station2, line: s.line }));
          }
        );
      });
    });
  });
}

export function getSegmentsOnly() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT seg.id, s1.name AS station1, s2.name AS station2 FROM segments seg JOIN stations s1 ON seg.station1_id = s1.id JOIN stations s2 ON seg.station2_id = s2.id";
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      resolve({ segments: rows.map(r => ({ id: r.id, station1: r.station1, station2: r.station2 })) });
    });
  });
}


export function getAllStations() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM stations", [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
}


export function getAllSegments() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM segments", [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
}

export function addGame(userId, startId, destId) {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO games (user_id, status, starting_station_id, destination_station_id) VALUES (?, 'planning', ?, ?)";
    db.run(sql, [userId, startId, destId], function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });
}