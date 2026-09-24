const express = require('express');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');

app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(ROOT, 'frontend')));

const runners = {
  python: { image: 'python:3.12-alpine', file: 'main.py', command: ['python', '/workspace/main.py'] },
  javascript: { image: 'node:22-alpine', file: 'main.js', command: ['node', '/workspace/main.js'] },
  java: { image: 'eclipse-temurin:21-jdk-alpine', file: 'Main.java', command: ['sh', '-c', 'javac /workspace/Main.java && java -cp /workspace Main'] },
  c: { image: 'gcc:14', file: 'main.c', command: ['sh', '-c', 'gcc /workspace/main.c -O2 -o /tmp/main && /tmp/main'] },
  cpp: { image: 'gcc:14', file: 'main.cpp', command: ['sh', '-c', 'g++ /workspace/main.cpp -O2 -std=c++17 -o /tmp/main && /tmp/main'] }
};

function validateRequest(body) {
  if (!body || typeof body.code !== 'string' || body.code.length > 100000) return 'Code is required and must be under 100 KB.';
  if (typeof body.stdin !== 'string' || body.stdin.length > 20000) return 'Input must be under 20 KB.';
  if (!runners[body.language]) return 'Unsupported language.';
  return null;
}

app.post('/api/execute', async (req, res) => {
  const error = validateRequest(req.body);
  if (error) return res.status(400).json({ success: false, stderr: error });
  const runner = runners[req.body.language];
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'online-compiler-'));
  const source = path.join(workspace, runner.file);
  const input = path.join(workspace, 'input.txt');
  const started = Date.now();

  try {
    await fs.writeFile(source, req.body.code, 'utf8');
    await fs.writeFile(input, req.body.stdin, 'utf8');
    const containerName = `compiler-${crypto.randomUUID()}`;
    const dockerArgs = [
      'run', '--name', containerName, '--rm', '--network', 'none',
      '--memory', '128m', '--cpus', '0.5', '--pids-limit', '64',
      '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
      '-v', `${workspace}:/workspace:ro`, '--tmpfs', '/tmp:rw,noexec,nosuid,size=32m',
      '-i', runner.image, ...runner.command
    ];

    const result = await execFileAsync('docker', dockerArgs, {
      timeout: 8000,
      maxBuffer: 200000,
      input: req.body.stdin
    });
    res.json({ success: true, stdout: result.stdout || '', stderr: result.stderr || '', exitCode: 0, executionTime: Date.now() - started });
  } catch (runError) {
    const timedOut = runError.killed || runError.signal === 'SIGTERM';
    res.json({
      success: false,
      stdout: runError.stdout || '',
      stderr: timedOut ? 'Execution timed out after 8 seconds.' : (runError.stderr || runError.message || 'Execution failed.'),
      exitCode: typeof runError.code === 'number' ? runError.code : 1,
      executionTime: Date.now() - started
    });
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(ROOT, 'frontend', 'index.html')));
app.listen(PORT, () => console.log(`Online Compiler running at http://localhost:${PORT}`));
