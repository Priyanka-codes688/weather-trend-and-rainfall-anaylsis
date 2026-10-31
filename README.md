# 🌦️ Weather Trend and Rainfall Analysis Dashboard

An advanced, responsive, and production-ready **Data Analytics Web Application** analyzing multi-year historical precipitation patterns, temperature trends, seasonal variations, and real-time 7-day meteorological forecasts for five major Indian metropolitan centers using official **Open-Meteo APIs**.

![Status](https://img.shields.io/badge/Status-Deployment%20Ready-success)
![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.14-blue)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-orange)
![Charts](https://img.shields.io/badge/Visualizations-Chart.js%204.4.1-ff6384)
![Deployment](https://img.shields.io/badge/Deployment-Render%20%7C%20Cloud-informational)

---

## 🇮🇳 Covered Indian Cities & Exact Coordinates

| City | State / Region | Latitude | Longitude | Elevation | Climate Classification |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Mumbai** | Maharashtra | `19.0760° N` | `72.8777° E` | 14 m | Tropical Wet and Dry (Arabian Sea Coastal Zone) |
| **Delhi** | NCT Delhi | `28.6139° N` | `77.2090° E` | 216 m | Monsoon-influenced Subtropical / Semi-Arid |
| **Bengaluru** | Karnataka | `12.9716° N` | `77.5946° E` | 920 m | Tropical Savanna (Deccan Plateau Highland) |
| **Kolkata** | West Bengal | `22.5726° N` | `88.3639° E` | 9 m | Tropical Wet and Dry (Gangetic Delta) |
| **Chennai** | Tamil Nadu | `13.0827° N` | `80.2707° E` | 7 m | Tropical Wet and Dry (Northeast Monsoon Dominant) |

---

## 🚀 Key Features

1. **Home Analytics Dashboard & Live Telemetry**
   - KPI Summary Cards: Average Temperature, Total Rainfall, Highest 24-Hour Deluge, and Rainy Days ($\ge 1.0\text{ mm}$).
   - Live telemetry: Current temperature, feels-like, relative humidity, precipitation, wind speed, and surface pressure.
   - Official 7-Day weather forecast carousel with temperature extremes and rain probability.

2. **Interactive Visualizations (Chart.js 4.4.1)**
   - **Temperature Trends Over Time**: Multi-series line chart (Max, Mean, Min temperatures).
   - **Monthly Rainfall Pattern**: Dual-axis bar and line chart illustrating monthly totals and rainy days.
   - **Year-over-Year Rainfall Comparison**: Grouped multi-year bar chart (2022, 2023, 2024, 2025).
   - **Seasonal Rainfall Distribution**: Doughnut chart mapped to official India Meteorological Department (IMD) seasons:
     - Winter (Jan - Feb)
     - Summer (Mar - May)
     - Monsoon (Jun - Sep)
     - Post-Monsoon (Oct - Dec)
   - **Temperature vs Rainfall Relationship**: Scatter plot evaluating thermal precipitation correlations.
   - **Comparative Metro Benchmarking**: Multi-city comparison comparing annual rainfall and rainy days across all 5 Indian cities.

3. **Data Analytics & Meteorological Insights**
   - Dynamic calculations of wettest/driest months, thermal amplitudes, and Pearson correlation coefficients ($r$).
   - Searchable and sortable data table with pagination controls.
   - CSV export functionality and custom CSV upload parser with strict schema validation.

4. **Dark Mode & Light Mode Theme Engine**
   - Top header toggle with animated Sun and Moon icons.
   - Dynamic Chart.js re-theming (gridlines, axes, legends, tooltips).
   - Instant switching with persistent state saved in `localStorage`.

5. **AI Weather Chatbot ("Weather AI Assistant")**
   - Floating conversational widget at the bottom-right corner.
   - Answers questions regarding live weather, forecasts, historical extremes, and multi-city comparisons.
   - Built-in deterministic meteorological engine backed by genuine data; zero mandatory external API keys.

---

## 🛠️ Technology Stack

* **Frontend**: Vanilla HTML5, modern CSS3 (Custom Variables design system), Vanilla ES6 JavaScript (IIFE / modular architecture).
* **Charts**: Chart.js 4.4.1 (self-contained locally in `js/vendor/chart.umd.min.js`).
* **Backend**: Python (3.11+) built-in `http.server.ThreadingHTTPServer` with IPv4/IPv6 Dual-Stack binding.
* **APIs**:
  * [Open-Meteo Historical Archive API](https://archive-api.open-meteo.com/v1/archive) (ECMWF ERA5 atmospheric reanalysis).
  * [Open-Meteo Weather Forecast API](https://api.open-meteo.com/v1/forecast) (High-resolution multi-model ensemble).

---

## 📂 Project Folder Structure

```text
weather-analytics-github-ready/
├── index.html                   # Main dashboard web page
├── server.py                    # Production Python HTTP server & API proxy
├── fetch_data.py                # Reproducible Open-Meteo historical fetch script
├── test_dashboard.py            # Automated verification test suite
├── package.json                 # Project descriptor & npm-compatible task runner
├── requirements.txt             # Python dependencies for production
├── runtime.txt                  # Python runtime version for cloud deployment
├── render.yaml                  # Render Blueprint deployment configuration
├── .env.example                 # Example environment variables
├── .gitignore                   # Git exclusion rules
├── README.md                    # Project documentation
├── css/
│   └── style.css                # Professional design system & responsive styling
├── js/
│   ├── api.js                   # Open-Meteo API connectors & city coordinates
│   ├── analytics.js             # Statistical calculations & insight generator
│   ├── charts.js                # Chart.js visualization engine & theme adapter
│   ├── table.js                 # Searchable/sortable table & CSV import/export
│   ├── chatbot.js               # AI Weather Chatbot widget & client NLP
│   ├── app.js                   # Master application controller
│   └── vendor/
│       └── chart.umd.min.js     # Standalone bundled Chart.js v4.4.1
└── data/
    ├── weather_historical_india.json  # 7,305 verified Open-Meteo historical records
    ├── weather_historical_india.csv   # Unified CSV dataset
    ├── mumbai.json              # City-specific dataset (1,461 records)
    ├── delhi.json               # City-specific dataset (1,461 records)
    ├── bengaluru.json           # City-specific dataset (1,461 records)
    ├── kolkata.json             # City-specific dataset (1,461 records)
    └── chennai.json             # City-specific dataset (1,461 records)
```

---

## 💻 Local Development Instructions

### Prerequisites
* Python 3.10, 3.11, 3.12, or 3.14 installed.
* Web browser (Chrome, Edge, Firefox, Safari).

### 1. Clone or Open the Repository
```bash
cd weather-analytics-github-ready
```

### 2. Install Dependencies (Optional)
```bash
pip install -r requirements.txt
```

### 3. Start the Server
```bash
python server.py
```

### 4. Open the Application
Open your browser and navigate to:
```
http://localhost:8080
```
or:
```
http://127.0.0.1:8080
```

---

## 🧪 Running Automated Tests

To run the verification suite testing all 5 cities, API endpoints, datasets, and chatbot queries:

```bash
python test_dashboard.py
```

---

## 🌐 Production REST API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/` | `GET` | Serves the main responsive analytics dashboard. |
| `/api/forecast?city={id}` | `GET` | Fetches live weather observation and 7-day forecast from Open-Meteo. |
| `/api/historical?city={id}` | `GET` | Returns authentic 4-year historical daily records for the specified city. |
| `/api/cities` | `GET` | Returns coordinates, state, and climate metadata for all 5 Indian cities. |
| `/api/health` | `GET` | Returns JSON status `{"status": "healthy", "port": 8080}` for cloud health checks. |
| `/api/chat` | `POST` | Processes natural language weather queries using genuine observations. |

---

## 🚀 Render Deployment Instructions

### Method 1: Render Web Service (Recommended)

1. **Push your code to GitHub** (see GitHub Upload Instructions below).
2. Go to the [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository containing `weather-analytics-github-ready`.
5. Fill in the following settings:
   - **Name**: `weather-trend-rainfall-analysis` (or your preferred name)
   - **Language / Environment**: `Python 3`
   - **Region**: Any (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     python server.py
     ```
   - **Plan**: `Free`
6. *(Optional)* In **Advanced Settings**, add the **Health Check Path**:
   ```
   /api/health
   ```
7. Click **Create Web Service**. Render will automatically build the service and deploy it to a live public URL (e.g., `https://weather-trend-rainfall-analysis.onrender.com`).

---

### Method 2: Render Blueprint (`render.yaml`)

This repository includes a pre-configured `render.yaml` Blueprint file.
1. In the Render Dashboard, click **New +** and select **Blueprint**.
2. Connect your GitHub repository.
3. Render will read `render.yaml` and configure the Web Service automatically.

---

## 📦 GitHub Upload Instructions

Run the following commands inside `weather-analytics-github-ready`:

```bash
# 1. Initialize git repository
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "Initial commit: Weather Trend and Rainfall Analysis Dashboard"

# 4. Set default branch to main
git branch -M main

# 5. Link your remote GitHub repository
# Replace YOUR_USERNAME and YOUR_REPO_NAME with your GitHub details:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` if you wish to customize runtime parameters:

```env
# Server Port (Render injects PORT automatically in production)
PORT=8080

# Optional Host Binding (defaults to 0.0.0.0)
HOST=0.0.0.0

# Optional External AI API Key for Chatbot (not required for standard operation)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 📄 License & Attribution

- **Data Source**: Official [Open-Meteo](https://open-meteo.com/) APIs under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Charts**: [Chart.js](https://www.chartjs.org/) under MIT License.
- **Project**: Academic & Data Analytics Project for Indian Cities Weather Analysis.
