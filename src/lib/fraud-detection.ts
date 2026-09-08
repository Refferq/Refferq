
import { t as __tr } from "@/i18n";
import { prisma } from './prisma';

export interface FraudCheckResult {
    isSuspicious: boolean;
    reasons: string[];
    riskScore: number; // 0-100
}

const SUSPICIOUS_USER_AGENTS = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests',
    'Go-http-client', 'Java/', 'okhttp', 'libwww', 'HTTrack',
];

const MAX_CLICKS_PER_IP_PER_HOUR = 10;
const MAX_CLICKS_PER_AFFILIATE_PER_IP_DAY = 5;

/**
 * Checks if an IP + userAgent combination looks suspicious.
 */
export function isBotUserAgent(userAgent: string): boolean {
    const ua = userAgent.toLowerCase();
    return SUSPICIOUS_USER_AGENTS.some(bot => ua.includes(bot.toLowerCase()));
}

/**
 * Comprehensive fraud check for a referral click.
 */
export async function checkFraud({
    ipAddress,
    userAgent,
    affiliateId,
}: {
    ipAddress: string;
    userAgent: string;
    affiliateId: string;
}): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // 1. Bot/automated user agent check
    if (isBotUserAgent(userAgent)) {
        reasons.push(__tr("Suspicious user agent (possible bot)"));
        riskScore += 60;
    }

    // 2. Check click frequency from the same IP in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentClicksFromIP = await prisma.referralClick.count({
        where: {
            ipAddress,
            createdAt: { gte: oneHourAgo },
        },
    });

    if (recentClicksFromIP >= MAX_CLICKS_PER_IP_PER_HOUR) {
        reasons.push(__tr("High click frequency: {0} clicks from same IP in last hour", [recentClicksFromIP]));
        riskScore += 30;
    }

    // 3. Check if same IP already clicked for this affiliate today
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const clicksForAffiliateFromIP = await prisma.referralClick.count({
        where: {
            ipAddress,
            createdAt: { gte: oneDayAgo },
            referral: {
                affiliateId,
            },
        },
    });

    if (clicksForAffiliateFromIP >= MAX_CLICKS_PER_AFFILIATE_PER_IP_DAY) {
        reasons.push(__tr("Duplicate IP: {0} clicks for same affiliate from same IP today", [clicksForAffiliateFromIP]));
        riskScore += 40;
    }

    // 4. Private/loopback IP ranges (could indicate self-referral or test)
    const isPrivateIP = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ipAddress);
    if (isPrivateIP) {
        reasons.push(__tr("Private/internal IP address"));
        riskScore += 10;
    }

    const isSuspicious = riskScore >= 40;

    return {
        isSuspicious,
        reasons,
        riskScore: Math.min(riskScore, 100),
    };
}

/**
 * Logs a fraud event to the referralClick metadata.
 */
export async function logFraudEvent(clickId: string, fraudResult: FraudCheckResult) {
    await prisma.referralClick.update({
        where: { id: clickId },
        data: {
            metadata: {
                fraud_check: {
                    is_suspicious: fraudResult.isSuspicious,
                    risk_score: fraudResult.riskScore,
                    reasons: fraudResult.reasons,
                    checked_at: new Date().toISOString(),
                },
            },
        },
    });
}
