'use client'

import React from 'react'
import { ThaiTaxInvoice } from '@/components/ThaiTaxInvoice'
import { Shell } from '@/components/Shell'

export default function InvoiceDemoPage() {
    const dummyInvoice = {
        invoiceNo: 'INV-2026-000452',
        issuedAt: new Date(),
        subtotal: 5500,
        discount: 500,
        serviceCharge: 0,
        vatAmount: 350,
        total: 5350,
        BuyerGuest: {
            name: 'บริษัท เอบีซี ดีไซน์ จำกัด',
            address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
            taxId: '0105560000123',
            branch: 'สำนักงานใหญ่',
            phone: '02-123-4567'
        },
        Stay: {
            ChargeItems: [
                { id: '1', description: 'Standard Room (2 Nights)', qty: 1, unitPrice: 3000, amount: 3000 },
                { id: '2', description: 'Extra Bed', qty: 1, unitPrice: 500, amount: 500 },
                { id: '3', description: 'Minibar', qty: 1, unitPrice: 200, amount: 200 },
                { id: '4', description: 'Laundry', qty: 1, unitPrice: 300, amount: 300 },
                { id: '5', description: 'Early Check-in Fee', qty: 1, unitPrice: 1500, amount: 1500 },
            ]
        },
        Payments: [
            { id: 'p1', method: 'BANK_TRANSFER', amount: 5350, reference: 'KBNK-99812' }
        ]
    }

    const hotelInfo = {
        name: 'Sanrue Boutique Hotel',
        address: '99/1 Moo 5, Thalang, Phuket 83110, Thailand',
        taxId: '0994000123456',
        phone: '076-999-888'
    }

    return (
        <Shell>
            <div className="flex flex-col items-center space-y-4">
                <div className="flex space-x-4 no-print">
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg"
                    >
                        Download / Print (A4)
                    </button>
                </div>

                <div className="bg-white border shadow-2xl overflow-hidden rounded-lg">
                    <ThaiTaxInvoice invoice={dummyInvoice} hotelInfo={hotelInfo} />
                </div>
            </div>
        </Shell>
    )
}
