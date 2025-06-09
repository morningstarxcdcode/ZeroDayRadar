# ZeroDayRadar - Quick FAQ & Overview

**Q: What is ZeroDayRadar?**  
A: It's a tool that watches your GitHub repo for code changes or security alerts and helps you stay safe by running checks and opening issues if it finds problems.

**Q: What does it actually do?**  
A: Listens for GitHub webhooks (push, repo, vulnerability alerts), runs security checks, and creates issues for critical vulnerabilities.

**Q: Who should use this?**  
A: Anyone who wants to automate security for their GitHub code with easy setup.

**Q: How do I set it up?**
1. Install Node.js and npm.
2. Clone the repo.
3. Run `npm install`.
4. Add a `.env` file with your GitHub token and webhook secret.
5. Run `npm start` to launch the server.
6. Add a webhook in your GitHub repo pointing to your server.

**Q: How do I test it?**  
A: Run `npm test`.

**Q: Where is the main code?**  
A: `src/github/webhook.js` (logic), `tests/webhook.test.js` (tests).

**Q: Does it deploy automatically?**  
A: Yes, with GitHub Actions (see `.github/workflows/`).

**Q: Can I use this for any repo?**  
A: Yes, just set the right secrets and webhook.

**Q: What if I get stuck?**  
A: See the README or open an issue in the repo.

---
For more, see the full README.md.
