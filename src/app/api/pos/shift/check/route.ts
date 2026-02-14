
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Check for ACTIVE (OPEN) shift
export async function GET(request: Request) {
    try {
        // For simplicity, we get the LAST open shift. 
        // In a multi-user system, we might filter by the logged-in user from session/token.
        // But for this MVP, we assume one active terminal.

        type ExtendedShift = {
            id: string
            userId: string
            startTime: Date
            endTime: Date | null
            startCash: number
            endCash: number | null
            totalSales: number
            status: string
            Orders: any[]
            Payments: any[]
        }

        const openShift = await prisma.shift.findFirst({
            where: {
                status: 'OPEN'
            },
            orderBy: {
                startTime: 'desc'
            },
            include: {
                Orders: true,
                Payments: true,
                CashTransactions: true,
                Deposits: true,
                RefundedDeposits: true
            }
        })

        if (!openShift) {
            return NextResponse.json(null) // No open shift
        }

        const shift = openShift as any

        // Calculate real-time stats for the open shift
        // POS Sales
        const posTotal = shift.Orders.filter((o: any) => o.status === 'COMPLETED').reduce((sum: number, o: any) => sum + Number(o.total), 0)
        const posCash = shift.Orders.filter((o: any) => o.status === 'COMPLETED' && o.paymentMethod === 'CASH').reduce((sum: number, o: any) => sum + Number(o.total), 0)

        // Room Revenue (Payments)
        const roomTotal = shift.Payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
        const roomCash = shift.Payments.filter((p: any) => p.method === 'CASH').reduce((sum: number, p: any) => sum + Number(p.amount), 0)

        // Deposits (e.g. Key Deposit)
        const depositTotal = shift.Deposits.reduce((sum: number, d: any) => sum + Number(d.amount), 0)
        const depositCash = shift.Deposits.filter((d: any) => d.method === 'CASH').reduce((sum: number, d: any) => sum + Number(d.amount), 0)
        const depositOther = depositTotal - depositCash

        // Refunds (from this shift)
        const refundTotal = (shift.RefundedDeposits || []).reduce((sum: number, d: any) => sum + Number(d.refundedAmount || 0), 0)
        const refundCash = (shift.RefundedDeposits || []).filter((d: any) => d.method === 'CASH').reduce((sum: number, d: any) => sum + Number(d.refundedAmount || 0), 0)
        const refundOther = refundTotal - refundCash

        // Cash In/Out (Petty Cash, Expenses)
        const txIn = shift.CashTransactions.filter((t: any) => t.type === 'INCOME').reduce((sum: number, t: any) => sum + Number(t.amount), 0)
        const txOut = shift.CashTransactions.filter((t: any) => t.type === 'EXPENSE').reduce((sum: number, t: any) => sum + Number(t.amount), 0)

        const cashIn = txIn
        const cashOut = txOut

        // Payment Breakdown (Combined POS + Room + Deposit)
        const paymentStats: Record<string, { count: number, amount: number }> = {}
        const updatePaymentStats = (method: string, amount: number) => {
            if (!paymentStats[method]) paymentStats[method] = { count: 0, amount: 0 }
            paymentStats[method].count += 1
            paymentStats[method].amount += amount
        }

        shift.Orders.filter((o: any) => o.status === 'COMPLETED').forEach((o: any) => updatePaymentStats(o.paymentMethod, Number(o.total)))
        shift.Payments.forEach((p: any) => updatePaymentStats(p.method, Number(p.amount)))
        shift.Deposits.forEach((d: any) => updatePaymentStats(d.method, Number(d.amount)))

        // Totals
        const totalSales = posTotal + roomTotal
        const cashSales = Number(shift.startCash || 0) + (posCash + roomCash + cashIn) - cashOut
        const otherSales = (posTotal - posCash) + (roomTotal - roomCash) + depositOther - refundOther

        const posOrderCount = shift.Orders.filter((o: any) => o.status === 'COMPLETED').length
        const totalDiscount = 0
        const posSaleAfterDisc = posTotal - totalDiscount
        const posAvgBill = posOrderCount > 0 ? (posTotal / posOrderCount) : 0

        const roomCount = shift.Payments.length

        return NextResponse.json({
            ...openShift,
            stats: {
                // Section 1: POS Sales
                pos: {
                    total: posTotal,
                    count: posOrderCount,
                    avg: posAvgBill,
                    discount: totalDiscount,
                    afterDiscount: posSaleAfterDisc
                },
                // Section 2: Room Revenue
                room: {
                    total: roomTotal,
                    count: roomCount
                },
                // Section 3: Cash In-Out
                cashFlow: {
                    startCash: Number(shift.startCash || 0),
                    cashIn: cashIn,
                    cashOut: cashOut,
                    netCash: cashSales,
                    totalRevenue: totalSales
                },
                // Other existing data for backward compatibility or breakdown
                posTotal,
                roomTotal,
                cashIn,
                cashOut,
                totalSales,
                cashSales,
                otherSales,
                orderCount: posOrderCount + roomCount + shift.Deposits.length,
                paymentBreakdown: paymentStats,
                totalDiscount,
                saleAfterDisc: totalSales - totalDiscount,
                avgBill: (posOrderCount + roomCount) > 0 ? (totalSales / (posOrderCount + roomCount)) : 0,
                vat: 0,
                serviceCharge: 0
            }
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
