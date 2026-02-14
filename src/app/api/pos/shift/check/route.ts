
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

        // Helper to get payment breakdown
        const getBreakdown = (items: any[], methodField: string, amountField: string) => {
            const stats: Record<string, { count: number, amount: number }> = {}
            items.forEach(item => {
                const method = item[methodField] || 'OTHER'
                const amount = Number(item[amountField] || 0)
                if (!stats[method]) stats[method] = { count: 0, amount: 0 }
                stats[method].count += 1
                stats[method].amount += amount
            })
            return Object.entries(stats).map(([method, data]) => ({ method, ...data }))
        }

        // Calculate real-time stats for the open shift
        // POS Sales
        const completedOrders = shift.Orders.filter((o: any) => o.status === 'COMPLETED')
        const posTotal = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0)
        const posBreakdown = getBreakdown(completedOrders, 'paymentMethod', 'total')

        // Room Revenue (Payments)
        const roomTotal = shift.Payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
        const roomBreakdown = getBreakdown(shift.Payments, 'method', 'amount')

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

        // All Payment Methods combined for the overall breakdown
        const allPaymentsBreakdownMap: Record<string, { count: number, amount: number }> = {}
        const updateAllPayments = (method: string, amount: number) => {
            if (!allPaymentsBreakdownMap[method]) allPaymentsBreakdownMap[method] = { count: 0, amount: 0 }
            allPaymentsBreakdownMap[method].count += 1
            allPaymentsBreakdownMap[method].amount += amount
        }
        completedOrders.forEach((o: any) => updateAllPayments(o.paymentMethod, Number(o.total)))
        shift.Payments.forEach((p: any) => updateAllPayments(p.method, Number(p.amount)))
        shift.Deposits.forEach((d: any) => updateAllPayments(d.method, Number(d.amount)))

        const cashBreakdown = Object.entries(allPaymentsBreakdownMap)
            .filter(([method]) => method === 'CASH')
            .map(([method, data]) => ({ method, ...data }))
        const nonCashBreakdown = Object.entries(allPaymentsBreakdownMap)
            .filter(([method]) => method !== 'CASH')
            .map(([method, data]) => ({ method, ...data }))

        const cashTotalPay = cashBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0)
        const nonCashTotalPay = nonCashBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0)

        // Totals for drawer calculation
        const posCash = completedOrders.filter((o: any) => o.paymentMethod === 'CASH').reduce((sum: number, o: any) => sum + Number(o.total), 0)
        const roomCash = shift.Payments.filter((p: any) => p.method === 'CASH').reduce((sum: number, p: any) => sum + Number(p.amount), 0)

        const totalSales = posTotal + roomTotal
        const cashSales = Number(shift.startCash || 0) + (posCash + roomCash + txIn) - txOut
        const otherSales = (posTotal - posCash) + (roomTotal - roomCash) + depositOther - refundOther

        return NextResponse.json({
            ...openShift,
            stats: {
                // Section 1: POS Sales
                pos: {
                    total: posTotal,
                    count: completedOrders.length,
                    breakdown: posBreakdown
                },
                // Section 2: Room Revenue
                room: {
                    total: roomTotal,
                    count: shift.Payments.length,
                    breakdown: roomBreakdown
                },
                // Categorized Payments (Overall Breakdown at bottom)
                payments: {
                    cash: {
                        list: cashBreakdown,
                        total: cashTotalPay
                    },
                    nonCash: {
                        list: nonCashBreakdown,
                        total: nonCashTotalPay
                    }
                },
                // Section 3: Cash In-Out
                cashFlow: {
                    startCash: Number(shift.startCash || 0),
                    cashIn: txIn,
                    cashOut: txOut,
                    netCash: cashSales,
                    totalRevenue: totalSales
                },
                // Metadata
                posTotal,
                roomTotal,
                totalSales,
                cashSales,
                otherSales,
                paymentBreakdown: allPaymentsBreakdownMap,
                vat: 0,
                serviceCharge: 0
            }
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
