import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Resolves a given path string, expanding `~` to the user's home directory.
 */
function resolveFolderPath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return '';
  const trimmed = rawPath.trim();
  if (trimmed.startsWith('~')) {
    return path.join(os.homedir(), trimmed.slice(1));
  }
  return path.resolve(trimmed);
}

/**
 * Sets permissive CORS headers so local and deployed frontends can communicate
 * with the local Vite dev server.
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
}

/**
 * Vite plugin that provides local filesystem helper endpoints:
 * - GET  /api/system-info : returns home, downloads, desktop paths
 * - POST /api/check-path  : checks if a directory exists on the local machine
 * - POST /api/delete-files : deletes specified filenames from a local directory
 */
export function localFsPlugin() {
  return {
    name: 'vite-plugin-local-fs',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only intercept /api/* routes
        const url = req.url ? req.url.split('?')[0] : '';
        if (!url.startsWith('/api/')) {
          return next();
        }

        setCorsHeaders(res);

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // GET /api/system-info
        if (url === '/api/system-info' && req.method === 'GET') {
          const homeDir = os.homedir();
          const downloadsDir = path.join(homeDir, 'Downloads');
          const desktopDir = path.join(homeDir, 'Desktop');

          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              success: true,
              homeDir,
              downloadsDir,
              desktopDir,
              username: os.userInfo().username,
              platform: os.platform()
            })
          );
        }

        // POST /api/check-path
        if (url === '/api/check-path' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { folderPath } = JSON.parse(body || '{}');
              const resolved = resolveFolderPath(folderPath);

              const exists = fs.existsSync(resolved);
              const isDir = exists ? fs.statSync(resolved).isDirectory() : false;
              let fileCount = 0;

              if (exists && isDir) {
                try {
                  fileCount = fs.readdirSync(resolved).filter((f) => !f.startsWith('.')).length;
                } catch {
                  // ignore
                }
              }

              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: true,
                  exists: exists && isDir,
                  resolvedPath: resolved,
                  fileCount
                })
              );
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // POST /api/delete-files
        if (url === '/api/delete-files' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { folderPath, filenames = [] } = JSON.parse(body || '{}');
              const resolved = resolveFolderPath(folderPath);

              if (!resolved || !fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(
                  JSON.stringify({
                    success: false,
                    error: `Folder not found: ${resolved || folderPath}`,
                    deleted: [],
                    failed: filenames
                  })
                );
              }

              const deleted = [];
              const failed = [];
              let dirEntries = [];
              try {
                dirEntries = fs.readdirSync(resolved);
              } catch (e) {
                dirEntries = [];
              }

              for (const name of filenames) {
                if (!name) continue;

                // 1. Direct path check
                const directPath = path.join(resolved, name);
                let targetPath = null;

                if (fs.existsSync(directPath)) {
                  targetPath = directPath;
                } else {
                  // 2. Case-insensitive search in directory
                  const lowerName = name.toLowerCase();
                  const matchedEntry = dirEntries.find((e) => e.toLowerCase() === lowerName);
                  if (matchedEntry) {
                    targetPath = path.join(resolved, matchedEntry);
                  }
                }

                if (targetPath) {
                  try {
                    fs.unlinkSync(targetPath);
                    deleted.push(name);
                  } catch (delErr) {
                    console.warn(`[localFsPlugin] Failed to delete file ${targetPath}:`, delErr.message);
                    failed.push(name);
                  }
                } else {
                  failed.push(name);
                }
              }

              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: true,
                  deleted,
                  failed,
                  folderPath: resolved
                })
              );
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}
