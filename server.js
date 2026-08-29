const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // fine for a small community test; tighten if this grows up
});

app.use(express.static(path.join(__dirname, "public")));

// In-memory room store. Simple on purpose: state resets if the server
// restarts, and there's no move validation (clients are trusted). Both are
// fine for a friendly playtest; harden before this is a public product.
const rooms = {}; // code -> { state: {...} }
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function genCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  } while (rooms[code]);
  return code;
}

io.on("connection", (socket) => {
  socket.on("room:create", (initialState, cb) => {
    const code = genCode();
    rooms[code] = { state: initialState };
    socket.join(code);
    socket.data.roomCode = code;
    cb && cb({ ok: true, code, state: rooms[code].state });
  });

  socket.on("room:join", (code, cb) => {
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false, error: "not_found" });
    socket.join(code);
    socket.data.roomCode = code;
    cb && cb({ ok: true, state: room.state });
  });

  // Atomically claims the open second seat. Only the FIRST claim attempt for a
  // given room ever succeeds — this is what actually closes the race (a client
  // merely checking "is the seat empty?" before dealing is not enough, since two
  // near-simultaneous checks can both see it as empty).
  socket.on("room:claim", (code, cb) => {
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false, error: "not_found" });
    socket.join(code);
    socket.data.roomCode = code;
    if (room.state.phase === "LOBBY" && !room.state.names[1] && !room.claimed) {
      room.claimed = true;
      cb && cb({ ok: true, claimed: true, state: room.state });
    } else {
      cb && cb({ ok: true, claimed: false, state: room.state });
    }
  });

  socket.on("room:update", ({ code, state }) => {
    if (!rooms[code]) rooms[code] = { state };
    else rooms[code].state = state;
    // broadcast to everyone else in the room; sender already has this state locally
    socket.to(code).emit("room:state", state);
  });

  socket.on("disconnect", () => {
    // rooms are intentionally left alive on disconnect so a dropped player
    // can always rejoin with the code later (per the "can they rejoin" behavior)
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Choice Hold'em server listening on :${PORT}`));
