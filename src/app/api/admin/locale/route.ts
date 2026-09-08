import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { t } from '@/i18n';
import { getCatalog } from '@/i18n/catalog.server';
import { setSystemLocale, withSystemLocale } from '@/i18n/runtime.server';
async function isAdmin(request: NextRequest) {
  const id=request.headers.get('x-user-id');
  return !!id && (await prisma.user.findUnique({where:{id},select:{role:true}}))?.role==='ADMIN';
}
export const GET=withSystemLocale(async(request:NextRequest)=>{
  if(!await isAdmin(request)) return NextResponse.json({error:t('Admin access required')},{status:403});
  return NextResponse.json({diagnostics:(await getCatalog()).diagnostics},{headers:{'Cache-Control':'no-store'}});
});
export const PUT=withSystemLocale(async(request:NextRequest)=>{
  if(!await isAdmin(request)) return NextResponse.json({error:t('Admin access required')},{status:403});
  const body=await request.json().catch(()=>null);
  if(typeof body?.locale!=='string' || !Object.hasOwn((await getCatalog(true)).packs,body.locale)) return NextResponse.json({error:t('Unsupported language')},{status:400});
  try {
    await setSystemLocale(body.locale);
    return NextResponse.json({success:true,locale:body.locale});
  } catch {
    return NextResponse.json({error:t('Failed to save the system language')},{status:500});
  }
});
