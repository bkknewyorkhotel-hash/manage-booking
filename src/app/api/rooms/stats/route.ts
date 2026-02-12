import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const stats = await prisma.room.groupBy({
            by: ['status'],
            _count: {
                _all: true,
            },
        })

        const result = stats.reduce((acc, curr) => {
            acc[curr.status] = curr._count._all
            return acc
        }, {} as Record<string, number>)

        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
