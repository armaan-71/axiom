import pg from 'pg';

const { Pool } = pg;

// Use environment variables for production; default to local for now
// Use DATABASE_URL if provided (e.g., Supabase/Neon), otherwise fallback to manual config
const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'axiom',
    };

const pool = new Pool(poolConfig);

export default pool;
