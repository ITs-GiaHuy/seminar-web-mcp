/**
 * Opencode Headless Runner
 * Spawns `/home/giahuy/.local/bin/opencode run [prompt] --format json --auto`
 * to execute agent tasks non-interactively and extract structured tokens/metrics.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

const OPENCODE_PATH = '/home/giahuy/.local/bin/opencode';

/**
 * Checks if opencode is installed and executable.
 */
export function isOpencodeAvailable() {
  return existsSync(OPENCODE_PATH);
}

/**
 * Executes a prompt using opencode in headless mode and parses the JSON stream.
 * @param {string} prompt - Prompt to pass to opencode
 * @param {Object} options
 * @returns {Promise<{text: string, tokens: {input: number, output: number, total: number}, durationMs: number}>}
 */
export function runOpencodeHeadless(prompt, options = {}) {
  return new Promise((resolve, reject) => {
    if (!isOpencodeAvailable()) {
      return reject(new Error(`opencode binary not found at ${OPENCODE_PATH}`));
    }

    const startTime = performance.now();
    const args = ['run', '--pure', '--format', 'json', '--auto'];
    if (options.model) {
      args.push('-m', options.model);
    }
    args.push(prompt);

    const proc = spawn(OPENCODE_PATH, args, {
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
