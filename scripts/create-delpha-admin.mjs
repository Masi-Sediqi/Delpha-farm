import 'dotenv/config';
import pg from 'pg';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
const scrypt = promisify(scryptCallback);
const rl = readline.createInterface({ input: stdin, output: stdout });
try {
  const email = (await rl.question('New admin email: ')).trim().toLowerCase();
  const fullName = (await rl.question('Admin full name: ')).trim();
  const password = await rl.question('Admin password (visible in terminal, hide screen): ');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName || password.length < 12) throw new Error('Invalid email/name or password shorter than 12 chars.');
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)).toString('hex');
  const pool = new pg.Pool({ host: process.env.PGHOST, port: +(process.env.PGPORT || 5432), database: process.env.PGDATABASE, user: process.env.PGUSER, password: process.env.PGPASSWORD });
  try {
    const result = await pool.query(`INSERT INTO delpha_users(email,full_name,password_hash,role,status)
      VALUES ($1,$2,$3,'Admin','Active') ON CONFLICT(email) DO NOTHING RETURNING id`, [email,fullName,`${salt}:${hash}`]);
    if (!result.rowCount) throw new Error('Admin email already exists; no account changed.');
    console.log(`Admin created: ${email} (id ${result.rows[0].id})`);
  } finally { await pool.end(); }
} catch(error) { console.error(error.message); process.exitCode = 1; } finally { rl.close(); }
