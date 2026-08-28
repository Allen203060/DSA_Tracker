# Development Challenges & Solutions

## Challenge 1: Connection Reset By Peer (Docker/Express)
**The Bug/Challenge:**
When attempting to `curl` the `/api/ai/classify` endpoint after transitioning to OpenRouter, the terminal returned `Connection reset by peer`.
**The Root Cause/Trade-off:**
Docker prioritized the existing anonymous volume (`/app/node_modules`) over the newly built image's dependencies, causing an `ERR_MODULE_NOT_FOUND` crash loop on startup.
**The Solution:**
Ran `docker compose up --build -V -d` to force Docker to renew anonymous volumes.

## Challenge 2: Mongoose Schema Validation Error (500 Internal Server Error)
**The Bug/Challenge:**
When submitting a new question from the React frontend, the UI threw a `500 Internal Server Error`.
**The Root Cause/Trade-off:**
By modifying the frontend `catch` block to expose `error.response.data.error`, we discovered: `Question validation failed: url: Path 'url' is required.` The Mongoose schema strictly required a URL, but the frontend was designed to treat the URL as an optional field. Because the URL string was empty, MongoDB rejected the document insertion, triggering a 500 error in the Express route.
**The Solution:**
Updated the Mongoose schema definition for the `url` field to `required: false`.

## Challenge 3: OpenRouter Credit Limit & 4096-Token Default Reserve Error
**The Problem:**
OpenRouter returned an error: `This request requires more credits, or fewer max_tokens. You requested up to 4096 tokens, but can only afford 1766`.
**Root Cause:**
By default, `ChatOpenRouter` requests the max context window (4096 tokens) if `maxTokens` is unconstrained, causing OpenRouter's pre-flight balance check to reject requests on accounts with remaining but smaller credit balances.
**Solution:**
1. Switched model to `nvidia/nemotron-3.5-lightning` (with free model fallback `nvidia/nemotron-3-super-120b-a12b:free`).
2. Explicitly configured `maxTokens: 1000` in `ChatOpenRouter` instantiation, limiting the pre-flight token reserve check to 1000 tokens.
**Key Takeaway:**
Always set an explicit `maxTokens` cap on LLM calls when using pay-per-token API gateways to avoid inflated pre-allocation checks.
