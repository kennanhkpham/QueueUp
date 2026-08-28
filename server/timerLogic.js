const courtTimers = {};
let enableTimeLimits = false;

function setEnableTimeLimits(enabled) {
  enableTimeLimits = enabled;
}

function setCourtTimer(courtNum, durationMinutes) {
  courtTimers[courtNum] = {
    startTime: Date.now(),
    durationSeconds: durationMinutes * 60,
    active: true,
    dismissed: false,
  };
}

function stopCourtTimer(courtNum) {
  if (courtTimers[courtNum]) {
    courtTimers[courtNum].active = false;
  }
}

function checkExpiredTimers() {
  const expiredCourts = [];
  if (!enableTimeLimits) return expiredCourts;

  const now = Date.now();
  Object.keys(courtTimers).forEach((courtNum) => {
    const timer = courtTimers[courtNum];
    if (timer && timer.active && !timer.dismissed) {
      const elapsed = (now - timer.startTime) / 1000;
      if (elapsed >= timer.durationSeconds) {
        expiredCourts.push(courtNum);
      }
    }
  });
  return expiredCourts;
}

function dismissTimerAlert(courtNum) {
  if (courtTimers[courtNum]) {
    courtTimers[courtNum].dismissed = true;
  }
}

function resetAllTimers() {
  Object.keys(courtTimers).forEach((c) => delete courtTimers[c]);
}

module.exports = {
  courtTimers,
  enableTimeLimits,
  setEnableTimeLimits,
  setCourtTimer,
  stopCourtTimer,
  checkExpiredTimers,
  dismissTimerAlert,
  resetAllTimers,
};