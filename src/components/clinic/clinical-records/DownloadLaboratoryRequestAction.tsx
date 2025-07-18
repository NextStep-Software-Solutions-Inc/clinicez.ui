"use client";

import { Button } from "@components/ui/button";
import { Download } from "lucide-react";
import { promiseWrapper } from "@/lib/with-error-handling";
import { toast } from "sonner";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";

interface DownloadLaboratoryRequestActionProps {
  laboratoryRequestId: number;
}

export default function DownloadLaboratoryRequestAction({
  laboratoryRequestId,
}: DownloadLaboratoryRequestActionProps) {
  const handleDownload = async () => {
    try {
      toast.loading("Generating laboratory request PDF...");

      const response = await fetch(`/api/laboratory-requests/${laboratoryRequestId}/download`);

      if (!response.ok) {
        throw new Error("Failed to fetch laboratory request data");
      }

      const data = await response.json();

      // HTML template for laboratory request
      const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>USTP Laboratory Diagnostics</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
    }
    .certificate-container {
      width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      position: relative;
    }
    .header-content {
      display: inline-block;
      text-align: center;
    }
    .university-name {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .university-logo {
      position: absolute;
      right: 0;
      top: 0;
      width: 60px;
      height: 60px;
    }
    .university-address {
      font-size: 10pt;
      margin-bottom: 3px;
    }
    .contact-info {
      font-size: 10pt;
      margin-bottom: 15px;
    }
    .patient-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px 20px;
      margin-bottom: 20px;
      font-size: 11pt;
    }
    .patient-info-item {
      display: flex;
      gap: 5px;
    }
    .patient-info-label {
      font-weight: bold;
      white-space: nowrap;
    }
    .line-separator {
      border: none;
      border-top: 1px solid #ccc;
      margin: 25px 0;
    }
    .section-header {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 20px;
      text-decoration: underline;
    }
    .laboratory-category {
      margin-bottom: 15px;
    }
    .category-title {
      font-weight: bold;
      margin-bottom: 5px;
      text-decoration: underline;
    }
    .test-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px 15px;
      margin-left: 15px;
    }
    .test-item-checkbox {
      display: flex;
      align-items: center;
      font-size: 10pt;
    }
    .checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #000;
      margin-right: 5px;
      vertical-align: middle;
      position: relative;
      background: white;
      flex-shrink: 0;
    }
    .checkbox.checked::after {
      content: "✓";
      position: absolute;
      top: -2px;
      left: 1px;
      font-size: 10px;
      font-weight: bold;
      color: #000;
      line-height: 12px;
      z-index: 1;
    }
    .impression-section {
      margin-top: 20px;
      margin-bottom: 20px;
    }
    .impression-label {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .impression-content {
      border: 1px solid #eee;
      padding: 8px;
      min-height: 50px;
      background-color: #f9f9f9;
    }
    .doctor-info {
      margin: 20px 0;
      text-align: right;
    }
    .doctor-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .doctor-details {
      font-size: 10pt;
      margin-bottom: 3px;
    }
    .auto-generated {
      margin-top: 30px;
      font-size: 9pt;
      color: #666;
      text-align: right;
    }
    @media print {
      body {
        margin: 0;
        padding: 0.3in;
      }
      .certificate-container {
        page-break-inside: avoid;
      }
      .test-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="header">
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2D3DLCdheSiTlUMIHP9O5e7OC9nBxKg3qoQ&s" alt="USTP Logo" class="university-logo">
      <div class="header-content">
        <div class="university-name">University of Science and Technology of Southern Philippines</div>
        <div class="university-address">C.M Recto Avenue, Lapasan, Cagayan de Oro City 9000 Philippines</div>
        <div class="contact-info">Tel. No. +63 (88) 856 1738; Telefax +63 (88) 856 4696</div>
      </div>
    </div>

    <!-- Patient Information Section -->
    <div class="patient-info-grid">
      <div class="patient-info-item">
        <span class="patient-info-label">Name:</span> <span>${data.patientName}</span>
      </div>
      <div class="patient-info-item">
        <span class="patient-info-label">Age:</span> <span>${data.age}</span>
      </div>
      <div class="patient-info-item">
        <span class="patient-info-label">Gender:</span> <span>${data.gender}</span>
      </div>
      <div class="patient-info-item">
        <span class="patient-info-label">Address:</span> <span>${data.address}</span>
      </div>
      <div class="patient-info-item">
        <span class="patient-info-label">Birthdate:</span> <span>${data.birthdate}</span>
      </div>
      <div class="patient-info-item">
        <span class="patient-info-label">Request Date:</span> <span>${data.requestDate}</span>
      </div>
    </div>

    <hr class="line-separator" />

    <!-- Laboratories Section -->
    <div class="laboratory-section">
      <div class="section-header">LABORATORIES</div>

      <div class="laboratory-category">
        <div class="category-title">HEMATOLOGY</div>
        <div class="test-grid">
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>CBC with Platelet</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Bloodtyping</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Total Iron Binding Capacity</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Serum Iron</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Serum Ferritin</span>
          </div>
        </div>
      </div>

      <div class="laboratory-category">
        <div class="category-title">CLINICAL MICROSCOPY</div>
        <div class="test-grid">
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Urinalysis</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Fecalysis</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Fecal Occult Blood Testing</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>H. pylori antigen test or Urea breath test</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Rapid Antigen Test</span>
          </div>
        </div>
      </div>

      <div class="laboratory-category">
        <div class="category-title">BLOOD CHEMISTRY</div>
        <div class="test-grid">
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>FBS</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Hemoglucose Test (HGT)</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Lipid Profile</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>HbA1c</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Creatinine</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>BUN</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Uric Acid</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>HBsAg</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>HAV</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Anti-HCV</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>SGOT</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>SGPT</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Total bilirubin</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Direct Bilirubin</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Indirect Bilirubin</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Albumin</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Alkaline phosphatase</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Amylase</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>LDH</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>ESR</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>CRP</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Procalcitonin</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Sodium</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Potassium</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Calcium</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Magnesium</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Chloride</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>CA-125</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>CA19-9</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>B-HCG</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>CEA</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Alpha Fetoprotein</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Typhidot</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Anti-HBe</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Anti-HBc</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>HbsAg</span>
          </div>
        </div>
      </div>

      <div class="laboratory-category">
        <div class="category-title">MICROBIOLOGY</div>
        <div class="test-grid">
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Urine GS/CS</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Blood GS/CS</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Sputum AFB</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Sputum GenXpert</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>RT-PCR Nasopharyngeal Swab</span>
          </div>
        </div>
      </div>

      <div class="laboratory-category">
        <div class="category-title">HORMONE ASSAYS</div>
        <div class="test-grid">
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>TSH</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Free T3</span>
          </div>
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>Free T4</span>
          </div>
        </div>
      </div>

      <div class="laboratory-category">
        <div class="category-title">Cardiac Diagnostics</div>
        <div class="test-grid">
          <div class="test-item-checkbox">
            <span class="checkbox"></span><span>12 lead ECG</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Impression Section -->
    <div class="impression-section">
      <div class="impression-label">Impression:</div>
      <div class="impression-content">${data.impression || ''}</div>
    </div>

    <!-- Doctor Info and Auto-generated Disclaimer -->
    <div class="doctor-info">
      <div class="doctor-name">${data.doctorName}</div>
      <div class="doctor-details">License no: ${data.licenseNo}</div>
      <div class="doctor-details">PTR no: ${data.ptrNo || ''}</div>
      <div class="doctor-details">Address: ${data.doctorAddress}</div>
    </div>
    <div class="auto-generated">
      This certificate is auto-generated by the system. Any information changed manually or electronically, prescriber or creator will not be liable. Generated on: ${data.createdDateTime}
    </div>
  </div>
</body>
</html>`;

      // Generate PDF
      await handlePrintHtmlToPDF(htmlTemplate);
      toast.dismiss();
      toast.success("Laboratory request downloaded successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Download error:", error);
      toast.error("Failed to download laboratory request");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Download
    </Button>
  );
}
