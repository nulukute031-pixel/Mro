#!/usr/bin/env node
/**
 * tools.js — Local Sandbox Bridge client for Node.js
 */
'use strict';

const http = require('https');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args.join(' ');

if (!command) {
  console.error('Usage: node tools.js "<command>"');
  process.exit(1);
}

const tunnelFile = path.join(__dirname, '.codex-tunnel');
if (!fs.existsSync(tunnelFile)) {
  console.error('Error: .codex-tunnel file not found.');
  process.exit(1);
}

const urlStr = fs.readFileSync(tunnelFile, 'utf8').trim();
if (!urlStr) {
  console.error('Error: Tunnel URL is empty.');
  process.exit(1);
}

const url = new URL(urlStr + '/execute');
const payload = JSON.stringify({ command });

const req = http.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error("Error: Bridge server returned status " + res.statusCode);
      console.error(body);
      process.exit(1);
    }
    try {
      const data = JSON.parse(body);
      if (data.stdout) process.stdout.write(data.stdout);
      if (data.stderr) process.stderr.write(data.stderr);
      process.exit(data.exitCode || 0);
    } catch (e) {
      console.error('Error parsing response:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error("Error: Failed to connect to local sandbox bridge via " + urlStr);
  process.exit(1);
});

req.write(payload);
req.end();
