import React, { useState, useEffect } from 'react';
import { HoldemEngine } from '../engine/HoldemEngine';
import { CalculationReport } from '../types/poker';
import { CardSlotView } from './CardSlotView';
import { CardMatrix } from './CardMatrix';
import { RangeMatrixModal } from './RangeMatrixModal';
import { StrategyAdvisor } from './StrategyAdvisor';
import { soundManager } from '../utils/audio';
import { Layers, RotateCcw, Eye, Sparkles } from 'lucide-react';

interface PokerAnalyzerContentProps {
  isOverlayMode: boolean;
  onLaunchOverlay: () => void;
  onCloseOverlay: () => void;
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

export const PokerAnalyzerContent: React.FC<PokerAnalyzerContentProps> = ({
  isOverlayMode,
  onLaunchOverlay,
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
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [showOppCardsMode, setShowOppCardsMode] = useState(false);

  const heroCards = [slots[0], slots[1]].filter((c): c is number => c !== null);
  const boardCards = [slots[2], slots[3], slots[4], slots[5], slots[6]].filter(
    (c): c is number => c !== null
  );

  const potVal = parseFloat(potInput) || 0.0;
  const callVal = parseFloat(callInput) || 0.0;
  const totalPot = potVal + callVal;
  const potOddsPct = totalPot > 0 && callVal > 0 ? (callVal / totalPot) * 100.0 : 0.0;
  const evValue =
    (report.heroEquityPercent / 100.0) * potVal -
    (1.0 - report.heroEquityPercent / 100.0) * callVal;
  const isPlusEv = report.heroEquityPercent >= potOddsPct && heroCards.length === 2;

  const handleCardClick = (cardCode: number) => {
    soundManager.playCardSelect();
    const newSlots = [...slots];
    newSlots[activeSlotIndex] = cardCode;
    onSlotsChange(newSlots);

    // Auto-advance to next empty slot
    const maxActive = showOppCardsMode ? 7 + opponentsCount * 2 : 7;
    const nextEmpty = newSlots.findIndex((s, i) => s === null && i < maxActive);
    if (nextEmpty !== -1) {
      setActiveSlotIndex(nextEmpty);
    }
  };

  const handleSlotClick = (slotIndex: number) => {
    if (slots[slotIndex] !== null) {
      soundManager.playCardRemove();
      const newSlots = [...slots];
      newSlots[slotIndex] = null;
      onSlotsChange(newSlots);
    }
    setActiveSlotIndex(slotIndex);
  };

  const handleReset = () => {
    soundManager.playReset();
    onSlotsChange(new Array(25).fill(null));
    setActiveSlotIndex(0);
  };

  const handleClearOpponent = (oppIdx: number) => {
    soundManager.playCardRemove();
    const newSlots = [...slots];
    newSlots[7 + oppIdx * 2] = null;
    newSlots[7 + oppIdx * 2 + 1] = null;
    onSlotsChange(newSlots);
  };

  const handleRandomizeAllOpponents = () => {
    soundManager.playCardSelect();
    const newSlots = [...slots];
    const used = new Set<number>();
    newSlots.slice(0, 7).forEach((c) => {
      if (c !== null) used.add(c);
    });

    for (let o = 0; o < opponentsCount; o++) {
      const available: number[] = [];
      for (let c = 0; c < 52; c++) {
        if (!used.has(c)) available.push(c);
      }
      if (available.length >= 2) {
        const r1 = Math.floor(Math.random() * available.length);
        const c1 = available[r1];
        available.splice(r1, 1);
        used.add(c1);

        const r2 = Math.floor(Math.random() * available.length);
        const c2 = available[r2];
        used.add(c2);

        newSlots[7 + o * 2] = c1;
        newSlots[7 + o * 2 + 1] = c2;
      }
    }
    onSlotsChange(newSlots);
  };

  const boardLabels = ['Ф1', 'Ф2', 'Ф3', 'Т', 'Р'];
  const presets = [10, 20, 35, 50, 100];

  return (
    <div className="w-full flex flex-col gap-2.5 text-white select-none">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-2">
        {!isOverlayMode ? (
          <button
            type="button"
            onClick={onLaunchOverlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2979FF] hover:bg-[#1d68ea] active:scale-95 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>❐ Запустить поверх окон</span>
          </button>
        ) : (
          <span className="text-xs font-bold text-[#00E676] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            Режим: Поверх окон
          </span>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D32F2F] hover:bg-[#b71c1c] active:scale-95 text-white text-xs font-semibold transition shadow-sm cursor-pointer ml-auto"
        >
          <RotateCcw size={12} />
          <span>Сброс карт</span>
        </button>
      </div>

      {/* Block 1: Card Slots (Hero + Board) */}
      <div className="bg-[#1E2229] border border-[#2D333F] rounded-xl p-2.5 sm:p-3 shadow-md">
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          {/* Hero */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-semibold mb-1">
              Мои (2)
            </span>
            <div className="flex items-center gap-1.5">
              <CardSlotView
                card={slots[0]}
                label="H1"
                isSelected={activeSlotIndex === 0}
                onClick={() => handleSlotClick(0)}
              />
              <CardSlotView
                card={slots[1]}
                label="H2"
                isSelected={activeSlotIndex === 1}
                onClick={() => handleSlotClick(1)}
              />
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-12 bg-gray-700/60" />

          {/* Board */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-semibold mb-1">
              Стол: Флоп (3) • Тёрн • Ривер
            </span>
            <div className="flex items-center gap-1.5">
              {boardLabels.map((lbl, idx) => {
                const sIdx = 2 + idx;
                return (
                  <CardSlotView
                    key={sIdx}
                    card={slots[sIdx]}
                    label={lbl}
                    isSelected={activeSlotIndex === sIdx}
                    onClick={() => handleSlotClick(sIdx)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Block 2: Opponent Spectrum Filter & Assessment / Exact Opponent Cards */}
      <div className="bg-[#1E2229] border border-[#2D333F] rounded-xl p-2.5 sm:p-3 shadow-md flex flex-col gap-2">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="text-[11px] font-bold text-[#FFB74D] uppercase tracking-wide flex items-center gap-1">
            <Layers size={13} /> ОППОНЕНТЫ И СПЕКТР
          </span>

          {/* Toggle between Range and Exact Opponent Cards */}
          <div className="flex items-center bg-[#16191F] p-0.5 rounded-lg border border-gray-700 text-[10px]">
            <button
              type="button"
              onClick={() => setShowOppCardsMode(false)}
              className={`px-2 py-0.5 rounded font-bold transition ${
                !showOppCardsMode
                  ? 'bg-[#FF9800] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Спектр (VPIP)
            </button>
            <button
              type="button"
              onClick={() => setShowOppCardsMode(true)}
              className={`px-2 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                showOppCardsMode
                  ? 'bg-[#00E676] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>👁️ Видеть карты</span>
            </button>
          </div>
        </div>

        {/* Number of opponents selector (up to 9) */}
        <div className="flex flex-col gap-1 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Число соперников за столом: <strong className="text-white">{opponentsCount}</strong>
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <button
                type="button"
                onClick={() => setOpponentsCount(1)}
                className="px-1.5 py-0.5 rounded bg-[#252A34] hover:bg-[#323947] text-gray-300"
              >
                HU (1)
              </button>
              <button
                type="button"
                onClick={() => setOpponentsCount(5)}
                className="px-1.5 py-0.5 rounded bg-[#252A34] hover:bg-[#323947] text-gray-300"
              >
                6-Max (5)
              </button>
              <button
                type="button"
                onClick={() => setOpponentsCount(8)}
                className="px-1.5 py-0.5 rounded bg-[#252A34] hover:bg-[#323947] text-gray-300"
              >
                9-Max (8)
              </button>
              <button
                type="button"
                onClick={() => setOpponentsCount(9)}
                className="px-1.5 py-0.5 rounded bg-[#252A34] hover:bg-[#323947] text-gray-300"
              >
                Max (9)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-9 gap-1 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((opp) => {
              const sel = opponentsCount === opp;
              return (
                <button
                  key={opp}
                  type="button"
                  onClick={() => setOpponentsCount(opp)}
                  className={`
                    h-6 rounded-md text-[11px] font-bold transition flex items-center justify-center cursor-pointer
                    ${
                      sel
                        ? 'bg-[#00E676] text-black shadow-sm font-black'
                        : 'bg-[#2C313C] text-white hover:bg-[#393F4D]'
                    }
                  `}
                >
                  {opp}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode A: Exact Opponents Hands (Видеть чужие карты) */}
        {showOppCardsMode ? (
          <div className="bg-[#16191F] p-2.5 rounded-xl border border-gray-700/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-200">
                Карты соперников (кликните слот для выбора):
              </span>
              <button
                type="button"
                onClick={handleRandomizeAllOpponents}
                className="text-[10px] text-[#00E676] hover:underline flex items-center gap-1 font-semibold"
              >
                🎲 Сдать случайные
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {Array.from({ length: opponentsCount }).map((_, idx) => {
                const s1 = 7 + idx * 2;
                const s2 = 7 + idx * 2 + 1;
                const oppDetail = report.opponentsDetail?.[idx];
                const hasCards = slots[s1] !== null || slots[s2] !== null;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#1E2229] border border-gray-700/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 w-14">
                        Опп #{idx + 1}:
                      </span>
                      <div className="flex items-center gap-1">
                        <CardSlotView
                          card={slots[s1]}
                          label={`O${idx + 1}a`}
                          isSelected={activeSlotIndex === s1}
                          onClick={() => handleSlotClick(s1)}
                          size="sm"
                        />
                        <CardSlotView
                          card={slots[s2]}
                          label={`O${idx + 1}b`}
                          isSelected={activeSlotIndex === s2}
                          onClick={() => handleSlotClick(s2)}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      {oppDetail && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-[#FFB74D]">
                            {oppDetail.equityPercent.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <span className="text-[10px] text-gray-400 max-w-[120px] truncate">
                        {oppDetail ? oppDetail.currentHandName : 'Не задано (из спектра)'}
                      </span>
                    </div>

                    {hasCards && (
                      <button
                        type="button"
                        onClick={() => handleClearOpponent(idx)}
                        className="p-1 rounded bg-[#2C313C] hover:bg-[#D32F2F] text-gray-400 hover:text-white transition ml-1"
                        title="Очистить карты этого оппонента"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Mode B: Spectrum Filter (VPIP Range) */
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-300">
                {oppRangePercent <= 12
                  ? `Топ ${oppRangePercent}% (Монстры: AA-TT, AK-AQ)`
                  : oppRangePercent <= 25
                  ? `Топ ${oppRangePercent}% (Тайтовый игрок)`
                  : oppRangePercent <= 45
                  ? `Топ ${oppRangePercent}% (Средний / Активный)`
                  : oppRangePercent < 100
                  ? `Топ ${oppRangePercent}% (Широкий спектр)`
                  : '100% (Любые 2 случайные карты)'}
              </span>
              <button
                type="button"
                onClick={() => setIsMatrixModalOpen(true)}
                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#252A34] border border-gray-700 transition"
              >
                <Eye size={11} /> 13×13 сетка
              </button>
            </div>

            {/* Quick Range Presets */}
            <div className="flex items-center gap-1.5 w-full">
              {presets.map((pct) => {
                const selected = oppRangePercent === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setOppRangePercent(pct)}
                    className={`
                      flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer
                      ${
                        selected
                          ? 'bg-[#FF9800] text-black shadow-md'
                          : 'bg-[#2C313C] text-white hover:bg-[#393F4D]'
                      }
                    `}
                  >
                    {pct === 100 ? '100% Все' : `Топ ${pct}%`}
                  </button>
                );
              })}
            </div>

            {/* Стили игроков PPPoker (Клубные статы VPIP / PFR) */}
            <div className="bg-[#121418] p-2 rounded-lg border border-gray-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <span>📱 Стили соперников в PPPoker</span>
                </span>
                <span className="text-[9px] text-[#00E676] font-mono">
                  Клубный VPIP
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setOppRangePercent(55)}
                  className={`p-1.5 rounded-md text-left transition flex flex-col cursor-pointer ${
                    oppRangePercent === 55
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                      : 'bg-[#1C212B] hover:bg-[#252C3A] text-gray-300 border border-transparent'
                  }`}
                  title="Любитель в клубах PPPoker: заходит лимпом, широко коллирует"
                >
                  <span className="text-[11px] font-bold">🎣 Фиш / VIP</span>
                  <span className="text-[9px] text-gray-400">VPIP 55% • PFR 8%</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOppRangePercent(22)}
                  className={`p-1.5 rounded-md text-left transition flex flex-col cursor-pointer ${
                    oppRangePercent === 22
                      ? 'bg-blue-500/20 border border-blue-500 text-blue-300'
                      : 'bg-[#1C212B] hover:bg-[#252C3A] text-gray-300 border border-transparent'
                  }`}
                  title="Грамотный тайтово-агрессивный регуляр (TAG)"
                >
                  <span className="text-[11px] font-bold">🦈 Регуляр TAG</span>
                  <span className="text-[9px] text-gray-400">VPIP 22% • PFR 18%</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOppRangePercent(12)}
                  className={`p-1.5 rounded-md text-left transition flex flex-col cursor-pointer ${
                    oppRangePercent === 12
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                      : 'bg-[#1C212B] hover:bg-[#252C3A] text-gray-300 border border-transparent'
                  }`}
                  title="Тайтовый нит: рейзит только натсы и топ-пары"
                >
                  <span className="text-[11px] font-bold">🐢 Нит / Рок</span>
                  <span className="text-[9px] text-gray-400">VPIP 12% • PFR 10%</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOppRangePercent(45)}
                  className={`p-1.5 rounded-md text-left transition flex flex-col cursor-pointer ${
                    oppRangePercent === 45
                      ? 'bg-red-500/20 border border-red-500 text-red-300'
                      : 'bg-[#1C212B] hover:bg-[#252C3A] text-gray-300 border border-transparent'
                  }`}
                  title="Агрессивный маньяк: частые 3-беты, овербеты и блефы"
                >
                  <span className="text-[11px] font-bold">💣 Агро-маньяк</span>
                  <span className="text-[9px] text-gray-400">VPIP 45% • PFR 35%</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Opponent analysis summary output when hero cards are set */}
        {heroCards.length === 2 && (
          <div className="pt-2 border-t border-[#2C313C] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FF8A80]">
                Эквити соперника: {report.oppEquityPercent.toFixed(1)}%
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded ${
                  report.threatLevel === 'ВЫСОКАЯ УГРОЗА'
                    ? 'bg-[#FF5252]/20 text-[#FF5252] border border-[#FF5252]/40'
                    : report.threatLevel === 'СРЕДНЯЯ УГРОЗА'
                    ? 'bg-[#FFD54F]/20 text-[#FFD54F] border border-[#FFD54F]/40'
                    : 'bg-[#69F0AE]/20 text-[#69F0AE] border border-[#69F0AE]/40'
                }`}
              >
                {report.threatLevel}
              </span>
            </div>

            <div className="text-[11px] text-gray-300">
              Вероятность сильной руки (2 пары+):{' '}
              <span className="text-white font-mono font-bold">
                {report.oppStrongHandPct.toFixed(1)}%
              </span>
            </div>

            {report.oppCategoryBreakdown.length > 0 && (
              <div className="text-[11px] text-[#FFCC80] leading-tight">
                Спектр оппонента:{' '}
                {report.oppCategoryBreakdown
                  .map(([cat, pct]) => `${cat}: ${pct.toFixed(0)}%`)
                  .join(' • ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Block 3: Hero Equity, Outs & Call EV Calculator */}
      <div className="bg-[#1E2229] border border-[#2D333F] rounded-xl p-2.5 sm:p-3 shadow-md flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          {/* Hero Win chance */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              МОЙ ШАНС ПОБЕДЫ
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#00E676] font-mono leading-none my-1 tracking-tight">
              {heroCards.length === 2 ? `${report.heroEquityPercent.toFixed(1)}%` : '-- %'}
            </div>
            <span className="text-[11px] text-gray-300 font-medium">
              {report.heroHandName}
            </span>
          </div>

          {/* Outs */}
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              АУТЫ НА УСИЛЕНИЕ
            </span>
            <div className="text-base sm:text-lg font-bold text-[#64B5F6] font-mono leading-none my-1">
              {boardCards.length >= 3 && boardCards.length <= 4
                ? `${report.outsCount} аут. (${report.nextStreetImprovePercent.toFixed(1)}%)`
                : '—'}
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              Шансы банка: <strong className="text-gray-200">{potOddsPct.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Outs visual list */}
        {report.outCardsList.length > 0 && (
          <div className="bg-[#16191F] p-2 rounded-lg border border-[#272D3A] flex flex-col gap-1">
            <div className="text-[11px] text-[#90CAF9] flex items-center justify-between">
              <span>
                Ауты ({report.outCardsList.length}):{' '}
                {report.outCardsList
                  .slice(0, 10)
                  .map((c) => HoldemEngine.cardToString(c))
                  .join(' ')}
                {report.outCardsList.length > 10 ? ' ...' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Pot, Call inputs & EV Decision Badge */}
        <div className="grid grid-cols-12 gap-2 items-center pt-1">
          <div className="col-span-4 flex flex-col">
            <label className="text-[10px] text-gray-400 mb-0.5">Банк ($)</label>
            <input
              type="number"
              value={potInput}
              onChange={(e) => setPotInput(e.target.value)}
              className="w-full bg-[#16191F] border border-[#373E4D] focus:border-[#00E676] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
              placeholder="100"
            />
          </div>

          <div className="col-span-4 flex flex-col">
            <label className="text-[10px] text-gray-400 mb-0.5">Колл ($)</label>
            <input
              type="number"
              value={callInput}
              onChange={(e) => setCallInput(e.target.value)}
              className="w-full bg-[#16191F] border border-[#373E4D] focus:border-[#00E676] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
              placeholder="50"
            />
          </div>

          <div
            className={`
              col-span-4 h-[48px] rounded-lg flex flex-col items-center justify-center text-center shadow-md transition-all
              ${
                heroCards.length < 2
                  ? 'bg-[#2C313C] text-gray-300'
                  : isPlusEv
                  ? 'bg-[#1B5E20] text-white ring-1 ring-[#00E676]/60'
                  : 'bg-[#B71C1C] text-white ring-1 ring-[#FF5252]/60'
              }
            `}
          >
            <span className="text-xs font-bold leading-tight">
              {heroCards.length < 2
                ? 'ЖДУ КАРТЫ'
                : isPlusEv
                ? 'КОЛЛ (+EV)'
                : 'ПАС (-EV)'}
            </span>
            {heroCards.length === 2 && callVal > 0 && (
              <span className="text-[10px] font-mono opacity-90">
                EV: {evValue >= 0 ? `+${evValue.toFixed(1)}` : evValue.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Советник по стратегии (Strategy Advisor) */}
      <StrategyAdvisor
        heroCardsCount={heroCards.length}
        boardCardsCount={boardCards.length}
        report={report}
        potVal={potVal}
        callVal={callVal}
        potOddsPct={potOddsPct}
        evValue={evValue}
        oppRangePercent={oppRangePercent}
        opponentsCount={opponentsCount}
        isCompact={isOverlayMode}
      />

      {/* Block 4: 52-card compact matrix */}
      <CardMatrix
        usedCards={slots}
        onSelectCard={handleCardClick}
        compact={isOverlayMode}
      />

      {/* Range matrix modal */}
      <RangeMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        oppRangePercent={oppRangePercent}
        onSelectRange={setOppRangePercent}
      />
    </div>
  );
};
