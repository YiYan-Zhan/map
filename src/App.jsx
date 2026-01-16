import React, { useState, useMemo, useEffect } from "react";
import WorldMap from "./components/WorldMap";
import "./App.css";
import {
  fetchCountriesFromGoogleSheets,
  fetchCountriesFromAppsScript,
  fetchCountriesFromSheetsAPI,
} from "./services/googleSheetsService";
import {
  fetchCountriesFromMapData,
  matchCountriesWithSheet,
} from "./utils/mapDataService";

// 地圖數據源 URL（TopoJSON）
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Google Sheets 配置
// 注意：Vite 使用 import.meta.env 而不是 process.env
// 環境變量前綴應該是 VITE_ 而不是 REACT_APP_
const GOOGLE_SHEETS_CONFIG = {
  // 方法1: 使用公開的 Google Sheets (CSV 格式)
  sheetId: import.meta.env.VITE_GOOGLE_SHEET_ID || "",
  sheetName: import.meta.env.VITE_GOOGLE_SHEET_NAME || "Sheet1",

  // 方法2: 使用 Google Apps Script Web App (推薦)
  appsScriptUrl: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || "",

  // 方法3: 使用 Google Sheets API v4 (需要 API Key)
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || "",

  // 是否啟用從 Google Sheets 加載（設為 false 則使用默認數據）
  enableGoogleSheets: import.meta.env.VITE_ENABLE_GOOGLE_SHEETS === "true",
};

// 默認國家數據（作為後備）
// 統一使用綠色系顏色，與 Google Sheets 數據保持一致
const DEFAULT_COLOR = "#10b981";

const defaultMarkedCountries = [
  // Asia
  { code: "CHN", name: "China", color: DEFAULT_COLOR, group: "china" },
  { code: "TWN", name: "Taiwan", color: DEFAULT_COLOR, group: "china" },
  { code: "HKG", name: "Hong Kong", color: DEFAULT_COLOR, group: "china" },
  { code: "SGP", name: "Singapore", color: DEFAULT_COLOR },
  { code: "JPN", name: "Japan", color: DEFAULT_COLOR },
  { code: "KOR", name: "South Korea", color: DEFAULT_COLOR },
  { code: "IND", name: "India", color: DEFAULT_COLOR },
  { code: "IDN", name: "Indonesia", color: DEFAULT_COLOR },
  { code: "PHL", name: "Philippines", color: DEFAULT_COLOR },
  { code: "TUR", name: "Turkey", color: DEFAULT_COLOR },
  // Europe
  { code: "CHE", name: "Switzerland", color: DEFAULT_COLOR },
  { code: "DEU", name: "Germany", color: DEFAULT_COLOR },
  { code: "BEL", name: "Belgium", color: DEFAULT_COLOR },
  { code: "FRA", name: "France", color: DEFAULT_COLOR },
  { code: "NLD", name: "Netherlands", color: DEFAULT_COLOR },
  { code: "GBR", name: "United Kingdom", color: DEFAULT_COLOR },
  { code: "DNK", name: "Denmark", color: DEFAULT_COLOR },
  { code: "SWE", name: "Sweden", color: DEFAULT_COLOR },
  { code: "GEO", name: "Georgia", color: DEFAULT_COLOR },
  { code: "RUS", name: "Russia", color: DEFAULT_COLOR },
  { code: "UKR", name: "Ukraine", color: DEFAULT_COLOR },
  // Others
  { code: "NZL", name: "New Zealand", color: DEFAULT_COLOR },
  { code: "PER", name: "Peru", color: DEFAULT_COLOR },
  { code: "BRA", name: "Brazil", color: DEFAULT_COLOR },
  { code: "USA", name: "United States", color: DEFAULT_COLOR },
  { code: "ARG", name: "Argentina", color: DEFAULT_COLOR },
  { code: "AUS", name: "Australia", color: DEFAULT_COLOR },
  { code: "CHL", name: "Chile", color: DEFAULT_COLOR },
  { code: "ISR", name: "Israel", color: DEFAULT_COLOR },
  { code: "MEX", name: "Mexico", color: DEFAULT_COLOR },
];

function App() {
  const [selectedCountryForNavigation, setSelectedCountryForNavigation] =
    useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  // 初始為空數組，避免先顯示默認數據
  const [markedCountries, setMarkedCountries] = useState([]);
  // 初始為 true，顯示 loading 狀態
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加載數據：先從地圖數據源獲取國家信息和座標，再匹配 Google Sheet
  useEffect(() => {
    const loadCountries = async () => {
      setLoading(true);
      setError(null);

      console.log(GOOGLE_SHEETS_CONFIG);

      try {
        // 步驟1: 從地圖數據源加載所有國家信息（包含座標）
        console.log("正在從地圖數據源加載國家信息...");
        const mapCountries = await fetchCountriesFromMapData(GEO_URL);
        console.log(`成功加載 ${mapCountries.length} 個國家/地區的地圖數據`);

        console.log(GOOGLE_SHEETS_CONFIG);
        // 步驟2: 如果啟用了 Google Sheets，加載 Sheet 數據並匹配
        if (GOOGLE_SHEETS_CONFIG.enableGoogleSheets) {
          let sheetCountries = [];

          // 優先使用 Apps Script（最靈活）
          if (GOOGLE_SHEETS_CONFIG.appsScriptUrl) {
            console.log("正在從 Google Apps Script 加載數據...");
            sheetCountries = await fetchCountriesFromAppsScript(
              GOOGLE_SHEETS_CONFIG.appsScriptUrl
            );
          }
          // 其次使用 Sheets API（需要 API Key）
          else if (
            GOOGLE_SHEETS_CONFIG.sheetId &&
            GOOGLE_SHEETS_CONFIG.apiKey
          ) {
            console.log("正在從 Google Sheets API 加載數據...");
            sheetCountries = await fetchCountriesFromSheetsAPI(
              GOOGLE_SHEETS_CONFIG.sheetId,
              GOOGLE_SHEETS_CONFIG.apiKey,
              `${GOOGLE_SHEETS_CONFIG.sheetName}!A2:B`
            );
          }
          // 最後使用公開的 CSV 格式
          else if (GOOGLE_SHEETS_CONFIG.sheetId) {
            console.log("正在從公開的 Google Sheet CSV 加載數據...");
            sheetCountries = await fetchCountriesFromGoogleSheets(
              GOOGLE_SHEETS_CONFIG.sheetId,
              GOOGLE_SHEETS_CONFIG.sheetName
            );
          }

          if (sheetCountries && sheetCountries.length > 0) {
            console.log(`成功加載 ${sheetCountries.length} 個有 remark 的國家`);

            // 步驟3: 匹配地圖數據和 Sheet 數據，合併座標信息
            const matchedCountries = matchCountriesWithSheet(
              mapCountries,
              sheetCountries
            );
            console.log(`成功匹配 ${matchedCountries.length} 個國家`);

            if (matchedCountries.length > 0) {
              setMarkedCountries(matchedCountries);
            } else {
              console.warn("沒有匹配到任何國家，使用默認數據");
              setMarkedCountries(defaultMarkedCountries);
              setError("無法匹配國家數據，使用默認數據");
            }
          } else {
            console.warn("Google Sheets 中沒有有 remark 的國家，使用默認數據");
            setMarkedCountries(defaultMarkedCountries);
            setError("Google Sheets 中沒有有效數據，使用默認數據");
          }
        } else {
          // 如果未啟用 Google Sheets，使用默認數據
          console.log("Google Sheets 未啟用，使用默認數據");
          setMarkedCountries(defaultMarkedCountries);
        }
      } catch (err) {
        console.error("加載數據失敗:", err);
        setError("加載數據失敗，使用默認數據");
        setMarkedCountries(defaultMarkedCountries);
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  // Get unique countries for sidebar (group countries together)
  const sidebarCountries = useMemo(() => {
    const countries = [];
    const addedCodes = new Set();

    // First, ensure China is added (for grouped countries)
    const china = markedCountries.find((c) => c.code === "CHN");
    if (china) {
      countries.push(china);
      addedCodes.add(china.code);
    }

    // Then, add all non-grouped countries
    for (const country of markedCountries) {
      if (!country.group && !addedCodes.has(country.code)) {
        countries.push(country);
        addedCodes.add(country.code);
      }
    }

    // Sort countries alphabetically by name
    return countries.sort((a, b) => a.name.localeCompare(b.name));
  }, [markedCountries]);

  const handleCountryClick = (country) => {
    setSelectedCountryForNavigation(country);
  };

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    const query = (searchQuery || "").trim().toLowerCase();

    // If no search query, return all countries
    if (!query) {
      return sidebarCountries;
    }

    // Simple filter: check if country name includes the query
    const result = sidebarCountries.filter((country) => {
      if (!country || !country.name) {
        return false;
      }
      const name = country.name.toLowerCase();
      return name.includes(query);
    });

    console.log(result);
    return result;
  }, [sidebarCountries, searchQuery]);

  return (
    <div className="app">
      <header className="app-header">
        {loading && <div className="loading-indicator">正在加載數據...</div>}
        {error && !loading && <div className="error-indicator">{error}</div>}
      </header>
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加載地圖數據...</p>
        </div>
      ) : (
        <div className="app-content">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>Countries / Regions</h2>
              <div className="sidebar-search">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sidebar-search-input"
                />
              </div>
            </div>
            <div className="sidebar-list">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, index) => {
                  return (
                    <div
                      key={`${country.code}-${index}`}
                      className="sidebar-item"
                      onClick={() => handleCountryClick(country)}
                      style={{
                        borderLeft: `4px solid ${country.color || "#ccc"}`,
                        backgroundColor:
                          selectedCountryForNavigation?.code === country.code
                            ? "rgba(0,0,0,0.05)"
                            : "transparent",
                      }}
                    >
                      <span className="sidebar-item-name">{country.name}</span>
                    </div>
                  );
                })
              ) : (
                <div className="sidebar-no-results">No countries found</div>
              )}
            </div>
          </aside>
          <main className="app-main">
            <WorldMap
              markedCountries={markedCountries}
              selectedCountryForNavigation={selectedCountryForNavigation}
              onNavigateToCountry={setSelectedCountryForNavigation}
            />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
