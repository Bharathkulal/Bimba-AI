# Agent Behavioral Rules: Error Handling, Retry, & Resilience

To prevent silent terminations, premature task cancellations, and state loss during agent operations, all agents (including future instances of Antigravity or other AI coding assistants) working on this repository MUST adhere to the following rules.

---

## 1. Robust Network & API Invocations
- **Timeouts with Exponential Backoff**: Never issue network requests without a timeout. For transient errors (e.g., rate limits, connection resets, DNS resolution issues), implement a retry policy with exponential backoff (e.g., retry attempts: 3 to 5, initial delay: 1.0s, backoff factor: 2.0).
- **Graceful Error Handling**: Do not let connection errors propagate silently. Wrap call sites in try-except/try-catch structures, identify the specific exception/error subclass, and log detailed diagnostics.
- **Failover Chains**: If multiple providers or endpoints are available, implement prioritized fallback mechanisms so that a failure in one provider automatically fails over to the next in sequence.

## 2. Preventing Premature Task Cancellations
- **Avoid Unnecessary Cancellations**: Do not terminate long-running processes (e.g., dev server startup, database seeding, text extractions, large AI parsing pipelines) unless it is absolutely clear they are hanging indefinitely.
- **Adaptive Timeout Limits**: Distinguish between quick API calls (e.g., metadata checks: 5–10s timeout) and resource-intensive jobs (e.g., large document parsing or generation: 30–60s timeout). Use appropriate timeout bounds for each category.

## 3. Preserving Agent State & Work-in-Progress
- **State Checkpointing**: During long, multi-step tasks, save state information to scratch files or database collections at key checkpoints. If the execution is interrupted or cancelled, the agent must be able to read the saved state and resume from the last successful checkpoint instead of restarting from scratch.
- **Auto-Recovery**: If a previous step failed or was interrupted, verify existing files and checkpoints before starting a clean run to resume the unfinished operation automatically.

## 4. Verbose Logging of Cancellations & Failures
- **Cancellation Reasons**: If a command or process is killed or timed out, log the exact event sequence, elapsed time, process exit code, and stdout/stderr output.
- **Detailed Stack Traces**: Ensure exceptions are printed with complete stack traces and contextual parameter logs (excluding raw API keys or passwords, which must be masked).

## 5. Non-Silent Terminations & Recovery Steps
- **Clear Error Messaging**: If an operation fails and cannot be recovered automatically, NEVER exit silently or return a generic "Failed" status.
- **Actionable Recovery Steps**: Always output a structured, human-readable error message that details:
  1. What failed and at which stage.
  2. The exact error reason.
  3. Actionable recovery steps (e.g., verify API key environment variables, check system online status, adjust database connection strings, rerun dependency checks).

---

By enforcing these guidelines, we ensure maximum execution resilience, transparency, and consistency across all codebase tasks.
