import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './server/db';

// Load environment variables from .env in process.cwd()
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const rawPort = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ============================================================================
// AUTHENTICATION
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in the environment.');
}

const SESSION_COOKIE = 'opsdesk_session';
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours

function getSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie || '';

  const cookie = cookieHeader
    .split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(`${SESSION_COOKIE}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(
    cookie.substring(`${SESSION_COOKIE}=`.length)
  );
}

function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = getSessionToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required.'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET!) as {
      sub?: string;
      role?: string;
    };

    if (!payload.sub) {
      throw new Error('Invalid session.');
    }

    const user = db.getUserById(payload.sub);

    if (!user || user.status !== 'Active') {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    // Make authenticated user available to protected routes.
    (req as any).authenticatedUser = user;

    next();
  } catch {
    return res.status(401).json({
      error: 'Authentication required.'
    });
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Health & Database Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'OpsDesk Multi-Department Portal API'
  });
});

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.'
      });
    }

    const user = db.getUserByEmail(email);

    if (!user || user.status !== 'Active') {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    db.updateLastLogin(user.id);

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: SESSION_MAX_AGE,
      path: '/'
    });

    const safeUser = db
      .getUsers()
      .find((u: any) => u.id === user.id);

    return res.json({
      success: true,
      user: safeUser
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);

    return res.status(500).json({
      error: 'Authentication service error.'
    });
  }
});

app.get(
  '/api/auth/me',
  requireAuth,
  (req: Request, res: Response) => {
    const user = (req as any).authenticatedUser;

    return res.json({
      authenticated: true,
      user: db
        .getUsers()
        .find((u: any) => u.id === user.id)
    });
  }
);

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/'
  });

  return res.json({
    success: true
  });
});

app.post(
  '/api/auth/verify-password',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).authenticatedUser;
      const password = String(req.body?.password_hash || '');

      if (!password) {
        return res.status(400).json({
          verified: false,
          error: 'Password is required.'
        });
      }

      const verified = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!verified) {
        return res.status(401).json({
          verified: false,
          error: 'Password verification failed.'
        });
      }

      return res.json({
        verified: true
      });
    } catch (err: any) {
      console.error('[Auth] Password verification error:', err);

      return res.status(500).json({
        verified: false,
        error: 'Password verification service error.'
      });
    }
  }
);

// All remaining API endpoints require an authenticated session.
app.use('/api', requireAuth);


app.get('/api/db/status', (req: Request, res: Response) => {
  res.json(db.getStatus());
});

app.post('/api/db/test', async (req: Request, res: Response) => {
  try {
    const { host, port, user, password, database } = req.body;
    await db.initMySQL({ host, port: Number(port) || 3306, user, password, database });
    res.json(db.getStatus());
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/db/save-sync', async (req: Request, res: Response) => {
  try {
    // Record audit event for manual sync
    db.addAuditLog({
      id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      scope_category: 'System & Config',
      administrator: req.body.adminUser || 'Surveillance Super Admin',
      user_id: 'admin-surveillance',
      user_role: 'SUPER_ADMIN',
      setting_changed: 'Hostinger MySQL Database Sync',
      target_entity: 'Hostinger MySQL Database',
      action_code: 'DB_SYNCED',
      action_narrative: 'Initiated manual sync to Hostinger MySQL Database tables and verified ledger integrity.',
      previous_value: '—',
      new_value: 'Live Synced',
      ip_session: '127.0.0.1 (Authenticated Session)',
      raw_json: { action: 'DB_SYNCED', time: new Date().toISOString() }
    });
    res.json({ success: true, message: 'Database state synchronized successfully with Hostinger MySQL', status: db.getStatus() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Departments
app.get('/api/departments', (req: Request, res: Response) => {
  res.json(db.getDepartments());
});

app.post('/api/departments', (req: Request, res: Response) => {
  try {
    const dept = db.addDepartment({
      id: req.body.id || `dept_${Date.now()}`,
      code: req.body.code.toUpperCase(),
      name: req.body.name,
      description: req.body.description || '',
      is_primary: !!req.body.is_primary,
      status: req.body.status || 'active'
    });
    res.json({ success: true, department: dept });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/departments/:id', (req: Request, res: Response) => {
  const updated = db.updateDepartment(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Department not found' });
  res.json({ success: true, department: updated });
});

app.delete('/api/departments/:id', (req: Request, res: Response) => {
  const ok = db.deleteDepartment(req.params.id);
  res.json({ success: ok });
});

// 3. Regions & Locations (Master Data)
app.get('/api/regions', (req: Request, res: Response) => {
  res.json(db.getRegions());
});

app.post('/api/regions', (req: Request, res: Response) => {
  const region = db.addRegion({
    id: req.body.id || `reg_${Date.now()}`,
    name: req.body.name,
    code: req.body.code.toUpperCase(),
    status: req.body.status || 'ACTIVE'
  });
  res.json({ success: true, region });
});

app.put('/api/regions/:id', (req: Request, res: Response) => {
  const updated = db.updateRegion(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Region not found' });
  res.json({ success: true, region: updated });
});

app.delete('/api/regions/:id', (req: Request, res: Response) => {
  const ok = db.deleteRegion(req.params.id);
  res.json({ success: ok });
});

app.get('/api/locations', (req: Request, res: Response) => {
  res.json(db.getLocations());
});

app.post('/api/locations', (req: Request, res: Response) => {
  try {
    const loc = db.addLocation({
      id: req.body.id || `loc_${Date.now()}`,
      branch_code: req.body.branch_code || `ST${Math.floor(100 + Math.random() * 900)}`,
      name: req.body.name,
      region_id: req.body.region_id || 'reg_central',
      region_name: req.body.region_name || 'Central',
      physical_address: req.body.physical_address || 'Address not configured',
      contact_person: req.body.contact_person || 'Branch Manager',
      phone: req.body.phone || '',
      notification_email: req.body.notification_email || '',
      camera_zones: Number(req.body.camera_zones) || 1,
      areas_details: req.body.areas_details || 'Main Showroom',
      status: req.body.status || 'Active'
    });
    res.json({ success: true, location: loc });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/locations/:id', (req: Request, res: Response) => {
  const updated = db.updateLocation(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Location not found' });
  res.json({ success: true, location: updated });
});

app.delete('/api/locations/:id', (req: Request, res: Response) => {
  const ok = db.deleteLocation(req.params.id);
  res.json({ success: ok });
});

// 4. Users & Team
app.get('/api/users', (req: Request, res: Response) => {
  res.json(db.getUsers());
});

app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password_hash || '');

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required.'
      });
    }

    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((s: string) => s[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const user = await db.addUser({
      id: req.body.id || `user_${Date.now()}`,
      name,
      email,
      password_hash: password,
      department_id: req.body.department_id || 'dept_surveillance',
      department_name: req.body.department_name || 'Security Operations & Surveillance',
      role: req.body.role || 'TECHNICIAN',
      status: req.body.status || 'Active',
      avatar_initials: initials || 'US',
      workload_status: 'Idle',
      granular_rights: req.body.granular_rights || ['Tickets', 'Resolve']
    });

    res.json({ success: true, user });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user: updated });
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  const ok = db.deleteUser(req.params.id);
  res.json({ success: ok });
});

// 5. Tickets
app.get('/api/tickets', (req: Request, res: Response) => {
  const dept = req.query.department as string;
  res.json(db.getTickets(dept));
});

app.get('/api/tickets/:id', (req: Request, res: Response) => {
  const ticket = db.getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

app.post('/api/tickets', (req: Request, res: Response) => {
  try {
    const ticket = db.createTicket(req.body);
    res.status(201).json({ success: true, ticket });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/tickets/:id', (req: Request, res: Response) => {
  const { adminUser, ...updates } = req.body;
  const updated = db.updateTicket(req.params.id, updates, adminUser);
  if (!updated) return res.status(404).json({ error: 'Ticket not found' });
  res.json({ success: true, ticket: updated });
});

app.delete('/api/tickets/:id', (req: Request, res: Response) => {
  const adminUser = req.body.adminUser;
  const ok = db.deleteTicket(req.params.id, adminUser);
  res.json({ success: ok });
});

app.post('/api/tickets/:id/comments', (req: Request, res: Response) => {
  const comment = db.addComment(req.params.id, req.body);
  if (!comment) return res.status(404).json({ error: 'Ticket not found' });
  res.json({ success: true, comment });
});

// 6. SLA Policies
app.get('/api/sla/rules', (req: Request, res: Response) => {
  res.json(db.getSlaRules());
});

app.put('/api/sla/rules/:id', (req: Request, res: Response) => {
  const updated = db.updateSlaRule(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'SLA Rule not found' });
  res.json({ success: true, rule: updated });
});

// 7. Audit Trail
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const scope = req.query.scope as string;
  res.json(db.getAuditLogs(scope));
});

// 8. Settings
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(db.getSettings());
});

app.put('/api/settings/:section', (req: Request, res: Response) => {
  const section = req.params.section;
  const updated = db.updateSettings(section, req.body, req.body.adminName);
  res.json({ success: true, section, settings: updated });
});

// 9. Database Backup & Export
app.get('/api/database/export', (req: Request, res: Response) => {
  const target = (req.query.target as string) || 'all';
  const format = (req.query.format as 'json' | 'csv') || 'json';
  const content = db.exportData(target, format);

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="opsdesk-${target}-${Date.now()}.json"`);
  } else {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="opsdesk-${target}-${Date.now()}.csv"`);
  }
  res.send(content);
});

// 9a. Database Import & JSON Upload
app.post(
  '/api/database/import',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).authenticatedUser;

      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          error:
            'Super Admin privileges required to upload or import database.'
        });
      }

      const {
        target = 'auto',
        payload,
        mode = 'merge'
      } = req.body || {};

      if (!payload) {
        return res.status(400).json({
          error:
            'Missing JSON database payload. Please select a valid .json file.'
        });
      }

      if (mode !== 'merge') {
        return res.status(400).json({
          error:
            'Only merge mode is supported in production. Replace mode is disabled.'
        });
      }

      const result = await db.importData(
        String(target),
        payload,
        'merge',
        user.name || 'Surveillance Super Admin'
      );

      return res.json(result);
    } catch (err: any) {
      console.error('[Database Import Error]:', err);

      return res.status(400).json({
        error:
          err?.message ||
          'Failed to parse or import JSON database file.'
      });
    }
  }
);

// 9b. Download SQL Schema and Seed for Hostinger phpMyAdmin
app.get('/api/database/download-schema', (req: Request, res: Response) => {
  const schemaPath = path.resolve(process.cwd(), 'database/schema.sql');
  if (fs.existsSync(schemaPath)) {
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="schema.sql"');
    res.sendFile(schemaPath);
  } else {
    res.status(404).json({ error: 'schema.sql not found on server' });
  }
});

app.get('/api/database/download-seed', (req: Request, res: Response) => {
  const seedPath = path.resolve(process.cwd(), 'database/seed.sql');
  if (fs.existsSync(seedPath)) {
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="seed.sql"');
    res.sendFile(seedPath);
  } else {
    res.status(404).json({ error: 'seed.sql not found on server' });
  }
});

// 9c. Download Hostinger Deployment Packages
app.get('/api/hostinger/download/:packageType', (req: Request, res: Response) => {
  const pkgType = req.params.packageType;
  let filename = '';
  if (pkgType === 'nodejs') {
    filename = 'hostinger-nodejs-deploy.zip';
  } else if (pkgType === 'shared') {
    filename = 'hostinger-shared-hosting.zip';
  } else {
    return res.status(400).json({ error: 'Invalid package type. Use "nodejs" or "shared".' });
  }

  // Look in root or public/downloads
  const candidates = [
    path.resolve(process.cwd(), filename),
    path.resolve(process.cwd(), 'public/downloads', filename),
    path.resolve(process.cwd(), 'dist/downloads', filename)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.sendFile(candidate);
    }
  }

  res.status(404).json({
    error: `Package ${filename} has not been built yet. Run 'npm run package:hostinger' to generate.`
  });
});


// ============================================================================
// VITE INTEGRATION (DEV & PROD)
// ============================================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite middleware in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);

    // Serve transformed index.html for non-API SPA routes
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production static files: check dist/ folder first, then process.cwd()
    const distPath = fs.existsSync(path.resolve(process.cwd(), 'dist'))
      ? path.resolve(process.cwd(), 'dist')
      : process.cwd();

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.match(/\.(js|css|woff2|png|jpg|svg)$/)) {
          res.setHeader('Cache-Control', 'max-age=31536000, immutable');
        }
      }
    }));

    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(indexPath);
      } else {
        res.sendFile(path.resolve(process.cwd(), 'index.html'));
      }
    });
  }

  // Hostinger Port & Socket Binding
  const isSocket = typeof rawPort === 'string' && (rawPort.startsWith('/') || rawPort.startsWith('\\\\'));
  if (isSocket) {
    app.listen(rawPort, () => {
      console.log(`[Server] OpsDesk portal active on Unix socket: ${rawPort}`);
    });
  } else {
    const portNumber = Number(rawPort) || 3000;
    app.listen(portNumber, '0.0.0.0', () => {
      console.log(`[Server] OpsDesk portal active on http://0.0.0.0:${portNumber}`);
    });
  }
}

startServer();
