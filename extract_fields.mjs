import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function run() {
  const pdfBytes = fs.readFileSync('public/pdfs/phr/eKAS_ePresS (PC 2024-0013) FILLABLE.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  fields.forEach(field => {
    const type = field.constructor.name;
    const name = field.getName();
    console.log(`${type}: ${name}`);
  });
}

run().catch(console.error);
