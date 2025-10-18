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
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

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
