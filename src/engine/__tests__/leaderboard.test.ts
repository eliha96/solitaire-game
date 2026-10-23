import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadLeaderboard,
  recordGameResult,
  saveLeaderboard,
} from '../leaderboard';

describe('Leaderboard Engine', () => {
  beforeEach(() => {
    // Clear leaderboard before each test
    saveLeaderboard({
      topScores: [],
      recentGames: [],
      allTimeHighScore: 0,
    });
  });

  it('records initial game as new all-time high score and rank 1', () => {
    const outcome = recordGameResult(500, 120, 45, 1, 'relaxed');
    expect(outcome.isNewRecord).toBe(true);
    expect(outcome.rank).toBe(1);
    expect(outcome.allTimeHighScore).toBe(500);

    const data = loadLeaderboard();
    expect(data.topScores).toHaveLength(1);
    expect(data.topScores[0].score).toBe(500);
    expect(data.recentGames).toHaveLength(1);
  });

  it('correctly ranks scores and limits topScores to 5', () => {
    recordGameResult(100, 60, 30, 1, 'relaxed');
    recordGameResult(300, 70, 40, 1, 'relaxed');
    recordGameResult(200, 80, 50, 1, 'relaxed');
    recordGameResult(500, 90, 60, 1, 'relaxed');
    recordGameResult(400, 100, 70, 1, 'relaxed');

    // 6th game with score 50 (should NOT make top 5)
    const lowOutcome = recordGameResult(50, 110, 80, 1, 'relaxed');
    expect(lowOutcome.rank).toBe(null);
    expect(lowOutcome.isNewRecord).toBe(false);

    // 7th game with score 350 (should be rank 3)
    const midOutcome = recordGameResult(350, 100, 55, 1, 'relaxed');
    expect(midOutcome.rank).toBe(3);
    expect(midOutcome.isNewRecord).toBe(false);

    const data = loadLeaderboard();
    expect(data.topScores).toHaveLength(5);
    expect(data.topScores.map((s) => s.score)).toEqual([500, 400, 350, 300, 200]);
    expect(data.allTimeHighScore).toBe(500);
  });

  it('detects new record correctly', () => {
    recordGameResult(500, 100, 50, 1, 'relaxed');
    const newRecord = recordGameResult(650, 90, 45, 1, 'relaxed');
    expect(newRecord.isNewRecord).toBe(true);
    expect(newRecord.rank).toBe(1);
    expect(newRecord.allTimeHighScore).toBe(650);
  });
});
