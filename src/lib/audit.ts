import prisma from './prisma'

export async function createAuditLog({
    action,
    entity,
    entityId,
    oldValue,
    newValue,
    userId
}: {
    action: string
    entity: string
    entityId: string
    oldValue?: string
    newValue?: string
    userId: string
}) {
    return await prisma.auditLog.create({
        data: {
            action,
            entity,
            entityId,
            oldValue,
            newValue,
            userId
        }
    })
}
