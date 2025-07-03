'use client';

import { useRef } from 'react';
import Barcode from 'react-barcode';

interface InvoiceTemplateProps {
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    amount: number;
    referenceNumber: string;
}

export function InvoiceTemplate({
    customerName,
    customerAddress,
    customerPhone,
    amount,
    referenceNumber,
}: InvoiceTemplateProps) {
    const companyInfo = {
        name: 'J-nex Holdings',
        address: '178/3B Vihara mawatha, warapitiya',
        phone: '0761966185',
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-gray-800">
            <div className="flex justify-between">
                {/* Left side - Company Info and Barcode */}
                <div className="w-1/2">
                    <div className="mb-4">
                        <h2 className="font-bold text-lg">{companyInfo.name}</h2>
                        <p className="text-gray-400">{companyInfo.address}</p>
                        <p className="text-gray-400">{companyInfo.phone}</p>
                    </div>
                    <div className="mt-4">
                        <Barcode
                            value={referenceNumber}
                            width={1.5}
                            height={50}
                            fontSize={12}
                        />
                    </div>
                </div>

                {/* Right side - Customer Info */}
                <div className="w-1/2 text-right">
                    <div className="mb-4">
                        <h3 className="font-semibold">{customerName}</h3>
                        <p className="text-gray-400">{customerAddress}</p>
                        <p className="text-gray-400">{customerPhone}</p>
                    </div>
                    <div className="mt-8">
                        <p className="text-lg font-bold">Total Amount: Rs. {amount.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
} 