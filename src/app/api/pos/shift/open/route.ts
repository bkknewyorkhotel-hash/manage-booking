
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId, startCash } = body

        // Find ANY open shift on this terminal/system (not just user's shift)
        const existingOpenShift = await prisma.shift.findFirst({
            where: { status: 'OPEN' },
            orderBy: { startTime: 'desc' }
        })

        // Auto-close previous shift if exists (graceful handover)
        if (existingOpenShift) {
            // Calculate totals for auto-closed shift
            const orders = await prisma.posOrder.findMany({
                where: {
                    shiftId: existingOpenShift.id,
                    status: 'COMPLETED'
                }
            })

            const payments = await prisma.payment.findMany({
                where: { shiftId: existingOpenShift.id }
            })

            const posTotal = orders.reduce((sum, order) => sum + Number(order.total), 0)
            const roomTotal = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
            const totalSales = posTotal + roomTotal

            await prisma.shift.update({
                where: { id: existingOpenShift.id },
                data: {
                    endTime: new Date(),
                    endCash: existingOpenShift.startCash, // Assume no change (user forgot to count)
                    totalSales: Number(totalSales),
                    status: 'CLOSED'
                }
            })

            // Log this action for audit trail
            console.warn(`[SHIFT HANDOVER] Auto-closed shift ${existingOpenShift.id} (opened by user ${existingOpenShift.userId}) when user ${userId} opened new shift`)
        }

        // Create new shift for current user
        const newShift = await prisma.shift.create({
            data: {
                userId,
                startCash: Number(startCash || 0),
                startTime: new Date(),
                status: 'OPEN'
            }
        })

        return NextResponse.json(newShift)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
