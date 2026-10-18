::: {align="center"}

🎵 CatchMusic

Catch your favorite beats. Play anytime.

Discover music, play your favorite tracks, organize playlists, and cache
supported songs for offline listening.



:::

📖 About

CatchMusic is a web-based music application built to make
discovering and enjoying music simple. Search for tracks, listen through
the built-in player, save songs you like, create playlists, and cache
supported tracks in your browser for offline listening.

CatchMusic uses a Bun + Turborepo monorepo to organize its web app,
worker service, and shared packages.

Live demo: https://catch-music.vercel.app/

 Features

 Music search --- Search for tracks and discover music.

 Music player --- Listen using the app's playback interface.

 Browser song caching --- Cache supported audio for offline
playback, subject to browser storage limits and implementation.

 Liked songs --- Keep track of songs you want to revisit.

 Playlists --- Create and manage playlists.

 User profiles --- Access profile information and music
preferences.

 Favorite artists --- Personalize your profile with favorite
singers or artists.

 Responsive UI --- Use the app on supported desktop and mobile
browsers.

Feature availability may depend on authentication, browser support, and
the current deployment configuration.

🧰 Tech Stack

Web application (apps/web)

Technology                   Purpose

Next.js 16                   Web framework and API routes
React 19                     Component-based UI
TypeScript                   Type-safe application code
Tailwind CSS 3               Styling
NextAuth.js 4                Authentication and sessions
Drizzle ORM                  Type-safe database queries
@auth/drizzle-adapter      Authentication database adapter
@upstash/redis             Redis integration
Axios                        HTTP requests
Lucide React / React Icons   Icons
Framer Motion / Motion       UI animations
Vercel Analytics             Website analytics

Worker service (apps/workers)

Technology      Purpose

Bun             Runtime
BullMQ          Background job queues
ioredis         Redis connectivity
Drizzle ORM     Database access
@repo/db      Shared database package
@repo/queue   Shared queue package

Monorepo tooling

Bun 1.3.6 --- Package manager and JavaScript/TypeScript runtime.

Turborepo 2.8 --- Runs tasks across workspaces.

Shared packages --- Database, queue, UI, ESLint, and TypeScript
configuration.

🏗️ Project Structure

catch-music/
├── apps/
│   ├── web/                  # Next.js web application
│   │   ├── app/              # App Router pages, layouts, and API routes
│   │   └── package.json
│   └── workers/              # Worker service
│       ├── src/
│       │   └── index.ts      # Worker entry point
│       └── package.json
├── packages/
│   ├── db/                   # Shared database package (@repo/db)
│   ├── queue/                # Shared queue package (@repo/queue)
│   ├── ui/                   # Shared UI package (@repo/ui)
│   ├── eslint-config/        # Shared ESLint configuration
│   └── typescript-config/    # Shared TypeScript configuration
├── package.json              # Root scripts and Bun workspaces
├── turbo.json                # Turborepo task configuration
└── bun.lock                 # Bun lockfile, if committed

The shared package names reflect the workspace dependencies you
provided; exact package files may vary.

🚀 Getting Started

Prerequisites

Bun 1.3.6

Git

Access to the database, Redis, authentication, and music API
configuration required by the application

1. Clone the repository

git clone https://github.com/vanshsharma3777/catch-music.git
cd catch-music

2. Install dependencies

Run this from the repository root:

bun install

Bun installs dependencies for the configured workspaces, including the
web app, worker, and shared packages.

3. Configure environment variables

Create the environment files expected by your application and worker.
The web app may use apps/web/.env.local; confirm the exact location
from your code and deployment configuration.

The upstream music API is configured through:

JIO_SAVAAN=your_music_api_base_url

Your Turborepo build configuration explicitly passes these Redis REST
variables to build tasks:

UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

You may also need variables for:

Database connection details used by Drizzle ORM and @repo/db

NextAuth secret, URL, and any configured authentication providers

Redis connection details used by BullMQ/ioredis in the worker

Other external APIs or services referenced by the code

Use the exact variable names expected by the code. Never commit
secrets, passwords, API tokens, or populated environment files to Git.
Configure the web app and worker environments in their respective
deployment platforms.

4. Start development servers

From the repository root:

bun run dev

Turborepo runs the dev tasks defined by the configured workspaces. The
web app's script starts Next.js on port 3000; the worker's script sets
PORT=3001.

To run each service independently:

# Next.js web app
bun run dev --filter=web

# Worker service
bun run dev --filter=worker

Open http://localhost:3000 to use the web application.

Windows note: The worker script currently uses
PORT=3001 bun src/index.ts, which is Unix-shell syntax. If running the
worker directly in PowerShell, use a cross-platform environment-variable
approach or update the script to be Windows-compatible. Port 3001 is
only used by the worker if its code reads PORT and starts a listener.

5. Build the project

bun run build

This runs turbo run build from the root. The web workspace defines
next build; the worker package you shared does not currently define a
build script, so the worker will not be built by a workspace build
task unless you add one.

6. Start production services

Start the built web application:

bun run start --filter=web

Start the worker:

bun run start --filter=worker

The web app's start script uses next start, so build it first. The
worker's start script runs bun src/index.ts.

🧪 Root Commands

Run these commands from the repository root:

Command                             Description

bun install                       Install all workspace dependencies

bun run dev                       Run configured development tasks
through Turborepo

bun run dev --filter=web          Start the web app's development
server

bun run dev --filter=worker       Start the worker's development
script

bun run build                     Run configured build tasks

bun run lint                      Run configured lint tasks

bun run check-types               Run configured TypeScript checks

The web workspace also defines a test script:

bun run test --filter=web

This runs bun test in the web workspace.

🧱 High-Level Architecture

                         ┌──────────────────────┐
                         │         User         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Web App              │
                         │ apps/web :3000       │
                         │ Next.js + React      │
                         └───────┬────────┬─────┘
                                 │        │
                     ┌───────────┘        └────────────┐
                     ▼                                 ▼
          ┌─────────────────────┐          ┌──────────────────────┐
          │ Upstream Music API  │          │ Authentication / DB  │
          │ JIO_SAVAAN config   │          │ NextAuth + Drizzle   │
          └─────────────────────┘          └──────────────────────┘

                         ┌──────────────────────┐
                         │ Worker Service       │
                         │ apps/workers         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ BullMQ + Redis       │
                         │ Shared Queue / DB    │
                         └──────────────────────┘

The web app and worker run as separate workspace services. BullMQ uses
Redis for background job processing, while @repo/db and @repo/queue
provide shared workspace functionality.

💾 Browser Song Caching

CatchMusic supports caching supported songs in browser storage for
potential offline playback. This is different from Redis or server-side
caching.

Cached audio occupies storage on the user's device.

Available storage varies by browser, operating system, and free disk
space.

Clearing browser site data can remove cached audio.

Offline playback depends on the audio being fully cached and still
available.

Cache writes can fail if the browser storage quota is exceeded or
storage is unavailable.

🔐 Third-Party Services and Attribution

CatchMusic uses an upstream music API configured through JIO_SAVAAN.
This service may be unofficial or independently operated and is not
necessarily affiliated with JioSaavn.

CatchMusic is an independent project and is not presented as an
official JioSaavn application.

Music availability and playback may depend on upstream service
availability and applicable restrictions.

Rights to music, artwork, metadata, and other third-party content
remain with their respective owners.

Review applicable service terms and copyright requirements before
using or redistributing content.

☁️ Deployment

Live website: catch-music.vercel.app

Configure the web app's environment variables in Vercel or your
chosen hosting platform.

Configure the worker's environment variables on the platform where
the worker runs.

Ensure both services use the correct Redis and database resources.

Verify production authentication URLs and callback settings.

Your Turborepo build configuration explicitly includes
UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for build
tasks.

Deploy the worker separately if the web hosting platform does not
support persistent worker processes.

🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

Fork the repository.

Create a feature branch:

git checkout -b feat/your-feature

Make your changes and run the relevant checks.

Commit your changes:

git commit -m "feat: describe your change"

Push the branch and open a pull request.

Please do not commit secrets, populated environment files, or unrelated
generated files.

🐛 Reporting Issues

Open an issue in the GitHub
repository. Include
steps to reproduce the problem, expected and actual behavior, and
relevant error messages. Remove secrets and personal information from
logs before sharing them.

📄 License

Check the repository's LICENSE file for the terms governing use,
modification, and redistribution. If no license is present, do not
assume the code is available for unrestricted reuse.

👨‍💻 Author

Vansh Sharma

GitHub: @vanshsharma3777

Repository:
CatchMusic

Live website:
catch-music.vercel.app

::: {align="center"}
Catch your favorite beats. Play anytime. 🎶
:::
