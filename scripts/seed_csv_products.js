import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import pkg from 'pg';
const { Client } = pkg;

const password = process.env.DB_PASSWORD || '1zScCo06b1wOmsmd';
const projectRef = 'voyatlhmdfbkpisdyqzy';
const connStr = `postgres://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

const csvFilePath = '/home/daniel/Downloads/products_Actualizacion pesos_08102026 - products_Actualizacion pesos_08102026.csv';

function cleanHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

function mapCategory(rawCat) {
  const c = rawCat.toUpperCase();
  if (c.includes('PREMIUM')) return 'Papel Higiénico Premium';
  if (c.includes('HIGIENICO') || c.includes('HIGIÉNICO')) return 'Papel Higiénico Comercial';
  if (c.includes('SERVILLETAS')) return 'Servilletas de Mesa';
  if (c.includes('TOALLAS')) return 'Toallas Absorbentes e Industriales';
  if (c.includes('PAÑUELOS') || c.includes('PERSONAL')) return 'Cuidado Personal & Pañuelos';
  return 'Institucional & General';
}

function generateSku(name, category, index) {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean);
  const prefix = words[0] ? words[0].substring(0, 3).toUpperCase() : 'MNP';
  const num = name.match(/\d+/g) ? name.match(/\d+/g).join('') : (index + 100).toString();
  return `MNP-${prefix}-${num.substring(0, 4)}-${index + 1}`;
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function getCommercialPricing(name, category) {
  const n = name.toLowerCase();
  if (n.includes('500') && n.includes('12')) return { price: 38.50, moq: 12, step: 12 };
  if (n.includes('500')) return { price: 32.00, moq: 24, step: 24 };
  if (n.includes('400')) return { price: 28.50, moq: 24, step: 24 };
  if (n.includes('300')) return { price: 24.00, moq: 24, step: 24 };
  if (n.includes('200')) return { price: 19.50, moq: 36, step: 36 };
  if (n.includes('toalla') && n.includes('180')) return { price: 29.00, moq: 12, step: 12 };
  if (n.includes('toalla')) return { price: 22.50, moq: 24, step: 24 };
  if (n.includes('servilleta')) return { price: 16.80, moq: 36, step: 24 };
  if (n.includes('pañuelo')) return { price: 18.00, moq: 20, step: 10 };
  return { price: 21.00, moq: 24, step: 24 };
}

async function seedProductsFromCsv() {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase DB for CSV product import...');

    const rawRows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => rawRows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📦 Loaded ${rawRows.length} rows from CSV.`);

    let importedCount = 0;
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rawName = row['Product name'] ? row['Product name'].trim() : '';
      if (!rawName) continue;

      const category = mapCategory(row['Category'] || '');
      const description = cleanHtml(row['Description'] || row['Short description'] || '');
      const imageUrl = row['Image URL'] ? row['Image URL'].trim() : '';
      const sku = generateSku(rawName, category, i + 1);
      const slug = generateSlug(rawName);
      const { price, moq, step } = getCommercialPricing(rawName, category);

      // Insert product
      const query = `
        INSERT INTO public.products (
          id, sku, name, slug, category, description, images, stock, min_order_qty, qty_step, base_price, is_active
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, ARRAY[$6], $7, $8, $9, $10, true
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          images = EXCLUDED.images,
          base_price = EXCLUDED.base_price,
          min_order_qty = EXCLUDED.min_order_qty,
          qty_step = EXCLUDED.qty_step;
      `;

      await client.query(query, [
        sku,
        rawName,
        slug,
        category,
        description,
        imageUrl,
        1500 + Math.floor(Math.random() * 2000), // realistic stock
        moq,
        step,
        price
      ]);

      // Seed bulk volume discount tiers for each product
      const productRes = await client.query('SELECT id FROM public.products WHERE slug = $1', [slug]);
      if (productRes.rows.length > 0) {
        const prodId = productRes.rows[0].id;
        await client.query(`
          INSERT INTO public.price_tiers (product_id, min_quantity, discount_percentage)
          VALUES 
            ($1, $2, 5.00),
            ($1, $3, 10.00)
          ON CONFLICT DO NOTHING;
        `, [prodId, moq * 2, moq * 5]);
      }

      importedCount++;
      console.log(`✔ [${importedCount}] Imported: ${rawName} (${category})`);
    }

    console.log(`\n🎉 SUCCESS! ${importedCount} OFFICIAL MANPA PRODUCTS SEEDED TO SUPABASE DATABASE!`);
  } catch (err) {
    console.error('❌ Error seeding CSV products:', err);
  } finally {
    await client.end();
  }
}

seedProductsFromCsv();
