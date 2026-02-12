
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId, startCash } = body

        // Check if user already has an open shift (optional, but good practice)
        const existingShift = await prisma.shift.findFirst({
            where: {
                userId,
                status: 'OPEN'
            }
        })

        if (existingShift) {
            return NextResponse.json({ error: 'User already has an open shift' }, { status: 400 })
        }

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
