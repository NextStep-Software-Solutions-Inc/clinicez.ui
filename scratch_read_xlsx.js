const xlsx = require('xlsx');
const workbook = xlsx.readFile('C:\\Users\\wacan\\Downloads\\_Konsulta Development Kit v1.1-20260427T031038Z-3-001\\_Konsulta Development Kit v1.1\\LIBRARIES\\lib_diagnostic.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data, null, 2));
