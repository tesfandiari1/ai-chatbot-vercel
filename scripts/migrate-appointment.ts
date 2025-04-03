import { sql } from '@vercel/postgres';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  try {
    console.log('Running appointment table migration...');

    // Read the migration SQL
    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), 'lib/db/migrations/appointment-table.sql'),
      'utf8',
    );

    // Execute the migration
    await sql.query(migrationSql);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
