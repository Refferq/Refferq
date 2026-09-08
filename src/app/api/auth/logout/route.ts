import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';

 async function POSTHandler(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: __tr("Logged out successfully")
    });

    // Clear the auth token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0) // Expire immediately
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: __tr("Logout failed") },
      { status: 500 }
    );
  }
}
export const POST = withSystemLocale(POSTHandler);
