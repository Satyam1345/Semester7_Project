// backend/routes/api.js
    const express = require('express');
    const router = express.Router();
    const multer = require('multer');
    const { spawn, spawnSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const Collection = require('../models/Collection');
    const User = require('../models/User'); // new: user model
    const { randomUUID } = require('crypto');
    // new: verifyIdToken helper to decode Firebase ID tokens if present
    const { verifyIdToken, getAdmin } = require('../firebaseAdmin');


    // Ensure uploads directory always exists
    const uploadsDir = path.join(__dirname, '../uploads/');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const upload = multer({ dest: uploadsDir });
    // Optional S3 integration (upload copies to cloud if configured)
    let s3Helpers = null;
    try {
      s3Helpers = require('../services/s3');
    } catch (_) {
      // aws sdk not installed or service missing; skip cloud upload
    }

    // Resolve a usable Python executable on the host system
    function resolvePythonExecutable() {
      const envPython = process.env.PYTHON_EXECUTABLE && process.env.PYTHON_EXECUTABLE.trim();
      const candidates = [];
      if (envPython) {
        candidates.push({ cmd: envPython, argsPrefix: [] });
      }
      // Prefer Windows launcher when available
      candidates.push({ cmd: 'py', argsPrefix: ['-3'] });
      // Generic fallbacks
      candidates.push({ cmd: 'python', argsPrefix: [] });
      candidates.push({ cmd: 'python3', argsPrefix: [] });

      for (const candidate of candidates) {
        try {
          const check = spawnSync(candidate.cmd, [...candidate.argsPrefix, '--version'], { stdio: 'ignore' });
          if (check && check.status === 0) {
            return candidate;
          }
        } catch (_) {
          // Ignore and try next candidate
        }
      }
      return null;
    }

  router.post('/upload', upload.array('pdfs'), async (req, res) => {
      // Create a unique folder for this upload to isolate PDFs per request
      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const collectionPath = path.join(uploadsDir, uniqueId);
      const pdfsDir = path.join(collectionPath, 'PDFs');
      fs.mkdirSync(pdfsDir, { recursive: true });
      // Copy each uploaded PDF to frontend/public/pdfs for frontend access
      const frontendPdfsDir = path.resolve(__dirname, '../../frontend/public/pdfs');
      fs.mkdirSync(frontendPdfsDir, { recursive: true });
      // Track S3 uploads (if enabled) and prepare documents metadata for DB
      const s3Uploaded = [];
      const documentsForDb = [];

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      // Ensure S3 helpers are configured
      const s3Enabled = !!(s3Helpers && process.env.S3_BUCKET && process.env.AWS_REGION);
      if (!s3Enabled) {
        return res.status(500).json({ error: 'S3 not configured. Set AWS_REGION and S3_BUCKET and ensure services/s3 is available.' });
      }

      for (const file of req.files) {
        const destPath = path.join(pdfsDir, file.originalname);
        // Move the uploaded temp file into this collection's PDFs folder
        try {
          fs.renameSync(file.path, destPath);
        } catch (_) {
          // If rename across devices fails, fallback to copy+unlink
          fs.copyFileSync(file.path, destPath);
          try { fs.unlinkSync(file.path); } catch (e) {}
        }
        // Copy to frontend/public/pdfs (for current UI viewing)
        const frontendDest = path.join(frontendPdfsDir, file.originalname);
        try { fs.copyFileSync(destPath, frontendDest); } catch (e) { /* ignore */ }

        // Upload to S3 with a unique key
        try {
          const ext = path.extname(file.originalname) || '.pdf';
          const key = `uploads/${uniqueId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          await s3Helpers.s3PutFile(destPath, key, file.mimetype || 'application/pdf');
          let publicUrl = null;
          try { publicUrl = await s3Helpers.s3Presign(key, 60 * 60); } catch (_) { publicUrl = null; }
          s3Uploaded.push({ originalName: file.originalname, key });
          documentsForDb.push({
            originalName: file.originalname,
            storedName: key,
            size: file.size,
            mimeType: file.mimetype,
            publicUrl,
            pages: null
          });
        } catch (e) {
          console.warn('S3 upload failed for', file.originalname, e && e.message ? e.message : String(e));
        }
      }

      // Also include all existing PDFs in frontend/public/pdfs into this collection for analysis
      try {
        const existing = fs.readdirSync(frontendPdfsDir).filter((f) => f.toLowerCase().endsWith('.pdf'));
        for (const pdfName of existing) {
          const src = path.join(frontendPdfsDir, pdfName);
          const dest = path.join(pdfsDir, pdfName);
          if (!fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
          }
        }
      } catch (e) {
        console.warn('Warning: Could not enumerate existing PDFs:', e.message || e);
      }

      const collectionName = req.body.collectionName;
      
      // Debug: log incoming meta fields
      try {
        console.log('Upload meta:', {
          collectionName: req.body.collectionName,
          personaRole: req.body.personaRole,
          jobTask: req.body.jobTask
        });
      } catch {}
      
  // Create proper challenge1b_input.json structure
      const pdfsInDir = fs.readdirSync(pdfsDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log('PDFs included for analysis:', pdfsInDir);
      const documentsArray = pdfsInDir.map(filename => ({
        filename: filename,
        title: path.parse(filename).name
      }));

      const inputJsonData = {
        challenge_info: {
          challenge_id: "round_1b_001",
          test_case_name: collectionName || "document_analysis",
          description: req.body.jobTask || "Document analysis task"
        },
        documents: documentsArray,
        persona: {
          role: req.body.personaRole || "Analyst"
        },
        job_to_be_done: {
          task: req.body.jobTask || "Analyze documents and extract insights"
        }
      };

      const inputJsonPath = path.join(collectionPath, 'challenge1b_input.json');
      fs.writeFileSync(inputJsonPath, JSON.stringify(inputJsonData, null, 2));

      // Also persist a root-level copy for UI/debugging (since collection folder is cleaned up later)
      try {
        const uploadsInputCopy = path.join(uploadsDir, 'challenge1b_input.json');
        fs.writeFileSync(uploadsInputCopy, JSON.stringify(inputJsonData, null, 2));
      } catch (e) {
        console.warn('Warning: could not write uploads root input copy:', e.message || e);
      }

  console.log('Created challenge1b_input.json with', documentsArray.length, 'documents.');

      // Persist collection metadata in MongoDB
      let collectionDoc = null;
      try {
        // Prefer explicit userId sent in the multipart/form-data (frontend appends 'userId').
        // Fallback to req.userId or Authorization Bearer token verification.
        let userId = null;
        try {
          if (req.body && req.body.userId) {
            userId = req.body.userId;
            console.debug('Upload: using userId from request body:', userId);
          } else if (req.userId) {
            userId = req.userId;
            console.debug('Upload: using req.userId (middleware):', userId);
          } else {
            const authHeader = (req.headers && req.headers.authorization) || '';
            const match = authHeader.match(/^Bearer\s+(.+)$/i);
            if (match) {
              const idToken = match[1];
              try {
                const decoded = await verifyIdToken(idToken);
                if (decoded && decoded.uid) {
                  userId = decoded.uid;
                  console.debug('Upload: verified idToken, uid=', userId);
                }
              } catch (e) {
                console.warn('Upload: failed to verify ID token:', e && e.message ? e.message : String(e));
              }
            }
          }
        } catch (e) {
          console.warn('Upload: error while resolving userId:', e && e.message ? e.message : String(e));
        }

        // generate a stable collectionId for frontend lookups
        const collectionId = randomUUID();
        collectionDoc = await Collection.create({
          collectionId,
          userId: userId || null, // saved from body or resolved uid
          name: collectionName,
          persona: req.body.personaRole,
          jobToBeDone: req.body.jobTask,
          documents: documentsForDb,
          status: 'processing'
        });
        console.debug('Upload: created collection', { collectionId: collectionDoc.collectionId, mongoId: collectionDoc._id, userId: collectionDoc.userId });
      } catch (e) {
        // Handle duplicate name for same user (unique index violation)
        if (e && e.code === 11000) {
          return res.status(409).json({ error: 'A collection with that name already exists for this user. Please use a different name.' });
        }
        console.warn('Failed to save collection metadata:', e && e.message ? e.message : String(e));
      }

      try {
        const pythonScriptPath = path.resolve(__dirname, '../../round_1b/run.py');
        const pythonScriptDir = path.resolve(__dirname, '../../round_1b');
        const outputPath = path.join(collectionPath, 'challenge1b_output.json');

        const resolved = resolvePythonExecutable();
        if (!resolved) {
          return res.status(500).json({
            error: 'Python not found',
            details: 'Could not locate a Python 3 interpreter. Install Python 3 and ensure it is on PATH, or set PYTHON_EXECUTABLE to the full path.'
          });
        }
        const { cmd: pythonExecutable, argsPrefix } = resolved;

        const pythonProcess = spawn(
          pythonExecutable,
          [...argsPrefix, pythonScriptPath, '--input_dir', collectionPath, '--output_path', outputPath],
          { cwd: pythonScriptDir }
        );

        // Handle spawn errors (e.g., ENOENT) to avoid crashing the server
        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          return res.status(500).json({
            error: 'Failed to start Python process',
            details: err && err.message ? err.message : String(err),
            attemptedCommand: `${pythonExecutable} ${[...argsPrefix, pythonScriptPath].join(' ')}`
          });
        });

        let stderr = '';
        pythonProcess.stdout.on('data', data => console.log(`Python STDOUT: ${data}`));
        pythonProcess.stderr.on('data', data => {
          console.error(`Python STDERR: ${data}`);
          stderr += data.toString();
        });

        pythonProcess.on('close', async (code) => {
          if (code !== 0) {
            return res.status(500).json({ error: 'Python script failed.', details: stderr });
          }
          const analysisResult = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
          // Persist a copy at uploads root for UI/direct access
          try {
            const uploadsOutput = path.join(uploadsDir, 'challenge1b_output.json');
            fs.writeFileSync(uploadsOutput, JSON.stringify(analysisResult, null, 2));
          } catch (e) {
            console.warn('Warning: could not write uploads root output copy:', e.message || e);
          }
          // Update stored collection with analysis result and return
          try {
            if (collectionDoc) {
              collectionDoc.analysis = analysisResult;
              collectionDoc.status = 'ready';
              collectionDoc.lastRunAt = new Date();
              await collectionDoc.save();
            }
          } catch (e) {
            console.warn('Failed to update collection with analysis:', e && e.message ? e.message : String(e));
          }

          res.status(201).json({
            collectionName,
            collectionId: collectionDoc ? collectionDoc.collectionId : null,
            analysisData: analysisResult,
            documents: documentsForDb,
            cloud: (s3Helpers && process.env.S3_BUCKET && process.env.AWS_REGION) ? {
              bucket: process.env.S3_BUCKET,
              prefix: `uploads/${uniqueId}/`
            } : null
          });
          // Only delete if collectionPath is a subfolder of uploadsDir
          if (collectionPath !== uploadsDir && collectionPath.startsWith(uploadsDir)) {
            fs.rm(collectionPath, { recursive: true, force: true }, () => {});
          }
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to process upload.' });
      }
    });

    router.get('/history', async (req, res) => {
      try {
        const { userId, collectionId } = req.query;
        if (!userId) {
          return res.status(400).json({ error: 'userId query parameter is required' });
        }

        if (collectionId) {
          // Return full collection details if it belongs to the given userId
          const col = await Collection.findOne({ collectionId, userId }).lean();
          if (!col) return res.status(404).json({ error: 'Collection not found for this user' });

          // Build accessible URLs for each document:
          // - If stored in S3 (has storedName), generate fresh presigned URL
          // - Otherwise point to the frontend public pdfs folder
          const hostBase = `${req.protocol}://${req.get('host')}`;
          const frontendPdfsDir = path.resolve(__dirname, '../../frontend/public/pdfs');
          if (!fs.existsSync(frontendPdfsDir)) {
             try { fs.mkdirSync(frontendPdfsDir, { recursive: true }); } catch(e) {}
          }

          const docsWithUrls = await Promise.all((col.documents || []).map(async (d) => {
            const originalName = d.originalName || '';
            const storedName = d.storedName || '';
            const filenameFallback = originalName || path.basename(storedName) || '';
            
            let accessibleUrl = null;
            
            // If document is stored in S3, generate fresh presigned URL
            if (storedName) {
               if (s3Helpers && process.env.S3_BUCKET && process.env.AWS_REGION) {
                  try {
                    accessibleUrl = await s3Helpers.s3Presign(storedName, 60 * 60); // 1 hour expiry
                    console.log(`[API] Generated S3 URL for ${storedName}`);
                    
                    // Also ensure the file exists locally in frontend/public/pdfs for fallback/hybrid access
                    if (filenameFallback) {
                        const localDest = path.join(frontendPdfsDir, filenameFallback);
                        if (!fs.existsSync(localDest)) {
                            console.log(`[API] Downloading ${storedName} to local cache: ${localDest}`);
                            try {
                                await s3Helpers.s3GetToPath(storedName, localDest);
                            } catch (dlErr) {
                                console.warn(`[API] Failed to download ${storedName} to local cache:`, dlErr.message);
                            }
                        }
                    }

                  } catch (e) {
                    console.warn('Failed to generate presigned URL for', storedName, e && e.message ? e.message : String(e));
                    // Fall through to local URL fallback
                  }
               } else {
                 console.warn('S3 configured incorrectly or missing helpers', { 
                   hasHelpers: !!s3Helpers, 
                   bucket: process.env.S3_BUCKET, 
                   region: process.env.AWS_REGION 
                 });
               }
            }
            
            // Fallback to local public PDFs folder or original publicUrl
            if (!accessibleUrl) {
              if (d.publicUrl && !d.publicUrl.includes('localhost:5001')) {
                // Use existing publicUrl if it's not pointing to backend
                accessibleUrl = d.publicUrl;
              } else if (filenameFallback && !storedName) {
                // Construct local URL pointing to frontend ONLY if not supposed to be in S3
                accessibleUrl = `/pdfs/${encodeURIComponent(filenameFallback)}`;
              }
            }
            
            return { ...d, accessibleUrl };
          }));

          return res.json({ ...col, documents: docsWithUrls });
        }

        // Return list view for the user's collections
        const cols = await Collection.find({ userId }).lean().sort({ createdAt: -1 });
        const list = cols.map(c => ({
          collectionId: c.collectionId || c._id,
          name: c.name,
          status: c.status,
          createdAt: c.createdAt,
          lastRunAt: c.lastRunAt,
          documentsCount: Array.isArray(c.documents) ? c.documents.length : 0,
          firstDocument: (Array.isArray(c.documents) && c.documents.length > 0) ? c.documents[0] : null,
          persona: c.persona,
          jobToBeDone: c.jobToBeDone
        }));
        res.json(list);
      } catch (e) {
        res.status(500).json({ error: 'Failed to fetch history', details: e && e.message ? e.message : String(e) });
      }
    });

    // Expose the latest analysis output for the frontend when session data is missing
    router.get('/output', async (req, res) => {
      try {
        const outPath = path.join(uploadsDir, 'challenge1b_output.json');
        if (!fs.existsSync(outPath)) {
          return res.status(404).json({ error: 'No analysis output found' });
        }
        const data = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
        res.json(data);
      } catch (e) {
        res.status(500).json({ error: 'Failed to read output', details: e && e.message ? e.message : String(e) });
      }
    });

    // Related content search: given selected text, find similar/contradict/extend/problem snippets
    router.post('/related', async (req, res) => {
      try {
        const { text, top_k } = req.body || {};
        if (!text || typeof text !== 'string' || text.trim().length < 3) {
          return res.status(400).json({ error: 'text is required' });
        }
        const pythonScriptPath = path.resolve(__dirname, '../../round_1b/search.py');
        const pythonScriptDir = path.resolve(__dirname, '../../round_1b');

        const resolved = resolvePythonExecutable();
        if (!resolved) {
          return res.status(500).json({
            error: 'Python not found',
            details: 'Install Python 3 and ensure it is on PATH, or set PYTHON_EXECUTABLE.'
          });
        }
        const { cmd: pythonExecutable, argsPrefix } = resolved;

        const args = [
          ...argsPrefix,
          pythonScriptPath,
          '--query', text,
          '--top_k', String(Math.max(3, Math.min(Number(top_k) || 10, 20)))
        ];

        const proc = spawn(pythonExecutable, args, { cwd: pythonScriptDir });
        let out = '';
        let err = '';
        proc.stdout.on('data', (d) => { out += d.toString(); });
        proc.stderr.on('data', (d) => { err += d.toString(); });
        proc.on('error', (e) => {
          return res.status(500).json({ error: 'Failed to start search', details: e && e.message ? e.message : String(e) });
        });
        proc.on('close', (code) => {
          if (code !== 0) {
            return res.status(500).json({ error: 'Search script failed', details: err });
          }
          let payload;
          try { payload = JSON.parse(out); } catch (e) { payload = { results: [] }; }

          // Lightweight relationship tagging heuristics
          const rel_map = [];
          const q = text.toLowerCase();
          const contradiction_terms = ['contradict', 'oppose', 'inconsistent', 'fails', 'not work', "doesn't work", 'no improvement', 'worse'];
          const extension_terms = ['extend', 'improve', 'enhance', 'build on', 'novel', 'we propose', 'we present'];
          const problem_terms = ['limitation', 'problem', 'issue', 'challenge', 'risk', 'bias', 'drawback'];

          for (const r of (payload.results || [])) {
            const s = (r.snippet || '').toLowerCase();
            let relation = 'similar';
            if (contradiction_terms.some(t => s.includes(t))) relation = 'contradictory';
            else if (extension_terms.some(t => s.includes(t))) relation = 'extends';
            else if (problem_terms.some(t => s.includes(t))) relation = 'problems';
            rel_map.push({ ...r, relation });
          }
          res.json({ query: text, results: rel_map });
        });
      } catch (e) {
        res.status(500).json({ error: 'Internal error', details: e && e.message ? e.message : String(e) });
      }
    });

    // New: upsert Firebase user on sign-in
router.post('/auth/google', async (req, res) => {
  try {
    // Accept idToken either in body.idToken or Authorization header
    let idToken = req.body && req.body.idToken;
    if (!idToken) {
      const authHeader = (req.headers && req.headers.authorization) || '';
      const m = authHeader.match(/^Bearer\s+(.+)$/i);
      if (m) idToken = m[1];
    }
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required (body.idToken or Authorization: Bearer <token>)' });
    }

    // Verify token (this will lazy-init firebase admin). Throws if invalid or admin not configured.
    const decoded = await verifyIdToken(idToken);
    if (!decoded || !decoded.uid) {
      return res.status(401).json({ error: 'Invalid ID token' });
    }
    const uid = decoded.uid;

    // Try to enrich profile using admin SDK if available
    let providerData = decoded.provider_id ? [decoded.provider_id] : [];
    let photoURL = decoded.picture || decoded.photoURL || null;
    let displayName = decoded.name || decoded.displayName || null;
    let email = decoded.email || null;
    try {
      const admin = getAdmin();
      if (admin) {
        // admin may be null if not configured
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord) {
          providerData = userRecord.providerData || providerData;
          photoURL = photoURL || userRecord.photoURL || null;
          displayName = displayName || userRecord.displayName || null;
          email = email || userRecord.email || null;
        }
      }
    } catch (e) {
      // ignore enrichment errors; we'll still upsert using decoded token
      console.warn('Could not fetch full userRecord from Firebase admin:', e && e.message ? e.message : e);
    }

    // Upsert user in MongoDB
    const now = new Date();
    const update = {
      firebaseUid: uid,
      email,
      displayName,
      photoURL,
      providerData,
      lastSeen: now,
      customClaims: decoded || {}
    };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const saved = await User.findOneAndUpdate({ firebaseUid: uid }, update, opts).lean();

    return res.json({ user: saved });
  } catch (err) {
    console.error('Auth upsert error:', err && err.message ? err.message : err);
    // If firebase admin not configured the verifyIdToken throws a clear error; forward it
    return res.status(500).json({ error: 'Failed to upsert user', details: err && err.message ? err.message : String(err) });
  }
});

    // Add: list collections for any user (lightweight summary)
router.get('/collections', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const cols = await Collection.find({ userId }).lean().sort({ createdAt: -1 });
    const list = cols.map(c => ({
      collectionId: c.collectionId || c._id,
      name: c.name,
      jobToBeDone: c.jobToBeDone,
      persona: c.persona,
      status: c.status,
      createdAt: c.createdAt,
      lastRunAt: c.lastRunAt,
      documentsCount: Array.isArray(c.documents) ? c.documents.length : 0
    }));

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch collections', details: e && e.message ? e.message : String(e) });
  }
});

// Add files to an existing collection
router.post('/collections/:collectionId/add-files', upload.array('pdfs'), async (req, res) => {
  try {
    const { collectionId } = req.params;
    if (!collectionId) {
      return res.status(400).json({ error: 'collectionId is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Resolve userId
    let userId = null;
    try {
      if (req.body && req.body.userId) {
        userId = req.body.userId;
      } else if (req.userId) {
        userId = req.userId;
      } else {
        const authHeader = (req.headers && req.headers.authorization) || '';
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        if (match) {
          const idToken = match[1];
          try {
            const decoded = await verifyIdToken(idToken);
            if (decoded && decoded.uid) {
              userId = decoded.uid;
            }
          } catch (e) {
            console.warn('Failed to verify ID token:', e && e.message ? e.message : String(e));
          }
        }
      }
    } catch (e) {
      console.warn('Error while resolving userId:', e && e.message ? e.message : String(e));
    }

    // Find the collection
    const collection = await Collection.findOne({ collectionId, userId: userId || null });
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Ensure S3 helpers are configured
    const s3Enabled = !!(s3Helpers && process.env.S3_BUCKET && process.env.AWS_REGION);
    if (!s3Enabled) {
      return res.status(500).json({ error: 'S3 not configured. Set AWS_REGION and S3_BUCKET and ensure services/s3 is available.' });
    }

    // Upload new files to S3
    const newDocuments = [];
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const frontendPdfsDir = path.resolve(__dirname, '../../frontend/public/pdfs');
    fs.mkdirSync(frontendPdfsDir, { recursive: true });

    for (const file of req.files) {
      // Copy to frontend/public/pdfs for viewing
      const frontendDest = path.join(frontendPdfsDir, file.originalname);
      try {
        fs.copyFileSync(file.path, frontendDest);
      } catch (e) {
        console.warn('Failed to copy to frontend PDFs:', e && e.message ? e.message : String(e));
      }

      // Upload to S3
      try {
        const ext = path.extname(file.originalname) || '.pdf';
        const key = `uploads/${uniqueId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        await s3Helpers.s3PutFile(file.path, key, file.mimetype || 'application/pdf');
        let publicUrl = null;
        try {
          publicUrl = await s3Helpers.s3Presign(key, 60 * 60);
        } catch (_) {
          publicUrl = null;
        }

        newDocuments.push({
          originalName: file.originalname,
          storedName: key,
          size: file.size,
          mimeType: file.mimetype,
          publicUrl,
          pages: null
        });

        // Clean up temp file
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      } catch (e) {
        console.warn('S3 upload failed for', file.originalname, e && e.message ? e.message : String(e));
      }
    }

    // Add new documents to collection
    if (!Array.isArray(collection.documents)) {
      collection.documents = [];
    }
    collection.documents.push(...newDocuments);
    collection.status = 'ready'; // Mark as ready since files are added
    await collection.save();

    res.json({
      success: true,
      collectionId: collection.collectionId,
      addedCount: newDocuments.length,
      totalDocuments: collection.documents.length,
      documents: collection.documents
    });
  } catch (e) {
    console.error('Error adding files to collection:', e && e.message ? e.message : String(e));
    res.status(500).json({ error: 'Failed to add files to collection', details: e && e.message ? e.message : String(e) });
  }
});

    module.exports = router;
