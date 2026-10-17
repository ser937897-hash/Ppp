import React, { useState } from 'react';
import { CalculationReport } from '../types/poker';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  Coins,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

interface StrategyAdvisorProps {
  heroCardsCount: number;
  boardCardsCount: number;
  report: CalculationReport;
  potVal: number;
  callVal: number;
  potOddsPct: number;
  evValue: number;
  oppRangePercent: number;
  opponentsCount: number;
  isCompact?: boolean;
}

export type ActionType = 'RAISE' | 'CALL' | 'CHECK' | 'FOLD' | 'WAIT';

interface StrategyRecommendation {
  action: ActionType;
  actionTitle: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
  primaryRationale: string;
  tacticalAdvice: string;
  recommendedSizing?: string;
  riskFactor: 'Низкий' | 'Умеренный' | 'Высокий' | 'Критический';
}

export const StrategyAdvisor: React.FC<StrategyAdvisorProps> = ({
  heroCardsCount,
  boardCardsCount,
  report,
  potVal,
  callVal,
  potOddsPct,
  evValue,
  oppRangePercent,
  opponentsCount,
  isCompact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!isCompact);

  const getRecommendation = (): StrategyRecommendation => {
    if (heroCardsCount < 2) {
      return {
        action: 'WAIT',
        actionTitle: 'ОЖИДАНИЕ КАРТ',
        badgeColor: 'bg-gray-700/50',
        borderColor: 'border-gray-600',
        bgColor: 'bg-[#1C212B]',
        textColor: 'text-gray-300',
        icon: <Clock size={18} className="text-gray-400" />,
        primaryRationale: 'Раздайте 2 карманные карты Hero для старта расчета стратегии.',
        tacticalAdvice: 'Советник сопоставит силу руки со спектром оппонента и рассчитает оптимальное действие.',
        riskFactor: 'Низкий',
      };
    }

    const heroEquity = report.heroEquityPercent;
    const isFree = callVal <= 0;
    const outs = report.outsCount;
    const isMonsterHand =
      heroEquity >= 68 ||
      (boardCardsCount === 0 && heroEquity >= 75); // e.g. AA, KK preflop or flopped nuts
    const isStrongDraw = outs >= 8 && (boardCardsCount === 3 || boardCardsCount === 4);

    // Free card situation (check facing zero bet)
    if (isFree) {
      if (heroEquity >= 62) {
        const sizing = Math.round(potVal * 0.65) || 50;
        return {
          action: 'RAISE',
          actionTitle: 'СТАВКА НА ВЭЛЬЮ',
          badgeColor: 'bg-[#00E676]/20',
          borderColor: 'border-[#00E676]/60',
          bgColor: 'bg-[#0d2a1a]',
          textColor: 'text-[#00E676]',
          icon: <Flame size={18} className="text-[#00E676]" />,
          primaryRationale: `Вы имеете преимущество по эквити (${heroEquity.toFixed(1)}%). Чек дает соперникам бесплатную карту.`,
          tacticalAdvice: `Рекомендуется ставить для извлечения вэлью со спектра Топ-${oppRangePercent}% и защиты руки.`,
          recommendedSizing: `Ставка ~$${sizing} (60–75% банка)`,
          riskFactor: 'Низкий',
        };
      }
      return {
        action: 'CHECK',
        actionTitle: 'ЧЕК / БЕСПЛАТНЫЙ ПРОСМОТР',
        badgeColor: 'bg-[#2979FF]/20',
        borderColor: 'border-[#2979FF]/60',
        bgColor: 'bg-[#111e33]',
        textColor: 'text-[#64B5F6]',
        icon: <CheckCircle2 size={18} className="text-[#64B5F6]" />,
        primaryRationale: `Ставка отсутствует. Эквити ${heroEquity.toFixed(1)}% позволяет бесплатно посмотреть следующую улицу (Pot Control).`,
        tacticalAdvice: 'Контролируйте банк и оцените структуру вышедшей карты на следующей улице.',
        riskFactor: 'Низкий',
      };
    }

    // Facing a bet (callVal > 0)
    // 1. Monster / Dominant hand -> Value Raise
    if (isMonsterHand && report.threatLevel !== 'ВЫСОКАЯ УГРОЗА') {
      const minRaise = Math.round(callVal * 2.8);
      return {
        action: 'RAISE',
        actionTitle: 'РЕЙЗ (НА ВЭЛЬЮ)',
        badgeColor: 'bg-[#00E676]/20',
        borderColor: 'border-[#00E676]',
        bgColor: 'bg-[#0d2d1d]',
        textColor: 'text-[#00E676]',
        icon: <TrendingUp size={20} className="text-[#00E676]" />,
        primaryRationale: `У вас доминирующее эквити (${heroEquity.toFixed(1)}%) против требуемых ${potOddsPct.toFixed(1)}%. Колл недобирает фишки.`,
        tacticalAdvice: `Агрессивно повышайте, чтобы заставить оппонента платить за свои дро и слабые пары из спектра Топ-${oppRangePercent}%.`,
        recommendedSizing: `Рейз ~$${minRaise} (2.5x–3x от ставки)`,
        riskFactor: 'Низкий',
      };
    }

    // 2. Strong Draw with Outs -> Semi-Bluff Raise OR Profitable Call
    if (isStrongDraw && evValue >= -callVal * 0.15) {
      const minRaise = Math.round(callVal * 2.5);
      return {
        action: 'RAISE',
        actionTitle: 'РЕЙЗ (ПОЛУБЛЕФ) ИЛИ КОЛЛ',
        badgeColor: 'bg-[#FF9800]/20',
        borderColor: 'border-[#FF9800]',
        bgColor: 'bg-[#261d0f]',
        textColor: 'text-[#FFB74D]',
        icon: <Flame size={19} className="text-[#FF9800]" />,
        primaryRationale: `Мощное дро: ${outs} аутов (${report.nextStreetImprovePercent.toFixed(1)}% шанс доезда на следующей улице).`,
        tacticalAdvice: `Полублеф может выбить руки оппонента лучше вашей (Фолд-эквити). Если оппонент пассивен — играйте рейз; против сверхагрессивного — коллируйте по шансам.`,
        recommendedSizing: `Рейз ~$${minRaise} или Колл $${callVal}`,
        riskFactor: 'Умеренный',
      };
    }

    // 3. Positive EV Call
    if (heroEquity >= potOddsPct) {
      const edge = heroEquity - potOddsPct;
      return {
        action: 'CALL',
        actionTitle: 'КОЛЛ (+EV)',
        badgeColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500',
        bgColor: 'bg-[#10291d]',
        textColor: 'text-emerald-400',
        icon: <CheckCircle2 size={19} className="text-emerald-400" />,
        primaryRationale: `Математически плюсовое решение: EV = +$${evValue.toFixed(1)}. Ваше эквити (${heroEquity.toFixed(1)}%) превосходит цену банка (${potOddsPct.toFixed(1)}%) с запасом в +${edge.toFixed(1)}%.`,
        tacticalAdvice: `Коллируйте по шансам банка. У вас достаточная доля побед на дистанции, чтобы продолжать раздачу.`,
        recommendedSizing: `Колл $${callVal}`,
        riskFactor: report.threatLevel === 'ВЫСОКАЯ УГРОЗА' ? 'Умеренный' : 'Низкий',
      };
    }

    // 4. Marginal situation with outs & implied odds
    if (outs >= 4 && boardCardsCount < 5 && potVal >= callVal * 3.5) {
      return {
        action: 'CALL',
        actionTitle: 'КОЛЛ С ПОТЕНЦИАЛОМ (IMPLIED ODDS)',
        badgeColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/70',
        bgColor: 'bg-[#261f12]',
        textColor: 'text-amber-300',
        icon: <AlertTriangle size={18} className="text-amber-400" />,
        primaryRationale: `Прямые шансы банка на грани (${heroEquity.toFixed(1)}% vs ${potOddsPct.toFixed(1)}%), но у вас есть ${outs} аутов и глубокий банк.`,
        tacticalAdvice: `Колл оправдан, если при выходе вашего аута на терне/ривере вы сможете добрать с оппонента еще минимум $${Math.round(callVal * 1.5)}. Иначе фолдите.`,
        recommendedSizing: `Колл $${callVal}`,
        riskFactor: 'Высокий',
      };
    }

    // 5. Negative EV Fold
    return {
      action: 'FOLD',
      actionTitle: 'ПАС / ФОЛД (-EV)',
      badgeColor: 'bg-[#D32F2F]/20',
      borderColor: 'border-[#D32F2F]',
      bgColor: 'bg-[#291114]',
      textColor: 'text-[#FF5252]',
      icon: <XCircle size={19} className="text-[#FF5252]" />,
      primaryRationale: `Отрицательное математическое ожидание: EV = ${evValue.toFixed(1)}$. Цена банка (${potOddsPct.toFixed(1)}%) существенно выше шансов на победу (${heroEquity.toFixed(1)}%).`,
      tacticalAdvice: `Сбросьте карты. Вход в банк на этой улице на дистанции приносит убытки. Сохраняйте банкролл для более выгодных ситуаций.`,
      riskFactor: 'Критический',
    };
  };

  const rec = getRecommendation();
  const heroEquity = report.heroEquityPercent;
  const equityDiff = heroEquity - potOddsPct;

  return (
    <div
      className={`w-full rounded-xl border ${rec.borderColor} ${rec.bgColor} p-3 sm:p-3.5 transition-all duration-200 shadow-lg`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-black/40 border border-white/10">
            {rec.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                Советник по стратегии
              </span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${rec.badgeColor} ${rec.textColor}`}>
                {rec.actionTitle}
              </span>
            </div>
            <p className="text-xs text-gray-200 font-medium line-clamp-1 mt-0.5">
              {rec.primaryRationale}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1 rounded bg-black/20 hover:bg-black/40 text-gray-400 hover:text-white transition ml-auto"
          title={isExpanded ? 'Свернуть советник' : 'Развернуть советник'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && heroCardsCount === 2 && (
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2.5 text-xs text-gray-200 animate-in fade-in duration-150">
          {/* Tactical Advice banner */}
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2">
            <Coins size={16} className="text-[#FFB74D] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-gray-200 block text-[11px] mb-0.5">
                Тактическая рекомендация:
              </span>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                {rec.tacticalAdvice}
              </p>
              {rec.recommendedSizing && (
                <div className="mt-1.5 inline-block px-2 py-0.5 rounded bg-black/60 border border-[#00E676]/40 text-[#00E676] font-mono text-[11px] font-bold">
                  🎯 Сайзинг: {rec.recommendedSizing}
                </div>
              )}
            </div>
          </div>

          {/* PPPoker Club Exploit Strategy Hint */}
          <div className="p-2 rounded-lg bg-[#121620] border border-blue-500/20 flex items-center justify-between text-[11px] text-gray-300 gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-300 font-bold shrink-0">
              <span>📱 Эксплойт в PPPoker:</span>
            </span>
            <span className="text-gray-300">
              {oppRangePercent >= 45
                ? 'Против фишей и маньяков клубов: не блефуйте, ставьте 75–100% банка на чистом вэлью.'
                : oppRangePercent <= 15
                ? 'Против нитов клубов: уважайте их рейзы (там натсы), агрессивно крадите блайнды.'
                : 'Против регуляров клубов: балансируйте диапазоны и коллируйте строго по пот-оддсам.'}
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center font-mono">
            <div className="bg-black/30 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-gray-400 block font-sans">Шансы банка</span>
              <span className="text-xs font-bold text-gray-200">{potOddsPct.toFixed(1)}%</span>
            </div>
            <div className="bg-black/30 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-gray-400 block font-sans">Эквити Hero</span>
              <span className="text-xs font-bold text-[#00E676]">{heroEquity.toFixed(1)}%</span>
            </div>
            <div className="bg-black/30 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-gray-400 block font-sans">Перевес (Edge)</span>
              <span
                className={`text-xs font-bold ${
                  equityDiff >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                }`}
              >
                {equityDiff >= 0 ? `+${equityDiff.toFixed(1)}%` : `${equityDiff.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-black/30 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-gray-400 block font-sans">Мат. ожидание EV</span>
              <span
                className={`text-xs font-bold ${
                  evValue >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                }`}
              >
                {evValue >= 0 ? `+$${evValue.toFixed(1)}` : `-$${Math.abs(evValue).toFixed(1)}`}
              </span>
            </div>
          </div>

          {/* Opponent Threat Context */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 pt-1">
            <span className="flex items-center gap-1">
              <ShieldAlert size={12} className="text-amber-400" />
              Оппоненты: <strong className="text-white">{opponentsCount}</strong> (Спектр: Топ {oppRangePercent}%)
            </span>
            <span>
              Угроза соперника:{' '}
              <strong
                className={
                  report.threatLevel === 'ВЫСОКАЯ УГРОЗА'
                    ? 'text-red-400'
                    : report.threatLevel === 'СРЕДНЯЯ УГРОЗА'
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }
              >
                {report.threatLevel}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
