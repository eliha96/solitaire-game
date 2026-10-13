import type { Card, GameState, Rank, Suit } from './types';

export function getRankLabel(rank: Rank): string {
  switch (rank) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return rank.toString();
  }
}

export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'hearts':
      return '♥';
    case 'diamonds':
      return '♦';
    case 'clubs':
      return '♣';
    case 'spades':
      return '♠';
  }
}

/**
 * Checks if movingCard can be placed on top of targetTopCard in a Tableau column.
 * Rule: Alternate colors, descending rank (e.g. 7 Red on 8 Black).
 * If column is empty (targetTopCard is null), ONLY a King (rank 13) can be placed.
 */
export function canPlaceOnTableau(targetTopCard: Card | null, movingCard: Card): boolean {
  if (!targetTopCard) {
    return movingCard.rank === 13; // Only Kings on empty columns
  }
  return (
    targetTopCard.color !== movingCard.color &&
    targetTopCard.rank === movingCard.rank + 1
  );
}

/**
 * Checks if movingCard can be placed on a Foundation pile.
 * Rule: Same suit, ascending order starting with Ace (1) up to King (13).
 */
export function canPlaceOnFoundation(foundationPile: Card[], movingCard: Card): boolean {
  if (foundationPile.length === 0) {
    return movingCard.rank === 1; // Only Ace on empty foundation
  }
  const topCard = foundationPile[foundationPile.length - 1];
  return topCard.suit === movingCard.suit && movingCard.rank === topCard.rank + 1;
}

/**
 * Checks if the entire game is won (all 4 foundations have 13 cards each).
 */
export function isGameWon(foundations: Card[][]): boolean {
  return foundations.every((f) => f.length === 13);
}

/**
 * Checks if the game can be auto-completed:
 * All remaining cards in the Tableau are face-up, and Stock + Waste are empty!
 * In this state, winning is 100% deterministic and trivial.
 */
export function canAutoComplete(gameState: GameState): boolean {
  if (gameState.stock.length > 0 || gameState.waste.length > 0) {
    return false;
  }
  // All cards present in tableau must be face up
  for (const col of gameState.tableau) {
    for (const card of col) {
      if (!card.isFaceUp) {
        return false;
      }
    }
  }
  // Must not already be won
  return !gameState.isWon;
}
