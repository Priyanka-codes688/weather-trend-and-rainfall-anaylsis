/**
 * Weather Trend and Rainfall Analysis - AI Weather Chatbot
 * "Weather AI Assistant"
 * Features:
 * - Natural language queries for Mumbai, Delhi, Bengaluru, Kolkata, Chennai
 * - Answers about live temperature, rainfall, humidity, wind, forecasts, records, and seasonal trends
 * - City-to-city weather comparisons
 * - Real data engine + backend `/api/chat` proxy with zero frontend API key exposure
 * - Typing indicators, quick prompt chips, responsive mobile & desktop UI
 */

const WeatherChatbot = (() => {
  let isChatOpen = false;
  let allHistoricalRecords = [];
  let currentCityId = "mumbai";

  const QUICK_QUESTIONS = [
    "What is today's live weather in Mumbai?",
    "Show 7-day forecast for Bengaluru",
    "Compare rainfall between Mumbai and Delhi",
    "Which is the wettest month in Kolkata?",
    "What was the highest temperature recorded in Delhi?",
    "Compare current weather in Chennai and Bengaluru"
  ];

  function init(records, defaultCity) {
    allHistoricalRecords = records || [];
    currentCityId = defaultCity || "mumbai";

    bindChatEvents();
    renderQuickPrompts();
  }

  function setHistoricalRecords(records) {
    allHistoricalRecords = records || [];
  }

  function setActiveCity(cityId) {
    currentCityId = cityId;
  }

  function bindChatEvents() {
    const toggleBtn = document.getElementById("chatbot-toggle-btn");
    const closeBtn = document.getElementById("chat-close-btn");
    const chatWindow = document.getElementById("chatbot-window");
    const sendBtn = document.getElementById("chat-send-btn");
    const input = document.getElementById("chat-input");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        isChatOpen = !isChatOpen;
        if (chatWindow) {
          chatWindow.classList.toggle("open", isChatOpen);
        }
        if (isChatOpen && input) {
          setTimeout(() => input.focus(), 200);
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        isChatOpen = false;
        if (chatWindow) chatWindow.classList.remove("open");
      });
    }

    if (sendBtn && input) {
      sendBtn.addEventListener("click", () => handleUserSend());
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleUserSend();
        }
      });
    }
  }

  function renderQuickPrompts() {
    const container = document.getElementById("chat-quick-prompts");
    if (!container) return;

    container.innerHTML = QUICK_QUESTIONS.map(
      (q) => `<button type="button" class="quick-chip" data-query="${q}">${q}</button>`
    ).join("");

    container.querySelectorAll(".quick-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const query = btn.getAttribute("data-query");
        const input = document.getElementById("chat-input");
        if (input) {
          input.value = query;
          handleUserSend();
        }
      });
    });
  }

  async function handleUserSend() {
    const input = document.getElementById("chat-input");
    if (!input) return;

    const query = input.value.trim();
    if (!query) return;

    input.value = "";
    appendUserMessage(query);
    showTypingIndicator();

    try {
      const response = await processWeatherQuery(query);
      hideTypingIndicator();
      appendBotMessage(response);
    } catch (err) {
      hideTypingIndicator();
      appendBotMessage({
        html: `I encountered an issue processing that query: <em>${err.message}</em>. Please try asking again about temperature, rainfall, forecasts, or comparisons between Mumbai, Delhi, Bengaluru, Kolkata, or Chennai.`
      });
    }
  }

  function appendUserMessage(text) {
    const msgContainer = document.getElementById("chat-messages");
    if (!msgContainer) return;

    const div = document.createElement("div");
    div.className = "chat-bubble user-bubble";
    div.textContent = text;
    msgContainer.appendChild(div);
    scrollToBottom();
  }

  function appendBotMessage(responseObj) {
    const msgContainer = document.getElementById("chat-messages");
    if (!msgContainer) return;

    const div = document.createElement("div");
    div.className = "chat-bubble bot-bubble";
    div.innerHTML = responseObj.html;
    msgContainer.appendChild(div);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const msgContainer = document.getElementById("chat-messages");
    if (!msgContainer) return;

    let typing = document.getElementById("chat-typing-indicator");
    if (!typing) {
      typing = document.createElement("div");
      typing.id = "chat-typing-indicator";
      typing.className = "chat-typing";
      typing.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-text">Weather AI is analyzing genuine observations...</span>
      `;
      msgContainer.appendChild(typing);
    }
    typing.style.display = "flex";
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const typing = document.getElementById("chat-typing-indicator");
    if (typing) typing.style.display = "none";
  }

  function scrollToBottom() {
    const msgContainer = document.getElementById("chat-messages");
    if (msgContainer) {
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  }

  /**
   * Main Query Processor: Natural Language Understanding over genuine weather data
   */
  async function processWeatherQuery(query) {
    const q = query.toLowerCase();

    // First attempt to call the backend /api/chat if running
    try {
      const backendRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, currentCity: currentCityId })
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data && data.html) {
          return data;
        }
      }
    } catch (e) {
      // Backend not running or in static browser mode, proceed to client-side engine
    }

    // Detect mentioned cities
    const cityList = ["mumbai", "delhi", "bengaluru", "kolkata", "chennai"];
    const mentionedCities = cityList.filter((c) => {
      if (c === "bengaluru") return q.includes("bengaluru") || q.includes("bangalore");
      return q.includes(c);
    });

    const primaryCity = mentionedCities[0] || currentCityId;

    // 1. Multi-City Comparison Check
    if (
      mentionedCities.length >= 2 ||
      q.includes("compare") ||
      q.includes("versus") ||
      q.includes("vs") ||
      q.includes("difference")
    ) {
      const cityA = mentionedCities[0] || "mumbai";
      const cityB = mentionedCities[1] || (cityA === "mumbai" ? "delhi" : "mumbai");
      return await generateComparisonResponse(cityA, cityB, q);
    }

    // 2. Live Forecast / Today / Tomorrow / 7-Day Forecast Check
    if (
      q.includes("forecast") ||
      q.includes("tomorrow") ||
      q.includes("week") ||
      q.includes("7 day") ||
      q.includes("live") ||
      q.includes("current") ||
      q.includes("today") ||
      q.includes("now")
    ) {
      return await generateLiveForecastResponse(primaryCity, q);
    }

    // 3. Rainfall / Monsoon / Rainy Days / Wettest Month
    if (
      q.includes("rain") ||
      q.includes("precipitation") ||
      q.includes("monsoon") ||
      q.includes("wettest") ||
      q.includes("driest")
    ) {
      return generateRainfallResponse(primaryCity, q);
    }

    // 4. Temperature / Heat / Cold / Hottest / Coldest
    if (
      q.includes("temp") ||
      q.includes("hot") ||
      q.includes("cold") ||
      q.includes("warm") ||
      q.includes("degree") ||
      q.includes("celsius")
    ) {
      return generateTemperatureResponse(primaryCity, q);
    }

    // 5. Humidity or Wind
    if (q.includes("humidity") || q.includes("humid") || q.includes("wind") || q.includes("breeze")) {
      return await generateAtmosphericResponse(primaryCity, q);
    }

    // 6. General City Climate Summary
    return generateCityOverviewResponse(primaryCity);
  }

  /**
   * Generates live weather conditions and 7-day forecast
   */
  async function generateLiveForecastResponse(cityId, q) {
    const city = WeatherAPI.getCity(cityId);
    const live = await WeatherAPI.fetchLiveWeather(cityId);

    const cur = live.current;
    const isForecastRequest = q.includes("forecast") || q.includes("7 day") || q.includes("week") || q.includes("tomorrow");

    let forecastTableHtml = "";
    if (isForecastRequest && live.forecast && live.forecast.length > 0) {
      forecastTableHtml = `
        <div class="chat-forecast-cards">
          ${live.forecast
            .map(
              (f) => `
            <div class="chat-forecast-chip">
              <span class="f-day">${f.dayName}</span>
              <span class="f-date">${f.dateFormatted}</span>
              <span class="f-cond">${f.weatherLabel}</span>
              <span class="f-temp">${f.tempMin}° / ${f.tempMax}°C</span>
              <span class="f-rain">${f.precipSum > 0 ? f.precipSum + "mm" : "0mm"}</span>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    return {
      html: `
        <div class="chat-card">
          <div class="chat-card-title">
            <strong>${city.name} Live Weather & Forecast</strong>
            <span class="badge badge-primary">${city.badge}</span>
          </div>
          <p>Current observation from <strong>Open-Meteo High-Resolution Model</strong>:</p>
          <ul class="chat-stats-list">
            <li><strong>Temperature:</strong> ${cur.temp} °C (Feels like ${cur.feelsLike} °C)</li>
            <li><strong>Condition:</strong> ${cur.condition}</li>
            <li><strong>Humidity:</strong> ${cur.humidity}%</li>
            <li><strong>Rainfall:</strong> ${cur.rainMm} mm</li>
            <li><strong>Wind Speed:</strong> ${cur.windSpeedKmh} km/h</li>
            <li><strong>Surface Pressure:</strong> ${cur.pressureHpa} hPa</li>
          </ul>
          ${forecastTableHtml}
          <div class="chat-data-source">Source: Open-Meteo Official Forecast API (${new Date(live.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})</div>
        </div>
      `
    };
  }

  /**
   * Generates comparison between two cities using both live and historical datasets
   */
  async function generateComparisonResponse(cityAId, cityBId, q) {
    const cityA = WeatherAPI.getCity(cityAId);
    const cityB = WeatherAPI.getCity(cityBId);

    // Fetch live data for both
    const [liveA, liveB] = await Promise.all([
      WeatherAPI.fetchLiveWeather(cityAId),
      WeatherAPI.fetchLiveWeather(cityBId)
    ]);

    // Compute historical metrics for both
    const recsA = allHistoricalRecords.filter((r) => r.city.toLowerCase() === cityA.name.toLowerCase());
    const recsB = allHistoricalRecords.filter((r) => r.city.toLowerCase() === cityB.name.toLowerCase());

    const sumA = WeatherAnalytics.computeSummary(recsA);
    const sumB = WeatherAnalytics.computeSummary(recsB);

    const rainA = sumA.totalRainfall ? Math.round(sumA.totalRainfall / 4) : cityA.annualRainfallAvg;
    const rainB = sumB.totalRainfall ? Math.round(sumB.totalRainfall / 4) : cityB.annualRainfallAvg;

    const tempDiff = Math.abs(liveA.current.temp - liveB.current.temp).toFixed(1);
    const hotterCity = liveA.current.temp > liveB.current.temp ? cityA.name : cityB.name;
    const wetterCity = rainA > rainB ? cityA.name : cityB.name;

    return {
      html: `
        <div class="chat-card">
          <div class="chat-card-title">
            <strong>Weather Comparison: ${cityA.name} vs ${cityB.name}</strong>
          </div>
          <table class="chat-comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>${cityA.name}</th>
                <th>${cityB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Current Temp</td>
                <td><strong>${liveA.current.temp}°C</strong> (${liveA.current.condition})</td>
                <td><strong>${liveB.current.temp}°C</strong> (${liveB.current.condition})</td>
              </tr>
              <tr>
                <td>Current Humidity</td>
                <td>${liveA.current.humidity}%</td>
                <td>${liveB.current.humidity}%</td>
              </tr>
              <tr>
                <td>Current Wind</td>
                <td>${liveA.current.windSpeedKmh} km/h</td>
                <td>${liveB.current.windSpeedKmh} km/h</td>
              </tr>
              <tr>
                <td>Annual Rainfall Avg</td>
                <td><strong>${rainA.toLocaleString()} mm</strong></td>
                <td><strong>${rainB.toLocaleString()} mm</strong></td>
              </tr>
              <tr>
                <td>Historical Mean Temp</td>
                <td>${sumA.avgTemp}°C</td>
                <td>${sumB.avgTemp}°C</td>
              </tr>
              <tr>
                <td>Historical Rainy Days/yr</td>
                <td>${Math.round(sumA.rainyDays / 4)} days</td>
                <td>${Math.round(sumB.rainyDays / 4)} days</td>
              </tr>
            </tbody>
          </table>
          <p class="chat-highlight mt-2">
            💡 <strong>Key Finding:</strong> <strong>${hotterCity}</strong> is currently warmer by ${tempDiff}°C. In terms of precipitation, <strong>${wetterCity}</strong> receives significantly higher annual rainfall due to regional monsoon dynamics.
          </p>
        </div>
      `
    };
  }

  /**
   * Generates analytical answers regarding rainfall
   */
  function generateRainfallResponse(cityId, q) {
    const city = WeatherAPI.getCity(cityId);
    const recs = allHistoricalRecords.filter((r) => r.city.toLowerCase() === city.name.toLowerCase());
    const monthly = WeatherAnalytics.aggregateMonthly(recs);
    const extremes = WeatherAnalytics.getExtremes(monthly);
    const summary = WeatherAnalytics.computeSummary(recs);
    const seasonal = WeatherAnalytics.aggregateSeasonal(recs);

    const monsoon = seasonal.find((s) => s.name === "Monsoon");
    const monsoonShare = monsoon ? monsoon.percentage : 0;

    return {
      html: `
        <div class="chat-card">
          <div class="chat-card-title">
            <strong>${city.name} - Rainfall & Precipitation Analysis</strong>
          </div>
          <p>Based on <strong>4 years (2022–2025)</strong> of verified Open-Meteo observations for ${city.name}:</p>
          <ul class="chat-stats-list">
            <li><strong>Total Recorded Rainfall:</strong> ${summary.totalRainfall.toLocaleString()} mm (${summary.rainyDays} rainy days)</li>
            <li><strong>Annual Average:</strong> ~${Math.round(summary.totalRainfall / 4).toLocaleString()} mm/year</li>
            <li><strong>Wettest Month:</strong> <strong>${extremes.wettest ? extremes.wettest.monthName : "July"}</strong> (${extremes.wettest ? extremes.wettest.totalRainfall.toLocaleString() : "--"} mm total)</li>
            <li><strong>Driest Month:</strong> <strong>${extremes.driest ? extremes.driest.monthName : "January"}</strong> (${extremes.driest ? extremes.driest.totalRainfall : "--"} mm)</li>
            <li><strong>Highest Single-Day Rain:</strong> ${summary.maxRainfallDay ? summary.maxRainfallDay.rainfall + " mm on " + summary.maxRainfallDay.date : "--"}</li>
            <li><strong>Monsoon Concentration:</strong> <strong>${monsoonShare}%</strong> of precipitation falls during June–September.</li>
          </ul>
        </div>
      `
    };
  }

  /**
   * Generates analytical answers regarding temperature trends
   */
  function generateTemperatureResponse(cityId, q) {
    const city = WeatherAPI.getCity(cityId);
    const recs = allHistoricalRecords.filter((r) => r.city.toLowerCase() === city.name.toLowerCase());
    const summary = WeatherAnalytics.computeSummary(recs);

    return {
      html: `
        <div class="chat-card">
          <div class="chat-card-title">
            <strong>${city.name} - Temperature Trends & Extremes</strong>
          </div>
          <p>From the verified historical meteorological dataset (2022–2025):</p>
          <ul class="chat-stats-list">
            <li><strong>Average Mean Temperature:</strong> <strong>${summary.avgTemp} °C</strong></li>
            <li><strong>All-Time Recorded Peak:</strong> <strong>${summary.maxTemp} °C</strong> ${summary.maxTempDay ? "(recorded on " + summary.maxTempDay.date + ")" : ""}</li>
            <li><strong>All-Time Recorded Low:</strong> <strong>${summary.minTemp} °C</strong> ${summary.minTempDay ? "(recorded on " + summary.minTempDay.date + ")" : ""}</li>
            <li><strong>Thermal Range (Amplitude):</strong> ${Math.round((summary.maxTemp - summary.minTemp) * 10) / 10} °C</li>
            <li><strong>Climate Zone:</strong> ${city.climate}</li>
          </ul>
        </div>
      `
    };
  }

  /**
   * Generates answers regarding humidity and wind
   */
  async function generateAtmosphericResponse(cityId, q) {
    const city = WeatherAPI.getCity(cityId);
    const live = await WeatherAPI.fetchLiveWeather(cityId);
    const recs = allHistoricalRecords.filter((r) => r.city.toLowerCase() === city.name.toLowerCase());
    const summary = WeatherAnalytics.computeSummary(recs);

    return {
      html: `
        <div class="chat-card">
          <div class="chat-card-title">
            <strong>${city.name} - Humidity & Wind Conditions</strong>
          </div>
          <ul class="chat-stats-list">
            <li><strong>Current Live Humidity:</strong> <strong>${live.current.humidity}%</strong></li>
            <li><strong>Historical Average Humidity:</strong> ${summary.avgHumidity}%</li>
            <li><strong>Current Wind Speed:</strong> <strong>${live.current.windSpeedKmh} km/h</strong></li>
            <li><strong>Historical Average Wind:</strong> ${summary.avgWindSpeed} km/h</li>
            <li><strong>Barometric Pressure:</strong> ${live.current.pressureHpa} hPa</li>
          </ul>
        </div>
      `
    };
  }

  /**
   * Overview summary of a city
   */
  function generateCityOverviewResponse(cityId) {
    const city = WeatherAPI.getCity(cityId);
    return {
      html: `
        <div class="chat-card">
          <div class="chat-card-title">
            <strong>${city.name} Climate Profile</strong>
            <span class="badge badge-primary">${city.badge}</span>
          </div>
          <p><em>${city.tagline}</em></p>
          <ul class="chat-stats-list">
            <li><strong>Geographic Coordinates:</strong> ${city.latitude}° N, ${city.longitude}° E</li>
            <li><strong>Elevation:</strong> ${city.elevation} meters above sea level</li>
            <li><strong>Climate Classification:</strong> ${city.climate}</li>
            <li><strong>Approximate Annual Rainfall:</strong> ${city.annualRainfallAvg} mm</li>
          </ul>
          <p class="chat-tip">💡 You can ask me: <em>"What is today's forecast for ${city.name}?"</em> or <em>"Compare ${city.name} and Delhi"</em>.</p>
        </div>
      `
    };
  }

  return {
    init,
    setHistoricalRecords,
    setActiveCity,
    processWeatherQuery
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = WeatherChatbot;
} else {
  window.WeatherChatbot = WeatherChatbot;
}
