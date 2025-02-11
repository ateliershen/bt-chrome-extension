## ⚠️ How to Add API Key
**Step 1:**
Visit `https://console.groq.com/keys` and create a free account. Subsequently, generate the API Key.

**Step 2:**
Locate the file `src/background/background.js` and navigate to line 8. Replace the existing API Key with your newly generated one.

**Important Notice:** Typically, it is advisable to refrain from saving the KPI key directly in the file. However, for the purpose of expediting the process, we have made a slight compromise in terms of security. While this deviation should not pose a significant risk if you are the sole user of this extension, please exercise caution when sharing this tool with others, particularly if you are utilizing a paid API key.

## How to Install
1. Launch Chrome and navigate to the `chrome://extensions/` page.
2. Enable the Developer Mode by clicking on the top right corner.
3. Click on `Load Unpacked` and locate the extension folder.
4. If Chrome prompts for permission, kindly grant it to ensure proper loading. 

## Customizing the Prompts
1. Navigate to `/src/sidepanel/app.js` and locate line 186, which contains the `questionPrompts` object. This object holds the labels and prompts that can be modified.
2. After modifying the `questionPrompts` items, proceed to `/src/sidepanel/index.html` and locate line 70, which corresponds to the buttons. Ensure that the text labels of these buttons are identical to the corresponding labels in the `questionPrompts` object.

## Limitations
1. **Rate Limit:** The free plan has a limit of 1,000 requests per day.
2. **Context Window:** The context window allows 6,000 tokens per minute. This means you cannot use this tool to read excessively long articles.
3. **Stability:** As a free endpoint, the service may occasionally experience temporary overloads. In most cases, this can be resolved by retrying the request later.
4. For more information about the rate limit, please refer to the documentation at `https://console.groq.com/docs/rate-limits`.
