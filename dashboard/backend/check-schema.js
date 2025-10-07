import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  try {
    console.log('=== CUSTOMERS TABLE COLUMNS ===');
    const customerCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'quickbooks' AND table_name = 'customers' ORDER BY ordinal_position`;
    customerCols.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));
    
    console.log('\n=== INVOICES TABLE COLUMNS ===');
    const invoiceCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'quickbooks' AND table_name = 'invoices' ORDER BY ordinal_position`;
    invoiceCols.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));
    
    console.log('\n=== ITEMS TABLE COLUMNS ===');
    const itemCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'quickbooks' AND table_name = 'items' ORDER BY ordinal_position`;
    itemCols.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkSchema();

