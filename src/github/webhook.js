const { Webhooks } = require('@octokit/webhooks');
const { Octokit } = require('@octokit/rest');
const jwt = require('jsonwebtoken');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

function createWebhookApp({ secret = process.env.GITHUB_WEBHOOK_SECRET, octokitInstance } = {}) {
  const app = express();
  const webhooks = new Webhooks({ secret });
  let octokit;
  if (process.env.NODE_ENV === 'test' && global.mockedOctokit) {
    octokit = global.mockedOctokit;
  } else if (octokitInstance) {
    octokit = octokitInstance;
  } else {
    octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }

  // Handle repository events
  webhooks.on('repository', async ({ payload }) => {
    const repo = payload.repository;
    console.log(`Repository event: ${payload.action} on ${repo.full_name}`);
    
    // Analyze repository for security vulnerabilities
    await analyzeRepository(repo);
  });

  // Handle push events
  webhooks.on('push', async ({ payload }) => {
    const repo = payload.repository;
    const branch = payload.ref.replace('refs/heads/', '');
    
    console.log(`Push to ${repo.full_name} on branch ${branch}`);
    
    // Run security scans on new code
    await runSecurityScan(repo, payload.after);
  });

  // Handle vulnerability alerts
  webhooks.on('repository_vulnerability_alert', async ({ payload }) => {
    const alert = payload.alert;
    const repo = payload.repository;
    
    console.log(`Security alert for ${repo.full_name}: ${alert.security_advisory.summary}`);
    
    // Create issue for critical vulnerabilities
    if (alert.security_advisory.severity === 'critical') {
      await createSecurityIssue(repo, alert);
    }
  });

  async function analyzeRepository(repo) {
    try {
      const analysis = await octokit.request('GET /repos/{owner}/{repo}/code-scanning/analyses', {
        owner: repo.owner.login,
        repo: repo.name
      });
      
      return analysis.data;
    } catch (error) {
      console.error('Error analyzing repository:', error);
      throw error;
    }
  }

  async function runSecurityScan(repo, commitSha) {
    try {
      await octokit.request('POST /repos/{owner}/{repo}/code-scanning/analyses', {
        owner: repo.owner.login,
        repo: repo.name,
        commit_sha: commitSha,
        ref: 'refs/heads/main',
        tool_name: 'ZeroDayRadar',
        results: []
      });
    } catch (error) {
      console.error('Error running security scan:', error);
      throw error;
    }
  }

  async function createSecurityIssue(repo, alert) {
    try {
      await octokit.issues.create({
        owner: repo.owner.login,
        repo: repo.name,
        title: `Security Alert: ${alert.security_advisory.summary}`,
        body: `
## Security Vulnerability Detected

**Severity:** ${alert.security_advisory.severity}
**Package:** ${alert.affected_package_name}
**Current Version:** ${alert.affected_range}
**Patched Version:** ${alert.fixed_in}

### Description
${alert.security_advisory.description}

### Impact
${alert.security_advisory.details}

### Remediation
Please update to version ${alert.fixed_in} or later to resolve this vulnerability.
        `,
        labels: ['security', 'vulnerability', alert.security_advisory.severity]
      });
    } catch (error) {
      console.error('Error creating security issue:', error);
      throw error;
    }
  }

  // Express middleware
  app.use(express.json());
  app.get('/webhook', (req, res) => {
    res.status(200).send('Webhook endpoint is running');
  });

  const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };
  app.use(express.json({ verify: rawBodyBuffer }));
  app.use((req, res, next) => {
    if (req.url === '/webhook' && req.method === 'POST') {
      webhooks.verifyAndReceive({
        id: req.headers['x-github-delivery'],
        name: req.headers['x-github-event'],
        signature: req.headers['x-hub-signature-256'],
        payload: req.rawBody
      }).then(() => {
        res.status(200).send('Webhook processed');
      }).catch(error => {
        console.error('Webhook processing error:', error);
        res.status(500).send('Webhook processing failed');
      });
    } else {
      next();
    }
  });
  return app;
}

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  const app = createWebhookApp();
  app.listen(PORT, () => {
    console.log(`GitHub webhook server running on port ${PORT}`);
  });
}

module.exports = createWebhookApp;
