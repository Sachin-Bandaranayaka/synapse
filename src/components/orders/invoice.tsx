'use client';

import { format } from 'date-fns';
import Barcode from 'react-barcode';
import { InvoicePrintButton } from './invoice-print-button';

interface Product {
    name: string;
    price: number;
}

interface Order {
    id: string;
    createdAt: Date;
    customerName: string;
    customerPhone: string;
    customerSecondPhone?: string;
    customerAddress: string;
    product: Product;
    quantity: number;
    discount: number;
    notes?: string;
    shippingProvider?: string | null;
    trackingNumber?: string | null;
    invoicePrinted?: boolean;
}

interface InvoiceProps {
    order: Order;
    isMultiPrint?: boolean;
    showPrintControls?: boolean;
    invoiceNumber?: number;
    totalInvoices?: number;
}

export function Invoice({
    order,
    isMultiPrint = false,
    showPrintControls = false,
    invoiceNumber,
    totalInvoices
}: InvoiceProps) {
    const companyInfo = {
        name: 'J-nex Holdings',
        address: 'Dehiatttakandiya town',
        phone: '0762559279',
    };

    // Calculate subtotal (before discount)
    const subtotal = order.product.price * order.quantity;

    // Apply the discount
    const discount = order.discount || 0;

    // Calculate final total
    const total = Math.max(0, subtotal - discount);

    const commonInvoice = (
        <div className="w-full px-2 bg-gray-800 text-white">
            {/* Header with From and To addresses side by side */}
            <div className="flex justify-between mb-2">
                {/* From address (left side) */}
                <div className="text-left">
                    <h1 className={`${isMultiPrint ? 'text-[9pt]' : 'text-[12pt]'} font-bold leading-tight text-white`}>{companyInfo.name}</h1>
                    <div className={`${isMultiPrint ? 'text-[6.5pt]' : 'text-[8pt]'} text-gray-400 leading-tight`}>
                        <p>{companyInfo.address}</p>
                        <p>Tel: {companyInfo.phone}</p>
                    </div>
                    <div className={`${isMultiPrint ? 'text-[6.5pt]' : 'text-[8pt]'} leading-tight mt-1`}>
                        <p>Invoice #: {order.id}</p>
                    </div>
                </div>

                {/* To address (right side) */}
                <div className="text-right">
                    {/* Display invoice number when in batch print mode */}
                    {isMultiPrint && invoiceNumber !== undefined && (
                        <div className="mb-1">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-black font-bold text-[10pt]">
                                {invoiceNumber}
                            </span>
                        </div>
                    )}
                    <div className={`${isMultiPrint ? 'text-[7.5pt]' : 'text-[10pt]'} leading-tight`}>
                        <p>To: <span className="font-bold">{order.customerName}</span></p>
                        <p className="font-bold">{order.customerAddress}</p>
                        <p>Tel: <span className="font-bold">{order.customerPhone}</span></p>
                        {order.customerSecondPhone && (
                            <p>Secondary Tel: <span className="font-bold text-blue-400">{order.customerSecondPhone}</span></p>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Details */}
            <table className={`w-full ${isMultiPrint ? 'text-[6.5pt]' : 'text-[8pt]'} mb-0.5 leading-tight`}>
                <thead>
                    <tr className="border-t border-b border-gray-700">
                        <th className="py-0.5 text-left">Item</th>
                        <th className="py-0.5 text-right">Qty</th>
                        <th className="py-0.5 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-0.5">{order.product.name}</td>
                        <td className="py-0.5 text-right">{order.quantity}</td>
                        <td className="py-0.5 text-right">
                            {new Intl.NumberFormat('en-LK', {
                                style: 'currency',
                                currency: 'LKR'
                            }).format(subtotal)}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    {discount > 0 && (
                        <tr>
                            <td colSpan={2} className="py-0.5 text-right">Discount:</td>
                            <td className="py-0.5 text-right">
                                -{new Intl.NumberFormat('en-LK', {
                                    style: 'currency',
                                    currency: 'LKR'
                                }).format(discount)}
                            </td>
                        </tr>
                    )}
                    <tr className="border-t border-gray-700">
                        <td colSpan={2} className="py-0.5 text-right font-bold">Total:</td>
                        <td className="py-0.5 text-right font-bold">
                            {new Intl.NumberFormat('en-LK', {
                                style: 'currency',
                                currency: 'LKR'
                            }).format(total)}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Shipping Info & Barcode */}
            {order.shippingProvider && order.trackingNumber && (
                <div className="text-left">
                    <p className={`${isMultiPrint ? 'text-[7pt]' : 'text-[8pt]'}`}>
                        {order.shippingProvider.replace('_', ' ')} - {order.trackingNumber}
                    </p>
                    <div className="flex justify-start mt-1">
                        <Barcode
                            value={order.trackingNumber}
                            height={isMultiPrint ? 25 : 40}
                            fontSize={isMultiPrint ? 7 : 8}
                            width={1}
                            margin={0}
                        />
                    </div>
                </div>
            )}

            {/* Notes */}
            {order.notes && (
                <div className="text-left my-1 border-t border-gray-700 pt-1">
                    <p className={`${isMultiPrint ? 'text-[7pt]' : 'text-[8pt]'} font-medium`}>Notes:</p>
                    <p className={`${isMultiPrint ? 'text-[7pt]' : 'text-[8pt]'}`}>{order.notes}</p>
                </div>
            )}

            <p className={`${isMultiPrint ? 'text-[7pt]' : 'text-[8pt]'} mt-1`}>Thank you!</p>
        </div>
    );

    // For multi-print layout
    if (isMultiPrint) {
        return (
            <div className="w-full">
                {commonInvoice}
            </div>
        );
    }

    // For single invoice print
    return (
        <div className="max-w-[80mm] mx-auto p-2 bg-gray-800 text-white">
            {commonInvoice}
            {showPrintControls && !isMultiPrint && (
                <div className="mt-4 print:hidden">
                    <InvoicePrintButton
                        orderId={order.id}
                        isPrinted={order.invoicePrinted || false}
                    />
                </div>
            )}
        </div>
    );
}