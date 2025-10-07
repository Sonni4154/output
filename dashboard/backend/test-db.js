import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function testDb() {
  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'quickbooks'`;
    console.log('Tables in quickbooks schema:', tables);
    
    if (tables.length > 0) {
      const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'quickbooks' AND table_name = 'tokens' ORDER BY ordinal_position`;
      console.log('Columns in tokens table:', columns);
    } else {
      console.log('No tables found in quickbooks schema!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testDb();

