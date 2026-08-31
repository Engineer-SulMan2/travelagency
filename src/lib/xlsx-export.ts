import * as XLSX from "xlsx";

export function downloadXlsx(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Reasonable column widths so it doesn't open all-squished in Excel
  worksheet["!cols"] = headers.map((h, i) => {
    const longestCell = rows.reduce((max, row) => Math.max(max, String(row[i] ?? "").length), h.length);
    return { wch: Math.min(Math.max(longestCell + 2, 10), 40) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}