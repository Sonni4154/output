import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkCalendarSchema() {
  try {
    console.log('=== CHECKING FOR CALENDAR/SCHEDULE TABLES ===\n');
    
    // Check all tables
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' OR table_schema = 'quickbooks' ORDER BY table_schema, table_name`;
    
    console.log('All tables in database:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    console.log('\n=== SEARCHING FOR CALENDAR-RELATED TABLES ===');
    const calendarTables = tables.filter(t => 
      t.table_name.toLowerCase().includes('calendar') ||
      t.table_name.toLowerCase().includes('schedule') ||
      t.table_name.toLowerCase().includes('event') ||
      t.table_name.toLowerCase().includes('task') ||
      t.table_name.toLowerCase().includes('appointment')
    );
    
    if (calendarTables.length > 0) {
      console.log('Found calendar-related tables:');
      for (const table of calendarTables) {
        console.log(`\n  Table: ${table.table_name}`);
        const columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ${table.table_name} ORDER BY ordinal_position`;
        columns.forEach(col => console.log(`    - ${col.column_name}: ${col.data_type}`));
      }
    } else {
      console.log('No calendar-related tables found.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkCalendarSchema();

