"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";

interface Transaction {
  id: string;
  date: string; // ISO string
  feeAmount: number;
  discountApplied: number;
  revenueEarned: number;
  commissionPaid: number;
  bankCommission: number;
  studentName: string;
  studentCode: string;
  schoolName: string;
  partnerName: string | null;
  partnerCode: string | null;
}

interface DashboardAnalyticsProps {
  transactions: Transaction[];
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  gmv: number;
  netRevenue: number;
  txCount: number;
  momGrowth: number;
}

interface DailyData {
  date: string;
  dateLabel: string;
  gmv: number;
  netRevenue: number;
  txCount: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function DashboardAnalytics({ transactions }: DashboardAnalyticsProps) {
  // Tabs: daily (Day-wise) vs monthly (Monthly Trend)
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  
  // Filter States
  const [presetRange, setPresetRange] = useState<"7d" | "30d" | "90d" | "this_month" | "all" | "custom">("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize dates based on presetRange
  useEffect(() => {
    if (presetRange === "custom") return; // Keep user input for custom

    if (presetRange === "all") {
      if (transactions.length > 0) {
        const dates = transactions.map(t => new Date(t.date).getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        setStartDate(minDate.toISOString().slice(0, 10));
        setEndDate(maxDate.toISOString().slice(0, 10));
      } else {
        const todayStr = new Date().toISOString().slice(0, 10);
        setStartDate(todayStr);
        setEndDate(todayStr);
      }
    } else {
      const end = new Date();
      const start = new Date();
      if (presetRange === "7d") {
        start.setDate(end.getDate() - 6);
      } else if (presetRange === "30d") {
        start.setDate(end.getDate() - 29);
      } else if (presetRange === "90d") {
        start.setDate(end.getDate() - 89);
      } else if (presetRange === "this_month") {
        start.setDate(1); // 1st of current month
      }
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(end.toISOString().slice(0, 10));
    }
  }, [presetRange, transactions]);

  // Derived State: Unique months in the transaction dataset for Month filter dropdown
  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach(tx => {
      const dateObj = new Date(tx.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      monthsSet.add(`${year}-${month}`);
    });
    
    return Array.from(monthsSet).sort().reverse().map(mKey => {
      const [year, monthStr] = mKey.split('-');
      const dateObj = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
      const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { key: mKey, label: monthLabel };
    });
  }, [transactions]);

  // Derived State: Filtered Daily Data (Rolling dates dynamically generated between startDate & endDate)
  const dailyData = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    // Generate empty buckets for all days in selected range
    const dailyMap: Record<string, { gmv: number, netRevenue: number, txCount: number, dateLabel: string }> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Safety cap to prevent browser lockup on massive date selections
    const safetyCap = 366;
    let count = 0;
    while (start <= end && count < safetyCap) {
      const dateKey = start.toISOString().slice(0, 10);
      const dateLabel = start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      dailyMap[dateKey] = { gmv: 0, netRevenue: 0, txCount: 0, dateLabel };
      start.setDate(start.getDate() + 1);
      count++;
    }

    // Populate daily data buckets with filtered transactions
    transactions.forEach(tx => {
      const txDateKey = tx.date.slice(0, 10);
      
      // Filter by custom range
      if (txDateKey >= startDate && txDateKey <= endDate) {
        // If a specific month is selected, filter daily chart to only that month
        if (selectedMonth !== "all") {
          const txMonth = txDateKey.slice(0, 7);
          if (txMonth !== selectedMonth) return;
        }
        
        if (dailyMap[txDateKey]) {
          const netRev = tx.revenueEarned - tx.commissionPaid + tx.bankCommission;
          dailyMap[txDateKey].gmv += tx.feeAmount;
          dailyMap[txDateKey].netRevenue += netRev;
          dailyMap[txDateKey].txCount += 1;
        }
      }
    });

    // If month filter is selected, strip out other months' days
    return Object.keys(dailyMap)
      .sort()
      .filter(dateKey => {
        if (selectedMonth !== "all") {
          return dateKey.slice(0, 7) === selectedMonth;
        }
        return true;
      })
      .map(dateKey => {
        const group = dailyMap[dateKey];
        return {
          date: dateKey,
          dateLabel: group.dateLabel,
          gmv: group.gmv,
          netRevenue: group.netRevenue,
          txCount: group.txCount
        };
      });
  }, [transactions, startDate, endDate, selectedMonth]);

  // Derived State: Filtered Monthly Data
  const monthlyData = useMemo(() => {
    const monthlyGroups: Record<string, { gmv: number, netRevenue: number, txCount: number }> = {};
    
    // Filter transactions by date range
    const filteredTxs = transactions.filter(tx => {
      const txDateKey = tx.date.slice(0, 10);
      const inDateRange = txDateKey >= startDate && txDateKey <= endDate;
      
      if (selectedMonth !== "all") {
        return inDateRange && txDateKey.slice(0, 7) === selectedMonth;
      }
      return inDateRange;
    });

    filteredTxs.forEach(tx => {
      const dateObj = new Date(tx.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const netRev = tx.revenueEarned - tx.commissionPaid + tx.bankCommission;
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { gmv: 0, netRevenue: 0, txCount: 0 };
      }
      monthlyGroups[monthKey].gmv += tx.feeAmount;
      monthlyGroups[monthKey].netRevenue += netRev;
      monthlyGroups[monthKey].txCount += 1;
    });

    return Object.keys(monthlyGroups)
      .sort()
      .map((monthKey, index, sortedKeys) => {
        const group = monthlyGroups[monthKey];
        const [year, monthStr] = monthKey.split('-');
        const dateObj = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
        const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        let momGrowth = 0;
        if (index > 0) {
          const prevGroup = monthlyGroups[sortedKeys[index - 1]];
          if (prevGroup.netRevenue !== 0) {
            momGrowth = ((group.netRevenue - prevGroup.netRevenue) / prevGroup.netRevenue) * 100;
          } else if (group.netRevenue > 0) {
            momGrowth = 100;
          }
        }
        
        return {
          month: monthKey,
          monthLabel,
          gmv: group.gmv,
          netRevenue: group.netRevenue,
          txCount: group.txCount,
          momGrowth
        };
      });
  }, [transactions, startDate, endDate, selectedMonth]);

  const chartData = activeTab === "daily" ? dailyData : monthlyData;

  // Find max value for Y-axis scaling
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.gmv, d.netRevenue)),
    10000 // default minimum ceiling
  );

  // Chart Dimensions
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 30, bottom: 45, left: 65 };

  // Calculate coordinates
  const getX = (index: number) => {
    if (chartData.length <= 1) {
      return padding.left + (width - padding.left - padding.right) / 2;
    }
    return padding.left + (index * (width - padding.left - padding.right)) / (chartData.length - 1);
  };

  const getY = (val: number) => {
    return height - padding.bottom - (val * (height - padding.top - padding.bottom)) / maxVal;
  };

  // Generate paths
  let gmvLinePath = "";
  let gmvAreaPath = "";
  let netLinePath = "";
  let netAreaPath = "";

  if (chartData.length > 0) {
    const gmvPoints = chartData.map((d, i) => `${getX(i)},${getY(d.gmv)}`);
    const netPoints = chartData.map((d, i) => `${getX(i)},${getY(d.netRevenue)}`);

    gmvLinePath = `M ${gmvPoints.join(" L ")}`;
    netLinePath = `M ${netPoints.join(" L ")}`;

    const startX = getX(0);
    const endX = getX(chartData.length - 1);
    const baseY = height - padding.bottom;

    gmvAreaPath = `M ${startX},${baseY} L ${gmvPoints.join(" L ")} L ${endX},${baseY} Z`;
    netAreaPath = `M ${startX},${baseY} L ${netPoints.join(" L ")} L ${endX},${baseY} Z`;
  }

  // Handle Mouse Move for Tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || chartData.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - padding.left;
    const chartWidth = rect.width - padding.left - padding.right;
    
    const percent = Math.max(0, Math.min(1, mouseX / chartWidth));
    const rawIdx = percent * (chartData.length - 1);
    const index = Math.round(rawIdx);

    if (index >= 0 && index < chartData.length) {
      setHoveredIndex(index);
      
      const xPos = getX(index) * (rect.width / width);
      const yPos = getY(chartData[index].gmv) * (rect.height / height) - 85;
      
      setTooltipPos({
        x: Math.max(10, Math.min(rect.width - 200, xPos - 80)),
        y: Math.max(10, yPos),
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="analytics-section">
      {/* Header Panel */}
      <div className="analytics-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "var(--text-primary)" }}>
            Financial Performance & Growth Analytics
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Visualize fee volumes, net revenues, and Month-over-Month growth trends.
          </p>
        </div>

        <div className="analytics-tabs" id="analytics-tabs-selector">
          <button
            className={`analytics-tab ${activeTab === "daily" ? "active" : ""}`}
            onClick={() => { setActiveTab("daily"); setHoveredIndex(null); }}
            id="btn-tab-daily"
          >
            Day-wise (Daily Timeline)
          </button>
          <button
            className={`analytics-tab ${activeTab === "monthly" ? "active" : ""}`}
            onClick={() => { setActiveTab("monthly"); setHoveredIndex(null); }}
            id="btn-tab-monthly"
          >
            Monthly Trend
          </button>
        </div>
      </div>

      {/* Filter Control Toolbar Card */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          
          {/* Preset Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Date Range Preset
            </label>
            <select
              className="btn btn-secondary"
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem" }}
              value={presetRange}
              onChange={(e) => setPresetRange(e.target.value as any)}
              id="filter-preset-range"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this_month">This Month</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range Fields (Conditional) */}
          {presetRange === "custom" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--surface-color)",
                    color: "var(--text-primary)",
                    fontSize: "0.875rem",
                  }}
                  id="filter-start-date"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--surface-color)",
                    color: "var(--text-primary)",
                    fontSize: "0.875rem",
                  }}
                  id="filter-end-date"
                />
              </div>
            </>
          )}

          {/* Month Filter Dropdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Filter by Billing Month
            </label>
            <select
              className="btn btn-secondary"
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem" }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              id="filter-month"
            >
              <option value="all">All Months</option>
              {uniqueMonths.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters Shortcut */}
          <div style={{ alignSelf: "flex-end", paddingBottom: "2px" }}>
            <button
              onClick={() => {
                setPresetRange("30d");
                setSelectedMonth("all");
              }}
              style={{
                fontSize: "0.8125rem",
                color: "var(--primary)",
                fontWeight: "500",
                textDecoration: "underline",
              }}
            >
              Reset Filters
            </button>
          </div>

          {/* Legend visualizer */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "1.25rem", fontSize: "0.8125rem" }}>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: "var(--primary)" }}></span>
              <span>Fee Volume (GMV)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: "var(--secondary)" }}></span>
              <span>Net Revenue</span>
            </div>
          </div>

        </div>
      </div>

      <div className="analytics-grid">
        {/* SVG Chart Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <span className="card-title">
              {activeTab === "daily" ? "Financial Performance Timeline" : "Monthly Financial Summary Chart"}
            </span>
          </div>

          <div className="chart-container" ref={containerRef}>
            {chartData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
                No transactional history matches the selected filters.
              </div>
            ) : (
              <>
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  width="100%"
                  height="100%"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ overflow: "visible" }}
                >
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines & Y-axis labels */}
                  {gridTicks.map((t, idx) => {
                    const y = getY(maxVal * t);
                    return (
                      <g key={idx}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          className="chart-gridline"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="chart-axis-text"
                        >
                          {formatCurrency(maxVal * t)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Fills */}
                  {chartData.length > 1 && (
                    <>
                      <path d={gmvAreaPath} fill="url(#gmvGradient)" />
                      <path d={netAreaPath} fill="url(#netGradient)" />
                    </>
                  )}

                  {/* Line Paths */}
                  {chartData.length > 1 ? (
                    <>
                      <path
                        d={gmvLinePath}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={netLinePath}
                        fill="none"
                        stroke="var(--secondary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  ) : (
                    // Fallback for single data point
                    <>
                      <circle cx={getX(0)} cy={getY(chartData[0].gmv)} r="6" fill="var(--primary)" />
                      <circle cx={getX(0)} cy={getY(chartData[0].netRevenue)} r="6" fill="var(--secondary)" />
                    </>
                  )}

                  {/* Hover vertical guide line */}
                  {hoveredIndex !== null && (
                    <line
                      x1={getX(hoveredIndex)}
                      y1={padding.top}
                      x2={getX(hoveredIndex)}
                      y2={height - padding.bottom}
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Highlight dots on hover */}
                  {hoveredIndex !== null && (
                    <>
                      <circle
                        cx={getX(hoveredIndex)}
                        cy={getY(chartData[hoveredIndex].gmv)}
                        r="5"
                        fill="var(--primary)"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <circle
                        cx={getX(hoveredIndex)}
                        cy={getY(chartData[hoveredIndex].netRevenue)}
                        r="5"
                        fill="var(--secondary)"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </>
                  )}

                  {/* X-axis date labels */}
                  {chartData.map((d, idx) => {
                    const step = Math.ceil(chartData.length / 10);
                    if (idx % step !== 0 && idx !== chartData.length - 1) return null;

                    const label = activeTab === "daily" ? (d as DailyData).dateLabel : (d as MonthlyData).monthLabel;
                    return (
                      <text
                        key={idx}
                        x={getX(idx)}
                        y={height - padding.bottom + 18}
                        textAnchor="middle"
                        className="chart-axis-text"
                      >
                        {label}
                      </text>
                    );
                  })}
                </svg>

                {/* Floating Tooltip */}
                {hoveredIndex !== null && (
                  <div
                    className="chart-tooltip"
                    style={{
                      left: `${tooltipPos.x}px`,
                      top: `${tooltipPos.y}px`,
                    }}
                  >
                    <div className="chart-tooltip-title">
                      {activeTab === "daily"
                        ? (chartData[hoveredIndex] as DailyData).dateLabel
                        : (chartData[hoveredIndex] as MonthlyData).monthLabel}
                    </div>
                    <div className="chart-tooltip-row">
                      <span style={{ color: "var(--text-secondary)" }}>Fee Volume (GMV):</span>
                      <span className="chart-tooltip-value" style={{ color: "var(--primary)" }}>
                        {formatCurrency(chartData[hoveredIndex].gmv)}
                      </span>
                    </div>
                    <div className="chart-tooltip-row">
                      <span style={{ color: "var(--text-secondary)" }}>Net Revenue:</span>
                      <span className="chart-tooltip-value" style={{ color: "var(--secondary)" }}>
                        {formatCurrency(chartData[hoveredIndex].netRevenue)}
                      </span>
                    </div>
                    <div className="chart-tooltip-row">
                      <span style={{ color: "var(--text-secondary)" }}>Transactions:</span>
                      <span className="chart-tooltip-value">
                        {chartData[hoveredIndex].txCount}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Month-over-Month Growth Summary Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <span className="card-title">MoM Growth Tracker</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, justifyContent: "center" }}>
            {monthlyData.length <= 1 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem 0" }}>
                Accumulate transaction history across multiple months to track MoM growth rates.
              </div>
            ) : (
              (() => {
                const latest = monthlyData[monthlyData.length - 1];
                const prev = monthlyData[monthlyData.length - 2];
                const growth = latest.momGrowth;
                const isPositive = growth >= 0;

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        Latest Monthly Revenue ({latest.monthLabel})
                      </div>
                      <div style={{ fontSize: "2rem", fontWeight: "700", marginTop: "0.25rem" }}>
                        {formatCurrency(latest.netRevenue)}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span
                        className={`trend-badge ${
                          isPositive ? "trend-badge-positive" : "trend-badge-negative"
                        }`}
                        style={{ fontSize: "1rem", padding: "0.375rem 0.75rem" }}
                      >
                        {isPositive ? "▲" : "▼"} {Math.abs(growth).toFixed(1)}%
                      </span>
                      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        vs previous month ({formatCurrency(prev.netRevenue)})
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "var(--bg-color)",
                        borderRadius: "8px",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      💡 Growth is calculated based on the net retained revenue after accounting for setup subvention profits, bank commissions (+1%), and partner payouts.
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary Roster Table */}
      <div className="card" style={{ marginTop: "1.5rem" }} id="monthly-analysis-roster">
        <div className="card-header">
          <span className="card-title">Monthly Performance Analysis Ledger</span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Billing Month</th>
                <th>Fee Volume (GMV)</th>
                <th>Net Retained Revenue</th>
                <th>MoM Growth</th>
                <th>Transactions</th>
                <th>Average Ticket Size</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m, idx) => {
                const avgTicket = m.txCount > 0 ? m.gmv / m.txCount : 0;
                return (
                  <tr key={m.month}>
                    <td style={{ fontWeight: 600 }}>{m.monthLabel}</td>
                    <td>{formatCurrency(m.gmv)}</td>
                    <td style={{ fontWeight: 600, color: "var(--primary)" }}>{formatCurrency(m.netRevenue)}</td>
                    <td>
                      {idx === 0 ? (
                        <span className="trend-badge trend-badge-neutral">Baseline</span>
                      ) : m.momGrowth >= 0 ? (
                        <span className="trend-badge trend-badge-positive">
                          ▲ +{m.momGrowth.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="trend-badge trend-badge-negative">
                          ▼ {m.momGrowth.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td>{m.txCount}</td>
                    <td>{formatCurrency(avgTicket)}</td>
                  </tr>
                );
              })}
              {monthlyData.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                    No monthly summary data matches the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
