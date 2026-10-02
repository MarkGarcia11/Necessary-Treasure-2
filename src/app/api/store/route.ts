import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customRequests, messages, subscribers, orders, products, shows, testimonials, gallery } from '@/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { starterProducts } from '@/lib/catalog';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export async function GET(req:NextRequest){
 const type=req.nextUrl.searchParams.get('type');
 try {
  if(type==='products'){ const rows=await db.select().from(products).where(eq(products.published,true)).orderBy(desc(products.id)); return NextResponse.json(rows.length?rows:starterProducts); }
  if(type==='track'){ const number=req.nextUrl.searchParams.get('number')||''; const email=req.nextUrl.searchParams.get('email')||''; const row=await db.select().from(orders).where(eq(orders.orderNumber,number)); return NextResponse.json(row[0] && row[0].email.toLowerCase()===email.toLowerCase()?row[0]:{error:'We couldn’t find an order with those details.'}); }
  if(type==='shows') return NextResponse.json(await db.select().from(shows).orderBy(shows.date));
  if(type==='testimonials') return NextResponse.json(await db.select().from(testimonials));
  if(type==='gallery') return NextResponse.json(await db.select().from(gallery));
  return NextResponse.json({error:'Unknown request'},{status:400});
 } catch { return NextResponse.json(type==='products'?starterProducts:[]); }
}
export async function POST(req:NextRequest){
 try { const body=await req.json(); const type=String(body.type||'');
  if(type==='newsletter'){ if(!/^\S+@\S+\.\S+$/.test(body.email||'')) return NextResponse.json({error:'Please enter a valid email.'},{status:400}); await db.insert(subscribers).values({email:body.email.toLowerCase()}).onConflictDoNothing(); return NextResponse.json({ok:true}); }
  if(type==='custom'){ if(!body.name||!body.email||!body.idea) return NextResponse.json({error:'Please fill in your name, email, and idea.'},{status:400}); const [row]=await db.insert(customRequests).values({category:body.category||'Not sure',idea:body.idea,details:body.details||'',neededBy:body.neededBy||'',budget:body.budget||'',name:body.name,email:body.email,phone:body.phone||'',contactPreference:body.contactPreference||'email',referenceImages:body.referenceImages||[]}).returning(); await sendEmail(process.env.OWNER_EMAIL||'',`New custom idea from ${body.name}`,`New custom request #${row.id}\nCategory: ${body.category}\nIdea: ${body.idea}\nDetails: ${body.details||'None provided'}\nNeeded by: ${body.neededBy||'Flexible'}\nBudget: ${body.budget||'Not specified'}\nContact: ${body.name} — ${body.email} — ${body.phone||'No phone'}\nPreferred contact: ${body.contactPreference||'email'}\n\nOpen your dashboard to see reference images and update the status.`); return NextResponse.json({ok:true,id:row.id}); }
  if(type==='contact'){ if(!body.name||!body.email||!body.message) return NextResponse.json({error:'Please fill in all required fields.'},{status:400}); await db.insert(messages).values({name:body.name,email:body.email,subject:body.subject||'General inquiry',message:body.message,inbox:body.subject==='Order question'?'sales':'general'}); await sendEmail(body.subject==='Order question'?(process.env.SALES_EMAIL||process.env.OWNER_EMAIL||''):(process.env.OWNER_EMAIL||''),`New message: ${body.subject||'General inquiry'}`,`From ${body.name} <${body.email}>\n\n${body.message}`); return NextResponse.json({ok:true}); }
  if(type==='order'){
   if(!body.name||!body.email||!body.address||!Array.isArray(body.items)||!body.items.length) return NextResponse.json({error:'Please complete your details and cart.'},{status:400});
   const requested=body.items as {id:number;quantity:number;personalization?:string}[];
   if(requested.some(i=>!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>50))return NextResponse.json({error:'Please check your quantities.'},{status:400});
   const orderNumber='NT-'+Date.now().toString(36).toUpperCase();
   let items:{id:number;name:string;price:number;quantity:number;personalization?:string}[]=[];
   let total=0;
   try{
    await db.transaction(async tx=>{
     for(const entry of requested){
      const [p]=await tx.select().from(products).where(eq(products.id,Number(entry.id)));
      if(!p||!p.published||p.stock<entry.quantity)throw new Error('One of your treasures is no longer available in that quantity. Please update your cart.');
      const [updated]=await tx.update(products).set({stock:sql`${products.stock} - ${entry.quantity}`}).where(and(eq(products.id,p.id),gte(products.stock,entry.quantity))).returning();
      if(!updated)throw new Error('One of your treasures was just reserved. Please update your cart.');
      items.push({id:p.id,name:p.name,price:Number(p.price),quantity:entry.quantity,personalization:entry.personalization||''});
     }
     total=items.reduce((sum,i)=>sum+i.price*i.quantity,0);
     await tx.insert(orders).values({orderNumber,name:String(body.name),email:String(body.email),address:String(body.address),items,total:total.toFixed(2)});
    });
   }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'We could not reserve these pieces.'},{status:400})}
   await Promise.all([sendEmail(process.env.SALES_EMAIL||process.env.OWNER_EMAIL||'',`New order reservation ${orderNumber}`,`Order ${orderNumber} from ${body.name} <${body.email}>\nItems: ${items.map(i=>`${i.quantity} × ${i.name}`).join(', ')}\nSubtotal: $${total.toFixed(2)}\nShipping address: ${body.address}\nPlease confirm tax, shipping and secure payment with the customer.`),sendEmail(body.email,`We received your order request ${orderNumber}`,`Hi ${body.name},\n\nThank you for choosing something handmade! We received your reservation ${orderNumber}. Your subtotal is $${total.toFixed(2)}. We'll personally confirm shipping, taxes, and send a secure payment link before we begin. No card details were collected.\n\nWith gratitude,\nNecessary Treasures`)]);
   return NextResponse.json({ok:true,orderNumber,paymentConfigured:false});
  }
  return NextResponse.json({error:'Unknown submission'},{status:400});
 } catch { return NextResponse.json({error:'Something went wrong. Please try again.'},{status:500}); }
}
