import { NextRequest, NextResponse } from 'next/server';
import { loadSnapshot } from '@/i18n/runtime.server';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const snapshot=await loadSnapshot();
  const headers={'Cache-Control':'private, no-cache','ETag':`"${snapshot.revision}"`};
  if(request.headers.get('if-none-match')===headers.ETag) return new NextResponse(null,{status:304,headers});
  return NextResponse.json(snapshot,{headers});
}
