
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all settings
export async function GET() {
    try {
        const settings = await prisma.setting.findMany()
        const formatted = settings.reduce((acc: Record<string, string>, curr: any) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, string>)

        return NextResponse.json(formatted)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST (Update) settings
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const updates = []

        for (const [key, value] of Object.entries(body)) {
            updates.push(prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            }))
        }

        await prisma.$transaction(updates)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
