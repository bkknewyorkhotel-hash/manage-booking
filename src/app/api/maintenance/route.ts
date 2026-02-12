import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { roomId, issue, priority } = body

        const ticket = await prisma.$transaction(async (tx) => {
            // 1. Create ticket
            const t = await tx.maintenanceTicket.create({
                data: {
                    roomId,
                    issue,
                    priority
                }
            })

            // 2. Set room to Out of Order if high priority (optional business rule)
            if (priority === 'HIGH') {
                await tx.room.update({
                    where: { id: roomId },
                    data: { status: 'OUT_OF_ORDER' }
                })
            }

            return t
        })

        return NextResponse.json(ticket)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const { status } = await request.json()

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const ticket = await prisma.maintenanceTicket.update({
            where: { id },
            data: {
                status,
                resolvedAt: status === 'RESOLVED' ? new Date() : null
            }
        })

        return NextResponse.json(ticket)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET() {
    try {
        const tickets = await prisma.maintenanceTicket.findMany({
            include: { Room: true },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(tickets)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
