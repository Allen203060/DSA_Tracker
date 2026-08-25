# DSA Tracker & Spaced Repetition App

## About the Project
DSA Tracker is a full-stack web application designed to help users master Data Structures and Algorithms (DSA) through intelligent, spaced repetition using the SuperMemo-2 (SM-2) algorithm. Rather than relying on traditional self-reporting, this application enforces active recall by requiring users to type out their logic in natural language. An AI "Study Buddy" then evaluates the response against the original notes, scores the answer, and automatically updates the spaced repetition schedule.

### Core Architecture
- **Frontend**: React + Vite, Tailwind CSS (Modern aesthetics, Dark Mode, Glassmorphism)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI Integration**: LangChain.js via OpenRouter API
- **Environment**: Docker Compose (Full-stack isolated development environment)

## Current Progress & Features
- **AI-Graded SM-2 Loop**: Replaced manual 0-5 self-rating with an AI evaluator that grades typed logic and updates the SM-2 schedule.
- **AI Enhanced Notes**: LangChain automatically cleans, structures, and converts raw student notes into pedagogical Markdown guides.
- **Structured Note Formatting**: AI notes feature strict section headers with emojis (e.g., 💡 Core Intuition, 🛠️ Algorithm Steps, ⚠️ Edge Cases), bullet points, and double-spaced paragraphs preserved perfectly in the frontend UI.
- **Hierarchical Taxonomy Accordion**: Left sidebar features a two-tiered taxonomy system where primary topics (e.g., Stack, Queue) are kept distinct from expandable subtopics (e.g., Monotonic Stack, Sliding Window). Auto-categorization using dynamic taxonomy inference.
- **Question Management**: Full CRUD capabilities, Problem URL context (LeetCode link integration in AI context & UI), and a full schedule view distinguishing "Due Today" from "All Questions".
- **Intelligent Scheduling**: Initial revision schedule offset places newly logged questions automatically 1 day into the future.
- **Graft AI Agent Integration**: Integrated NanoNets Graft (`@nanonets/graft`) to turbocharge AI coding agents. Graft generates deterministic, local knowledge graphs in `graft/` and wires into agents (via `.gemini/`, `GEMINI.md`, `AGENTS.md`) to eliminate exploration overhead and boost architectural reasoning.

## How to Set Up the Project

This project is fully dockerized, ensuring a seamless and isolated development environment.

### Prerequisites
- [Docker](https://www.docker.com/get-started) and Docker Compose installed on your machine.
- An [OpenRouter](https://openrouter.ai/) API Key (required for LangChain AI grading features).

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd DSA_Tracker
   ```

2. **Environment Configuration:**
   Create a `.env` file inside the `server/` directory and add your required API keys and port configuration:
   ```env
   PORT=5000
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   # MongoDB URI is automatically handled by docker-compose
   ```

3. **Build and Run the Stack:**
   Run the following command in the root of the project to spin up the MongoDB database, Node.js server, and React client simultaneously:
   ```bash
   docker-compose up --build
   ```

4. **Access the Application:**
   - **Frontend (Client)**: [http://localhost:5173](http://localhost:5173)
   - **Backend API (Server)**: [http://localhost:5000](http://localhost:5000)
   - **MongoDB**: Exposed locally on port `27017`

### Interacting with Graft (AI Agents)
The project includes a `graft/` folder that houses the mapped context graph for AI agents. 
If you use coding agents (like Claude Code, Cursor, or Gemini), they will automatically detect the Graft setup and use it for zero-exploration codebase reasoning.
- To refresh the graph after heavy structural changes, run:
  ```bash
  npx @nanonets/graft build
  ```
