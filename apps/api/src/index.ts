import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { sign } from 'jsonwebtoken';
import { compare, genSalt, hash } from 'bcryptjs';
import { createUser, findUser } from './users';
import { getLog, saveLog } from './logs';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:4000'],
  credentials: true,
}));

const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';

// Protected Routes Middleware
app.use('/raw-logs/*', jwt({ secret: JWT_SECRET }));

// Routes
app.get('/', (c) => c.text('Hello from Hono!'));

app.post('/auth/signup', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ message: 'Username and password are required' }, 400);
    }

    const existingUser = await findUser(username);
    if (existingUser) {
      return c.json({ message: 'Username already exists' }, 409);
    }

    const salt = await genSalt(10);
    const passwordHash = await hash(password, salt);

    await createUser(username, passwordHash);

    const token = sign({ username, sub: username }, JWT_SECRET, { expiresIn: '1h' });

    return c.json({ access_token: token });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ message: 'Internal Server Error' }, 500);
  }
});

app.post('/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ message: 'Username and password are required' }, 400);
    }

    const user = await findUser(username);
    if (!user) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    const token = sign({ username, sub: username }, JWT_SECRET, { expiresIn: '1h' });

    return c.json({ access_token: token });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ message: 'Internal Server Error' }, 500);
  }
});

// Log Routes
app.post('/raw-logs', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.username || payload.sub; // Hono JWT puts payload in 'jwtPayload' context
    const { date, content } = await c.req.json();

    if (!date) {
      return c.json({ message: 'Date is required' }, 400);
    }

    await saveLog(userId, date, content || '');
    return c.json({ success: true });
  } catch (error) {
    console.error('Save log error:', error);
    return c.json({ message: 'Internal Server Error' }, 500);
  }
});

app.get('/raw-logs/:date', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.username || payload.sub;
    const date = c.req.param('date');

    const log = await getLog(userId, date);
    return c.json(log || { date, content: '' });
  } catch (error) {
    console.error('Get log error:', error);
    return c.json({ message: 'Internal Server Error' }, 500);
  }
});

// Export for Lambda
export const handler = handle(app);

// Export for local dev (if needed, though dev script uses tsx watch src/index.ts which needs explicit serve)
// For local development with `tsx`, we need to serve it manually using @hono/node-server
if (require.main === module) {
  const { serve } = require('@hono/node-server');
  const port = Number(process.env.PORT) || 3000;
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port
  });
}
