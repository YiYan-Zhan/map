# Google Sheets 後端設置指南

本指南將幫助您設置 Google Sheets 作為世界地圖應用的數據源。

## 方法一：使用 Google Apps Script Web App（推薦）

這是最靈活且安全的方法，不需要公開您的 Google Sheets。

### 步驟 1: 創建 Google Sheets

1. 創建一個新的 Google Sheets
2. 在第一行添加標題：
   ```
   Country / Region | Remark
   ```
3. 從第二行開始添加國家數據，例如：
   ```
   Afghanistan |
   Albania |
   Algeria |
   China |
   Japan |
   United States |
   ```
   - **Column A (Country / Region)**: 國家或地區名稱（必填）
   - **Column B (Remark)**: 備註（可選，可用於國家描述）

### 步驟 2: 創建 Google Apps Script

1. 在 Google Sheets 中，點擊 **擴充功能** > **Apps Script**
2. 刪除默認代碼，粘貼以下代碼：

```javascript
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // 統一的默認顏色（綠色系）
  const DEFAULT_COLOR = "#10b981";

  // 國家名稱到 ISO 代碼的簡單映射（常用國家）
  const nameToCode = {
    china: "CHN",
    "united states": "USA",
    japan: "JPN",
    "south korea": "KOR",
    "united kingdom": "GBR",
    france: "FRA",
    germany: "DEU",
    // 可以添加更多映射...
  };

  // 從國家名稱推斷 ISO 代碼的函數
  function getCountryCode(name) {
    const nameLower = name.toLowerCase().trim();
    // 直接匹配
    if (nameToCode[nameLower]) {
      return nameToCode[nameLower];
    }
    // 部分匹配
    for (const [key, code] of Object.entries(nameToCode)) {
      if (nameLower.includes(key) || key.includes(nameLower)) {
        return code;
      }
    }
    // 如果找不到，使用名稱前三個字母
    return name.substring(0, 3).toUpperCase().padEnd(3, "X");
  }

  // 跳過標題行
  const countries = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const countryName = row[0] ? row[0].toString().trim() : "";
    const remark = row[1] ? row[1].toString().trim() : "";

    // 只處理有國家名稱的行
    if (countryName) {
      countries.push({
        code: getCountryCode(countryName),
        name: countryName,
        color: DEFAULT_COLOR,
        description: remark,
      });
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      countries: countries,
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

3. 點擊 **部署** > **新增部署作業**
4. 選擇類型：**網頁應用程式**
5. 設置：
   - 說明：World Map Data API
   - 執行身份：**我**
   - 具有存取權的使用者：**所有人**
6. 點擊 **部署**
7. 複製 **網頁應用程式網址**

### 步驟 3: 配置環境變數

在項目根目錄創建 `.env` 文件：

```env
VITE_ENABLE_GOOGLE_SHEETS=true
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**注意：** 在 Vite 項目中，環境變數前綴是 `VITE_` 而不是 `REACT_APP_`。

替換 `YOUR_SCRIPT_ID` 為您從步驟 2 獲得的網址。

---

## 方法二：使用公開的 Google Sheets（CSV 格式）

這是最簡單的方法，但需要將 Google Sheets 設為公開。

### 步驟 1: 創建並設置 Google Sheets

1. 創建一個新的 Google Sheets
2. 在第一行添加標題：
   ```
   Country / Region,Remark
   ```
3. 從第二行開始添加國家數據（使用逗號分隔）：
   ```
   Afghanistan,
   Albania,
   Algeria,
   China,
   Japan,
   United States,
   ```
4. 點擊 **檔案** > **共用** > **變更為知道連結的使用者**
5. 選擇 **檢視者**，然後複製連結

### 步驟 2: 獲取 Sheet ID

從 Google Sheets 連結中提取 ID：

```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
```

### 步驟 3: 配置環境變數

在項目根目錄創建 `.env` 文件：

```env
VITE_ENABLE_GOOGLE_SHEETS=true
VITE_GOOGLE_SHEETS_ID=YOUR_SHEET_ID
VITE_GOOGLE_SHEETS_NAME=Sheet1
```

**注意：** 在 Vite 項目中，環境變數前綴是 `VITE_` 而不是 `REACT_APP_`。

---

## 方法三：使用 Google Sheets API v4

這需要 Google Cloud 項目和 API Key。

### 步驟 1: 啟用 Google Sheets API

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新項目或選擇現有項目
3. 啟用 **Google Sheets API**
4. 創建 **API 金鑰**

### 步驟 2: 設置 Google Sheets

按照方法二的步驟 1 創建 Google Sheets。

### 步驟 3: 配置環境變數

在項目根目錄創建 `.env` 文件：

```env
VITE_ENABLE_GOOGLE_SHEETS=true
VITE_GOOGLE_SHEETS_ID=YOUR_SHEET_ID
VITE_GOOGLE_SHEETS_API_KEY=YOUR_API_KEY
```

**注意：** 在 Vite 項目中，環境變數前綴是 `VITE_` 而不是 `REACT_APP_`。

---

## 數據格式說明

Google Sheets 的列格式（簡化版）：

| 列  | 名稱             | 說明                   | 必填 | 示例                   |
| --- | ---------------- | ---------------------- | ---- | ---------------------- |
| A   | Country / Region | 國家或地區名稱（英文） | 是   | China, Japan, Albania  |
| B   | Remark           | 備註/描述（可選）      | 否   | 用於彈窗顯示的介紹文字 |

**注意事項：**

- 系統會自動從國家名稱推斷 ISO 3166-1 alpha-3 代碼
- 所有國家使用統一的默認顏色（`#10b981`，綠色系）
- 如果無法推斷 ISO 代碼，系統會使用國家名稱的前三個字母作為臨時代碼

---

## 測試

1. 確保 `.env` 文件已正確配置
2. 重啟開發服務器：`npm run dev`
3. 檢查瀏覽器控制台是否有錯誤
4. 如果加載失敗，應用會自動使用默認數據

---

## 故障排除

### 問題：無法加載數據

- 檢查 `.env` 文件是否在項目根目錄
- 確認環境變數名稱正確（必須以 `VITE_` 開頭，因為這是 Vite 項目）
- 檢查 Google Sheets 是否設為公開（方法二）
- 檢查 Apps Script 部署設置（方法一）

### 問題：CORS 錯誤

- 方法一（Apps Script）：確保部署時選擇「所有人」
- 方法二（CSV）：確保 Google Sheets 設為公開
- 方法三（API）：檢查 API Key 是否正確

### 問題：數據格式錯誤

- 確保第一行是標題行
- 確保 Code 和 Name 列有數據
- 檢查 CSV 格式是否正確（使用逗號分隔）

---

## 安全建議

1. **不要將 API Key 提交到 Git**：確保 `.env` 在 `.gitignore` 中
2. **限制 API Key 使用**：在 Google Cloud Console 中限制 API Key 只能訪問 Google Sheets API
3. **使用 Apps Script**：方法一最安全，不需要公開 Sheets 或使用 API Key
