import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{const base=process.env.NEXT_PUBLIC_SITE_URL||'https://necessarytreasures.com';return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/checkout','/cart','/order-confirmation']},sitemap:`${base}/sitemap.xml`}}
