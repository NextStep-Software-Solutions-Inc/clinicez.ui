export const handlePrintHtmlToPDF = async (html: string = "") => {

  // print html content
  const printWindow = window.open("", "_blank");
  printWindow?.document.write(html);
  printWindow?.document.close();
  printWindow?.print();
}