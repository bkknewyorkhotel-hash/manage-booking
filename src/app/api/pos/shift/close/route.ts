
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { shiftId, endCash } = body

        // Calculate totals from orders linked to this shift
        const orders = await prisma.posOrder.findMany({
            where: {
                shiftId,
                status: 'COMPLETED'
            }
        })

        // Calculate totals from payments linked to this shift
        const payments = await prisma.payment.findMany({
            where: {
                shiftId
            }
        })

        const posTotal = orders.reduce((sum, order) => sum + order.total, 0)
        const roomTotal = payments.reduce((sum, payment) => sum + payment.amount, 0)
        const totalSales = posTotal + roomTotal

        const updatedShift = await prisma.shift.update({
            where: { id: shiftId },
            data: {
                endTime: new Date(),
                endCash: Number(endCash || 0),
                totalSales,
                status: 'CLOSED'
            }
        })

        return NextResponse.json(updatedShift)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
