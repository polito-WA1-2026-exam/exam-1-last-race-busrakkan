import sqlite from "sqlite3";
import crypto from "crypto";

const db = new sqlite.Database("database.sqlite");

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 32, (err, hash) => {
      if (err) reject(err);
      resolve({ hash: hash.toString("hex"), salt });
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });
}

const lines = [
  { name: "BubbleGum Line", color: "#F50CA0" },
  { name: "Blues Line", color: "#1F51FF" },
  { name: "Acid Line", color: "#44D62C" },
  { name: "Flash Line", color: "#FDFF00" },
  { name: "Plum Line", color: "#8A00C4" },
];

const stations = [
  "Fermi", "Paradiso", "Marche", "Massaua",
  "Pozzo Strada", "Monte Grappa", "Rivoli", "Racconigi",
  "Bernini", "Principi d'Acaja", "XVIII Dicembre", "Porta Susa",
  "Vinzaglio", "Re Umberto",
];

const lineStationData = [
  { line: 0, stations: [0, 1, 2, 3, 4] },
  { line: 1, stations: [1, 5, 6, 7, 8] },
  { line: 2, stations: [2, 5, 9, 10] },
  { line: 3, stations: [4, 7, 11] },
  { line: 4, stations: [3, 6, 12, 13] },
];

const events = [
  { description: "No events, safe ride", effect: 0 },
  { description: "Delay, you're late to work", effect: -2 },
  { description: "Empty seat, you get to sit", effect: 1 },
  { description: "Lost ticket, fined..", effect: -3 },
  { description: "Train arrives on time", effect: 2 },
  { description: "Train breakdown, late to work", effect: -1 },
  { description: "Stranger give you seat, kind!", effect: 2 },
  { description: "Pickpocket! wallet gone..", effect: -4 },
  { description: "Free tickets, you get a pass!", effect: 3 },
  { description: "Sciopero! walk home", effect: -3 },
];

async function seed() {

  await run("DELETE FROM games");
  await run("DELETE FROM segments");
  await run("DELETE FROM line_stations");
  await run("DELETE FROM stations");
  await run("DELETE FROM lines");
  await run("DELETE FROM events");
  await run("DELETE FROM users");

  for (const l of lines) {
    await run("INSERT INTO lines (name, color) VALUES (?, ?)", [l.name, l.color]);
  }

  for (const s of stations) {
    await run("INSERT INTO stations (name) VALUES (?)", [s]);
  }

  for (const ls of lineStationData) {
    for (let i = 0; i < ls.stations.length; i++) {
      await run("INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)",
        [ls.line + 1, ls.stations[i] + 1, i]);
    }
  }

  for (const ls of lineStationData) {
    for (let i = 0; i < ls.stations.length - 1; i++) {
      await run(
        "INSERT INTO segments (station1_id, station2_id, line_id) VALUES (?, ?, ?)",
        [ls.stations[i] + 1, ls.stations[i + 1] + 1, ls.line + 1]
      );
    }
  }

  for (const e of events) {
    await run("INSERT INTO events (description, effect) VALUES (?, ?)", [e.description, e.effect]);
  }

  const users = [
    { username: "Rachel", password: "password_rachel" },
    { username: "Monica", password: "password_monica" },
    { username: "Ross", password: "password_ross" },
  ];

  for (const u of users) {
    const { hash, salt } = await hashPassword(u.password);
    await run(
      "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
      [u.username, hash, salt]
    );
  }

  await run("INSERT INTO games (user_id, status, score) VALUES (1, 'completed', 22)");
  await run("INSERT INTO games (user_id, status, score) VALUES (1, 'completed', 14)");
  await run("INSERT INTO games (user_id, status, score) VALUES (2, 'completed', 18)");
  console.log("seed completed");
}

seed().catch(err => console.error("seed error:", err));