import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_COLOR, DEFAULT_PLAYBACK_SPEED } from '../constants';
import { App } from './App';
import { inspectPage } from './pageScripts';

async function loadInitialState() {
  const [pageState, stored] = await Promise.all([
    inspectPage(),
    chrome.storage.sync.get<{
      color?: string;
      playbackSpeed?: number | string;
    }>(['color', 'playbackSpeed']),
  ]);

  const parsedSpeed = Number(stored.playbackSpeed);
  const playbackSpeed =
    stored.playbackSpeed !== undefined &&
    !Number.isNaN(parsedSpeed) &&
    parsedSpeed > 0
      ? parsedSpeed
      : DEFAULT_PLAYBACK_SPEED;

  const backgroundColor =
    typeof stored.color === 'string' && stored.color.length > 0
      ? stored.color
      : DEFAULT_COLOR;

  return {
    videoCount: pageState.videoCount,
    hasBody: pageState.hasBody,
    playbackSpeed,
    backgroundColor,
  };
}

async function init() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    return;
  }

  const initialState = await loadInitialState();

  createRoot(rootElement).render(
    <StrictMode>
      <App {...initialState} />
    </StrictMode>
  );
}

init();
