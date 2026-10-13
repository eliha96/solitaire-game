import type { Card, GameState } from './types';
import { canPlaceOnFoundation, canPlaceOnTableau } from './rules';

export interface MoveDestination {
  type: 'foundation' | 'tableau';
  index: number; // foundationIndex (0-3) or colIndex (0-6)
}

export interface HintMove {
  fromDescription: string;
  toDescription: string;
  source: {
    pile: 'waste' | 'tableau';
    colIndex?: number;
    cardIndex?: number;
  };
  target: MoveDestination;
}

/**
 * Finds the smartest, most logical destination for a tapped card (Tap-to-Move algorithm).
 */
export function findBestMoveForTappedCard(
  gameState: GameState,
  card: Card,
  sourcePile: 'waste' | 'tableau' | 'foundation',
  sourceColIndex?: number,
  sourceCardIndex?: number
): MoveDestination | null {
  if (!card.isFaceUp) return null;

  // Case 1: If it's from Waste or the single topmost card in a Tableau column,
  // priority #1 is ALWAYS moving to Foundation!
  const isTopmostInTableau =
    sourcePile === 'tableau' &&
    sourceColIndex !== undefined &&
    sourceCardIndex !== undefined &&
    sourceCardIndex === gameState.tableau[sourceColIndex].length - 1;

  if (sourcePile === 'waste' || isTopmostInTableau) {
    for (let fIdx = 0; fIdx < 4; fIdx++) {
      if (canPlaceOnFoundation(gameState.foundations[fIdx], card)) {
        return { type: 'foundation', index: fIdx };
      }
    }
  }

  // Case 2: Try to move to a non-empty Tableau column
  for (let cIdx = 0; cIdx < 7; cIdx++) {
    if (sourcePile === 'tableau' && sourceColIndex === cIdx) continue; // Same column

    const targetCol = gameState.tableau[cIdx];
    if (targetCol.length > 0) {
      const targetTopCard = targetCol[targetCol.length - 1];
      if (canPlaceOnTableau(targetTopCard, card)) {
        return { type: 'tableau', index: cIdx };
      }
    }
  }

  // Case 3: If card is a King (rank 13), try to move to an EMPTY Tableau column
  if (card.rank === 13) {
    // Crucial UX check: If it's already in Tableau at cardIndex 0 and there are NO face-down cards to reveal,
    // moving it to another empty column does nothing useful.
    if (sourcePile === 'tableau' && sourceCardIndex === 0) {
      return null;
    }

    for (let cIdx = 0; cIdx < 7; cIdx++) {
      if (sourcePile === 'tableau' && sourceColIndex === cIdx) continue;
      if (gameState.tableau[cIdx].length === 0) {
        return { type: 'tableau', index: cIdx };
      }
    }
  }

  return null;
}

/**
 * Finds any available legal move on the board to provide a gentle hint to the player.
 */
export function findHint(gameState: GameState): HintMove | null {
  // 1. Check Waste card to Foundation
  if (gameState.waste.length > 0) {
    const wasteCard = gameState.waste[gameState.waste.length - 1];
    for (let fIdx = 0; fIdx < 4; fIdx++) {
      if (canPlaceOnFoundation(gameState.foundations[fIdx], wasteCard)) {
        return {
          fromDescription: 'מהקופה',
          toDescription: `לערימת היעד ${fIdx + 1}`,
          source: { pile: 'waste' },
          target: { type: 'foundation', index: fIdx },
        };
      }
    }
  }

  // 2. Check Tableau topmost cards to Foundation
  for (let cIdx = 0; cIdx < 7; cIdx++) {
    const col = gameState.tableau[cIdx];
    if (col.length > 0) {
      const topCard = col[col.length - 1];
      for (let fIdx = 0; fIdx < 4; fIdx++) {
        if (canPlaceOnFoundation(gameState.foundations[fIdx], topCard)) {
          return {
            fromDescription: `מטור ${cIdx + 1}`,
            toDescription: `לערימת היעד ${fIdx + 1}`,
            source: { pile: 'tableau', colIndex: cIdx, cardIndex: col.length - 1 },
            target: { type: 'foundation', index: fIdx },
          };
        }
      }
    }
  }

  // 3. Check Tableau runs that can reveal hidden cards by moving to another column
  for (let cIdx = 0; cIdx < 7; cIdx++) {
    const col = gameState.tableau[cIdx];
    // Find first face-up card in column
    const firstFaceUpIdx = col.findIndex((c) => c.isFaceUp);
    if (firstFaceUpIdx !== -1) {
      // If there are face-down cards below it, moving this stack reveals a card!
      for (let subIdx = firstFaceUpIdx; subIdx < col.length; subIdx++) {
        const card = col[subIdx];
        for (let targetColIdx = 0; targetColIdx < 7; targetColIdx++) {
          if (targetColIdx === cIdx) continue;
          const targetCol = gameState.tableau[targetColIdx];
          const targetTop = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;

          if (canPlaceOnTableau(targetTop, card)) {
            // Don't suggest moving King from an already empty base to another empty base
            if (card.rank === 13 && firstFaceUpIdx === 0 && targetTop === null) {
              continue;
            }
            return {
              fromDescription: `מטור ${cIdx + 1}`,
              toDescription: `לטור ${targetColIdx + 1}`,
              source: { pile: 'tableau', colIndex: cIdx, cardIndex: subIdx },
              target: { type: 'tableau', index: targetColIdx },
            };
          }
        }
      }
    }
  }

  // 4. Check Waste to Tableau
  if (gameState.waste.length > 0) {
    const wasteCard = gameState.waste[gameState.waste.length - 1];
    for (let cIdx = 0; cIdx < 7; cIdx++) {
      const targetCol = gameState.tableau[cIdx];
      const targetTop = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;
      if (canPlaceOnTableau(targetTop, wasteCard)) {
        return {
          fromDescription: 'מהקופה',
          toDescription: `לטור ${cIdx + 1}`,
          source: { pile: 'waste' },
          target: { type: 'tableau', index: cIdx },
        };
      }
    }
  }

  return null;
}
