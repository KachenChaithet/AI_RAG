"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDocuments, useDocumentSearch } from "@/hooks/useDocument"
import { BotMessageSquare, File, FileText, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

interface Message {
    role: "user" | "assistant"
    text: string
    sources?: string[]
}

const DocumentChat = () => {
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [streamingText, setStreamingText] = useState("")
    const [sources, setSources] = useState<string[]>([])
    const { mutate, isPending } = useDocumentSearch()
    const bottomRef = useRef<HTMLDivElement>(null)

    console.log("streamingText:", streamingText);
    console.log("message:", messages);


    const handleSend = () => {
        if (!input.trim()) return
        const text = input
        setInput("")
        setStreamingText("")

        let localSources: string[] = []  // ← เก็บใน local variable แทน

        setMessages(prev => [...prev, { role: "user", text }])

        mutate({
            text,
            onChunk: (fullText) => setStreamingText(fullText),
            onSources: (s) => {
                localSources = s  // ← update local variable
                setSources(s)     // ← update state สำหรับแสดง UI ระหว่าง stream
            }
        }, {
            onSuccess: (fullText) => {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    text: fullText,
                    sources: localSources  // ← ใช้ local variable แทน sources state
                }])
                setStreamingText("")
                setSources([])
            }
        })
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, streamingText])

    return (
        <div className="border-l flex-1 flex flex-col  ">
            <div className="min-h-18  flex justify-between  px-4 border-b ">
                <div className="">
                    <p className="text-xl">AI Assistant</p>
                    <p className="text-sm text-muted-foreground ">Ask questions about your documents</p>
                </div>
                <Button className="mt-2" onClick={() => setMessages([])}>New Chat</Button>
            </div>
            <div className=" flex-1 p-4 border-b overflow-y-auto ">
                {messages.length === 0 ? (
                    <div className="flex flex-col h-full items-center justify-center">
                        <BotMessageSquare className="size-18 text-muted-foreground" />
                        <div className="text-center">
                            <h1 className="text-xl">New Chat</h1>
                            <p className="text-muted-foreground text-sm">send message to start chat with AI</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={msg.role === "user" ? "flex justify-start " : "flex flex-col gap-1"}>
                                {msg.role === "user" ? (
                                    <div className="flex gap-2">
                                        <Avatar  >
                                            <AvatarImage src="https://github.com/shadcn.png" />
                                            <AvatarFallback>CN</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col gap-2">
                                            <div className="text-xs flex gap-2 ">
                                                <p className="font-semibold">You</p>
                                                <p className="text-muted-foreground">10:40 AM</p>
                                            </div>
                                            <span className="p-2 border bg-neutral-100 rounded-2xl rounded-tl-md">{msg.text}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-2">
                                            <Avatar  >
                                                <AvatarImage src="" />
                                                <AvatarFallback>AI</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col gap-2">
                                                <div className="text-xs flex gap-2 ">
                                                    <p className="font-semibold">AI Assistant</p>
                                                    <p className="text-muted-foreground">10:40 AM</p>
                                                </div>
                                                <span className="p-2 border bg-neutral-100 rounded-2xl rounded-tl-md flex flex-col gap-2">
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                    {msg.sources && msg.sources.length > 0 && (
                                                        <div className="flex flex-col gap-2 mt-1">
                                                            <span className="text-xs text-neutral-600">Sources:</span>
                                                            <div className="flex flex-col gap-2">
                                                                {msg.sources.map((src, j) => (
                                                                    <Card key={j} className="p-2 flex-row items-center select-none ">
                                                                        <FileText className="size-4 text-blue-500 shrink-0" />
                                                                        <p>  {src}</p>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Streaming */}
                {(isPending || streamingText) && (
                    <div className="flex gap-2">
                        <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2">
                            <div className="text-xs flex gap-2">
                                <p className="font-semibold">AI Assistant</p>
                            </div>
                            <span className="p-2 border bg-neutral-100 rounded-2xl rounded-tl-md">
                                <ReactMarkdown>{streamingText || "..."}</ReactMarkdown>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
            <div className="shrink-0 p-4">
                <div className="border rounded-xl p-2 flex flex-col gap-2">
                    <Textarea
                        placeholder="Ask anything about your documents"
                        className="resize-none border-none outline-0 focus-visible:ring-0 max-h-24"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-400">Press Enter to send</span>
                        <Button size="icon" disabled={isPending} onClick={handleSend}>
                            <Send className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>

        </div>

    )
}
export default DocumentChat