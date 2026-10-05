process.env.JWT_SECRET = 'test-secret-key-minimum-32-chars-long';
process.env.DATABASE_URL = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { closeDb } = require('../src/db');

afterAll(() => closeDb());

// --- Register ---
describe('POST /auth/register', () => {
  test('gecerli kayit 201 doner', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('alice@example.com');
    expect(res.body.password_hash).toBeUndefined();
  });

  test('mukerer e-posta 409 doner', async () => {
    await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'password123' });
    const res = await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  test('eksik alan 400 doner', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'bad@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('password');
  });

  test('gecersiz e-posta formati 400 doner', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'notanemail', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('email');
  });
});

// --- Login ---
describe('POST /auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/auth/register').send({ email: 'bob@example.com', password: 'correctpass' });
  });

  test('dogru bilgilerle login token doner', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'bob@example.com', password: 'correctpass' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('yanlis parola jenerik mesaj doner (401)', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'bob@example.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('E-posta veya sifre hatali');
  });

  test('yanlis e-posta jenerik mesaj doner (401) — ayni mesaj', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'anypass' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('E-posta veya sifre hatali');
  });
});

// --- Auth Middleware ---
describe('Korunan endpoint', () => {
  test('token olmadan GET /notes 401 doner', async () => {
    const res = await request(app).get('/notes');
    expect(res.status).toBe(401);
  });

  test('bozuk token 401 doner', async () => {
    const res = await request(app)
      .get('/notes')
      .set('Authorization', 'Bearer this.is.invalid');
    expect(res.status).toBe(401);
  });
});

// --- Sahiplik ---
describe('Not sahipligi', () => {
  let tokenA, tokenB, noteIdA;

  beforeAll(async () => {
    await request(app).post('/auth/register').send({ email: 'usera@example.com', password: 'passA1234' });
    await request(app).post('/auth/register').send({ email: 'userb@example.com', password: 'passB1234' });

    const loginA = await request(app).post('/auth/login').send({ email: 'usera@example.com', password: 'passA1234' });
    const loginB = await request(app).post('/auth/login').send({ email: 'userb@example.com', password: 'passB1234' });
    tokenA = loginA.body.token;
    tokenB = loginB.body.token;

    const noteRes = await request(app)
      .post('/notes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'A nin notu' });
    noteIdA = noteRes.body.id;
  });

  test('kullanici kendi notunu okuyabilir (200)', async () => {
    const res = await request(app)
      .get(`/notes/${noteIdA}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
  });

  test('baska kullanicinin notuna erisim 404 doner', async () => {
    const res = await request(app)
      .get(`/notes/${noteIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test('baska kullanicinin notunu silmeye calisma 404 doner', async () => {
    const res = await request(app)
      .delete(`/notes/${noteIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});
