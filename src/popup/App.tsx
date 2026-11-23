import { Fragment, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  clearHighlightedVideosOnPage,
  highlightVideoOnPage,
  replacePageWithVideoOnPage,
  setBackgroundColorOnPage,
  setPlaybackSpeedOnPage,
} from './pageScripts';
import './popup.css';

interface AppProps {
  videoCount: number;
  hasBody: boolean;
  playbackSpeed: number;
  backgroundColor: string;
}

export function App({
  videoCount,
  hasBody: initialHasBody,
  playbackSpeed: initialPlaybackSpeed,
  backgroundColor: initialBackgroundColor,
}: AppProps) {
  const [hasBody, setHasBody] = useState(initialHasBody);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(initialPlaybackSpeed);
  const [backgroundColor, setBackgroundColor] = useState(
    initialBackgroundColor
  );

  const handleVideoSelect = (videoId: number) => {
    setSelectedVideoId(videoId);
    highlightVideoOnPage(videoId);
  };

  const handleClearOutline = () => {
    setSelectedVideoId(null);
    clearHighlightedVideosOnPage();
  };

  const handleSubmitVideo = async () => {
    if (selectedVideoId === null) {
      return;
    }

    const replaced = await replacePageWithVideoOnPage(selectedVideoId);
    if (replaced) {
      setHasBody(false);
    }
  };

  const handlePlaybackSpeedChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextSpeed = Number(event.target.value);
    if (Number.isNaN(nextSpeed) || nextSpeed <= 0) {
      return;
    }

    setPlaybackSpeed(nextSpeed);
    chrome.storage.sync.set({ playbackSpeed: nextSpeed });
    setPlaybackSpeedOnPage(nextSpeed);
  };

  const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextColor = event.target.value;
    setBackgroundColor(nextColor);
    chrome.storage.sync.set({ color: nextColor });
    setBackgroundColorOnPage(nextColor);
  };

  if (videoCount < 1) {
    return (
      <div id="noVideoText">
        <p>Cannot find video elements in this page</p>
      </div>
    );
  }

  return (
    <div id="videosAvailable">
      <fieldset id="videosList" disabled={!hasBody}>
        <legend>Replace the page with</legend>
        <div id="radioGroup">
          {Array.from({ length: videoCount }, (_, videoId) => (
            <Fragment key={videoId}>
              <input
                type="radio"
                id={`videoId${videoId}`}
                name="videoRadios"
                value={videoId}
                checked={selectedVideoId === videoId}
                onChange={() => handleVideoSelect(videoId)}
              />
              <label htmlFor={`videoId${videoId}`}>{`video ${videoId + 1}`}</label>
            </Fragment>
          ))}
        </div>
      </fieldset>

      <div className="actions">
        <div className="buttons">
          <button
            id="clearBtn"
            type="button"
            className="clear btn"
            onClick={handleClearOutline}
          >
            Clear outline
          </button>
          <button
            id="submitBtn"
            type="button"
            className="submit btn"
            disabled={!hasBody || selectedVideoId === null}
            onClick={handleSubmitVideo}
          >
            Select video
          </button>
        </div>

        <div className="playback">
          <label htmlFor="playbackRange">Playback speed</label>
          <div id="controls" className="controls">
            <input
              id="playbackRange"
              type="range"
              min={0.1}
              max={2}
              step={0.1}
              value={playbackSpeed}
              onChange={handlePlaybackSpeedChange}
            />
            <input
              id="playbackNumber"
              type="number"
              min={0.1}
              max={2}
              step={0.1}
              value={playbackSpeed}
              onChange={handlePlaybackSpeedChange}
            />
          </div>

          <div className="backgroundColor">
            <label htmlFor="changeColor">Background colour</label>
            <input
              id="changeColor"
              type="color"
              value={backgroundColor}
              style={{ backgroundColor }}
              onChange={handleColorChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
