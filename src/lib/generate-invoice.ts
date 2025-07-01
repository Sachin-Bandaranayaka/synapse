import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface InvoiceData {
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    amount: number;
    referenceNumber: string;
    productName: string;
    productCode: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Add logo placeholder (gray rectangle)
    doc.setFillColor(220, 220, 220);
    doc.rect(20, 20, 40, 40, 'F');

    // Company name and title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('J-nex Holdings', 70, 35);

    // Invoice details
    doc.setFontSize(12);
    doc.text(`Invoice #: ${data.referenceNumber}`, 20, 80);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 90);

    // From section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('From:', 20, 110);
    doc.setFont('helvetica', 'normal');
    doc.text('J-nex Holdings, 178/3B Vihara mawatha', 20, 120);
    doc.text('warapitiya', 20, 130);
    doc.text('0761966185', 20, 140);

    // To section
    doc.setFont('helvetica', 'bold');
    doc.text(data.customerName, 120, 110);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customerAddress, 120, 120);
    doc.text(data.customerPhone, 120, 130);

    // Product details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Product Details', 20, 170);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.productName} (${data.productCode})`, 20, 180);
    doc.text(`Price: LKR ${data.amount.toFixed(2)}`, 20, 190);

    // Generate QR code
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data.referenceNumber);
        // Remove the data URL prefix to get just the base64 data
        const qrImageData = qrCodeDataUrl.split(',')[1];
        doc.addImage(qrImageData, 'PNG', 140, 20, 40, 40);
    } catch (error) {
        console.error('Failed to generate QR code:', error);
    }

    // Return instructions
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Return Instructions', 140, 65);
    doc.setFont('helvetica', 'normal');
    doc.text('Scan QR code to process return', 140, 75);

    // Convert to Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
} 