export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  color: CardColor;
  isFaceUp: boolean;
}

export type CardBackStyle = 'classic-blue' | 'castle' | 'beach' | 'roses';

export type CardLocation =
  | { pile: 'stock' }
  | { pile: 'waste' }
  | { pile: 'foundation'; foundationIndex: number }
  | { pile: 'tableau'; colIndex: number; cardIndex: number };

export interface MoveRecord {
  description: string;
  pointsDelta: number;
  // Snapshot or inverted action for 100% pure undo
  previousState: {
    stock: Card[];
    waste: Card[];
    foundations: Card[][];
    tableau: Card[][];
    score: number;
    stockPassCount: number;
  };
}

export interface GameSettings {
  drawCount: 1 | 3;
  scoringMode: 'relaxed' | 'standard'; // Relaxed has no penalties (Grandma friendly)
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  cardBack: CardBackStyle;
  largeFonts: boolean;
  autoCompletePrompt: boolean;
}

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: [Card[], Card[], Card[], Card[]];
  tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]];
  score: number;
  movesCount: number;
  startTime: number | null;
  elapsedSeconds: number;
  isWon: boolean;
  stockPassCount: number;
  settings: GameSettings;
  history: MoveRecord[];
  isAutoCompleting: boolean;
  dealSeed?: number;
}
