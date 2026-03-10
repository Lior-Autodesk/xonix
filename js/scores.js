'use strict';

const SCORES_KEY = 'xonix_scores';
const MAX_SCORES = 10;

function getScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveScore(name, score, level) {
  const scores = getScores();
  const entry = {
    name: (name || 'אנונימי').trim().slice(0, 10),
    score,
    level,
    date: new Date().toLocaleDateString('he-IL')
  };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores.splice(MAX_SCORES);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  return scores;
}

function isTopScore(score) {
  const scores = getScores();
  if (scores.length < MAX_SCORES) return true;
  return score > scores[scores.length - 1].score;
}

function clearScores() {
  localStorage.removeItem(SCORES_KEY);
}
