# LIRP 🎭

**Rehearse an interview with a character who has opinions.**

LARPerview lets you practice job interviews on purpose, with an over-the-top interviewer you can't take seriously. Pick a costume, upload your resume, paste a job posting, and the character runs the room: stage directions, tough questions, a cast audition score, costume-fitting notes for your resume, and a final offer or rejection letter written in character.

The point is to commit to a performance and get better at it. Everyone has been told to "be more confident," and this is a place to try it without faking anything to a real employer.

Built for **LarpHacks**, a DevFest event hosted on **November 1, 2026** at the University of Toronto.

## Features

- **Five costumes:** Hype Founder, Cold Bar Raiser, Friday 4:55 PM Recruiter, Drill Sergeant HR, and Nosy Auntie HR. Each has its own voice, grading style, and letters.
- **Resume costume fitting:** Suggests more dramatic but truthful ways to present your existing experience. Flags anything you need to confirm before using it.
- **Posting vocabulary:** Lists the keywords from the job posting that the character would overuse, so you can use them only where they're true.
- **Buzzword meter:** Counts corporate jargon as you type, and the interviewer calls it out.
- **Pressure mode:** A 90-second timer per answer.
- **Final letter:** An in-character offer or rejection letter based on your score.

## Tech Stack

- **Frontend:** Plain HTML, CSS, and JavaScript (no build step)
- **Backend:** Node.js with the built-in `http` module (no frameworks)
- **AI:** Google Gemini API (`gemini-2.5-flash-lite` by default)
- **Hosting:** Render (Web Service)

## Project Structure

```
larperview/
├── .gitignore        # keeps node_modules and .env out of Git
├── LICENSE           # MIT License
├── README.md         # this file
├── package.json      # start script and Node version
├── server.js         # serves the pages and calls the Gemini API
└── public/
    └── index.html    # the full front end
```

## Running Locally

**Requirements:** Node.js 18 or newer and a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

1. Clone the repo:
   ```bash
   git clone https://github.com/sour-OS/larperview.git
   cd larperview
   ```
2. Set your API key. Don't commit it.

   macOS/Linux:
   ```bash
   export GEMINI_API_KEY="your-key"
   ```

   Windows (PowerShell):
   ```powershell
   $env:GEMINI_API_KEY="your-key"
   ```
3. Optional: choose a different model.
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
4. Under **Environment**, add `GEMINI_API_KEY` with your key. Optionally add `GEMINI_MODEL`.
5. Deploy.

Free instances spin down after about 15 minutes without traffic, so the first load can be slow.

## Troubleshooting

- **404 from Gemini:** The model name isn't available to your key. List the available models with the `models` endpoint and set `GEMINI_MODEL` to one that supports `generateContent`.
- **503 from Gemini:** The model is busy. The server retries automatically. If it still fails, wait a moment or switch to another model.
- **401 from Gemini:** The API key is invalid. Create a new key in AI Studio that starts with `AIza`.

## Limitations

- LARPerview doesn't store resumes or answers. Each session is sent to Gemini and not saved.
- Grades and resume suggestions are AI-generated and can be wrong. Check every suggestion before you use it on a real resume.
- Free-tier Gemini limits can cause errors during heavy use.

## Contributing

Issues and pull requests are welcome. For larger changes, open an issue first to discuss what you'd like to change.

## Team

- Sourodeep
- Reuben
- Samar
- Krish

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
