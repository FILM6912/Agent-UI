import { GoogleGenAI } from "@google/genai";
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
  try {
    // If using LangFlow, just use the prompt as title
    if (config?.langflowUrl) {
      return userPrompt.substring(0, 30);
    }
    
    if (!process.env.API_KEY) return userPrompt.substring(0, 30);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a very short title (4-5 words max) for: "${userPrompt}". Respond ONLY with the title.`,
    });
    return response.text?.trim() || userPrompt.substring(0, 30);
  } catch (error) {
    return userPrompt.substring(0, 30);
  }
}

// Stream from LangFlow using OpenAI SDK format
async function* streamFromLangFlow(
  history: Message[],
  newMessage: string,
  config: ModelConfig
): AsyncGenerator<{ type: 'text' | 'steps'; content?: string; steps?: ProcessStep[] }, void, unknown> {
  try {
    const baseUrl = config.langflowUrl?.replace(/\/+$/, '');
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
    
    // Generate session ID (you can make this persistent per chat if needed)
    const sessionId = `chat-${Date.now()}`;
    
    console.log('LangFlow Request:', {
      url: `${baseUrl}/api/v1/run/${flowId}?stream=true`,
      flowId,
      sessionId,
      hasApiKey: !!config.langflowApiKey
    });
    
    // Use /run endpoint with proper format
    const response = await fetch(`${baseUrl}/api/v1/run/${flowId}?stream=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input_value: newMessage,
        input_type: "chat",
        output_type: "chat",
        session_id: sessionId,
        tweaks: {}
      })
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
            console.log('Content blocks received:', contentBlocks);
            
            if (Array.isArray(contentBlocks) && contentBlocks.length > 0) {
              const steps: ProcessStep[] = [];
              
              for (const block of contentBlocks) {
                // Parse tool_use blocks
                if (block.type === 'tool_use') {
                  const toolName = block.name || 'Unknown Tool';
                  const toolInput = block.input ? JSON.stringify(block.input, null, 2) : '';
                  const toolOutput = block.output || '';
                  const duration = block.duration || '';
                  
                  steps.push({
                    id: block.id || crypto.randomUUID(),
                    type: 'command',
                    content: `Executed **${toolName}**${toolInput ? `\n\nInput:\n\`\`\`json\n${toolInput}\n\`\`\`` : ''}${toolOutput ? `\n\nOutput:\n${toolOutput}` : ''}`,
                    duration: duration,
                    status: 'completed',
                    isExpanded: false
                  });
                }
                
                // Parse thinking blocks
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
          if (json.event === 'token' && json.data?.chunk) {
            const content = json.data.chunk;
            
            // Skip empty content
            if (!content) continue;
            
            // Skip duplicate content
            if (content === lastContent) {
              console.log('Skipping duplicate chunk:', content);
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
  if (!process.env.API_KEY) throw new Error("API_KEY is missing");

  const mockSteps = generateMockSteps(newMessage);
  if (mockSteps.length > 0) {
    yield { type: 'steps', steps: mockSteps };
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  // Check if this is a LangFlow agent (has langflowUrl configured)
  if (config.langflowUrl && config.modelId) {
    // Use OpenAI SDK to call LangFlow
    yield* streamFromLangFlow(history, newMessage, config);
    return;
  }

  if (config.provider === 'google') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct history with attachments
    const recentHistory = history.slice(-10).map(msg => {
      const parts: any[] = [];
      
      if (msg.attachments) {
        msg.attachments.forEach(att => {
          if (att.type === 'image') {
            const base64Data = att.content.split(',')[1];
            parts.push({
              inlineData: {
                mimeType: att.mimeType || 'image/png',
                data: base64Data
              }
            });
          } else {
            parts.push({ text: `\n\n--- FILE: ${att.name} ---\n${att.content}\n--- END FILE ---` });
          }
        });
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // Handle empty content case
      if (parts.length === 0) {
        parts.push({ text: '.' });
      }

      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    const chat = ai.chats.create({ model: config.modelId, history: recentHistory });
    
    // Construct current message parts
    const currentParts: any[] = [];
    
    attachments.forEach(att => {
      if (att.type === 'image') {
        const base64Data = att.content.split(',')[1];
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType || 'image/png',
            data: base64Data
          }
        });
      } else {
        currentParts.push({ text: `\n\n--- FILE: ${att.name} ---\n${att.content}\n--- END FILE ---` });
      }
    });
    
    currentParts.push({ text: newMessage });

    const result = await chat.sendMessageStream({ message: currentParts });

    for await (const chunk of result) {
      if (chunk.text) yield { type: 'text', content: chunk.text };
    }
  } else {
    // OpenAI Compatible Streaming (Basic text support fallback, image support limited in this custom impl)
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          ...history.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: newMessage }
        ],
        stream: true
      })
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to read stream");

    const decoder = new TextDecoder();
    let buffer = '';

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
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield { type: 'text', content };
        } catch (e) {
          console.error("Error parsing stream line", e);
        }
      }
    }
  }
}