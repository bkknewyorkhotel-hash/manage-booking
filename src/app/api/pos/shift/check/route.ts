
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
                Payments: true
            }
        })

        if (!openShift) {
            return NextResponse.json(null) // No open shift
        }

        const shift = openShift as unknown as ExtendedShift

        // Calculate real-time stats for the open shift
        // POS Sales
        const posTotal = shift.Orders.filter((o: any) => o.status === 'COMPLETED').reduce((sum: number, o: any) => sum + o.total, 0)
        const posCash = shift.Orders.filter((o: any) => o.status === 'COMPLETED' && o.paymentMethod === 'CASH').reduce((sum: number, o: any) => sum + o.total, 0)

        // Room Revenue (Payments)
        const roomTotal = shift.Payments.reduce((sum: number, p: any) => sum + p.amount, 0)
        const roomCash = shift.Payments.filter((p: any) => p.method === 'CASH').reduce((sum: number, p: any) => sum + p.amount, 0)

        // Totals
        const totalSales = posTotal + roomTotal
        const cashSales = posCash + roomCash
        const otherSales = totalSales - cashSales
        const orderCount = shift.Orders.filter((o: any) => o.status === 'COMPLETED').length + shift.Payments.length

        return NextResponse.json({
            ...openShift,
            stats: {
                posTotal,
                roomTotal,
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
