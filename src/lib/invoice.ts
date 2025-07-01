import { jsPDF } from 'jspdf';

export interface InvoiceData {
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    amount: number;
    productName: string;
    productCode: string;
    referenceNumber: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Add company logo/header
    doc.setFontSize(20);
    doc.text('J-nex Holdings', pageWidth / 2, margin, { align: 'center' });

    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice #: ${data.referenceNumber}`, margin, margin + 20);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 30);

    // Add customer details
    doc.text('Bill To:', margin, margin + 50);
    doc.text(data.customerName, margin, margin + 60);
    doc.text(data.customerAddress, margin, margin + 70);
    doc.text(`Phone: ${data.customerPhone}`, margin, margin + 80);

    // Add product details
    doc.text('Product Details:', margin, margin + 100);
    doc.text(`Product: ${data.productName} (${data.productCode})`, margin, margin + 110);
    doc.text(`Amount: LKR ${data.amount.toFixed(2)}`, margin, margin + 120);

    // Add total
    doc.setFontSize(14);
    doc.text(`Total Amount: LKR ${data.amount.toFixed(2)}`, pageWidth - margin, margin + 140, { align: 'right' });

    // Add footer
    doc.setFontSize(10);
    doc.text('Thank you for your business!', pageWidth / 2, doc.internal.pageSize.height - margin, { align: 'center' });

    // Convert to Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
} 