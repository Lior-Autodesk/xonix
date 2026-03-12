'use strict';

const FIREBASE_URL = 'https://xonix-924b9-default-rtdb.firebaseio.com';
const MAX_SCORES = 10;

async function getScores() {
  try {
    const res = await fetch(`${FIREBASE_URL}/scores.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];
    return Object.values(data)
      .filter(s => s && typeof s.score === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SCORES);
  } catch {
    return [];
  }
}

async function saveScore(name, score, level) {
  const entry = {
    name: (name || 'אנונימי').trim().slice(0, 10),
    score,
    level,
    date: new Date().toLocaleDateString('he-IL')
  };
  try {
    const res  = await fetch(`${FIREBASE_URL}/scores.json`);
    const data = res.ok ? await res.json() : null;

    const all = data ? Object.values(data).filter(s => s && typeof s.score === 'number') : [];
    all.push(entry);
    all.sort((a, b) => b.score - a.score);
    const top = all.slice(0, MAX_SCORES);

    await fetch(`${FIREBASE_URL}/scores.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(top)
    });
  } catch {
    // fail silently if offline
  }
}

async function isTopScore(score) {
  const scores = await getScores();
  if (scores.length < MAX_SCORES) return true;
  return score > scores[scores.length - 1].score;
}
