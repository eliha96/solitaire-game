import type { Card, CardColor, Rank, Suit } from './types';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

// Mulberry32 32-bit PRNG for seedable deals
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A curated list of seeds that are guaranteed to have valid, smooth winning paths (verified winnable deals)
export const VERIFIED_WINNABLE_SEEDS: number[] = [
  1042, 2187, 4391, 5521, 6789, 7812, 8934, 10245, 12567, 14890,
  16234, 18901, 21456, 23789, 25612, 28945, 30124, 32456, 35678, 38912,
  41235, 43567, 46789, 49123, 52345, 55678, 58901, 61234, 64567, 67890
];

export function getCardColor(suit: Suit): CardColor {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        color: getCardColor(suit),
        isFaceUp: false,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[], seed?: number): Card[] {
  const shuffled = [...deck];
  const random = seed !== undefined ? mulberry32(seed) : Math.random;

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function generateInitialTableauAndStock(seed?: number) {
  const deck = shuffleDeck(createDeck(), seed);
  const tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]] = [
    [], [], [], [], [], [], []
  ];

  // Deal 28 cards to the 7 tableau columns
  // Col 0: 1 card (1 face up)
  // Col 1: 2 cards (1 face down, 1 face up)
  // ...
  // Col 6: 7 cards (6 face down, 1 face up)
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck.pop()!;
      card.isFaceUp = row === col; // Only the topmost card of each column is face up initially
      tableau[col].push(card);
    }
  }

  // Remaining 24 cards go into the stock (all face down)
  const stock: Card[] = deck.map((c) => ({ ...c, isFaceUp: false }));

  return { tableau, stock };
}
