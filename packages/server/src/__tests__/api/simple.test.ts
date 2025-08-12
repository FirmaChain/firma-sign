import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Simple API Test', () => {
  it('should create a simple express app and test it', async () => {
    const app = express();
    
    app.get('/test', (_req, res) => {
      res.json({ message: 'Hello Test' });
    });

    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.body).toEqual({ message: 'Hello Test' });
  });

  it('should handle basic math', () => {
    expect(2 + 2).toBe(4);
  });
});