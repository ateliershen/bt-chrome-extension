// Import Readability directly since webpack will handle the bundling
import { Readability } from '@mozilla/readability';

// Add required JSDOM dependencies that Readability needs
const JSDOM = window; // Use the browser's DOM instead of JSDOM

function extractContent() {
  // Clone the document to avoid modifying the original
  const documentClone = document.cloneNode(true);
  const reader = new Readability(documentClone, {
    // Additional configuration for better content extraction
    charThreshold: 20,
    classesToPreserve: ['article', 'content', 'main']
  });
  const article = reader.parse();

  return {
    title: article.title,
    content: article.textContent,
    excerpt: article.excerpt,
    byline: article.byline,
    siteName: article.siteName,
    url: window.location.href
  };
}

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    try {
      const content = extractContent();
      sendResponse({ success: true, data: content });
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error.message || 'Failed to extract content' 
      });
    }
    return true; // Required for async response
  }
});

// Notify that content script is ready
chrome.runtime.sendMessage({ 
  action: 'contentScriptReady',
  data: { url: window.location.href }
});
