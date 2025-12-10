document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.querySelector("#url");
  const getDateBtn = document.querySelector("#getDateBtn");
  const clearBtn = document.querySelector("#clearBtn");
  const dateOutput = document.querySelector("#date");
  const copyBtn = document.querySelector("#copyBtn");
  const loader = document.querySelector("#loader");
  const urlValidation = document.querySelector("#urlValidation");
  const result = document.querySelector("#result");
  const themeToggle = document.querySelector("#themeToggle");
  const autoDetect = document.querySelector("#auto-detect");
  const detectedDateEl = document.querySelector("#detected-date");
  const copyDetectedBtn = document.querySelector("#copy-detected");

  // Theme management
  function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.querySelector('.material-icons').textContent = isDark ? 'light_mode' : 'dark_mode';
    chrome.storage.local.set({ isDarkMode: isDark }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving theme:', chrome.runtime.lastError);
      }
    });
  }

  // Initialize theme
  function initializeTheme() {
    chrome.storage.local.get('isDarkMode', function(data) {
      if (chrome.runtime.lastError) {
        console.error('Error loading theme:', chrome.runtime.lastError);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark);
        return;
      }
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = data.isDarkMode !== undefined ? data.isDarkMode : prefersDark;
      setTheme(isDark);
    });
  }

  initializeTheme();

  // Theme toggle event listener
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme !== 'dark');
  });

  function validateUrl(url) {
    const tiktokRegex = /^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/(video|photo)\/\d+/;
    // LinkedIn regex updated to match 19-digit IDs
    const linkedinRegex = /linkedin\.com.*[^0-9]([0-9]{19})/;
    return tiktokRegex.test(url) || linkedinRegex.test(url);
  }

  urlInput.addEventListener('input', () => {
    const isValid = validateUrl(urlInput.value);
    urlValidation.classList.toggle('hidden', isValid);
    getDateBtn.disabled = !isValid;
    result.classList.add('hidden');
    loader.classList.add('hidden');
  });

  getDateBtn.addEventListener('click', getDate);
  clearBtn.addEventListener('click', clearFields);
  copyBtn.addEventListener('click', copyDate);
  copyDetectedBtn.addEventListener('click', copyDetectedDate);

  function getLinkedInPostId(url) {
    const regex = /([0-9]{19})/;
    const postId = regex.exec(url)?.pop();
    return postId;
  }

  function getLinkedInCommentId(url) {
    const decodedUrl = decodeURIComponent(url);
    const regex = /fsd_comment:\((\d+),urn:li:activity:\d+\)/;
    const match = regex.exec(decodedUrl);
    
    if (match) {
      return match[1];
    }
    return null;
  }

  function extractLinkedInTimestamp(id) {
    if(id == null) {
      return null;
    }
    const asBinary = BigInt(id).toString(2);
    const first41Chars = asBinary.slice(0, 41);
    const timestamp = parseInt(first41Chars, 2);
    return timestamp;
  }

  function extractTikTokTimestamp(videoId) {
    try {
      const milliseconds = BigInt(videoId) >> 32n;
      return Number(milliseconds);
    } catch (error) {
      console.error('Error extracting TikTok timestamp:', error);
      return null;
    }
  }

  function getDate() {
    const url = urlInput.value.trim();
    const isValid = validateUrl(url);
    if (!isValid) {
      urlValidation.classList.remove('hidden');
      getDateBtn.disabled = true;
      result.classList.add('hidden');
      loader.classList.add('hidden');
      return;
    }

    loader.classList.remove('hidden');
    result.classList.add('hidden');
    urlValidation.classList.add('hidden');

    if (url.includes('tiktok.com')) {
      processTikTokUrl(url);
    } else if (url.includes('linkedin.com')) {
      processLinkedInUrl(url);
    }
  }

  function processLinkedInUrl(url) {
    try {
      loader.classList.remove('hidden');
      
      const postId = getLinkedInPostId(url);
      const commentId = getLinkedInCommentId(url);
      
      let timestamp = null;
      if (commentId) {
        timestamp = extractLinkedInTimestamp(commentId);
      } else {
        timestamp = extractLinkedInTimestamp(postId);
      }
      
      if (timestamp) {
        const humanDateFormat = unixTimestampToHumanDate(timestamp);
        showResult(humanDateFormat);
      } else {
        showError("Could not extract date from LinkedIn URL");
      }
    } catch (error) {
      showError("Error processing LinkedIn URL");
    } finally {
      loader.classList.add('hidden');
    }
  }

  function processTikTokUrl(url) {
    try {
      const vidId = getVidId(url);
      if (!vidId) {
        showError("Invalid TikTok video ID");
        return;
      }
      const timestamp = extractTikTokTimestamp(vidId);
      if (!timestamp) {
        showError("Could not extract timestamp from TikTok video ID");
        return;
      }
      const humanDateFormat = unixTimestampToHumanDate(timestamp * 1000); // Convert to milliseconds
      showResult(humanDateFormat);
    } catch (error) {
      console.error('Error in processTikTokUrl:', error);
      showError("Error processing TikTok URL");
    }
  }

  function getVidId(url) {
    const regex = /\/(video|photo)\/(\d+)/;
    const match = regex.exec(url);
    return match ? match[2] : null;
  }

  function unixTimestampToHumanDate(timestamp) {
    const dateObject = new Date(timestamp);
    return dateObject.toUTCString() + " (UTC)";
  }

  function showResult(date) {
    loader.classList.add('hidden');
    dateOutput.textContent = date;
    result.classList.remove('hidden');
  }

  function showDetected(date) {
    if (!date) return;
    detectedDateEl.textContent = date;
    autoDetect.classList.remove('hidden');
  }

  function showError(message) {
    loader.classList.add('hidden');
    urlValidation.textContent = message;
    urlValidation.classList.remove('hidden');
    result.classList.add('hidden');
  }

  function clearFields() {
    urlInput.value = '';
    result.classList.add('hidden');
    urlValidation.classList.add('hidden');
    getDateBtn.disabled = true;
    loader.classList.add('hidden');
    autoDetect.classList.add('hidden');
    detectedDateEl.textContent = '';
  }

  function copyDate() {
    navigator.clipboard.writeText(dateOutput.textContent).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    });
  }

  function copyDetectedDate() {
    navigator.clipboard.writeText(detectedDateEl.textContent).then(() => {
      const originalText = copyDetectedBtn.querySelector('span:last-child').textContent;
      copyDetectedBtn.querySelector('span:last-child').textContent = 'Copied!';
      setTimeout(() => {
        copyDetectedBtn.querySelector('span:last-child').textContent = originalText;
      }, 2000);
    });
  }

  // Listen for automatic detection messages while popup is open
  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === 'DATE_DETECTED' && message.date) {
      showDetected(message.date);
    }
  });

  // On popup open, try to auto-detect from the active tab
  function detectFromActiveTab() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) return;
        const activeTab = tabs && tabs[0];
        if (!activeTab || !activeTab.id) return;
        chrome.tabs.sendMessage(activeTab.id, { action: 'extractDate' }, (response) => {
          if (chrome.runtime.lastError) return; // content script may not be injected on this page
          if (response && response.date) {
            showDetected(response.date);
          }
        });
      });
    } catch (_) {
      // noop
    }
  }

  detectFromActiveTab();
});