const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY = 60 * 1024;
const MAX_POSTING = 12000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript'
};

function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('Request too large'));
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

async function askGemini(prompt) {
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
        contents: [{ parts: [{ text: prompt }] }],
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
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
  return JSON.parse(text);
}

async function handleQuestions(body) {
  const posting = String(body.posting || '').slice(0, MAX_POSTING);

  const prompt = `You are a sharp, funny, and brutally honest technical interviewer.
Read the job posting below and write exactly 3 difficult interview questions tailored to it.
Reference specific requirements, tools, or responsibilities from the posting. Make the questions hard but fair.
Return ONLY JSON in this shape: {"questions": ["question 1", "question 2", "question 3"]}

JOB POSTING:
"""
${posting}
"""`;

  const out = await askGemini(prompt);
  const questions = (out.questions || [])
    .filter(q => typeof q === 'string' && q.trim())
    .slice(0, 3);

  if (questions.length < 3) throw new Error('The model did not return 3 questions. Try again.');
  return { questions };
}

async function handleGrade(body) {
  const posting = String(body.posting || '').slice(0, MAX_POSTING);
  const question = String(body.question || '').slice(0, 1000);
  const answer = String(body.answer || '').slice(0, 4000);

  const prompt = `You are a funny, brutal interviewer grading one answer.
Score the answer from 0 to 6 (integer) for accuracy, specificity, relevance to the job, and confidence.
Write a short, funny, brutally honest reaction (1 to 2 sentences) about the answer's quality.
Roast the answer, never the person's identity, appearance, or background.
Give one concrete tip for improvement.
Set verdict to "pass" if score is 4 or higher, otherwise "fail".
Return ONLY JSON: {"score": 0, "verdict": "pass" or "fail", "reaction": "...", "feedback": "..."}

JOB POSTING:
"""${posting}"""

QUESTION: ${question}

CANDIDATE ANSWER:
"""${answer}"""`;

  const out = await askGemini(prompt);
  const score = Math.max(0, Math.min(6, Math.round(Number(out.score) || 0)));

  return {
    score,
    verdict: score >= 4 ? 'pass' : 'fail',
    reaction: String(out.reaction || 'The interviewer is speechless.'),
    feedback: String(out.feedback || 'Be more specific.')
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/questions') {
    try {
      return send(res, 200, await handleQuestions(await readJson(req)));
    } catch (e) {
      console.error(e);
      return send(res, 500, { error: e.message });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/grade') {
    try {
      return send(res, 200, await handleGrade(await readJson(req)));
    } catch (e) {
      console.error(e);
      return send(res, 500, { error: e.message });
    }
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