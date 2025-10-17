chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.type === 'DATE_DETECTED' && sender.tab && sender.tab.id) {
        // Show green badge when date is detected
        chrome.action.setBadgeText({
          text: "●",
          tabId: sender.tab.id
        }, () => {
          // Ignore any errors (e.g., tab closed)
          if (chrome.runtime.lastError) {
            return;
          }
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: "#10b981",
          tabId: sender.tab.id
        }, () => {
          // Ignore any errors
          if (chrome.runtime.lastError) {
            return;
          }
        });
      }
    } catch (error) {
      // Silently handle any errors
      return;
    }
  });