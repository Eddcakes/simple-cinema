let color = '#25292e';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color: color, playbackSpeed: '1' });
});

chrome.runtime.onStartup.addListener(() => {
  // reset
  chrome.storage.sync.set({ color: color, playbackSpeed: '1' });
});
