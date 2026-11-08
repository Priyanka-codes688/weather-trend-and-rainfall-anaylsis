/**
 * Weather Trend and Rainfall Analysis - Main Application Controller
 * Coordinates API requests, state management, UI rendering, filters, theme toggle, and chatbot.
 */

const App = (() => {
  // Global application state
  const state = {
    allRecords: [],
    filteredRecords: [],
    activeCityId: "mumbai",
    isDarkTheme: false,
    filters: {
      city: "mumbai",
      year: "all",
      season: "all",
      month: "all",
      startDate: "",
      endDate: ""
    },
    liveWeatherData: null,
    cityComparisons: null,
    rainfallRanking: [],
    isCustomDataLoaded: false
  };

  /**
   * Application bootstrap
   */
  async function init() {
    initTheme();
    bindGlobalEvents();

    showLoadingState(true);
    try {
      // 1. Load genuine historical dataset
      const dataPackage = await WeatherAPI.loadHistoricalDataset();
      state.allRecords = dataPackage.records || [];
      
      // Calculate overall multi-city comparisons
      state.cityComparisons = WeatherAnalytics.compareAllCities(state.allRecords);

      // 2. Initialize table module
      WeatherTable.init(state.allRecords, handleCustomDataUpload);

      // 3. Initialize chatbot module
      WeatherChatbot.init(state.allRecords, state.activeCityId);

      // 4. Populate filter dropdowns dynamically
      populateFilterOptions();

      // 5. Apply default filter (Mumbai)
      applyFilters();

      // 6. Fetch live forecast for default city
      await refreshLiveWeather();

      showLoadingState(false);
      console.log(`Weather Trend and Rainfall Analysis ready with ${state.allRecords.length} records.`);
    } catch (err) {
      console.error("Initialization error:", err);
      showLoadingState(false);
      showGlobalError("Failed to initialize dataset: " + err.message);
    }
  }

  /**
   * Theme Management: Dark Mode & Light Mode
   */
  function initTheme() {
    const savedTheme = localStorage.getItem("weather_theme");
    // Respect user's saved preference or system preference
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme(true);
    } else {
      setTheme(false);
    }

    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        setTheme(!state.isDarkTheme);
      });
    }
  }

  function setTheme(isDark) {
    state.isDarkTheme = isDark;
    const root = document.documentElement;
    const body = document.body;
    const themeIcon = document.getElementById("theme-toggle-icon");
    const themeLabel = document.getElementById("theme-toggle-label");

    if (isDark) {
      root.classList.add("dark");
      body.classList.add("dark-theme");
      if (themeIcon) {
        // Moon to Sun icon for toggle back to light
        themeIcon.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
          </svg>
        `;
      }
      if (themeLabel) themeLabel.textContent = "Light Mode";
      localStorage.setItem("weather_theme", "dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark-theme");
      if (themeIcon) {
        // Sun to Moon icon for toggle to dark
        themeIcon.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
        `;
      }
      if (themeLabel) themeLabel.textContent = "Dark Mode";
      localStorage.setItem("weather_theme", "light");
    }

    // Update all active charts to reflect the new theme colors
    refreshChartsTheme();
  }

  function refreshChartsTheme() {
    const monthly = WeatherAnalytics.aggregateMonthly(state.filteredRecords);
    const yearly = WeatherAnalytics.aggregateYearly(state.filteredRecords);
    const seasonal = WeatherAnalytics.aggregateSeasonal(state.filteredRecords);

    WeatherCharts.updateTheme(state.isDarkTheme, {
      records: state.filteredRecords,
      monthly: monthly,
      yearly: yearly,
      seasonal: seasonal,
      cityComparisons: state.cityComparisons,
      rainfallRanking: state.rainfallRanking
    });
  }

  /**
   * Bind event handlers for controls, filters, and city selectors
   */
  function bindGlobalEvents() {
    // City Quick Selector Tabs
    document.querySelectorAll(".city-tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const cityId = btn.getAttribute("data-city");
        if (cityId) {
          selectCity(cityId);
        }
      });
    });

    // Filter controls
    const citySelect = document.getElementById("filter-city");
    if (citySelect) {
      citySelect.addEventListener("change", (e) => {
        selectCity(e.target.value);
      });
    }

    const yearSelect = document.getElementById("filter-year");
    if (yearSelect) {
      yearSelect.addEventListener("change", (e) => {
        state.filters.year = e.target.value;
        applyFilters();
      });
    }

    const seasonSelect = document.getElementById("filter-season");
    if (seasonSelect) {
      seasonSelect.addEventListener("change", (e) => {
        state.filters.season = e.target.value;
        applyFilters();
      });
    }

    const monthSelect = document.getElementById("filter-month");
    if (monthSelect) {
      monthSelect.addEventListener("change", (e) => {
        state.filters.month = e.target.value;
        applyFilters();
      });
    }

    const startDateInput = document.getElementById("filter-start-date");
    const endDateInput = document.getElementById("filter-end-date");
    if (startDateInput) {
      startDateInput.addEventListener("change", (e) => {
        state.filters.startDate = e.target.value;
        applyFilters();
      });
    }
    if (endDateInput) {
      endDateInput.addEventListener("change", (e) => {
        state.filters.endDate = e.target.value;
        applyFilters();
      });
    }

    // Reset filters
    const resetBtn = document.getElementById("btn-reset-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        resetFilters();
      });
    }

    // Live weather refresh button
    const refreshLiveBtn = document.getElementById("btn-refresh-live");
    if (refreshLiveBtn) {
      refreshLiveBtn.addEventListener("click", () => {
        refreshLiveWeather();
      });
    }
  }

  /**
   * Select a city across all dashboard elements
   */
  async function selectCity(cityId) {
    if (state.activeCityId === cityId && state.filters.city === cityId) return;

    state.activeCityId = cityId;
    state.filters.city = cityId;

    // Update city dropdown if not in sync
    const citySelect = document.getElementById("filter-city");
    if (citySelect && citySelect.value !== cityId) {
      citySelect.value = cityId;
    }

    // Update active tab buttons
    document.querySelectorAll(".city-tab-btn").forEach((btn) => {
      if (btn.getAttribute("data-city") === cityId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update active city banners & badges
    const cityMeta = WeatherAPI.getCity(cityId);
    if (cityMeta) {
      document.querySelectorAll(".active-city-name").forEach((el) => {
        el.textContent = cityMeta.name;
      });
      document.querySelectorAll(".active-city-state").forEach((el) => {
        el.textContent = cityMeta.state;
      });
      document.querySelectorAll(".active-city-badge").forEach((el) => {
        el.textContent = cityMeta.badge;
      });
      document.querySelectorAll(".active-city-tagline").forEach((el) => {
        el.textContent = cityMeta.tagline;
      });
      document.querySelectorAll(".active-city-coords").forEach((el) => {
        el.textContent = `${cityMeta.latitude}° N, ${cityMeta.longitude}° E (Elev. ${cityMeta.elevation}m)`;
      });
    }

    // Notify chatbot
    WeatherChatbot.setActiveCity(cityId);

    // Apply filters and re-render dashboard
    applyFilters();

    // Fetch live weather for the new city
    await refreshLiveWeather();
  }

  /**
   * Populate filter year and month options
   */
  function populateFilterOptions() {
    const yearSelect = document.getElementById("filter-year");
    if (yearSelect) {
      const years = Array.from(new Set(state.allRecords.map((r) => r.year))).sort((a, b) => b - a);
      yearSelect.innerHTML = `<option value="all">All Years (2022 - 2025)</option>` +
        years.map((y) => `<option value="${y}">Year ${y}</option>`).join("");
    }
  }

  /**
   * Filter dataset and recalculate all visual & statistical components
   */
  function applyFilters() {
    let list = [...state.allRecords];

    // Year filter
    if (state.filters.year && state.filters.year !== "all") {
      const y = parseInt(state.filters.year, 10);
      list = list.filter((r) => r.year === y);
    }

    // Season filter
    if (state.filters.season && state.filters.season !== "all") {
      list = list.filter((r) => String(r.season || "").toLowerCase() === state.filters.season.toLowerCase());
    }

    // Month filter
    if (state.filters.month && state.filters.month !== "all") {
      const m = parseInt(state.filters.month, 10);
      list = list.filter((r) => r.month === m);
    }

    // Date range filter
    if (state.filters.startDate) {
      list = list.filter((r) => r.date >= state.filters.startDate);
    }
    if (state.filters.endDate) {
      list = list.filter((r) => r.date <= state.filters.endDate);
    }

    const cityComparisonRecords = list;
    if (state.filters.city && state.filters.city !== "all") {
      const targetCity = WeatherAPI.getCity(state.filters.city);
      const targetName = targetCity ? targetCity.name.toLowerCase() : state.filters.city.toLowerCase();
      list = list.filter((r) => String(r.city || "").toLowerCase() === targetName);
    }

    state.filteredRecords = list;

    // Update Summary KPI Cards
    updateSummaryCards(list);

    // Update Visualizations
    updateVisualizations(list, cityComparisonRecords);

    // Update Insights
    updateInsights(list, cityComparisonRecords);

    // Update Table
    WeatherTable.setRecords(list);
  }

  /**
   * Reset all filters to default state (Current city, all years, all seasons)
   */
  function resetFilters() {
    state.filters.year = "all";
    state.filters.season = "all";
    state.filters.month = "all";
    state.filters.startDate = "";
    state.filters.endDate = "";

    const ySelect = document.getElementById("filter-year");
    if (ySelect) ySelect.value = "all";

    const sSelect = document.getElementById("filter-season");
    if (sSelect) sSelect.value = "all";

    const mSelect = document.getElementById("filter-month");
    if (mSelect) mSelect.value = "all";

    const sDate = document.getElementById("filter-start-date");
    if (sDate) sDate.value = "";

    const eDate = document.getElementById("filter-end-date");
    if (eDate) eDate.value = "";

    applyFilters();
  }

  /**
   * Render Top 4 Summary Cards
   */
  function updateSummaryCards(records) {
    const summary = WeatherAnalytics.computeSummary(records);

    // 1. Average Temperature Card
    const avgTempEl = document.getElementById("card-avg-temp");
    const minMaxTempSubEl = document.getElementById("card-temp-range-sub");
    if (avgTempEl) avgTempEl.textContent = `${summary.avgTemp} °C`;
    if (minMaxTempSubEl) {
      minMaxTempSubEl.textContent = `Min: ${summary.minTemp}°C | Max: ${summary.maxTemp}°C`;
    }

    // 2. Total Rainfall Card
    const totalRainEl = document.getElementById("card-total-rain");
    const avgRainSubEl = document.getElementById("card-total-rain-sub");
    if (totalRainEl) totalRainEl.textContent = `${summary.totalRainfall.toLocaleString()} mm`;
    if (avgRainSubEl) {
      avgRainSubEl.textContent = `Avg ${summary.avgRainfall} mm/day (${summary.count} observed days)`;
    }

    // 3. Highest Rainfall Record Card
    const maxRainEl = document.getElementById("card-highest-rain");
    const maxRainDateSubEl = document.getElementById("card-highest-rain-sub");
    if (maxRainEl) {
      maxRainEl.textContent = summary.maxRainfallDay ? `${summary.maxRainfallDay.rainfall} mm` : "0.0 mm";
    }
    if (maxRainDateSubEl) {
      maxRainDateSubEl.textContent = summary.maxRainfallDay ? `Occurred on ${summary.maxRainfallDay.date}` : "No precipitation";
    }

    // 4. Rainy Days Card
    const rainyDaysEl = document.getElementById("card-rainy-days");
    const rainyDaysSubEl = document.getElementById("card-rainy-days-sub");
    if (rainyDaysEl) rainyDaysEl.textContent = `${summary.rainyDays} Days`;
    if (rainyDaysSubEl) {
      rainyDaysSubEl.textContent = `${summary.rainyDaysPercent}% of period (Threshold >= 1mm)`;
    }
  }

  /**
   * Render all 7 Chart.js charts
   */
  function updateVisualizations(records, cityComparisonRecords = records) {
    const isDark = state.isDarkTheme;
    const monthly = WeatherAnalytics.aggregateMonthly(records);
    const yearly = WeatherAnalytics.aggregateYearly(records);
    const seasonal = WeatherAnalytics.aggregateSeasonal(records);
    state.rainfallRanking = WeatherAnalytics.getCityRainfallRanking(cityComparisonRecords);

    WeatherCharts.renderTemperatureTrend(records, isDark);
    WeatherCharts.renderMonthlyRainfall(monthly, isDark);
    WeatherCharts.renderYearlyComparison(yearly, isDark);
    WeatherCharts.renderSeasonalDonut(seasonal, isDark);
    WeatherCharts.renderScatterPlot(records, isDark);
    WeatherCharts.renderRainfallRanking(state.rainfallRanking, isDark);
    updateRainfallRankingTable(state.rainfallRanking);
    updateMonthlyRainfallHeatmap(cityComparisonRecords);

    if (state.cityComparisons) {
      WeatherCharts.renderCityComparison(state.cityComparisons, isDark);
    }
  }

  function updateRainfallRankingTable(ranking) {
    const tableBody = document.getElementById("rainfall-ranking-table-body");
    if (!tableBody) return;

    let rank = 0;
    tableBody.innerHTML = ranking.map((city) => `
      <tr>
        <td>${city.totalRainfall === null ? "--" : ++rank}</td>
        <th scope="row">${city.name}</th>
        <td>${city.totalRainfall === null ? "No data" : `${city.totalRainfall.toLocaleString()} mm`}</td>
        <td>${city.totalRainfall === null ? "--" : city.rainyDays.toLocaleString()}</td>
      </tr>
    `).join("");
  }

  function updateMonthlyRainfallHeatmap(records) {
    const tableBody = document.getElementById("monthly-rainfall-heatmap-body");
    if (!tableBody) return;

    const rows = WeatherAnalytics.getMonthlyRainfallByCity(records);
    const validValues = rows.flatMap((row) => row.months
      .filter((month) => month.totalRainfall !== null)
      .map((month) => month.totalRainfall));
    const maxRainfall = validValues.length ? Math.max(...validValues) : null;

    tableBody.innerHTML = rows.map((row) => `
      <tr>
        <th scope="row">${row.city}</th>
        ${row.months.map((month) => {
          if (month.totalRainfall === null) {
            return `<td class="rainfall-heatmap-cell heatmap-missing" aria-label="${row.city}, ${WeatherAnalytics.MONTH_NAMES[month.month - 1]}: no data">--</td>`;
          }
          const intensity = month.totalRainfall === 0 || !maxRainfall
            ? 0
            : Math.min(5, Math.ceil((month.totalRainfall / maxRainfall) * 5));
          const value = month.totalRainfall.toLocaleString();
          return `<td class="rainfall-heatmap-cell heatmap-intensity-${intensity}" aria-label="${row.city}, ${WeatherAnalytics.MONTH_NAMES[month.month - 1]}: ${value} millimeters across ${month.observationCount} days" title="${value} mm across ${month.observationCount} days">${value}</td>`;
        }).join("")}
      </tr>
    `).join("");

    const legend = document.getElementById("monthly-rainfall-heatmap-legend");
    if (legend) {
      legend.querySelectorAll(".heatmap-legend-step span").forEach((label, index) => {
        label.textContent = maxRainfall === null
          ? "--"
          : index === 0 || maxRainfall === 0
            ? "0"
            : `${Math.round((maxRainfall * index / 5) * 10) / 10}`;
      });
    }
  }

  /**
   * Render Meteorological Insights Section
   */
  function updateInsights(records, cityComparisonRecords = records) {
    const container = document.getElementById("insights-container");
    const cityMeta = WeatherAPI.getCity(state.activeCityId);
    const cityName = cityMeta ? cityMeta.name : "Selected Region";
    const insights = records.length
      ? WeatherAnalytics.generateInsights(records, cityName)
      : [{ title: "No weather observations", category: "rainfall", text: "No records match the selected filters." }];

    if (container) {
      container.innerHTML = insights
        .map(
          (ins) => `
          <div class="insight-card insight-${ins.category}">
            <div class="insight-header">
              <h4 class="insight-title">${ins.title}</h4>
            </div>
            <p class="insight-text">${ins.text}</p>
          </div>
        `
        )
        .join("");
    }

    updateSmartInsightCards(records, cityComparisonRecords);
  }

  function updateSmartInsightCards(records, cityComparisonRecords) {
    const insights = WeatherAnalytics.getSmartInsights(records, cityComparisonRecords);
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };

    setText("smart-wettest-month", insights.wettestMonth ? insights.wettestMonth.monthName : "No data");
    setText("smart-wettest-rainfall", insights.wettestMonth ? `${insights.wettestMonth.totalRainfall.toLocaleString()} mm rainfall` : "No valid rainfall records");
    setText("smart-driest-month", insights.driestMonth ? insights.driestMonth.monthName : "No data");
    setText("smart-driest-rainfall", insights.driestMonth ? `${insights.driestMonth.totalRainfall.toLocaleString()} mm rainfall` : "No valid rainfall records");
    setText("smart-highest-city", insights.highestRainfallCity ? insights.highestRainfallCity.name : "No data");
    setText("smart-highest-city-rainfall", insights.highestRainfallCity ? `${insights.highestRainfallCity.totalRainfall.toLocaleString()} mm rainfall` : "No valid rainfall records");
    setText("smart-lowest-city", insights.lowestRainfallCity ? insights.lowestRainfallCity.name : "No data");
    setText("smart-lowest-city-rainfall", insights.lowestRainfallCity ? `${insights.lowestRainfallCity.totalRainfall.toLocaleString()} mm rainfall` : "No valid rainfall records");
    setText("smart-rainy-days", insights.rainyDays.toLocaleString());
    setText("smart-average-temperature", insights.averageTemperature === null ? "No data" : `${insights.averageTemperature} °C`);
  }

  function getInsightIconSvg(iconName) {
    switch (iconName) {
      case "droplet":
        return `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"></path></svg>`;
      case "sun":
        return `<svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" stroke-width="2"></circle><path stroke-linecap="round" stroke-width="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>`;
      case "thermometer":
        return `<svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"></path></svg>`;
      case "trending-up":
        return `<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>`;
      default:
        return `<svg class="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`;
    }
  }

  /**
   * Fetch and render real-time live weather and 7-day forecast
   */
  async function refreshLiveWeather() {
    const liveContainer = document.getElementById("live-weather-card");
    const forecastContainer = document.getElementById("live-forecast-strip");
    const statusPill = document.getElementById("live-status-pill");

    if (statusPill) {
      statusPill.innerHTML = `<span class="pulse-dot animate-pulse"></span> Fetching live data...`;
    }

    try {
      const live = await WeatherAPI.fetchLiveWeather(state.activeCityId);
      state.liveWeatherData = live;

      // Update Live Weather Card
      if (liveContainer) {
        const cur = live.current;
        document.getElementById("live-temp").textContent = `${cur.temp}°C`;
        document.getElementById("live-condition").textContent = cur.condition;
        document.getElementById("live-feels-like").textContent = `Feels like ${cur.feelsLike}°C`;
        document.getElementById("live-humidity").textContent = `${cur.humidity}%`;
        document.getElementById("live-rainfall").textContent = `${cur.rainMm} mm`;
        document.getElementById("live-wind").textContent = `${cur.windSpeedKmh} km/h`;
        document.getElementById("live-pressure").textContent = `${cur.pressureHpa} hPa`;
        
        const timestampEl = document.getElementById("live-updated-time");
        if (timestampEl) {
          const t = new Date(live.timestamp);
          timestampEl.textContent = `Updated: ${t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
        }
      }

      // Update 7-Day Forecast Strip
      if (forecastContainer && live.forecast) {
        forecastContainer.innerHTML = live.forecast
          .map(
            (day) => `
            <div class="forecast-day-card">
              <span class="forecast-day-name">${day.dayName}</span>
              <span class="forecast-day-date">${day.dateFormatted}</span>
              <span class="forecast-icon">${getWeatherIconSvg(day.icon)}</span>
              <span class="forecast-temp-range">
                <span class="max-t">${day.tempMax}°</span> / <span class="min-t">${day.tempMin}°</span>
              </span>
              <span class="forecast-rain-prob">
                ${day.precipSum > 0 ? `💧 ${day.precipSum}mm` : "☀️ 0mm"}
              </span>
            </div>
          `
          )
          .join("");
      }

      if (statusPill) {
        statusPill.innerHTML = `<span class="pulse-dot dot-live"></span> Live API Connected`;
      }
    } catch (err) {
      console.warn("Live weather update warning:", err);
      if (statusPill) {
        statusPill.innerHTML = `<span class="pulse-dot dot-cached"></span> Offline Cache Active`;
      }
    }
  }

  function getWeatherIconSvg(iconName) {
    switch (iconName) {
      case "sun":
        return `<svg class="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>`;
      case "cloud-rain":
      case "cloud-rain-heavy":
      case "cloud-drizzle":
        return `<svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 16.2A4.5 4.5 0 0017.5 8h-1.8A7 7 0 104 14.9M8 19v2m4-2v2m4-2v2"></path></svg>`;
      case "cloud-lightning":
        return `<svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-1-4m1 4l4-5M13 3l-4 8h6l-2 5"></path></svg>`;
      default:
        return `<svg class="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`;
    }
  }

  /**
   * Handle user custom CSV upload
   */
  function handleCustomDataUpload(newRecords, filename) {
    state.isCustomDataLoaded = true;
    state.allRecords = newRecords;
    state.filters.city = "all";
    state.filters.year = "all";
    state.filters.season = "all";

    // Update city comparisons with new custom data
    state.cityComparisons = WeatherAnalytics.compareAllCities(state.allRecords);

    // Update chatbot with uploaded dataset
    WeatherChatbot.setHistoricalRecords(newRecords);

    // Refresh dashboard
    populateFilterOptions();
    applyFilters();

    const banner = document.getElementById("custom-dataset-banner");
    if (banner) {
      banner.style.display = "flex";
      document.getElementById("custom-dataset-name").textContent = filename;
    }
  }

  function showLoadingState(isLoading) {
    const loader = document.getElementById("global-loader");
    if (loader) {
      loader.style.display = isLoading ? "flex" : "none";
    }
  }

  function showGlobalError(msg) {
    const errorBox = document.getElementById("global-error-banner");
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.style.display = "block";
    }
  }

  return {
    init,
    selectCity,
    applyFilters,
    resetFilters,
    setTheme,
    refreshLiveWeather
  };
})();

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
