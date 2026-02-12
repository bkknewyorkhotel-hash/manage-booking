
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date()

        const start = startOfMonth(date)
        const end = endOfMonth(date)

        // 1. Monthly Revenue
        const payments = await prisma.payment.groupBy({
            by: ['method'],
            where: {
                paidAt: { gte: start, lte: end }
            },
            _sum: { amount: true }
        })

        const posOrders = await prisma.posOrder.groupBy({
            by: ['paymentMethod'],
            where: {
                createdAt: { gte: start, lte: end },
                status: 'COMPLETED'
            },
            _sum: { total: true }
        })

        // 2. Booking Sources
        const sources = await prisma.booking.groupBy({
            by: ['source'],
            where: {
                checkInDate: { gte: start, lte: end },
                status: { in: ['CHECKED_IN', 'CHECKED_OUT', 'CONFIRMED'] }
            },
            _count: { id: true }
        })

        // 3. Top Selling Products
        // Prisma doesn't support deep relation grouping easily in one query, so we fetch posItems
        const topProducts = await prisma.posOrderItem.groupBy({
            by: ['productId', 'name'],
            where: {
                Order: {
                    createdAt: { gte: start, lte: end },
                    status: 'COMPLETED'
                }
            },
            _sum: { qty: true, total: true },
            orderBy: {
                _sum: { total: 'desc' }
            },
            take: 5
        })

        return NextResponse.json({
            revenue: {
                room: payments.reduce((acc, curr) => acc + (curr._sum.amount || 0), 0),
                pos: posOrders.reduce((acc, curr) => acc + (curr._sum.total || 0), 0),
                total: payments.reduce((acc, curr) => acc + (curr._sum.amount || 0), 0) + posOrders.reduce((acc, curr) => acc + (curr._sum.total || 0), 0)
            },
            sources: sources.map(s => ({ name: s.source, count: s._count.id })),
            topProducts: topProducts.map(p => ({
                name: p.name,
                qty: p._sum.qty,
                total: p._sum.total
            }))
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
