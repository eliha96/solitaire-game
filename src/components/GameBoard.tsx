import React, { useState, useEffect, useRef } from 'react';
import type { Card, GameState } from '../engine/types';
import { canAutoComplete, canPlaceOnFoundation, canPlaceOnTableau } from '../engine/rules';
import { findBestMoveForTappedCard } from '../engine/solver';
import {
  drawCards,
  executeMove,
} from '../engine/gameManager';
import { CardView } from './CardView';
import { sounds } from '../engine/sound';
import { RotateCw, Sparkles } from 'lucide-react';

interface GameBoardProps {
  state: GameState;
  onStateChange: (newState: GameState) => void;
  highlightedCardId: string | null;
  dealTrigger?: number;
}

interface DragState {
  cards: Card[];
  source: {
    pile: 'waste' | 'tableau' | 'foundation';
    colIndex?: number;
    cardIndex?: number;
    foundationIndex?: number;
  };
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  cardWidth: number;
  cardHeight: number;
  isDragging: boolean;
}

interface FlyingCardInfo {
  card: Card;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  width: number;
  height: number;
  source: {
    colIndex: number;
    cardIndex: number;
  };
  targetFoundationIndex: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  onStateChange,
  highlightedCardId,
  dealTrigger,
}) => {
  const [dealtCardsCount, setDealtCardsCount] = useState<number>(28);
  const [isDealing, setIsDealing] = useState<boolean>(false);

  // Authentically sequence the 28 tableau cards across the 7 columns
  const getDealOrderIndex = (colIdx: number, cardIdx: number): number => {
    let order = 0;
    for (let pass = 0; pass < cardIdx; pass++) {
      order += 7 - pass;
    }
    return order + (colIdx - cardIdx);
  };

  // Trigger rapid dealing animation whenever dealTrigger changes
  useEffect(() => {
    if (dealTrigger === undefined) return;

    setDealtCardsCount(0);
    setIsDealing(true);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setDealtCardsCount(count);

      // Play crisp deal sound
      sounds.playCardDeal();

      // Flip sound when top face-up card lands on its column
      // Positions are: (0,0)=0, (1,1)=7, (2,2)=13, (3,3)=18, (4,4)=22, (5,5)=25, (6,6)=27
      if ([0, 7, 13, 18, 22, 25, 27].includes(count - 1)) {
        sounds.playCardFlip();
      }

      if (count >= 28) {
        clearInterval(interval);
        setIsDealing(false);
      }
    }, 28); // 28ms * 28 cards = ~784ms total fast snappy deal

    return () => clearInterval(interval);
  }, [dealTrigger]);

  const [selectedLocation, setSelectedLocation] = useState<{
    pile: 'waste' | 'tableau' | 'foundation';
    colIndex?: number;
    cardIndex?: number;
    foundationIndex?: number;
  } | null>(null);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [flyingCard, setFlyingCard] = useState<FlyingCardInfo | null>(null);
  const [isFlyingGliding, setIsFlyingGliding] = useState(false);

  const boardRef = useRef<HTMLElement | null>(null);
  const [boardHeight, setBoardHeight] = useState<number>(600);
  const [cardWidth, setCardWidth] = useState<number>(50);

  const foundationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tableauRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track responsive screen dimensions to fill height dynamically
  useEffect(() => {
    const updateDims = () => {
      if (boardRef.current) {
        const h = boardRef.current.clientHeight;
        if (h > 100) setBoardHeight(h);
      }
      if (foundationRefs.current[0]) {
        const w = foundationRefs.current[0].clientWidth;
        if (w > 20) setCardWidth(w);
      }
    };

    updateDims();
    const timer = setTimeout(updateDims, 100);
    window.addEventListener('resize', updateDims);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDims);
    };
  }, []);

  // Drag listeners on window for seamless pointer tracking & release anywhere
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const distance = Math.hypot(dx, dy);

      setDragState((prev) => {
        if (!prev) return null;
        const nowDragging = prev.isDragging || distance > 6;
        return {
          ...prev,
          currentX: e.clientX,
          currentY: e.clientY,
          isDragging: nowDragging,
        };
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const distance = Math.hypot(dx, dy);

      if (dragState.isDragging || distance > 6) {
        // --- REAL DRAG: DROP DETECTION ---
        const dropX = e.clientX;
        const dropY = e.clientY;
        let droppedSuccessfully = false;

        // 1. Check Foundations (only single card can be dropped on foundation)
        if (dragState.cards.length === 1) {
          for (let fIdx = 0; fIdx < 4; fIdx++) {
            if (dragState.source.pile === 'foundation' && dragState.source.foundationIndex === fIdx) {
              continue;
            }
            const fEl = foundationRefs.current[fIdx];
            if (fEl) {
              const rect = fEl.getBoundingClientRect();
              if (
                dropX >= rect.left &&
                dropX <= rect.right &&
                dropY >= rect.top &&
                dropY <= rect.bottom
              ) {
                if (canPlaceOnFoundation(state.foundations[fIdx], dragState.cards[0])) {
                  sounds.playCardPlace();
                  sounds.triggerHaptic(15);
                  const next = executeMove(state, dragState.source, {
                    type: 'foundation',
                    index: fIdx,
                  });
                  onStateChange(next);
                  droppedSuccessfully = true;
                  break;
                }
              }
            }
          }
        }

        // 2. Check Tableau Columns if not dropped on foundation
        if (!droppedSuccessfully) {
          for (let cIdx = 0; cIdx < 7; cIdx++) {
            // Avoid dropping onto the exact same tableau column
            if (
              dragState.source.pile === 'tableau' &&
              dragState.source.colIndex === cIdx
            ) {
              continue;
            }

            const colEl = tableauRefs.current[cIdx];
            if (colEl) {
              const rect = colEl.getBoundingClientRect();
              // Expand detection horizontally to match full column width
              if (
                dropX >= rect.left - 4 &&
                dropX <= rect.right + 4 &&
                dropY >= rect.top - 10 &&
                dropY <= rect.bottom + 60
              ) {
                const targetCol = state.tableau[cIdx];
                const targetTop =
                  targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;

                if (canPlaceOnTableau(targetTop, dragState.cards[0])) {
                  sounds.playCardPlace();
                  sounds.triggerHaptic(15);
                  const next = executeMove(state, dragState.source, {
                    type: 'tableau',
                    index: cIdx,
                  });
                  onStateChange(next);
                  droppedSuccessfully = true;
                  break;
                }
              }
            }
          }
        }

        if (!droppedSuccessfully) {
          // Snap back feedback
          sounds.triggerHaptic(20);
        }
      } else {
        // --- TAP EVENT (< 6px movement) ---
        if (dragState.source.pile === 'waste') {
          handleWasteCardClick(dragState.cards[0]);
        } else if (dragState.source.pile === 'foundation' && dragState.source.foundationIndex !== undefined) {
          handleFoundationClick(dragState.source.foundationIndex);
        } else if (
          dragState.source.pile === 'tableau' &&
          dragState.source.colIndex !== undefined &&
          dragState.source.cardIndex !== undefined
        ) {
          handleTableauCardClick(
            dragState.cards[0],
            dragState.source.colIndex,
            dragState.source.cardIndex
          );
        }
      }

      setDragState(null);
    };

    const handlePointerCancel = () => {
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [dragState, state, onStateChange]);

  // Smooth Auto-Complete Flight Animation Runner
  useEffect(() => {
    if (!state.isAutoCompleting || state.isWon || flyingCard) return;

    if (!canAutoComplete(state)) {
      onStateChange({ ...state, isAutoCompleting: false });
      return;
    }

    // Find the next card in tableau that can move to foundations
    for (let cIdx = 0; cIdx < 7; cIdx++) {
      const col = state.tableau[cIdx];
      if (col.length > 0) {
        const topCardIdx = col.length - 1;
        const topCard = col[topCardIdx];
        for (let fIdx = 0; fIdx < 4; fIdx++) {
          if (canPlaceOnFoundation(state.foundations[fIdx], topCard)) {
            const colEl = tableauRefs.current[cIdx];
            const foundEl = foundationRefs.current[fIdx];

            if (colEl && foundEl) {
              const colRect = colEl.getBoundingClientRect();
              const foundRect = foundEl.getBoundingClientRect();

              // Calculate top card position inside column
              let topOffset = 0;
              for (let i = 0; i < topCardIdx; i++) {
                topOffset += col[i].isFaceUp ? 22 : 12;
              }

              const fromX = colRect.left;
              const fromY = colRect.top + topOffset;
              const toX = foundRect.left;
              const toY = foundRect.top;

              setFlyingCard({
                card: topCard,
                fromX,
                fromY,
                toX,
                toY,
                width: foundRect.width,
                height: foundRect.height,
                source: { colIndex: cIdx, cardIndex: topCardIdx },
                targetFoundationIndex: fIdx,
              });
              setIsFlyingGliding(false);

              // Trigger animation frame glide
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setIsFlyingGliding(true);
                });
              });
            }
            return;
          }
        }
      }
    }

    // Nothing left to auto complete
    onStateChange({ ...state, isAutoCompleting: false });
  }, [state, flyingCard, onStateChange]);

  // Handle flying card completion
  useEffect(() => {
    if (!flyingCard || !isFlyingGliding) return;

    const timer = setTimeout(() => {
      sounds.playCardPlace();
      sounds.triggerHaptic(12);

      const next = executeMove(
        { ...state, isAutoCompleting: true },
        {
          pile: 'tableau',
          colIndex: flyingCard.source.colIndex,
          cardIndex: flyingCard.source.cardIndex,
        },
        { type: 'foundation', index: flyingCard.targetFoundationIndex }
      );

      setFlyingCard(null);
      setIsFlyingGliding(false);
      onStateChange(next);
    }, 80); // 80ms flight duration for rapid, snappy finish

    return () => clearTimeout(timer);
  }, [flyingCard, isFlyingGliding, state, onStateChange]);

  // Pointer Down starter for cards
  const startDrag = (
    e: React.PointerEvent,
    source: DragState['source'],
    card: Card
  ) => {
    // If dealing animation is running, cancel/skip it
    if (isDealing) {
      setDealtCardsCount(28);
      setIsDealing(false);
      return;
    }

    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (!card.isFaceUp) return;

    // Wake up Web Audio on direct user gesture
    sounds.unlockAudio();
    e.stopPropagation();

    const targetEl = e.currentTarget as HTMLElement;
    const rect = targetEl.getBoundingClientRect();

    let cardsToDrag: Card[] = [];
    if (source.pile === 'waste' || source.pile === 'foundation') {
      cardsToDrag = [card];
    } else if (source.pile === 'tableau' && source.colIndex !== undefined && source.cardIndex !== undefined) {
      cardsToDrag = state.tableau[source.colIndex].slice(source.cardIndex);
    }

    setDragState({
      cards: cardsToDrag,
      source,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      cardWidth: rect.width,
      cardHeight: rect.height,
      isDragging: false,
    });
  };

  // Stock click handler
  const handleStockClick = () => {
    sounds.unlockAudio();
    if (isDealing) {
      setDealtCardsCount(28);
      setIsDealing(false);
      return;
    }

    sounds.playCardFlip();
    sounds.triggerHaptic(15);
    const next = drawCards(state);
    setSelectedLocation(null);
    onStateChange(next);
  };

  // Tap-to-move for Waste
  const handleWasteCardClick = (card: Card) => {
    const destination = findBestMoveForTappedCard(state, card, 'waste');
    if (destination) {
      sounds.playCardPlace();
      sounds.triggerHaptic(15);
      const next = executeMove(state, { pile: 'waste' }, destination);
      setSelectedLocation(null);
      onStateChange(next);
    } else {
      setSelectedLocation((prev) => (prev?.pile === 'waste' ? null : { pile: 'waste' }));
      sounds.triggerHaptic(10);
    }
  };

  // Tap-to-move for Tableau
  const handleTableauCardClick = (
    card: Card,
    colIndex: number,
    cardIndex: number
  ) => {
    if (!card.isFaceUp) return;

    // Check if player previously selected a card to place here
    if (selectedLocation) {
      if (selectedLocation.pile === 'waste' && state.waste.length > 0) {
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
        selectedLocation.pile === 'foundation' &&
        selectedLocation.foundationIndex !== undefined
      ) {
        const fPile = state.foundations[selectedLocation.foundationIndex];
        if (fPile.length > 0) {
          const movingCard = fPile[fPile.length - 1];
          if (canPlaceOnTableau(card, movingCard)) {
            sounds.playCardPlace();
            sounds.triggerHaptic(15);
            const next = executeMove(
              state,
              {
                pile: 'foundation',
                foundationIndex: selectedLocation.foundationIndex,
              },
              { type: 'tableau', index: colIndex }
            );
            setSelectedLocation(null);
            onStateChange(next);
            return;
          }
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

    // Default: Smart Tap-to-Move
    const destination = findBestMoveForTappedCard(state, card, 'tableau', colIndex, cardIndex);
    if (destination) {
      sounds.playCardPlace();
      sounds.triggerHaptic(15);
      const next = executeMove(state, { pile: 'tableau', colIndex, cardIndex }, destination);
      setSelectedLocation(null);
      onStateChange(next);
    } else {
      setSelectedLocation((prev) =>
        prev?.pile === 'tableau' && prev.colIndex === colIndex && prev.cardIndex === cardIndex
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
      selectedLocation.pile === 'foundation' &&
      selectedLocation.foundationIndex !== undefined
    ) {
      const fPile = state.foundations[selectedLocation.foundationIndex];
      if (fPile.length > 0) {
        const movingCard = fPile[fPile.length - 1];
        if (canPlaceOnTableau(null, movingCard)) {
          sounds.playCardPlace();
          sounds.triggerHaptic(15);
          const next = executeMove(
            state,
            {
              pile: 'foundation',
              foundationIndex: selectedLocation.foundationIndex,
            },
            { type: 'tableau', index: colIndex }
          );
          setSelectedLocation(null);
          onStateChange(next);
        }
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
    const fPile = state.foundations[foundationIndex];

    if (selectedLocation) {
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
          return;
        }
      } else if (
        selectedLocation.pile === 'tableau' &&
        selectedLocation.colIndex !== undefined &&
        selectedLocation.cardIndex !== undefined
      ) {
        const sourceCol = state.tableau[selectedLocation.colIndex];
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
            return;
          }
        }
      } else if (
        selectedLocation.pile === 'foundation' &&
        selectedLocation.foundationIndex === foundationIndex
      ) {
        // Toggle selection off if clicking the same foundation
        setSelectedLocation(null);
        return;
      }
    }

    // No prior card selected to place here: tap to move card back to tableau!
    if (fPile.length > 0) {
      const topCard = fPile[fPile.length - 1];
      const destination = findBestMoveForTappedCard(state, topCard, 'foundation');
      if (destination && destination.type === 'tableau') {
        sounds.playCardPlace();
        sounds.triggerHaptic(15);
        const next = executeMove(
          state,
          { pile: 'foundation', foundationIndex },
          destination
        );
        setSelectedLocation(null);
        onStateChange(next);
      } else {
        // Toggle selection so user can tap an empty column or tableau column manually
        setSelectedLocation((prev) =>
          prev?.pile === 'foundation' && prev.foundationIndex === foundationIndex
            ? null
            : { pile: 'foundation', foundationIndex }
        );
        sounds.triggerHaptic(10);
      }
    }
  };

  const isEligibleForAutoComplete = canAutoComplete(state);

  // Dynamic vertical cascade calculation so cards comfortably fill the mobile screen height!
  const cardHeight = cardWidth * (7 / 5);
  const availableCascadeHeight = Math.max(240, boardHeight - cardHeight - 35);
  const maxTotalCards = Math.max(...state.tableau.map((col) => col.length), 7);
  const maxFaceUpCards = Math.max(
    ...state.tableau.map((col) => col.filter((c) => c.isFaceUp).length),
    3
  );

  const faceDownStep = maxTotalCards > 12 ? 12 : 14;
  const calculatedFaceUpStep = Math.floor(
    (availableCascadeHeight - 5 * faceDownStep) / Math.max(maxFaceUpCards, 3)
  );
  const isAccessibleTheme =
    state.settings.cardFaceTheme === 'large-print' ||
    state.settings.cardFaceTheme === 'modern-bold' ||
    state.settings.cardFaceTheme === 'four-color';

  const minStep = isAccessibleTheme ? 24 : 20;
  const maxStep = isAccessibleTheme ? 42 : 38;
  // Cap between minStep and maxStep for beautiful legibility on mobile screens!
  const faceUpStep = Math.min(maxStep, Math.max(minStep, calculatedFaceUpStep));

  // Compute fanned waste cards for Draw 3 vs Draw 1
  const visibleWasteCards: Card[] =
    state.settings.drawCount === 3
      ? state.waste.slice(-3)
      : state.waste.slice(-1);

  return (
    <main
      ref={boardRef}
      onClick={() => {
        if (isDealing) {
          setDealtCardsCount(28);
          setIsDealing(false);
        }
      }}
      className="flex-1 w-full max-w-2xl mx-auto flex flex-col justify-start px-1 sm:px-2 pt-1.5 sm:pt-2.5 pb-1 relative select-none touch-none overflow-hidden min-h-0"
    >
      {/* Top Row: Stock & Waste on left, 4 Foundations on right */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2 sm:mb-2.5 items-start shrink-0">
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
                cardFaceTheme={state.settings.cardFaceTheme}
              />
              <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
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
        <div className="col-span-1 relative aspect-[5/7] w-full">
          {/* Base Marked Slot: ALWAYS rendered in Col 1 so the spot is permanently marked directly next to Stock */}
          <div className="absolute inset-0 card-slot opacity-30 pointer-events-none" />

          {visibleWasteCards.length > 0 &&
            visibleWasteCards.map((card, idx) => {
              const isTop = idx === visibleWasteCards.length - 1;
              // In Draw 3, fan successive cards towards the spacer column (Col 2, to the left)
              const fanOffset = state.settings.drawCount === 3 ? idx * -14 : 0;
              const isBeingDragged =
                dragState?.isDragging &&
                dragState.source.pile === 'waste' &&
                isTop;

              return (
                <div
                  key={`waste-${card.id}-${idx}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100%',
                    height: '100%',
                    transform: `translateX(${fanOffset}px)`,
                    zIndex: idx + 1,
                  }}
                >
                  <CardView
                    card={card}
                    cardBack={state.settings.cardBack}
                    cardFaceTheme={state.settings.cardFaceTheme}
                    isHighlighted={highlightedCardId === card.id}
                    isSelected={selectedLocation?.pile === 'waste' && isTop}
                    isDragging={isBeingDragged}
                    onPointerDown={
                      isTop
                        ? (e) => startDrag(e, { pile: 'waste' }, card)
                        : undefined
                    }
                  />
                </div>
              );
            })}
        </div>

        {/* Col 2: Empty Spacer Column between Waste and Foundations */}
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
              ref={(el) => {
                foundationRefs.current[fIdx] = el;
              }}
              onClick={() => handleFoundationClick(fIdx)}
              className="col-span-1 aspect-[5/7] w-full relative cursor-pointer"
            >
              {topCard ? (
                <CardView
                  card={topCard}
                  cardBack={state.settings.cardBack}
                  cardFaceTheme={state.settings.cardFaceTheme}
                  isHighlighted={highlightedCardId === topCard.id}
                  isSelected={
                    selectedLocation?.pile === 'foundation' &&
                    selectedLocation.foundationIndex === fIdx
                  }
                  isDragging={
                    Boolean(dragState?.isDragging) &&
                    dragState?.source.pile === 'foundation' &&
                    dragState?.source.foundationIndex === fIdx
                  }
                  onPointerDown={(e) =>
                    startDrag(
                      e,
                      { pile: 'foundation', foundationIndex: fIdx },
                      topCard
                    )
                  }
                />
              ) : (
                <div className="w-full h-full card-slot flex items-center justify-center text-white/30 text-xl font-bold">
                  {suitSymbols[fIdx]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Area: 7 Tableau Columns */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1 items-start mt-1 overflow-visible min-h-0">
        {state.tableau.map((column, colIdx) => {
          return (
            <div
              key={`col-${colIdx}`}
              ref={(el) => {
                tableauRefs.current[colIdx] = el;
              }}
              onClick={() => {
                if (column.length === 0) {
                  handleEmptyColumnClick(colIdx);
                }
              }}
              className="col-span-1 relative h-full min-h-[220px] flex flex-col cursor-pointer"
            >
              {/* Empty slot placeholder */}
              {column.length === 0 && (
                <div className="aspect-[5/7] w-full card-slot flex items-center justify-center text-white/20 text-xs font-bold">
                  K
                </div>
              )}

              {/* Cards in column stacked with offset */}
              {column.map((card, cardIdx) => {
                const dealOrder = getDealOrderIndex(colIdx, cardIdx);
                if (isDealing && dealOrder >= dealtCardsCount) {
                  return null;
                }
                const isJustDealt = isDealing && dealOrder === dealtCardsCount - 1;

                const isSelected =
                  selectedLocation?.pile === 'tableau' &&
                  selectedLocation.colIndex === colIdx &&
                  selectedLocation.cardIndex === cardIdx;
                const isHighlighted = highlightedCardId === card.id;

                // Check if this card or a parent card in this column is currently being dragged
                const isBeingDragged =
                  Boolean(dragState?.isDragging) &&
                  dragState?.source.pile === 'tableau' &&
                  dragState.source.colIndex === colIdx &&
                  dragState.source.cardIndex !== undefined &&
                  cardIdx >= dragState.source.cardIndex;

                // Check if this card is currently flying to foundation in auto-complete
                const isCurrentlyFlying =
                  flyingCard &&
                  flyingCard.source.colIndex === colIdx &&
                  flyingCard.source.cardIndex === cardIdx;

                let topOffset = 0;
                for (let i = 0; i < cardIdx; i++) {
                  topOffset += column[i].isFaceUp ? faceUpStep : faceDownStep;
                }

                return (
                  <div
                    key={card.id}
                    className={isJustDealt ? 'animate-in fade-in zoom-in-95 duration-75' : ''}
                    style={{
                      position: 'absolute',
                      top: `${topOffset}px`,
                      left: 0,
                      right: 0,
                      zIndex: cardIdx + (isSelected ? 30 : 0),
                      visibility: isCurrentlyFlying ? 'hidden' : 'visible',
                    }}
                  >
                    <CardView
                      card={card}
                      cardBack={state.settings.cardBack}
                      cardFaceTheme={state.settings.cardFaceTheme}
                      isHighlighted={isHighlighted}
                      isSelected={isSelected}
                      isDragging={isBeingDragged}
                      onPointerDown={
                        card.isFaceUp
                          ? (e) =>
                              startDrag(
                                e,
                                { pile: 'tableau', colIndex: colIdx, cardIndex: cardIdx },
                                card
                              )
                          : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Floating Dragged Stack Overlay (follows finger/mouse with 3D drop shadow) */}
      {dragState?.isDragging && (
        <div
          style={{
            position: 'fixed',
            left: `${dragState.currentX - dragState.offsetX}px`,
            top: `${dragState.currentY - dragState.offsetY}px`,
            width: `${dragState.cardWidth}px`,
            height: `${dragState.cardHeight}px`,
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'scale(1.05)',
            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))',
          }}
        >
          {dragState.cards.map((c, idx) => (
            <div
              key={`dragged-${c.id}-${idx}`}
              style={{
                position: 'absolute',
                top: `${idx * faceUpStep}px`,
                left: 0,
                right: 0,
              }}
            >
              <CardView
                card={c}
                cardBack={state.settings.cardBack}
                cardFaceTheme={state.settings.cardFaceTheme}
              />
            </div>
          ))}
        </div>
      )}

      {/* Auto-Complete Flying Card Overlay (smooth flight animation from tableau to foundation) */}
      {flyingCard && (
        <div
          style={{
            position: 'fixed',
            left: `${isFlyingGliding ? flyingCard.toX : flyingCard.fromX}px`,
            top: `${isFlyingGliding ? flyingCard.toY : flyingCard.fromY}px`,
            width: `${flyingCard.width}px`,
            height: `${flyingCard.height}px`,
            zIndex: 9998,
            pointerEvents: 'none',
            transition: isFlyingGliding ? 'all 0.08s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))',
          }}
        >
          <CardView
            card={flyingCard.card}
            cardBack={state.settings.cardBack}
            cardFaceTheme={state.settings.cardFaceTheme}
          />
        </div>
      )}

      {/* Floating Auto-Complete Button */}
      {isEligibleForAutoComplete && (
        <div className="fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 animate-bounce">
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
