CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT CHECK(type IN ('individual', 'legal')) NOT NULL DEFAULT 'individual',
  documentNumber TEXT
);
