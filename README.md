# USB AutoStart

A desktop application built with Electron and Next.js that allows you to manage and automatically start applications when a specific USB device is connected to your computer.

Based on the NextTron Repo: https://github.com/saltyshiomix/nextron

## Features

- 🚀 Launch applications automatically when a specific USB device is connected
- 🎮 Manual control over starting and stopping applications
- ⚡ Quick access through system tray
- 🔄 Auto-start with Windows option

## Development

Prerequisites:
- Node.js 20 or later
- npm

To start the development environment:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Building

To create a production build:

```bash
# Create production build
npm run build

# Build and install locally
npm run build:install
```

The built application will be available in the `dist` folder with both installer and portable versions.

## GitHub Actions

The project includes automated builds through GitHub Actions, which creates:
- Windows installer (.exe)
- Portable version (ZIP)

## Tech Stack

- Electron
- Next.js
- React
- TypeScript
- Material-UI (MUI)
- React Query
- Electron Store for persistence
- Electron Builder for packaging
