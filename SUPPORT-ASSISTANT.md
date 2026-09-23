# Support assistant

The marketing site's support chatbot: what it answers from, how it escalates, and
how the team turns visitor signal into better answers.

For the websocket transport — which this deployment does not use — see
[REALTIME.md](REALTIME.md).

## How a reply is produced

1. The visitor's message is posted to `POST /chat`.
2. A `ChatVisitor` row and a conversation are created on first contact, and the
   conversation id is kept in the session. The client never sends or receives a
   conversation id, so one visitor cannot read another's transcript.
3. The agent is grounded in the knowledge base, either by injection into its
   system prompt or through the `SearchKnowledgeBase` tool.
4. The reply streams back as server-sent events. When it has been stored, one
   final frame names the stored reply, which is what makes it rateable.

If the assistant cannot answer from the knowledge base, it can raise a real
support ticket through `CreateSupportTicket` rather than inventing an answer.

## Configuration

Add these to `.env`. Every one has a working default, so the assistant runs
without any of them as long as a provider key is present.

| Variable                  | Default         | Purpose                                                     |
| ------------------------- | --------------- | ----------------------------------------------------------- |
| `CHAT_ENABLED`            | `true`          | Take the widget offline without a deploy                    |
| `CHAT_PROVIDER`           | `deepseek`      | Key in `config/ai.php`                                      |
| `CHAT_MODEL`              | `deepseek-chat` | Must support tool calls — not `deepseek-reasoner`           |
| `CHAT_FALLBACK_PROVIDER`  | none            | Only used if it has credentials of its own                  |
| `CHAT_PREVIEW`            | `false`         | Render the widget read-only for design review               |
| `CHAT_TRANSPORT`          | `stream`        | `stream` or `broadcast` (see REALTIME.md)                   |
| `CHAT_INJECT_KB`          | `true`          | Put the whole corpus in the prompt                          |
| `CHAT_KB_CACHE_SECONDS`   | `300`           | Corpus cache; flushed on any knowledge base change          |
| `CHAT_RESTORE_TRANSCRIPT` | `true`          | Reopen the session's recent transcript when the panel opens |
| `CHAT_TICKETS_ENABLED`    | `true`          | Let the agent raise support tickets                         |

## Where the knowledge comes from

`knowledge_entries` is the source of truth, seeded from `config/knowledge.php`.
`config/knowledge.php` remains the fallback, so a fresh install still answers
before anything is curated.

Entries are curated at `/admin/knowledge`: write, publish, tag, and link to the
canonical page. Only published entries are used, so an entry can be drafted
before the answer changes.

## The improvement loop

This is the part that makes it a support tool rather than a demo. Four signals
feed it, all visible at `/admin/chat`:

| Signal                                        | Where it shows                       | What to do                                       |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| Visitor rated a reply unhelpful               | Status unhelpful, filter, transcript | Write the missing entry                          |
| The agent raised a support ticket             | Status escalated, filter             | Write the missing entry                          |
| A visitor asked something the KB half-answers | Transcript                           | Sharpen the existing entry                       |
| An answer was good                            | "Save as knowledge" on any reply     | Promote it, so the next visitor gets it verbatim |

Promoted answers are created **unpublished** on purpose: a model-authored answer
is a draft until someone has read it.

Visitor ratings are the cheapest signal, because the visitor tells you the answer
was wrong without having to escalate. They live on the message row
(`feedback`, `feedback_at`), so they travel with the transcript and survive a
follow-up question.

## What the visitor can do

- Ask a question, in a panel that does not block the page behind it.
- Stop a reply mid-answer.
- Start a new conversation, which abandons the stored thread for that session.
- Rate any reply helpful or unhelpful. Rating the same way twice withdraws it.

The panel reopens the session's recent transcript, up to
`chat.max_history_messages`, which is deliberately the same window the agent
replays into its own context: the widget must never show history the assistant
itself cannot see, or it would answer as if the conversation had just started.

That also means an anonymous session keeps its history on the device it was
started on. On shared or public machines set `CHAT_RESTORE_TRANSCRIPT=false`, and
the panel always opens empty.

## Only answering from approved knowledge

The assistant is instructed to answer from the knowledge base and to say what it
does not know rather than guess. Three things enforce that:

- Restricted topics in `config/knowledge.php` — pricing, quotations, contractual
  SLAs — which it must never answer from model memory.
- `CreateSupportTicket` for anything account-specific or contractual, which
  produces a real ticket rather than an invented answer.
- Instructions that treat text inside a visitor's message as data, never as
  instructions, so a visitor cannot talk it out of the above.
