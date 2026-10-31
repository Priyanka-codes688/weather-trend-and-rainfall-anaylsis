/**
 * Weather Trend and Rainfall Analysis - Table & Data I/O Module
 * Manages searchable and sortable table, pagination, CSV export, and user CSV uploads.
 */

const WeatherTable = (() => {
  let tableState = {
    records: [],
    filtered: [],
    currentPage: 1,
    pageSize: 15,
    sortField: "date",
    sortOrder: "desc", // 'asc' or 'desc'
    searchQuery: ""
  };

  function init(records, onDataUploadedCallback) {
    tableState.records = records || [];
    tableState.filtered = [...tableState.records];
    tableState.currentPage = 1;
    tableState.onDataUploaded = onDataUploadedCallback;

    bindEvents();
    renderTable();
  }

  function setRecords(records) {
    tableState.records = records || [];
    applySearchAndSort();
  }

  function bindEvents() {
    const searchInput = document.getElementById("table-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        tableState.searchQuery = e.target.value.trim().toLowerCase();
        tableState.currentPage = 1;
        applySearchAndSort();
      });
    }

    const pageSizeSelect = document.getElementById("table-page-size");
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", (e) => {
        tableState.pageSize = parseInt(e.target.value, 10) || 15;
        tableState.currentPage = 1;
        renderTable();
      });
    }

    const prevBtn = document.getElementById("table-prev-page");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (tableState.currentPage > 1) {
          tableState.currentPage--;
          renderTable();
        }
      });
    }

    const nextBtn = document.getElementById("table-next-page");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(tableState.filtered.length / tableState.pageSize) || 1;
        if (tableState.currentPage < totalPages) {
          tableState.currentPage++;
          renderTable();
        }
      });
    }

    // Column headers sorting
    const thHeaders = document.querySelectorAll("th[data-sort]");
    thHeaders.forEach((th) => {
      th.addEventListener("click", () => {
        const field = th.getAttribute("data-sort");
        if (tableState.sortField === field) {
          tableState.sortOrder = tableState.sortOrder === "asc" ? "desc" : "asc";
        } else {
          tableState.sortField = field;
          tableState.sortOrder = "desc";
        }
        applySearchAndSort();
      });
    });

    // CSV Download
    const downloadBtn = document.getElementById("btn-download-csv");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadFilteredCSV);
    }

    // CSV Upload
    const uploadInput = document.getElementById("csv-file-input");
    if (uploadInput) {
      uploadInput.addEventListener("change", handleCSVUpload);
    }
  }

  function applySearchAndSort() {
    let list = [...tableState.records];

    // Search filter
    if (tableState.searchQuery) {
      const q = tableState.searchQuery;
      list = list.filter((r) => {
        return (
          (r.date && r.date.toLowerCase().includes(q)) ||
          (r.city && r.city.toLowerCase().includes(q)) ||
          (r.season && r.season.toLowerCase().includes(q)) ||
          String(r.avg_temp).includes(q) ||
          String(r.rainfall).includes(q)
        );
      });
    }

    // Sorting
    const field = tableState.sortField;
    const order = tableState.sortOrder === "asc" ? 1 : -1;

    list.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "string") {
        return valA.localeCompare(valB) * order;
      }
      return (valA - valB) * order;
    });

    tableState.filtered = list;
    renderTable();
  }

  function renderTable() {
    const tbody = document.getElementById("weather-table-body");
    const countInfo = document.getElementById("table-count-info");
    const pageInfo = document.getElementById("table-page-info");
    const prevBtn = document.getElementById("table-prev-page");
    const nextBtn = document.getElementById("table-next-page");

    if (!tbody) return;

    const totalRecords = tableState.filtered.length;
    const totalPages = Math.ceil(totalRecords / tableState.pageSize) || 1;
    if (tableState.currentPage > totalPages) tableState.currentPage = totalPages;

    const startIdx = (tableState.currentPage - 1) * tableState.pageSize;
    const endIdx = Math.min(startIdx + tableState.pageSize, totalRecords);
    const pageRecords = tableState.filtered.slice(startIdx, endIdx);

    // Update count labels
    if (countInfo) {
      countInfo.textContent = `Showing ${totalRecords === 0 ? 0 : startIdx + 1} - ${endIdx} of ${totalRecords.toLocaleString()} records`;
    }
    if (pageInfo) {
      pageInfo.textContent = `Page ${tableState.currentPage} of ${totalPages}`;
    }
    if (prevBtn) prevBtn.disabled = tableState.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = tableState.currentPage >= totalPages;

    // Update sort header indicator icons
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      const field = th.getAttribute("data-sort");
      const iconSpan = th.querySelector(".sort-icon");
      if (iconSpan) {
        if (field === tableState.sortField) {
          iconSpan.textContent = tableState.sortOrder === "asc" ? " ▲" : " ▼";
          th.classList.add("active-sort");
        } else {
          iconSpan.textContent = " ↕";
          th.classList.remove("active-sort");
        }
      }
    });

    if (pageRecords.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-muted">No weather records match your current query.</td></tr>`;
      return;
    }

    tbody.innerHTML = pageRecords
      .map((r) => {
        const rainBadge = r.rainfall >= 25 
          ? `<span class="badge badge-heavy-rain">${r.rainfall} mm</span>`
          : r.rainfall >= 1.0 
            ? `<span class="badge badge-rain">${r.rainfall} mm</span>` 
            : `<span class="text-muted">0.0 mm</span>`;

        const seasonBadge = `<span class="badge-season badge-${(r.season || "monsoon").toLowerCase()}">${r.season || "Monsoon"}</span>`;

        return `
          <tr>
            <td class="font-medium">${r.date}</td>
            <td><span class="city-pill">${r.city}</span></td>
            <td>${r.min_temp !== null ? r.min_temp + " °C" : "--"}</td>
            <td>${r.max_temp !== null ? r.max_temp + " °C" : "--"}</td>
            <td class="font-semibold text-primary">${r.avg_temp !== null ? r.avg_temp + " °C" : "--"}</td>
            <td>${r.humidity !== null ? r.humidity + " %" : "--"}</td>
            <td>${rainBadge}</td>
          </tr>
        `;
      })
      .join("");
  }

  /**
   * Export the currently filtered records as a CSV download
   */
  function downloadFilteredCSV() {
    const list = tableState.filtered;
    if (!list || list.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = ["date", "city", "min_temp", "max_temp", "avg_temp", "humidity", "rainfall", "wind_speed", "season", "year", "month"];
    let csvContent = headers.join(",") + "\n";

    list.forEach((r) => {
      const row = headers.map((h) => {
        let val = r[h] !== null && r[h] !== undefined ? r[h] : "";
        if (typeof val === "string" && val.includes(",")) val = `"${val}"`;
        return val;
      });
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `weather_data_export_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Parse and validate user uploaded CSV files
   */
  function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      showUploadAlert("Invalid file format. Please upload a standard CSV file (.csv).", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSVText(text);

        if (parsed.errors.length > 0) {
          showUploadAlert(`CSV validation error: ${parsed.errors.join("; ")}`, "error");
          return;
        }

        if (parsed.records.length === 0) {
          showUploadAlert("CSV file contains no valid weather records.", "error");
          return;
        }

        showUploadAlert(`Successfully imported ${parsed.records.length} records from ${file.name}! Dashboard updated.`, "success");
        if (typeof tableState.onDataUploaded === "function") {
          tableState.onDataUploaded(parsed.records, file.name);
        }
      } catch (err) {
        showUploadAlert(`Failed to parse CSV file: ${err.message}`, "error");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  function parseCSVText(csvText) {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const errors = [];
    if (lines.length < 2) {
      errors.push("CSV file must have a header row and at least one data row.");
      return { records: [], errors };
    }

    const header = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
    
    // Check required columns
    const hasDate = header.includes("date");
    const hasCity = header.includes("city");
    const hasRain = header.includes("rainfall") || header.includes("precipitation") || header.includes("precipitation_sum");
    const hasTemp = header.includes("avg_temp") || header.includes("temp") || header.includes("temperature_2m_mean") || header.includes("max_temp");

    if (!hasDate || !hasCity) {
      errors.push("Missing required columns: CSV must contain 'date' and 'city' headers.");
      return { records: [], errors };
    }

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length < header.length / 2) continue;

      const obj = {};
      header.forEach((h, idx) => {
        obj[h] = parts[idx] !== undefined ? parts[idx] : null;
      });

      const dateStr = obj["date"];
      const dObj = new Date(dateStr);
      const year = !isNaN(dObj.getFullYear()) ? dObj.getFullYear() : 2024;
      const month = !isNaN(dObj.getMonth()) ? dObj.getMonth() + 1 : 1;

      // Determine IMD season
      let season = "Monsoon";
      if (month === 1 || month === 2) season = "Winter";
      else if (month >= 3 && month <= 5) season = "Summer";
      else if (month >= 6 && month <= 9) season = "Monsoon";
      else season = "Post-Monsoon";

      const rVal = parseFloat(obj["rainfall"] || obj["precipitation"] || obj["precipitation_sum"] || 0);
      const minT = obj["min_temp"] ? parseFloat(obj["min_temp"]) : null;
      const maxT = obj["max_temp"] ? parseFloat(obj["max_temp"]) : null;
      const avgT = obj["avg_temp"] ? parseFloat(obj["avg_temp"]) : (minT && maxT ? (minT + maxT) / 2 : null);

      records.push({
        date: dateStr,
        city: obj["city"] || "Custom",
        min_temp: !isNaN(minT) ? minT : null,
        max_temp: !isNaN(maxT) ? maxT : null,
        avg_temp: !isNaN(avgT) ? Math.round(avgT * 10) / 10 : null,
        humidity: obj["humidity"] ? parseFloat(obj["humidity"]) : null,
        rainfall: !isNaN(rVal) ? Math.round(rVal * 10) / 10 : 0.0,
        wind_speed: obj["wind_speed"] ? parseFloat(obj["wind_speed"]) : null,
        season: obj["season"] || season,
        year: year,
        month: month
      });
    }

    return { records, errors };
  }

  function showUploadAlert(msg, type) {
    const alertBox = document.getElementById("csv-upload-feedback");
    if (!alertBox) {
      alert(msg);
      return;
    }
    alertBox.textContent = msg;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = "block";
    setTimeout(() => {
      alertBox.style.display = "none";
    }, 6000);
  }

  return {
    init,
    setRecords,
    downloadFilteredCSV
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = WeatherTable;
} else {
  window.WeatherTable = WeatherTable;
}
