import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, customRequests, orders, shows, testimonials, gallery, messages, subscribers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'crypto';

export const dynamic='force-dynamic';
const password=()=>process.env.ADMIN_PASSWORD || 'handmade2026';
const token=()=>createHmac('sha256',process.env.ADMIN_SESSION_SECRET || password()).update('necessary-treasures-admin').digest('hex');
const authorized=(req:NextRequest)=>{ const value=req.cookies.get('nt_admin')?.value||''; const expected=token(); return value.length===expected.length && timingSafeEqual(Buffer.from(value),Buffer.from(expected)); };
export async function GET(req:NextRequest){
 if(!authorized(req)) return NextResponse.json({error:'Unauthorized'},{status:401});
 const type=req.nextUrl.searchParams.get('type')||'dashboard';
 try {
  if(type==='dashboard') { const [p,r,o,s,t,g,m,n]=await Promise.all([db.select().from(products).orderBy(desc(products.id)),db.select().from(customRequests).orderBy(desc(customRequests.id)),db.select().from(orders).orderBy(desc(orders.id)),db.select().from(shows),db.select().from(testimonials),db.select().from(gallery),db.select().from(messages).orderBy(desc(messages.id)),db.select().from(subscribers)]); return NextResponse.json({products:p,requests:r,orders:o,shows:s,testimonials:t,gallery:g,messages:m,subscribers:n}); }
  return NextResponse.json({error:'Unknown view'},{status:400});
 } catch { return NextResponse.json({error:'Could not load dashboard. Check database setup.'},{status:500}); }
}
export async function POST(req:NextRequest){
 const body=await req.json();
 if(body.action==='login'){ if(typeof body.password!=='string'||body.password!==password()) return NextResponse.json({error:'That password doesn’t look right.'},{status:401}); const res=NextResponse.json({ok:true}); res.cookies.set('nt_admin',token(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7}); return res; }
 if(body.action==='logout'){const res=NextResponse.json({ok:true});res.cookies.delete('nt_admin');return res;}
 if(!authorized(req)) return NextResponse.json({error:'Unauthorized'},{status:401});
 try {
  if(body.action==='product') { const value={name:String(body.name||''),slug:String(body.slug||body.name?.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')),category:String(body.category||'candles'),price:String(Number(body.price||0).toFixed(2)),description:String(body.description||''),image:String(body.image||''),images:Array.isArray(body.images)?body.images:[],stock:Number(body.stock||0),oneOfAKind:!!body.oneOfAKind,personalization:!!body.personalization,published:body.published!==false,materials:String(body.materials||''),dimensions:String(body.dimensions||'')}; if(!value.name||!value.image) return NextResponse.json({error:'Name and photo are required.'},{status:400}); if(body.id) await db.update(products).set(value).where(eq(products.id,Number(body.id))); else await db.insert(products).values(value); return NextResponse.json({ok:true}); }
  if(body.action==='seed'){ for(const p of (await import('@/lib/catalog')).starterProducts){await db.insert(products).values({slug:p.slug,name:p.name,category:p.category,price:p.price,description:p.description,image:p.image,images:p.images||[],stock:p.stock,oneOfAKind:!!p.oneOfAKind,personalization:!!p.personalization,published:true,materials:p.materials||'',dimensions:p.dimensions||''}).onConflictDoNothing();}return NextResponse.json({ok:true});}
  if(body.action==='deleteProduct'){await db.delete(products).where(eq(products.id,Number(body.id)));return NextResponse.json({ok:true});}
  if(body.action==='status'){if(body.kind==='request') await db.update(customRequests).set({status:String(body.status)}).where(eq(customRequests.id,Number(body.id))); if(body.kind==='order')await db.update(orders).set({status:String(body.status),trackingNumber:String(body.trackingNumber||'')}).where(eq(orders.id,Number(body.id)));return NextResponse.json({ok:true});}
  if(body.action==='show'){if(body.id)await db.update(shows).set({name:body.name,date:body.date,location:body.location,details:body.details||''}).where(eq(shows.id,Number(body.id)));else await db.insert(shows).values({name:body.name,date:body.date,location:body.location,details:body.details||''});return NextResponse.json({ok:true});}
  if(body.action==='testimonial'){await db.insert(testimonials).values({quote:body.quote,author:body.author,context:body.context||'Customer'});return NextResponse.json({ok:true});}
  if(body.action==='gallery'){await db.insert(gallery).values({image:body.image,title:body.title,category:body.category,productSlug:body.productSlug||''});return NextResponse.json({ok:true});}
  if(body.action==='deleteShow'){await db.delete(shows).where(eq(shows.id,Number(body.id)));return NextResponse.json({ok:true});}
  if(body.action==='deleteTestimonial'){await db.delete(testimonials).where(eq(testimonials.id,Number(body.id)));return NextResponse.json({ok:true});}
  if(body.action==='deleteGallery'){await db.delete(gallery).where(eq(gallery.id,Number(body.id)));return NextResponse.json({ok:true});}
  return NextResponse.json({error:'Unknown action'},{status:400});
 }catch{return NextResponse.json({error:'Could not save. Please check the details and try again.'},{status:500});}
}
