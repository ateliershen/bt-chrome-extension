// Store the current tab's content
let pageContent = null;

// Set up side panel behavior to open when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Initialize Groq API configuration
const GROQ_API_KEY = '';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'contentScriptReady') {
    // Reset page content when navigating to a new page
    pageContent = null;
  }
  
  if (request.action === 'getPageContent') {
    // If we don't have the content yet, request it from the content script
    if (!pageContent) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageContent' }, (response) => {
            if (response && response.success) {
              pageContent = response.data;
              sendResponse({ success: true, data: pageContent });
            } else {
              sendResponse({ success: false, error: 'Failed to get page content' });
            }
          });
        }
      });
      return true; // Required for async response
    }
    // If we already have the content, return it immediately
    sendResponse({ success: true, data: pageContent });
  }

  if (request.action === 'askQuestion') {
    handleQuestion(request.question, request.content)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});

// Function to handle questions using Groq API
async function handleQuestion(question, content) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions about webpage content. Focused on the user\'s question.'
          },
          {
            role: 'user',
            content: `Context: ${content.title}\n\n${content.content}\n\nQuestion: ${question}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw new Error('Failed to get response from AI');
  }
}

// Handle side panel connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    port.onDisconnect.addListener(() => {
      // Clean up when side panel is closed
      pageContent = null;
    });
  }
});
