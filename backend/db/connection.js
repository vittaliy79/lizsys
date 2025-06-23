import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function getDb() {
  return open({
    filename: './backend/db/database.sqlite',
    driver: sqlite3.Database,
  });
}