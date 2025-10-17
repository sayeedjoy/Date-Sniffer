chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DATE_DETECTED') {
      // Show green badge when date is detected
      chrome.action.setBadgeText({
        text: "●",
        tabId: sender.tab.id
      });
      chrome.action.setBadgeBackgroundColor({
        color: "#10b981",
        tabId: sender.tab.id
      });
    }
  });