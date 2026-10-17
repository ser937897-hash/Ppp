import React, { useState, useEffect, useMemo } from 'react';
import { HoldemEngine } from './engine/HoldemEngine';
import { CalculationReport } from './types/poker';
import { PokerAnalyzerContent } from './components/PokerAnalyzerContent';
import { FloatingOverlay } from './components/FloatingOverlay';
import { PokerTableSimulator } from './components/PokerTableSimulator';
import { soundManager } from './utils/audio';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Smartphone,
  HelpCircle,
  X,
  Code2,
} from 'lucide-react';

export default function App() {
  const [slots, setSlots] = useState<(number | null)[]>(new Array(25).fill(null));
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [opponentsCount, setOpponentsCount] = useState<number>(5);
  const [oppRangePercent, setOppRangePercent] = useState<number>(35);
  const [potInput, setPotInput] = useState<string>('100');
  const [callInput, setCallInput] = useState<string>('50');
  const [isOverlayMode, setIsOverlayMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showAndroidInfoModal, setShowAndroidInfoModal] = useState<boolean>(false);
  const [showOpponentCards, setShowOpponentCards] = useState<boolean>(true);

  const heroCards = useMemo(
    () => [slots[0], slots[1]].filter((c): c is number => c !== null),
    [slots]
  );
  const boardCards = useMemo(
    () => [slots[2], slots[3], slots[4], slots[5], slots[6]].filter(
      (c): c is number => c !== null
    ),
    [slots]
  );

  const opponentsCards: [number | null, number | null][] = useMemo(() => {
    const list: [number | null, number | null][] = [];
    for (let o = 0; o < opponentsCount; o++) {
      list.push([slots[7 + o * 2] ?? null, slots[7 + o * 2 + 1] ?? null]);
    }
    return list;
  }, [slots, opponentsCount]);

  // Real-time calculation using HoldemEngine matching Kotlin + Known Opponents Cards
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

  const handleRandomizeOpponentCards = (oppIdx: number) => {
    soundManager.playCardSelect();
    const newSlots = [...slots];
    const used = new Set<number>();
    newSlots.forEach((c) => {
      if (c !== null) used.add(c);
    });

    const available: number[] = [];
    for (let c = 0; c < 52; c++) {
      if (!used.has(c)) available.push(c);
    }
    if (available.length >= 2) {
      const r1 = Math.floor(Math.random() * available.length);
      const c1 = available[r1];
      available.splice(r1, 1);

      const r2 = Math.floor(Math.random() * available.length);
      const c2 = available[r2];

      newSlots[7 + oppIdx * 2] = c1;
      newSlots[7 + oppIdx * 2 + 1] = c2;
      setSlots(newSlots);
    }
  };

  const handleClearOpponentCards = (oppIdx: number) => {
    soundManager.playCardRemove();
    const newSlots = [...slots];
    newSlots[7 + oppIdx * 2] = null;
    newSlots[7 + oppIdx * 2 + 1] = null;
    setSlots(newSlots);
  };

  // Quick preset scenarios with opponents cards
  const handleQuickScenario = (
    type: 'aces' | 'flushDraw' | 'straightDraw' | 'set' | 'twoPair'
  ) => {
    soundManager.playCardSelect();
    const newSlots = new Array(25).fill(null);

    if (type === 'aces') {
      // Hero: A♠ (48), A♥ (49)
      // Opponent 1: K♠ (44), K♥ (45)
      newSlots[0] = 48;
      newSlots[1] = 49;
      newSlots[7] = 44;
      newSlots[8] = 45;
      setSlots(newSlots);
      setActiveSlotIndex(2);
      setOppRangePercent(15);
      setPotInput('200');
      setCallInput('80');
    } else if (type === 'flushDraw') {
      // Hero: A♦ (50), K♦ (46)
      // Board: Q♦ (42), 7♦ (22), 2♠ (0)
      // Opponent 1: Q♠ (40), Q♥ (41) - Set of Queens!
      newSlots[0] = 50;
      newSlots[1] = 46;
      newSlots[2] = 42;
      newSlots[3] = 22;
      newSlots[4] = 0;
      newSlots[7] = 40;
      newSlots[8] = 41;
      setSlots(newSlots);
      setActiveSlotIndex(5);
      setOppRangePercent(35);
      setPotInput('240');
      setCallInput('80');
    } else if (type === 'straightDraw') {
      // Hero: J♠ (36), T♠ (32)
      // Board: 9♥ (29), 8♦ (26), 2♣ (3)
      // Opponent 1: A♠ (48), A♦ (50) - Overpair Aces
      newSlots[0] = 36;
      newSlots[1] = 32;
      newSlots[2] = 29;
      newSlots[3] = 26;
      newSlots[4] = 3;
      newSlots[7] = 48;
      newSlots[8] = 50;
      setSlots(newSlots);
      setActiveSlotIndex(5);
      setOppRangePercent(35);
      setPotInput('150');
      setCallInput('50');
    } else if (type === 'set') {
      // Hero: Q♥ (41), Q♦ (42)
      // Board: Q♠ (40), 8♣ (27), 3♦ (6)
      // Opponent 1: A♥ (49), K♥ (45)
      newSlots[0] = 41;
      newSlots[1] = 42;
      newSlots[2] = 40;
      newSlots[3] = 27;
      newSlots[4] = 6;
      newSlots[7] = 49;
      newSlots[8] = 45;
      setSlots(newSlots);
      setActiveSlotIndex(5);
      setOppRangePercent(25);
      setPotInput('300');
      setCallInput('100');
    }
  };

  const toggleSound = () => {
    soundManager.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="min-h-screen bg-[#121418] text-white flex flex-col font-sans selection:bg-[#00E676] selection:text-black">
      {/* Top Navigation Bar */}
      <header className="w-full bg-[#1A1E26] border-b border-[#252B37] px-4 py-2.5 flex items-center justify-between shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E676] to-[#00B0FF] flex items-center justify-center shadow-[0_0_12px_rgba(0,230,118,0.4)]">
            <span className="font-mono font-black text-black text-sm">♠EV</span>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
              <span>Poker Analyzer & Overlay</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00E676] font-mono font-bold border border-emerald-500/40">
                PPPOKER EDITION
              </span>
            </h1>
            <p className="text-[10px] text-gray-400 hidden sm:block">
              Калькулятор эквити, аутов и EV с поддержкой клубов PPPoker и режимом оверлея
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-[#252A34] hover:bg-[#323947] text-gray-300 hover:text-white transition cursor-pointer"
            title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Android Code Specs Info */}
          <button
            type="button"
            onClick={() => setShowAndroidInfoModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#252A34] hover:bg-[#323947] text-gray-300 hover:text-white text-xs transition cursor-pointer border border-[#373E4D]"
            title="О коде и логике из документа"
          >
            <Smartphone size={14} className="text-[#00E676]" />
            <span className="hidden md:inline">Логика Kotlin</span>
          </button>

          {/* Mode Switcher */}
          <button
            type="button"
            onClick={() => setIsOverlayMode(!isOverlayMode)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer
              ${
                isOverlayMode
                  ? 'bg-[#00E676] text-black hover:brightness-110'
                  : 'bg-[#2979FF] text-white hover:bg-[#1f6ae6]'
              }
            `}
          >
            <span>{isOverlayMode ? '✕ Выйти из оверлея' : '❐ Плавающий оверлей'}</span>
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col gap-4">
        {/* If in Overlay Mode: Show full Poker Table with the draggable floating widget on top */}
        {isOverlayMode ? (
          <div className="relative w-full flex-1 flex flex-col min-h-[calc(100vh-100px)]">
            <div className="mb-2 p-2.5 rounded-xl bg-[#1E2229] border border-[#2B303C] flex items-center justify-between text-xs">
              <span className="text-gray-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse" />
                <strong>Режим оверлея активен.</strong> Виджет плавает поверх покерного стола.
                Перетаскивайте его за верхнюю панель или сверните в плавающую кнопку «♠ EV».
              </span>
              <button
                type="button"
                onClick={() => setIsOverlayMode(false)}
                className="text-xs text-gray-400 hover:text-white underline ml-2"
              >
                Вернуться к полному экрану
              </button>
            </div>

            {/* Poker Table Backdrop */}
            <div className="flex-1 w-full min-h-[560px]">
              <PokerTableSimulator
                heroCards={heroCards}
                boardCards={boardCards}
                opponentsCount={opponentsCount}
                opponentsCards={opponentsCards}
                showOpponentCards={showOpponentCards}
                onToggleShowOpponentCards={() => setShowOpponentCards(!showOpponentCards)}
                pot={potInput}
                call={callInput}
                activeSlotIndex={activeSlotIndex}
                onSlotClick={setActiveSlotIndex}
                onQuickScenario={handleQuickScenario}
                opponentsDetail={report.opponentsDetail}
                onRandomizeOpponentCards={handleRandomizeOpponentCards}
                onClearOpponentCards={handleClearOpponentCards}
              />
            </div>

            {/* Draggable Jetpack Compose Floating Overlay */}
            <FloatingOverlay
              onClose={() => setIsOverlayMode(false)}
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
        ) : (
          /* Standard Fullscreen Split View: Left = Analyzer HUD, Right = Live Poker Table Simulator */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Analyzer core */}
            <div className="lg:col-span-6 xl:col-span-5 w-full bg-[#16191F] border border-[#232833] rounded-2xl p-3 sm:p-4 shadow-xl">
              <PokerAnalyzerContent
                isOverlayMode={false}
                onLaunchOverlay={() => setIsOverlayMode(true)}
                onCloseOverlay={() => {}}
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

            {/* Right Column: Live Table View & Scenario Playground */}
            <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
              <PokerTableSimulator
                heroCards={heroCards}
                boardCards={boardCards}
                opponentsCount={opponentsCount}
                opponentsCards={opponentsCards}
                showOpponentCards={showOpponentCards}
                onToggleShowOpponentCards={() => setShowOpponentCards(!showOpponentCards)}
                pot={potInput}
                call={callInput}
                activeSlotIndex={activeSlotIndex}
                onSlotClick={setActiveSlotIndex}
                onQuickScenario={handleQuickScenario}
                opponentsDetail={report.opponentsDetail}
                onRandomizeOpponentCards={handleRandomizeOpponentCards}
                onClearOpponentCards={handleClearOpponentCards}
              />

              {/* Information card on Math & Algorithm */}
              <div className="bg-[#1A1E26] rounded-xl border border-[#2B303C] p-3.5 text-xs text-gray-300 flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-200 font-bold">
                  <span className="flex items-center gap-1.5 text-[#00E676]">
                    <Sparkles size={14} /> Как работает HoldemEngine
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    15 000 симуляций / тик
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Анализатор ранжирует все 1326 комбинаций префлопа от Топ 1% (AA) до 100% (72o). Оппоненту выдаются только те руки, которые соответствуют выбранному диапазону (VPIP), после чего моделируются возможные ранауты до ривера с точным битовым расчетом комбинаций (Straight Flush, Quads, Full House, Flush, Straight, Trips, Two Pair, Pair).
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#252B37] text-center">
                  <div className="bg-[#121418] p-2 rounded-lg">
                    <span className="text-gray-400 block text-[10px]">Колл (+EV)</span>
                    <strong className="text-emerald-400 font-mono">Эквити ≥ Шансы банка</strong>
                  </div>
                  <div className="bg-[#121418] p-2 rounded-lg">
                    <span className="text-gray-400 block text-[10px]">Ауты на улице</span>
                    <strong className="text-blue-400 font-mono">Карты, дающие победу</strong>
                  </div>
                  <div className="bg-[#121418] p-2 rounded-lg">
                    <span className="text-gray-400 block text-[10px]">Угроза оппонента</span>
                    <strong className="text-amber-400 font-mono">Вероятность 2 пар+</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Android Kotlin Logic Modal */}
      {showAndroidInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1A1E26] border border-[#2B303C] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-[#2B303C] pb-3 mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Code2 className="text-[#00E676]" size={18} />
                <span>Анализатор и HUD для PPPoker</span>
              </h3>
              <button
                onClick={() => setShowAndroidInfoModal(false)}
                className="p-1 rounded bg-[#252A34] hover:bg-[#343B49] text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-gray-300 leading-relaxed">
              <p>
                Ваш исходный код (пакет <code>com.example.pokeranalyzer</code>) спроектирован как <strong>плавающий оверлей для Android</strong> поверх приложения <strong>PPPoker</strong> (или Android-эмуляторов LDPlayer, BlueStacks, Nox, где обычно играют регуляры PPPoker):
              </p>

              <div className="space-y-2">
                <div className="bg-[#121418] p-2.5 rounded-lg border border-[#252A34]">
                  <strong className="text-[#00E676] block mb-1">
                    1. Запуск поверх столов PPPoker (Overlay Service)
                  </strong>
                  В Android-коде используется <code>WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY</code>. Это позволяет виджету плавать прямо поверх вертикальных 6-Max столов PPPoker, не прерывая игровой процесс и мгновенно подсказывая шансы.
                </div>

                <div className="bg-[#121418] p-2.5 rounded-lg border border-[#252A34]">
                  <strong className="text-[#2979FF] block mb-1">
                    2. Связка с клубными статами VPIP/PFR PPPoker
                  </strong>
                  В клубах PPPoker (при наличии VIP Black Card) игроки видят показатель VPIP соперников. Вы можете в 1 клик нажать на стиль соперника (Фиш VPIP 55%, Регуляр 22%, Нит 12%, Маньяк 45%) — и математическое ядро мгновенно пересчитает эквити именно против этого пула рук!
                </div>

                <div className="bg-[#121418] p-2.5 rounded-lg border border-[#252A34]">
                  <strong className="text-[#FFB74D] block mb-1">
                    3. Советник по стратегии и расчет EV
                  </strong>
                  В отличие от стандартного софта PPPoker, который не имеет права давать живые подсказки во время раздачи, наш внешний ассистент мгновенно рассчитывает шансы банка (Pot Odds) и выдает однозначный вердикт: <strong>Колл (+EV)</strong>, <strong>Рейз (вэлью/полублеф)</strong> или <strong>Пас (-EV)</strong>.
                </div>

                <div className="bg-[#121418] p-2.5 rounded-lg border border-[#252A34]">
                  <strong className="text-emerald-400 block mb-1">
                    4. Безопасность аккаунта
                  </strong>
                  Приложение не считывает память процесса и не посылает клики за игрока — это полностью легальный внешний аналитический инструмент и калькулятор.
                </div>
              </div>

              <div className="mt-2 pt-3 border-t border-[#2B303C] flex justify-end">
                <button
                  onClick={() => setShowAndroidInfoModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#00E676] text-black font-bold hover:brightness-110"
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
