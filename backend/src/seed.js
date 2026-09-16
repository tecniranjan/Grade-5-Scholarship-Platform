// Database seed script - runs schema.sql + seed.sql
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
    await client.query(schema);
    console.log('Schema applied.');

    // Run seed data if it exists
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await client.query(seedSql);
      console.log('Seed data inserted.');
    } else {
      console.log('No seed.sql found, skipping seed data.');
    }

    console.log('Database ready.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
