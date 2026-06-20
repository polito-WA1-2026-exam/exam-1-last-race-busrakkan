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
      if (err) return reject(err);
      if (row === undefined) return resolve(false);

      crypto.scrypt(password, row.salt, 32, (err, hashed) => {
        if (err) return reject(err);
        if (!crypto.timingSafeEqual(Buffer.from(row.password_hash, "hex"), hashed))
          return resolve(false);
        resolve({ id: row.id, username: row.username });
      });
    });
  });
}

export function getNetwork() {
  const stationsWithInterchangeQuery = new Promise((resolve, reject) => {
    db.all("SELECT * FROM stations", [], (err, stations) => {
      if (err) return reject(err);

      const perStation = stations.map(station => new Promise((res, rej) => {
        db.all("SELECT line_id FROM line_stations WHERE station_id = ?", [station.id], (err, lineIdRows) => {
          if (err) return rej(err);
          res({ id: station.id, name: station.name, isInterchange: lineIdRows.length >= 2 });
        });
      }));

      Promise.all(perStation).then(resolve).catch(reject);
    });
  });

  const linesWithStationsQuery = new Promise((resolve, reject) => {
    db.all("SELECT * FROM lines", [], (err, lines) => {
      if (err) return reject(err);

      const perLine = lines.map(line => new Promise((res, rej) => {
        db.all(
          "SELECT s.id, s.name FROM line_stations ls JOIN stations s ON ls.station_id = s.id WHERE ls.line_id = ? ORDER BY ls.position",
          [line.id],
          (err, lineStations) => {
            if (err) return rej(err);
            res({ id: line.id, name: line.name, color: line.color, stations: lineStations });
          }
        );
      }));

      Promise.all(perLine).then(resolve).catch(reject);
    });
  });

  const segmentsQuery = new Promise((resolve, reject) => {
    db.all(
      "SELECT seg.id, s1.name AS station1, s2.name AS station2, l.name AS line FROM segments seg JOIN stations s1 ON seg.station1_id = s1.id JOIN stations s2 ON seg.station2_id = s2.id JOIN lines l ON seg.line_id = l.id",
      [],
      (err, segments) => {
        if (err) return reject(err);
        resolve(segments.map(segment => ({ id: segment.id, station1: segment.station1, station2: segment.station2, line: segment.line })));
      }
    );
  });

  return Promise.all([stationsWithInterchangeQuery, linesWithStationsQuery, segmentsQuery])
    .then(([stations, lines, segments]) => ({ lines, stations, segments }));
}

export function getSegmentsOnly() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT seg.id, s1.name AS station1, s2.name AS station2 FROM segments seg JOIN stations s1 ON seg.station1_id = s1.id JOIN stations s2 ON seg.station2_id = s2.id";
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve({ segments: rows.map(row => ({ id: row.id, station1: row.station1, station2: row.station2 })) });
    });
  });
}

export function getAllStations() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM stations", [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export function getAllSegments() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM segments", [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export function addGame(userId, startId, destId) {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO games (user_id, status, starting_station_id, destination_station_id) VALUES (?, 'planning', ?, ?)";
    db.run(sql, [userId, startId, destId], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
}

export function startPlanning(gameId) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE games SET planning_started_at = datetime('now') WHERE id = ?", [gameId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function getLineStationsForStation(stationId) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM line_stations WHERE station_id = ?", [stationId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// it's a DB access function so it belongs here not in gameHelpers.js
export async function getInterchangeStationIds() {
  const stations = await getAllStations();

  const interchangeIds = [];
  for (const station of stations) {
    const lineStations = await getLineStationsForStation(station.id);
    if (lineStations.length >= 2) {
      interchangeIds.push(station.id);
    }
  }

  return interchangeIds;
}

export function submitRoute(gameId, segmentIds, lineIds) {
  return new Promise((resolve, reject) => {
    const gameSql = "UPDATE games SET submitted_at = datetime('now') WHERE id = ?";
    db.run(gameSql, [gameId], function (err) {
      if (err) return reject(err);

      const stmt = db.prepare("INSERT INTO game_route_segments (game_id, segment_id, line_id, position) VALUES (?, ?, ?, ?)");
      for (let i = 0; i < segmentIds.length; i++) {
        stmt.run([gameId, segmentIds[i], lineIds[i], i]);
      }
      stmt.finalize((err) => {
        if (err) return reject(err);

        db.all("SELECT * FROM events", [], (err, events) => {
          if (err) return reject(err);

          let coins = 20;
          const steps = [];
          const stepStmt = db.prepare("INSERT INTO game_step_events (game_id, segment_position, event_id, coins_before, coins_after) VALUES (?, ?, ?, ?, ?)");

          for (let i = 0; i < segmentIds.length; i++) {
            const event = events[Math.floor(Math.random() * events.length)];
            const before = coins;
            coins = coins + event.effect;   // no flooring here. intermediate values can be negative
            steps.push({ coinsBefore: before, coinsAfter: coins, event });
            stepStmt.run([gameId, i, event.id, before, coins]);
          }

          stepStmt.finalize((err) => {
            if (err) return reject(err);

            const score = Math.max(0, coins);   // floor only the final score
            db.run(
              "UPDATE games SET status = 'completed', score = ?, completed_at = datetime('now') WHERE id = ?",
              [score, gameId],
              (err) => {
                if (err) return reject(err);
                resolve({ valid: true, score, steps });
              }
            );
          });
        });
      });
    });
  });
}

export function completeGameInvalid(gameId) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE games SET status = 'completed', score = 0, completed_at = datetime('now') WHERE id = ?",
      [gameId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

export function getGame(gameId) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM games WHERE id = ?";
    db.get(sql, [gameId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);

      db.all(
        "SELECT s1.name AS from_station, s2.name AS to_station, l.name AS line, se.station1_id, se.station2_id, grs.position FROM game_route_segments grs JOIN segments se ON grs.segment_id = se.id JOIN stations s1 ON se.station1_id = s1.id JOIN stations s2 ON se.station2_id = s2.id JOIN lines l ON grs.line_id = l.id WHERE grs.game_id = ? ORDER BY grs.position",
        [gameId],
        (err, routeSegments) => {
          if (err) return reject(err);

          db.all(
            "SELECT gse.*, e.description, e.effect FROM game_step_events gse JOIN events e ON gse.event_id = e.id WHERE gse.game_id = ? ORDER BY gse.segment_position",
            [gameId],
            (err, steps) => {
              if (err) return reject(err);
              resolve({
                id: row.id,
                user_id: row.user_id,
                status: row.status,
                startingStation: row.starting_station_id,
                destinationStation: row.destination_station_id,
                coins: row.coins,
                score: row.score,
                route: routeSegments,
                steps: steps.map(step => ({
                  coinsBefore: step.coins_before,
                  coinsAfter: step.coins_after,
                  event: { description: step.description, effect: step.effect },
                })),
              });
            }
          );
        }
      );
    });
  });
}