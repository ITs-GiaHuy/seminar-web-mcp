/**
 * Opencode Headless Runner
 * Resolves opencode binary dynamically across user environments.
 * Spawns `opencode run --pure --format json --auto [prompt]`
 * to execute agent tasks non-interactively and extract structured tokens/metrics.
 */

import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Dynamically discovers the opencode binary path across any environment/machine.
 */
export function getOpencodePath() {
  // 1. Check if opencode is in system PATH
  try {
    const whichOut = execSync('which opencode 2>/dev/null', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (whichOut && existsSync(whichOut)) {
      return whichOut;
    }
  } catch {
    // not in system PATH
  }

  // 2. Check ~/.local/bin/opencode in the current user's home directory
  const homeLocal = join(homedir(), '.local/bin/opencode');
  if (existsSync(homeLocal)) {
    return homeLocal;
  }

  // 3. Fallback hardcoded developer path
  if (existsSync('/home/giahuy/.local/bin/opencode')) {
    return '/home/giahuy/.local/bin/opencode';
  }

  return null;
}

/**
 * Checks if opencode is installed and executable on the current system.
 */
export function isOpencodeAvailable() {
  return getOpencodePath() !== null;
}

/**
 * Executes a prompt using opencode in headless mode and parses the JSON stream.
 * @param {string} prompt - Prompt to pass to opencode
 * @param {Object} options
 * @returns {Promise<{text: string, tokens: {input: number, output: number, total: number}, durationMs: number}>}
 */
export function runOpencodeHeadless(prompt, options = {}) {
  return new Promise((resolve, reject) => {
    const opencodeBin = getOpencodePath();
    if (!opencodeBin) {
      return reject(new Error(`opencode CLI binary not detected on this machine. Please install opencode or use replay mode (npm run measure).`));
    }

    const startTime = performance.now();
    const args = ['run', '--pure', '--format', 'json', '--auto'];
    if (options.model) {
      args.push('-m', options.model);
    }
    args.push(prompt);

    const proc = spawn(opencodeBin, args, {
      cwd: options.cwd || process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let fullText = '';
    let tokenStats = { input: 0, output: 0, total: 0 };
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line.trim());
          if (evt.type === 'text' && evt.part && evt.part.text) {
            fullText += evt.part.text;
          }
          if (evt.type === 'step_finish' && evt.part && evt.part.tokens) {
            tokenStats = {
              input: evt.part.tokens.input || 0,
              output: evt.part.tokens.output || 0,
              total: evt.part.tokens.total || 0
            };
          }
        } catch {
          // Non-JSON log line, ignore
        }
      }
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      const durationMs = Math.round(performance.now() - startTime);
      if (code !== 0 && !fullText) {
        return reject(new Error(`opencode exited with code ${code}: ${errorOutput}`));
      }
      resolve({
        text: fullText,
        tokens: tokenStats,
        durationMs
      });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}
