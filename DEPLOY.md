# GitHub Pages 部署指南

本項目使用 GitHub Actions 自動部署到 GitHub Pages。

## 部署機制說明

本項目使用 **GitHub Actions 方式**部署（不創建 `gh-pages` 分支）：

### 工作流流程

1. **構建階段 (build job)**：
   - Checkout 代碼
   - 設置 Node.js 20 環境
   - 安裝依賴 (`npm ci`)
   - 自動設置 base path（根據倉庫名稱）
   - 構建項目 (`npm run build`)，生成 `dist` 目錄
   - 配置 Pages 環境
   - 上傳構建產物為 artifact

2. **部署階段 (deploy job)**：
   - 等待構建完成
   - 將 artifact 直接部署到 GitHub Pages 服務器

3. **不創建分支**：不會在倉庫中創建 `gh-pages` 或其他部署分支，保持倉庫乾淨

**優點**：
- 倉庫中不會有構建產物的提交歷史
- 部署過程更安全（使用 GitHub Pages environment）
- 構建和部署完全自動化
- 支持並發控制（同一時間只允許一個部署）

## 設置步驟

### 1. 啟用 GitHub Pages

1. 前往您的 GitHub 倉庫
2. 點擊 **Settings** > **Pages**
3. 在 **Source** 部分，選擇 **GitHub Actions**

### 2. 配置 GitHub Secrets（可選）

如果您需要使用 Google Sheets 功能，需要在 GitHub Secrets 中設置環境變量：

1. 前往 **Settings** > **Secrets and variables** > **Actions**
2. 點擊 **New repository secret**
3. 添加以下 secrets（根據需要）：

```
VITE_BASE_PATH              # 可選：如果使用自定義域名，設置為 '/'
VITE_ENABLE_GOOGLE_SHEETS   # 例如：'true'
VITE_GOOGLE_SHEETS_ID       # 您的 Google Sheets ID
VITE_GOOGLE_SHEETS_NAME     # 例如：'Sheet1'
VITE_GOOGLE_APPS_SCRIPT_URL # Google Apps Script URL（推薦方法）
VITE_GOOGLE_SHEETS_API_KEY  # Google Sheets API Key（如果使用方法三）
```

### 3. 推送代碼

將代碼推送到 `main` 分支：

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 4. 查看部署狀態

1. 前往 **Actions** 標籤頁
2. 查看工作流運行狀態
   - 工作流包含兩個 job：`build`（構建）和 `deploy`（部署）
   - 等待兩個 job 都完成（顯示綠色 ✓）
3. 部署完成後，訪問 `https://<username>.github.io/<repository-name>/`

**注意**：首次部署可能需要幾分鐘時間，GitHub 需要設置 Pages 環境。

## Base Path 配置

### 自動設置（推薦）

工作流會自動根據倉庫名稱設置 base path。例如：

- 倉庫名稱：`map` → base path：`/map/`
- 訪問地址：`https://username.github.io/map/`

### 手動設置

如果使用自定義域名，在 GitHub Secrets 中設置 `VITE_BASE_PATH` 為 `/`。

## 觸發條件

部署會在以下情況自動觸發：

- 推送到 `main` 分支
- 手動觸發（在 Actions 頁面點擊 "Run workflow"）

## 故障排除

### 部署失敗

1. 檢查 **Actions** 標籤頁中的錯誤信息
2. 確認 Node.js 版本兼容（工作流使用 Node 20）
3. 檢查構建日誌中的錯誤
4. 確認工作流權限正確（需要 `pages: write` 和 `id-token: write`）
5. 如果有多個部署同時進行，工作流會等待前一個完成（concurrency 控制）

### 頁面無法訪問

1. 確認 GitHub Pages 已啟用（Settings > Pages）
2. 確認 **Source** 選擇的是 **GitHub Actions**（不是 "Deploy from a branch"）
3. 檢查 base path 是否正確
4. 確認倉庫是公開的（或已設置 Pages 權限）
5. 等待幾分鐘，首次部署可能需要一些時間

### 環境變量未生效

1. 確認 Secrets 名稱正確（必須以 `VITE_` 開頭）
2. 檢查 Secrets 是否已設置
3. 重新觸發部署工作流

## 注意事項

⚠️ **安全提示**：

- GitHub Pages 是靜態託管，環境變量會在構建時注入到代碼中
- 這些值會被打包到構建產物中，任何人都可以查看
- **不要**在 Secrets 中存儲敏感信息（如 API Keys）
- 如果必須使用 API Key，建議使用 Google Apps Script 方法（方法一），這樣 API Key 不會暴露在前端代碼中

## 自定義域名（可選）

如果您有自定義域名：

1. 在 GitHub Secrets 中設置 `VITE_BASE_PATH` 為 `/`
2. 在倉庫 Settings > Pages 中設置自定義域名
3. 按照 GitHub 的指示配置 DNS 記錄
