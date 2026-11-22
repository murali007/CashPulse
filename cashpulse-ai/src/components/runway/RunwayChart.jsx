import { useState } from "react";
import { formatDate, formatINR } from "../../utils/format.js";

const WIDTH = 800;
const PAD = { top: 16, right: 16, bottom: 30, left: 60 };
const TIP_W = 180;
const TIP_H = 46;

// Compact y-axis label: 1.2L, 45k, or the raw rounded value.
function formatAxis(v) {
  const abs = Math.abs(v);
  if (abs >= 100000) return (v / 100000).toFixed(1) + "L";
  if (abs >= 1000) return Math.round(v / 1000) + "k";
  return String(Math.round(v));
}

export default function RunwayChart({ series = [], height = 280 }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!Array.isArray(series) || series.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
        style={{ height }}
      >
        Not enough data points to draw the runway curve.
      </div>
    );
  }

  const n = series.length;
  const balances = series.map((p) => p.balance);
  // Y range spans from min(0, lowest balance) up to the highest balance.
  const minV = Math.min(0, ...balances);
  let maxV = Math.max(0, ...balances);
  if (maxV === minV) maxV = minV + 1;

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const topY = PAD.top;
  const bottomY = PAD.top + innerH;

  const xAt = (i) => PAD.left + (i / (n - 1)) * innerW;
  const yAt = (v) => PAD.top + ((maxV - v) / (maxV - minV)) * innerH;

  const zeroY = yAt(0);
  const linePoints = series.map(
    (p, i) => `${xAt(i).toFixed(2)},${yAt(p.balance).toFixed(2)}`
  );
  const linePath = "M " + linePoints.join(" L ");
  const areaPath = `M ${xAt(0).toFixed(2)},${bottomY} L ${linePoints.join(" L ")} L ${xAt(
    n - 1
  ).toFixed(2)},${bottomY} Z`;

  const yTicks = [0, 1, 2, 3].map((k) => {
    const v = maxV - (k * (maxV - minV)) / 3;
    return { v, y: yAt(v) };
  });

  const xLabelIdx = [0, 1, 2, 3, 4].map((k) => ({
    k,
    idx: Math.round((k * (n - 1)) / 4),
  }));

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (n - 1));
    setHoverIndex(Math.min(n - 1, Math.max(0, idx)));
  };

  const hp = hoverIndex !== null ? series[hoverIndex] : null;
  let hx = 0;
  let hy = 0;
  let tipX = 0;
  if (hp) {
    hx = xAt(hoverIndex);
    hy = yAt(hp.balance);
    tipX = hx + 10 + TIP_W > WIDTH ? hx - TIP_W - 10 : hx + 10;
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Projected daily cash balance curve"
      >
        <defs>
          <linearGradient id="runway-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6900" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff6900" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Y-axis grid and labels */}
        {yTicks.map((t, i) => (
          <g key={`y-${i}`}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={t.y}
              y2={t.y}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeDasharray="2 3"
            />
            <text
              x={PAD.left - 8}
              y={t.y + 4}
              textAnchor="end"
              className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
            >
              {formatAxis(t.v)}
            </text>
          </g>
        ))}

        {/* Rose tint for the region below zero */}
        {zeroY < bottomY ? (
          <rect
            x={PAD.left}
            y={zeroY}
            width={innerW}
            height={bottomY - zeroY}
            className="fill-rose-500"
            fillOpacity="0.08"
          />
        ) : null}

        {/* Zero baseline */}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={zeroY}
          y2={zeroY}
          className="stroke-rose-400"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Area under the balance line */}
        <path d={areaPath} fill="url(#runway-area-grad)" />

        {/* Balance line */}
        <path
          d={linePath}
          fill="none"
          stroke="#ff6900"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis labels */}
        {xLabelIdx.map(({ k, idx }) => (
          <text
            key={`x-${k}`}
            x={xAt(idx)}
            y={height - 8}
            textAnchor={k === 0 ? "start" : k === 4 ? "end" : "middle"}
            className="fill-slate-500 text-[11px] font-medium dark:fill-slate-400"
          >
            {formatDate(series[idx].date)}
          </text>
        ))}

        {/* Hover overlay */}
        <rect
          x={PAD.left}
          y={topY}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        />

        {/* Hover guide and tooltip */}
        {hp ? (
          <g pointerEvents="none">
            <line
              x1={hx}
              x2={hx}
              y1={topY}
              y2={bottomY}
              className="stroke-[#ff6900]"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={hx}
              cy={hy}
              r="4.5"
              className="fill-[#ff6900] stroke-white dark:stroke-slate-900"
              strokeWidth="2"
            />
            <rect
              x={tipX}
              y={topY}
              width={TIP_W}
              height={TIP_H}
              rx="8"
              className="fill-white stroke-slate-200 dark:fill-slate-900 dark:stroke-slate-700"
            />
            <text
              x={tipX + 10}
              y={topY + 18}
              className="fill-slate-700 text-[11px] font-semibold dark:fill-slate-200"
            >
              {formatDate(hp.date)}
            </text>
            <text
              x={tipX + 10}
              y={topY + 36}
              className="fill-[#ff6900] text-[11px] font-bold dark:fill-[#ffb27a]"
            >
              {formatINR(hp.balance)}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
