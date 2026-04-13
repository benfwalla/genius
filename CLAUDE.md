@AGENTS.md

## Design rules

- **Admin/public parity**: The admin Annotate view should mirror the public entry page as closely as possible (same header layout, "More information" section, etc.). When updating the public page, update the admin Annotate view to match.
- **No low-contrast text**: Never use gray text (e.g. `text-zinc-400`, `text-zinc-500`, `text-zinc-600`). All text must be legible — use `text-black` or at minimum high-contrast colors. This applies to labels, metadata, dates, and secondary text alike.
- **No hover animations**: Don't add hover state transitions or color changes to interactive elements. Keep interactions simple and direct.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
