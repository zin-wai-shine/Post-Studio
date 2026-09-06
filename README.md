# Post Studio - Social Media Post & Watermark Management Platform

A production-quality React.js admin dashboard and batch watermark processing platform designed for social media and real estate marketing workflows.

The application runs **100% inside the browser** with zero backend, server APIs, or external database dependencies. All image transformations happen via the HTML5 Canvas API, logo persistence is managed via browser **IndexedDB**, and batch downloads are bundled directly in memory using **JSZip**.

---

## Key Features

### 1. High-Volume Batch Image Upload
- **Drag & Drop / Multi-select**: Upload multiple JPEG, PNG, and WEBP images without artificial limits.
- **Thumbnail Strip**: Live thumbnail strip displaying image filename, dimensions (`1920×1080 px`), and file size.
- **Active Image Selection**: Inspect any individual image in the live preview workspace.
- **Memory Management**: Uses `URL.createObjectURL` and rigorously calls `URL.revokeObjectURL` on image removal, workspace resets, and component unmounts to prevent browser memory leaks.

### 2. Watermark Logo Management & IndexedDB Persistence
- **Client-Side Persistence**: Because this application has no server backend, uploaded files cannot be written to a static `/images` folder on disk at runtime. Instead, logos are stored as binary Blobs in browser **IndexedDB** (`postStudioDB` database, `watermarks` object store).
- **Session Freedom**: Uploaded watermark logos offer two choices:
  - **Save to Library**: Persists the logo in IndexedDB across browser sessions.
  - **Use Temporarily**: Uses the logo for the current session without saving it to disk or storage.
- **Saved Library Management**: Visual grid of saved logos with one-click selection and deletion.

### 3. Positioning & Live Dragging
- **3x3 Alignment Grid**: Quick presets for Top-Left, Top-Center, Top-Right, Center-Left, Center, Center-Right, Bottom-Left, Bottom-Center, and Bottom-Right.
- **Manual Dragging**: Drag the watermark directly over the live preview.
- **Letterbox Geometry Calculation**: Dragging calculates coordinates relative to the actual rendered image boundaries (ignoring `object-fit: contain` letterbox/pillarbox space).
- **Normalized Coordinates**: Positions are stored as normalized percentages (`x: 0..1`, `y: 0..1`), guaranteeing that watermarks align identically across different image resolutions and aspect ratios.

### 4. Versatile Watermark Styles & Patterns
- **Single**: One watermark placed at the selected position.
- **Repeated**: Evenly repeated grid across the entire image.
- **Diagonal Pattern**: Angled repeating pattern (e.g. -30° or -45°) with geometric corner expansion to ensure 100% image coverage without cut-off edges.
- **Dot Grid**: Structured compact repeating grid.
- **Sparse Pattern**: Subtle repetition with wide spacing.
- **Dense Pattern**: Frequent repeating watermark for maximum media security.
- **Fine-Grained Adjustments**: Watermark Size (5% - 80%), Opacity (5% - 100%), Rotation (-180° to 180° with reset), Edge Margin (0% - 20%), Horizontal & Vertical Spacing.
- **Text Watermark Support**: Switch to text watermarking with customizable text, font size, font weight, and color.

### 5. High-Resolution Canvas Rendering & Batch ZIP Export
- **Original Resolution Processing**: Renders never compromise quality; export operations process images on offscreen canvases at their natural full resolution (e.g., 4K / 8K).
- **Download Selected**: Instant single-image download with visible processing feedback.
- **Download All (JSZip)**: Processes images sequentially with progress tracking (`Processing 3 of 15 (20%)`), low memory overhead, cancel support, and automatic ZIP bundling.
- **Formats**: Supports Keep Original, JPEG, PNG, and WEBP with adjustable compression quality (50% - 100%).

### 6. Workspace Reset
- Clean confirmation modal allowing users to clear working source images and restore default settings while preserving the saved IndexedDB watermark library.

---

## Design System & Aesthetics

- **Dominant Theme**: Deep Charcoal (`#222222`), Sidebar Dark (`#1E1E1E`), Pure White (`#FFFFFF`), and Neutral Surface Gray (`#F7F7F7`).
- **Typography**: Inter / system font stack with deliberate hierarchy (Page titles: 24-28px 600 weight; section headings: 16-18px 600 weight; body: 14px; metadata: 12-13px; buttons: 13-14px 500-600 weight).
- **Micro-Interactions**: Subtle borders (`#E5E5E5`), gentle transitions, and zero glowing effects, glassmorphism, or emojis. React Icons (`react-icons/fi`) are used exclusively.
- **Responsive Layout**: Desktop fixed sidebar (240px) with flexible workspace; tablet collapsibility; mobile off-canvas drawer with horizontally scrollable thumbnail strip.

---

## Technology Stack

- **Core**: React 18, Vite 5, JavaScript (ES modules)
- **Routing**: React Router DOM v6
- **Icons**: React Icons (`react-icons/fi`)
- **Styling**: Vanilla CSS with CSS custom properties (variables)
- **Image Processing**: HTML5 Canvas 2D API
- **Storage**: IndexedDB API (`postStudioDB`) & `localStorage` (for lightweight user preferences)
- **Archiving**: JSZip & FileSaver.js
- **Containerization**: Multi-stage Dockerfile (Node 20 Alpine builder + Nginx Alpine runner)

---

## Getting Started Locally

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Installation & Development
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build production bundle
npm run build

# 4. Preview production build
npm run preview
```
Visit `http://localhost:5173/` or `http://localhost:5173/watermark` in your browser.

---

## Docker Deployment & Automated Port Discovery

The application includes a production-ready Docker configuration with an intelligent dynamic port detection script.

### Dynamic Port Discovery (`scripts/start-docker.js`)
Instead of hardcoding a port that might already be in use on your system, the launcher automatically:
1. Tests port availability starting from `8080` (`8080`, `8081`, `8082`, etc.).
2. Selects the first available port.
3. Sets the `APP_PORT` environment variable.
4. Executes `docker compose up -d --build`.
5. Prints the accessible URL.

### Docker Commands
```bash
# Build and start container on the first free port (starting at 8080)
npm run docker:start

# Stop and remove containers
npm run docker:stop

# Rebuild Docker images
npm run docker:build
```

---

## How Saved Watermarks Work (IndexedDB)

Because this application is frontend-only, browsers cannot write uploaded watermark files directly into the project's source directory on disk.

To provide a seamless, persistent experience across sessions:
1. When a user uploads a watermark logo and selects **"Save to Library"**, the binary `Blob` is stored in the browser's **IndexedDB** database named `postStudioDB` under the `watermarks` object store.
2. Every saved record contains:
   - `id`: Unique identifier (e.g. `wm_1725612345_abc`)
   - `name`: Human-readable name
   - `blob`: Binary image Blob
   - `mimeType`: Image MIME type (`image/png`, `image/jpeg`, `image/webp`)
   - `createdAt`: ISO creation timestamp
3. When the page reloads, `useSavedWatermarks` automatically reads the stored Blobs, converts them to active Object URLs for rendering, and tracks them for cleanup.
4. If a user deletes a watermark from the library, it is removed from IndexedDB.

### How to Clear Saved Watermark Data
- Individual watermarks can be deleted directly in the UI by clicking the trash icon on any saved card.
- To clear all stored watermarks manually, open Developer Tools in your browser (F12) -> **Application** -> **Storage** -> **IndexedDB** -> Select `postStudioDB` -> Click **Delete database**.

---

## Route Structure

- `/` - Dashboard (Platform overview & quick tool access)
- `/watermark` - Watermark Studio (Full-featured batch watermarking workspace)
- `/post-generator` - Post Generator (Roadmap placeholder)
- `/templates` - Layout Templates (Roadmap placeholder)
- `/media` - Media Library (Roadmap placeholder)
- `/settings` - Settings (Roadmap placeholder)
