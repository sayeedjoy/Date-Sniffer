// TikTok Functions
function extractTikTokTimestamp(videoId) {
  try {
      // Convert to milliseconds for correct date
      const seconds = BigInt(videoId) >> 32n;
      // TikTok ID encodes seconds; convert to milliseconds for Date()
      return Number(seconds) * 1000;
  } catch (error) {
      console.error('Error extracting TikTok timestamp:', error);
      return null;
  }
}

function observeTikTokPage() {
  const videoIdRegex = /\/video\/(\d+)/;

  function extractDateFromUrl() {
      const match = window.location.pathname.match(videoIdRegex);
      if (match && match[1]) {
          const timestamp = extractTikTokTimestamp(match[1]);
          if (timestamp) {
              const date = new Date(timestamp);
              sendDateToPopup('tiktok', date.toUTCString() + " (UTC)");
          }
      }
  }

  // Initial check
  extractDateFromUrl();

  // Observe URL changes for TikTok's SPA
  let lastUrl = window.location.href;
  new MutationObserver(() => {
      if (lastUrl !== window.location.href) {
          lastUrl = window.location.href;
          extractDateFromUrl();
      }
  }).observe(document.body, { childList: true, subtree: true });
}

// LinkedIn Functions
function extractLinkedInPostId(url) {
  const regex = /([0-9]{19})/;
  return regex.exec(url)?.pop() || null;
}

function extractLinkedInCommentId(url) {
  const decodedUrl = decodeURIComponent(url);
  const regex = /fsd_comment:\((\d+),urn:li:activity:\d+\)/;
  const match = regex.exec(decodedUrl);
  return match ? match[1] : null;
}

function extractLinkedInTimestamp(id) {
  if (!id) return null;
  try {
      // LinkedIn snowflake: 41-bit millisecond timestamp in high bits
      // Shift right by 22 to drop sequence & worker bits (10 + 12 bits)
      const ms = BigInt(id) >> 22n;
      return Number(ms);
  } catch (error) {
      console.error('Error extracting LinkedIn timestamp:', error);
      return null;
  }
}

function observeLinkedInPage() {
  function extractDateFromUrl() {
      const url = window.location.href;
      const postId = extractLinkedInPostId(url);
      const commentId = extractLinkedInCommentId(url);
      
      let timestamp = null;
      if (commentId) {
          timestamp = extractLinkedInTimestamp(commentId);
      } else if (postId) {
          timestamp = extractLinkedInTimestamp(postId);
      }

      if (timestamp) {
          const date = new Date(timestamp);
          sendDateToPopup('linkedin', date.toUTCString() + " (UTC)");
      }
  }

  // Initial check
  extractDateFromUrl();

  // Observe URL changes for LinkedIn's SPA
  let lastUrl = window.location.href;
  new MutationObserver(() => {
      if (lastUrl !== window.location.href) {
          lastUrl = window.location.href;
          extractDateFromUrl();
      }
  }).observe(document.body, { childList: true, subtree: true });
}

// Utility Functions
function sendDateToPopup(platform, date) {
  // Check if extension context is valid before sending message
  if (!chrome.runtime || !chrome.runtime.id) {
    return; // Extension context invalidated, silently return
  }
  
  try {
    chrome.runtime.sendMessage({
        type: 'DATE_DETECTED',
        platform: platform,
        date: date
    }, (response) => {
      // Handle potential errors in callback
      if (chrome.runtime.lastError) {
        // Silently ignore - extension was likely reloaded
        return;
      }
    });
  } catch (error) {
    // Silently catch any errors to prevent console errors in production
    return;
  }
}

// Initialize based on current site
function init() {
  const host = window.location.hostname;
  if (host.includes('tiktok.com')) {
      observeTikTokPage();
  } else if (host.includes('linkedin.com')) {
      observeLinkedInPage();
  }
}

// Message listener for manual extraction requests
if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.action === 'extractDate') {
          const host = window.location.hostname;
          let date = null;

          if (host.includes('tiktok.com')) {
              const match = window.location.pathname.match(/\/video\/(\d+)/);
              if (match && match[1]) {
                  const timestamp = extractTikTokTimestamp(match[1]);
                  if (timestamp) {
                      date = new Date(timestamp).toUTCString() + " (UTC)";
                  }
              }
          } else if (host.includes('linkedin.com')) {
              const url = window.location.href;
              const postId = extractLinkedInPostId(url);
              const commentId = extractLinkedInCommentId(url);
              
              let timestamp = null;
              if (commentId) {
                  timestamp = extractLinkedInTimestamp(commentId);
              } else if (postId) {
                  timestamp = extractLinkedInTimestamp(postId);
              }

              if (timestamp) {
                  date = new Date(timestamp).toUTCString() + " (UTC)";
              }
          }

          sendResponse({ date: date });
      }
    } catch (error) {
      // Silently handle errors
      sendResponse({ date: null });
    }
    return true;
  });
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}