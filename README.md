# MyWay Web

React frontend for the MyWay preference-aware route-ranking API.
## Overview

MyWay is a React interface for comparing route options using prompt, profile, and hybrid preference signals.

## Features

- Responsive React UI
- Preference-driven route selection
- Real-time map and route updates
- Easy connection to the FastAPI backend

## Getting Started

1. Clone the repository
2. Install dependencies:
    - `cd frontend && npm install`
3. Start the development server:
    - `npm run dev`

## Usage

Open the URL printed by Vite, then enter route details and select preferences to generate personalized route suggestions.

## Notes

- Ensure the MyWay FastAPI backend is running and reachable.
- Set `VITE_API_BASE_URL` to the API origin without a path. A trailing slash is accepted and normalized.

## License

Open source and ready for collaboration.
