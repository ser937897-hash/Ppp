import React, { useState } from 'react';
import { CardSlotView } from './CardSlotView';
import { OpponentDetail } from '../types/poker';
import { Eye, EyeOff, Dices, Trash2, Smartphone, Monitor } from 'lucide-react';

interface PokerTableSimulatorProps {
  heroCards: (number | null)[];
  boardCards: (number | null)[];
  opponentsCount: number;
  opponentsCards: [number | null, number | null][];
  showOpponentCards: boolean;
  onToggleShowOpponentCards: () => void;
  pot: string;
  call: string;
  activeSlotIndex: number;
  onSlotClick: (idx: number) => void;
  onQuickScenario: (type: 'aces' | 'flushDraw' | 'straightDraw' | 'set' | 'twoPair') => void;
  opponentsDetail?: OpponentDetail[];
  onRandomizeOpponentCards: (oppIdx: number) => void;
  onClearOpponentCards: (oppIdx: number) => void;
}

export const PokerTableSimulator: React.FC<PokerTableSimulatorProps> = ({
  heroCards,
  boardCards,
  opponentsCount,
  opponentsCards,
  showOpponentCards,
  onToggleShowOpponentCards,
  pot,
  call,
  activeSlotIndex,
  onSlotClick,
  onQuickScenario,
  opponentsDetail = [],
  onRandomizeOpponentCards,
  onClearOpponentCards,
}) => {
  const [isPPPokerMode, setIsPPPokerMode] = useState<boolean>(true);

  // PPPoker 9-Max Full Ring positions
  const pppokerPositions = [
    'UTG',
    'UTG+1',
    'UTG+2',
    'MP1',
    'MP2',
    'HJ',
    'CO',
    'BTN',
    'SB',
  ];

  const pppokerVpipTags = [
    { label: 'VIP Фиш', vpip: '52/8', color: 'text-amber-300' },
    { label: 'TAG Рег', vpip: '22/18', color: 'text-blue-300' },
    { label: 'Нит', vpip: '13/11', color: 'text-emerald-300' },
    { label: 'Маньяк', vpip: '44/32', color: 'text-red-300' },
    { label: 'Пассив', vpip: '38/6', color: 'text-purple-300' },
    { label: 'Агро-Рег', vpip: '26/22', color: 'text-cyan-300' },
    { label: 'Кит / VIP', vpip: '65/12', color: 'text-yellow-400' },
    { label: 'Тайт', vpip: '18/14', color: 'text-teal-300' },
    { label: 'Лимпер', vpip: '48/4', color: 'text-orange-300' },
  ];

  const renderOpponentSeat = (idx: number, isCompact = false) => {
    const oppHand = opponentsCards[idx] || [null, null];
    const s1 = 7 + idx * 2;
    const s2 = 7 + idx * 2 + 1;
    const detail = opponentsDetail[idx];
    const tag = pppokerVpipTags[idx % pppokerVpipTags.length];
    const pos = pppokerPositions[idx % pppokerPositions.length];
    const hasCards = oppHand[0] !== null || oppHand[1] !== null;

    return (
      <div key={idx} className="flex flex-col items-center group transition-transform hover:scale-105 z-10">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="px-1 py-0.2 rounded bg-black/85 border border-white/10 text-[8px] sm:text-[9px] font-mono font-bold text-gray-300">
            {pos}
          </span>
          <span className={`text-[8px] sm:text-[9px] font-bold ${tag.color} hidden sm:inline`}>
            {tag.label}
          </span>
        </div>

        {showOpponentCards ? (
          <div className="flex flex-col items-center p-1 rounded-lg bg-black/70 border border-amber-400/30 shadow-md">
            <div className="flex items-center gap-0.5">
              <CardSlotView
                card={oppHand[0]}
                label={`O${idx + 1}a`}
                isSelected={activeSlotIndex === s1}
                onClick={() => onSlotClick(s1)}
                size="sm"
              />
              <CardSlotView
                card={oppHand[1]}
                label={`O${idx + 1}b`}
                isSelected={activeSlotIndex === s2}
                onClick={() => onSlotClick(s2)}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-1 mt-0.5">
              <button
                type="button"
                onClick={() => onRandomizeOpponentCards(idx)}
                className="p-0.5 rounded bg-[#252A34] hover:bg-[#353D4D] text-gray-300 hover:text-white text-[9px]"
                title="Сгенерировать случайные карты"
              >
                <Dices size={10} />
              </button>
              {hasCards && (
                <button
                  type="button"
                  onClick={() => onClearOpponentCards(idx)}
                  className="p-0.5 rounded bg-[#252A34] hover:bg-[#D32F2F] text-gray-300 hover:text-white text-[9px]"
                  title="Очистить карты"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            onClick={onToggleShowOpponentCards}
            className="w-10 h-12 sm:w-12 sm:h-14 bg-gradient-to-b from-[#1c222d] to-[#12161f] rounded-lg border border-[#3b4455] flex flex-col items-center justify-center cursor-pointer shadow-md hover:border-[#00E676] transition-colors"
            title="Кликните, чтобы включить Рентген"
          >
            <span className="text-[8px] text-gray-400 font-bold">Опп #{idx + 1}</span>
            <span className="text-[8px] text-[#00E676] font-bold mt-0.5">👁️</span>
          </div>
        )}

        <div className="mt-0.5 flex flex-col items-center">
          <div className="px-1.5 py-0.2 rounded-full bg-black/80 border border-white/10 text-[8px] sm:text-[9px] text-gray-200 font-mono flex items-center gap-1">
            <span>О#{idx + 1}</span>
            {detail && (
              <span className="text-amber-400 font-bold">
                {detail.equityPercent.toFixed(0)}%
              </span>
            )}
          </div>
          {showOpponentCards && detail && (
            <span className="text-[8px] text-gray-300 text-center max-w-[70px] truncate leading-tight font-medium">
              {detail.currentHandName}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[580px] flex flex-col items-center justify-between p-2 sm:p-4 bg-[#0d1014] select-none overflow-hidden rounded-2xl border border-[#1e2430]">
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between flex-wrap gap-2 z-10 bg-[#161a22]/90 backdrop-blur-md p-2 sm:p-2.5 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPPPokerMode(!isPPPokerMode)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm border
              ${
                isPPPokerMode
                  ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-[#252A34] border-gray-700 text-gray-300 hover:text-white'
              }
            `}
          >
            {isPPPokerMode ? <Smartphone size={13} className="text-emerald-400" /> : <Monitor size={13} />}
            <span>{isPPPokerMode ? `PPPoker ${opponentsCount > 5 ? '9-Max' : '6-Max'}` : 'Широкий стол'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleShowOpponentCards}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm
              ${
                showOpponentCards
                  ? 'bg-[#00E676] text-black hover:brightness-110 ring-1 ring-[#00E676]'
                  : 'bg-[#252A34] text-gray-300 hover:text-white hover:bg-[#323947]'
              }
            `}
          >
            {showOpponentCards ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>{showOpponentCards ? '👁️ Рентген: ВКЛ' : '👁️ Рентген: ВЫКЛ'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 flex-wrap text-xs">
          <span className="text-gray-400 text-[11px] mr-1 hidden sm:inline">Раздачи:</span>
          <button
            onClick={() => onQuickScenario('aces')}
            className="px-2 py-0.5 rounded bg-[#252A34] hover:bg-[#323947] text-amber-300 text-[11px] font-semibold border border-amber-400/20 cursor-pointer"
          >
            AA vs KK
          </button>
          <button
            onClick={() => onQuickScenario('flushDraw')}
            className="px-2 py-0.5 rounded bg-[#252A34] hover:bg-[#323947] text-blue-300 text-[11px] font-semibold border border-blue-400/20 cursor-pointer"
          >
            Флеш-дро
          </button>
          <button
            onClick={() => onQuickScenario('straightDraw')}
            className="px-2 py-0.5 rounded bg-[#252A34] hover:bg-[#323947] text-emerald-300 text-[11px] font-semibold border border-emerald-400/20 cursor-pointer"
          >
            Стрит-дро
          </button>
          <button
            onClick={() => onQuickScenario('set')}
            className="px-2 py-0.5 rounded bg-[#252A34] hover:bg-[#323947] text-purple-300 text-[11px] font-semibold border border-purple-400/20 cursor-pointer"
          >
            Сет Дам
          </button>
        </div>
      </div>

      {/* Main Poker Table Canvas */}
      <div className="relative my-auto w-full flex items-center justify-center py-2">
        {isPPPokerMode ? (
          /* PPPoker Club Smartphone Table (Supports up to 9 opponents) */
          <div className="relative w-full max-w-[440px] aspect-[9/13] sm:aspect-[9/12] rounded-[50px] bg-gradient-to-b from-[#0e2a38] via-[#091e28] to-[#06141c] border-[10px] sm:border-[12px] border-[#18202c] shadow-[inset_0_0_60px_rgba(0,0,0,0.85),0_16px_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between p-3 overflow-hidden">
            
            {/* Header Badge */}
            <div className="w-full flex items-center justify-between text-[10px] text-gray-400 bg-black/60 px-3 py-1 rounded-full border border-white/10 z-10">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span>📱 PPPoker {opponentsCount > 5 ? '9-Max Full Ring' : '6-Max Club'}</span>
              </span>
              <span className="font-mono text-gray-300">
                {opponentsCount} {opponentsCount === 1 ? 'соперник' : opponentsCount < 5 ? 'соперника' : 'соперников'}
              </span>
            </div>

            {/* Top row of opponents (seats 0, 1, 2) */}
            <div className="w-full flex items-center justify-around px-2 mt-1 z-10">
              {Array.from({ length: Math.min(opponentsCount, 3) }).map((_, idx) =>
                renderOpponentSeat(idx, true)
              )}
            </div>

            {/* Middle row of opponents (seats 3, 4, 5, 6 on sides) */}
            {opponentsCount > 3 && (
              <div className="w-full flex items-center justify-between px-1 z-10 my-1">
                {/* Left side */}
                <div className="flex flex-col gap-2">
                  {[3, 4]
                    .filter((idx) => idx < opponentsCount)
                    .map((idx) => renderOpponentSeat(idx, true))}
                </div>

                {/* Right side */}
                <div className="flex flex-col gap-2">
                  {[5, 6]
                    .filter((idx) => idx < opponentsCount)
                    .map((idx) => renderOpponentSeat(idx, true))}
                </div>
              </div>
            )}

            {/* Bottom opponents if 8 or 9 (seats 7, 8) */}
            {opponentsCount > 7 && (
              <div className="w-full flex items-center justify-between px-6 z-10 -mb-2">
                {[7, 8]
                  .filter((idx) => idx < opponentsCount)
                  .map((idx) => renderOpponentSeat(idx, true))}
              </div>
            )}

            {/* Center Felt: Pot + Community Board */}
            <div className="flex flex-col items-center gap-1.5 z-10 my-auto">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-black/80 rounded-full border border-amber-400/40 text-amber-300 shadow-lg">
                <span className="text-[11px] font-bold">🪙 Банк:</span>
                <span className="font-mono font-black text-xs sm:text-sm">${pot || '0'}</span>
                <span className="text-[10px] text-gray-400">
                  ({(parseFloat(pot) / 2 || 0).toFixed(0)} BB)
                </span>
                {parseFloat(call) > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold ml-1">
                    | Колл: ${call}
                  </span>
                )}
              </div>

              {/* Board Cards */}
              <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-black/50 rounded-xl border border-white/10 shadow-inner">
                <CardSlotView
                  card={boardCards[0] ?? null}
                  label="Ф1"
                  isSelected={activeSlotIndex === 2}
                  onClick={() => onSlotClick(2)}
                  size="sm"
                />
                <CardSlotView
                  card={boardCards[1] ?? null}
                  label="Ф2"
                  isSelected={activeSlotIndex === 3}
                  onClick={() => onSlotClick(3)}
                  size="sm"
                />
                <CardSlotView
                  card={boardCards[2] ?? null}
                  label="Ф3"
                  isSelected={activeSlotIndex === 4}
                  onClick={() => onSlotClick(4)}
                  size="sm"
                />
                <div className="w-[1px] h-8 bg-white/20 mx-0.5" />
                <CardSlotView
                  card={boardCards[3] ?? null}
                  label="Т"
                  isSelected={activeSlotIndex === 5}
                  onClick={() => onSlotClick(5)}
                  size="sm"
                />
                <div className="w-[1px] h-8 bg-white/20 mx-0.5" />
                <CardSlotView
                  card={boardCards[4] ?? null}
                  label="Р"
                  isSelected={activeSlotIndex === 6}
                  onClick={() => onSlotClick(6)}
                  size="sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white text-black font-black text-[10px] flex items-center justify-center shadow-md">
                  D
                </div>
                <span className="text-[9px] text-gray-400">Дилер</span>
              </div>
            </div>

            {/* Bottom Hero (You) */}
            <div className="flex flex-col items-center z-10 mb-1">
              <div className="flex items-center gap-1.5 p-1.5 bg-black/70 rounded-xl border border-emerald-400/50 shadow-lg">
                <CardSlotView
                  card={heroCards[0] ?? null}
                  label="H1"
                  isSelected={activeSlotIndex === 0}
                  onClick={() => onSlotClick(0)}
                  size="md"
                />
                <CardSlotView
                  card={heroCards[1] ?? null}
                  label="H2"
                  isSelected={activeSlotIndex === 1}
                  onClick={() => onSlotClick(1)}
                  size="md"
                />
              </div>
              <div className="mt-1 px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-[11px] text-emerald-300 font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
                <span>Герой (Вы) • $500 (250 BB)</span>
              </div>
            </div>

          </div>
        ) : (
          /* Classic Wide Horizontal Table (Supports up to 9 opponents) */
          <div className="relative w-full max-w-4xl aspect-[16/10] sm:aspect-[16/9] max-h-[520px] rounded-[130px] sm:rounded-[180px] bg-gradient-to-b from-[#134e32] via-[#0d3d26] to-[#0a2e1d] border-[12px] sm:border-[16px] border-[#221c16] shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_12px_40px_rgba(0,0,0,0.7)] flex flex-col items-center justify-between p-3 sm:p-5">
            
            {/* Opponents seated around the top and sides */}
            <div className="w-full grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1 sm:gap-2 px-2 -mt-1 sm:-mt-2">
              {Array.from({ length: opponentsCount }).map((_, idx) =>
                renderOpponentSeat(idx, false)
              )}
            </div>

            {/* Center Pot + Board */}
            <div className="flex flex-col items-center gap-2 my-auto">
              <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full border border-amber-400/30 text-amber-300 shadow-md">
                <span className="text-xs">🪙 Банк:</span>
                <span className="font-mono font-black text-sm">${pot || '0'}</span>
                <span className="text-[10px] text-gray-400">| Колл: ${call || '0'}</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 p-2 bg-black/40 rounded-xl border border-white/10 shadow-inner">
                <CardSlotView
                  card={boardCards[0] ?? null}
                  label="Ф1"
                  isSelected={activeSlotIndex === 2}
                  onClick={() => onSlotClick(2)}
                  size="md"
                />
                <CardSlotView
                  card={boardCards[1] ?? null}
                  label="Ф2"
                  isSelected={activeSlotIndex === 3}
                  onClick={() => onSlotClick(3)}
                  size="md"
                />
                <CardSlotView
                  card={boardCards[2] ?? null}
                  label="Ф3"
                  isSelected={activeSlotIndex === 4}
                  onClick={() => onSlotClick(4)}
                  size="md"
                />
                <div className="w-[1px] h-10 bg-white/15 mx-0.5" />
                <CardSlotView
                  card={boardCards[3] ?? null}
                  label="Т"
                  isSelected={activeSlotIndex === 5}
                  onClick={() => onSlotClick(5)}
                  size="md"
                />
                <div className="w-[1px] h-10 bg-white/15 mx-0.5" />
                <CardSlotView
                  card={boardCards[4] ?? null}
                  label="Р"
                  isSelected={activeSlotIndex === 6}
                  onClick={() => onSlotClick(6)}
                  size="md"
                />
              </div>
            </div>

            {/* Bottom Hero */}
            <div className="flex flex-col items-center -mb-1 sm:-mb-2">
              <div className="flex items-center gap-2 p-1.5 bg-black/60 rounded-xl border border-emerald-400/40 shadow-lg">
                <CardSlotView
                  card={heroCards[0] ?? null}
                  label="H1"
                  isSelected={activeSlotIndex === 0}
                  onClick={() => onSlotClick(0)}
                  size="md"
                />
                <CardSlotView
                  card={heroCards[1] ?? null}
                  label="H2"
                  isSelected={activeSlotIndex === 1}
                  onClick={() => onSlotClick(1)}
                  size="md"
                />
              </div>
              <div className="mt-1 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00E676]" />
                Герой (Вы)
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="text-[11px] text-gray-400 text-center mt-2 flex items-center justify-center gap-3 flex-wrap">
        <span>💡 Поддержка до 9 соперников (Full Ring 9-Max / 10-Max)</span>
        <span>•</span>
        <button
          type="button"
          onClick={onToggleShowOpponentCards}
          className="text-[#00E676] hover:underline font-bold cursor-pointer"
        >
          {showOpponentCards ? 'Скрыть карты соперников' : 'Включить режим Рентген'}
        </button>
      </div>
    </div>
  );
};
