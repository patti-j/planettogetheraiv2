import { db } from './db';
import { sql } from 'drizzle-orm';

async function seedOperations() {
  console.log('🌱 Seeding production operations...');
  