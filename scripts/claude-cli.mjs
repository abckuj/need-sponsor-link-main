#!/usr/bin/env node
import fs from 'fs';

const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_KEY;
if (!apiKey) {
  console.error('Error: set ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

const args = process.argv.slice(2);
let prompt = args.join(' ');
if (!prompt && !process.stdin.isTTY) prompt = await readStdin();
if (!prompt) {
  console.error('Usage: npm run claude -- "your prompt"  (or pipe text to the command)');
  process.exit(1);
}

const body = {
  model: 'claude-2.1',
  prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
  max_tokens_to_sample: 1000,
};

try {
  const res = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error('API error', res.status, txt);
    process.exit(1);
  }

  const data = await res.json();
  // Anthropic's completion text is usually in `completion` field
  console.log(data.completion ?? JSON.stringify(data, null, 2));
} catch (err) {
  console.error('Request failed:', err.message || err);
  process.exit(1);
}
