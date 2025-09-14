import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Send,
  Bot,
  User,
  Paperclip,
  FileText,
  Image,
  File,
  Copy,
  Download,
  Database,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  files?: FileAttachment[];
}

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatResponse {
  message: string;
  chat_history: ChatMessage[];
  error?: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your DB Assistant. I can help you analyze database performance logs. To get started, please upload your database logs using the JSON template format. Click the 'JSON Template' button above to see the required format and download a template file.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showJsonTemplate, setShowJsonTemplate] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backend API URL
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

  const jsonTemplate = {
    logs: [
      {
        id: 1,
        query: "SELECT * FROM users WHERE email LIKE '%gmail.com%';",
        duration_ms: 1200,
        rows: 10000,
        calls: 50,
      },
      {
        id: 2,
        query: "INSERT INTO orders (id, amount) VALUES (1, 500);",
        duration_ms: 15,
        rows: 1,
        calls: 200,
      },
      {
        id: 3,
        query: "SELECT id, name FROM products WHERE category_id = 5;",
        duration_ms: 130,
        rows: 300,
        calls: 80,
      },
    ],
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    };

    // Use a small delay to ensure content is rendered
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    // Filter for JSON files only
    const jsonFiles = files.filter((file) =>
      file.name.toLowerCase().endsWith(".json")
    );

    if (files.length > 0 && jsonFiles.length === 0) {
      alert("Please select only JSON files containing database logs.");
      return;
    }

    setSelectedFiles(jsonFiles);
    // Reset the input to allow selecting the same file again if needed
    if (event.target) {
      event.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (fileType.includes("text") || fileType.includes("document"))
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const copyJsonTemplate = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(jsonTemplate, null, 2)
      );
      toast("JSON template copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy JSON template:", err);
    }
  };

  const downloadJsonTemplate = () => {
    const blob = new Blob([JSON.stringify(jsonTemplate, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "database-logs-template.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyBotMessage = async (messageText: string) => {
    try {
      await navigator.clipboard.writeText(messageText);
      toast("Message copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;

    // Convert files to attachments for display
    const fileAttachments: FileAttachment[] = selectedFiles.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // For preview purposes
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      text:
        inputValue ||
        (selectedFiles.length > 0
          ? `Sent ${selectedFiles.length} file(s)`
          : ""),
      sender: "user",
      timestamp: new Date(),
      files: fileAttachments.length > 0 ? fileAttachments : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    const currentFiles = [...selectedFiles];
    setSelectedFiles([]);
    setIsLoading(true);

    try {
      // Prepare form data for API call
      const formData = new FormData();
      formData.append("message", currentInput);
      formData.append("chat_history", JSON.stringify(chatHistory));

      // Add file if present (only JSON files)
      if (currentFiles.length > 0) {
        const jsonFile = currentFiles.find((file) =>
          file.name.toLowerCase().endsWith(".json")
        );
        if (jsonFile) {
          formData.append("file", jsonFile);
        }
      }

      // Make API call
      const response = await axios.post<ChatResponse>(
        `${API_URL}/chat`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Create bot response message
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.message,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);

      // Update chat history
      setChatHistory(response.data.chat_history);
    } catch (error) {
      console.error("Error sending message:", error);

      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please make sure the backend server is running.`,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 p-4 border-b flex-shrink-0">
        <Avatar>
          <AvatarFallback>
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">DB Assistant</h1>
          <p className="text-sm text-gray-500">Online</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowJsonTemplate(!showJsonTemplate)}
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          JSON Template
        </Button>
      </div>

      {/* JSON Template Banner */}
      {showJsonTemplate && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Database Logs JSON Template
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJsonTemplate(false)}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-blue-800 mb-3">
            Please use this JSON format when uploading your database logs for
            analysis:
          </p>

          <div className="bg-white rounded border p-3 mb-3 overflow-x-auto">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(jsonTemplate, null, 2)}
            </pre>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyJsonTemplate}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadJsonTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <Card className="flex-1 mb-4 min-h-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "bot" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`relative group max-w-[70%] p-3 rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {/* Copy button for bot messages */}
                    {message.sender === "bot" && message.text && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyBotMessage(message.text)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800"
                        title="Copy message"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}

                    {message.text && (
                      <div className="text-sm prose prose-sm max-w-none">
                        {message.sender === "bot" ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Custom styling for markdown elements
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside mb-2">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside mb-2">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="mb-1">{children}</li>
                              ),
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-gray-100 text-gray-800 p-2 rounded text-xs font-mono overflow-x-auto whitespace-pre">
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }) => (
                                <div className="my-2">{children}</div>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">
                                  {children}
                                </blockquote>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-lg font-bold mb-2">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base font-bold mb-2">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-bold mb-1">
                                  {children}
                                </h3>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic">{children}</em>
                              ),
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                        ) : (
                          <p>{message.text}</p>
                        )}
                      </div>
                    )}

                    {/* File attachments */}
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.files.map((file) => (
                          <div
                            key={file.id}
                            className={`flex items-center gap-2 p-2 rounded border ${
                              message.sender === "user"
                                ? "bg-blue-500 border-blue-400"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {file.name}
                              </p>
                              <p className="text-xs opacity-70">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            {file.type.startsWith("image/") && (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.sender === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* File Preview Area */}
      {selectedFiles.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border flex-shrink-0 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Selected Files ({selectedFiles.length})
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 p-2 bg-white rounded border"
              >
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {file.type.startsWith("image/") && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept=".json,application/json"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={
            (!inputValue.trim() && selectedFiles.length === 0) || isLoading
          }
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
