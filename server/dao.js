import sqlite from "sqlite3";

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

