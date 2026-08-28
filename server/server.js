const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const queue = require("./queueLogic");
const timer = require("./timerLogic");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Broadcast state updates to all connected web and mobile clients
function broadcastState() {
  io.emit("stateUpdate", {
    state: queue.state,
    timers: timer.courtTimers,
    enableTimeLimits: timer.enableTimeLimits,
    expiredCourts: timer.checkExpiredTimers(),
  });
}

io.on("connection", (socket) => {
  socket.emit("stateUpdate", {
    state: queue.state,
    timers: timer.courtTimers,
    enableTimeLimits: timer.enableTimeLimits,
    expiredCourts: timer.checkExpiredTimers(),
  });

  socket.on("joinQueue", (playerData) => {
    queue.state.queue.push(playerData);
    broadcastState();
  });

  socket.on("finishMatch", (courtNum) => {
    timer.stopCourtTimer(courtNum);
    queue.finishCourtMatch(courtNum);
    broadcastState();
  });

  socket.on("fillCourt", (courtNum) => {
    queue.assignNextGroupToCourt(courtNum);
    broadcastState();
  });

  socket.on("startTimer", ({ courtNum, duration }) => {
    timer.setCourtTimer(courtNum, duration);
    broadcastState();
  });

  socket.on("stopTimer", (courtNum) => {
    timer.stopCourtTimer(courtNum);
    broadcastState();
  });

  socket.on("clearQueue", () => {
    queue.clearQueue();
    timer.resetAllTimers();
    broadcastState();
  });

  socket.on("toggleTimeLimits", (enabled) => {
    timer.setEnableTimeLimits(enabled);
    broadcastState();
  });

  socket.on("updateCourtsCount", (count) => {
    queue.updateCourtsCount(count);
    broadcastState();
  });
});

// Interval to push background timer updates every second without reloading UI
setInterval(() => {
  const expired = timer.checkExpiredTimers();
  if (expired.length > 0) {
    broadcastState();
  }
}, 1000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));