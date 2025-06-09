# ZeroDayRadar - GitHub Webhook Handler

This project is a Node.js Express server that handles GitHub webhook events for security automation and vulnerability alerting.

## Prerequisites

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)

## 1. Clone the Repository

If you haven't already, clone the repository:

```bash
git clone <your-repo-url>
cd ZeroDayRadar
```

## 2. Install Dependencies

Install all required packages:

```bash
npm install
```

## 3. Environment Variables

Create a `.env` file in the project root with the following content:

```
GITHUB_TOKEN=your_github_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret
PORT=3000 # or any port you prefer
```

- `GITHUB_TOKEN`: A GitHub personal access token with repo and security events access.
- `GITHUB_WEBHOOK_SECRET`: The secret you set when configuring the webhook in your GitHub repository.
- `PORT`: (Optional) The port to run the server on (default is 3000).

## 4. Running the Server

Start the server with:

```bash
npm start
```

You should see:

```
GitHub webhook server running on port 3000
```

## 5. Testing

Run the test suite with:

```bash
npm test
```

All tests should pass.

![Test Results Screenshot](./tests_passed.png)

## 6. Setting up the GitHub Webhook

- Go to your GitHub repository > Settings > Webhooks > Add webhook.
- Set the Payload URL to your server's public URL (e.g., `https://yourdomain.com/webhook` or `http://localhost:3000/webhook` for local testing).
- Set Content type to `application/json`.
- Set the Secret to the same value as `GITHUB_WEBHOOK_SECRET` in your `.env` file.
- Select the events you want to receive (e.g., push, repository, repository_vulnerability_alert).

## 7. Project Structure

- `src/github/webhook.js`: Main Express app and webhook logic.
- `tests/webhook.test.js`: Automated tests for the webhook handler.
- `package.json`: Project metadata and scripts.

## 8. Troubleshooting

- Ensure your `.env` file is present and correct.
- If you change environment variables, restart the server.
- For local testing, use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet for GitHub webhooks.

## 9. CI/CD & Deployment

This project includes GitHub Actions workflows for:

- **CI/CD Pipeline:** Runs tests on every push and pull request to `main`, and deploys on push to `main`.
- **NPM Publish:** Publishes the package to npm when a new release is created (requires `NPM_TOKEN` secret).

See `.github/workflows/ci-cd.yml` and `.github/workflows/publish.yml` for details. Update the deployment step in `ci-cd.yml` to match your hosting provider (e.g., Render, Heroku, Vercel, etc.).

---

For any issues, check the console output or open an issue in the repository.
