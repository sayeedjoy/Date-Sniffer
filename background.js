chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DATE_DETECTED') {
      // Update extension icon or badge
      chrome.action.setBadgeText({
        text: "📅",
        tabId: sender.tab.id
      });
    }
  });