import { Message, ProcessStep, ModelConfig, Attachment } from "../types";

const generateMockSteps = (prompt: string): ProcessStep[] => {
  const lowercasePrompt = prompt.toLowerCase();
  const techKeywords = ['npm', 'npx', 'yarn', 'pnpm', 'git', 'install', 'setup', 'init', 'vite', 'deploy', 'build'];
  const thinkingKeywords = ['plan', 'design', 'architecture', 'analyze', 'compare', 'solve'];

  const isTechRequest = techKeywords.some(k => lowercasePrompt.includes(k));
  const isThinkingRequest = thinkingKeywords.some(k => lowercasePrompt.includes(k));

  const steps: ProcessStep[] = [];
  if (isTechRequest) {
    steps.push({
      id: crypto.randomUUID(),
      type: 'thinking',
      title: 'Deep Thinking',
      content: `Analyzing technical requirements for: "${prompt.substring(0, 30)}..."`,
      duration: '0.8s',
      status: 'completed',
      isExpanded: false
    });
    steps.push({
      id: crypto.randomUUID(),
      type: 'command',
      content: 'Initializing environment...',
      status: 'completed',
      isExpanded: false
    });
  } else if (isThinkingRequest) {
    steps.push({
      id: crypto.randomUUID(),
      type: 'thinking',
      title: 'Reasoning',
      content: `Deconstructing the problem...`,
      duration: '1.2s',
      status: 'completed',
      isExpanded: false
    });
  }
  return steps;
};

export async function generateChatTitle(userPrompt: string, config?: ModelConfig): Promise<string> {
  // Simple title generation without AI fallback to avoid extra dependencies
  return userPrompt.substring(0, 30);
}

// Helper to normalize URL for proxy usage
const getEffectiveBaseUrl = (url: string | undefined): string => {
  if (!url) return '';
  const cleanUrl = url.replace(/\/+$/, '');
  // If user configured localhost:7860, use relative path to trigger Vite proxy
  if (cleanUrl.includes('localhost:7860') || cleanUrl.includes('127.0.0.1:7860')) {
    return '';
  }
  return cleanUrl;
};

// Stream from LangFlow using OpenAI SDK format
// Helper to find ChatInput ID
async function getChatInputId(baseUrl: string, flowId: string, apiKey?: string): Promise<string | null> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const response = await fetch(`${baseUrl}/api/v1/flows/${flowId}`, { headers });
    if (!response.ok) return null;

    const data = await response.json();
    const nodes = data.data?.nodes || [];
    const chatInput = nodes.find((n: any) => n.data?.type === 'ChatInput');
    return chatInput?.id || null;
  } catch (e) {
    console.warn("Failed to fetch flow details:", e);
    return null;
  }
}

// Helper to upload file to LangFlow
async function uploadFileToLangFlow(
  baseUrl: string,
  flowId: string,
  dataURI: string,
  apiKey?: string
): Promise<string | null> {
  try {
    const headers: HeadersInit = {};
    if (apiKey) headers['x-api-key'] = apiKey;

    // Convert Data URI to Blob
    const response = await fetch(dataURI);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('file', blob, 'image.png'); // Default name

    const uploadResponse = await fetch(`${baseUrl}/api/v1/files/upload/${flowId}`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!uploadResponse.ok) {
      console.error('File upload failed:', await uploadResponse.text());
      return null;
    }

    const data = await uploadResponse.json();
    return data.file_path || null;
  } catch (e) {
    console.error("Failed to upload file:", e);
    return null;
  }
}

// Stream from LangFlow using OpenAI SDK format
// Stream from LangFlow using OpenAI SDK format
async function* streamFromLangFlow(
  history: Message[],
  newMessage: string,
  config: ModelConfig,
  attachments: Attachment[] = []
): AsyncGenerator<{ type: 'text' | 'steps'; content?: string; steps?: ProcessStep[] }, void, unknown> {
  try {
    const baseUrl = getEffectiveBaseUrl(config.langflowUrl);
    const flowId = config.modelId; // Flow ID

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    };

    // Add API key if provided
    if (config.langflowApiKey) {
      headers['x-api-key'] = config.langflowApiKey;
    }

    // Handle Attachments (Images)
    let tweaks: any = {};

    if (attachments.length > 0 && flowId) {
      // 1. Upload files FIRST (as requested by user)
      const uploadedFilePaths: string[] = [];
      for (const attachment of attachments) {
        if (attachment.type === 'image') {
          const filePath = await uploadFileToLangFlow(baseUrl, flowId, attachment.content, config.langflowApiKey);
          if (filePath) {
            uploadedFilePaths.push(filePath);
          }
        }
      }

      // 2. Resolve ChatInput ID
      if (uploadedFilePaths.length > 0) {
        const chatInputId = await getChatInputId(baseUrl, flowId, config.langflowApiKey);

        if (chatInputId) {
          tweaks[chatInputId] = {
            files: uploadedFilePaths
          };
        } else {
          console.warn('Files uploaded but ChatInput ID not found. Tweaks will not be applied.');
        }
      }
    }

    // Generate session ID
    const sessionId = `chat-${Date.now()}`;

    // Construct Body matching User's CURL example (wrapped in input_request)
    const payload = {
      input_value: newMessage,
      input_type: "chat",
      output_type: "chat",
      tweaks: tweaks
      // session_id is often part of query params or body, but user example didn't show it in body. 
      // We will keep it flexible or add it if needed, but user's curl didn't have it in the JSON body.
      // Wait, user curl: "input_request": { "input_value": ... }
    };

    const body: any = {
      input_request: payload
    };

    // Some versions need session_id at top level or inside input_request? 
    // User curl didn't show session_id in the body, only in specific fields? Actually user didn't show session_id.
    // We'll add session_id to payload just in case, as it's standard.
    (payload as any).session_id = sessionId;

    // Use /run endpoint with proper format
    const response = await fetch(`${baseUrl}/api/v1/run/${flowId}?stream=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`LangFlow API Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to read stream");

    const decoder = new TextDecoder();
    let buffer = '';
    let lastContent = ''; // Track last content to detect duplicates

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // LangFlow uses _19 as delimiter, clean it
        const cleanLine = line.replace(/^_19/, '').replace(/^data: /, '').trim();
        if (!cleanLine || cleanLine === '[DONE]') continue;

        try {
          const json = JSON.parse(cleanLine);

          // Handle add_message event with content_blocks (tool usage)
          if (json.event === 'add_message' && json.data?.content_blocks) {
            const contentBlocks = json.data.content_blocks;

            if (Array.isArray(contentBlocks) && contentBlocks.length > 0) {
              const steps: ProcessStep[] = [];

              for (const block of contentBlocks) {
                // Check if block has "contents" array (new LangFlow format)
                if (block.contents && Array.isArray(block.contents)) {
                  for (const content of block.contents) {
                    // Parse tool_use type
                    if (content.type === 'tool_use') {
                      const toolName = content.name || 'Unknown Tool';
                      const toolInput = content.tool_input ? JSON.stringify(content.tool_input, null, 2) : '';
                      const toolOutput = content.output || '';
                      const duration = content.duration ? `${content.duration}s` : '';

                      steps.push({
                        id: crypto.randomUUID(),
                        type: 'command',
                        content: `**${toolName}**${toolInput ? `\n\nInput:\n\`\`\`json\n${toolInput}\n\`\`\`` : ''}${toolOutput ? `\n\nOutput:\n${toolOutput}` : ''}`,
                        duration: duration,
                        status: 'completed',
                        isExpanded: false
                      });
                    }

                    // Parse text type (Input/Output)
                    if (content.type === 'text' && content.header?.title) {
                      const headerTitle = content.header.title;
                      const text = content.text || '';

                      // Only show thinking/reasoning steps, skip Input/Output
                      if (headerTitle !== 'Input' && headerTitle !== 'Output' && text) {
                        steps.push({
                          id: crypto.randomUUID(),
                          type: 'thinking',
                          title: headerTitle,
                          content: text,
                          status: 'completed',
                          isExpanded: false
                        });
                      }
                    }
                  }
                }

                // Fallback: Old format support
                // Parse tool_use blocks (old format)
                if (block.type === 'tool_use') {
                  const toolName = block.name || 'Unknown Tool';
                  const toolInput = block.input ? JSON.stringify(block.input, null, 2) : '';
                  const toolOutput = block.output || '';
                  const duration = block.duration || '';

                  steps.push({
                    id: block.id || crypto.randomUUID(),
                    type: 'command',
                    content: `**${toolName}**${toolInput ? `\n\nInput:\n\`\`\`json\n${toolInput}\n\`\`\`` : ''}${toolOutput ? `\n\nOutput:\n${toolOutput}` : ''}`,
                    duration: duration,
                    status: 'completed',
                    isExpanded: false
                  });
                }

                // Parse thinking blocks (old format)
                if (block.type === 'thinking' || block.type === 'text') {
                  const content = block.content || block.text || '';
                  if (content) {
                    steps.push({
                      id: block.id || crypto.randomUUID(),
                      type: 'thinking',
                      title: 'Reasoning',
                      content: content,
                      status: 'completed',
                      isExpanded: false
                    });
                  }
                }
              }

              if (steps.length > 0) {
                yield { type: 'steps', steps };
              }
            }
            continue;
          }

          // Handle LangFlow /run endpoint format
          if ((json.event === 'token' || json.event === 'message') && json.data?.chunk) {
            const content = json.data.chunk;

            // Skip empty content
            if (!content) continue;

            // Skip duplicate content
            if (content === lastContent) {
              continue;
            }

            lastContent = content;
            yield { type: 'text', content };
            continue;
          }

          // Handle end event (optional, contains full message)
          if (json.event === 'end' && json.data?.result?.message) {
            // We already streamed all tokens, so we can skip this
            continue;
          }

          // Fallback: Handle delta format (old responses endpoint)
          if (json.delta && json.delta.content) {
            const content = json.delta.content;
            if (!content) continue;
            if (content === lastContent) continue;

            lastContent = content;
            yield { type: 'text', content };
            continue;
          }

          // Fallback: Handle full response
          const responseContent = json.output_text || json.output || json.text || json.content;
          if (responseContent) {
            yield { type: 'text', content: responseContent };
            continue;
          }

          // Fallback: Handle chunk format
          if (json.chunk) {
            yield { type: 'text', content: json.chunk };
          }
        } catch (e) {
          console.error("Error parsing LangFlow stream:", cleanLine);
        }
      }
    }
  } catch (error) {
    console.error("LangFlow streaming error:", error);
    yield { type: 'text', content: `Error: ${error instanceof Error ? error.message : 'Failed to connect to LangFlow'}` };
  }
}

export async function* streamMessageFromGemini(
  history: Message[],
  newMessage: string,
  config: ModelConfig,
  attachments: Attachment[] = []
): AsyncGenerator<{ type: 'text' | 'steps'; content?: string; steps?: ProcessStep[] }, void, unknown> {
  // Check if this is a LangFlow agent (has langflowUrl configured)
  if (config.langflowUrl && config.modelId) {
    // Use LangFlow
    const mockSteps = generateMockSteps(newMessage);
    if (mockSteps.length > 0) {
      yield { type: 'steps', steps: mockSteps };
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    yield* streamFromLangFlow(history, newMessage, config, attachments);
    return;
  }

  // Fallback if LangFlow is not configured but tried to use this service
  yield { type: 'text', content: 'Error: LangFlow is not configured. Please check your settings.' };
}

export async function generateSuggestions(
  history: Message[],
  userPrompt: string,
  lastResponse: string,
  config: ModelConfig
): Promise<string[]> {
  try {

    // Construct a simple prompt context
    const recentMessages = history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `
Conversation History:
${recentMessages}
User: ${userPrompt}
Assistant: ${lastResponse}

Task: Generate 3 short, relevant follow-up questions that the USER would ask the Assistant next.
Constraints:
1. Phrasing must be from the USER's perspective (e.g., "Tell me more", "How do I...", "Explain X").
2. Respond ONLY with the 3 suggestions, one per line.
3. Do not number them.
4. Do not include quotes.
5. Respond in the SAME LANGUAGE as the "User" message above.
    `.trim();

    // If LangFlow is configured, use it
    if (config.langflowUrl && config.modelId) {
      try {
        const baseUrl = getEffectiveBaseUrl(config.langflowUrl);
        const flowId = config.modelId;
        const suggestionSessionId = `suggestion-${Date.now()}`;

        const response = await fetch(`${baseUrl}/api/v1/run/${flowId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            ...(config.langflowApiKey ? { 'x-api-key': config.langflowApiKey } : {})
          },
          body: JSON.stringify({
            input_value: prompt,
            input_type: "chat",
            output_type: "chat",
            session_id: suggestionSessionId,
            tweaks: {}
          })
        });

        if (!response.ok) throw new Error(`LangFlow API Error: ${response.status}`);

        const data = await response.json();
        const outputText = data.outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ||
          data.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
          "";

        // Remove <think> tags
        const cleanOutput = outputText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        return cleanOutput.split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
          .slice(0, 3);
      } catch (error) {
        console.warn("LangFlow suggestion generation failed:", error);
        return [];
      }
    }

    return [];

  } catch (error) {
    console.warn("Failed to generate suggestions:", error);
    return [];
  }
}
