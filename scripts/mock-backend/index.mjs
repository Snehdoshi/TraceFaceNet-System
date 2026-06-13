import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash, randomUUID } from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { sqliteDbPath } from '../db-path.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = sqliteDbPath;

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

const cookieSameSite = (process.env.COOKIE_SAMESITE || 'Lax').trim();
const cookieSecure =
  process.env.COOKIE_SECURE === 'true' || cookieSameSite.toLowerCase() === 'none';
const allowedOrigin = process.env.CORS_ORIGIN || null;

db.exec(`
  CREATE TABLE IF NOT EXISTS missing_persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL DEFAULT 'unknown',
    description TEXT,
    last_seen_location TEXT NOT NULL,
    last_seen_date TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    photo_url TEXT,
    face_embedding TEXT,
    case_number TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    missing_person_id INTEGER,
    missing_person_name TEXT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    similarity REAL,
    location TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    acknowledged_at TEXT
  );

  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_image_url TEXT NOT NULL,
    location TEXT,
    matches TEXT NOT NULL DEFAULT '[]',
    total_matches INTEGER NOT NULL DEFAULT 0,
    search_duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auth_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username_key TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    username_key TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auth_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reset_token TEXT NOT NULL UNIQUE,
    username_key TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const seedMissingCount = Number(db.prepare('SELECT COUNT(*) AS count FROM missing_persons').get().count);
if (seedMissingCount === 0) {
  const now = new Date().toISOString();
  const seedInsert = db.prepare(`
    INSERT INTO missing_persons (
      name, age, gender, description, last_seen_location, last_seen_date,
      contact_name, contact_phone, contact_email, status, photo_url, face_embedding,
      case_number, created_at, updated_at
    ) VALUES (
      @name, @age, @gender, @description, @lastSeenLocation, @lastSeenDate,
      @contactName, @contactPhone, @contactEmail, @status, @photoUrl, @faceEmbedding,
      @caseNumber, @createdAt, @updatedAt
    )
  `);

  const initialMissing = [
    { name: 'John Doe', age: 32, gender: 'male', description: 'Tall, brown hair', lastSeenLocation: 'Main St', lastSeenDate: now, contactName: 'Jane Doe', contactPhone: '+1-555-000-0000', contactEmail: null, status: 'active', photoUrl: null, faceEmbedding: null, caseNumber: 'TFN-2026-100001', createdAt: now, updatedAt: now },
    { name: 'Alice Smith', age: 28, gender: 'female', description: 'Short, glasses', lastSeenLocation: '2nd Ave', lastSeenDate: now, contactName: 'Bob Smith', contactPhone: '+1-555-111-1111', contactEmail: null, status: 'found', photoUrl: null, faceEmbedding: null, caseNumber: 'TFN-2026-100002', createdAt: now, updatedAt: now },
    { name: 'Carlos Ruiz', age: 45, gender: 'male', description: 'Beard', lastSeenLocation: 'Market', lastSeenDate: now, contactName: 'Maria Ruiz', contactPhone: '+1-555-222-2222', contactEmail: null, status: 'closed', photoUrl: null, faceEmbedding: null, caseNumber: 'TFN-2026-100003', createdAt: now, updatedAt: now },
    { name: 'Sarah Johnson', age: 16, gender: 'female', description: 'Red hair, athletic build', lastSeenLocation: 'Downtown Park', lastSeenDate: now, contactName: 'Michael Johnson', contactPhone: '+1-555-333-3333', contactEmail: null, status: 'active', photoUrl: null, faceEmbedding: null, caseNumber: 'TFN-2026-100004', createdAt: now, updatedAt: now },
  ];

  for (const row of initialMissing) {
    seedInsert.run(row);
  }

  db.prepare(`
    INSERT INTO alerts (missing_person_id, missing_person_name, type, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(1, 'John Doe', 'new_case', 'New case', 'pending', now);
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) continue;
    cookies[rawName] = decodeURIComponent(rawValue.join('='));
  }
  return cookies;
}

function jsonResponse(res, obj, status = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;

  const responseOrigin = allowedOrigin || origin;
  res.setHeader('Access-Control-Allow-Origin', responseOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function cookieAttributes() {
  const attributes = ['Path=/', 'HttpOnly', `SameSite=${cookieSameSite}`];
  if (cookieSecure) {
    attributes.push('Secure');
  }
  return attributes.join('; ');
}

function setCookie(res, name, value) {
  res.setHeader('Set-Cookie', `${name}=${encodeURIComponent(value)}; ${cookieAttributes()}`);
}

function clearCookie(res, name) {
  res.setHeader('Set-Cookie', `${name}=; ${cookieAttributes()}; Max-Age=0`);
}

function hashPassword(password) {
  return `${randomUUID()}:${Buffer.from(password).toString('base64')}`;
}

function verifyPassword(storedHash, password) {
  const [, encoded] = String(storedHash).split(':');
  return encoded === Buffer.from(password).toString('base64');
}

function createFingerprint(source) {
  return createHash('sha256').update(source).digest('hex');
}

function isDataUrl(source) {
  return source.startsWith('data:');
}

function isRemoteUrl(source) {
  return /^https?:\/\//i.test(source);
}

async function sourceToBytes(source) {
  if (isDataUrl(source)) {
    const commaIndex = source.indexOf(',');
    const payload = commaIndex >= 0 ? source.slice(commaIndex + 1) : '';
    return Buffer.from(payload, source.includes(';base64,') ? 'base64' : 'utf8');
  }

  if (isRemoteUrl(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  return Buffer.from(source, 'utf8');
}

async function generateFingerprint(source) {
  const bytes = await sourceToBytes(source);
  return createHash('sha256').update(bytes).digest('hex');
}

function normalizeStoredFingerprint(faceEmbedding) {
  const trimmed = String(faceEmbedding).trim();
  if (/^[a-f0-9]{64}$/i.test(trimmed)) return trimmed.toLowerCase();
  return createFingerprint(trimmed);
}

function hammingSimilarity(aHex, bHex) {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;

  let differingBits = 0;
  for (let i = 0; i < length; i++) {
    let xor = a[i] ^ b[i];
    while (xor) {
      differingBits += xor & 1;
      xor >>= 1;
    }
  }

  return Math.max(0, 1 - differingBits / (length * 8));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve(undefined);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function rowToPerson(row) {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    description: row.description ?? null,
    lastSeenLocation: row.last_seen_location,
    lastSeenDate: row.last_seen_date,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email ?? null,
    status: row.status,
    photoUrl: row.photo_url ?? null,
    faceEmbedding: row.face_embedding ?? null,
    caseNumber: row.case_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToAlert(row) {
  return {
    id: row.id,
    missingPersonId: row.missing_person_id ?? null,
    missingPersonName: row.missing_person_name ?? null,
    type: row.type,
    message: row.message,
    status: row.status,
    similarity: row.similarity ?? null,
    location: row.location ?? null,
    createdAt: row.created_at,
    acknowledgedAt: row.acknowledged_at ?? null,
  };
}

function rowToSearch(row, parsedMatches) {
  return {
    id: row.id,
    queryImageUrl: row.query_image_url,
    location: row.location ?? null,
    matches: parsedMatches,
    totalMatches: row.total_matches,
    searchDurationMs: row.search_duration_ms,
    createdAt: row.created_at,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const cookies = parseCookies(req.headers.cookie);

  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (pathname === '/api/healthz' && req.method === 'GET') {
      return jsonResponse(res, { status: 'ok', database: path.basename(dbPath) });
    }

    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await readJson(req);
      const username = typeof body?.username === 'string' ? body.username.trim() : '';
      const password = typeof body?.password === 'string' ? body.password.trim() : '';
      if (!username || !password) {
        return jsonResponse(res, { error: 'validation_error', message: 'Username and password are required' }, 400);
      }

      const usernameKey = username.toLowerCase();
      const existing = db.prepare('SELECT 1 FROM auth_users WHERE username_key = ?').get(usernameKey);
      if (existing) {
        return jsonResponse(res, { error: 'conflict', message: 'Username already exists' }, 409);
      }

      db.prepare('INSERT INTO auth_users (username_key, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(usernameKey, username, hashPassword(password), new Date().toISOString());

      const sessionId = randomUUID();
      db.prepare('INSERT INTO auth_sessions (session_id, username_key, username, created_at) VALUES (?, ?, ?, ?)').run(sessionId, usernameKey, username, new Date().toISOString());
      setCookie(res, 'tfn_session', sessionId);
      return jsonResponse(res, { username }, 201);
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readJson(req);
      const username = typeof body?.username === 'string' ? body.username.trim() : '';
      const password = typeof body?.password === 'string' ? body.password.trim() : '';
      if (!username || !password) {
        return jsonResponse(res, { error: 'validation_error', message: 'Username and password are required' }, 400);
      }

      const usernameKey = username.toLowerCase();
      const user = db.prepare('SELECT * FROM auth_users WHERE username_key = ?').get(usernameKey);
      if (!user || !verifyPassword(user.password_hash, password)) {
        return jsonResponse(res, { error: 'invalid_credentials', message: 'Wrong Username or Password' }, 401);
      }

      const sessionId = randomUUID();
      db.prepare('INSERT INTO auth_sessions (session_id, username_key, username, created_at) VALUES (?, ?, ?, ?)').run(sessionId, user.username_key, user.username, new Date().toISOString());
      setCookie(res, 'tfn_session', sessionId);
      return jsonResponse(res, { username: user.username });
    }

    if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
      const body = await readJson(req);
      const username = typeof body?.username === 'string' ? body.username.trim() : '';
      if (!username) {
        return jsonResponse(res, { error: 'validation_error', message: 'Username is required' }, 400);
      }

      const user = db.prepare('SELECT * FROM auth_users WHERE username_key = ?').get(username.toLowerCase());
      if (!user) {
        return jsonResponse(res, { error: 'not_found', message: 'User not found' }, 404);
      }

      const resetToken = randomUUID();
      db.prepare('INSERT INTO auth_reset_tokens (reset_token, username_key, username, created_at) VALUES (?, ?, ?, ?)').run(resetToken, user.username_key, user.username, new Date().toISOString());
      return jsonResponse(res, { username: user.username, resetToken });
    }

    if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
      const body = await readJson(req);
      const username = typeof body?.username === 'string' ? body.username.trim() : '';
      const resetToken = typeof body?.resetToken === 'string' ? body.resetToken.trim() : '';
      const newPassword = typeof body?.newPassword === 'string' ? body.newPassword.trim() : '';
      if (!username || !resetToken || !newPassword) {
        return jsonResponse(res, { error: 'validation_error', message: 'Username, reset token, and new password are required' }, 400);
      }

      const tokenRow = db.prepare('SELECT * FROM auth_reset_tokens WHERE reset_token = ?').get(resetToken);
      if (!tokenRow || tokenRow.username_key !== username.toLowerCase()) {
        return jsonResponse(res, { error: 'invalid_token', message: 'Reset token is invalid' }, 400);
      }

      const user = db.prepare('SELECT * FROM auth_users WHERE username_key = ?').get(username.toLowerCase());
      if (!user) {
        return jsonResponse(res, { error: 'not_found', message: 'User not found' }, 404);
      }

      db.prepare('UPDATE auth_users SET password_hash = ? WHERE username_key = ?').run(hashPassword(newPassword), user.username_key);
      db.prepare('DELETE FROM auth_reset_tokens WHERE reset_token = ?').run(resetToken);
      return jsonResponse(res, { username: user.username, success: true });
    }

    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const sessionId = cookies.tfn_session;
      if (!sessionId) return jsonResponse(res, { error: 'unauthorized', message: 'Not authenticated' }, 401);

      const session = db.prepare('SELECT * FROM auth_sessions WHERE session_id = ?').get(sessionId);
      if (!session) return jsonResponse(res, { error: 'unauthorized', message: 'Not authenticated' }, 401);

      return jsonResponse(res, { username: session.username, createdAt: session.created_at });
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const sessionId = cookies.tfn_session;
      if (sessionId) {
        db.prepare('DELETE FROM auth_sessions WHERE session_id = ?').run(sessionId);
      }
      clearCookie(res, 'tfn_session');
      return jsonResponse(res, { success: true });
    }

    if (pathname === '/api/missing-persons' && req.method === 'GET') {
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      const allRows = db.prepare('SELECT * FROM missing_persons ORDER BY created_at DESC').all();
      const filteredRows = status ? allRows.filter((row) => row.status === status) : allRows;
      const paginatedRows = filteredRows.slice(offset, offset + limit);

      return jsonResponse(res, {
        data: paginatedRows.map(rowToPerson),
        total: filteredRows.length,
        limit,
        offset,
      });
    }

    const missingIdMatch = pathname.match(/^\/api\/missing-persons\/(\d+)$/);
    if (missingIdMatch) {
      const id = Number(missingIdMatch[1]);

      if (req.method === 'GET') {
        const row = db.prepare('SELECT * FROM missing_persons WHERE id = ?').get(id);
        if (!row) return jsonResponse(res, { error: 'not_found' }, 404);
        return jsonResponse(res, rowToPerson(row));
      }

      if (req.method === 'DELETE') {
        const existing = db.prepare('SELECT * FROM missing_persons WHERE id = ?').get(id);
        if (!existing) return jsonResponse(res, { error: 'not_found' }, 404);
        db.prepare('DELETE FROM missing_persons WHERE id = ?').run(id);
        return jsonResponse(res, { success: true, message: 'Record deleted successfully' });
      }

      if (req.method === 'PUT') {
        const body = await readJson(req);
        const existing = db.prepare('SELECT * FROM missing_persons WHERE id = ?').get(id);
        if (!existing) return jsonResponse(res, { error: 'not_found' }, 404);

        const nextPhotoUrl = body.photoUrl === undefined ? existing.photo_url : body.photoUrl;
        const nextFaceEmbedding = nextPhotoUrl ? await generateFingerprint(nextPhotoUrl) : null;

        db.prepare(`
          UPDATE missing_persons SET
            name = ?, age = ?, gender = ?, description = ?, last_seen_location = ?, last_seen_date = ?,
            contact_name = ?, contact_phone = ?, contact_email = ?, status = ?, photo_url = ?, face_embedding = ?,
            updated_at = ?
          WHERE id = ?
        `).run(
          typeof body.name === 'string' ? body.name : existing.name,
          typeof body.age === 'number' ? body.age : existing.age,
          typeof body.gender === 'string' ? body.gender : existing.gender,
          body.description ?? existing.description,
          typeof body.lastSeenLocation === 'string' ? body.lastSeenLocation : existing.last_seen_location,
          typeof body.lastSeenDate === 'string' ? body.lastSeenDate : existing.last_seen_date,
          typeof body.contactName === 'string' ? body.contactName : existing.contact_name,
          typeof body.contactPhone === 'string' ? body.contactPhone : existing.contact_phone,
          body.contactEmail ?? existing.contact_email,
          typeof body.status === 'string' ? body.status : existing.status,
          nextPhotoUrl,
          nextFaceEmbedding,
          new Date().toISOString(),
          id,
        );

        const updated = db.prepare('SELECT * FROM missing_persons WHERE id = ?').get(id);

        if (body.status && body.status !== existing.status) {
          const statusMessages = {
            found: `Missing person ${updated.name} (${updated.case_number}) has been found!`,
            closed: `Case ${updated.case_number} for ${updated.name} has been closed.`,
            active: `Case ${updated.case_number} for ${updated.name} has been re-opened.`,
          };
          const alertType = body.status === 'found' ? 'case_updated' : 'case_closed';
          db.prepare(`
            INSERT INTO alerts (missing_person_id, missing_person_name, type, message, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', ?)
          `).run(id, updated.name, alertType, statusMessages[body.status] ?? `Case status updated for ${updated.name}`, new Date().toISOString());
        }

        return jsonResponse(res, rowToPerson(updated));
      }
    }

    if (pathname === '/api/missing-persons' && req.method === 'POST') {
      const body = await readJson(req);
      const now = new Date().toISOString();
      const photoUrl = body.photoUrl ?? null;
      const faceEmbedding = photoUrl ? await generateFingerprint(photoUrl) : null;
      const caseNumber = `TFN-2026-${String(Date.now()).slice(-6)}`;

      const result = db.prepare(`
        INSERT INTO missing_persons (
          name, age, gender, description, last_seen_location, last_seen_date,
          contact_name, contact_phone, contact_email, status, photo_url, face_embedding,
          case_number, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
      `).run(
        typeof body.name === 'string' ? body.name : 'Unknown',
        typeof body.age === 'number' ? body.age : 0,
        typeof body.gender === 'string' ? body.gender : 'unknown',
        body.description ?? null,
        typeof body.lastSeenLocation === 'string' ? body.lastSeenLocation : '',
        typeof body.lastSeenDate === 'string' ? body.lastSeenDate : now,
        typeof body.contactName === 'string' ? body.contactName : '',
        typeof body.contactPhone === 'string' ? body.contactPhone : '',
        body.contactEmail ?? null,
        photoUrl,
        faceEmbedding,
        caseNumber,
        now,
        now,
      );

      const inserted = db.prepare('SELECT * FROM missing_persons WHERE id = ?').get(result.lastInsertRowid);
      db.prepare(`
        INSERT INTO alerts (missing_person_id, missing_person_name, type, message, status, created_at)
        VALUES (?, ?, 'new_case', ?, 'pending', ?)
      `).run(
        inserted.id,
        inserted.name,
        `New missing person case registered: ${inserted.name} (${inserted.case_number})`,
        now,
      );

      return jsonResponse(res, rowToPerson(inserted), 201);
    }

    if (pathname === '/api/alerts' && req.method === 'GET') {
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);

      const rows = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all();
      const filteredRows = status ? rows.filter((row) => row.status === status) : rows;
      const paginatedRows = filteredRows.slice(0, limit);

      return jsonResponse(res, {
        data: paginatedRows.map(rowToAlert),
        total: filteredRows.length,
        unread: rows.filter((row) => row.status === 'pending').length,
      });
    }

    const alertIdMatch = pathname.match(/^\/api\/alerts\/(\d+)$/);
    if (alertIdMatch && req.method === 'PUT') {
      const id = Number(alertIdMatch[1]);
      const body = await readJson(req);
      const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
      if (!existing) return jsonResponse(res, { error: 'not_found' }, 404);

      db.prepare('UPDATE alerts SET status = ?, acknowledged_at = ? WHERE id = ?').run(body.status ?? existing.status, body.status === 'acknowledged' && !existing.acknowledged_at ? new Date().toISOString() : existing.acknowledged_at, id);

      const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
      return jsonResponse(res, rowToAlert(updated));
    }

    if (pathname === '/api/searches' && req.method === 'POST') {
      const body = await readJson(req);
      const threshold = typeof body?.confidence === 'number' ? body.confidence : 0.6;
      const startTime = Date.now();
      const queryFingerprint = await generateFingerprint(body.queryImageUrl);

      const persons = db.prepare('SELECT * FROM missing_persons WHERE status = ?').all('active');
      const matches = [];

      for (const person of persons) {
        if (!person.face_embedding) continue;

        const storedFingerprint = normalizeStoredFingerprint(person.face_embedding);
        const similarity = hammingSimilarity(queryFingerprint, storedFingerprint);
        if (similarity >= threshold) {
          matches.push({
            missingPersonId: person.id,
            missingPersonName: person.name,
            similarity: Math.round(similarity * 1000) / 1000,
            confidence: similarity >= 0.85 ? 'high' : similarity >= 0.7 ? 'medium' : 'low',
            photoUrl: person.photo_url ?? null,
            caseNumber: person.case_number,
            lastSeenLocation: person.last_seen_location,
          });
        }
      }

      matches.sort((a, b) => b.similarity - a.similarity);
      const topMatches = matches.slice(0, 10);
      const searchDurationMs = Date.now() - startTime;

      const insertResult = db.prepare(`
        INSERT INTO searches (query_image_url, location, matches, total_matches, search_duration_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(body.queryImageUrl, body.location ?? null, JSON.stringify(topMatches), topMatches.length, searchDurationMs, new Date().toISOString());

      for (const match of topMatches.filter((m) => m.confidence === 'high')) {
        db.prepare(`
          INSERT INTO alerts (missing_person_id, missing_person_name, type, message, status, similarity, location, created_at)
          VALUES (?, ?, 'match_found', ?, 'pending', ?, ?, ?)
        `).run(
          match.missingPersonId,
          match.missingPersonName,
          `High-confidence face match found for ${match.missingPersonName} (${match.caseNumber}) — similarity: ${(match.similarity * 100).toFixed(1)}%`,
          match.similarity,
          body.location ?? null,
          new Date().toISOString(),
        );
      }

      return jsonResponse(res, {
        id: insertResult.lastInsertRowid,
        queryImageUrl: body.queryImageUrl,
        location: body.location ?? null,
        matches: topMatches,
        totalMatches: topMatches.length,
        searchDurationMs,
        createdAt: new Date().toISOString(),
      });
    }

    if (pathname === '/api/searches' && req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const rows = db.prepare('SELECT * FROM searches ORDER BY created_at DESC LIMIT ?').all(limit);
      const formatted = rows.map((row) => {
        let matches = [];
        try {
          matches = JSON.parse(row.matches);
        } catch {
          matches = [];
        }
        return rowToSearch(row, matches);
      });

      return jsonResponse(res, { data: formatted, total: formatted.length });
    }

    if (pathname === '/api/stats' && req.method === 'GET') {
      const totalCases = Number(db.prepare('SELECT COUNT(*) AS count FROM missing_persons').get().count);
      const activeCases = Number(db.prepare("SELECT COUNT(*) AS count FROM missing_persons WHERE status = 'active'").get().count);
      const foundCases = Number(db.prepare("SELECT COUNT(*) AS count FROM missing_persons WHERE status = 'found'").get().count);
      const closedCases = Number(db.prepare("SELECT COUNT(*) AS count FROM missing_persons WHERE status = 'closed'").get().count);
      const totalSearches = Number(db.prepare('SELECT COUNT(*) AS count FROM searches').get().count);
      const totalAlerts = Number(db.prepare('SELECT COUNT(*) AS count FROM alerts').get().count);
      const pendingAlerts = Number(db.prepare("SELECT COUNT(*) AS count FROM alerts WHERE status = 'pending'").get().count);

      return jsonResponse(res, {
        totalCases,
        activeCases,
        foundCases,
        closedCases,
        totalSearches,
        totalAlerts,
        pendingAlerts,
        recentMatches: 0,
      });
    }

    jsonResponse(res, { error: 'not_found' }, 404);
  } catch (err) {
    jsonResponse(res, { error: 'internal_error', message: String(err) }, 500);
  }
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`SQLite-backed mock backend listening on http://localhost:${port}`));
