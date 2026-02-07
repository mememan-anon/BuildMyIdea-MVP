2026-02-07: Instruction added — Coder agent behavior
- Directive: The coder agent must always implement tasks assigned by the main agent or the planner agent. It should continue working on assigned implementation tasks until completion, and must report back when a task is completed or if it encounters any issue/blocker that prevents progress.
- Applied to: coder subagent(s)
- Source: user request (Telegram Mememan l Celar)

2026-02-07: User preference for pushes
- Preference: When the user instructs the assistant to push to a repository, the assistant should first confirm that the repo exists and then proceed to push without asking for additional explicit permission each time.
- Constraint: The assistant will NOT use stored credentials (GITHUB_TOKEN or similar) to push until the user has given an explicit one-time authorization to use those stored credentials. This is required for security.
- Applied to: main agent behavior for repo pushes
- Source: user request (Telegram Mememan l Celar)

2026-02-07: Completed projects
- ShieldClaw: Marked complete (all modules implemented, tests passing, demos validated, verification report and v1.0.0 release created).
- Mad Sniper: OpenClaw integration completed, tests and demos validated, progress and verification updated and pushed.
- Source: user confirmation and coder subagent reports

2026-02-07: Twitter/X usage preference
- Preference: Use X API v2 for posting tweets when available. Default to v2 endpoints for posting and other write operations.
- Constraint: Free account limits apply (280 characters). If a message exceeds 280 characters, split into multiple tweets (threads) automatically unless the user specifies otherwise.
- Applied to: x-api skill and main agent behavior for posting to X
- Source: user instruction (Telegram Mememan l Celar)

2026-02-07: Watchlist
- Accounts to monitor: KellyClaudeAI (id:2017406874270769152)
- Monitoring behavior: check for new tweets every 5 minutes, summarize new tweets, and notify the main session with a 1-line alert when a tweet exceeds 100 likes or mentions revenue/launch keywords.
- Source: user request (Telegram Mememan l Celar)

2026-02-07: Twitter task routing
- Preference: Any Twitter/X task the user assigns should be delegated to the coder subagent for execution. After the coder completes the task, the main agent will ingest the coder's report and summarize results back to the user.
- Applied to: task routing for Twitter/X operations
- Source: user instruction (Telegram Mememan l Celar)

2026-02-07: Twitter API version policy
- Directive: For any Twitter/X task (read or write), always use the X API v2 when available. Do not use browser automation or v1.1 endpoints for fetching or posting unless explicitly authorized by the user.
- Applied to: all agents and subagents handling Twitter/X tasks
- Source: user instruction (Telegram Mememan l Celar)

2026-02-07: Agent Operating Specification (CODING TASKS)
- Autonomous Agent Operating Specification: defines Planner/Coder/Main Agent roles and strict execution flow for coding tasks.
- Planner: Responsible for planning only (decompose, acceptance criteria, validate). Planner must not implement.
- Coder: Executes plans exactly, produces code/artifacts/tests, reports results. Coder must not redesign or expand scope.
- Main Agent: Coordinator/communicator with the user; must not redesign or add reasoning.
- Execution Flow: Task Intake → Planning → Implementation → Validation → Reporting. Only after Planner CHECKOFF can changes be pushed and reported.
- GitHub rules: commits pushed by system must use author/committer @zenoagent; only CHECKOFFed work is pushed.
- Hard Constraints: no silent fixes, no scope expansion, loop until Planner CHECKOFF.
- Applied to: All coding tasks and coder subagents.
- Source: user instruction (Telegram Mememan l Celar) 2026-02-07
