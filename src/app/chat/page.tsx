"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, Bot, User, Settings2, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { AVAILABLE_MODELS } from "@/lib/openrouter";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const {
    conversations,
    activeConversationId,
    addConversation,
    addMessage,
    setActiveConversation,
    addTask,
    addProject,
    tasks,
    projects,
  } = useStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = addConversation();
    }

    const userMessage = input.trim();
    setInput("");
    addMessage(convId, { role: "user", content: userMessage });
    setLoading(true);

    // Build context
    const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
    const taskContext = openTasks.length > 0
      ? `\n\nCurrent open tasks:\n${openTasks.map((t) => `- ${t.title}${t.due_date ? ` (due: ${t.due_date})` : ""}${t.priority !== "medium" ? ` [${t.priority}]` : ""}${t.project ? ` [project: ${t.project}]` : ""}`).join("\n")}`
      : "\n\nNo open tasks currently.";

    const projectContext = projects.length > 0
      ? `\n\nExisting projects:\n${projects.filter((p) => p.status === "active").map((p) => `- ${p.name}${p.description ? `: ${p.description}` : ""}`).join("\n")}`
      : "\n\nNo projects created yet.";

    const systemPrompt = `You are a helpful productivity assistant built into a personal dashboard app. Help the user manage tasks, projects, plan their day, track habits, and stay organized. Be concise and actionable.

TASK CREATION:
When the user asks you to create/add a task, respond with a JSON block:
\`\`\`task
{"title": "task title", "due_date": "YYYY-MM-DD", "priority": "low|medium|high|urgent", "project": "project name or empty string"}
\`\`\`

PROJECT CREATION:
When the user asks you to create a project, or when you receive a list of tasks/data that logically belong together, create a project first:
\`\`\`project
{"name": "Project Name", "description": "Brief description", "color": "#hex"}
\`\`\`
Available colors: #3b82f6 (blue), #8b5cf6 (purple), #ec4899 (pink), #f59e0b (amber), #10b981 (green), #06b6d4 (cyan), #f97316 (orange), #ef4444 (red), #6366f1 (indigo), #14b8a6 (teal)

SMART GROUPING:
If the user provides multiple tasks, a file, a list, or data that seems related to one topic/goal, you SHOULD:
1. Create a project for them first using \`\`\`project block
2. Then create all tasks with the project field set to that project name
3. Only do this if the tasks clearly relate to each other. If tasks are unrelated, don't force them into a project.

IMPORTANT:
- You can include multiple task blocks and project blocks in one response.
- Always put \`\`\`project blocks BEFORE \`\`\`task blocks that reference them.
- If a suitable existing project already exists, assign tasks to it instead of creating a new one.
- Always include a brief friendly text response alongside the blocks.

Today's date is ${new Date().toISOString().split("T")[0]}.${projectContext}${taskContext}`;

    try {
      const previousMessages = activeConversation?.messages || [];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...previousMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
          model: selectedModel,
        }),
      });

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || "Sorry, I could not generate a response. Try a different model.";

      // Parse project blocks first
      const projectRegex = /```project\s*\n?([\s\S]*?)```/g;
      let match;
      const createdProjects: string[] = [];
      while ((match = projectRegex.exec(assistantContent)) !== null) {
        try {
          const projectData = JSON.parse(match[1]);
          // Check if project already exists
          const exists = projects.some((p) => p.name.toLowerCase() === projectData.name.toLowerCase());
          if (!exists) {
            addProject({
              name: projectData.name,
              description: projectData.description || "",
              color: projectData.color || "#3b82f6",
              status: "active",
            });
            createdProjects.push(projectData.name);
          }
        } catch {
          // Skip invalid JSON
        }
      }

      // Parse task blocks
      const taskRegex = /```task\s*\n?([\s\S]*?)```/g;
      const createdTasks: string[] = [];
      while ((match = taskRegex.exec(assistantContent)) !== null) {
        try {
          const taskData = JSON.parse(match[1]);
          addTask({
            title: taskData.title,
            status: "todo",
            priority: taskData.priority || "medium",
            due_date: taskData.due_date,
            project: taskData.project || undefined,
            tags: ["ai-created"],
            auto_reschedule: true,
            source: "manual",
          });
          createdTasks.push(taskData.title);
        } catch {
          // Skip invalid JSON
        }
      }

      // Clean blocks from displayed message and append confirmation
      let displayContent = assistantContent
        .replace(/```project\s*\n?[\s\S]*?```\n?/g, "")
        .replace(/```task\s*\n?[\s\S]*?```\n?/g, "")
        .trim();

      if (createdProjects.length > 0) {
        displayContent += `\n\n\ud83d\udcc1 Created project${createdProjects.length > 1 ? "s" : ""}:\n${createdProjects.map((p) => `\u2022 ${p}`).join("\n")}`;
      }
      if (createdTasks.length > 0) {
        displayContent += `\n\n\u2705 Created ${createdTasks.length} task${createdTasks.length > 1 ? "s" : ""}:\n${createdTasks.map((t) => `\u2022 ${t}`).join("\n")}`;
      }

      addMessage(convId!, { role: "assistant", content: displayContent, model: selectedModel });
    } catch (error) {
      addMessage(convId!, {
        role: "assistant",
        content: "Error: Failed to get response. Check your API key in .env.local and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-4">
      {/* Conversation Sidebar - hidden on mobile, shown as horizontal scroll */}
      <div className="md:w-64 shrink-0 glass-card flex flex-col max-md:flex-row max-md:overflow-x-auto max-md:max-h-14">
        <div className="p-2 md:p-3 md:border-b border-zinc-800 shrink-0">
          <button
            onClick={() => addConversation()}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap md:w-full"
          >
            <Plus size={14} />
            New Chat
          </button>
        </div>
        <div className="flex md:flex-col flex-1 overflow-x-auto md:overflow-y-auto p-1 md:p-2 gap-1 md:space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={cn(
                "text-left px-3 py-2 rounded-lg text-xs md:text-sm truncate transition-colors whitespace-nowrap shrink-0 md:w-full",
                conv.id === activeConversationId
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              {conv.messages[0]?.content?.substring(0, 25) || conv.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-card flex flex-col min-h-0">
        {/* Model Selector */}
        <div className="p-2 md:p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-blue-400" />
            <span className="text-xs md:text-sm font-medium">AI Chat</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              <Settings2 size={12} />
              {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || "Select Model"}
            </button>
            {showModelPicker && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors flex items-center justify-between",
                      model.id === selectedModel && "text-blue-400"
                    )}
                  >
                    <span>{model.name}</span>
                    {model.free && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">FREE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center px-4">
                <Bot size={40} className="text-zinc-700 mx-auto mb-3 md:w-12 md:h-12" />
                <p className="text-zinc-500 text-sm">Start a conversation</p>
                <p className="text-zinc-600 text-xs mt-2">Try: &quot;Add a task to call the dentist tomorrow&quot;</p>
                <p className="text-zinc-600 text-xs">or: &quot;Create a project with tasks&quot;</p>
              </div>
            </div>
          ) : (
            activeConversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={14} className="text-blue-400" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[70%] rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm",
                    msg.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-200"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.model && (
                    <p className="text-[10px] text-zinc-500 mt-1">{msg.model.split("/").pop()}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-1">
                    <User size={14} className="text-zinc-300" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                <Loader2 size={14} className="text-blue-400 animate-spin" />
              </div>
              <div className="bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-400">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 md:p-3 border-t border-zinc-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask anything or create tasks..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 md:px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
