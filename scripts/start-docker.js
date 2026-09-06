#!/usr/bin/env node

import net from 'net';
import { spawn } from 'child_process';

const START_PORT = 8080;
const MAX_PORT = 8120;

/**
 * Checks if a specific port is free to listen on
 * @param {number} port 
 * @returns {Promise<boolean>}
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, '0.0.0.0');
  });
}

/**
 * Finds the first available port starting from START_PORT
 * @returns {Promise<number>}
 */
async function findAvailablePort(startPort = START_PORT, maxPort = MAX_PORT) {
  for (let port = startPort; port <= maxPort; port++) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${maxPort}.`);
}

async function start() {
  try {
    console.log(`[Post Studio] Scanning for available host port starting from ${START_PORT}...`);
    const availablePort = await findAvailablePort(START_PORT, MAX_PORT);
    console.log(`[Post Studio] Selected available port: ${availablePort}`);

    const env = {
      ...process.env,
      APP_PORT: String(availablePort)
    };

    console.log('[Post Studio] Launching Docker Compose...');
    const dockerProcess = spawn('docker', ['compose', 'up', '-d', '--build'], {
      env,
      stdio: 'inherit'
    });

    dockerProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n======================================================');
        console.log(`  Application running at:`);
        console.log(`  http://localhost:${availablePort}/`);
        console.log(`  http://localhost:${availablePort}/watermark`);
        console.log('======================================================\n');
        console.log('To stop container: npm run docker:stop\n');
      } else {
        console.error(`[Post Studio] Docker compose exited with code ${code}.`);
        process.exit(code || 1);
      }
    });
  } catch (error) {
    console.error('[Post Studio] Error starting Docker container:', error.message);
    process.exit(1);
  }
}

start();
