import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDF(element: HTMLElement, fileName: string): Promise<void> {
  try {
    console.log('Step 1: Starting PDF generation');
    console.log('Element to capture:', element);

    // Create canvas directly from the element
    console.log('Step 2: Creating canvas with html2canvas');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: true, // Enable logging for debugging
      backgroundColor: '#ffffff',
      allowTaint: true,
      foreignObjectRendering: false,
      imageTimeout: 0,
      removeContainer: true
    });

    console.log('Step 3: Canvas created, dimensions:', canvas.width, 'x', canvas.height);

    console.log('Step 4: Converting canvas to image');
    const imgData = canvas.toDataURL('image/png');
    console.log('Step 5: Creating PDF document');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    console.log('Step 6: Adding images to PDF');
    let heightLeft = imgHeight;
    let position = 10; // 10mm top margin

    // Add first page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add additional pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    console.log('Step 7: Saving PDF');
    // Save the PDF
    pdf.save(fileName);
    console.log('Step 8: PDF saved successfully!');
  } catch (error) {
    console.error('❌ Error generating PDF:', error);

    // Provide more specific error message
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
    throw new Error('Failed to generate PDF. Please check console for details.');
  }
}
