import axios from "axios";
import ExcelJS from "exceljs";

async function generateCountryExcel() {
  const url = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

  try {
    console.log("正在從數據源下載國家清單...");
    const response = await axios.get(url);
    const worldData = response.data;

    // 提取國家名稱（路徑：objects.countries.geometries）
    const countries = worldData.objects.countries.geometries.map((g) => {
      return {
        name: g.properties.name,
        remark: "", // 預留備註欄位
      };
    });

    // 依照名稱排序，方便編輯者查找
    countries.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`成功提取 ${countries.length} 個國家/地區。`);

    // 建立 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("World Countries");

    // 設定標題列
    worksheet.columns = [
      { header: "Country Name", key: "name", width: 30 },
      { header: "Remark", key: "remark", width: 50 },
    ];

    // 加上美化樣式（標題加粗）
    worksheet.getRow(1).font = { bold: true };

    // 加入數據
    worksheet.addRows(countries);

    // 儲存檔案
    const fileName = "world_countries_list.xlsx";
    await workbook.xlsx.writeFile(fileName);

    console.log("-----------------------------------------");
    console.log(`✅ 成功！檔案已生成：${fileName}`);

    console.log("-----------------------------------------");
  } catch (error) {
    console.error("執行失敗:", error.message);
  }
}

generateCountryExcel();
