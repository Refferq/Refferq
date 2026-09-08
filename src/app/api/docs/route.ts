import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';

// Auto-generated OpenAPI spec from Zod schemas
 async function GETHandler(request: NextRequest) {
    const spec = {
        openapi: '3.0.3',
        info: {
            title: __tr("Refferq API"),
            version: '1.1.0',
            description: __tr("Open-source affiliate marketing platform API. Manage affiliates, referrals, conversions, commissions, and payouts."),
            contact: { email: 'hello@refferq.com' },
            license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
        },
        servers: [
            { url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.refferq.com', description: __tr("Production") },
        ],
        tags: [
            { name: 'Auth', description: __tr("Authentication endpoints") },
            { name: 'Affiliate', description: __tr("Affiliate-facing endpoints") },
            { name: 'Admin', description: __tr("Admin management endpoints") },
            { name: 'Tracking', description: __tr("Click and conversion tracking") },
            { name: 'Webhooks', description: __tr("External webhook receivers") },
        ],
        paths: {
            // ─── Auth ──────────────────────────────────────────────
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: __tr("Login"),
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
                    },
                    responses: {
                        '200': { description: __tr("JWT token returned"), content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
                        '401': { description: __tr("Invalid credentials") },
                    },
                },
            },
            '/api/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: __tr("Get current user"),
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: __tr("Current user info") } },
                },
            },

            // ─── Affiliate ─────────────────────────────────────────
            '/api/affiliate/profile': {
                get: {
                    tags: [__tr("Affiliate")],
                    summary: __tr("Get affiliate profile & stats"),
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: __tr("Affiliate data, referrals, stats, currencySymbol") } },
                },
                put: {
                    tags: [__tr("Affiliate")],
                    summary: __tr("Update affiliate profile"),
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } } },
                    },
                    responses: { '200': { description: __tr("Profile updated") } },
                },
            },
            '/api/affiliate/referrals': {
                post: {
                    tags: [__tr("Affiliate")],
                    summary: __tr("Submit a new referral lead"),
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ReferralRequest' } } },
                    },
                    responses: {
                        '201': { description: __tr("Referral created") },
                        '400': { description: __tr("Validation error") },
                    },
                },
            },
            '/api/affiliate/payouts': {
                get: {
                    tags: [__tr("Affiliate")],
                    summary: __tr("Get affiliate payout history"),
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: __tr("List of payouts") } },
                },
            },

            // ─── Admin ─────────────────────────────────────────────
            '/api/admin/affiliates': {
                get: {
                    tags: [__tr("Admin")],
                    summary: __tr("List all affiliates"),
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: __tr("Array of affiliates with stats and currencySymbol") } },
                },
                post: {
                    tags: [__tr("Admin")],
                    summary: __tr("Create a new affiliate"),
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AffiliateCreateRequest' } } },
                    },
                    responses: {
                        '200': { description: __tr("Affiliate created, temporaryPassword included") },
                        '400': { description: __tr("Validation error or email exists") },
                    },
                },
            },
            '/api/admin/payouts': {
                get: {
                    tags: [__tr("Admin")],
                    summary: __tr("List all payouts"),
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'affiliateId', in: 'query', schema: { type: 'string' }, description: __tr("Filter by affiliate") },
                        { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv'] }, description: __tr("Export as CSV") },
                    ],
                    responses: { '200': { description: __tr("Array of payouts") } },
                },
                post: {
                    tags: [__tr("Admin")],
                    summary: __tr("Create a payout"),
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/PayoutRequest' } } },
                    },
                    responses: { '200': { description: __tr("Payout created") } },
                },
                put: {
                    tags: [__tr("Admin")],
                    summary: __tr("Update payout status"),
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/PayoutUpdateRequest' } } },
                    },
                    responses: { '200': { description: __tr("Payout updated") } },
                },
            },
            '/api/admin/analytics': {
                get: {
                    tags: [__tr("Admin")],
                    summary: __tr("Get platform analytics"),
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: __tr("Analytics data") } },
                },
            },
            '/api/admin/reports': {
                get: {
                    tags: [__tr("Admin")],
                    summary: __tr("Get platform reports"),
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: __tr("Report data") } },
                },
            },

            // ─── Tracking ──────────────────────────────────────────
            '/r/{code}': {
                get: {
                    tags: ['Tracking'],
                    summary: __tr("Referral redirect (deep linking supported)"),
                    parameters: [
                        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: __tr("Referral code") },
                        { name: 'dest', in: 'query', schema: { type: 'string', format: 'uri' }, description: __tr("Deep link destination URL") },
                    ],
                    responses: {
                        '302': { description: __tr("Redirects to target URL with ref and attr params, sets attribution cookie") },
                    },
                },
            },

            // ─── Webhooks ──────────────────────────────────────────
            '/api/webhook/conversion': {
                post: {
                    tags: ['Webhooks'],
                    summary: __tr("Receive conversion events from external services"),
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ConversionWebhook' } } },
                    },
                    responses: { '200': { description: __tr("Conversion processed") } },
                },
            },
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8 },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        token: { type: 'string' },
                        user: { $ref: '#/components/schemas/UserSummary' },
                    },
                },
                UserSummary: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string', enum: ['ADMIN', 'AFFILIATE'] },
                    },
                },
                ReferralRequest: {
                    type: 'object',
                    required: ['leadName', 'leadEmail'],
                    properties: {
                        leadName: { type: 'string', minLength: 2 },
                        leadEmail: { type: 'string', format: 'email' },
                        company: { type: 'string' },
                        notes: { type: 'string' },
                        estimatedValue: { type: 'number', minimum: 0 },
                    },
                },
                AffiliateCreateRequest: {
                    type: 'object',
                    required: ['name', 'email'],
                    properties: {
                        name: { type: 'string', minLength: 2 },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8, description: __tr("Optional — auto-generated if omitted") },
                    },
                },
                PayoutRequest: {
                    type: 'object',
                    required: ['affiliateId', 'commissionIds'],
                    properties: {
                        affiliateId: { type: 'string' },
                        commissionIds: { type: 'array', items: { type: 'string' }, minItems: 1 },
                        method: { type: 'string' },
                        notes: { type: 'string' },
                    },
                },
                PayoutUpdateRequest: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' },
                        status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] },
                        method: { type: 'string' },
                        notes: { type: 'string' },
                    },
                },
                UpdateProfileRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        company: { type: 'string' },
                        country: { type: 'string' },
                        paymentMethod: { type: 'string' },
                        paymentEmail: { type: 'string', format: 'email' },
                    },
                },
                ProgramSettingsRequest: {
                    type: 'object',
                    required: ['productName', 'programName', 'websiteUrl', 'currency', 'minPayoutCents', 'cookieDuration'],
                    properties: {
                        productName: { type: 'string', minLength: 1 },
                        programName: { type: 'string', minLength: 1 },
                        websiteUrl: { type: 'string', format: 'uri' },
                        currency: { type: 'string', minLength: 3, maxLength: 3 },
                        minPayoutCents: { type: 'integer', minimum: 0 },
                        cookieDuration: { type: 'integer', minimum: 1 },
                    },
                },
                ConversionWebhook: {
                    type: 'object',
                    properties: {
                        referralCode: { type: 'string' },
                        eventType: { type: 'string', enum: ['SIGNUP', 'PURCHASE', 'TRIAL', 'LEAD'] },
                        amountCents: { type: 'integer' },
                        currency: { type: 'string' },
                        customerEmail: { type: 'string', format: 'email' },
                    },
                },
            },
        },
    };

    return NextResponse.json(spec, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
    });
}

export const GET = withSystemLocale(GETHandler);
