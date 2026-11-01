# LIRP 🎭

**Rehearse an interview with a character who has opinions.**

LIRP lets you practice job interviews on purpose, with an over-the-top interviewer you can't take seriously. Pick an interviewer style, upload your resume, paste a job posting, and the character runs the room: stage directions, tough questions read aloud in a voice, a cast audition score, costume-fitting notes for your resume, and a final offer or rejection letter written in character.

LIRP helps you larp more effectively by showing how weak your larp is, as the more you larp, the less you larp.

The point is to commit to a performance and get better at it. Everyone has been told to "be more confident," and this is a place to try it without faking anything to a real employer.

Built for **LarpHacks**, a DevFest event hosted on **November 1, 2026** at the University of Toronto.

Tracks:
- Main
- ElevenLabs

## Features

- **Five costumes:** Hype Founder, Cold Bar Raiser, Friday 4:55 PM Recruiter, Drill Sergeant HR, and Nosy Auntie HR. Each has its own voice, grading style, and letters.
- **Voice narration (ElevenLabs):** Click **🔊 Hear it** to hear the character's opener and questions in an ElevenLabs voice.
- **Resume costume fitting:** Suggests more dramatic but truthful ways to present your existing experience. Flags anything you need to confirm before using it.
- **Posting vocabulary:** Lists the keywords from the job posting that the character would overuse, so you can use them only where they're true.
- **Buzzword meter:** Counts corporate jargon as you type, and the interviewer calls it out.
- **Pressure mode:** A 90-second timer per answer.
- **Final letter:** An in-character offer or rejection letter based on your score.

## Tech Stack

- **Frontend:** Plain HTML, CSS, and JavaScript (no build step)
- **Backend:** Node.js with the built-in `http` module (no frameworks)
- **AI:** Google Gemini API for prep, grading, and roleplay (`gemini-2.5-flash-lite` by default)
- **Voice:** ElevenLabs Text to Speech API
- **Hosting:** Render (Web Service)

## Project Structure

```
LIRP/
├── .gitignore        # keeps node_modules and .env out of Git
├── LICENSE           # MIT License
├── README.md         # this file
├── package.json      # start script and Node version
├── server.js         # serves the pages, calls Gemini, and proxies ElevenLabs
└── public/
    └── index.html    # the full front end
```

## Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes | None | Gemini API key from Google AI Studio |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-lite` | Gemini model name |
| `ELEVENLABS_API_KEY` | No | None | ElevenLabs key with Text to Speech access. Without it, the voice button shows an error and everything else still works |
| `ELEVENLABS_VOICE_ID` | No | `21m00Tcm4TlvDq8ikWAM` | ElevenLabs voice ID |

API keys are read only on the server. They are never sent to the browser.

## Running Locally

**Requirements:** Node.js 18 or newer, a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey), and optionally an ElevenLabs API key.

1. Clone the repo:
   ```bash
   git clone https://github.com/sour-OS/LIRP.git
   cd LIRP
   ```
2. Set your keys in the same terminal where you'll run the server. Don't commit them.

   macOS/Linux:
   ```bash
   export GEMINI_API_KEY="your-gemini-key"
   export ELEVENLABS_API_KEY="your-elevenlabs-key"   # optional
   ```

   Windows (PowerShell):
   ```powershell
   $env:GEMINI_API_KEY="your-gemini-key"
   $env:ELEVENLABS_API_KEY="your-elevenlabs-key"     # optional
   ```
3. Optional: choose a different Gemini model.
   ```bash
   export GEMINI_MODEL="gemini-2.5-flash"
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000`.

## Deploying on Render

1. Push the repo to GitHub.
2. In Render, choose **New > Web Service** and connect the repo.
3. Set:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Under **Environment**, add `GEMINI_API_KEY`. Optionally add `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`.
5. Deploy.

Free instances spin down after about 15 minutes without traffic, so the first load can be slow.

## Troubleshooting

- **404 from Gemini:** The model name isn't available to your key. Check the models your key can access and set `GEMINI_MODEL` to one that supports `generateContent`.
- **503 from Gemini:** The model is busy. The server retries automatically. If it still fails, wait a moment or switch to another model.
- **401 from Gemini:** The API key is invalid. Create a new key in AI Studio that starts with `AIza`.
- **"The voice is unavailable right now" or no audio:** Check that `ELEVENLABS_API_KEY` is set, that the key has Text to Speech access, and that your ElevenLabs quota isn't used up. The Render logs show the exact ElevenLabs error.

## Limitations

- LIRP doesn't store resumes or answers. Each session is sent to Gemini and, for voice, to ElevenLabs, and isn't saved by LIRP.
- Grades and resume suggestions are AI-generated and can be wrong. Check every suggestion before you use it on a real resume.
- Free-tier Gemini and ElevenLabs limits can cause errors during heavy use.

## Contributing

Issues and pull requests are welcome. For larger changes, open an issue first to discuss what you'd like to change.

## Team

- Sourodeep
- Reuben
- Samar
- Krish

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
