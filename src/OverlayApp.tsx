import React, { useState, useMemo, useEffect } from 'react';
import { HoldemEngine } from './engine/HoldemEngine';
import { CalculationReport } from './types/poker';
import { PokerAnalyzerContent } from './components/PokerAnalyzerContent';

// Анализатор внутри нативного окна «поверх других приложений» (Android).
// Окно создаёт OverlayService; стартовое состояние приходит в ?state=<json>.
// Объект window.OverlayNative добавляется нативной стороной.

interface InitialState {
  slots?: (number | null)[];
  activeSlotIndex?: number;
  opponentsCount?: number;
  oppRangePercent?: number;
  potInput?: string;
  callInput?: string;
}

interface NativeBridge {
  setBubbleText?: (text: string) => void;
  setFocusable?: (focusable: boolean) => void;
  close?: () => void;
}

const native: NativeBridge | undefined = (window as unknown as { OverlayNative?: NativeBridge })
  .OverlayNative;

function readInitialState(): InitialState {
  try {
    const raw = new URLSearchParams(window.location.search).get('state');
    return raw ? (JSON.parse(raw) as InitialState) : {};
  } catch {
    return {};
  }
}

const TEXT_INPUT_TYPES = ['', 'text', 'number', 'tel', 'search', 'email', 'password'];

function isTextField(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') {
    return TEXT_INPUT_TYPES.includes((el as HTMLInputElement).type);
  }
  return false;
}

export default function OverlayApp() {
  const initial = useMemo(readInitialState, []);

  const [slots, setSlots] = useState<(number | null)[]>(
    Array.isArray(initial.slots) && initial.slots.length === 25
      ? initial.slots
      : new Array(25).fill(null)
  );
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(initial.activeSlotIndex ?? 0);
  const [opponentsCount, setOpponentsCount] = useState<number>(initial.opponentsCount ?? 5);
  const [oppRangePercent, setOppRangePercent] = useState<number>(initial.oppRangePercent ?? 35);
  const [potInput, setPotInput] = useState<string>(initial.potInput ?? '100');
  const [callInput, setCallInput] = useState<string>(initial.callInput ?? '50');

  const heroCards = useMemo(
    () => [slots[0], slots[1]].filter((c): c is number => c !== null),
    [slots]
  );
  const boardCards = useMemo(
    () =>
      [slots[2], slots[3], slots[4], slots[5], slots[6]].filter((c): c is number => c !== null),
    [slots]
  );
  const opponentsCards: [number | null, number | null][] = useMemo(() => {
    const list: [number | null, number | null][] = [];
    for (let o = 0; o < opponentsCount; o++) {
      list.push([slots[7 + o * 2] ?? null, slots[7 + o * 2 + 1] ?? null]);
    }
    return list;
  }, [slots, opponentsCount]);

  const report: CalculationReport = useMemo(() => {
    if (heroCards.length === 2) {
      return HoldemEngine.analyzeSituation(
        heroCards,
        boardCards,
        opponentsCount,
        oppRangePercent,
        15000,
        opponentsCards
      );
    }
    return {
      heroEquityPercent: 0,
      oppEquityPercent: 0,
      tiePercent: 0,
      heroHandName: 'Ожидание карт',
      outsCount: 0,
      nextStreetImprovePercent: 0,
      outCardsList: [],
      oppStrongHandPct: 0,
      oppCategoryBreakdown: [],
      threatLevel: 'НЕИЗВЕСТНО',
      opponentsDetail: [],
    };
  }, [heroCards, boardCards, opponentsCount, oppRangePercent, opponentsCards]);

  // Текст на круглой кнопке в свёрнутом виде
  useEffect(() => {
    const text =
      report.heroEquityPercent > 0 ? `♠ ${report.heroEquityPercent.toFixed(0)}%` : '♠ EV';
    native?.setBubbleText?.(text);
  }, [report.heroEquityPercent]);

  // Клавиатура нужна только для текстовых полей: пока их нет в фокусе,
  // окно не забирает фокус у игры под ним.
  useEffect(() => {
    const onIn = (e: FocusEvent) => {
      if (isTextField(e.target)) native?.setFocusable?.(true);
    };
    const onOut = (e: FocusEvent) => {
      if (isTextField(e.target)) native?.setFocusable?.(false);
    };
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-y-auto bg-[#121418] text-white p-2.5 custom-scrollbar">
      <PokerAnalyzerContent
        isOverlayMode={true}
        onLaunchOverlay={() => {}}
        onCloseOverlay={() => native?.close?.()}
        slots={slots}
        onSlotsChange={setSlots}
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
  );
}
