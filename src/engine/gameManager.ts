import type { Card, GameSettings, GameState, MoveRecord } from './types';
import { generateInitialTableauAndStock, VERIFIED_WINNABLE_SEEDS } from './deck';
import { canAutoComplete, canPlaceOnFoundation, canPlaceOnTableau, isGameWon } from './rules';
import type { MoveDestination } from './solver';


const STORAGE_KEY = 'solitaire_classic_saved_game_v1';
const SETTINGS_KEY = 'solitaire_classic_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  drawCount: 1,
  scoringMode: 'relaxed',
  soundEnabled: true,
  hapticsEnabled: true,
  cardBack: 'classic-blue',
  cardFaceTheme: 'windows95',
  autoCompletePrompt: true,
};



export function loadSavedSettings(): GameSettings {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Sanitize theme to only windows95 or standard
        if (parsed.cardFaceTheme !== 'windows95' && parsed.cardFaceTheme !== 'standard') {
          parsed.cardFaceTheme = 'windows95';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to load settings from storage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: GameSettings) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}


export function createNewGame(
  customSettings?: Partial<GameSettings>,
  forceWinnable = true,
  customSeed?: number
): GameState {
  const settings = { ...DEFAULT_SETTINGS, ...(customSettings || loadSavedSettings()) };

  let seed = customSeed;
  if (seed === undefined && forceWinnable) {
    const randomIndex = Math.floor(Math.random() * VERIFIED_WINNABLE_SEEDS.length);
    seed = VERIFIED_WINNABLE_SEEDS[randomIndex];
  }

  const { tableau, stock } = generateInitialTableauAndStock(seed);

  const state: GameState = {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    score: 0,
    movesCount: 0,
    startTime: null,
    elapsedSeconds: 0,
    isWon: false,
    stockPassCount: 0,
    settings,
    history: [],
    isAutoCompleting: false,
    dealSeed: seed,
  };

  saveGameStateToStorage(state);
  return state;
}

function cloneCard(c: Card): Card {
  return { ...c };
}

function snapshotPiles(state: GameState): MoveRecord['previousState'] {
  return {
    stock: state.stock.map(cloneCard),
    waste: state.waste.map(cloneCard),
    foundations: state.foundations.map((f) => f.map(cloneCard)),
    tableau: state.tableau.map((col) => col.map(cloneCard)),
    score: state.score,
    stockPassCount: state.stockPassCount,
  };
}

export function drawCards(state: GameState): GameState {
  if (state.isWon) return state;

  const snapshot = snapshotPiles(state);
  const now = Date.now();
  const startTime = state.startTime ?? now;

  // Case 1: Draw cards from stock to waste
  if (state.stock.length > 0) {
    const drawAmount = Math.min(state.settings.drawCount, state.stock.length);
    const newStock = [...state.stock];
    const newWaste = [...state.waste];

    for (let i = 0; i < drawAmount; i++) {
      const drawnCard = newStock.pop()!;
      drawnCard.isFaceUp = true;
      newWaste.push(drawnCard);
    }

    const nextState: GameState = {
      ...state,
      stock: newStock,
      waste: newWaste,
      startTime,
      movesCount: state.movesCount + 1,
      history: [
        ...state.history,
        {
          description: `שליפת ${drawAmount} קלף/ים מהקופה`,
          pointsDelta: 0,
          previousState: snapshot,
        },
      ],
    };
    saveGameStateToStorage(nextState);
    return nextState;
  }

  // Case 2: Stock is empty -> recycle Waste back into Stock!
  if (state.waste.length > 0) {
    // When recycling, Waste is turned back over in reverse order without shuffling
    const newStock: Card[] = [...state.waste].reverse().map((c) => ({
      ...c,
      isFaceUp: false,
    }));
    const newPassCount = state.stockPassCount + 1;

    let pointsDelta = 0;
    if (state.settings.scoringMode === 'standard') {
      if (state.settings.drawCount === 1 && newPassCount >= 1) {
        pointsDelta = -100;
      } else if (state.settings.drawCount === 3 && newPassCount >= 3) {
        pointsDelta = -20;
      }
    }

    const nextScore = Math.max(0, state.score + pointsDelta);

    const nextState: GameState = {
      ...state,
      stock: newStock,
      waste: [],
      score: nextScore,
      stockPassCount: newPassCount,
      startTime,
      movesCount: state.movesCount + 1,
      history: [
        ...state.history,
        {
          description: 'איפוס קופה מהפסולת',
          pointsDelta,
          previousState: snapshot,
        },
      ],
    };
    saveGameStateToStorage(nextState);
    return nextState;
  }

  return state;
}

export function executeMove(
  state: GameState,
  source: {
    pile: 'waste' | 'tableau' | 'foundation';
    colIndex?: number;
    cardIndex?: number;
    foundationIndex?: number;
  },
  destination: MoveDestination
): GameState {
  if (state.isWon) return state;

  const snapshot = snapshotPiles(state);
  const now = Date.now();
  const startTime = state.startTime ?? now;

  let movingCards: Card[] = [];
  const newWaste = [...state.waste];
  const newFoundations: [Card[], Card[], Card[], Card[]] = [
    [...state.foundations[0]],
    [...state.foundations[1]],
    [...state.foundations[2]],
    [...state.foundations[3]],
  ];
  const newTableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]] = [
    [...state.tableau[0]],
    [...state.tableau[1]],
    [...state.tableau[2]],
    [...state.tableau[3]],
    [...state.tableau[4]],
    [...state.tableau[5]],
    [...state.tableau[6]],
  ];

  let pointsDelta = 0;

  // Extract moving cards from source
  if (source.pile === 'waste') {
    if (newWaste.length === 0) return state;
    movingCards = [newWaste.pop()!];
    if (destination.type === 'foundation') pointsDelta += 10;
    if (destination.type === 'tableau') pointsDelta += 5;
  } else if (source.pile === 'foundation') {
    const fIdx = source.foundationIndex!;
    if (newFoundations[fIdx].length === 0) return state;
    movingCards = [newFoundations[fIdx].pop()!];
    if (destination.type === 'tableau') {
      pointsDelta = state.settings.scoringMode === 'standard' ? -15 : 0;
    }
  } else if (source.pile === 'tableau') {
    const cIdx = source.colIndex!;
    const cardIdx = source.cardIndex!;
    const col = newTableau[cIdx];
    movingCards = col.slice(cardIdx);
    newTableau[cIdx] = col.slice(0, cardIdx);

    // If there is a face-down card now exposed in this column, flip it!
    if (newTableau[cIdx].length > 0) {
      const topRemaining = newTableau[cIdx][newTableau[cIdx].length - 1];
      if (!topRemaining.isFaceUp) {
        topRemaining.isFaceUp = true;
        pointsDelta += 5;
      }
    }

    if (destination.type === 'foundation') {
      pointsDelta += 10;
    }
  }

  if (movingCards.length === 0) return state;

  // Place cards on destination
  if (destination.type === 'foundation') {
    // Only 1 card can go to foundation at a time
    if (movingCards.length !== 1) return state;
    if (!canPlaceOnFoundation(newFoundations[destination.index], movingCards[0])) {
      return state;
    }
    newFoundations[destination.index].push(movingCards[0]);
  } else if (destination.type === 'tableau') {
    const targetCol = newTableau[destination.index];
    const targetTop = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;
    if (!canPlaceOnTableau(targetTop, movingCards[0])) {
      return state;
    }
    targetCol.push(...movingCards);
  }

  const nextScore = Math.max(0, state.score + pointsDelta);
  const won = isGameWon(newFoundations);

  const nextState: GameState = {
    ...state,
    waste: newWaste,
    foundations: newFoundations,
    tableau: newTableau,
    score: nextScore,
    startTime,
    movesCount: state.movesCount + 1,
    isWon: won,
    history: [
      ...state.history,
      {
        description: 'העברת קלף',
        pointsDelta,
        previousState: snapshot,
      },
    ],
  };

  saveGameStateToStorage(nextState);
  return nextState;
}

export function undoMove(state: GameState): GameState {
  if (state.history.length === 0 || state.isWon) return state;

  const lastMove = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);

  const nextState: GameState = {
    ...state,
    stock: lastMove.previousState.stock.map(cloneCard),
    waste: lastMove.previousState.waste.map(cloneCard),
    foundations: [
      lastMove.previousState.foundations[0].map(cloneCard),
      lastMove.previousState.foundations[1].map(cloneCard),
      lastMove.previousState.foundations[2].map(cloneCard),
      lastMove.previousState.foundations[3].map(cloneCard),
    ],
    tableau: [
      lastMove.previousState.tableau[0].map(cloneCard),
      lastMove.previousState.tableau[1].map(cloneCard),
      lastMove.previousState.tableau[2].map(cloneCard),
      lastMove.previousState.tableau[3].map(cloneCard),
      lastMove.previousState.tableau[4].map(cloneCard),
      lastMove.previousState.tableau[5].map(cloneCard),
      lastMove.previousState.tableau[6].map(cloneCard),
    ],
    score: lastMove.previousState.score,
    stockPassCount: lastMove.previousState.stockPassCount,
    movesCount: Math.max(0, state.movesCount - 1),
    history: newHistory,
  };

  saveGameStateToStorage(nextState);
  return nextState;
}

/**
 * Executes a single auto-complete step.
 * Returns true if a card was moved, or false if nothing could be moved.
 */
export function executeAutoCompleteStep(state: GameState): { nextState: GameState; moved: boolean } {
  if (!canAutoComplete(state) && !state.isAutoCompleting) {
    return { nextState: state, moved: false };
  }

  // Look for the lowest card in tableau that can move to foundations
  for (let cIdx = 0; cIdx < 7; cIdx++) {
    const col = state.tableau[cIdx];
    if (col.length > 0) {
      const topCard = col[col.length - 1];
      for (let fIdx = 0; fIdx < 4; fIdx++) {
        if (canPlaceOnFoundation(state.foundations[fIdx], topCard)) {
          const next = executeMove(
            { ...state, isAutoCompleting: true },
            { pile: 'tableau', colIndex: cIdx, cardIndex: col.length - 1 },
            { type: 'foundation', index: fIdx }
          );
          return { nextState: { ...next, isAutoCompleting: true }, moved: true };
        }
      }
    }
  }

  return { nextState: { ...state, isAutoCompleting: false }, moved: false };
}

export function saveGameStateToStorage(state: GameState) {
  try {
    if (typeof localStorage === 'undefined') return;
    const serialized = {
      stock: state.stock,
      waste: state.waste,
      foundations: state.foundations,
      tableau: state.tableau,
      score: state.score,
      movesCount: state.movesCount,
      elapsedSeconds: state.elapsedSeconds,
      isWon: state.isWon,
      stockPassCount: state.stockPassCount,
      settings: state.settings,
      dealSeed: state.dealSeed,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (e) {
    console.error('Failed to save game state to storage', e);
  }
}

export function loadGameStateFromStorage(): GameState | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      stock: data.stock,
      waste: data.waste,
      foundations: data.foundations,
      tableau: data.tableau,
      score: data.score,
      movesCount: data.movesCount,
      startTime: null,
      elapsedSeconds: data.elapsedSeconds || 0,
      isWon: data.isWon || false,
      stockPassCount: data.stockPassCount || 0,
      settings: data.settings || loadSavedSettings(),
      history: [],
      isAutoCompleting: false,
      dealSeed: data.dealSeed,
    };
  } catch (e) {
    console.error('Failed to restore saved game', e);
    return null;
  }
}

