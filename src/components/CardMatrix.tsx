import React from 'react';
import { RANK_NAMES, SUIT_COLORS, SUIT_SYMBOLS, Suit } from '../types/poker';

interface CardMatrixProps {
  usedCards: (number | null)[];
  onSelectCard: (cardCode: number) => void;
  compact?: boolean;
}

export const CardMatrix: React.FC<CardMatrixProps> = ({
  usedCards,
  onSelectCard,
  compact = false,
}) => {
  // Rank indices from A (12) down to 2 (0)
  const rankIndices = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  const suits: { suitIdx: Suit; symbol: string; color: string; label: string }[] = [
    { suitIdx: 0, symbol: SUIT_SYMBOLS[0], color: SUIT_COLORS[0], label: 'Пики' },
    { suitIdx: 1, symbol: SUIT_SYMBOLS[1], color: SUIT_COLORS[1], label: 'Червы' },
    { suitIdx: 2, symbol: SUIT_SYMBOLS[2], color: SUIT_COLORS[2], label: 'Бубны' },
    { suitIdx: 3, symbol: SUIT_SYMBOLS[3], color: SUIT_COLORS[3], label: 'Трефы' },
  ];

  return (
    <div className="w-full bg-[#1A1E26] rounded-xl p-2.5 sm:p-3 border border-[#2B303C] shadow-inner select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Выбор карты (52 шт.)
        </span>
        <span className="text-[10px] text-gray-500">
          Клик авто-заполняет активный слот
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1.5 overflow-x-auto pb-1">
        {suits.map(({ suitIdx, symbol, color }) => (
          <div key={suitIdx} className="grid grid-cols-13 gap-1 min-w-[320px]">
            {rankIndices.map((rIdx) => {
              const cardCode = rIdx * 4 + suitIdx;
              const isUsed = usedCards.includes(cardCode);
              const rankLabel = RANK_NAMES[rIdx];

              return (
                <button
                  key={cardCode}
                  type="button"
                  disabled={isUsed}
                  onClick={() => onSelectCard(cardCode)}
                  className={`
                    relative flex flex-col items-center justify-center rounded-md font-mono transition-all duration-100
                    ${compact ? 'h-7 sm:h-8 text-[11px]' : 'h-8 sm:h-9 text-xs'}
                    ${
                      isUsed
                        ? 'bg-[#121418] text-gray-700 cursor-not-allowed opacity-35 border border-transparent'
                        : 'bg-[#252A34] hover:bg-[#323947] active:scale-95 cursor-pointer shadow-sm border border-[#3A4252]/60 hover:border-gray-400'
                    }
                  `}
                  style={{
                    color: isUsed ? undefined : color,
                    borderColor: !isUsed ? `${color}33` : undefined,
                  }}
                  title={isUsed ? `Карта ${rankLabel}${symbol} уже на столе` : `Выбрать ${rankLabel}${symbol}`}
                >
                  <span className="font-bold leading-none">{rankLabel}</span>
                  <span className="text-[10px] leading-none opacity-90">{symbol}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
