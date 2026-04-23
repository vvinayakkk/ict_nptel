export const STORAGE_KEY = "nptel_prep_state_v2";

export function shuffleIndices(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Assignment-wise order: questions in original assignment order
export function orderByAssignment(n) {
  return Array.from({ length: n }, (_, i) => i);
}

// Random within each assignment: shuffle the indices inside each assignment group
export function shuffleWithinAssignment(data) {
  const groups = {};
  data.forEach((q, i) => {
    const a = q.assignment ?? 1;
    if (!groups[a]) groups[a] = [];
    groups[a].push(i);
  });
  const result = [];
  Object.keys(groups)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((a) => {
      const indices = [...groups[a]];
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      result.push(...indices);
    });
  return result;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}
