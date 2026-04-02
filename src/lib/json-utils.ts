import { Prisma } from '@prisma/client';

export function asJsonObject(
  value: Prisma.JsonValue | null | undefined
): Prisma.InputJsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Prisma.InputJsonObject;
  }
  return value as Prisma.InputJsonObject;
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
