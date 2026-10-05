// Learner state, kept in localStorage until Stage 5 moves it to the backend.
// Survives reloads; each browser has its own.

// v2: IDs are database UUIDs from Stage 2 (v1 held Stage 1 mock IDs and is left untouched).
const STORAGE_KEY = "ala.learner.v2";

function emptyState() {
  return {
    device_id: crypto.randomUUID(),
    saved: {}, // card_id -> saved_at
    attempts: {}, // card_id -> { selected_index, is_correct, answered_at }
    seen: {}, // concept_id -> [card positions]
    completed: {}, // concept_id -> completed_at
    resume: {}, // curriculum_id -> { node_id, card_position }
    last_curriculum_id: null,
    updated_at: new Date().toISOString(),
  };
}

let memoryState = null;

export function readLearner() {
  if (memoryState) return memoryState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memoryState = raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    memoryState = emptyState();
  }
  return memoryState;
}

// Applies a change and returns a new snapshot (never mutates the old one,
// so React sees a new object).
export function updateLearner(change) {
  const next = change(structuredClone(readLearner()));
  next.updated_at = new Date().toISOString();
  memoryState = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, quota): state lives in memory only.
  }
  return next;
}
