"""
Fetch genuine historical weather data for five Indian cities using official Open-Meteo Archive API:
1. Mumbai – Latitude: 19.0760, Longitude: 72.8777
2. Delhi – Latitude: 28.6139, Longitude: 77.2090
3. Bengaluru – Latitude: 12.9716, Longitude: 77.5946
4. Kolkata – Latitude: 22.5726, Longitude: 88.3639
5. Chennai – Latitude: 13.0827, Longitude: 80.2707

Fetches 4 complete historical years (2022-01-01 to 2025-12-31) of daily observations:
- Date
- City
- Max Temperature (°C)
- Min Temperature (°C)
- Mean/Average Temperature (°C)
- Relative Humidity (%)
- Precipitation / Rainfall (mm)
- Max Wind Speed (km/h)

Saves output as:
- data/{city_id}.json
- data/weather_historical_india.json
- data/weather_historical_india.csv
"""

import os
import json
import csv
import time
import urllib.request
import ssl

CITIES = [
    {
        "id": "mumbai",
        "name": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "elevation": 14,
        "climate": "Tropical Wet and Dry",
        "annual_rainfall_approx_mm": 2200
    },
    {
        "id": "delhi",
        "name": "Delhi",
        "state": "National Capital Territory",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "elevation": 216,
        "climate": "Monsoon-influenced Humid Subtropical / Semi-Arid",
        "annual_rainfall_approx_mm": 800
    },
    {
        "id": "bengaluru",
        "name": "Bengaluru",
        "state": "Karnataka",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "elevation": 920,
        "climate": "Tropical Savanna (Moderate Highland)",
        "annual_rainfall_approx_mm": 970
    },
    {
        "id": "kolkata",
        "name": "Kolkata",
        "state": "West Bengal",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "elevation": 9,
        "climate": "Tropical Wet and Dry (Gangetic Delta)",
        "annual_rainfall_approx_mm": 1800
    },
    {
        "id": "chennai",
        "name": "Chennai",
        "state": "Tamil Nadu",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "elevation": 7,
        "climate": "Tropical Wet and Dry (Northeast Monsoon Dominant)",
        "annual_rainfall_approx_mm": 1400
    }
]

START_DATE = "2022-01-01"
END_DATE = "2025-12-31"

def determine_season(month: int) -> str:
    """Standard Indian Meteorological Department (IMD) Seasons"""
    if month in (1, 2):
        return "Winter"
    elif month in (3, 4, 5):
        return "Summer"
    elif month in (6, 7, 8, 9):
        return "Monsoon"
    else:
        return "Post-Monsoon"

def fetch_city_historical(city):
    url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={city['latitude']}&longitude={city['longitude']}&"
        f"start_date={START_DATE}&end_date={END_DATE}&"
        f"daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max&"
        f"timezone=Asia/Kolkata"
    )
    print(f"Fetching historical data for {city['name']} from {url[:80]}...")
    
    # Create unverified context if needed for Windows cert issues
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "WeatherAnalyticsDashboard/1.0 (academic-project)"}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    os.makedirs("data", exist_ok=True)
    all_records = []
    city_summaries = {}

    for city in CITIES:
        try:
            data = fetch_city_historical(city)
            daily = data.get("daily", {})
            times = daily.get("time", [])
            t_max = daily.get("temperature_2m_max", [])
            t_min = daily.get("temperature_2m_min", [])
            t_mean = daily.get("temperature_2m_mean", [])
            rain = daily.get("precipitation_sum", [])
            humidity = daily.get("relative_humidity_2m_mean", [])
            wind = daily.get("wind_speed_10m_max", [])

            city_records = []
            for i in range(len(times)):
                d_str = times[i]
                year = int(d_str[:4])
                month = int(d_str[5:7])
                day = int(d_str[8:10])
                season = determine_season(month)

                # Round clean values
                max_t = round(t_max[i], 1) if t_max[i] is not None else None
                min_t = round(t_min[i], 1) if t_min[i] is not None else None
                mean_t = round(t_mean[i], 1) if t_mean[i] is not None else (round((max_t + min_t) / 2, 1) if max_t and min_t else None)
                r_val = round(rain[i], 1) if rain[i] is not None else 0.0
                h_val = round(humidity[i], 1) if humidity[i] is not None else None
                w_val = round(wind[i], 1) if wind[i] is not None else None

                rec = {
                    "date": d_str,
                    "year": year,
                    "month": month,
                    "day": day,
                    "season": season,
                    "city": city["name"],
                    "city_id": city["id"],
                    "latitude": city["latitude"],
                    "longitude": city["longitude"],
                    "min_temp": min_t,
                    "max_temp": max_t,
                    "avg_temp": mean_t,
                    "humidity": h_val,
                    "rainfall": r_val,
                    "wind_speed": w_val
                }
                city_records.append(rec)
                all_records.append(rec)

            # Save individual city JSON
            city_out_file = os.path.join("data", f"{city['id']}.json")
            with open(city_out_file, "w", encoding="utf-8") as f:
                json.dump({
                    "city": city,
                    "records_count": len(city_records),
                    "start_date": START_DATE,
                    "end_date": END_DATE,
                    "records": city_records
                }, f, indent=2)

            city_summaries[city["id"]] = {
                "count": len(city_records),
                "total_rain_mm": round(sum(r["rainfall"] for r in city_records), 1),
                "avg_temp_c": round(sum(r["avg_temp"] for r in city_records if r["avg_temp"] is not None) / len(city_records), 2),
                "max_recorded_temp_c": max(r["max_temp"] for r in city_records if r["max_temp"] is not None),
                "min_recorded_temp_c": min(r["min_temp"] for r in city_records if r["min_temp"] is not None),
                "rainy_days_count": sum(1 for r in city_records if r["rainfall"] >= 1.0)
            }
            print(f"Successfully processed {len(city_records)} records for {city['name']}")
            time.sleep(1)  # Respect API rate limits
        except Exception as e:
            print(f"Error fetching data for {city['name']}: {e}")

    # Write unified JSON
    json_path = os.path.join("data", "weather_historical_india.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "source": "Open-Meteo Archive API (https://archive-api.open-meteo.com/v1/archive)",
            "cities": CITIES,
            "summaries": city_summaries,
            "total_records": len(all_records),
            "records": all_records
        }, f)
    print(f"Unified JSON written to {json_path} ({len(all_records)} records)")

    # Write unified CSV
    csv_path = os.path.join("data", "weather_historical_india.csv")
    fieldnames = [
        "date", "city", "min_temp", "max_temp", "avg_temp", 
        "humidity", "rainfall", "wind_speed", "season", "year", "month"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for r in all_records:
            writer.writerow(r)
    print(f"Unified CSV written to {csv_path} ({len(all_records)} records)")

if __name__ == "__main__":
    main()
