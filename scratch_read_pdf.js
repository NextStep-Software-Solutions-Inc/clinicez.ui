const fs = require('fs');
const pdf = require('pdf-parse');

const p1 = 'C:/Users/wacan/Downloads/_Konsulta Development Kit v1.1-20260427T031038Z-3-001/_Konsulta Development Kit v1.1/SSVTF_Annex_C_Konsulta XML Filename Convention.pdf';
const p2 = 'C:/Users/wacan/Downloads/_Konsulta Development Kit v1.1-20260427T031038Z-3-001/_Konsulta Development Kit v1.1/SSVTF_ANNEX_D_Konsulta_Data_Transfer.pdf';

async function main() {
  try {
    console.log('=== ANNEX C ===');
    const d1 = await pdf(fs.readFileSync(p1));
    console.log(d1.text);
    
    console.log('=== ANNEX D ===');
    const d2 = await pdf(fs.readFileSync(p2));
    console.log(d2.text);
  } catch (err) {
    console.error(err);
  }
}
main();
