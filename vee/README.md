# Vee AI chat (Phase 2)

The public Vee AI chat was turned off on Oct 23, 2026 for the privacy review.

- `footer-embed-original-2026-10-23.html` is the full "footer global" component embed exactly as it was live, including the chat markup, styles and script.
- On the live site the chat block is now wrapped in `<template id="vee-ai-chat-disabled">`, so it is not shown and does not run. The footer itself is unchanged. The line "Always reviewed by a licensed broker" was removed.
- The chat posted the conversation to a Cloudflare Worker (`quiet-cloud-59f9.insuredby-siddiqui.workers.dev`), which called an AI service that was failing (502 "Upstream error") when checked.

Before rebuilding, document: AI provider, Worker architecture, data sent, retention and logging, privacy terms, safety behaviour, conversation storage and the human-review workflow.
