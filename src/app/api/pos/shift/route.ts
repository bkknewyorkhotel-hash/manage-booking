
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const today = new Date()
        const startOfDay = new Date(today.setHours(0, 0, 0, 0))
        const endOfDay = new Date(today.setHours(23, 59, 59, 999))

        const orders = await prisma.posOrder.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: 'COMPLETED'
            }
        })

        const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
        const cashSales = orders.filter(o => o.paymentMethod === 'CASH').reduce((sum, order) => sum + order.total, 0)
        const otherSales = totalSales - cashSales
        const orderCount = orders.length

        return NextResponse.json({
            totalSales,
            cashSales,
            otherSales,
            orderCount,
            lastUpdated: new Date()
        })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
