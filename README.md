# AI Marketing Visuals Platform

An AI-powered platform for creating professional marketing visuals. Upload product images, edit them with AI, and generate stunning videos for your marketing campaigns.

## Features

- **Project Management**: Organize your work into projects with visual dashboards
- **Media Library**: Upload and manage product images and videos
- **AI Image Editing**: Transform product images using context-based AI editing
  - Multiple AI model options (Stable Diffusion XL, DALL-E 3, Midjourney, Flux Pro)
  - User-friendly model descriptions for non-technical users
  - Side-by-side comparison view
- **AI Video Generation**: Create professional marketing videos
  - Choose from multiple AI models (Runway Gen-2, Pika Labs, Stable Video, Luma AI)
  - Customizable aspect ratios (16:9, 9:16, 1:1, 4:5)
  - Scene type selection (Product Showcase, Lifestyle, Story-Driven, Comparison)
  - Camera movement controls (Static, Zoom, Pan, Dynamic)
- **Authentication**: Secure user authentication via Clerk
- **Cloud Storage**: All media stored securely in Supabase

## Setup

### Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project
3. A Clerk account and application

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required for production and Clerk dev auth
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Optional: For full local bypass (localhost only)
VITE_LOCAL_MODE=false

# Optional: Override local dev user ID
VITE_LOCAL_USER_ID=local-dev-user

# Optional: Local Supabase configuration
VITE_SUPABASE_LOCAL_URL=http://127.0.0.1:54321
VITE_SUPABASE_LOCAL_ANON_KEY=your_local_supabase_anon_key

# Optional: Auto-switch to local Supabase on localhost
VITE_USE_LOCAL_SUPABASE_ON_LOCALHOST=false
```

### Local Development Modes

This project supports two local development modes on `localhost`:

#### 1. Clerk Development Auth (Recommended for testing auth flows)

- Set `VITE_LOCAL_MODE=false`
- Use your Clerk development application keys
- Allows testing real authentication flows without production signups
- Requires Clerk development instance and hosted Supabase project

#### 2. Full Auth Bypass (Fastest for development)

- Set `VITE_LOCAL_MODE=true`
- Completely bypasses authentication (localhost only, with guardrails)
- Uses a fixed local dev user ID: `local-dev-user`
- Override with `VITE_LOCAL_USER_ID=custom-user-id`
- **Important**: Only works on `localhost` - cannot be accidentally deployed

#### Supabase Backend Selection

The app automatically chooses the Supabase backend based on:

- **Hosted Supabase**: Default for all environments
- **Local Supabase**: Automatically used when:
  - `VITE_USE_LOCAL_SUPABASE_ON_LOCALHOST=true` (on localhost) AND local Supabase env vars are set
  - Auth bypass mode is enabled (prefers local for RLS compatibility) AND local Supabase env vars are set
  - Can be overridden via the Development Toolbar (localhost only)

**Note**: Local Supabase will only be used if both `VITE_SUPABASE_LOCAL_URL` and `VITE_SUPABASE_LOCAL_ANON_KEY` are configured. If local variables are missing, the app will fall back to hosted Supabase.

#### Development Toolbar (localhost only)

When developing on `localhost`, a development toolbar appears in the top-right corner:

- **Auth Mode**: Toggle between Clerk auth and bypass mode
- **Supabase Backend**: Switch between hosted and local Supabase
- Changes require page reload and persist to `localStorage`

**Security Note**: The bypass mode and local Supabase switching are guarded to only work on `localhost` to prevent accidental deployment with insecure settings.

### Installation

```bash
npm install
npm run dev
```

### Database Setup

The database migrations are already applied. The schema includes:

- `projects`: User projects
- `media_assets`: Uploaded images and videos
- `edited_images`: AI-edited images with version history
- `generated_videos`: AI-generated videos
- `video_sources`: Source media for video generation

Storage buckets are configured for:
- User uploads (images/videos)
- AI-edited images
- Generated videos
- Thumbnails

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Icons**: Lucide React

## Workflow

1. **Create a Project**: Start by creating a new project for your campaign
2. **Upload Media**: Add product images or video clips to your project
3. **Edit Images**: Use AI to transform your product images with text prompts
4. **Generate Videos**: Combine edited images and clips to create marketing videos
5. **Export**: Download your final assets

## Key Design Principles

- **Simplicity First**: Every feature prioritizes ease of use for non-technical users
- **User Guidance**: Clear guardrails prevent mistakes (e.g., no text-only video generation)
- **Visual Feedback**: Loading states, progress indicators, and clear error messages
- **Context Preservation**: Edit videos while maintaining workspace context
- **Professional Output**: Production-ready visuals suitable for marketing campaigns
