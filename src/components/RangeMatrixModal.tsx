import React from 'react';
import { RANK_NAMES } from '../types/poker';
import { HoldemEngine } from '../engine/HoldemEngine';
import { X, Check } from 'lucide-react';

interface RangeMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  oppRangePercent: number;
  onSelectRange: (pct: number) => void;
}

export const RangeMatrixModal: React.FC<RangeMatrixModalProps> = ({
  isOpen,
  onClose,
  oppRangePercent,
  onSelectRange,
}) => {
  if (!isOpen) return null;

  // ranks from A (12) down to 2 (0)
  const ranksDesc = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

  // Helper to check if a grid cell (r1, r2) is in range
  const isCellInRange = (r1: number, r2: number) => {
    // r1 is row, r2 is column
    if (r1 === r2) {
      // Pair: c1 = r1*4+0, c2 = r1*4+1
      return HoldemEngine.isHandInTopRange(r1 * 4, r1 * 4 + 1, oppRangePercent);
    } else if (r1 > r2) {
      // Upper right if row < col, or suited if r1 > r2
      // Suited: c1 = r1*4, c2 = r2*4
      return HoldemEngine.isHandInTopRange(r1 * 4, r2 * 4, oppRangePercent);
    } else {
      // Offsuit: c1 = r2*4, c2 = r1*4 + 1
      return HoldemEngine.isHandInTopRange(r2 * 4, r1 * 4 + 1, oppRangePercent);
    }
  };

  const getCellLabel = (r1: number, r2: number) => {
    const n1 = RANK_NAMES[r1];
    const n2 = RANK_NAMES[r2];
    if (r1 === r2) return `${n1}${n2}`;
    if (r1 > r2) return `${n1}${n2}s`;
    return `${n2}${n1}o`;
  };

  const presets = [
    { pct: 10, title: 'Топ 10%', desc: 'Монстры (AA-TT, AK, AQ)' },
    { pct: 20, title: 'Топ 20%', desc: 'Тайтовый спектр' },
    { pct: 35, title: 'Топ 35%', desc: 'Средний / Активный' },
    { pct: 50, title: 'Топ 50%', desc: 'Широкий спектр' },
    { pct: 100, title: '100% Все', desc: 'Любые 2 карты' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1E26] border border-[#2F3746] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-[#2B303C] pb-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>🎯 Матрица спектра оппонента (13×13)</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#FF9800]/20 text-[#FFB74D] font-mono font-bold">
                Топ {oppRangePercent}%
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Подсвечены стартовые руки, которые входят в диапазон розыгрыша соперника
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#252A34] hover:bg-[#343B49] text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick presets */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {presets.map((p) => {
            const isSel = oppRangePercent === p.pct;
            return (
              <button
                key={p.pct}
                onClick={() => onSelectRange(p.pct)}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                  isSel
                    ? 'bg-[#FF9800] text-black shadow-lg font-bold scale-102'
                    : 'bg-[#252A34] text-gray-300 hover:bg-[#323947]'
                }`}
              >
                <span>{p.title}</span>
                <span className={`text-[9px] truncate max-w-full ${isSel ? 'text-black/80' : 'text-gray-400'}`}>
                  {p.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slider */}
        <div className="bg-[#121418] p-3 rounded-xl border border-[#2B303C] mb-4">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-gray-300">Точная настройка VPIP / Спектра:</span>
            <span className="font-mono text-[#00E676] font-bold text-sm">{oppRangePercent}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={oppRangePercent}
            onChange={(e) => onSelectRange(Number(e.target.value))}
            className="w-full accent-[#00E676] cursor-pointer"
          />
        </div>

        {/* 13x13 Grid */}
        <div className="overflow-x-auto p-1 bg-[#121418] rounded-xl border border-[#2B303C]">
          <div className="grid grid-cols-13 gap-1 min-w-[480px]">
            {ranksDesc.map((r1) =>
              ranksDesc.map((r2) => {
                const inRange = isCellInRange(r1, r2);
                const isPair = r1 === r2;
                const isSuited = r1 > r2;
                const label = getCellLabel(r1, r2);

                return (
                  <div
                    key={`${r1}-${r2}`}
                    className={`
                      aspect-square flex items-center justify-center text-[10px] font-mono rounded font-bold transition-colors
                      ${
                        inRange
                          ? isPair
                            ? 'bg-[#00E676] text-black font-extrabold shadow-[0_0_6px_rgba(0,230,118,0.5)]'
                            : isSuited
                            ? 'bg-[#2979FF] text-white'
                            : 'bg-[#FF9800] text-black'
                          : 'bg-[#1C212B] text-gray-600 border border-transparent'
                      }
                    `}
                    title={`${label} (${inRange ? 'Входит в спектр' : 'Вне спектра'})`}
                  >
                    {label}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 mt-4 pt-3 border-t border-[#2B303C] gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#00E676]" /> Карманные пары
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#2979FF]" /> Одномастные (s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#FF9800]" /> Разномастные (o)
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#00E676] text-black font-bold hover:brightness-110 flex items-center gap-1.5 ml-auto"
          >
            <Check size={14} /> Применить
          </button>
        </div>
      </div>
    </div>
  );
};
