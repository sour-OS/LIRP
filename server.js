const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY = 8 * 1024 * 1024;
const MAX_POSTING = 12000;
const MAX_RESUME_TEXT = 20000;
const PDF_TYPE = 'application/pdf';
const TEXT_TYPES = ['text/plain', 'text/markdown'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript'
};

function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('Request too large. Keep the resume under 4 MB.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function askGemini(parts) {
  if (!API_KEY) throw new Error('GEMINI_API_KEY is not set on the server.');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.9 }
      })
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    console.error('Gemini error', res.status, detail);
    throw new Error(`Gemini returned ${res.status}. Check the model name and API key.`);
  }

  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .filter(p => !p.thought)
    .map(p => p.text || '')
    .join('')
    .replace(/```json|```/g, '')
    .trim();
  return JSON.parse(text);
}

function resumeParts(resume) {
  if (!resume || !resume.data) return [];
  const mime = String(resume.mimeType || '');

  if (mime === PDF_TYPE) {
    return [
      { text: 'CANDIDATE RESUME (attached PDF):' },
      { inlineData: { mimeType: PDF_TYPE, data: resume.data } }
    ];
  }

  if (TEXT_TYPES.includes(mime)) {
    const text = Buffer.from(resume.data, 'base64').toString('utf8').slice(0, MAX_RESUME_TEXT);
    return [{ text: `CANDIDATE RESUME:\n"""\n${text}\n"""` }];
  }

  throw new Error('Unsupported resume type. Upload a PDF, TXT, or MD file.');
}

async function handlePrep(body) {
  const posting = String(body.posting || '').slice(0, MAX_POSTING);
  const costume = String(body.costume || 'a neutral recruiter').slice(0, 1000);
  const hasResume = !!body.resume;

  const prompt = `You are running a roleplay interview practice session. Stay fully in character as this interviewer: ${costume}

Your tasks:
1. Read the job posting${hasResume ? ' and the candidate resume that follows' : ''}.
2. Write one opening line the interviewer says, in character (1 to 2 sentences).
3. Give a fit score from 0 to 100 and a one-sentence in-character summary of how the candidate fits this role.
4. Write exactly 3 hard, specific interview questions for this role, asked in character. Reference the posting or resume where possible.
5. Give up to 4 resume glow-up suggestions. Each one reframes EXISTING experience with clearer, stronger language, or points out a metric the candidate could add IF they actually have it. Never invent jobs, degrees, certifications, skills, employers, or numbers. Set "verifyFirst" to true when the suggestion depends on the candidate confirming a fact.
6. List up to 6 keywords from the posting that the candidate should use ONLY where they are genuinely true of their experience.
7. Give 3 practical interview tips, written in the character's voice.

Return ONLY JSON in this shape:
{"opener":"","fit":0,"summary":"","questions":["","",""],"glowUp":[{"section":"","suggestion":"","verifyFirst":true}],"keywords":[""],"tips":["","",""]}

JOB POSTING:
"""
${posting}
"""`;

  const out = await askGemini([{ text: prompt }, ...resumeParts(body.resume)]);

  const questions = (Array.isArray(out.questions) ? out.questions : [])
    .filter(q => typeof q === 'string' && q.trim())
    .slice(0, 3);
  if (questions.length < 3) throw new Error('The model did not return 3 questions. Try again.');

  const glowUp = (Array.isArray(out.glowUp) ? out.glowUp : []).slice(0, 4).map(g => ({
    section: String(g.section || ''),
    suggestion: String(g.suggestion || ''),
    verifyFirst: !!g.verifyFirst
  }));

  return {
    opener: String(out.opener || 'Shall we begin?'),
    fit: clamp(Math.round(Number(out.fit) || 0), 0, 100),
    summary: String(out.summary || ''),
    questions,
    glowUp,
    keywords: (Array.isArray(out.keywords) ? out.keywords : []).map(String).slice(0, 6),
    tips: (Array.isArray(out.tips) ? out.tips : []).map(String).slice(0, 3)
  };
}

async function handleGrade(body) {
  const posting = String(body.posting || '').slice(0, MAX_POSTING);
  const costume = String(body.costume || 'a neutral recruiter').slice(0, 1000);
  const question = String(body.question || '').slice(0, 1000);
  const answer = String(body.answer || '').slice(0, 4000);

  const prompt = `You are a funny, brutal interviewer grading one answer. Stay in character as: ${costume}

Score the answer from 0 to 6 (integer) for accuracy, specificity, relevance to the job, and confidence.
Write a short, funny, brutally honest in-character reaction (1 to 2 sentences). Roast the answer, never the candidate's identity, appearance, or background.
Give one concrete tip for improvement.
Set verdict to "pass" if score is 4 or higher, otherwise "fail".
Return ONLY JSON: {"score": 0, "verdict": "pass" or "fail", "reaction": "...", "feedback": "..."}

JOB POSTING:
"""${posting}"""

QUESTION: ${question}

CANDIDATE ANSWER:
"""${answer}"""`;

  const out = await askGemini([{ text: prompt }]);
  const score = clamp(Math.round(Number(out.score) || 0), 0, 6);

  return {
    score,
    verdict: score >= 4 ? 'pass' : 'fail',
    reaction: String(out.reaction || 'The interviewer is speechless.'),
    feedback: String(out.feedback || 'Be more specific.')
  };
}

async function run(handler, req, res) {
  try {
    return send(res, 200, await handler(await readJson(req)));
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: e.message });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/prep') {
    return run(handlePrep, req, res);
  }

  if (req.method === 'POST' && url.pathname === '/api/grade') {
    return run(handleGrade, req, res);
  }

  if (req.method === 'GET') {
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.normalize(path.join(PUBLIC_DIR, rel));

    if (!file.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end();
    }

    return fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  }

  res.writeHead(405);
  res.end();
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));