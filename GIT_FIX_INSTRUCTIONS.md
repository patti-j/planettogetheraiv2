# How to Fix GitHub Remote URL for Automatic Backups

## The Issue
Your Git remote URL needs authentication to push changes to GitHub automatically.

## Quick Fix (Copy & Paste Commands)

Open the Shell tab in Replit and run these commands one by one:

```bash
# 1. Remove the current origin
git remote remove origin

# 2. Add origin with authentication (your token is already in environment)
git remote add origin https://${GITHUB_TOKEN}@github.com/patti-j/planettogetheraiv2.git

# 3. Test the connection
git ls-remote origin HEAD

# 4. Fetch the latest
git fetch origin
```

## Alternative Method (If Above Doesn't Work)

If you get permission errors, try this approach:

```bash
# 1. Create a new remote with a different name
git remote add github-backup https://${GITHUB_TOKEN}@github.com/patti-j/planettogetheraiv2.git

# 2. Test it
git ls-remote github-backup HEAD

# 3. If successful, push to this remote
git push github-backup main
```

## Verify It's Working

After fixing, test with:

```bash
# Try a test push (no changes needed)
git push origin main --dry-run
```

If you see "Everything up-to-date" or similar, it's working!

## Troubleshooting

If you still have issues:

1. **Check your token permissions**: Your GitHub token needs 'repo' scope
2. **Verify token is set**: Run `echo $GITHUB_TOKEN | cut -c1-10` (shows first 10 chars)
3. **Check repository access**: Make sure you have write access to the repository

## Automatic Backups

Once fixed, your code will automatically backup to GitHub when:
- You make significant changes
- You complete tasks
- Before session ends

Your GitHub Token is already configured in Replit Secrets and available as an environment variable.