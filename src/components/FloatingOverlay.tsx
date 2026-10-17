import React, { useState, useRef, useEffect } from 'react';
import { CalculationReport } from '../types/poker';
import { PokerAnalyzerContent } from './PokerAnalyzerContent';

interface FloatingOverlayProps {
  onClose: () => void;
  slots: (number | null)[];
  onSlotsChange: (slots: (number | null)[]) => void;
  activeSlotIndex: number;
  setActiveSlotIndex: (idx: number) => void;
  opponentsCount: number;
  setOpponentsCount: (count: number) => void;
  oppRangePercent: number;
  setOppRangePercent: (pct: number) => void;
  potInput: string;
  setPotInput: (val: string) => void;
  callInput: string;
  setCallInput: (val: string) => void;
  report: CalculationReport;
}

export const FloatingOverlay: React.FC<FloatingOverlayProps> = ({
  onClose,
  slots,
  onSlotsChange,
  activeSlotIndex,
  setActiveSlotIndex,
  opponentsCount,
  setOpponentsCount,
  oppRangePercent,
  setOppRangePercent,
  potInput,
  setPotInput,
  callInput,
  setCallInput,
  report,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 32 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    // Bounds limit within viewport
    const maxX = Math.max(10, window.innerWidth - (isMinimized ? 70 : 370));
    const maxY = Math.max(10, window.innerHeight - (isMinimized ? 70 : 660));

    const newX = Math.min(maxX, Math.max(10, dragStartRef.current.startX + dx));
    const newY = Math.min(maxY, Math.max(10, dragStartRef.current.startY + dy));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  if (isMinimized) {
    return (
      <div
        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => {
          if (!isDraggingRef.current) {
            setIsMinimized(false);
          }
        }}
        className="fixed z-50 w-14 h-14 rounded-full bg-[#1E2229] border-2 border-[#00E676] shadow-[0_4px_24px_rgba(0,230,118,0.35)] flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform select-none backdrop-blur-md"
        title="♠ EV Анализатор (кликните, чтобы развернуть; потяните, чтобы переместить)"
      >
        <span className="text-[#00E676] font-black text-sm tracking-tight font-mono">
          ♠ EV
        </span>
        {report.heroEquityPercent > 0 && (
          <span className="text-[9px] font-bold text-white font-mono leading-none">
            {report.heroEquityPercent.toFixed(0)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="fixed z-50 w-[355px] sm:w-[370px] max-h-[92vh] flex flex-col rounded-2xl bg-[#121418]/96 backdrop-blur-xl border-[1.5px] border-[#00E676]/60 shadow-[0_16px_40px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Drag handle bar */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full bg-[#252A34] px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none border-b border-[#323947]"
      >
        <div className="flex items-center gap-1.5 text-gray-300 font-bold text-xs">
          <span>✥ Перетащить анализатор</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="px-2.5 py-1 rounded bg-[#373E4D] hover:bg-[#475063] text-white text-[11px] font-semibold transition active:scale-95"
            title="Свернуть в плавающий кружок"
          >
            Свернуть [—]
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-2.5 py-1 rounded bg-[#D32F2F] hover:bg-[#b71c1c] text-white text-[11px] font-bold transition active:scale-95"
            title="Закрыть плавающий оверлей"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Overlay Body Content */}
      <div className="p-2.5 overflow-y-auto max-h-[calc(92vh-44px)] custom-scrollbar">
        <PokerAnalyzerContent
          isOverlayMode={true}
          onLaunchOverlay={() => {}}
          onCloseOverlay={onClose}
          slots={slots}
          onSlotsChange={onSlotsChange}
          activeSlotIndex={activeSlotIndex}
          setActiveSlotIndex={setActiveSlotIndex}
          opponentsCount={opponentsCount}
          setOpponentsCount={setOpponentsCount}
          oppRangePercent={oppRangePercent}
          setOppRangePercent={setOppRangePercent}
          potInput={potInput}
          setPotInput={setPotInput}
          callInput={callInput}
          setCallInput={setCallInput}
          report={report}
        />
      </div>
    </div>
  );
};
