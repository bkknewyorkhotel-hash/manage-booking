import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { roomId, status, note, userId } = body

        const log = await prisma.$transaction(async (tx) => {
            // 1. Update Room Status
            await tx.room.update({
                where: { id: roomId },
                data: { status }
            })

            // 2. Create Log
            return await tx.housekeepingLog.create({
                data: {
                    roomId,
                    status,
                    note,
                    userId
                }
            })
        })

        return NextResponse.json(log)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const roomId = searchParams.get('roomId')

        const logs = await prisma.housekeepingLog.findMany({
            where: roomId ? { roomId } : {},
            include: {
                Room: true,
                User: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        })

        return NextResponse.json(logs)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
