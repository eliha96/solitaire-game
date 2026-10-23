// Leaderboard storage and score management for Solitaire Classic

export interface LeaderboardEntry {
  id: string;
  score: number;
  date: string; // Formatted date e.g. "23/10/2026 19:25"
  timestamp: number;
  elapsedSeconds: number;
  movesCount: number;
  drawCount: 1 | 3;
  scoringMode: 'relaxed' | 'standard';
  isAllTimeRecord?: boolean;
}

export interface LeaderboardData {
  topScores: LeaderboardEntry[]; // Top 5 best scores
  recentGames: LeaderboardEntry[]; // Last 5 completed games
  allTimeHighScore: number;
}

const LEADERBOARD_KEY = 'solitaire_classic_leaderboard_v1';

export function getFormattedDate(date: Date = new Date()): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  const hr = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${d}/${m}/${y} ${hr}:${min}`;
}

let memoryStore: LeaderboardData = {
  topScores: [],
  recentGames: [],
  allTimeHighScore: 0,
};

export function loadLeaderboard(): LeaderboardData {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryStore = {
          topScores: Array.isArray(parsed.topScores) ? parsed.topScores.slice(0, 5) : [],
          recentGames: Array.isArray(parsed.recentGames) ? parsed.recentGames.slice(0, 5) : [],
          allTimeHighScore: typeof parsed.allTimeHighScore === 'number' ? parsed.allTimeHighScore : 0,
        };
        return memoryStore;
      }
    }
  } catch (e) {
    console.error('Failed to load leaderboard', e);
  }

  return memoryStore;
}

export function saveLeaderboard(data: LeaderboardData): void {
  memoryStore = {
    topScores: [...data.topScores],
    recentGames: [...data.recentGames],
    allTimeHighScore: data.allTimeHighScore,
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Failed to save leaderboard', e);
  }
}

export interface RecordResultOutcome {
  rank: number | null; // 1 to 5 if made it to top 5, otherwise null
  isNewRecord: boolean;
  allTimeHighScore: number;
  entry: LeaderboardEntry;
}

/**
 * Records a game win result into the leaderboard, updates top 5 and recent games,
 * and checks if an all-time record or top 5 placement was achieved.
 */
export function recordGameResult(
  score: number,
  elapsedSeconds: number,
  movesCount: number,
  drawCount: 1 | 3,
  scoringMode: 'relaxed' | 'standard'
): RecordResultOutcome {
  const currentData = loadLeaderboard();
  const previousRecord = currentData.allTimeHighScore;
  const isNewRecord = score > 0 && score > previousRecord;

  const entry: LeaderboardEntry = {
    id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    score,
    date: getFormattedDate(),
    timestamp: Date.now(),
    elapsedSeconds,
    movesCount,
    drawCount,
    scoringMode,
    isAllTimeRecord: isNewRecord,
  };

  // 1. Update Recent Games (keep last 5)
  const updatedRecent = [entry, ...currentData.recentGames].slice(0, 5);

  // 2. Update Top 5 Scores
  const combined = [...currentData.topScores, entry];
  // Sort descending by score; on tie, sort by shorter time
  combined.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.elapsedSeconds - b.elapsedSeconds;
  });

  const top5 = combined.slice(0, 5);
  const rankIndex = top5.findIndex((item) => item.id === entry.id);
  const rank = rankIndex !== -1 ? rankIndex + 1 : null;

  const newHighScore = Math.max(previousRecord, score);

  saveLeaderboard({
    topScores: top5,
    recentGames: updatedRecent,
    allTimeHighScore: newHighScore,
  });

  return {
    rank,
    isNewRecord,
    allTimeHighScore: newHighScore,
    entry,
  };
}
