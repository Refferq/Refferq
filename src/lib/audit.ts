import { prisma } from './prisma';

/**
 * Consistently logs administrative actions to the AuditLog table.
 */
export async function logAuditAction(data: {
    actorId: string;
    action: string;
    objectType: string;
    objectId: string;
    payload?: unknown;
}) {
    try {
        return await prisma.auditLog.create({
            data: {
                actorId: data.actorId,
                action: data.action,
                objectType: data.objectType,
                objectId: data.objectId,
                payload: data.payload || {},
            },
        });
    } catch (error) {
        console.error('Failed to log audit action:', error);
        // We don't want to fail the main action if auditing fails, 
        // but in a production app you might want more robust handling.
    }
}

export async function resolveAuditActorId(preferredActorId?: string | null): Promise<string | null> {
    if (preferredActorId) {
        const user = await prisma.user.findUnique({
            where: { id: preferredActorId },
            select: { id: true },
        }).catch(() => null);

        if (user?.id) {
            return user.id;
        }
    }

    const activeAdmin = await prisma.user.findFirst({
        where: {
            role: 'ADMIN',
            status: 'ACTIVE',
        },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
    }).catch(() => null);

    if (activeAdmin?.id) {
        return activeAdmin.id;
    }

    const anyUser = await prisma.user.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
    }).catch(() => null);

    return anyUser?.id ?? null;
}

export async function logSystemAuditAction(data: {
    preferredActorId?: string | null;
    action: string;
    objectType: string;
    objectId: string;
    payload?: unknown;
}) {
    const actorId = await resolveAuditActorId(data.preferredActorId);
    if (!actorId) {
        console.warn(`Skipped audit log (${data.action}): no valid actor user found`);
        return null;
    }

    return await logAuditAction({
        actorId,
        action: data.action,
        objectType: data.objectType,
        objectId: data.objectId,
        payload: data.payload,
    });
}
