import React from 'react';
import { HoldemEngine } from '../engine/HoldemEngine';
import { SUIT_COLORS } from '../types/poker';

interface CardSlotViewProps {
  card: number | null;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}

export const CardSlotView: React.FC<CardSlotViewProps> = ({
  card,
  label,
  isSelected,
  onClick,
  size = 'md',
}) => {
  const suitColor = card !== null ? SUIT_COLORS[card % 4] : '#9CA3AF';
  const cardText = card !== null ? HoldemEngine.cardToString(card) : label;

  const dims =
    size === 'sm'
      ? 'w-9 h-12 text-xs'
      : 'w-10 h-14 text-sm sm:w-11 sm:h-15 sm:text-base';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${dims}
        relative flex flex-col items-center justify-center rounded-lg transition-all duration-150 select-none cursor-pointer
        ${
          card !== null
            ? 'bg-[#2B303C] shadow-md hover:brightness-110 active:scale-95'
            : 'bg-[#16191F] hover:bg-[#1f242e]'
        }
        ${
          isSelected
            ? 'ring-2 ring-[#00E676] border-transparent shadow-[0_0_12px_rgba(0,230,118,0.4)]'
            : 'border border-[#373E4D] hover:border-gray-500'
        }
      `}
      title={card !== null ? `Карта: ${cardText} (кликните, чтобы удалить)` : `Выбрать слот ${label}`}
    >
      {card !== null ? (
        <span
          className="font-black tracking-tight font-mono leading-none drop-shadow-sm"
          style={{ color: suitColor }}
        >
          {cardText}
        </span>
      ) : (
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      )}

      {/* Selected Indicator dot */}
      {isSelected && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00E676] rounded-full ring-2 ring-[#121418] animate-pulse" />
      )}
    </button>
  );
};
