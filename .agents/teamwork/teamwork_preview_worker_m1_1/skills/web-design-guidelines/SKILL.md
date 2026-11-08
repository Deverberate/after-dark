---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below (or refer to the bundled local reference in [guidelines.md](./references/guidelines.md)).
2. Read the specified files (or prompt user for files/pattern).
3. Check against all rules in the guidelines.
4. Output findings in the terse `file:line` format.
