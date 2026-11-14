// ===================================================
// Stratos Weather — Deep Climate Analytics Engine (analytics.js)
// High-Performance Meteorological Telemetry with Chart.js
// ===================================================

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const AIR_QUALITY_BASE = 'https://air-quality-api.open-meteo.com/v1';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1';
const USE_API = window.location.protocol.startsWith('http');
const API_BASE_URL = USE_API ? '/api' : null;

// Global State
let currentUnit = localStorage.getItem('stratos_unit') || localStorage.getItem('skycast_unit') || 'C';
let activeCity = {
    name: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    lat: 35.6762,
    lng: 139.6503,
    elevation: 40
};
let rawWeatherData = null;
let rawAirData = null;
let chartInstances = {};

// Default Chart.js Styling Options
Chart.defaults.color = 'rgba(255, 255, 255, 0.65)';
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.15)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 12;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.usePointStyle = true;

// ===================================================
// 1. DATA CONVERSION & FORMATTING HELPERS
// ===================================================

function formatTemp(celsius) {
    if (celsius === undefined || celsius === null) return '--';
    const val = Number(celsius);
    if (currentUnit === 'F') {
        return Math.round((val * 9 / 5) + 32);
    }
    return Math.round(val);
}

function formatWindSpeed(kmh) {
    const val = Number(kmh) || 0;
    if (currentUnit === 'F') {
        return `${Math.round(val * 0.621371)} mph`;
    }
    return `${Math.round(val)} km/h`;
}

function formatPressure(hpa) {
    const val = Number(hpa) || 1013;
    if (currentUnit === 'F') {
        return `${(val * 0.02953).toFixed(2)} inHg`;
    }
    return `${Math.round(val)} hPa`;
}

function mapWeatherCode(code, isDay = true) {
    if (code === 0 || code === 1) return { condition: isDay ? "Sunny" : "Clear", icon: isDay ? "☀️" : "🌙" };
    if (code === 2 || code === 3 || code === 45 || code === 48) return { condition: "Cloudy", icon: "☁️" };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { condition: "Rain", icon: "🌧️" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: "Snow", icon: "❄️" };
    if ([95, 96, 99].includes(code)) return { condition: "Storm", icon: "⛈️" };
    return { condition: "Clear", icon: "🌤️" };
}

function getAqiDescription(aqi) {
    if (aqi <= 50) return { label: 'Good (Healthy)', color: '#34d399' };
    if (aqi <= 100) return { label: 'Moderate', color: '#fbbf24' };
    if (aqi <= 150) return { label: 'Sensitive Groups', color: '#f97316' };
    if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: '#a855f7' };
    return { label: 'Hazardous', color: '#7e22ce' };
}

function getUvRiskLevel(uv) {
    if (uv <= 2) return { label: 'Low Risk', color: '#34d399' };
    if (uv <= 5) return { label: 'Moderate Risk', color: '#fbbf24' };
    if (uv <= 7) return { label: 'High Risk', color: '#f97316' };
    if (uv <= 10) return { label: 'Very High Risk', color: '#ef4444' };
    return { label: 'Extreme Risk', color: '#a855f7' };
}

// ===================================================
// 2. DATA INGESTION ENGINE
// ===================================================

async function loadAnalyticsForCity(city) {
    activeCity = city;
    try {
        localStorage.setItem('stratos_active_city', city.name);
    } catch (e) {}

    // Update Action Button Deep-Links
    const globeBtn = document.getElementById('btn-view-on-globe');
    const dashBtn = document.getElementById('btn-view-dashboard');
    if (globeBtn) globeBtn.href = `globe.html?city=${encodeURIComponent(city.name)}`;
    if (dashBtn) dashBtn.href = `index.html?city=${encodeURIComponent(city.name)}`;

    try {
        // Query 1: Open-Meteo High-Resolution Weather Model
        const weatherUrl = `${OPEN_METEO_BASE}/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,surface_pressure,uv_index,precipitation_probability,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,weather_code&timezone=auto`;
        const weatherResp = await fetch(weatherUrl);
        rawWeatherData = await weatherResp.json();

        // Query 2: Open-Meteo Atmospheric Chemistry / Air Quality API
        const airUrl = `${AIR_QUALITY_BASE}/air-quality?latitude=${city.lat}&longitude=${city.lng}&current=us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,carbon_monoxide&timezone=auto`;
        const airResp = await fetch(airUrl);
        rawAirData = await airResp.json();

        // Populate Hero & KPI Ribbon
        updateHeroBanner();
        updateKpiRibbon();

        // Render All 5 Deep Visualizations
        renderAllCharts();
    } catch (err) {
        console.error("Error loading analytics telemetry:", err);
    }
}

// ===================================================
// 3. HERO BANNER & KPI RIBBON UPDATER
// ===================================================

function updateHeroBanner() {
    if (!rawWeatherData) return;
    const current = rawWeatherData.current || {};
    const daily = rawWeatherData.daily || {};

    const celsius = current.temperature_2m !== undefined ? current.temperature_2m : 20;
    const feelsCelsius = current.apparent_temperature !== undefined ? current.apparent_temperature : celsius;
    const maxCelsius = daily.temperature_2m_max && daily.temperature_2m_max.length > 0 ? daily.temperature_2m_max[0] : celsius + 3;
    const minCelsius = daily.temperature_2m_min && daily.temperature_2m_min.length > 0 ? daily.temperature_2m_min[0] : celsius - 4;
    const isDay = current.is_day === 1;
    const { condition, icon } = mapWeatherCode(current.weather_code || 0, isDay);

    document.getElementById('analytics-city-name').innerText = activeCity.name;
    document.getElementById('analytics-country-name').innerText = activeCity.country || 'Global Station';
    document.getElementById('analytics-flag').innerText = activeCity.flag || '📍';
    document.getElementById('analytics-coords').innerText = `Coordinates: ${Math.abs(activeCity.lat).toFixed(2)}° ${activeCity.lat >= 0 ? 'N' : 'S'}, ${Math.abs(activeCity.lng).toFixed(2)}° ${activeCity.lng >= 0 ? 'E' : 'W'} • Elevation: ${activeCity.elevation || 35} m ASL`;

    document.getElementById('analytics-temp').innerText = formatTemp(celsius);
    document.getElementById('analytics-icon').innerText = icon;
    document.getElementById('analytics-condition').innerText = condition;
    document.getElementById('analytics-feels').innerText = `Feels like ${formatTemp(feelsCelsius)}° • High: ${formatTemp(maxCelsius)}° / Low: ${formatTemp(minCelsius)}°`;
}

function updateKpiRibbon() {
    if (!rawWeatherData) return;
    const hourly = rawWeatherData.hourly || {};
    const current = rawWeatherData.current || {};
    const daily = rawWeatherData.daily || {};
    const airCurrent = rawAirData && rawAirData.current ? rawAirData.current : {};

    // 24h Peak and Min Temps
    const next24Temps = (hourly.temperature_2m || []).slice(0, 24);
    const maxTemp = next24Temps.length > 0 ? Math.max(...next24Temps) : 25;
    const minTemp = next24Temps.length > 0 ? Math.min(...next24Temps) : 15;

    document.getElementById('kpi-max-temp').innerText = `${formatTemp(maxTemp)}°`;
    document.getElementById('kpi-min-temp').innerText = `${formatTemp(minTemp)}°`;

    // Humidity
    const humidity = current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : 55;
    document.getElementById('kpi-humidity').innerText = `${humidity}%`;
    document.getElementById('kpi-humidity-status').innerText = humidity > 70 ? 'High moisture saturation' : (humidity < 35 ? 'Arid dry air mass' : 'Optimal comfort zone');

    // Wind Gust
    const windSpeed = current.wind_speed_10m || 12;
    document.getElementById('kpi-wind').innerText = formatWindSpeed(windSpeed);
    document.getElementById('kpi-wind-dir').innerText = `Bearing: ${current.wind_direction_10m || 180}° (${getWindCardinal(current.wind_direction_10m)})`;

    // Peak UV
    const maxUv = daily.uv_index_max && daily.uv_index_max.length > 0 ? Math.round(daily.uv_index_max[0]) : 4;
    const uvRisk = getUvRiskLevel(maxUv);
    document.getElementById('kpi-uv').innerText = maxUv;
    document.getElementById('kpi-uv').style.color = uvRisk.color;
    document.getElementById('kpi-uv-risk').innerText = uvRisk.label;

    // AQI
    const aqiScore = airCurrent.us_aqi !== undefined ? Math.round(airCurrent.us_aqi) : 38;
    const aqiDesc = getAqiDescription(aqiScore);
    document.getElementById('kpi-aqi').innerText = aqiScore;
    document.getElementById('kpi-aqi').style.color = aqiDesc.color;
    document.getElementById('kpi-aqi-status').innerText = aqiDesc.label;
}

function getWindCardinal(deg = 0) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
}

// ===================================================
// 4. CHART.JS VISUALIZATION SUITE (5 CHARTS)
// ===================================================

function destroyChart(name) {
    if (chartInstances[name]) {
        chartInstances[name].destroy();
        delete chartInstances[name];
    }
}

function renderAllCharts() {
    renderTempSplineChart();
    renderSevenDayRangeChart();
    renderCorrelationChart();
    renderUvSolarChart();
    renderAqiRadarChart();
    renderPrecipChart();
}

// ---------------------------------------------------
// CHART 1: 24-HOUR TEMPERATURE SPLINE CURVE
// ---------------------------------------------------
function renderTempSplineChart() {
    destroyChart('tempSpline');
    const ctx = document.getElementById('tempSplineChart');
    if (!ctx || !rawWeatherData || !rawWeatherData.hourly) return;

    const hourly = rawWeatherData.hourly;
    const times = (hourly.time || []).slice(0, 24).map(t => {
        const d = new Date(t);
        return d.toLocaleTimeString([], { hour: 'numeric' });
    });

    const temps = (hourly.temperature_2m || []).slice(0, 24).map(c => formatTemp(c));
    const feels = (hourly.apparent_temperature || []).slice(0, 24).map(c => formatTemp(c));

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    gradient.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

    chartInstances['tempSpline'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [
                {
                    label: `Ambient Temp (°${currentUnit})`,
                    data: temps,
                    borderColor: '#38bdf8',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2,
                    pointRadius: 3.5,
                    pointHoverRadius: 6,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.4
                },
                {
                    label: `Feels Like (°${currentUnit})`,
                    data: feels,
                    borderColor: '#818cf8',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointBackgroundColor: '#818cf8',
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.06)' },
                    ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.06)' },
                    ticks: {
                        callback: val => `${val}°`
                    }
                }
            }
        }
    });
}

// ---------------------------------------------------
// CHART 2: 7-DAY MIN VS. MAX THERMAL RANGE
// ---------------------------------------------------
function renderSevenDayRangeChart() {
    destroyChart('sevenDay');
    const ctx = document.getElementById('sevenDayRangeChart');
    if (!ctx || !rawWeatherData || !rawWeatherData.daily) return;

    const daily = rawWeatherData.daily;
    const days = (daily.time || []).slice(0, 7).map(t => {
        const d = new Date(t + 'T00:00:00');
        return d.toLocaleDateString([], { weekday: 'short' });
    });

    const maxTemps = (daily.temperature_2m_max || []).slice(0, 7).map(c => formatTemp(c));
    const minTemps = (daily.temperature_2m_min || []).slice(0, 7).map(c => formatTemp(c));

    chartInstances['sevenDay'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: `Max Temp (°${currentUnit})`,
                    data: maxTemps,
                    backgroundColor: 'rgba(244, 63, 94, 0.85)',
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: `Min Temp (°${currentUnit})`,
                    data: minTemps,
                    backgroundColor: 'rgba(56, 189, 248, 0.85)',
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 12, padding: 12, font: { weight: 600 } }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.06)' },
                    ticks: { callback: val => `${val}°` }
                }
            }
        }
    });
}

// ---------------------------------------------------
// CHART 3: ATMOSPHERIC CORRELATION (HUMIDITY, WIND, PRESSURE)
// ---------------------------------------------------
function renderCorrelationChart() {
    destroyChart('correlation');
    const ctx = document.getElementById('correlationChart');
    if (!ctx || !rawWeatherData || !rawWeatherData.hourly) return;

    const hourly = rawWeatherData.hourly;
    const times = (hourly.time || []).slice(0, 24).map(t => {
        const d = new Date(t);
        return d.toLocaleTimeString([], { hour: 'numeric' });
    });

    const humidity = (hourly.relative_humidity_2m || []).slice(0, 24);
    const wind = (hourly.wind_speed_10m || []).slice(0, 24).map(w => currentUnit === 'F' ? Math.round(w * 0.621371) : Math.round(w));
    const pressure = (hourly.surface_pressure || []).slice(0, 24);

    chartInstances['correlation'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: times,
            datasets: [
                {
                    type: 'line',
                    label: 'Humidity (%)',
                    data: humidity,
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    yAxisID: 'yHumidity',
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    type: 'bar',
                    label: `Wind (${currentUnit === 'F' ? 'mph' : 'km/h'})`,
                    data: wind,
                    backgroundColor: 'rgba(56, 189, 248, 0.75)',
                    borderRadius: 6,
                    yAxisID: 'yWind'
                },
                {
                    type: 'line',
                    label: 'Pressure (hPa)',
                    data: pressure,
                    borderColor: '#fbbf24',
                    borderWidth: 2,
                    borderDash: [4, 4],
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.3,
                    yAxisID: 'yPressure'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 10, padding: 10, font: { weight: 600 } }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }
                },
                yHumidity: {
                    type: 'linear',
                    position: 'left',
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { callback: val => `${val}%` }
                },
                yWind: {
                    type: 'linear',
                    position: 'right',
                    grid: { display: false },
                    ticks: { callback: val => `${val}` }
                },
                yPressure: {
                    display: false,
                    type: 'linear'
                }
            }
        }
    });
}

// ---------------------------------------------------
// CHART 4: DIURNAL UV RADIATION & SOLAR CURVE
// ---------------------------------------------------
function renderUvSolarChart() {
    destroyChart('uvSolar');
    const ctx = document.getElementById('uvSolarChart');
    if (!ctx || !rawWeatherData || !rawWeatherData.hourly) return;

    const hourly = rawWeatherData.hourly;
    const times = (hourly.time || []).slice(0, 24).map(t => {
        const d = new Date(t);
        return d.toLocaleTimeString([], { hour: 'numeric' });
    });

    const uvValues = (hourly.uv_index || []).slice(0, 24);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
    gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.25)');
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');

    chartInstances['uvSolar'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [
                {
                    label: 'Solar UV Index',
                    data: uvValues,
                    borderColor: '#f59e0b',
                    borderWidth: 2.5,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.45,
                    pointBackgroundColor: '#fbbf24',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: item => `UV Index: ${item.raw} (${getUvRiskLevel(item.raw).label})`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }
                },
                y: {
                    min: 0,
                    suggestedMax: 10,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { stepSize: 2 }
                }
            }
        }
    });
}

// ---------------------------------------------------
// CHART 5: AIR QUALITY & PARTICULATE MATTER RADAR
// ---------------------------------------------------
function renderAqiRadarChart() {
    destroyChart('aqiRadar');
    const ctx = document.getElementById('aqiRadarChart');
    if (!ctx) return;

    const currentAir = rawAirData && rawAirData.current ? rawAirData.current : {};
    const pm25 = currentAir.pm2_5 !== undefined ? Math.round(currentAir.pm2_5) : 18;
    const pm10 = currentAir.pm10 !== undefined ? Math.round(currentAir.pm10) : 32;
    const no2 = currentAir.nitrogen_dioxide !== undefined ? Math.round(currentAir.nitrogen_dioxide) : 24;
    const o3 = currentAir.ozone !== undefined ? Math.round(currentAir.ozone) : 45;
    const co = currentAir.carbon_monoxide !== undefined ? Math.round(currentAir.carbon_monoxide / 10) : 30;

    chartInstances['aqiRadar'] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['PM2.5 (Fine)', 'PM10 (Dust)', 'NO₂ (Dioxide)', 'O₃ (Ozone)', 'CO (Carbon Monoxide)'],
            datasets: [
                {
                    label: 'Pollutant Concentration (µg/m³)',
                    data: [pm25, pm10, no2, o3, co],
                    backgroundColor: 'rgba(56, 189, 248, 0.25)',
                    borderColor: '#38bdf8',
                    borderWidth: 2,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.12)' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    pointLabels: {
                        color: 'rgba(255, 255, 255, 0.85)',
                        font: { size: 10, weight: 600 }
                    },
                    ticks: {
                        backdropColor: 'transparent',
                        color: 'rgba(255, 255, 255, 0.45)',
                        showLabelBackdrop: false
                    }
                }
            }
        }
    });
}

// ---------------------------------------------------
// CHART 6: PRECIPITATION PROBABILITY & VOLUME ACCUMULATION
// ---------------------------------------------------
function renderPrecipChart() {
    destroyChart('precip');
    const ctx = document.getElementById('precipChart');
    if (!ctx || !rawWeatherData || !rawWeatherData.hourly) return;

    const hourly = rawWeatherData.hourly;
    const times = (hourly.time || []).slice(0, 24).map(t => {
        const d = new Date(t);
        return d.toLocaleTimeString([], { hour: 'numeric' });
    });

    const probs = (hourly.precipitation_probability || []).slice(0, 24).map(p => Number(p) || 0);
    const rawMm = (hourly.precipitation || []).slice(0, 24).map(v => Number(v) || 0);
    const volumes = currentUnit === 'F' 
        ? rawMm.map(mm => Number((mm * 0.03937).toFixed(2)))
        : rawMm.map(mm => Number(mm.toFixed(1)));

    const volLabel = currentUnit === 'F' ? 'Accumulation (in)' : 'Accumulation (mm)';
    const maxVol = Math.max(...volumes, 5);

    chartInstances['precip'] = new Chart(ctx, {
        data: {
            labels: times,
            datasets: [
                {
                    type: 'bar',
                    label: volLabel,
                    data: volumes,
                    backgroundColor: 'rgba(129, 140, 248, 0.45)',
                    hoverBackgroundColor: '#818cf8',
                    borderColor: '#818cf8',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    yAxisID: 'yVol',
                    order: 2
                },
                {
                    type: 'line',
                    label: 'Precipitation Probability (%)',
                    data: probs,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    fill: true,
                    borderWidth: 2.5,
                    tension: 0.35,
                    pointRadius: 3,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#0f172a',
                    pointBorderWidth: 1.5,
                    pointHoverRadius: 6,
                    yAxisID: 'yProb',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.06)' },
                    ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }
                },
                yProb: {
                    type: 'linear',
                    position: 'left',
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.06)' },
                    ticks: {
                        callback: val => `${val}%`
                    }
                },
                yVol: {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    max: currentUnit === 'F' ? Math.max(maxVol, 0.5) : Math.max(maxVol, 10),
                    grid: { display: false },
                    ticks: {
                        callback: val => currentUnit === 'F' ? `${val} in` : `${val} mm`
                    }
                }
            }
        }
    });
}

// ===================================================
// 5. CITY AUTOCOMPLETE & SEARCH CONTROLLER
// ===================================================

function setupSearch() {
    const cityInput = document.getElementById('city-input');
    const listContainer = document.getElementById('autocomplete-list');
    if (!cityInput || !listContainer) return;

    let searchCache = new Map();

    cityInput.addEventListener('input', debounce(async function () {
        const val = this.value.trim();
        listContainer.innerHTML = '';
        listContainer.style.display = 'none';
        if (!val || val.length < 2) return;

        if (searchCache.has(val)) {
            renderSuggestions(searchCache.get(val), val, listContainer, cityInput);
            return;
        }

        try {
            let results = [];
            if (API_BASE_URL) {
                try {
                    const resp = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(val)}`);
                    if (resp.ok) {
                        const data = await resp.json();
                        results = data.results || [];
                    }
                } catch (e) {}
            }

            if (results.length === 0) {
                const response = await fetch(`${GEOCODING_BASE}/search?name=${encodeURIComponent(val)}&count=5&language=en&format=json`);
                const data = await response.json();
                results = data.results || [];
            }

            if (results.length > 0) {
                searchCache.set(val, results);
                renderSuggestions(results, val, listContainer, cityInput);
            }
        } catch (e) {
            console.error("Geocoding error in analytics:", e);
        }
    }, 300));

    document.addEventListener('click', (e) => {
        if (e.target !== cityInput) {
            listContainer.style.display = 'none';
        }
    });
}

function renderSuggestions(matches, val, listContainer, cityInput) {
    if (!matches || matches.length === 0) return;
    listContainer.innerHTML = '';
    listContainer.style.display = 'block';

    matches.forEach(match => {
        const item = document.createElement("div");
        item.className = "suggestion-item";

        const regex = new RegExp(`(${val})`, "gi");
        const highlightedName = match.name.replace(regex, '<span class="highlight">$1</span>');
        item.innerHTML = `<span>${highlightedName}</span><span class="country-code">${match.country || ''}</span>`;

        item.addEventListener("click", () => {
            cityInput.value = "";
            listContainer.style.display = 'none';

            const newCity = {
                name: match.name,
                country: match.country,
                flag: getFlagEmoji(match.country_code || match.country),
                lat: match.latitude,
                lng: match.longitude,
                elevation: match.elevation !== undefined ? Math.round(match.elevation) : 35
            };

            loadAnalyticsForCity(newCity);
        });

        listContainer.appendChild(item);
    });
}

function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '📍';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// ===================================================
// 6. UNIT TOGGLE & CLOCK CONTROLS
// ===================================================

function setupUnitToggle() {
    const unitBtn = document.getElementById('unit-toggle');
    updateUnitButtonLabel();
    if (unitBtn) {
        unitBtn.addEventListener('click', () => {
            currentUnit = currentUnit === 'C' ? 'F' : 'C';
            localStorage.setItem('stratos_unit', currentUnit);
            updateUnitButtonLabel();
            updateHeroBanner();
            updateKpiRibbon();
            renderAllCharts();
        });
    }
}

function updateUnitButtonLabel() {
    const unitBtn = document.getElementById('unit-toggle');
    if (unitBtn) {
        unitBtn.innerText = `°${currentUnit}`;
        unitBtn.title = `Switch to °${currentUnit === 'C' ? 'F' : 'C'}`;
    }
}

function updateClock() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// ===================================================
// 7. INITIALIZATION LIFECYCLE
// ===================================================

async function initAnalytics() {
    setupUnitToggle();
    setupSearch();
    setupExportAndSnapshots();
    updateClock();
    setInterval(updateClock, 1000);

    // Read initial city from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const paramCity = urlParams.get('city');
    const storedCity = localStorage.getItem('stratos_active_city');

    const targetCityName = paramCity || storedCity || 'Tokyo';

    // Resolve city coordinates via Geocoding
    try {
        const response = await fetch(`${GEOCODING_BASE}/search?name=${encodeURIComponent(targetCityName)}&count=1&language=en&format=json`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const res = data.results[0];
            loadAnalyticsForCity({
                name: res.name,
                country: res.country,
                flag: getFlagEmoji(res.country_code || res.country),
                lat: res.latitude,
                lng: res.longitude,
                elevation: res.elevation !== undefined ? Math.round(res.elevation) : 40
            });
            return;
        }
    } catch (e) {
        console.warn("Geocoding resolution fallback:", e);
    }

    // Default Tokyo fallback
    loadAnalyticsForCity(activeCity);
}

// ===================================================
// 8. TELEMETRY EXPORT & SNAPSHOT CONTROLLER
// ===================================================

function setupExportAndSnapshots() {
    const exportBtn = document.getElementById('btn-export-menu');
    const exportMenu = document.getElementById('export-dropdown-menu');
    const csvBtn = document.getElementById('btn-export-csv');
    const jsonBtn = document.getElementById('btn-export-json');

    if (exportBtn && exportMenu) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!exportMenu.contains(e.target) && e.target !== exportBtn) {
                exportMenu.classList.remove('show');
            }
        });
    }

    if (csvBtn) {
        csvBtn.addEventListener('click', () => {
            if (exportMenu) exportMenu.classList.remove('show');
            exportTelemetryCSV();
        });
    }

    if (jsonBtn) {
        jsonBtn.addEventListener('click', () => {
            if (exportMenu) exportMenu.classList.remove('show');
            exportTelemetryJSON();
        });
    }

    // Chart snapshot buttons
    document.querySelectorAll('.chart-snapshot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chartId = btn.getAttribute('data-chart');
            const chartName = btn.getAttribute('data-name') || chartId;
            downloadChartSnapshot(chartId, chartName);
        });
    });
}

function exportTelemetryCSV() {
    if (!rawWeatherData || !rawWeatherData.hourly) {
        alert("Telemetry data is still loading. Please wait a moment.");
        return;
    }

    const hourly = rawWeatherData.hourly;
    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const feels = hourly.apparent_temperature || [];
    const humidities = hourly.relative_humidity_2m || [];
    const winds = hourly.wind_speed_10m || [];
    const pressures = hourly.surface_pressure || [];
    const uvs = hourly.uv_index || [];
    const probs = hourly.precipitation_probability || [];
    const precips = hourly.precipitation || [];

    const headers = [
        "Timestamp",
        `Ambient_Temperature_${currentUnit}`,
        `Feels_Like_${currentUnit}`,
        "Humidity_Percent",
        `Wind_Speed_${currentUnit === 'F' ? 'mph' : 'kmh'}`,
        `Surface_Pressure_${currentUnit === 'F' ? 'inHg' : 'hPa'}`,
        "UV_Index",
        "Precipitation_Probability_Percent",
        `Precipitation_Volume_${currentUnit === 'F' ? 'in' : 'mm'}`
    ];

    const rows = [headers.join(",")];

    for (let i = 0; i < times.length; i++) {
        const time = times[i];
        const temp = formatTemp(temps[i]);
        const feel = formatTemp(feels[i]);
        const hum = humidities[i] !== undefined ? humidities[i] : "";
        const wind = currentUnit === 'F' ? (Number(winds[i] || 0) * 0.621371).toFixed(1) : (Number(winds[i] || 0)).toFixed(1);
        const press = currentUnit === 'F' ? (Number(pressures[i] || 1013) * 0.02953).toFixed(2) : (Number(pressures[i] || 1013)).toFixed(1);
        const uv = uvs[i] !== undefined ? uvs[i] : "";
        const prob = probs[i] !== undefined ? probs[i] : 0;
        const vol = currentUnit === 'F' ? (Number(precips[i] || 0) * 0.03937).toFixed(2) : (Number(precips[i] || 0)).toFixed(1);

        rows.push([
            `"${time}"`,
            temp,
            feel,
            hum,
            wind,
            press,
            uv,
            prob,
            vol
        ].join(","));
    }

    const csvContent = rows.join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const cleanCity = activeCity.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `Stratos_${cleanCity}_Hourly_Climate_Telemetry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportTelemetryJSON() {
    if (!rawWeatherData) {
        alert("Telemetry data is still loading. Please wait a moment.");
        return;
    }

    const exportPayload = {
        meta: {
            service: "Stratos Weather Climate Intelligence Suite",
            version: "2.0.0",
            exportedAt: new Date().toISOString(),
            temperatureUnit: `°${currentUnit}`,
            station: activeCity
        },
        numericalModel: rawWeatherData,
        atmosphericChemistry: rawAirData
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const cleanCity = activeCity.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `Stratos_${cleanCity}_Raw_Atmospheric_Package.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadChartSnapshot(canvasId, baseName) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const chart = (typeof Chart !== 'undefined' && Chart.getChart) ? Chart.getChart(canvas) : null;
    const datasets = chart && chart.data && chart.data.datasets ? chart.data.datasets : [];

    // Header and Legend Layout calculations
    const padding = 32;
    const hasLegend = datasets.length > 0;
    const legendRowHeight = hasLegend ? 44 : 0;
    const headerHeight = 65 + legendRowHeight;
    const footerHeight = 28;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width + padding * 2;
    exportCanvas.height = canvas.height + padding * 2 + headerHeight + footerHeight;

    const ctx = exportCanvas.getContext('2d');

    // 1. Fill dark futuristic slate background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, exportCanvas.height);
    bgGrad.addColorStop(0, '#070d1e');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Subtle cyan cyber border
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, exportCanvas.width - 2, exportCanvas.height - 2);

    // 2. Title & Branding (Header Line 1)
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.fillText(`STRATOS WEATHER • ${activeCity.name.toUpperCase()}`, padding, padding + 20);

    // Station Coordinates on Top Right
    const coordsStr = `Station: ${Math.abs(activeCity.lat).toFixed(2)}° ${activeCity.lat >= 0 ? 'N' : 'S'}, ${Math.abs(activeCity.lng).toFixed(2)}° ${activeCity.lng >= 0 ? 'E' : 'W'} • Elev: ${activeCity.elevation || 35} m`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(coordsStr, exportCanvas.width - padding, padding + 20);
    ctx.textAlign = 'left';

    // 3. Subtitle / Timestamp (Header Line 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText(`${baseName.replace(/_/g, ' ')} • Generated ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} • Unit: °${currentUnit}`, padding, padding + 40);

    // 4. Dedicated Visual Legend Banner (Header Line 3)
    if (hasLegend) {
        const legendY = padding + 54;
        const legendHeight = 34;
        const legendWidth = exportCanvas.width - padding * 2;

        // Pill background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(padding, legendY, legendWidth, legendHeight, 8);
        } else {
            ctx.rect(padding, legendY, legendWidth, legendHeight);
        }
        ctx.fill();
        ctx.stroke();

        // Legend Badge
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.fillText('INDICATORS:', padding + 14, legendY + 22);

        let curX = padding + 95;

        datasets.forEach(ds => {
            const label = ds.label || 'Metric';
            let color = '#38bdf8';
            if (typeof ds.borderColor === 'string' && (ds.borderColor.startsWith('#') || ds.borderColor.startsWith('rgb'))) {
                color = ds.borderColor;
            } else if (typeof ds.backgroundColor === 'string' && (ds.backgroundColor.startsWith('#') || ds.backgroundColor.startsWith('rgb'))) {
                color = ds.backgroundColor;
            } else if (label.toLowerCase().includes('max')) {
                color = '#f59e0b';
            } else if (label.toLowerCase().includes('min')) {
                color = '#06b6d4';
            }

            const isDashed = Array.isArray(ds.borderDash) && ds.borderDash.length > 0;
            const isBar = ds.type === 'bar' || (!ds.type && chart && chart.config.type === 'bar');

            ctx.save();
            if (isBar) {
                // Mini bar swatch
                ctx.fillStyle = color;
                ctx.fillRect(curX, legendY + 11, 16, 12);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.lineWidth = 1;
                ctx.strokeRect(curX, legendY + 11, 16, 12);
                curX += 22;
            } else {
                // Line swatch with dot
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                if (isDashed) {
                    ctx.setLineDash([4, 3]);
                }
                ctx.beginPath();
                ctx.moveTo(curX, legendY + 17);
                ctx.lineTo(curX + 22, legendY + 17);
                ctx.stroke();

                // Circle dot
                ctx.setLineDash([]);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(curX + 11, legendY + 17, 3.5, 0, Math.PI * 2);
                ctx.fill();
                curX += 28;
            }
            ctx.restore();

            // Label text
            ctx.fillStyle = '#ffffff';
            ctx.font = '600 12px Inter, system-ui, sans-serif';
            ctx.fillText(label, curX, legendY + 22);

            // Add note if dashed line
            if (isDashed) {
                const labelW = ctx.measureText(label).width;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
                ctx.font = '10px Inter, system-ui, sans-serif';
                ctx.fillText('(Dashed Line)', curX + labelW + 6, legendY + 22);
                curX += labelW + ctx.measureText('(Dashed Line)').width + 24;
            } else {
                curX += ctx.measureText(label).width + 22;
            }
        });
    }

    // 5. Draw the chart canvas
    ctx.drawImage(canvas, padding, padding + headerHeight);

    // 6. Draw clean footer attribution
    const footerY = exportCanvas.height - padding + 16;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText('STRATOS WEATHER INTELLIGENCE • NUMERICAL WEATHER PREDICTION MODEL (ECMWF / NOAA / DWD)', padding, footerY);

    ctx.textAlign = 'right';
    ctx.fillText('SCIENTIFIC & EDUCATIONAL TELEMETRY', exportCanvas.width - padding, footerY);
    ctx.textAlign = 'left';

    // 7. Trigger instant clean download
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    const cleanCity = activeCity.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `Stratos_${cleanCity}_${baseName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.addEventListener('DOMContentLoaded', initAnalytics);

