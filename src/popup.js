/* functions to send to dom */
const checkForVideos = async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: findVideosOnPage,
  });
};

const checkForBody = async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: findBody,
  });
};

const sendClearHighlightedVideos = async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: clearHighlightedVideos,
  });
};

const handleVideoRadio = async (evt) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: highlightVideo,
    args: [evt.target.value],
  });
};

const submitVideo = async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const checkedRadio = document.querySelector('input[type="radio"]:checked');
  if (checkedRadio == null) {
    console.error('Cannot find a checked radio');
    return;
  }
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: replacePageWithVideo,
      args: [checkedRadio.value],
    },
    () => {
      noBody();
    }
  );
};

const changeBackgroundColor = async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const selectedColor = document.querySelector('input[type="color"]');
  if (selectedColor) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: setPageBackgroundColor,
      args: [selectedColor.value],
    });
  }
};

const changePlaybackSpeed = async (evt) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // sync up the values
  const value = evt.target.value;
  playbackRange.value = value;
  playbackNumber.value = value;
  //does this work?
  chrome.storage.sync.set({ playbackSpeed: value });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPlaybackSpeed,
    args: [value],
  });
};

/* message handler, popup POV */
function addVideoMsgToList(req, sender, sendResponse) {
  switch (req.type) {
    case 'noVideos':
      noVideos();
      break;
    case 'foundVideo':
      foundVideo(req, sender, sendResponse);
      break;
    case 'noBody':
      noBody();
      break;
    default:
      return;
  }
}

/* for the popup */
function noVideos() {
  document.querySelector('#noVideoText').style.display = 'block';
  document.querySelector('#videosAvailable').style.display = 'none';
}

function foundVideo(req, sender, sendResponse) {
  // check if video with index already exists in our list
  const exists = document.querySelector(
    `input[data-video-id="${req.videoId}"]`
  );
  if (exists != null) {
    return;
  }
  // add video to list
  const label = document.createElement('label');
  const text = document.createTextNode(`video ${req.videoId + 1}`);
  label.htmlFor = `videoId${req.videoId}`;
  label.appendChild(text);

  const option = document.createElement('input');
  option.setAttribute('type', 'radio');
  // dataset does automatic conversion, videoId -> data-video-id
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
  option.dataset.videoId = req.videoId;
  option.value = `${req.videoId}`;
  option.name = `videoRadios`;
  option.id = `videoId${req.videoId}`;
  option.addEventListener('change', handleVideoRadio);

  videoList.appendChild(option);
  videoList.appendChild(label);
}

function noBody() {
  // if page doesn't have body infer this extension did that
  let videoList = document.querySelector('#videosList');
  let submitBtn = document.querySelector('#submitBtn');
  videoList.disabled = true;
  submitBtn.disabled = true;
}

/* functions to send to dom */
function findVideosOnPage() {
  // running via executeScript so we are in the web page context, have to message back
  const pageVideos = document.querySelectorAll('video');
  if (pageVideos.length < 1) {
    chrome.runtime.sendMessage({
      type: 'noVideos',
      videoId: null,
    });
  } else {
    pageVideos.forEach((video, idx) => {
      // try to get video name at all?
      chrome.runtime.sendMessage({
        type: 'foundVideo',
        videoId: idx,
      });
    });
  }
}

function findBody() {
  const body = document.querySelector('body');
  if (body == null) {
    chrome.runtime.sendMessage({
      type: 'noBody',
    });
  }
}

function highlightVideo(videoId) {
  const pageVideos = document.querySelectorAll('video');
  pageVideos.forEach((video, idx) => {
    // try to get video name at all?
    if (idx + '' === videoId) {
      video.classList.add('sc-selectedVideo');
    } else {
      video.classList.remove('sc-selectedVideo');
    }
  });
}

function clearHighlightedVideos() {
  const pageVideos = document.querySelectorAll('video');
  pageVideos.forEach((video) => {
    video.classList.remove('sc-selectedVideo');
  });
}

function replacePageWithVideo(videoId) {
  const topLevel = document.querySelector('html');
  const pageVideos = document.querySelectorAll('video');
  const chosenNode = pageVideos[Number(videoId)];
  const body = document.querySelector('body');

  topLevel.appendChild(chosenNode);
  body.remove();
  chosenNode.controls = true;
}

//function set playback speed
function setPlaybackSpeed(speed) {
  // we expect only 1 video element on the page now
  const video = document.querySelector('video');
  if (video) {
    video.playbackRate = speed;
  }
}
function setPageBackgroundColor(newColor) {
  chrome.storage.sync.set({ color: newColor });
  chrome.storage.sync.get('color', () => {
    document.querySelector('html').style.backgroundColor = newColor;
  });
}

/* main */
const colorBtn = document.querySelector('#changeColor');
const clearBtn = document.querySelector('#clearBtn');
const submitBtn = document.querySelector('#submitBtn');
const videoList = document.querySelector('#radioGroup');
const playbackRange = document.querySelector('#playbackRange');
const playbackNumber = document.querySelector('#playbackNumber');

chrome.runtime.onMessage.addListener(addVideoMsgToList);
// set playback speed for controls
chrome.storage.sync.get('playbackSpeed', ({ playbackSpeed }) => {
  playbackRange.value = playbackSpeed;
  playbackNumber.value = playbackSpeed;
});

// set color of background color button
chrome.storage.sync.get('color', ({ color }) => {
  colorBtn.style.backgroundColor = color;
  colorBtn.value = color;
});

window.onload = async () => {
  checkForVideos();
  checkForBody();
};

clearBtn.addEventListener('click', sendClearHighlightedVideos);
submitBtn.addEventListener('click', submitVideo);
colorBtn.addEventListener('change', changeBackgroundColor);
playbackRange.addEventListener('change', changePlaybackSpeed);
playbackNumber.addEventListener('change', changePlaybackSpeed);
/* end of main */
