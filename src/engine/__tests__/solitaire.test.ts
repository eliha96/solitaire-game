import { describe, it, expect } from 'vitest';
import { createDeck, generateInitialTableauAndStock, shuffleDeck } from '../deck';
import { canPlaceOnTableau, canPlaceOnFoundation, isGameWon, canAutoComplete } from '../rules';
import { createNewGame, drawCards, executeMove, undoMove } from '../gameManager';
import { findBestMoveForTappedCard } from '../solver';
import type { Card } from '../types';

describe('Solitaire Deck & Dealing', () => {
  it('creates a standard 52-card deck with correct colors and suits', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);

    const hearts = deck.filter((c) => c.suit === 'hearts');
    const spades = deck.filter((c) => c.suit === 'spades');
    const redCards = deck.filter((c) => c.color === 'red');
    const blackCards = deck.filter((c) => c.color === 'black');

    expect(hearts).toHaveLength(13);
    expect(spades).toHaveLength(13);
    expect(redCards).toHaveLength(26);
    expect(blackCards).toHaveLength(26);
  });

  it('deals 28 cards to tableau and 24 to stock in initial deal', () => {
    const { tableau, stock } = generateInitialTableauAndStock(12345);
    expect(stock).toHaveLength(24);
    expect(stock.every((c) => !c.isFaceUp)).toBe(true);

    let totalTableauCards = 0;
    tableau.forEach((col, idx) => {
      expect(col).toHaveLength(idx + 1);
      totalTableauCards += col.length;

      // Only the topmost card of each column is face up
      col.forEach((card, cardIdx) => {
        if (cardIdx === col.length - 1) {
          expect(card.isFaceUp).toBe(true);
        } else {
          expect(card.isFaceUp).toBe(false);
        }
      });
    });

    expect(totalTableauCards).toBe(28);
  });

  it('generates reproducible deals with seed', () => {
    const deal1 = shuffleDeck(createDeck(), 42);
    const deal2 = shuffleDeck(createDeck(), 42);
    expect(deal1.map((c) => c.id)).toEqual(deal2.map((c) => c.id));
  });
});

describe('Solitaire Rules Validator', () => {
  const kingSpades: Card = { id: 's-13', suit: 'spades', rank: 13, color: 'black', isFaceUp: true };
  const queenHearts: Card = { id: 'h-12', suit: 'hearts', rank: 12, color: 'red', isFaceUp: true };
  const queenSpades: Card = { id: 's-12', suit: 'spades', rank: 12, color: 'black', isFaceUp: true };
  const jackSpades: Card = { id: 's-11', suit: 'spades', rank: 11, color: 'black', isFaceUp: true };
  const aceHearts: Card = { id: 'h-1', suit: 'hearts', rank: 1, color: 'red', isFaceUp: true };
  const twoHearts: Card = { id: 'h-2', suit: 'hearts', rank: 2, color: 'red', isFaceUp: true };

  it('validates Tableau placements (alternating colors, descending rank)', () => {
    // Only King on empty column
    expect(canPlaceOnTableau(null, kingSpades)).toBe(true);
    expect(canPlaceOnTableau(null, queenHearts)).toBe(false);

    // Red Queen on Black King: valid
    expect(canPlaceOnTableau(kingSpades, queenHearts)).toBe(true);

    // Black Queen on Black King: invalid (same color)
    expect(canPlaceOnTableau(kingSpades, queenSpades)).toBe(false);

    // Black Jack on Black King: invalid (difference > 1)
    expect(canPlaceOnTableau(kingSpades, jackSpades)).toBe(false);
  });

  it('validates Foundation placements (same suit, ascending from Ace)', () => {
    const emptyFoundation: Card[] = [];
    expect(canPlaceOnFoundation(emptyFoundation, aceHearts)).toBe(true);
    expect(canPlaceOnFoundation(emptyFoundation, twoHearts)).toBe(false);

    const foundationWithAce = [aceHearts];
    expect(canPlaceOnFoundation(foundationWithAce, twoHearts)).toBe(true);
    expect(canPlaceOnFoundation(foundationWithAce, jackSpades)).toBe(false);
  });

  it('detects winning condition when all 4 foundations have 13 cards', () => {
    const mockFullFoundation = Array(13).fill(aceHearts);
    expect(isGameWon([mockFullFoundation, mockFullFoundation, mockFullFoundation, mockFullFoundation])).toBe(true);
    expect(isGameWon([mockFullFoundation, mockFullFoundation, [], mockFullFoundation])).toBe(false);
  });
});

describe('Smart Tap-to-Move and Solver', () => {
  it('automatically directs an Ace to Foundation on tap', () => {
    const game = createNewGame();
    const aceDiamonds: Card = { id: 'd-1', suit: 'diamonds', rank: 1, color: 'red', isFaceUp: true };
    game.waste = [aceDiamonds];

    const destination = findBestMoveForTappedCard(game, aceDiamonds, 'waste');
    expect(destination).not.toBeNull();
    expect(destination?.type).toBe('foundation');
  });

  it('moves Tableau card to valid Tableau column on tap', () => {
    const game = createNewGame();
    const blackKing: Card = { id: 'c-13', suit: 'clubs', rank: 13, color: 'black', isFaceUp: true };
    const redQueen: Card = { id: 'h-12', suit: 'hearts', rank: 12, color: 'red', isFaceUp: true };

    game.tableau[0] = [blackKing];
    game.tableau[1] = [redQueen];

    const destination = findBestMoveForTappedCard(game, redQueen, 'tableau', 1, 0);
    expect(destination).toEqual({ type: 'tableau', index: 0 });
  });
});

describe('Game Manager & Undo Execution', () => {
  it('draws card from stock to waste and handles undo cleanly', () => {
    const game = createNewGame({ drawCount: 1 });
    expect(game.waste).toHaveLength(0);
    expect(game.stock).toHaveLength(24);

    const afterDraw = drawCards(game);
    expect(afterDraw.waste).toHaveLength(1);
    expect(afterDraw.stock).toHaveLength(23);
    expect(afterDraw.waste[0].isFaceUp).toBe(true);

    // Undo draw
    const afterUndo = undoMove(afterDraw);
    expect(afterUndo.waste).toHaveLength(0);
    expect(afterUndo.stock).toHaveLength(24);
  });

  it('recycles waste back to stock in reverse order without shuffling', () => {
    const game = createNewGame();
    const cardA: Card = { id: 'c-1', suit: 'clubs', rank: 1, color: 'black', isFaceUp: true };
    const cardB: Card = { id: 'c-2', suit: 'clubs', rank: 2, color: 'black', isFaceUp: true };

    game.stock = [];
    game.waste = [cardA, cardB]; // cardB is on top

    const recycled = drawCards(game);
    expect(recycled.waste).toHaveLength(0);
    expect(recycled.stock).toHaveLength(2);
    // cardB was on top of waste, so after reverse flipping it is at index 0 (bottom of stock)
    expect(recycled.stock[0].id).toBe('c-2');
    expect(recycled.stock[1].id).toBe('c-1');
    expect(recycled.stock.every((c) => !c.isFaceUp)).toBe(true);
  });

  it('executes a move and flips underlying tableau card face-up', () => {
    const game = createNewGame();
    const faceDownCard: Card = { id: 'd-10', suit: 'diamonds', rank: 10, color: 'red', isFaceUp: false };
    const kingCard: Card = { id: 's-13', suit: 'spades', rank: 13, color: 'black', isFaceUp: true };

    game.tableau[0] = [faceDownCard, kingCard];
    game.tableau[2] = [];


    const movedToEmpty = executeMove(
      game,
      { pile: 'tableau', colIndex: 0, cardIndex: 1 },
      { type: 'tableau', index: 2 }
    );

    expect(movedToEmpty.tableau[2]).toHaveLength(1);
    expect(movedToEmpty.tableau[2][0].id).toBe('s-13');
    // The previously face-down card in col 0 is now flipped face-up!
    expect(movedToEmpty.tableau[0][0].isFaceUp).toBe(true);
  });

  it('detects auto-complete eligibility when all tableau cards are face-up and stock/waste empty', () => {
    const game = createNewGame();
    game.stock = [];
    game.waste = [];
    game.tableau = [
      [{ id: 'h-1', suit: 'hearts', rank: 1, color: 'red', isFaceUp: true }],
      [], [], [], [], [], []
    ];
    expect(canAutoComplete(game)).toBe(true);

    // If there is any face-down card, auto-complete is false
    game.tableau[0].push({ id: 'h-2', suit: 'hearts', rank: 2, color: 'red', isFaceUp: false });
    expect(canAutoComplete(game)).toBe(false);
  });

  it('moves card from foundation back to tableau and supports undo', () => {
    const game = createNewGame();
    const fourHearts: Card = { id: 'h-4', suit: 'hearts', rank: 4, color: 'red', isFaceUp: true };
    const fiveSpades: Card = { id: 's-5', suit: 'spades', rank: 5, color: 'black', isFaceUp: true };

    game.foundations[0] = [
      { id: 'h-1', suit: 'hearts', rank: 1, color: 'red', isFaceUp: true },
      { id: 'h-2', suit: 'hearts', rank: 2, color: 'red', isFaceUp: true },
      { id: 'h-3', suit: 'hearts', rank: 3, color: 'red', isFaceUp: true },
      fourHearts,
    ];
    game.tableau = [[], [], [], [fiveSpades], [], [], []];

    // Check tap-to-move detection from foundation
    const dest = findBestMoveForTappedCard(game, fourHearts, 'foundation');
    expect(dest).toEqual({ type: 'tableau', index: 3 });

    // Execute move from foundation to tableau
    const moved = executeMove(game, { pile: 'foundation', foundationIndex: 0 }, { type: 'tableau', index: 3 });
    expect(moved.foundations[0]).toHaveLength(3);
    expect(moved.tableau[3]).toHaveLength(2);
    expect(moved.tableau[3][1].id).toBe('h-4');

    // Undo move
    const undone = undoMove(moved);
    expect(undone.foundations[0]).toHaveLength(4);
    expect(undone.foundations[0][3].id).toBe('h-4');
    expect(undone.tableau[3]).toHaveLength(1);
  });
});

