import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import "./WorldMap.css";

// Using 50m resolution - world-atlas only provides 110m, 50m, and 10m
// 50m offers good balance between detail and performance
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Country information data
const countryInfo = {
  CHN: "China is the world's most populous country and the third-largest by area. It has a rich history spanning over 5,000 years and is known for its diverse culture, cuisine, and technological advancements.",
  TWN: "Taiwan is an island nation in East Asia, known for its vibrant democracy, high-tech industry, and beautiful natural landscapes including mountains and coastlines.",
  HKG: "Hong Kong is a Special Administrative Region of China, famous as a global financial hub, international trade center, and gateway between East and West.",
  SGP: "Singapore is a city-state in Southeast Asia, renowned for its efficient infrastructure, multicultural society, and status as a major global financial center.",
  JPN: "Japan is an island nation in East Asia, famous for its unique culture, advanced technology, delicious cuisine, and beautiful cherry blossoms.",
  KOR: "South Korea is a country in East Asia, known for its K-pop culture, technological innovation, delicious food, and rapid economic development.",
  IND: "India is the world's second-most populous country, known for its diverse culture, rich history, Bollywood cinema, and growing tech industry.",
  IDN: "Indonesia is the world's largest archipelago nation, famous for its beautiful beaches, diverse wildlife, rich culture, and volcanic landscapes.",
  PHL: "The Philippines is an archipelago in Southeast Asia, known for its beautiful beaches, friendly people, and rich cultural heritage.",
  TUR: "Turkey is a transcontinental country bridging Europe and Asia, famous for its rich history, delicious cuisine, and unique blend of cultures.",
  CHE: "Switzerland is a landlocked country in Central Europe, renowned for its stunning Alpine scenery, precision engineering, and banking sector.",
  DEU: "Germany is the most populous country in the European Union, known for its engineering excellence, rich history, and cultural contributions.",
  BEL: "Belgium is a small country in Western Europe, famous for its chocolate, beer, waffles, and as the headquarters of the European Union.",
  FRA: "France is one of the world's most visited countries, known for its art, culture, cuisine, fashion, and iconic landmarks like the Eiffel Tower.",
  NLD: "The Netherlands is a country in Northwestern Europe, famous for its windmills, tulips, cycling culture, and progressive social policies.",
  GBR: "The United Kingdom is an island nation in Northwestern Europe, known for its rich history, royal family, and cultural influence worldwide.",
  DNK: "Denmark is a Nordic country in Northern Europe, famous for its high quality of life, design, and the concept of 'hygge'.",
  SWE: "Sweden is the largest Nordic country, known for its innovation, social welfare system, and beautiful natural landscapes.",
  GEO: "Georgia is a country at the intersection of Europe and Asia, known for its ancient history, wine culture, and stunning mountain scenery.",
  RUS: "Russia is the world's largest country by area, spanning Eastern Europe and Northern Asia, known for its rich history and cultural heritage.",
  UKR: "Ukraine is the second-largest country in Europe, known for its fertile farmland, rich cultural heritage, and historical significance.",
  NZL: "New Zealand is an island country in the southwestern Pacific Ocean, famous for its stunning natural beauty and outdoor adventure activities.",
  PER: "Peru is a country in South America, known for its ancient Incan civilization, diverse geography, and delicious cuisine including ceviche.",
  BRA: "Brazil is the largest country in South America, famous for its Amazon rainforest, vibrant culture, soccer, and Carnival celebrations.",
  USA: "The United States is a diverse nation spanning North America, known for its innovation, cultural influence, and varied landscapes.",
  ARG: "Argentina is the second-largest country in South America, famous for tango, beef, wine, and its stunning natural landscapes including Patagonia.",
  AUS: "Australia is the world's largest island and smallest continent, known for its unique wildlife, beautiful beaches, and laid-back lifestyle.",
  CHL: "Chile is a long, narrow country in South America, famous for its wine, copper mining, and diverse landscapes from desert to glaciers.",
  ISR: "Israel is a country in the Middle East, known for its historical and religious significance, innovation in technology, and diverse culture.",
  MEX: "Mexico is a country in North America, famous for its rich culture, delicious cuisine, ancient civilizations, and vibrant festivals.",
};

// 座標現在從 markedCountries 中動態獲取，不再需要硬編碼

const WorldMap = ({
  markedCountries,
  onNavigateToCountry,
  selectedCountryForNavigation,
}) => {
  const [tooltip, setTooltip] = useState({
    show: false,
    content: "",
    x: 0,
    y: 0,
  });
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });
  const [selectedCountry, setSelectedCountry] = useState(null);

  // 將國家代碼轉換為地圖使用的格式（支持多種代碼格式）
  const countryCodes = markedCountries.map((c) => c.code.toLowerCase());

  // 國家代碼映射表（處理不同的代碼格式）
  const countryCodeMap = {
    chn: ["chn", "cn", "china"],
    twn: ["twn", "tw", "taiwan"],
    hkg: ["hkg", "hk", "hong kong"],
    sgp: ["sgp", "sg", "singapore"],
    jpn: ["jpn", "jp", "japan"],
    kor: ["kor", "kr", "korea", "south korea"],
    ind: ["ind", "in", "india"],
    idn: ["idn", "id", "indonesia"],
    phl: ["phl", "ph", "philippines"],
    tur: ["tur", "tr", "turkey"],
    che: ["che", "ch", "switzerland"],
    deu: ["deu", "de", "germany"],
    bel: ["bel", "be", "belgium"],
    fra: ["fra", "fr", "france"],
    nld: ["nld", "nl", "netherlands"],
    gbr: ["gbr", "gb", "uk", "united kingdom"],
    dnk: ["dnk", "dk", "denmark"],
    swe: ["swe", "se", "sweden"],
    geo: ["geo", "ge", "georgia"],
    rus: ["rus", "ru", "russia"],
    ukr: ["ukr", "ua", "ukraine"],
    nzl: ["nzl", "nz", "new zealand"],
    per: ["per", "pe", "peru"],
    bra: ["bra", "br", "brazil"],
    usa: ["usa", "us", "united states"],
    arg: ["arg", "ar", "argentina"],
    aus: ["aus", "au", "australia"],
    chl: ["chl", "cl", "chile"],
    isr: ["isr", "il", "israel"],
    mex: ["mex", "mx", "mexico"],
  };

  // 匹配國家（基於地圖數據的實際格式：使用 properties.name）
  const findCountry = (geo) => {
    const props = geo.properties || {};

    // 優先使用 ISO 代碼匹配（最可靠）
    const isoCodes = [
      props.ISO_A3,
      props.ISO_A3_EH,
      props.ADM0_A3,
      props.ISO_A2,
    ]
      .filter(Boolean)
      .map((c) => c?.toString().toLowerCase().trim());

    // 先嘗試 ISO 代碼匹配
    for (const country of markedCountries) {
      const code = country.code.toLowerCase();
      if (isoCodes.includes(code)) {
        return country;
      }
      const aliases = countryCodeMap[code] || [code];
      if (aliases.some((alias) => isoCodes.includes(alias))) {
        return country;
      }
    }

    // 檢查國家名稱（用於排除 North Korea）
    const countryName =
      props.name || props.NAME || props.NAME_LONG || props.ADMIN;
    const nameLower = countryName?.toString().toLowerCase().trim() || "";

    // 排除 North Korea（它不應該匹配到 KOR）
    if (
      nameLower.includes("north korea") ||
      nameLower.includes("democratic people's republic")
    ) {
      return null;
    }

    // 然後使用名稱匹配（如果還沒有匹配到）
    if (!countryName) return null;

    // 國家名稱映射表（地圖數據中的實際名稱 -> ISO 代碼）
    const nameMap = {
      // 亞洲
      china: "CHN",
      "people's republic of china": "CHN",
      taiwan: "TWN",
      "hong kong": "HKG",
      singapore: "SGP",
      japan: "JPN",
      "south korea": "KOR",
      "republic of korea": "KOR",
      india: "IND",
      indonesia: "IDN",
      philippines: "PHL",
      turkey: "TUR",
      // 歐洲
      switzerland: "CHE",
      germany: "DEU",
      belgium: "BEL",
      france: "FRA",
      netherlands: "NLD",
      "united kingdom": "GBR",
      "great britain": "GBR",
      denmark: "DNK",
      sweden: "SWE",
      georgia: "GEO",
      russia: "RUS",
      ukraine: "UKR",
      // 其他
      "new zealand": "NZL",
      peru: "PER",
      brazil: "BRA",
      "united states of america": "USA",
      "united states": "USA",
      argentina: "ARG",
      australia: "AUS",
      chile: "CHL",
      israel: "ISR",
      mexico: "MEX",
    };

    // 1. 優先：直接名稱匹配（最精確）
    if (nameMap[nameLower]) {
      const code = nameMap[nameLower];
      return markedCountries.find(
        (c) => c.code.toLowerCase() === code.toLowerCase()
      );
    }

    // 2. 名稱匹配（精確匹配優先）
    // 完全匹配
    if (nameMap[nameLower]) {
      const code = nameMap[nameLower];
      return markedCountries.find(
        (c) => c.code.toLowerCase() === code.toLowerCase()
      );
    }

    // 部分匹配（僅在名稱字段中進行，避免誤匹配）
    for (const [mapName, mapCode] of Object.entries(nameMap)) {
      // 排除 North Korea
      if (
        nameLower.includes("north korea") ||
        nameLower.includes("democratic people's republic")
      ) {
        continue;
      }
      // 部分匹配：地圖名稱包含在國家名稱中，或國家名稱包含地圖名稱
      if (nameLower.includes(mapName) || mapName.includes(nameLower)) {
        return markedCountries.find(
          (c) => c.code.toLowerCase() === mapCode.toLowerCase()
        );
      }
    }

    return null;
  };

  // 將顏色變深的輔助函數
  const darkenColor = (color, percent = 20) => {
    // 移除 # 符號
    const hex = color.replace("#", "");
    // 轉換為 RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // 變深
    const newR = Math.max(0, Math.floor(r * (1 - percent / 100)));
    const newG = Math.max(0, Math.floor(g * (1 - percent / 100)));
    const newB = Math.max(0, Math.floor(b * (1 - percent / 100)));
    // 轉回十六進制
    return `#${newR.toString(16).padStart(2, "0")}${newG
      .toString(16)
      .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
  };

  // 獲取國家的顏色
  const getCountryColor = (geo) => {
    const country = findCountry(geo);
    return country ? country.color : "#e0e0e0";
  };

  // 檢查是否為標註的國家
  const isMarkedCountry = (geo) => {
    return findCountry(geo) !== null;
  };

  // 獲取國家名稱（如果是合併組，顯示組合名稱）
  const getCountryName = (geo) => {
    const country = findCountry(geo);

    if (country && country.group) {
      // 如果是合併組，只顯示組內第一個國家（China）的名稱
      const groupCountries = markedCountries.filter(
        (c) => c.group === country.group
      );
      const firstCountry =
        groupCountries.find((c) => c.code === "CHN") || groupCountries[0];
      return firstCountry ? firstCountry.name : country.name;
    }

    // 如果找到匹配的國家，顯示自定義名稱
    if (country) {
      return country.name;
    }

    // Otherwise show the original name from map data
    const props = geo.properties || {};
    return (
      props.name || props.NAME || props.NAME_LONG || props.ADMIN || "Unknown"
    );
  };

  const handleMouseEnter = (geo, event) => {
    const name = getCountryName(geo);
    const country = findCountry(geo);

    // 調試：在控制台顯示 Japan 和 Korea 的匹配信息（開發時使用）
    if (import.meta.env.DEV) {
      const props = geo.properties || {};
      const countryName =
        props.name || props.NAME || props.NAME_LONG || props.ADMIN;
      if (
        countryName &&
        (countryName.toLowerCase().includes("japan") ||
          countryName.toLowerCase().includes("korea"))
      ) {
        console.log("Japan/Korea 匹配信息:", {
          國家名稱: countryName,
          匹配結果: country ? country.name : "未匹配",
          ISO_A3: props.ISO_A3,
          ISO_A2: props.ISO_A2,
          name: props.name,
          NAME: props.NAME,
        });
      }
    }

    setTooltip({
      show: true,
      content: name,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, content: "", x: 0, y: 0 });
  };

  const handleMoveEnd = (position) => {
    setPosition(position);
  };

  // Navigate to country when selected from sidebar
  React.useEffect(() => {
    if (selectedCountryForNavigation) {
      // 從 markedCountries 中查找對應的國家（包含座標信息）
      const country = markedCountries.find(
        (c) => c.code === selectedCountryForNavigation.code
      );

      if (country && country.coordinates) {
        const coords = country.coordinates;
        setPosition({ coordinates: coords, zoom: 3 });

        // Show modal after a short delay to allow map to move
        setTimeout(() => {
          if (selectedCountryForNavigation.group) {
            const mainCountry =
              markedCountries.find(
                (c) =>
                  c.code === "CHN" &&
                  c.group === selectedCountryForNavigation.group
              ) || selectedCountryForNavigation;
            setSelectedCountry(mainCountry);
          } else {
            setSelectedCountry(selectedCountryForNavigation);
          }
        }, 500);
      } else {
        console.warn(
          `無法找到國家 ${selectedCountryForNavigation.name} (${selectedCountryForNavigation.code}) 的座標`
        );
      }
    }
  }, [selectedCountryForNavigation, markedCountries]);

  const handleCountryClick = (geo) => {
    const country = findCountry(geo);
    if (country) {
      // If it's part of a group, find the main country (China)
      if (country.group) {
        const mainCountry =
          markedCountries.find(
            (c) => c.code === "CHN" && c.group === country.group
          ) || country;
        setSelectedCountry(mainCountry);
      } else {
        setSelectedCountry(country);
      }
    } else {
      // Clicked on unmarked country or empty area, close modal
      setSelectedCountry(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedCountry(null);
  };

  return (
    <div
      className="world-map-container"
      onClick={(e) => {
        // Close modal if clicking on the map container background (not on a country)
        if (
          e.target === e.currentTarget ||
          e.target.classList.contains("rsm-svg") ||
          e.target.tagName === "svg"
        ) {
          setSelectedCountry(null);
        }
      }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 147,
          center: [0, 20],
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isMarked = isMarkedCountry(geo);
                const countryColor = getCountryColor(geo);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={countryColor}
                    stroke="#ffffff"
                    strokeWidth={0.2}
                    style={{
                      default: {
                        outline: "none",
                        cursor: isMarked ? "pointer" : "default",
                        transition: "all 0.2s ease",
                      },
                      hover: {
                        fill: isMarked
                          ? darkenColor(countryColor, 20)
                          : "#b0b0b0",
                        stroke: "#ffffff",
                        strokeWidth: 0.2,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        outline: "none",
                      },
                    }}
                    onMouseEnter={(event) => handleMouseEnter(geo, event)}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCountryClick(geo);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {tooltip.show && (
        <div
          className="tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          {tooltip.content}
        </div>
      )}
      <div className="map-controls">
        <button
          onClick={() => setPosition({ coordinates: [0, 0], zoom: 1 })}
          className="reset-button"
        >
          Reset View
        </button>
      </div>
      {selectedCountry && (
        <div className="modal-content">
          <button className="modal-close" onClick={handleCloseModal}>
            ×
          </button>
          <h2>{selectedCountry.name}</h2>
          <p className="country-description">
            {selectedCountry.description ||
              countryInfo[selectedCountry.code] ||
              "No information available."}
          </p>
        </div>
      )}
    </div>
  );
};

export default WorldMap;
