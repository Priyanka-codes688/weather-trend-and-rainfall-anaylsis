/**
 * Weather Trend and Rainfall Analysis - Analytical Calculations Engine
 * Calculates metrics, aggregates, statistical distributions, year-over-year trends,
 * and dynamic natural-language meteorological insights based on genuine data.
 */

const WeatherAnalytics = (() => {
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const SEASONS = ["Winter", "Summer", "Monsoon", "Post-Monsoon"];
  const CITY_NAMES = ["Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai"];

  function isValidNumber(value) {
    return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  }

  /**
   * Calculate comprehensive summary statistics from a list of records
   */
  function computeSummary(records) {
    if (!records || records.length === 0) {
      return {
        count: 0,
        avgTemp: 0,
        minTemp: 0,
        maxTemp: 0,
        totalRainfall: 0,
        avgRainfall: 0,
        rainyDays: 0,
        rainyDaysPercent: 0,
        maxRainfallDay: null,
        minTempDay: null,
        maxTempDay: null,
        avgHumidity: 0,
        avgWindSpeed: 0
      };
    }

    let tempSum = 0;
    let tempCount = 0;
    let humiditySum = 0;
    let humidityCount = 0;
    let windSum = 0;
    let windCount = 0;
    let totalRain = 0;
    let rainyDays = 0;

    let minT = Infinity;
    let maxT = -Infinity;
    let maxRain = -1;
    let maxRainRecord = null;
    let minTRecord = null;
    let maxTRecord = null;

    records.forEach((r) => {
      // Temperature
      if (r.avg_temp !== null && r.avg_temp !== undefined) {
        tempSum += r.avg_temp;
        tempCount++;
      }
      if (r.min_temp !== null && r.min_temp !== undefined) {
        if (r.min_temp < minT) {
          minT = r.min_temp;
          minTRecord = r;
        }
      }
      if (r.max_temp !== null && r.max_temp !== undefined) {
        if (r.max_temp > maxT) {
          maxT = r.max_temp;
          maxTRecord = r;
        }
      }

      // Rainfall (Rainy day defined as precipitation >= 1.0 mm as per standard IMD criteria)
      const rain = r.rainfall || 0;
      totalRain += rain;
      if (rain >= 1.0) {
        rainyDays++;
      }
      if (rain > maxRain) {
        maxRain = rain;
        maxRainRecord = r;
      }

      // Humidity
      if (r.humidity !== null && r.humidity !== undefined) {
        humiditySum += r.humidity;
        humidityCount++;
      }

      // Wind
      if (r.wind_speed !== null && r.wind_speed !== undefined) {
        windSum += r.wind_speed;
        windCount++;
      }
    });

    const count = records.length;
    return {
      count: count,
      avgTemp: tempCount > 0 ? Math.round((tempSum / tempCount) * 10) / 10 : 0,
      minTemp: minT !== Infinity ? minT : 0,
      maxTemp: maxT !== -Infinity ? maxT : 0,
      totalRainfall: Math.round(totalRain * 10) / 10,
      avgRainfall: count > 0 ? Math.round((totalRain / count) * 100) / 100 : 0,
      avgRainfallPerRainyDay: rainyDays > 0 ? Math.round((totalRain / rainyDays) * 10) / 10 : 0,
      rainyDays: rainyDays,
      rainyDaysPercent: count > 0 ? Math.round((rainyDays / count) * 1000) / 10 : 0,
      maxRainfallDay: maxRainRecord,
      minTempDay: minTRecord,
      maxTempDay: maxTRecord,
      avgHumidity: humidityCount > 0 ? Math.round(humiditySum / humidityCount) : 0,
      avgWindSpeed: windCount > 0 ? Math.round((windSum / windCount) * 10) / 10 : 0
    };
  }

  /**
   * Monthly aggregation: returns total rainfall, average max & min temp for each month (1-12)
   */
  function aggregateMonthly(records) {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: MONTH_NAMES[i],
      monthShort: MONTH_NAMES[i].slice(0, 3),
      totalRainfall: 0,
      avgTempSum: 0,
      maxTempSum: 0,
      minTempSum: 0,
      count: 0,
      rainyDays: 0
    }));

    records.forEach((r) => {
      const mIdx = r.month - 1;
      if (mIdx >= 0 && mIdx < 12) {
        months[mIdx].count++;
        months[mIdx].totalRainfall += r.rainfall || 0;
        if ((r.rainfall || 0) >= 1.0) months[mIdx].rainyDays++;
        if (r.avg_temp !== null) months[mIdx].avgTempSum += r.avg_temp;
        if (r.max_temp !== null) months[mIdx].maxTempSum += r.max_temp;
        if (r.min_temp !== null) months[mIdx].minTempSum += r.min_temp;
      }
    });

    return months.map((m) => ({
      ...m,
      totalRainfall: Math.round(m.totalRainfall * 10) / 10,
      avgRainfall: m.count > 0 ? Math.round((m.totalRainfall / (m.count / 30 || 1)) * 10) / 10 : 0,
      avgTemp: m.count > 0 ? Math.round((m.avgTempSum / m.count) * 10) / 10 : 0,
      avgMaxTemp: m.count > 0 ? Math.round((m.maxTempSum / m.count) * 10) / 10 : 0,
      avgMinTemp: m.count > 0 ? Math.round((m.minTempSum / m.count) * 10) / 10 : 0
    }));
  }

  /**
   * Yearly aggregation: returns yearly total rainfall, avg temp, rainy days, YoY percentage changes
   */
  function aggregateYearly(records) {
    const yearlyMap = {};

    records.forEach((r) => {
      const y = r.year;
      if (!yearlyMap[y]) {
        yearlyMap[y] = {
          year: y,
          count: 0,
          totalRainfall: 0,
          avgTempSum: 0,
          rainyDays: 0,
          maxTemp: -Infinity,
          minTemp: Infinity
        };
      }
      yearlyMap[y].count++;
      yearlyMap[y].totalRainfall += r.rainfall || 0;
      if ((r.rainfall || 0) >= 1.0) yearlyMap[y].rainyDays++;
      if (r.avg_temp !== null) yearlyMap[y].avgTempSum += r.avg_temp;
      if (r.max_temp !== null && r.max_temp > yearlyMap[y].maxTemp) yearlyMap[y].maxTemp = r.max_temp;
      if (r.min_temp !== null && r.min_temp < yearlyMap[y].minTemp) yearlyMap[y].minTemp = r.min_temp;
    });

    const sortedYears = Object.keys(yearlyMap)
      .map(Number)
      .sort((a, b) => a - b);

    const result = [];
    for (let i = 0; i < sortedYears.length; i++) {
      const y = sortedYears[i];
      const cur = yearlyMap[y];
      const avgT = cur.count > 0 ? Math.round((cur.avgTempSum / cur.count) * 10) / 10 : 0;
      const totalR = Math.round(cur.totalRainfall * 10) / 10;

      let yoyRainfallChange = null;
      let yoyRainfallPercent = null;
      if (i > 0) {
        const prev = result[i - 1];
        if (prev.totalRainfall > 0) {
          yoyRainfallChange = Math.round((totalR - prev.totalRainfall) * 10) / 10;
          yoyRainfallPercent = Math.round(((totalR - prev.totalRainfall) / prev.totalRainfall) * 1000) / 10;
        }
      }

      result.push({
        year: y,
        count: cur.count,
        totalRainfall: totalR,
        avgTemp: avgT,
        rainyDays: cur.rainyDays,
        maxTemp: cur.maxTemp !== -Infinity ? cur.maxTemp : 0,
        minTemp: cur.minTemp !== Infinity ? cur.minTemp : 0,
        yoyRainfallChange,
        yoyRainfallPercent
      });
    }

    return result;
  }

  /**
   * Seasonal aggregation: IMD defined seasons
   */
  function aggregateSeasonal(records) {
    const seasonsMap = {
      Winter: { name: "Winter", months: "Jan - Feb", totalRainfall: 0, count: 0, tempSum: 0, rainyDays: 0 },
      Summer: { name: "Summer", months: "Mar - May", totalRainfall: 0, count: 0, tempSum: 0, rainyDays: 0 },
      Monsoon: { name: "Monsoon", months: "Jun - Sep", totalRainfall: 0, count: 0, tempSum: 0, rainyDays: 0 },
      "Post-Monsoon": { name: "Post-Monsoon", months: "Oct - Dec", totalRainfall: 0, count: 0, tempSum: 0, rainyDays: 0 }
    };

    records.forEach((r) => {
      const s = r.season || "Monsoon";
      if (seasonsMap[s]) {
        seasonsMap[s].count++;
        seasonsMap[s].totalRainfall += r.rainfall || 0;
        if ((r.rainfall || 0) >= 1.0) seasonsMap[s].rainyDays++;
        if (r.avg_temp !== null) seasonsMap[s].tempSum += r.avg_temp;
      }
    });

    const totalRainAll = Object.values(seasonsMap).reduce((acc, s) => acc + s.totalRainfall, 0) || 1;

    return Object.values(seasonsMap).map((s) => ({
      ...s,
      totalRainfall: Math.round(s.totalRainfall * 10) / 10,
      avgTemp: s.count > 0 ? Math.round((s.tempSum / s.count) * 10) / 10 : 0,
      percentage: Math.round((s.totalRainfall / totalRainAll) * 1000) / 10
    }));
  }

  /**
   * Identify wettest and driest months across records
   */
  function getExtremes(monthlyData) {
    if (!monthlyData || monthlyData.length === 0) return { wettest: null, driest: null };

    let wettest = monthlyData[0];
    let driest = monthlyData[0];

    monthlyData.forEach((m) => {
      if (m.totalRainfall > wettest.totalRainfall) wettest = m;
      if (m.totalRainfall < driest.totalRainfall) driest = m;
    });

    return { wettest, driest };
  }

  function getCityRainfallRanking(records) {
    const totals = new Map(CITY_NAMES.map((name) => [name, { name, totalRainfall: 0, rainyDays: 0, observationCount: 0 }]));

    (records || []).forEach((record) => {
      if (!record || typeof record.city !== "string") return;
      const name = CITY_NAMES.find((city) => city.toLowerCase() === record.city.trim().toLowerCase());
      if (!isValidNumber(record.rainfall)) return;
      const rain = Number(record.rainfall);
      if (!name || rain < 0) return;

      const city = totals.get(name);
      if (!Number.isFinite(city.totalRainfall + rain)) return;
      city.totalRainfall += rain;
      city.observationCount++;
      if (rain >= 1.0) city.rainyDays++;
    });

    return Array.from(totals.values())
      .map((city) => ({
        ...city,
        totalRainfall: city.observationCount ? Math.round(city.totalRainfall * 10) / 10 : null
      }))
      .sort((a, b) => {
        if (a.totalRainfall === null) return b.totalRainfall === null ? 0 : 1;
        if (b.totalRainfall === null) return -1;
        return b.totalRainfall - a.totalRainfall;
      });
  }

  function getMonthlyRainfallByCity(records) {
    const totals = new Map(CITY_NAMES.map((name) => [
      name,
      Array.from({ length: 12 }, (_, index) => ({ month: index + 1, totalRainfall: 0, observationCount: 0 }))
    ]));

    (records || []).forEach((record) => {
      if (!record || typeof record.city !== "string") return;
      const name = CITY_NAMES.find((city) => city.toLowerCase() === record.city.trim().toLowerCase());
      if (!isValidNumber(record.rainfall) || !isValidNumber(record.month)) return;
      const rain = Number(record.rainfall);
      const month = Number(record.month);
      if (!name || rain < 0 || !Number.isInteger(month) || month < 1 || month > 12) return;

      const cell = totals.get(name)[month - 1];
      if (!Number.isFinite(cell.totalRainfall + rain)) return;
      cell.totalRainfall += rain;
      cell.observationCount++;
    });

    return Array.from(totals, ([city, months]) => ({
      city,
      months: months.map((month) => ({
        ...month,
        totalRainfall: month.observationCount ? Math.round(month.totalRainfall * 10) / 10 : null
      }))
    }));
  }

  function getSmartInsights(records, cityComparisonRecords) {
    const validRecords = (records || []).filter((record) => record && typeof record === "object");
    const validTemperatures = validRecords
      .filter((record) => isValidNumber(record.avg_temp))
      .map((record) => Number(record.avg_temp));
    const validRainfallRecords = validRecords.filter((record) =>
      isValidNumber(record.rainfall) && Number(record.rainfall) >= 0
    );
    const monthly = aggregateMonthly(validRainfallRecords)
      .filter((month) => month.count > 0);
    const extremes = getExtremes(monthly);
    const ranking = getCityRainfallRanking(cityComparisonRecords);
    const citiesWithData = ranking.filter((city) => city.totalRainfall !== null);
    const cityRainfallHigh = citiesWithData.length ? citiesWithData[0] : null;
    const cityRainfallLow = citiesWithData.length ? citiesWithData[citiesWithData.length - 1] : null;

    return {
      wettestMonth: extremes.wettest,
      driestMonth: extremes.driest,
      highestRainfallCity: cityRainfallHigh,
      lowestRainfallCity: cityRainfallLow,
      rainyDays: validRainfallRecords.filter((record) => Number(record.rainfall) >= 1.0).length,
      averageTemperature: validTemperatures.length
        ? Math.round((validTemperatures.reduce((sum, temperature) => sum + temperature, 0) / validTemperatures.length) * 10) / 10
        : null
    };
  }

  /**
   * Calculate Pearson correlation coefficient between temperature and rainfall
   */
  function calculateTempRainCorrelation(records) {
    const valid = records.filter(
      (r) => r.avg_temp !== null && r.avg_temp !== undefined && r.rainfall !== null && r.rainfall !== undefined
    );
    const n = valid.length;
    if (n < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    valid.forEach((r) => {
      const x = r.avg_temp;
      const y = r.rainfall;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    });

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 1000) / 1000;
  }

  /**
   * Generate intelligent, dynamic meteorological insights based on filtered dataset
   */
  function generateInsights(records, cityName, isMultiCity = false) {
    if (!records || records.length === 0) {
      return ["No weather observations available for the selected criteria."];
    }

    const summary = computeSummary(records);
    const monthly = aggregateMonthly(records);
    const yearly = aggregateYearly(records);
    const seasonal = aggregateSeasonal(records);
    const extremes = getExtremes(monthly);
    const correlation = calculateTempRainCorrelation(records);

    const insights = [];

    // 1. Monsoon & Rainfall Intensity
    const monsoonSeason = seasonal.find((s) => s.name === "Monsoon");
    const monsoonPct = monsoonSeason ? monsoonSeason.percentage : 0;
    if (extremes.wettest) {
      insights.push({
        title: "Precipitation Dominance & Peak Period",
        icon: "droplet",
        category: "rainfall",
        text: `<strong>${extremes.wettest.monthName}</strong> is the wettest month for ${cityName}, registering <strong>${extremes.wettest.totalRainfall.toLocaleString()} mm</strong> total precipitation across the filtered records. The southwest monsoon accounts for <strong>${monsoonPct}%</strong> of all annual rainfall in this period.`
      });
    }

    // 2. Aridity & Dry Period
    if (extremes.driest) {
      insights.push({
        title: "Driest Period & Aridity",
        icon: "sun",
        category: "dry",
        text: `<strong>${extremes.driest.monthName}</strong> experiences the lowest precipitation (${extremes.driest.totalRainfall} mm) with near-zero rainy days, marking the peak dry season where evaporation exceeds precipitation.`
      });
    }

    // 3. Thermal Extremes & Range
    if (summary.maxTempDay && summary.minTempDay) {
      const diurnal = Math.round((summary.maxTemp - summary.minTemp) * 10) / 10;
      insights.push({
        title: "Thermal Amplitude & Temperature Extremes",
        icon: "thermometer",
        category: "temperature",
        text: `Peak maximum temperature reached <strong>${summary.maxTemp}°C</strong> on ${summary.maxTempDay.date}, while the lowest recorded minimum fell to <strong>${summary.minTemp}°C</strong> on ${summary.minTempDay.date}, yielding a wide thermal amplitude of <strong>${diurnal}°C</strong>.`
      });
    }

    // 4. Year-over-Year Volatility
    if (yearly.length >= 2) {
      const latest = yearly[yearly.length - 1];
      const prev = yearly[yearly.length - 2];
      const diff = latest.yoyRainfallPercent;
      const trendWord = diff > 0 ? "increased" : "decreased";
      insights.push({
        title: "Year-over-Year Precipitation Dynamics",
        icon: "trending-up",
        category: "trend",
        text: `In ${latest.year}, total rainfall was <strong>${latest.totalRainfall} mm</strong> (${latest.rainyDays} rainy days), which ${trendWord} by <strong>${Math.abs(diff)}%</strong> compared to ${prev.year} (${prev.totalRainfall} mm), demonstrating inter-annual monsoon variability.`
      });
    }

    // 5. Correlation & Microclimate
    let corrMeaning = "negligible correlation";
    if (correlation < -0.3) corrMeaning = "negative correlation (rainy monsoon periods lower daily ambient temperatures)";
    else if (correlation > 0.3) corrMeaning = "positive correlation (high temperature peaks drive convective precipitation)";
    insights.push({
      title: "Temperature-Rainfall Dynamics",
      icon: "activity",
      category: "correlation",
      text: `Calculated Pearson correlation coefficient between temperature and precipitation is <strong>r = ${correlation}</strong>, indicating a ${corrMeaning}.`
    });

    return insights;
  }

  /**
   * Compare all five Indian cities side-by-side using full dataset
   */
  function compareAllCities(allRecords) {
    const cityMap = {};
    const cityNames = ["Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai"];

    cityNames.forEach((name) => {
      const cityRecords = allRecords.filter((r) => r.city.toLowerCase() === name.toLowerCase());
      const summary = computeSummary(cityRecords);
      const monthly = aggregateMonthly(cityRecords);
      const seasonal = aggregateSeasonal(cityRecords);
      const extremes = getExtremes(monthly);

      cityMap[name] = {
        name,
        summary,
        extremes,
        seasonal,
        annualAvgRain: Math.round(summary.totalRainfall / 4) // for 4 years (2022-2025)
      };
    });

    return cityMap;
  }

  return {
    MONTH_NAMES,
    SEASONS,
    computeSummary,
    aggregateMonthly,
    aggregateYearly,
    aggregateSeasonal,
    getExtremes,
    getCityRainfallRanking,
    getMonthlyRainfallByCity,
    getSmartInsights,
    calculateTempRainCorrelation,
    generateInsights,
    compareAllCities
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = WeatherAnalytics;
} else {
  window.WeatherAnalytics = WeatherAnalytics;
}
