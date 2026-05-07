const request = require('supertest');
const app = require('../src/app');

describe('POST /token', () => {
  it('returns 400 when username is missing', async () => {
    const res = await request(app).post('/token').send({});
    expect(res.status).toBe(400);
  });

  it('returns a token when JWT_SECRET is set', async () => {
    const res = await request(app).post('/token').send({ username: 'alice' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 500 when JWT_SECRET is missing', async () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    const res = await request(app).post('/token').send({ username: 'alice' });
    expect(res.status).toBe(500);
    if (saved !== undefined) process.env.JWT_SECRET = saved;
  });
});

describe('GET /protected', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  it('returns greeting with valid token', async () => {
    const tokenRes = await request(app).post('/token').send({ username: 'bob' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${tokenRes.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello, bob');
  });

  it('returns 401 with tampered token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.bad.sig');
    expect(res.status).toBe(401);
  });
});
