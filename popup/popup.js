document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.querySelector("#url");
  const getDateBtn = document.querySelector("#getDateBtn");
  const clearBtn = document.querySelector("#clearBtn");
  const dateOutput = document.querySelector("#date");
  const copyBtn = document.querySelector("#copyBtn");
  const loader = document.querySelector("#loader");
  const urlValidation = document.querySelector("#urlValidation");
  const result = document.querySelector("#result");

  function validateUrl(url) {
    const tiktokRegex = /^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/(video|photo)\/\d+/;
    // LinkedIn regex updated to match 19-digit IDs
    const linkedinRegex = /linkedin\.com.*[^0-9]([0-9]{19})/;
    return tiktokRegex.test(url) || linkedinRegex.test(url);
  }

  urlInput.addEventListener('input', () => {
    if (validateUrl(urlInput.value)) {
      urlValidation.classList.add('hidden');
      getDateBtn.disabled = false;
    } else {
      urlValidation.classList.remove('hidden');
      getDateBtn.disabled = true;
    }
  });

  getDateBtn.addEventListener('click', getDate);
  clearBtn.addEventListener('click', clearFields);
  copyBtn.addEventListener('click', copyDate);

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
      const binary = BigInt(videoId).toString(2);
      const first31Bits = binary.slice(0, 31);
      const timestamp = parseInt(first31Bits, 2);
      return timestamp;
    } catch (error) {
      console.error('Error extracting TikTok timestamp:', error);
      return null;
    }
  }

  function getDate() {
    const url = urlInput.value;
    
    if (!validateUrl(url)) {
      urlValidation.classList.remove('hidden');
      return;
    }

    loader.classList.remove('hidden');
    result.classList.add('hidden');

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

  function showError(message) {
    loader.classList.add('hidden');
    urlValidation.textContent = message;
    urlValidation.classList.remove('hidden');
  }

  function clearFields() {
    urlInput.value = '';
    result.classList.add('hidden');
    urlValidation.classList.add('hidden');
    getDateBtn.disabled = true;
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
});