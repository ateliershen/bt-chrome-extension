import { marked } from '../../node_modules/marked/lib/marked.esm.js';

// Configure marked options
marked.setOptions({
    breaks: true,
    gfm: true
});

// Connect to the background script
const port = chrome.runtime.connect({ name: 'sidepanel' });

// UI Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const exampleQuestions = document.querySelectorAll('.example-question');

// Message templates
function createMessageElement(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;

    const bubbleContainer = document.createElement('div');
    bubbleContainer.className = 'relative group max-w-[80%]';

    const bubble = document.createElement('div');
    bubble.className = `rounded-lg p-3 text-sm ${
        isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground'
    }`;
    
    // Parse content for think tags
    const thinkMatch = content.match(/<think>(.*?)<\/think>/s);
    if (thinkMatch) {
        const mainContent = content.replace(/<think>.*?<\/think>/s, '').trim();
        const thinkContent = thinkMatch[1].trim();

        // Create main content
        const mainText = document.createElement('div');
        mainText.className = 'markdown-content';
        mainText.innerHTML = marked.parse(mainContent);
        bubble.appendChild(mainText);

        // Create accordion for think content
        const accordion = document.createElement('div');
        accordion.className = 'mt-2 border-t border-primary/10';

        const accordionTrigger = document.createElement('button');
        accordionTrigger.className = 'flex items-center gap-2 pt-2 text-xs text-primary/60 hover:text-primary/80 transition-colors';
        accordionTrigger.innerHTML = `
            <svg class="w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span>View reasoning</span>
        `;

        const accordionContent = document.createElement('div');
        accordionContent.className = 'hidden pt-2 text-xs text-primary/60';
        accordionContent.className = 'hidden pt-2 text-xs text-primary/60 markdown-content';
        accordionContent.innerHTML = marked.parse(thinkContent);

        let isOpen = false;
        accordionTrigger.addEventListener('click', () => {
            isOpen = !isOpen;
            accordionContent.className = `pt-2 text-xs text-primary/60 ${isOpen ? 'block' : 'hidden'}`;
            accordionTrigger.querySelector('svg').style.transform = isOpen ? 'rotate(180deg)' : '';
        });

        accordion.appendChild(accordionTrigger);
        accordion.appendChild(accordionContent);
        bubble.appendChild(accordion);
    } else {
        bubble.className = `rounded-lg p-3 text-sm markdown-content ${
            isUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
        }`;
        bubble.innerHTML = marked.parse(content);
    }

    // Add copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-secondary text-secondary-foreground opacity-0 group-hover:opacity-100 transition-opacity';
    copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    `;
    
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(content);
            // Show temporary success state
            copyButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            setTimeout(() => {
                copyButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                `;
            }, 1000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    });

    bubbleContainer.appendChild(bubble);
    bubbleContainer.appendChild(copyButton);
    messageDiv.appendChild(bubbleContainer);
    return messageDiv;
}

// Handle sending messages
async function sendMessage(question) {
    // Display user message
    chatMessages.appendChild(createMessageElement(question, true));
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Get page content
        const contentResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getPageContent' }, resolve);
        });

        if (!contentResponse.success) {
            throw new Error('Failed to get page content');
        }

        // Create loading message
        const loadingDiv = createMessageElement('Thinking...');
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Send question to AI
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'askQuestion',
                question: question,
                content: contentResponse.data
            }, resolve);
        });

        // Remove loading message
        chatMessages.removeChild(loadingDiv);

        if (response.success) {
            // Display AI response
            chatMessages.appendChild(createMessageElement(response.data));
        } else {
            throw new Error(response.error || 'Failed to get AI response');
        }
    } catch (error) {
        // Display error message
        chatMessages.appendChild(
            createMessageElement('Sorry, I encountered an error: ' + error.message)
        );
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event Listeners
sendButton.addEventListener('click', () => {
    const question = userInput.value.trim();
    if (question) {
        sendMessage(question);
        userInput.value = '';
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
    }
});

// Define prompts for example questions
const questionPrompts = {
    'Summarise': 'As an editor at The Business Times, please provide a concise summary of the provided information, presented in three distinct bullet points. Ensure that the tone is formal and adhere to British spelling conventions.',
    'Soc-med Copy': 'As an editor at The Business Times, compose a succinct social media post based on the page\'s content. Maintain a formal tone throughout the post. If possible, pose a question to engage the audience. The content should be no longer than 140 characters.',
    'Newsletter Blurb': 'As an editor at The Business Times, compose a subject and a lead of three sentences based on the page content. The content should be no longer than 200 characters.',
    'Push Notification': 'As an editor at The Business Times, compose a concise summary of the page\'s content, suitable for dissemination via push notifications. The content should be no longer than 43 characters.',
    'Short Takes': 'As an editor at The Business Times, please compose 10 to 15 bullet points based on the provided content. Adhere to the following guidelines: (1) Each bullet point should not exceed two sentences in length. (2) Incorporate numerical data, names, company names, and relevant quotes into the bullet points. (3) Provide a concise explanation of the underlying reasons behind the event. (4) Outline the potential consequences or outcomes that may transpire. (5) If the narrative pertains to a specific company, the first bullet point should include the company name, its primary activities, and a brief summary of the events.',
    '华语摘要': 'Provide a concise summary, utilizing three bullet points, in Simplified Chinese. Ensure that the summary is written in a formal tone.'
};

exampleQuestions.forEach(button => {
    button.addEventListener('click', () => {
        const buttonText = button.textContent.trim();
        const prompt = questionPrompts[buttonText] || buttonText;
        sendMessage(prompt);
    });
});

// Add initial message
chatMessages.appendChild(
    createMessageElement('Hello! I can help you understand this webpage. Try asking a question or use one of the example questions below.')
);
