'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'

interface TaxInvoiceProps {
    invoice: any
    hotelInfo: {
        name: string
        address: string
        taxId: string
        phone: string
    }
}

export function ThaiTaxInvoice({ invoice, hotelInfo }: TaxInvoiceProps) {
    if (!invoice) return null

    return (
        <div className="print:block bg-white text-black p-8 mx-auto w-[210mm] min-h-[297mm] shadow-lg print:shadow-none print:m-0 border border-gray-100 print:border-none">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-primary uppercase">{hotelInfo.name}</h1>
                    <p className="text-xs max-w-sm text-gray-600 leading-relaxed">{hotelInfo.address}</p>
                    <p className="text-xs font-bold mt-2">เลขประจำตัวผู้เสียภาษี: {hotelInfo.taxId}</p>
                    <p className="text-xs">โทร: {hotelInfo.phone}</p>
                </div>
                <div className="text-right space-y-2">
                    <h2 className="text-xl font-bold border-2 border-primary px-4 py-2 rounded-lg">
                        ใบกำกับภาษีเต็มรูป / ใบเสร็จรับเงิน
                    </h2>
                    <p className="text-sm font-bold pt-2 uppercase tracking-tighter">TAX INVOICE / RECEIPT</p>
                    <div className="text-xs space-y-1 mt-4">
                        <p><span className="font-bold">เลขที่ (No):</span> {invoice.invoiceNo}</p>
                        <p><span className="font-bold">วันที่ (Date):</span> {new Date(invoice.issuedAt).toLocaleDateString('th-TH')}</p>
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-8 mb-10 text-xs">
                <div className="p-4 bg-gray-50 rounded-xl border">
                    <p className="font-black border-b mb-2 pb-1 text-primary">ลูกค้า / Customer</p>
                    <p className="font-bold text-sm mb-1">{invoice.BuyerGuest.name}</p>
                    <p className="leading-relaxed text-gray-600">{invoice.BuyerGuest.address || 'N/A'}</p>
                    <p className="mt-2 text-gray-500">โทร: {invoice.BuyerGuest.phone || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border">
                    <p className="font-black border-b mb-2 pb-1 text-primary">รายละเอียดภาษี / Tax Info</p>
                    <p><span className="font-bold">เลขประจำตัวผู้เสียภาษี:</span> {invoice.BuyerGuest.taxId || '-'}</p>
                    <p><span className="font-bold">สาขา:</span> {invoice.BuyerGuest.branch || 'สำนักงานใหญ่'}</p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs text-left mb-10">
                <thead>
                    <tr className="bg-primary text-white font-bold">
                        <th className="px-4 py-3 rounded-l-lg">ลำดับ (Item)</th>
                        <th className="px-4 py-3">รายละเอียด (Description)</th>
                        <th className="px-4 py-3 text-right">จำนวน (Qty)</th>
                        <th className="px-4 py-3 text-right">ราคาหน่วย (Unit Price)</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">จำนวนเงิน (Amount)</th>
                    </tr>
                </thead>
                <tbody className="divide-y border-b">
                    {invoice.Stay.ChargeItems.map((item: any, idx: number) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-center border-x">{idx + 1}</td>
                            <td className="px-4 py-4 border-x">{item.description}</td>
                            <td className="px-4 py-4 text-right border-x">{item.qty}</td>
                            <td className="px-4 py-4 text-right border-x">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-4 text-right border-x font-bold">{formatCurrency(item.amount)}</td>
                        </tr>
                    ))}
                    {/* Fill empty rows to make it look full if necessary */}
                    {[...Array(Math.max(0, 5 - invoice.Stay.ChargeItems.length))].map((_, i) => (
                        <tr key={`empty-${i}`} className="h-10">
                            <td className="border-x"></td>
                            <td className="border-x"></td>
                            <td className="border-x"></td>
                            <td className="border-x"></td>
                            <td className="border-x"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-between items-start text-xs">
                <div className="w-1/2 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border">
                        <p className="font-bold mb-1">การชำระเงิน (Payments):</p>
                        {invoice.Payments.map((p: any) => (
                            <div key={p.id} className="flex justify-between uppercase text-[10px]">
                                <span>{p.method.replace('_', ' ')} (Ref: {p.reference || '-'})</span>
                                <span>{formatCurrency(p.amount)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border border-dashed rounded-xl">
                        <p className="font-bold mb-1">หมายเหตุ / Note:</p>
                        <p className="text-gray-500 italic">ขอบคุณที่ใช้บริการ / Thank you for staying with us.</p>
                    </div>
                </div>

                <div className="w-1/3 text-right space-y-2">
                    <div className="flex justify-between">
                        <span className="font-bold">รวมเงิน (Subtotal):</span>
                        <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                        <span className="font-bold">ส่วนลด (Discount):</span>
                        <span>-{formatCurrency(invoice.discount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold">ค่าบริการ (Service Charge):</span>
                        <span>{formatCurrency(invoice.serviceCharge)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                        <span className="font-bold">มูลค่าหลังหักส่วนลด:</span>
                        <span>{formatCurrency(Number(invoice.subtotal) - Number(invoice.discount))}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold">ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
                        <span>{formatCurrency(invoice.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between border-y py-3 mt-4 text-base font-black text-primary">
                        <span>จำนวนเงินรวมสุทธิ:</span>
                        <span>{formatCurrency(invoice.total)}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 pt-2 italic underline decoration-primary/30 underline-offset-4 font-bold">
                        ({convertToThaiBahtText(Number(invoice.total))})
                    </p>
                </div>
            </div>

            {/* Signature */}
            <div className="mt-20 flex justify-end gap-20 text-center text-xs">
                <div className="w-48">
                    <div className="border-b border-black mb-1 p-8"></div>
                    <p>ผู้รับเงิน / Receiver</p>
                    <p className="text-[10px] opacity-60 mt-1">วันที่ / Date: ...../...../.....</p>
                </div>
                <div className="w-48">
                    <div className="border-b border-black mb-1 p-8"></div>
                    <p>กู้สร้างใบกำกับ / Authorized Person</p>
                    <p className="text-[10px] opacity-60 mt-1">วันที่ / Date: ...../...../.....</p>
                </div>
            </div>
        </div>
    )
}

function convertToThaiBahtText(amount: number) {
    // Simple approximation for demo, a real library like bahttext would be used
    return ".....บาทถ้วน"
}
