import React, { useState, useEffect } from 'react';
import type { Card, GameState } from '../engine/types';
import { canAutoComplete, canPlaceOnFoundation, canPlaceOnTableau } from '../engine/rules';
import { findBestMoveForTappedCard } from '../engine/solver';
import {
  drawCards,
  executeMove,
  executeAutoCompleteStep,
} from '../engine/gameManager';
import { CardView } from './CardView';
import { sounds } from '../engine/sound';
import { RotateCw, Sparkles } from 'lucide-react';


interface GameBoardProps {
  state: GameState;
  onStateChange: (newState: GameState) => void;
  highlightedCardId: string | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  onStateChange,
  highlightedCardId,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    pile: 'waste' | 'tableau';
    colIndex?: number;
    cardIndex?: number;
  } | null>(null);

  // Auto-complete runner
  useEffect(() => {
    if (!state.isAutoCompleting || state.isWon) return;

    const timer = setTimeout(() => {
      const { nextState, moved } = executeAutoCompleteStep(state);
      if (moved) {
        sounds.playCardPlace();
        sounds.triggerHaptic(10);
        onStateChange(nextState);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [state, onStateChange]);

  // Tap handler for Stock
  const handleStockClick = () => {
    sounds.playCardFlip();
    sounds.triggerHaptic(15);
    const next = drawCards(state);
    setSelectedLocation(null);
    onStateChange(next);
  };

  // Smart Tap-to-Move for Waste card
  const handleWasteCardClick = (card: Card) => {
    // If player already selected something, try placing it? Waste cannot accept cards.
    // So smart move Waste card:
    const destination = findBestMoveForTappedCard(state, card, 'waste');
    if (destination) {
      sounds.playCardPlace();
      sounds.triggerHaptic(15);
      const next = executeMove(state, { pile: 'waste' }, destination);
      setSelectedLocation(null);
      onStateChange(next);
    } else {
      // Toggle selection so user can manually tap destination if they want
      setSelectedLocation((prev) =>
        prev?.pile === 'waste' ? null : { pile: 'waste' }
      );
      sounds.triggerHaptic(10);
    }
  };

  // Smart Tap-to-Move for Tableau card
  const handleTableauCardClick = (
    card: Card,
    colIndex: number,
    cardIndex: number
  ) => {
    // If not face-up, cannot move
    if (!card.isFaceUp) return;

    // Check if player had a card selected to place onto this column
    if (selectedLocation) {
      if (
        selectedLocation.pile === 'waste' &&
        state.waste.length > 0
      ) {
        const wasteCard = state.waste[state.waste.length - 1];
        if (canPlaceOnTableau(card, wasteCard)) {
          sounds.playCardPlace();
          sounds.triggerHaptic(15);
          const next = executeMove(state, { pile: 'waste' }, {
            type: 'tableau',
            index: colIndex,
          });
          setSelectedLocation(null);
          onStateChange(next);
          return;
        }
      } else if (
        selectedLocation.pile === 'tableau' &&
        selectedLocation.colIndex !== undefined &&
        selectedLocation.cardIndex !== undefined &&
        selectedLocation.colIndex !== colIndex
      ) {
        const sourceCol = state.tableau[selectedLocation.colIndex];
        const movingCard = sourceCol[selectedLocation.cardIndex];
        if (canPlaceOnTableau(card, movingCard)) {
          sounds.playCardPlace();
          sounds.triggerHaptic(15);
          const next = executeMove(
            state,
            {
              pile: 'tableau',
              colIndex: selectedLocation.colIndex,
              cardIndex: selectedLocation.cardIndex,
            },
            { type: 'tableau', index: colIndex }
          );
          setSelectedLocation(null);
          onStateChange(next);
          return;
        }
      }
    }

    // Default: Smart Tap-to-Move!
    const destination = findBestMoveForTappedCard(
      state,
      card,
      'tableau',
      colIndex,
      cardIndex
    );
    if (destination) {
      sounds.playCardPlace();
      sounds.triggerHaptic(15);
      const next = executeMove(
        state,
        { pile: 'tableau', colIndex, cardIndex },
        destination
      );
      setSelectedLocation(null);
      onStateChange(next);
    } else {
      // Toggle selection for manual target tapping
      setSelectedLocation((prev) =>
        prev?.pile === 'tableau' &&
        prev.colIndex === colIndex &&
        prev.cardIndex === cardIndex
          ? null
          : { pile: 'tableau', colIndex, cardIndex }
      );
      sounds.triggerHaptic(10);
    }
  };

  // Tap handler for empty Tableau column
  const handleEmptyColumnClick = (colIndex: number) => {
    if (!selectedLocation) return;

    if (selectedLocation.pile === 'waste' && state.waste.length > 0) {
      const wasteCard = state.waste[state.waste.length - 1];
      if (canPlaceOnTableau(null, wasteCard)) {
        sounds.playCardPlace();
        sounds.triggerHaptic(15);
        const next = executeMove(state, { pile: 'waste' }, {
          type: 'tableau',
          index: colIndex,
        });
        setSelectedLocation(null);
        onStateChange(next);
      }
    } else if (
      selectedLocation.pile === 'tableau' &&
      selectedLocation.colIndex !== undefined &&
      selectedLocation.cardIndex !== undefined &&
      selectedLocation.colIndex !== colIndex
    ) {
      const sourceCol = state.tableau[selectedLocation.colIndex];
      const movingCard = sourceCol[selectedLocation.cardIndex];
      if (canPlaceOnTableau(null, movingCard)) {
        sounds.playCardPlace();
        sounds.triggerHaptic(15);
        const next = executeMove(
          state,
          {
            pile: 'tableau',
            colIndex: selectedLocation.colIndex,
            cardIndex: selectedLocation.cardIndex,
          },
          { type: 'tableau', index: colIndex }
        );
        setSelectedLocation(null);
        onStateChange(next);
      }
    }
  };

  // Tap handler for Foundation pile
  const handleFoundationClick = (foundationIndex: number) => {
    if (!selectedLocation) return;

    const fPile = state.foundations[foundationIndex];

    if (selectedLocation.pile === 'waste' && state.waste.length > 0) {
      const wasteCard = state.waste[state.waste.length - 1];
      if (canPlaceOnFoundation(fPile, wasteCard)) {
        sounds.playCardPlace();
        sounds.triggerHaptic(15);
        const next = executeMove(state, { pile: 'waste' }, {
          type: 'foundation',
          index: foundationIndex,
        });
        setSelectedLocation(null);
        onStateChange(next);
      }
    } else if (
      selectedLocation.pile === 'tableau' &&
      selectedLocation.colIndex !== undefined &&
      selectedLocation.cardIndex !== undefined
    ) {
      const sourceCol = state.tableau[selectedLocation.colIndex];
      // Only the topmost card of tableau can go to foundation
      if (selectedLocation.cardIndex === sourceCol.length - 1) {
        const movingCard = sourceCol[selectedLocation.cardIndex];
        if (canPlaceOnFoundation(fPile, movingCard)) {
          sounds.playCardPlace();
          sounds.triggerHaptic(15);
          const next = executeMove(
            state,
            {
              pile: 'tableau',
              colIndex: selectedLocation.colIndex,
              cardIndex: selectedLocation.cardIndex,
            },
            { type: 'foundation', index: foundationIndex }
          );
          setSelectedLocation(null);
          onStateChange(next);
        }
      }
    }
  };

  const isEligibleForAutoComplete = canAutoComplete(state);

  return (
    <main className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-between p-2 pb-6 relative select-none touch-none">
      {/* Top Row: Stock & Waste on left, 4 Foundations on right */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 items-start">
        {/* Col 0: Stock Pile */}
        <div className="col-span-1">
          {state.stock.length > 0 ? (
            <div
              onClick={handleStockClick}
              className="relative aspect-[5/7] w-full card-transition active:scale-95 cursor-pointer"
            >
              <CardView
                card={state.stock[state.stock.length - 1]}
                cardBack={state.settings.cardBack}
              />
              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1 rounded">
                {state.stock.length}
              </span>
            </div>
          ) : (
            <div
              onClick={handleStockClick}
              className="aspect-[5/7] w-full card-slot flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform text-white/50 hover:text-white"
            >
              <RotateCw size={20} />
              <span className="text-[10px] mt-1 font-bold">סובב</span>
            </div>
          )}
        </div>

        {/* Col 1: Waste Pile */}
        <div className="col-span-1">
          {state.waste.length > 0 ? (
            <div className="aspect-[5/7] w-full">
              <CardView
                card={state.waste[state.waste.length - 1]}
                cardBack={state.settings.cardBack}
                largeFonts={state.settings.largeFonts}
                isHighlighted={
                  highlightedCardId ===
                  state.waste[state.waste.length - 1].id
                }
                isSelected={selectedLocation?.pile === 'waste'}
                onClick={() =>
                  handleWasteCardClick(state.waste[state.waste.length - 1])
                }
              />
            </div>
          ) : (
            <div className="aspect-[5/7] w-full card-slot opacity-30" />
          )}
        </div>

        {/* Col 2: Spacer / Gap */}
        <div className="col-span-1 pointer-events-none" />

        {/* Col 3-6: 4 Foundations */}
        {[0, 1, 2, 3].map((fIdx) => {
          const foundationPile = state.foundations[fIdx];
          const topCard =
            foundationPile.length > 0
              ? foundationPile[foundationPile.length - 1]
              : null;
          const suitSymbols = ['♠', '♥', '♣', '♦'];

          return (
            <div
              key={`foundation-${fIdx}`}
              onClick={() => handleFoundationClick(fIdx)}
              className="col-span-1 aspect-[5/7] w-full relative cursor-pointer"
            >
              {topCard ? (
                <CardView
                  card={topCard}
                  cardBack={state.settings.cardBack}
                  largeFonts={state.settings.largeFonts}
                />
              ) : (
                <div className="w-full h-full card-slot flex items-center justify-center text-white/25 text-xl font-bold">
                  {suitSymbols[fIdx]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Area: 7 Tableau Columns */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1 items-start mt-1">
        {state.tableau.map((column, colIdx) => {
          return (
            <div
              key={`col-${colIdx}`}
              onClick={() => {
                if (column.length === 0) {
                  handleEmptyColumnClick(colIdx);
                }
              }}
              className="col-span-1 relative min-h-[300px] flex flex-col cursor-pointer"
            >
              {/* Empty slot placeholder */}
              {column.length === 0 && (
                <div className="aspect-[5/7] w-full card-slot flex items-center justify-center text-white/20 text-xs font-bold">
                  K
                </div>
              )}

              {/* Cards in column stacked with offset */}
              {column.map((card, cardIdx) => {
                // Responsive vertical offset: tighter for face down, larger for face up
                const isSelected =
                  selectedLocation?.pile === 'tableau' &&
                  selectedLocation.colIndex === colIdx &&
                  selectedLocation.cardIndex === cardIdx;
                const isHighlighted = highlightedCardId === card.id;

                // Calculate cumulative top offset
                let topOffset = 0;
                for (let i = 0; i < cardIdx; i++) {
                  topOffset += column[i].isFaceUp ? 22 : 12;
                }

                return (
                  <div
                    key={card.id}
                    style={{
                      position: 'absolute',
                      top: `${topOffset}px`,
                      left: 0,
                      right: 0,
                      zIndex: cardIdx + (isSelected ? 30 : 0),
                    }}
                  >
                    <CardView
                      card={card}
                      cardBack={state.settings.cardBack}
                      largeFonts={state.settings.largeFonts}
                      isHighlighted={isHighlighted}
                      isSelected={isSelected}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleTableauCardClick(card, colIdx, cardIdx);
                      }}

                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Floating Auto-Complete Button */}
      {isEligibleForAutoComplete && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-bounce">
          <button
            onClick={() => {
              sounds.playWinFanfare();
              onStateChange({ ...state, isAutoCompleting: true });
            }}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-gray-950 font-black text-base sm:text-lg rounded-2xl shadow-2xl border-2 border-white active:scale-95 transition-transform"
          >
            <Sparkles size={20} className="text-amber-800" />
            <span>סיים משחק אוטומטית! ✨</span>
          </button>
        </div>
      )}
    </main>
  );
};
