# UI ที่แสดงการใช้ Tool ในระบบ

## 1. การทำงานของ Tool Usage

จากโค้ดใน `services/geminiService.ts` (บรรทัด 136-165):

```typescript
// เมื่อได้รับ content_blocks จาก LangFlow API
if (json.event === 'add_message' && json.data?.content_blocks) {
  const contentBlocks = json.data.content_blocks;
  
  for (const block of contentBlocks) {
    // ตรวจสอบว่าเป็น tool_use block หรือไม่
    if (block.type === 'tool_use') {
      const toolName = block.name || 'Unknown Tool';
      const toolInput = block.input ? JSON.stringify(block.input, null, 2) : '';
      const toolOutput = block.output || '';
      const duration = block.duration || '';
      
      // สร้าง ProcessStep สำหรับแสดง tool usage
      steps.push({
        id: block.id || crypto.randomUUID(),
        type: 'command',  // ใช้ type 'command' เพื่อแสดงเป็น terminal
        content: `Executed **${toolName}**${toolInput ? `\n\nInput:\n\`\`\`json\n${toolInput}\n\`\`\`` : ''}${toolOutput ? `\n\nOutput:\n${toolOutput}` : ''}`,
        duration: duration,
        status: 'completed',
        isExpanded: false
      });
    }
  }
}
```

## 2. UI Component ที่แสดง Tool Usage

### ProcessStep Component (`components/ProcessStep.tsx`)

Component นี้รับผิดชอบแสดง tool usage ในรูปแบบ terminal:

**คุณสมบัติของ UI:**

1. **Header Bar** (สีเทาเข้ม):
   - ไอคอน Terminal (สีเขียว) 🖥️
   - ชื่อ "Command" หรือ "Executed Tool"
   - Duration (เวลาที่ใช้)
   - Status icon (✓ เมื่อเสร็จสิ้น)

2. **Terminal Window** (พื้นหลังสีดำ):
   - Traffic lights (จุดสีแดง, เหลือง, เขียว) ด้านบนซ้าย
   - ข้อความ "terminal" ด้านบนขวา
   - เนื้อหาแสดงเป็น:
     ```
     ➜ ~ Executed **ToolName**
     
     Input:
     ```json
     {
       "parameter": "value"
     }
     ```
     
     Output:
     Result from tool execution
     ```

3. **การขยาย/ย่อ**:
   - คลิกที่ header เพื่อขยาย/ย่อเนื้อหา
   - เมื่อย่อจะแสดงเฉพาะ preview snippet
   - เมื่อขยายจะแสดงเนื้อหาทั้งหมด

## 3. ตัวอย่างการแสดงผล

### ตัวอย่าง 1: Tool ที่มี Input และ Output

```
┌─────────────────────────────────────────────────┐
│ 🖥️ Command                          0.8s    ✓  │
├─────────────────────────────────────────────────┤
│ ● ● ●                              terminal     │
├─────────────────────────────────────────────────┤
│ ➜ ~ Executed **search_database**               │
│                                                 │
│ Input:                                          │
│ ```json                                         │
│ {                                               │
│   "query": "SELECT * FROM users",               │
│   "limit": 10                                   │
│ }                                               │
│ ```                                             │
│                                                 │
│ Output:                                         │
│ Found 10 users                                  │
│                                                 │
│ ✓ Done in 0.8s                                  │
└─────────────────────────────────────────────────┘
```

### ตัวอย่าง 2: Tool ที่ไม่มี Input

```
┌─────────────────────────────────────────────────┐
│ 🖥️ Command                          0.3s    ✓  │
├─────────────────────────────────────────────────┤
│ ● ● ●                              terminal     │
├─────────────────────────────────────────────────┤
│ ➜ ~ Executed **get_current_time**              │
│                                                 │
│ Output:                                         │
│ 2024-01-23 14:30:00                            │
│                                                 │
│ ✓ Done in 0.3s                                  │
└─────────────────────────────────────────────────┘
```

## 4. การแสดงผลใน ChatInterface

ใน `components/ChatInterface.tsx` (บรรทัด 1046-1048):

```typescript
{isAssistant && msg.steps && (
  <div className="w-full mb-4 space-y-1">
    {msg.steps.map(step => <ProcessStep key={step.id} step={step} />)}
  </div>
)}
```

**ตำแหน่งการแสดง:**
- แสดงก่อนข้อความตอบกลับของ AI
- แสดงเป็นรายการ (ถ้ามีหลาย tools)
- แต่ละ tool แสดงเป็น ProcessStep แยกกัน

## 5. สไตล์และธีม

### Light Mode:
- พื้นหลัง: สีขาว/เทาอ่อน
- ข้อความ: สีเทาเข้ม
- Terminal: พื้นดำ, ข้อความสีเขียว/ฟ้า

### Dark Mode:
- พื้นหลัง: สีดำ/เทาเข้ม
- ข้อความ: สีเทาอ่อน
- Terminal: พื้นดำเข้ม, ข้อความสีเขียว/ฟ้าสว่าง

## 6. Animation และ Interaction

- **Hover Effect**: เมื่อเอาเมาส์ชี้จะเปลี่ยนสี border
- **Click to Expand**: คลิกที่ไหนก็ได้ใน header เพื่อขยาย/ย่อ
- **Smooth Animation**: ใช้ `animate-in fade-in slide-in-from-top-1` เมื่อขยาย
- **Traffic Lights Animation**: จุดสีจะสว่างขึ้นเมื่อ hover

## 7. การปรับแต่ง UI

หากต้องการปรับแต่ง UI สำหรับ tool usage สามารถแก้ไขได้ที่:

1. **เปลี่ยนสีหรือไอคอน**: แก้ใน `ProcessStep.tsx` ฟังก์ชัน `getIcon()`
2. **เปลี่ยนรูปแบบการแสดงผล**: แก้ใน `ProcessStep.tsx` ส่วน `step.type === 'command'`
3. **เปลี่ยนข้อความ**: แก้ใน `geminiService.ts` ส่วนที่สร้าง `content`
4. **เพิ่ม metadata**: เพิ่มฟิลด์ใน `types.ts` interface `ProcessStep`

## 8. ตัวอย่างการใช้งานจริง

เมื่อ LangFlow agent ใช้ tool เช่น:
- **Search Tool**: แสดง query และผลลัพธ์
- **Calculator Tool**: แสดง expression และคำตอบ
- **API Call Tool**: แสดง endpoint, parameters และ response
- **Database Tool**: แสดง SQL query และ result set

ทั้งหมดจะแสดงในรูปแบบ terminal-style UI ที่สวยงามและอ่านง่าย
