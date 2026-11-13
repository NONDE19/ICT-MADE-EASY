// @vitest-environment node
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApiApp } from '../server/src/app.js';

const app = createApiApp();

describe('VIRTUOLAB REST API Integration Tests', () => {
  it('rejects unauthenticated access to protected endpoints', async () => {
    const res = await request(app).get('/api/learning/pupil-dashboard');
    expect(res.status).toBe(401);
  });

  it('rejects invalid login credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: 'pupil@virtuolab.edu.zm',
      password: 'WrongPassword123',
    });
    expect(res.status).toBe(401);
  });

  it('authenticates pupil, enforces RBAC on admin routes, and fetches dashboard + desktop state', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      identifier: 'pupil@virtuolab.edu.zm',
      password: 'Pupil@2026!',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeTruthy();
    expect(loginRes.body.user.role).toBe('PUPIL');

    const token = loginRes.body.accessToken as string;

    // Pupil must be blocked from Admin endpoints
    const forbiddenRes = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${token}`);
    expect(forbiddenRes.status).toBe(403);

    // Pupil can access own dashboard & virtual desktop
    const dashRes = await request(app)
      .get('/api/learning/pupil-dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(dashRes.status).toBe(200);
    expect(dashRes.body.modules.length).toBe(12);

    const desktopRes = await request(app)
      .get('/api/desktop/state')
      .set('Authorization', `Bearer ${token}`);
    expect(desktopRes.status).toBe(200);
    expect(desktopRes.body.state.folders.length).toBeGreaterThanOrEqual(3);
  });

  it('authenticates administrator and returns real database statistics', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      identifier: 'admin@virtuolab.edu.zm',
      password: 'Admin@2026!',
    });
    expect(loginRes.status).toBe(200);

    const adminOverview = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
    expect(adminOverview.status).toBe(200);
    expect(adminOverview.body.stats.totalSchools).toBeGreaterThanOrEqual(2);
    expect(adminOverview.body.stats.totalModules).toBe(12);
  });

  it('authenticates teacher and fetches assigned class metrics', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      identifier: 'teacher@virtuolab.edu.zm',
      password: 'Teacher@2026!',
    });
    expect(loginRes.status).toBe(200);

    const teacherDash = await request(app)
      .get('/api/teacher/dashboard')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
    expect(teacherDash.status).toBe(200);
    expect(teacherDash.body.classes.length).toBeGreaterThanOrEqual(1);
    expect(teacherDash.body.pupils.length).toBeGreaterThanOrEqual(1);
  });
});
