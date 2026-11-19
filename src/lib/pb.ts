import PocketBase from 'pocketbase'

// VITE_PB_URL is set in .env for local dev (http://localhost:8090).
// PocketBase v0.36+ has CORS enabled by default so direct requests work fine.
// In production the Dockerfile builds a static bundle — set VITE_PB_URL to the
// public PocketBase URL at build time, or leave it empty to fall back to '/'.
const pbUrl = import.meta.env.VITE_PB_URL || window.location.origin

export const pb = new PocketBase(pbUrl)
