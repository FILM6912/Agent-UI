import { Message, ProcessStep, ModelConfig, Attachment, ChatSession } from "../../../types";
import { generateUUID } from "@/lib/utils";


export async function generateChatTitle(userPrompt: string, _config?: ModelConfig): Promise<string> {
  // Simple title generation without AI fallback to avoid extra dependencies
  return userPrompt.substring(0, 30);
}

// Helper to normalize URL for proxy usage
const getEffectiveBaseUrl = (url: string | undefined): string => {
  if (!url) return '';
  const cleanUrl = url.replace(/\/+$/, '');
  // If user configured localhost:7860 or specific local IP, use relative path to trigger Vite proxy
  if (cleanUrl.includes('localhost:7860') || cleanUrl.includes('127.0.0.1:7860') || cleanUrl.includes('192.168.99.1:7860')) {
    return '';
  }
  return cleanUrl;
};

// Helper to ensure content is a string
const ensureString = (content: any): string => {
  if (typeof content === 'string') return content;
  if (content === null || content === undefined) return '';
  if (typeof content === 'object') {
    // Try to find a text field first
    if (content.text) return ensureString(content.text);
    if (content.content) return ensureString(content.content);
    if (content.output) return ensureString(content.output);
    if (content.chunk) return ensureString(content.chunk);
    
    // Fallback to JSON stringify
    try {
      return JSON.stringify(content, null, 2);
    } catch (e) {
      return String(content);
    }
  }
  return String(content);
};

// Helper to parse content_blocks into ProcessSteps
const parseContentBlocks = (contentBlocks: any[]): ProcessStep[] => {
  const steps: ProcessStep[] = [];
  if (!Array.isArray(contentBlocks)) return steps;

  for (const block of contentBlocks) {
    // Check if block has "contents" array (new LangFlow format)
    if (block.contents && Array.isArray(block.contents)) {
      for (const content of block.contents) {
        // Parse tool_use type
        if (content.type === 'tool_use') {
          const toolName = content.name || 'Unknown Tool';
          const toolInput = content.tool_input ? (typeof content.tool_input === 'string' ? content.tool_input : JSON.stringify(content.tool_input, null, 2)) : '';
          const toolOutput = content.output ? ensureString(content.output) : '';
          const duration = content.duration ? `${content.duration}s` : '';

          steps.push({
            id: content.id || `tool-${toolName}-${steps.length}`,
            type: 'command',
            title: toolName,
            content: `${toolInput ? `Input:\n\`\`\`json\n${toolInput}\n\`\`\`` : ''}${toolOutput ? `\n\nOutput:\n${toolOutput}` : ''}`,
            duration: duration,
            status: toolOutput ? 'completed' : 'running',
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
              id: generateUUID(),
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
      const toolInput = block.input ? (typeof block.input === 'string' ? block.input : JSON.stringify(block.input, null, 2)) : '';
      const toolOutput = block.output ? ensureString(block.output) : '';
      const duration = block.duration || '';

      steps.push({
        id: block.id || `tool-${toolName}-${contentBlocks.indexOf(block)}`,
        type: 'command',
        title: toolName,
        content: `${toolInput ? `Input:\n\`\`\`json\n${toolInput}\n\`\`\`` : ''}${toolOutput ? `\n\nOutput:\n${toolOutput}` : ''}`,
        duration: duration,
        status: toolOutput ? 'completed' : 'running',
        isExpanded: false
      });
    }

    // Parse thinking blocks (old format)
    if (block.type === 'thinking' || block.type === 'text') {
      const content = block.content || block.text || '';
      if (content) {
        steps.push({
          id: block.id || generateUUID(),
          type: 'thinking',
          title: 'Reasoning',
          content: content,
          status: 'completed',
          isExpanded: false
        });
      }
    }
  }
  return steps;
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
  _history: Message[],
  newMessage: string,
  config: ModelConfig,
  attachments: Attachment[] = [],
  chatId?: string
): AsyncGenerator<{ type: 'text' | 'steps'; content?: string; steps?: ProcessStep[]; isFullText?: boolean }, void, unknown> {
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

    // Use valid UUID from chat ID if available, otherwise generate one
    const sessionId = chatId || `chat-${Date.now()}`;

    // Construct Body matching User's CURL example (wrapped in input_request)
    const payload = {
      input_value: newMessage,
      input_type: "chat",
      output_type: "chat",
      tweaks: tweaks
    };

    const body: any = {
      input_request: payload
    };

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
    let accumulatedText = ''; // Track full text to compare with end event
    let lastContent = ''; // Track last content to detect duplicates
    let hasStreamedTokens = false; // Track if we have streamed any tokens

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
            const steps = parseContentBlocks(json.data.content_blocks);
            if (steps.length > 0) {
              yield { type: 'steps', steps };
            }
            continue;
          }

          // Handle LangFlow /run endpoint format
          if ((json.event === 'token' || json.event === 'message') && json.data) {
            // Check for steps in message event
            if (json.event === 'message' && json.data.content_blocks) {
              const steps = parseContentBlocks(json.data.content_blocks);
              if (steps.length > 0) {
                yield { type: 'steps', steps };
              }
            }

            const content = json.data.chunk;

            // Skip empty content
            if (!content) continue;

            // Skip duplicate content
            if (content === lastContent) {
              continue;
            }

            lastContent = content;
            hasStreamedTokens = true;
            const textChunk = ensureString(content);
            accumulatedText += textChunk;
            yield { type: 'text', content: textChunk };
            continue;
          }

          // Handle end event
          if (json.event === 'end') {
            try {
              const resultData = json.data?.result || {};
              const outputsOuter = resultData.outputs || [];
              if (outputsOuter.length > 0) {
                const outputsInner = outputsOuter[0].outputs || [];
                if (outputsInner.length > 0) {
                  const results = outputsInner[0].results || {};
                  
                  // Extract Steps from End Event
                  const messageData = results.message?.data || {};
                  if (messageData.content_blocks) {
                    const steps = parseContentBlocks(messageData.content_blocks);
                    if (steps.length > 0) {
                      yield { type: 'steps', steps };
                    }
                  }

                  const finalText = ensureString(messageData.text);
                  if (finalText && finalText !== accumulatedText) {
                    // If final text differs, yield the authoritative full text
                    yield { type: 'text', content: finalText, isFullText: true };
                  }
                }
              }
            } catch (e) {
              // Ignore extraction errors
            }
            continue;
          }

          // Fallback: Handle delta format (old responses endpoint)
          if (json.delta && json.delta.content) {
            const content = json.delta.content;
            if (!content) continue;
            if (content === lastContent) continue;

            lastContent = content;
            hasStreamedTokens = true;
            const textChunk = ensureString(content);
            accumulatedText += textChunk;
            yield { type: 'text', content: textChunk };
            continue;
          }

          // Fallback: Handle full response
          const responseContent = json.output_text || json.output || json.text || json.content;
          if (responseContent && !hasStreamedTokens) {
            const textChunk = ensureString(responseContent);
            accumulatedText += textChunk;
            yield { type: 'text', content: textChunk };
            continue;
          }

          // Fallback: Handle chunk format
          if (json.chunk) {
            const textChunk = ensureString(json.chunk);
            accumulatedText += textChunk;
            yield { type: 'text', content: textChunk };
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

// Stream using OpenAI SDK compatible format (Langflow /api/v1/responses endpoint)
async function* streamFromOpenAI(
  _history: Message[],
  newMessage: string,
  config: ModelConfig,
  _attachments: Attachment[] = [],
  _chatId?: string
): AsyncGenerator<{ type: 'text' | 'steps'; content?: string; steps?: ProcessStep[]; isFullText?: boolean }, void, unknown> {
  try {
    const baseUrl = getEffectiveBaseUrl(config.langflowUrl);
    const flowId = config.modelId; // Flow ID is used as the model

    // Build headers matching user's example
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if provided (x-api-key header as in user example)
    if (config.langflowApiKey) {
      headers['x-api-key'] = config.langflowApiKey;
    }

    // Construct request body matching OpenAI SDK format
    const body = {
      model: flowId,
      input: newMessage,
      stream: true
    };

    // Call the OpenAI-compatible responses endpoint
    const response = await fetch(`${baseUrl}/api/v1/responses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to read stream");

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleanLine = line.replace(/^data: /, '').trim();
        if (!cleanLine || cleanLine === '[DONE]') continue;

        try {
          const json = JSON.parse(cleanLine);

          // Handle delta format (OpenAI streaming format)
          if (json.delta && json.delta.content) {
            const content = json.delta.content;
            if (!content) continue;
            
            const textChunk = ensureString(content);
            accumulatedText += textChunk;
            yield { type: 'text', content: textChunk };
            continue;
          }

          // Handle choices format (alternative OpenAI format)
          if (json.choices && json.choices[0]?.delta?.content) {
            const content = json.choices[0].delta.content;
            if (!content) continue;
            
            const textChunk = ensureString(content);
            accumulatedText += textChunk;
            yield { type: 'text', content: textChunk };
            continue;
          }

          // Handle output_text (full response fallback)
          if (json.output_text) {
            const textChunk = ensureString(json.output_text);
            yield { type: 'text', content: textChunk, isFullText: true };
            continue;
          }

        } catch (e) {
          console.error("Error parsing OpenAI stream:", cleanLine);
        }
      }
    }
  } catch (error) {
    console.error("OpenAI streaming error:", error);
    yield { type: 'text', content: `Error: ${error instanceof Error ? error.message : 'Failed to connect to OpenAI-compatible API'}` };
  }
}

export async function* streamMessageFromGemini(
  history: Message[],
  newMessage: string,
  config: ModelConfig,
  attachments: Attachment[] = [],
  chatId?: string
): AsyncGenerator<{ type: 'text' | 'steps'; content?: string; steps?: ProcessStep[]; isFullText?: boolean }, void, unknown> {
  // Check if this is a LangFlow agent (has langflowUrl configured)
  if (config.langflowUrl && config.modelId) {
    // Route based on apiType
    if (config.apiType === 'openai') {
      yield* streamFromOpenAI(history, newMessage, config, attachments, chatId);
    } else {
      // Default to langflow (backward compatible)
      yield* streamFromLangFlow(history, newMessage, config, attachments, chatId);
    }
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

// LangFlow Message Interface
interface LangFlowMessage {
  id: string;
  flow_id: string;
  timestamp: string;
  sender: string;
  sender_name: string;
  session_id: string;
  text: string;
  files: string; // JSON string of file paths
  content_blocks: any[];
  properties: any;
}


// Helper to map LangFlow messages to minimal stubs (performance)
function mapLangFlowMessagesMinimal(messages: LangFlowMessage[]): Message[] {
  return messages
    .map(msg => ({
      id: msg.id,
      role: msg.sender === 'User' ? 'user' : 'assistant' as any,
      content: '', // No content for stubs
      timestamp: new Date(msg.timestamp).getTime(),
    }));
}

// Helper to map LangFlow messages to internal Message type (full)
function mapLangFlowMessages(messages: LangFlowMessage[], baseUrl: string): Message[] {
  return messages
    .map(msg => {
      const isUser = msg.sender === 'User';
      const role = isUser ? 'user' : 'assistant';

      // Parse Files
      const attachments: Attachment[] = [];
      try {
        const filesArray = JSON.parse(msg.files || '[]');
        if (Array.isArray(filesArray)) {
          filesArray.forEach((filePath: string) => {
            const fileName = filePath.split('/').pop();
            if (fileName) {
              const imageUrl = `${baseUrl}/api/v1/files/images/${msg.flow_id}/${fileName}`;
              attachments.push({
                type: 'image',
                content: imageUrl,
                name: fileName
              });
            }
          });
        }
      } catch (e) {
        // Silently fail for malformed JSON
      }

      return {
        id: msg.id,
        role: role,
        content: msg.text,
        timestamp: new Date(msg.timestamp).getTime(),
        attachments: attachments.length > 0 ? attachments : undefined,
        steps: msg.content_blocks ? parseContentBlocks(msg.content_blocks) : undefined
      };
    });
}

export async function fetchHistoryFromLangFlow(
  config: ModelConfig,
  chatId: string
): Promise<Message[]> {
  if (!config.langflowUrl || !config.modelId) return [];

  try {
    const baseUrl = getEffectiveBaseUrl(config.langflowUrl);
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (config.langflowApiKey) headers['x-api-key'] = config.langflowApiKey;

    // Fetch messages for this session
    const response = await fetch(`${baseUrl}/api/v1/monitor/messages?session_id=${chatId}&order_by=timestamp`, { headers });

    if (!response.ok) {
      console.warn(`Failed to fetch history: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const messagesData: LangFlowMessage[] = Array.isArray(data) ? data : (data.data || []);

    // Deduplicate: Keep the LATEST record for each ID
    const uniqueMessages = new Map<string, LangFlowMessage>();
    messagesData.forEach(msg => {
      uniqueMessages.set(msg.id, msg);
    });

    return mapLangFlowMessages(Array.from(uniqueMessages.values()), baseUrl);
  } catch (error) {
    console.warn("Error fetching LangFlow history:", error);
    return [];
  }
}

export async function fetchAllSessionsFromLangFlow(config: ModelConfig): Promise<ChatSession[]> {
  console.log('>>> fetchAllSessionsFromLangFlow called', config);
  if (!config.langflowUrl || !config.modelId) {
    console.warn('>>> Missing config for fetchAllSessionsFromLangFlow');
    return [];
  }

  try {
    const baseUrl = getEffectiveBaseUrl(config.langflowUrl);
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (config.langflowApiKey) headers['x-api-key'] = config.langflowApiKey;

    console.log('>>> Fetching sessions from:', `${baseUrl}/api/v1/monitor/messages?order_by=timestamp`);

    const fetchUrl = `${baseUrl}/api/v1/monitor/messages?order_by=timestamp&limit=2000`;
    console.log('>>> fetchAllSessionsFromLangFlow fetching from:', fetchUrl);
    
    const response = await fetch(fetchUrl, { headers });

    console.log('>>> fetchAllSessionsFromLangFlow response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      console.warn(`>>> Failed to fetch sessions: ${response.status}`, errorText);
      return [];
    }

    const data = await response.json();
    console.log('>>> fetchAllSessionsFromLangFlow raw data length:', Array.isArray(data) ? data.length : (data.data ? data.data.length : 'unknown'));
    const allMessages: LangFlowMessage[] = Array.isArray(data) ? data : (data.data || []);
    console.log('>>> fetchAllSessionsFromLangFlow parsed messages count:', allMessages.length);

    if (allMessages.length > 0) {
      console.log('>>> Sample message keys:', Object.keys(allMessages[0]));
      console.log('>>> Sample message session_id:', allMessages[0].session_id);
    }

    // Group by Session ID
    const sessionsMap = new Map<string, LangFlowMessage[]>();

    allMessages.forEach((msg) => {
      // Find session ID robustly
      const sessionId = msg.session_id || (msg as any).sessionId || (msg as any).sessionID;
      
      if (!sessionId) return;

      const existing = sessionsMap.get(sessionId) || [];
      existing.push(msg);
      sessionsMap.set(sessionId, existing);
    });

    console.log(`>>> Created ${sessionsMap.size} unique session buckets before filtering`);

    // Convert to ChatSession
    const sessions: ChatSession[] = [];

    sessionsMap.forEach((msgs, sessionId) => {
      if (msgs.length === 0) return;

      // Sort messages by timestamp
      msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const lastMsg = msgs[msgs.length - 1];
      const firstUserMsg = msgs.find(m => m.sender === 'User');

      const title = firstUserMsg ? firstUserMsg.text.substring(0, 30) : `Chat ${sessionId.substring(0, 6)}`;

      sessions.push({
        id: sessionId,
        title: title,
        messages: mapLangFlowMessagesMinimal(msgs),
        updatedAt: new Date(lastMsg.timestamp).getTime()
      });
    });

    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.warn("Failed to fetch sessions from LangFlow:", error);
    return [];
  }
}

export async function deleteSession(config: ModelConfig, sessionId: string): Promise<boolean> {
  if (!config.langflowUrl) return false;

  try {
    const baseUrl = getEffectiveBaseUrl(config.langflowUrl);
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (config.langflowApiKey) headers['x-api-key'] = config.langflowApiKey;

    const response = await fetch(`${baseUrl}/api/v1/monitor/messages/session/${sessionId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      console.warn(`Failed to delete session: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting session:", error);
    return false;
  }
}
