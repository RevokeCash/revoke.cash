# Development Guidelines

The Revoke.cash webapp was almost entirely written pre-AI. For much of the Premium & Ultimate features, AI was extensively used, but was heavily reviewed and refactored by humans. However, there are parts of the codebase that are explicitly vibe-coded (without strong human oversight), since they are internal tools or their code quality does not matter. These are documented below:

- **apps/video** - Used for generating videos, animations, and stills for the Revoke.cash website, social media and other marketing materials.
- **apps/web/app/admin**, **apps/web/components/admin**, **apps/web/lib/admin**, **apps/web/lib/hooks/admin**, **packages/core/lib/admin** - Used for internal admin tools like the admin dashboard.
- Some of the og.jpg routes, which are used to generate Open Graph images for social media sharing.
