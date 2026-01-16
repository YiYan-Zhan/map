# 世界地圖標註網站

一個使用 React 和 react-simple-maps 構建的世界地圖網站，可以標註和顯示特定國家。

## 功能特點

- 🌍 互動式世界地圖
- 🎨 自定義國家顏色標註
- 🔍 可縮放和拖動地圖
- 💡 懸停顯示國家名稱
- 📱 響應式設計

## 安裝

```bash
npm install
```

## 運行

```bash
npm run dev
```

然後在瀏覽器中打開顯示的本地地址（通常是 http://localhost:5173）

## 自定義標註國家

在 `src/App.jsx` 文件中修改 `markedCountries` 數組來添加或修改要標註的國家：

```javascript
const markedCountries = [
  { code: 'TWN', name: '台灣', color: '#ff6b6b' },
  { code: 'USA', name: '美國', color: '#4ecdc4' },
  // 添加更多國家...
]
```

國家代碼使用 ISO 3166-1 alpha-3 格式（三個字母的大寫代碼）。

## 構建

```bash
npm run build
```

構建的文件將在 `dist` 目錄中。

## 部署到 GitHub Pages

本項目已配置 GitHub Actions 自動部署到 GitHub Pages。

詳細部署說明請參考 [DEPLOY.md](./DEPLOY.md)。

### 快速開始

1. 啟用 GitHub Pages：
   - 前往倉庫 Settings > Pages
   - Source 選擇 "GitHub Actions"

2. 推送代碼到 `main` 分支：
   ```bash
   git push origin main
   ```

3. 查看部署狀態：
   - 前往 Actions 標籤頁查看工作流運行狀態
   - 部署完成後訪問：`https://<username>.github.io/<repository-name>/`

### 配置 Google Sheets（可選）

如果需要使用 Google Sheets 功能，請在 GitHub Secrets 中設置環境變量。詳見 [DEPLOY.md](./DEPLOY.md) 和 [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)。
