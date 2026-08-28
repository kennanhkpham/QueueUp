// In-Memory App State (Can be migrated to Redis/Postgres)
const state = {
  queue: [],
  courts: { 1: [], 2: [], 3: [], 4: [], 5: [] },
  numCourts: 5,
};

function initializeQueue() {
  return state;
}

function clearQueue() {
  state.queue = [];
  Object.keys(state.courts).forEach((c) => (state.courts[c] = []));
  return state;
}

function updateCourtsCount(newCount) {
  state.numCourts = newCount;
  for (let i = 1; i <= newCount; i++) {
    if (!state.courts[i]) state.courts[i] = [];
  }
  Object.keys(state.courts).forEach((c) => {
    if (parseInt(c) > newCount) {
      state.queue = [...state.courts[c], ...state.queue];
      delete state.courts[c];
    }
  });
  return state;
}

function findMatchForSkill(skillLevel) {
  const candidates = state.queue.filter((e) => e.skill === skillLevel);

  // 1. Direct match: Group of 4
  const g4 = candidates.find((e) => e.count === 4);
  if (g4) return [g4];

  // 2. Group of 3 + Solo (1)
  const g3 = candidates.find((e) => e.count === 3);
  const g1 = candidates.find((e) => e.count === 1);
  if (g3 && g1) return [g3, g1];

  // 3. Two Groups of 2 OR Group of 2 + Two Solos
  const g2List = candidates.filter((e) => e.count === 2);
  const g1List = candidates.filter((e) => e.count === 1);

  if (g2List.length >= 2) return g2List.slice(0, 2);
  if (g2List.length >= 1 && g1List.length >= 2) return [g2List[0], ...g1List.slice(0, 2)];

  // 4. Four Solos
  if (g1List.length >= 4) return g1List.slice(0, 4);

  return null;
}

function assignNextGroupToCourt(courtNum) {
  if (state.queue.length === 0) return false;

  const skills = ["Beginner", "Intermediate", "Advanced"];
  for (const skill of skills) {
    const matchedGroups = findMatchForSkill(skill);
    if (matchedGroups) {
      matchedGroups.forEach((entry) => {
        const idx = state.queue.findIndex((e) => e.name === entry.name && e.skill === entry.skill);
        if (idx !== -1) state.queue.splice(idx, 1);
      });
      state.courts[courtNum] = matchedGroups;
      return true;
    }
  }
  return false;
}

function finishCourtMatch(courtNum) {
  state.courts[courtNum] = [];
  assignNextGroupToCourt(courtNum);
  return state;
}

module.exports = {
  state,
  initializeQueue,
  clearQueue,
  updateCourtsCount,
  assignNextGroupToCourt,
  finishCourtMatch,
};