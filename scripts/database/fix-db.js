#!/usr/bin/env node
const { exec } = require('node:child_process');
const { spawn } = require('node:child_process');

// Get the current username from the system
const username = require('node:os').userInfo().username;
console.log(`Current system username: ${username}`);

// Function to execute shell commands
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

// Function to create a database user
async function createDbUser() {
  try {
    console.log('Creating database user with your system username...');

    // Create the user
    await execCommand(
      `docker exec uniwise-postgres psql -c "CREATE USER ${username} WITH SUPERUSER PASSWORD '${username}';" -U postgres`,
    );
    console.log(`Created PostgreSQL user: ${username}`);

    // Grant privileges
    await execCommand(
      `docker exec uniwise-postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE uniwise TO ${username};" -U postgres`,
    );
    console.log('Granted privileges on uniwise database');

    return true;
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(`User ${username} already exists, continuing...`);
      return true;
    }
    console.error('Error creating database user:', err);
    return false;
  }
}

// Function to run migrations with the new user
async function runMigrations() {
  console.log('Running migrations with your username...');

  // New connection string using your system username
  const connectionString = `postgres://${username}:${username}@localhost:5432/uniwise`;
  console.log(`Using connection string: ${connectionString}`);

  // Run the migration script with the new connection string
  const migrate = spawn('npx', ['tsx', 'lib/db/migrate.ts'], {
    env: { ...process.env, POSTGRES_URL: connectionString },
  });

  migrate.stdout.pipe(process.stdout);
  migrate.stderr.pipe(process.stderr);

  return new Promise((resolve, reject) => {
    migrate.on('close', (code) => {
      if (code === 0) {
        console.log('Migrations completed successfully!');
        resolve(true);
      } else {
        console.error(`Migrations failed with code ${code}`);
        reject(new Error(`Migrations failed with code ${code}`));
      }
    });
  });
}

// Main function
async function main() {
  try {
    // First, create a database user with your system username
    const userCreated = await createDbUser();
    if (!userCreated) {
      console.error('Failed to create database user');
      process.exit(1);
    }

    // Then run migrations with the new user
    await runMigrations();

    console.log('\n✅ Database setup completed successfully!');
    console.log(`\nYou should update your .env.local file with:`);
    console.log(
      `POSTGRES_URL=postgres://${username}:${username}@localhost:5432/uniwise`,
    );
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

// Run the script
main();
