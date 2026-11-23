export interface PageState {
  videoCount: number;
  hasBody: boolean;
}

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

async function runInActiveTab<TArgs extends unknown[], TResult>(
  func: (...args: TArgs) => TResult,
  args?: TArgs
): Promise<TResult | undefined> {
  const tabId = await getActiveTabId();
  if (tabId === null) {
    return undefined;
  }

  const results =
    args !== undefined
      ? await chrome.scripting.executeScript({
          target: { tabId },
          func,
          args,
        })
      : await chrome.scripting.executeScript({
          target: { tabId },
          func: func as () => TResult,
        });

  return results[0]?.result as TResult | undefined;
}

export async function inspectPage(): Promise<PageState> {
  try {
    const state = await runInActiveTab(() => ({
      videoCount: document.querySelectorAll('video').length,
      hasBody: document.querySelector('body') !== null,
    }));
    return state ?? { videoCount: 0, hasBody: true };
  } catch {
    // Restricted pages (e.g. chrome:// or the Web Store) disallow script injection
    return { videoCount: 0, hasBody: true };
  }
}

export async function highlightVideoOnPage(videoId: number): Promise<void> {
  await runInActiveTab(
    (selectedId: number) => {
      const pageVideos = document.querySelectorAll('video');
      pageVideos.forEach((video, idx) => {
        if (idx === selectedId) {
          video.classList.add('sc-selectedVideo');
        } else {
          video.classList.remove('sc-selectedVideo');
        }
      });
    },
    [videoId]
  );
}

export async function clearHighlightedVideosOnPage(): Promise<void> {
  await runInActiveTab(() => {
    const pageVideos = document.querySelectorAll('video');
    pageVideos.forEach((video) => {
      video.classList.remove('sc-selectedVideo');
    });
  });
}

export async function replacePageWithVideoOnPage(
  videoId: number
): Promise<boolean> {
  const replaced = await runInActiveTab(
    (selectedId: number) => {
      const topLevel = document.documentElement;
      const pageVideos = document.querySelectorAll('video');
      const chosenNode = pageVideos[selectedId];
      const body = document.querySelector('body');

      if (!chosenNode || !body) {
        return false;
      }

      topLevel.appendChild(chosenNode);
      body.remove();
      chosenNode.controls = true;
      return true;
    },
    [videoId]
  );

  return replaced ?? false;
}

export async function setPlaybackSpeedOnPage(speed: number): Promise<void> {
  await runInActiveTab(
    (nextSpeed: number) => {
      const video = document.querySelector('video');
      if (video) {
        video.playbackRate = nextSpeed;
      }
    },
    [speed]
  );
}

export async function setBackgroundColorOnPage(color: string): Promise<void> {
  await runInActiveTab(
    (nextColor: string) => {
      document.documentElement.style.backgroundColor = nextColor;
    },
    [color]
  );
}
