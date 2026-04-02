import { NextRequest, NextResponse } from 'next/server';

// Auto-generated OpenAPI spec from Zod schemas
export async function GET(request: NextRequest) {
    const spec = {
        openapi: '3.0.3',
        info: {
            title: 'Refferq API',
            version: '1.1.0',
            description: 'Open-source affiliate marketing platform API. Manage affiliates, referrals, conversions, commissions, and payouts.',
            contact: { email: 'hello@refferq.com' },
            license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
        },
        servers: [
            { url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.refferq.com', description: 'Production' },
        ],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Affiliate', description: 'Affiliate-facing endpoints' },
            { name: 'Admin', description: 'Admin management endpoints' },
            { name: 'Tracking', description: 'Click and conversion tracking' },
            { name: 'Webhooks', description: 'External webhook receivers' },
        ],
        paths: {
            // ─── Auth ──────────────────────────────────────────────
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
                    },
                    responses: {
                        '200': { description: 'JWT token returned', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
                        '401': { description: 'Invalid credentials' },
                    },
                },
            },
            '/api/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Get current user',
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: 'Current user info' } },
                },
            },

            // ─── Affiliate ─────────────────────────────────────────
            '/api/affiliate/profile': {
                get: {
                    tags: ['Affiliate'],
                    summary: 'Get affiliate profile & stats',
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: 'Affiliate data, referrals, stats, currencySymbol' } },
                },
                put: {
                    tags: ['Affiliate'],
                    summary: 'Update affiliate profile',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } } },
                    },
                    responses: { '200': { description: 'Profile updated' } },
                },
            },
            '/api/affiliate/referrals': {
                post: {
                    tags: ['Affiliate'],
                    summary: 'Submit a new referral lead',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ReferralRequest' } } },
                    },
                    responses: {
                        '201': { description: 'Referral created' },
                        '400': { description: 'Validation error' },
                    },
                },
            },
            '/api/affiliate/payouts': {
                get: {
                    tags: ['Affiliate'],
                    summary: 'Get affiliate payout history',
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: 'List of payouts' } },
                },
            },

            // ─── Admin ─────────────────────────────────────────────
            '/api/admin/affiliates': {
                get: {
                    tags: ['Admin'],
                    summary: 'List all affiliates',
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: 'Array of affiliates with stats and currencySymbol' } },
                },
                post: {
                    tags: ['Admin'],
                    summary: 'Create a new affiliate',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AffiliateCreateRequest' } } },
                    },
                    responses: {
                        '200': { description: 'Affiliate created, temporaryPassword included' },
                        '400': { description: 'Validation error or email exists' },
                    },
                },
            },
            '/api/admin/payouts': {
                get: {
                    tags: ['Admin'],
                    summary: 'List all payouts',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'affiliateId', in: 'query', schema: { type: 'string' }, description: 'Filter by affiliate' },
                        { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv'] }, description: 'Export as CSV' },
                    ],
                    responses: { '200': { description: 'Array of payouts' } },
                },
                post: {
                    tags: ['Admin'],
                    summary: 'Create a payout',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/PayoutRequest' } } },
                    },
                    responses: { '200': { description: 'Payout created' } },
                },
                put: {
                    tags: ['Admin'],
                    summary: 'Update payout status',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/PayoutUpdateRequest' } } },
                    },
                    responses: { '200': { description: 'Payout updated' } },
                },
            },
            '/api/admin/analytics': {
                get: {
                    tags: ['Admin'],
                    summary: 'Get platform analytics',
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: 'Analytics data' } },
                },
            },
            '/api/admin/reports': {
                get: {
                    tags: ['Admin'],
                    summary: 'Get platform reports',
                    security: [{ BearerAuth: [] }],
                    responses: { '200': { description: 'Report data' } },
                },
            },

            // ─── Tracking ──────────────────────────────────────────
            '/r/{code}': {
                get: {
                    tags: ['Tracking'],
                    summary: 'Referral redirect (deep linking supported)',
                    parameters: [
                        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: 'Referral code' },
                        { name: 'dest', in: 'query', schema: { type: 'string', format: 'uri' }, description: 'Deep link destination URL' },
                    ],
                    responses: {
                        '302': { description: 'Redirects to target URL with ref and attr params, sets attribution cookie' },
                    },
                },
            },

            // ─── Webhooks ──────────────────────────────────────────
            '/api/webhook/conversion': {
                post: {
                    tags: ['Webhooks'],
                    summary: 'Receive conversion events from external services',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ConversionWebhook' } } },
                    },
                    responses: { '200': { description: 'Conversion processed' } },
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
                        password: { type: 'string', minLength: 8, description: 'Optional — auto-generated if omitted' },
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
                    required: ['event_type', 'customer_email'],
                    properties: {
                        event_type: { type: 'string', enum: ['SIGNUP', 'PURCHASE', 'TRIAL', 'LEAD'] },
                        eventType: { type: 'string', enum: ['SIGNUP', 'PURCHASE', 'TRIAL', 'LEAD'], description: 'camelCase alias' },
                        event_id: { type: 'string' },
                        eventId: { type: 'string', description: 'camelCase alias' },
                        order_id: { type: 'string' },
                        orderId: { type: 'string', description: 'camelCase alias' },
                        occurred_at: { type: 'string', format: 'date-time' },
                        occurredAt: { type: 'string', format: 'date-time', description: 'camelCase alias' },
                        referral_code: { type: 'string' },
                        referralCode: { type: 'string', description: 'camelCase alias' },
                        attribution_key: { type: 'string' },
                        attributionKey: { type: 'string', description: 'camelCase alias' },
                        amount_cents: { type: 'integer' },
                        amountCents: { type: 'integer', description: 'camelCase alias' },
                        currency: { type: 'string' },
                        customer_email: { type: 'string', format: 'email' },
                        customerEmail: { type: 'string', format: 'email', description: 'camelCase alias' },
                        event_metadata: { type: 'object', additionalProperties: true },
                        eventMetadata: { type: 'object', additionalProperties: true, description: 'camelCase alias' },
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
