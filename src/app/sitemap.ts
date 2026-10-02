import type {MetadataRoute} from 'next';
import {categories,starterProducts} from '@/lib/catalog';
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL||'https://necessarytreasures.com';const paths=['','shop','gallery','custom-orders','our-story','shows','reviews','faq','shipping-returns','contact','hello',...categories.map(c=>`category/${c.slug}`),...starterProducts.map(p=>`product/${p.slug}`)];return paths.map(path=>({url:`${base}/${path}`,lastModified:new Date(),changeFrequency:path?'monthly':'weekly',priority:path?0.7:1}))}
