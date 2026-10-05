process.env.JWT_SECRET = 'test-secret-key-minimum-32-chars-long';
process.env.DATABASE_PATH = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { closeDb } = require('../src/db');

afterAll(() => closeDb());

describe('/api/messages', () => {
  let token;

  beforeAll(async () => {
    await request(app).post('/auth/register').send({ email: 'guest@example.com', password: 'password123' });
    const login = await request(app).post('/auth/login').send({ email: 'guest@example.com', password: 'password123' });
    token = login.body.token;
  });

  test('GET token olmadan da calisir (herkese acik)', async () => {
    const res = await request(app).get('/api/messages');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST token olmadan 401 doner', async () => {
    const res = await request(app).post('/api/messages').send({ text: 'merhaba' });
    expect(res.status).toBe(401);
  });

  test('POST bos mesaji 400 ile reddeder', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('text');
  });

  test('POST gecerli mesaji sozlesmedeki alanlarla doner', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '  ilk mesaj  ' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(Number),
      author: 'guest',
      text: 'ilk mesaj',
      createdAt: expect.any(String),
    });
  });

  test('yeni mesaj GET listesinde en ustte gorunur', async () => {
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'en yeni' });
    const res = await request(app).get('/api/messages');
    expect(res.body[0].text).toBe('en yeni');
  });
});
