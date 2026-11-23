import { DEFAULT_COLOR, DEFAULT_PLAYBACK_SPEED } from '../constants';

const resetSettings = () => {
  chrome.storage.sync.set({
    color: DEFAULT_COLOR,
    playbackSpeed: DEFAULT_PLAYBACK_SPEED,
  });
};

chrome.runtime.onInstalled.addListener(resetSettings);
chrome.runtime.onStartup.addListener(resetSettings);
