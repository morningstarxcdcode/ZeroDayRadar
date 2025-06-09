const request = require('supertest');
const express = require('express');
const { Webhooks } = require('@octokit/webhooks');
const dotenv = require('dotenv');
let webhookApp;

dotenv.config();

jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => {
      return {
        request: jest.fn().mockResolvedValue({ data: {} }),
        issues: {
          create: jest.fn().mockResolvedValue({})
        }
      };
    })
  };
});

let webhooks;

beforeAll(() => {
  const { Octokit } = require('@octokit/rest');
  global.mockedOctokit = new Octokit();
  process.env.GITHUB_TOKEN = 'dummy_token';
  process.env.GITHUB_WEBHOOK_SECRET = 'testsecret';
  jest.resetModules();
  const createWebhookApp = require('../src/github/webhook.js');
  webhookApp = createWebhookApp({ secret: 'testsecret', octokitInstance: global.mockedOctokit });
});

describe('GitHub Webhook Server', () => {
  let app;
  let server;

  beforeAll(() => {
    app = express();
    app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString(); } }));
    app.use('/', webhookApp);
    server = app.listen(4000);
  });

  afterAll((done) => {
    server.close(done);
  });

  test('GET /webhook returns status 200', async () => {
    const res = await request(app).get('/webhook');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Webhook endpoint is running');
  });

  test('POST /webhook with invalid signature returns 500', async () => {
    const res = await request(app)
      .post('/webhook')
      .set('X-GitHub-Event', 'push')
      .set('X-Hub-Signature-256', 'sha256=invalidsignature')
      .send({});
    expect(res.statusCode).toBe(500);
  });

  test('POST /webhook with valid push event signature returns 200', async () => {
    const payload = {
      ref: 'refs/heads/main',
      repository: {
        full_name: 'test/repo',
        owner: { login: 'test' },
        name: 'repo'
      },
      after: 'commitsha123'
    };

    const secret = process.env.GITHUB_WEBHOOK_SECRET || 'testsecret';
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload);
    const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

    const res = await request(app)
      .post('/webhook')
      .set('X-GitHub-Event', 'push')
      .set('X-Hub-Signature-256', signature)
      .set('X-GitHub-Delivery', 'test-delivery-id')
      .set('Content-Type', 'application/json')
      .send(payloadString);

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Webhook processed');
  });

  test('POST /webhook with valid repository event signature returns 200', async () => {
    const payload = {
      action: 'created',
      repository: {
        full_name: 'test/repo',
        owner: { login: 'test' },
        name: 'repo'
      }
    };

    const secret = process.env.GITHUB_WEBHOOK_SECRET || 'testsecret';
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload);
    const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

    const res = await request(app)
      .post('/webhook')
      .set('X-GitHub-Event', 'repository')
      .set('X-Hub-Signature-256', signature)
      .set('X-GitHub-Delivery', 'test-delivery-id')
      .set('Content-Type', 'application/json')
      .send(payloadString);

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Webhook processed');
  });

  test('POST /webhook with valid repository_vulnerability_alert event signature returns 200', async () => {
    const payload = {
      alert: {
        security_advisory: {
          summary: 'Critical vulnerability',
          severity: 'critical',
          description: 'Description of vulnerability',
          details: 'Impact details'
        },
        affected_package_name: 'package-name',
        affected_range: '<1.0.0',
        fixed_in: '1.0.0'
      },
      repository: {
        full_name: 'test/repo',
        owner: { login: 'test' },
        name: 'repo'
      }
    };

    const secret = process.env.GITHUB_WEBHOOK_SECRET || 'testsecret';
    const crypto = require('crypto');
    const payloadString = JSON.stringify(payload);
    const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

    const res = await request(app)
      .post('/webhook')
      .set('X-GitHub-Event', 'repository_vulnerability_alert')
      .set('X-Hub-Signature-256', signature)
      .set('X-GitHub-Delivery', 'test-delivery-id')
      .set('Content-Type', 'application/json')
      .send(payloadString);

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Webhook processed');
  });
});
