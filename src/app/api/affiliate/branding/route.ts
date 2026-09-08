import { withSystemLocale } from '@/i18n/runtime.server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

 async function GETHandler(request: NextRequest) {
  try {
    const settings = await prisma.programSettings.findFirst({
      select: {
        companyName: true,
        companyLogo: true,
        brandBackgroundColor: true,
        brandButtonColor: true,
        brandTextColor: true,
      },
    });

    return NextResponse.json({
      success: true,
      settings: settings || {},
    });
  } catch (error) {
    console.error('Failed to fetch branding:', error);
    return NextResponse.json({
      success: true,
      settings: {},
    });
  }
}

export const GET = withSystemLocale(GETHandler);
