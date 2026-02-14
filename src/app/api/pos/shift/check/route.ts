
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

        // Refunds (from this shift)
        const refundTotal = (shift.RefundedDeposits || []).reduce((sum: number, d: any) => sum + Number(d.refundedAmount || 0), 0)

        // Cash In/Out (Petty Cash, Expenses)
        const txIn = shift.CashTransactions.filter((t: any) => t.type === 'INCOME').reduce((sum: number, t: any) => sum + Number(t.amount), 0)
        const txOut = shift.CashTransactions.filter((t: any) => t.type === 'EXPENSE').reduce((sum: number, t: any) => sum + Number(t.amount), 0)

        const cashIn = txIn
        const cashOut = txOut

        // Totals
        const totalSales = posTotal + roomTotal
        const cashSales = (posCash + roomCash + cashIn) - cashOut
        const otherSales = totalSales - (posCash + roomCash)
        const orderCount = shift.Orders.filter((o: any) => o.status === 'COMPLETED').length + shift.Payments.length + shift.Deposits.length

        return NextResponse.json({
            ...openShift,
            stats: {
                posTotal,
                roomTotal,
                cashIn,
                cashOut,
                totalSales,
                cashSales,
                otherSales,
                orderCount
            }
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
