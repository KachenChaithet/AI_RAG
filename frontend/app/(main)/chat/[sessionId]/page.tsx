"use client"

import { Button } from "@/components/ui/button"
import { useMessage } from "@/hooks/useSession"
import { useParams, useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { useChat } from "@/hooks/useChat"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { useLogout } from "@/hooks/useAuth"
import { useQueryClient } from "@tanstack/react-query"

export default function Page() {
    const params = useParams()
    const router = useRouter()

    const sessionId = Number(params.sessionId)
    const [input, setInput] = useState("")
    const [streamingText, setStreamingText] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const queryClient = useQueryClient()
    const { data, isLoading, isError } = useMessage(sessionId)
    const { mutate, isPending } = useChat()
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [data])

    const handleSend = async () => {
        if (!input.trim()) return
        const text = input
        setInput("")
        setStreamingText("")
        mutate({
            text,
            session_id: sessionId,
            onChunk: (fullText) => setStreamingText(fullText)
        },{
            onSettled:() => setStreamingText("")
        })
    }


    if (isLoading) {
        return <div>Loading...</div>
    }

    if (isError) {
        return <div>Error</div>
    }



    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-177 mx-auto flex flex-col gap-4">
                    {data?.length === undefined ? (
                        <div className=""></div>
                    ) : (
                        <div className="">
                            {data?.map((message) => (
                                message.role === "user" ? (
                                    <div className="flex justify-end" key={message.id}>
                                        <span
                                            className="bg-muted p-3 rounded-[16px] inline-block"
                                        >
                                            {message.text}
                                        </span>
                                    </div>
                                ) : (
                                    <div key={message.id} className=" p-4 rounded-[16px]">
                                        <ReactMarkdown>
                                            {message.text}
                                        </ReactMarkdown>

                                    </div>
                                )
                            ))}
                            {(isStreaming || streamingText) && (
                                <div className="p-4 rounded-[16px]">
                                    <ReactMarkdown>
                                    {streamingText}
                                    </ReactMarkdown>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>
            </div>

            <div className="shrink-0 ">
                <div className="max-w-177 mx-auto bg-muted rounded-[16px] p-4">
                    <textarea
                        className="w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground text-base max-h-100 overflow-y-auto"
                        placeholder="Write a message..."
                        rows={1}
                        onInput={(e) => {
                            e.currentTarget.style.height = "auto"
                            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"
                        }}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}

                    />
                    <div className="flex justify-end">
                        <Button disabled={isPending} onClick={handleSend} >
                            <Send className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}