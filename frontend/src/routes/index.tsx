import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Send, DownloadCloud, Plus, Menu, Search } from "lucide-react"
import React from 'react'
import {createRoot} from 'react-dom/client'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'

export const Route = createFileRoute('/')({
  component: ChatGPT,
})

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type Chat = {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

function ChatGPT() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: '新对话',
      messages: [],
      timestamp: new Date()
    }
  ]);

  const [activeChat, setActiveChat] = useState<string>('1');
  const [inputValue, setInputValue] = useState<string>('');
  const [model, setModel] = useState<string>('ChatGPT 4o');
  const [filterValue, setFilterValue] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const activeMessages = chats.find(chat => chat.id === activeChat)?.messages || [];
  
  const filteredChats = useMemo(() => {
    if (!filterValue.trim()) return chats;
    return chats.filter(chat => 
      chat.title.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [chats, filterValue]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    // Update current chat with new message
    const updatedChats = chats.map(chat => {
      if (chat.id === activeChat) {
        // If this is the first message, update the chat title
        const updatedTitle = chat.messages.length === 0 ? 
          inputValue.substring(0, 20) + (inputValue.length > 20 ? '...' : '') : 
          chat.title;
        
        return {
          ...chat,
          title: updatedTitle,
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    });
    
    setChats(updatedChats);
    setInputValue('');
    
    // Simulate GPT response
    setTimeout(() => {
      const gptResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `这是模拟的${model}回复：您发送了 "${inputValue}"`,
        timestamp: new Date()
      };
      
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: [...chat.messages, gptResponse]
          };
        }
        return chat;
      }));
    }, 1000);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      timestamp: new Date()
    };
    
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
  };

  const exportChat = () => {
    const chat = chats.find(c => c.id === activeChat);
    if (!chat) return;
    
    const chatContent = chat.messages.map(msg => 
      `${msg.role === 'user' ? '用户' : 'GPT'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
    console.log("Toggling sidebar:", !sidebarOpen); // Debug log
  };

  return (
    <div className="flex h-full w-full relative">
      {/* Fixed Header - Always visible */}
      <div className="fixed top-0 left-0 z-30 flex items-center h-12 bg-background border-b w-full px-3">
        <Button variant="ghost" size="icon" className="mr-2" onClick={toggleSidebar}>
          <Menu size={18} />
        </Button>
        
        {/* Smooth transition for these buttons when sidebar collapses */}
        <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? 'ml-[10.5rem]' : 'ml-0'}`}>
          <Button variant="ghost" size="icon" onClick={createNewChat} className="mr-2">
            <Plus size={18} />
          </Button>
          
          <Select
            value={model}
            onValueChange={setModel}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ChatGPT 4o">ChatGPT 4o</SelectItem>
              <SelectItem value="Qwen QwQ-32B">Qwen QwQ-32B</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="ml-auto">
          <Button variant="outline" size="icon" onClick={exportChat}>
            <DownloadCloud size={18} />
          </Button>
        </div>
      </div>

      {/* Left Sidebar - Position absolute */}
      <div 
        className={`fixed left-0 top-12 bottom-0 z-20 transition-all duration-300 border-r bg-background ${
          sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Search Input */}
        <div className="sticky top-0 z-20 bg-background w-full border-b p-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder="搜索对话..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        
        {/* Chat List */}
        <div className="p-2 overflow-y-auto h-[calc(100%-56px)]">
          {filteredChats.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              没有找到匹配的对话
            </div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.id}
                className={`mb-1 cursor-pointer rounded-lg p-2 text-sm text-ellipsis text-nowrap ${
                  chat.id === activeChat ? 'bg-muted' : 'hover:bg-muted/50'
                }`}
                onClick={() => setActiveChat(chat.id)}
              >
                {chat.title}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area - Full width with padding */}
      <div className={`w-full pt-12 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'pl-[260px]' : 'pl-0'
      }`}>
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeMessages.map(message => (
            <div key={message.id} className="mb-4">
              {message.role === 'user' ? (
                <div className="ml-auto max-w-[80%]">
                  <div className="rounded-lg bg-muted p-3 markdown-content">
                    <div className="prose prose-headings:mt-2 prose-headings:mb-2 prose-headings:font-bold prose-p:my-1 max-w-none">
                      <Markdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code(props) {
                            const {children, className, node, ...rest} = props
                            const match = /language-(\w+)/.exec(className || '')
                            return match ? (
                              <SyntaxHighlighter
                                {...rest}
                                PreTag="div"
                                children={String(children).replace(/\n$/, '')}
                                language={match[1]}
                                style={vscDarkPlus}
                                customStyle={{ margin: 0 }}
                              />
                            ) : (
                              <code {...rest} className={className}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {message.content}
                      </Markdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mr-auto max-w-[80%]">
                  <div className="rounded-lg p-3 markdown-content">
                    <div className="prose prose-headings:mt-2 prose-headings:mb-2 prose-headings:font-bold prose-p:my-1 max-w-none">
                      <Markdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code(props) {
                            const {children, className, node, ...rest} = props
                            const match = /language-(\w+)/.exec(className || '')
                            return match ? (
                              <SyntaxHighlighter
                                {...rest}
                                PreTag="div"
                                children={String(children).replace(/\n$/, '')}
                                language={match[1]}
                                style={dracula}
                                customStyle={{ margin: 0 }}
                              />
                            ) : (
                              <code {...rest} className={className}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {message.content}
                      </Markdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入消息..."
              className="pr-10 rounded-lg bg-muted resize-none min-h-[60px] max-h-[200px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-2 bottom-2" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}