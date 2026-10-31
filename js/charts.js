/**
 * Weather Trend and Rainfall Analysis - Chart.js Visualization Engine
 * Renders 6 interactive charts with Dark/Light theme adaptability, responsive layouts,
 * tooltips, zoom/reset capabilities, and smooth animated updates.
 */

const WeatherCharts = (() => {
  // Chart instances registry
  const instances = {
    tempTrend: null,
    monthlyRain: null,
    yearlyCompare: null,
    seasonalDonut: null,
    scatterPlot: null,
    cityCompare: null
  };

  /**
   * Theme palette configuration for Light and Dark modes
   */
  function getThemeColors(isDark) {
    if (isDark) {
      return {
        textColor: "#94a3b8",
        headingColor: "#f1f5f9",
        gridColor: "rgba(255, 255, 255, 0.08)",
        tooltipBg: "rgba(15, 23, 42, 0.95)",
        tooltipBorder: "#334155",
        cardBg: "#1e293b",
        primaryBlue: "#38bdf8",
        secondaryBlue: "#0284c7",
        accentOrange: "#fb923c",
        accentGreen: "#34d399",
        accentPurple: "#c084fc",
        accentRed: "#f87171",
        seasonColors: ["#60a5fa", "#fbbf24", "#38bdf8", "#f472b6"]
      };
    }
    return {
      textColor: "#64748b",
      headingColor: "#1e293b",
      gridColor: "rgba(0, 0, 0, 0.06)",
      tooltipBg: "rgba(30, 41, 59, 0.95)",
      tooltipBorder: "#cbd5e1",
      cardBg: "#ffffff",
      primaryBlue: "#0284c7",
      secondaryBlue: "#0369a1",
      accentOrange: "#ea580c",
      accentGreen: "#059669",
      accentPurple: "#7c3aed",
      accentRed: "#dc2626",
      seasonColors: ["#3b82f6", "#f59e0b", "#0284c7", "#ec4899"]
    };
  }

  function destroyChart(key) {
    if (instances[key]) {
      instances[key].destroy();
      instances[key] = null;
    }
  }

  /**
   * 1. Temperature Trends Over Time (Interactive Line Chart)
   */
  function renderTemperatureTrend(records, isDark = false) {
    destroyChart("tempTrend");
    const canvas = document.getElementById("chart-temp-trend");
    if (!canvas) return;

    const colors = getThemeColors(isDark);
    
    // Sort records chronologically
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Sample if data is too dense for line chart (>180 points) to maintain high performance
    const step = Math.max(1, Math.floor(sorted.length / 150));
    const sampled = sorted.filter((_, idx) => idx % step === 0);

    const labels = sampled.map((r) => r.date);
    const maxTemps = sampled.map((r) => r.max_temp);
    const minTemps = sampled.map((r) => r.min_temp);
    const avgTemps = sampled.map((r) => r.avg_temp);

    const ctx = canvas.getContext("2d");
    instances.tempTrend = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Max Temp (°C)",
            data: maxTemps,
            borderColor: colors.accentOrange,
            backgroundColor: "rgba(251, 146, 60, 0.08)",
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            pointRadius: sampled.length > 50 ? 0 : 3,
            pointHoverRadius: 5
          },
          {
            label: "Mean Temp (°C)",
            data: avgTemps,
            borderColor: colors.primaryBlue,
            backgroundColor: "rgba(56, 189, 248, 0.12)",
            borderWidth: 2.5,
            tension: 0.3,
            fill: true,
            pointRadius: sampled.length > 50 ? 0 : 3,
            pointHoverRadius: 6
          },
          {
            label: "Min Temp (°C)",
            data: minTemps,
            borderColor: colors.accentGreen,
            backgroundColor: "rgba(52, 211, 153, 0.08)",
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            pointRadius: sampled.length > 50 ? 0 : 3,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: { color: colors.headingColor, font: { weight: "600", size: 12 } }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: "#ffffff",
            bodyColor: "#e2e8f0",
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}°C`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: colors.textColor,
              maxTicksLimit: 10,
              font: { size: 11 }
            },
            grid: { color: colors.gridColor }
          },
          y: {
            title: { display: true, text: "Temperature (°C)", color: colors.textColor },
            ticks: { color: colors.textColor, font: { size: 11 } },
            grid: { color: colors.gridColor }
          }
        }
      }
    });
  }

  /**
   * 2. Monthly Rainfall Pattern (Bar Chart)
   */
  function renderMonthlyRainfall(monthlyData, isDark = false) {
    destroyChart("monthlyRain");
    const canvas = document.getElementById("chart-monthly-rain");
    if (!canvas) return;

    const colors = getThemeColors(isDark);
    const labels = monthlyData.map((m) => m.monthShort);
    const rainfall = monthlyData.map((m) => m.totalRainfall);
    const rainyDays = monthlyData.map((m) => m.rainyDays);

    const ctx = canvas.getContext("2d");
    instances.monthlyRain = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Rainfall (mm)",
            data: rainfall,
            backgroundColor: isDark ? "rgba(56, 189, 248, 0.75)" : "rgba(2, 132, 199, 0.8)",
            borderColor: isDark ? "#38bdf8" : "#0284c7",
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: "y"
          },
          {
            label: "Rainy Days (>=1mm)",
            data: rainyDays,
            type: "line",
            borderColor: colors.accentOrange,
            backgroundColor: colors.accentOrange,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.25,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { color: colors.headingColor, font: { weight: "600", size: 12 } }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: "#ffffff",
            bodyColor: "#e2e8f0",
            borderColor: colors.tooltipBorder,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: colors.textColor, font: { size: 11 } },
            grid: { color: colors.gridColor }
          },
          y: {
            position: "left",
            title: { display: true, text: "Rainfall (mm)", color: colors.textColor },
            ticks: { color: colors.textColor, font: { size: 11 } },
            grid: { color: colors.gridColor }
          },
          y1: {
            position: "right",
            title: { display: true, text: "Rainy Days", color: colors.textColor },
            ticks: { color: colors.textColor, font: { size: 11 }, precision: 0 },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  /**
   * 3. Year-over-Year Rainfall Comparison (Grouped Bar Chart)
   */
  function renderYearlyComparison(yearlyData, isDark = false) {
    destroyChart("yearlyCompare");
    const canvas = document.getElementById("chart-yearly-compare");
    if (!canvas) return;

    const colors = getThemeColors(isDark);
    const labels = yearlyData.map((y) => `Year ${y.year}`);
    const rainfalls = yearlyData.map((y) => y.totalRainfall);
    const rainyDays = yearlyData.map((y) => y.rainyDays);

    const ctx = canvas.getContext("2d");
    instances.yearlyCompare = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Annual Rainfall (mm)",
            data: rainfalls,
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(14, 165, 233, 0.8)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(249, 115, 22, 0.8)",
              "rgba(168, 85, 247, 0.8)"
            ],
            borderColor: [
              "#3b82f6",
              "#0ea5e9",
              "#10b981",
              "#f97316",
              "#a855f7"
            ],
            borderWidth: 1.5,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: "#ffffff",
            bodyColor: "#e2e8f0",
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              afterLabel: (ctx) => {
                const item = yearlyData[ctx.dataIndex];
                const changeStr = item.yoyRainfallPercent !== null
                  ? `YoY Change: ${item.yoyRainfallPercent > 0 ? "+" : ""}${item.yoyRainfallPercent}%`
                  : "Baseline Year";
                return `Rainy Days: ${item.rainyDays}\nAvg Temp: ${item.avgTemp}°C\n${changeStr}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: colors.textColor, font: { size: 12, weight: "600" } },
            grid: { color: colors.gridColor }
          },
          y: {
            title: { display: true, text: "Annual Rainfall (mm)", color: colors.textColor },
            ticks: { color: colors.textColor, font: { size: 11 } },
            grid: { color: colors.gridColor }
          }
        }
      }
    });
  }

  /**
   * 4. Seasonal Rainfall Distribution (Doughnut Chart)
   */
  function renderSeasonalDonut(seasonalData, isDark = false) {
    destroyChart("seasonalDonut");
    const canvas = document.getElementById("chart-seasonal-donut");
    if (!canvas) return;

    const colors = getThemeColors(isDark);
    const labels = seasonalData.map((s) => `${s.name} (${s.months})`);
    const data = seasonalData.map((s) => s.totalRainfall);

    const ctx = canvas.getContext("2d");
    instances.seasonalDonut = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors.seasonColors,
            borderColor: isDark ? "#1e293b" : "#ffffff",
            borderWidth: 3,
            hoverOffset: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "64%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: colors.headingColor, font: { size: 11, weight: "500" }, padding: 12 }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: "#ffffff",
            bodyColor: "#e2e8f0",
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              label: (ctx) => {
                const item = seasonalData[ctx.dataIndex];
                return `${item.name}: ${item.totalRainfall.toLocaleString()} mm (${item.percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * 5. Temperature vs Rainfall Relationship (Scatter Plot)
   */
  function renderScatterPlot(records, isDark = false) {
    destroyChart("scatterPlot");
    const canvas = document.getElementById("chart-scatter-plot");
    if (!canvas) return;

    const colors = getThemeColors(isDark);
    
    // Sample if data exceeds 300 points for crisp presentation
    const step = Math.max(1, Math.floor(records.length / 250));
    const points = [];
    records.forEach((r, idx) => {
      if (idx % step === 0 && r.avg_temp !== null && r.rainfall !== null) {
        points.push({
          x: r.avg_temp,
          y: r.rainfall,
          date: r.date,
          season: r.season
        });
      }
    });

    const ctx = canvas.getContext("2d");
    instances.scatterPlot = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Daily Observation",
            data: points,
            backgroundColor: isDark ? "rgba(56, 189, 248, 0.65)" : "rgba(2, 132, 199, 0.6)",
            borderColor: isDark ? "#38bdf8" : "#0284c7",
            borderWidth: 1,
            pointRadius: 4.5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: "#ffffff",
            bodyColor: "#e2e8f0",
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              title: (ctx) => `Date: ${ctx[0].raw.date} (${ctx[0].raw.season})`,
              label: (ctx) => `Mean Temp: ${ctx.raw.x}°C | Rainfall: ${ctx.raw.y} mm`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: "Mean Temperature (°C)", color: colors.textColor },
            ticks: { color: colors.textColor, font: { size: 11 } },
            grid: { color: colors.gridColor }
          },
          y: {
            title: { display: true, text: "Rainfall (mm)", color: colors.textColor },
            ticks: { color: colors.textColor, font: { size: 11 } },
            grid: { color: colors.gridColor }
          }
        }
      }
    });
  }

  /**
   * 6. City-Wise Comparison Radar / Bar Chart (Comparing 5 Indian Cities)
   */
  function renderCityComparison(cityComparisons, isDark = false) {
    destroyChart("cityCompare");
    const canvas = document.getElementById("chart-city-compare");
    if (!canvas) return;

    const colors = getThemeColors(isDark);
    const cities = Object.values(cityComparisons);
    const labels = cities.map((c) => c.name);
    const annualRain = cities.map((c) => c.annualAvgRain);
    const avgTemps = cities.map((c) => c.summary.avgTemp);
    const rainyDaysPerYear = cities.map((c) => Math.round(c.summary.rainyDays / 4));

    const ctx = canvas.getContext("2d");
    instances.cityCompare = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Annual Rainfall Avg (mm)",
            data: annualRain,
            backgroundColor: isDark ? "rgba(56, 189, 248, 0.8)" : "rgba(2, 132, 199, 0.8)",
            borderColor: isDark ? "#38bdf8" : "#0284c7",
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: "y"
          },
          {
            label: "Annual Rainy Days Avg",
            data: rainyDaysPerYear,
            backgroundColor: "rgba(245, 158, 11, 0.8)",
            borderColor: "#f59e0b",
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { color: colors.headingColor, font: { weight: "600", size: 12 } }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: "#ffffff",
            bodyColor: "#e2e8f0",
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              afterBody: (ctx) => {
                const c = cities[ctx[0].dataIndex];
                return `Mean Temp: ${c.summary.avgTemp}°C\nPeak Heat: ${c.summary.maxTemp}°C | Coldest: ${c.summary.minTemp}°C`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: colors.headingColor, font: { size: 12, weight: "600" } },
            grid: { color: colors.gridColor }
          },
          y: {
            position: "left",
            title: { display: true, text: "Annual Rainfall (mm)", color: colors.textColor },
            ticks: { color: colors.textColor, font: { size: 11 } },
            grid: { color: colors.gridColor }
          },
          y1: {
            position: "right",
            title: { display: true, text: "Rainy Days per Year", color: colors.textColor },
            ticks: { color: colors.textColor, font: { size: 11 } },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  /**
   * Re-render all active charts when theme toggles
   */
  function updateTheme(isDark, state) {
    if (!state) return;
    if (state.records) renderTemperatureTrend(state.records, isDark);
    if (state.monthly) renderMonthlyRainfall(state.monthly, isDark);
    if (state.yearly) renderYearlyComparison(state.yearly, isDark);
    if (state.seasonal) renderSeasonalDonut(state.seasonal, isDark);
    if (state.records) renderScatterPlot(state.records, isDark);
    if (state.cityComparisons) renderCityComparison(state.cityComparisons, isDark);
  }

  return {
    renderTemperatureTrend,
    renderMonthlyRainfall,
    renderYearlyComparison,
    renderSeasonalDonut,
    renderScatterPlot,
    renderCityComparison,
    updateTheme,
    destroyChart
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = WeatherCharts;
} else {
  window.WeatherCharts = WeatherCharts;
}
