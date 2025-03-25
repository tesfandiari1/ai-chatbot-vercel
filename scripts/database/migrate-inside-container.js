#!/usr/bin/env node
const { exec } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Function to execute shell commands
function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve(stdout.trim());
    });
  });
}

// Function to create migration SQL files in the container
async function createMigrationScript() {
  try {
    console.log('Creating migration script...');

    // Check if migration files exist
    const migrationsDir = path.join(__dirname, 'lib', 'db', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    // Get list of migration SQL files
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      throw new Error('No SQL migration files found');
    }

    console.log(`Found ${migrationFiles.length} migration files.`);

    // Create a SQL script that executes all migrations
    let combinedScript = '-- Combined migration script\n\n';
    combinedScript += 'SET client_min_messages TO WARNING;\n\n';

    migrationFiles.forEach((file) => {
      const filePath = path.join(migrationsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      combinedScript += `-- Applying migration: ${file}\n`;
      combinedScript += fileContent;
      combinedScript += '\n\n';
    });

    // Write the combined script to a temporary file
    const tempFile = path.join(__dirname, 'combined_migrations.sql');
    fs.writeFileSync(tempFile, combinedScript);
    console.log(`Combined migration script written to ${tempFile}`);

    return tempFile;
  } catch (err) {
    console.error('Error creating migration script:', err);
    throw err;
  }
}

// Function to copy the SQL file to the container and run it
async function runMigrationsInContainer(sqlFile) {
  try {
    // First copy the file to the container
    await execCommand(
      `docker cp ${sqlFile} uniwise-postgres:/combined_migrations.sql`,
    );
    console.log('Migration script copied to container');

    // Execute the SQL inside the container
    await execCommand(
      `docker exec uniwise-postgres psql -U postgres -d uniwise -f /combined_migrations.sql`,
    );
    console.log('Migrations applied successfully in container');

    return true;
  } catch (err) {
    console.error('Error running migrations in container:', err);
    throw err;
  }
}

// Main function
async function main() {
  try {
    // Create the combined migration script
    const migrationScript = await createMigrationScript();

    // Run migrations inside the container
    await runMigrationsInContainer(migrationScript);

    // Cleanup
    fs.unlinkSync(migrationScript);
    console.log('Temporary migration file removed');

    console.log('\n✅ Database migrations completed successfully!');
    console.log('You can now continue with your local deployment.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run the script
main();
