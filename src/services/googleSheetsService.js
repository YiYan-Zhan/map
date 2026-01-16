/**
 * Google Sheets 數據服務
 * 從 Google Sheets 讀取國家數據
 * 適配格式：Column A = Country/Region, Column B = Remark
 */

import { getCountryCodeFromName } from "../utils/countryNameToCode.js";

// 統一的默認顏色（所有國家使用相同顏色，使用綠色系而非藍色系）
const DEFAULT_COLOR = "#10b981";

/**
 * 從公開的 Google Sheets 讀取數據
 * @param {string} sheetId - Google Sheets ID
 * @param {string} sheetName - 工作表名稱（默認 'Sheet1'）
 * @returns {Promise<Array>} 國家數據數組
 */
export const fetchCountriesFromGoogleSheets = async (
  sheetId,
  sheetName = "Sheet1"
) => {
  try {
    // 方法1: 使用 Google Sheets API v4 (需要 API Key)
    // const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
    // const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`;
    
    // 方法2: 使用公開的 CSV 格式（不需要 API Key，但需要將 Sheet 設為公開）
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    return parseCSVToCountries(csvText);
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    throw error;
  }
};

/**
 * 從 Google Apps Script Web App 讀取數據（推薦方法）
 * 只返回有 remark 內容的國家
 * @param {string} scriptUrl - Google Apps Script Web App URL
 * @returns {Promise<Array>} 國家數據數組（只包含有 remark 的國家）
 */
export const fetchCountriesFromAppsScript = async (scriptUrl) => {
  try {
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const countries = data.countries || [];
    
    // 過濾：只返回有 description (remark) 的國家，並確保保留換行符
    return countries
      .filter((country) => {
        const remark = country.description || country.remark || "";
        return remark.trim().length > 0;
      })
      .map((country) => {
        // 確保 description 保留換行符
        if (country.description) {
          country.description = country.description.replace(/^\s+|\s+$/g, "");
        } else if (country.remark) {
          country.description = country.remark.replace(/^\s+|\s+$/g, "");
          delete country.remark;
        }
        return country;
      });
  } catch (error) {
    console.error("Error fetching data from Apps Script:", error);
    throw error;
  }
};

/**
 * 解析 CSV 文本為國家數據數組
 * 格式：Column A = Country/Region, Column B = Remark
 * 只返回有 remark 內容的國家
 * 支持引號內的換行符
 * @param {string} csvText - CSV 文本
 * @returns {Array} 國家數據數組（只包含有 remark 的國家）
 */
const parseCSVToCountries = (csvText) => {
  const countries = [];
  const rows = parseCSV(csvText);
  
  // 跳過標題行（第一行：Country / Region, Remark）
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // 格式：Column A = Country/Region, Column B = Remark
    const countryName = row[0]?.trim() || "";
    // 保留 remark 中的換行符，只去除首尾空白
    const remark = row[1] ? row[1].replace(/^\s+|\s+$/g, "") : "";
    
    // 只處理有國家名稱且 remark 有內容的行
    if (countryName && remark) {
      // 從國家名稱推斷 ISO 代碼
      const code = getCountryCodeFromName(countryName);
      
      // 如果找不到 ISO 代碼，使用名稱的前三個字母大寫作為臨時代碼
      const countryCode = code || countryName.substring(0, 3).toUpperCase().padEnd(3, "X");
      
      const country = {
        code: countryCode,
        name: countryName,
        color: DEFAULT_COLOR, // 統一顏色
        description: remark, // Remark 作為描述（保留換行符）
      };
      
      countries.push(country);
    }
  }
  
  return countries;
};

/**
 * 解析 CSV 文本（處理引號內的逗號和換行符）
 * @param {string} csvText - CSV 文本
 * @returns {Array<Array<string>>} 行數組，每行是值數組
 */
const parseCSV = (csvText) => {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 處理雙引號轉義（"" 表示一個引號）
        currentValue += '"';
        i++; // 跳過下一個引號
      } else {
        // 切換引號狀態
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // 字段分隔符
      currentRow.push(currentValue);
      currentValue = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      // 行分隔符（不在引號內）
      if (char === "\r" && nextChar === "\n") {
        i++; // 跳過 \r\n 中的 \n
      }
      if (currentValue || currentRow.length > 0) {
        currentRow.push(currentValue);
        rows.push(currentRow);
        currentRow = [];
        currentValue = "";
      }
    } else {
      // 普通字符（包括引號內的換行符）
      currentValue += char;
    }
  }
  
  // 處理最後一行
  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }
  
  return rows;
};

/**
 * 使用 Google Sheets API v4 讀取數據（需要 API Key）
 * 只返回有 remark 內容的國家
 * @param {string} sheetId - Google Sheets ID
 * @param {string} apiKey - Google Sheets API Key
 * @param {string} range - 範圍（例如 'Sheet1!A2:E'）
 * @returns {Promise<Array>} 國家數據數組（只包含有 remark 的國家）
 */
export const fetchCountriesFromSheetsAPI = async (
  sheetId,
  apiKey,
  range = "Sheet1!A2:B"
) => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    return rows
      .map((row) => {
        const countryName = row[0]?.trim() || "";
        // 保留 remark 中的換行符，只去除首尾空白
        const remark = row[1] ? row[1].replace(/^\s+|\s+$/g, "") : "";
        
        // 只返回有國家名稱且 remark 有內容的國家
        if (!countryName || !remark) return null;
        
        // 從國家名稱推斷 ISO 代碼
        const code = getCountryCodeFromName(countryName);
        const countryCode = code || countryName.substring(0, 3).toUpperCase().padEnd(3, "X");
        
        return {
          code: countryCode,
          name: countryName,
          color: DEFAULT_COLOR, // 統一顏色
          description: remark, // 保留換行符
        };
      })
      .filter((country) => country !== null);
  } catch (error) {
    console.error("Error fetching data from Sheets API:", error);
    throw error;
  }
};
