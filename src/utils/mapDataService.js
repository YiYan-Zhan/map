/**
 * 地圖數據服務
 * 從 TopoJSON 數據源提取國家信息和計算座標
 */

import { feature } from "topojson-client";
import { geoCentroid } from "d3-geo";

/**
 * 從 TopoJSON URL 加載並提取國家信息
 * @param {string} geoUrl - TopoJSON 數據源 URL
 * @returns {Promise<Array>} 國家數據數組，包含 name, code, coordinates
 */
export const fetchCountriesFromMapData = async (geoUrl) => {
  try {
    const response = await fetch(geoUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const topojson = await response.json();
    
    // 轉換 TopoJSON 為 GeoJSON
    const geojson = feature(topojson, topojson.objects.countries);
    
    // 提取國家信息
    const countries = geojson.features.map((feature) => {
      const props = feature.properties || {};
      
      // 獲取國家名稱
      const name = props.name || props.NAME || props.NAME_LONG || props.ADMIN || "Unknown";
      
      // 獲取 ISO 代碼（優先順序：ISO_A3 > ISO_A3_EH > ADM0_A3 > ISO_A2）
      const code = props.ISO_A3 || props.ISO_A3_EH || props.ADM0_A3 || props.ISO_A2 || null;
      
      // 計算 centroid（中心座標）
      let coordinates = null;
      try {
        coordinates = geoCentroid(feature);
      } catch (error) {
        console.warn(`無法計算 ${name} 的座標:`, error);
        // 如果計算失敗，嘗試使用 bounding box 的中心
        const bbox = feature.bbox;
        if (bbox && bbox.length >= 4) {
          coordinates = [
            (bbox[0] + bbox[2]) / 2, // 經度
            (bbox[1] + bbox[3]) / 2, // 緯度
          ];
        }
      }
      
      return {
        code: code ? code.toUpperCase() : null,
        name: name,
        coordinates: coordinates, // [longitude, latitude]
        // 保存原始屬性以便後續匹配
        properties: props,
      };
    });

    return countries;
  } catch (error) {
    console.error("Error fetching countries from map data:", error);
    throw error;
  }
};

/**
 * 通過國家名稱匹配地圖數據和 Google Sheet 數據
 * @param {Array} mapCountries - 從地圖數據提取的國家數組
 * @param {Array} sheetCountries - 從 Google Sheet 提取的國家數組
 * @returns {Array} 匹配後的國家數組，包含地圖座標和 Sheet 的 remark
 */
export const matchCountriesWithSheet = (mapCountries, sheetCountries) => {
  const matchedCountries = [];
  
  // 創建地圖國家索引（通過名稱和代碼）
  const mapIndexByName = new Map();
  const mapIndexByCode = new Map();
  
  mapCountries.forEach((country) => {
    if (country.name) {
      const nameKey = country.name.toLowerCase().trim();
      if (!mapIndexByName.has(nameKey)) {
        mapIndexByName.set(nameKey, []);
      }
      mapIndexByName.get(nameKey).push(country);
    }
    if (country.code) {
      const codeKey = country.code.toUpperCase();
      if (!mapIndexByCode.has(codeKey)) {
        mapIndexByCode.set(codeKey, []);
      }
      mapIndexByCode.get(codeKey).push(country);
    }
  });
  
  // 匹配 Sheet 中的國家
  sheetCountries.forEach((sheetCountry) => {
    const sheetName = sheetCountry.name.toLowerCase().trim();
    const sheetCode = sheetCountry.code?.toUpperCase();
    
    let matchedMapCountry = null;
    
    // 優先通過代碼匹配
    if (sheetCode && mapIndexByCode.has(sheetCode)) {
      const candidates = mapIndexByCode.get(sheetCode);
      // 如果有多個候選，優先選擇名稱最接近的
      matchedMapCountry = candidates.find(c => 
        c.name.toLowerCase().trim() === sheetName
      ) || candidates[0];
    }
    
    // 如果代碼匹配失敗，通過精確名稱匹配
    if (!matchedMapCountry && mapIndexByName.has(sheetName)) {
      const candidates = mapIndexByName.get(sheetName);
      matchedMapCountry = candidates[0];
    }
    
    // 如果精確匹配失敗，嘗試部分匹配（名稱包含關係）
    if (!matchedMapCountry) {
      for (const [mapName, candidates] of mapIndexByName.entries()) {
        if (
          mapName.includes(sheetName) ||
          sheetName.includes(mapName) ||
          mapName.replace(/\s+/g, "") === sheetName.replace(/\s+/g, "")
        ) {
          matchedMapCountry = candidates[0];
          break;
        }
      }
    }
    
    // 如果找到匹配的地圖數據，合併信息
    if (matchedMapCountry) {
      matchedCountries.push({
        code: sheetCountry.code || matchedMapCountry.code,
        name: sheetCountry.name,
        color: sheetCountry.color || "#10b981",
        description: sheetCountry.description || "", // remark
        coordinates: matchedMapCountry.coordinates, // 從地圖數據獲取的座標
      });
    } else {
      console.warn(`無法匹配國家: ${sheetCountry.name} (${sheetCountry.code})`);
    }
  });
  
  return matchedCountries;
};
