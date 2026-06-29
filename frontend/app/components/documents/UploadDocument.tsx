"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUploadDocumentsFiles, useUploadDocumentsText } from "@/hooks/useDocument"
import { CloudUpload, File, FolderUp, X } from "lucide-react"
import { useRef, useState } from "react"

const UploadDocument = () => {
    const [exportFormat, setExportFormat] = useState<"txt" | "docx">("docx")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [textFilename, setTextFilename] = useState("")
    const [text, setText] = useState("")
    const [files, setFiles] = useState<File[]>([])
    const { mutate: uploadFiles, isPending: isUploadFiles } = useUploadDocumentsFiles()
    const { mutate: uploadText, isPending: isUploadText } = useUploadDocumentsText()


    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i != index))
    }

    const handleUpload = () => {
        if (exportFormat === 'docx') {
            if (files.length === 0) return

            uploadFiles(files)
            setFiles([])
        } else if (exportFormat === 'txt') {
            if (text.trim() === '' || textFilename.trim() === "") return
            uploadText({ text, filename: textFilename })
            setTextFilename("")
            setText("")
        }
    }

    return (
        <Card className="p-2 flex flex-col gap-2">
            <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            <div className="">
                <p className=" text-lg">Create RAG (Upload Document)</p>
                <p className="text-xs text-muted-foreground ">Upload your document to create a knowledge base for RAG</p>
            </div>
            {exportFormat === "docx" && (
                <Card className="p-4 flex flex-col items-center justify-center gap-2  border-dashed border">
                    <CloudUpload className="size-6 text-blue-500" />
                    <div className="text-center">
                        <p className="text-sm">Drag and drop your file here</p>
                        <p className="text-xs text-muted-foreground">or</p>
                    </div>
                    <Button variant={'outline'} size="sm" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
                    <div className="text-center mt-2">
                        <p className="text-xs text-muted-foreground">Supports: docx, txt</p>
                        <p className="text-xs text-muted-foreground">Maximum file size: 20MB</p>
                    </div>
                </Card>
            )}
            {files.length > 0 && (
                <Card className="p-2 flex flex-col max-h-40 overflow-y-auto">
                    {files.map((item, i) => (
                        <Card className="shrink-0 p-2 flex flex-row gap-2 items-center justify-between " key={i}>
                            <div className="flex gap-2 items-center ">
                                <File className="size-4 text-blue-500" />
                                <p>{item.name}</p>
                            </div>
                            <div className="flex items-center ">
                                <p>{(item.size / 1024).toFixed(1)} KB</p>
                                <Button variant={'ghost'} onClick={() => removeFile(i)} >
                                    <X className="size-4" />
                                </Button>
                            </div>

                        </Card>
                    ))}

                </Card>
            )}
            <div className="flex flex-col gap-2">
                <p className="text-sm">Document Type</p>
                <RadioGroup
                    className="flex gap-4"
                    value={exportFormat}
                    onValueChange={(val) => {
                        setExportFormat(val as "txt" | "docx")
                        setFiles([])
                        setText("")
                    }}
                >
                    <div className="flex items-center gap-3">
                        <RadioGroupItem value="txt" id="r1" />
                        <Label htmlFor="r1">Text (.txt)</Label>
                    </div>
                    <div className="flex items-center gap-1">
                        <RadioGroupItem value="docx" id="r2" />
                        <Label htmlFor="r2">Word (.docx)</Label>
                    </div>
                </RadioGroup>
            </div>

            {exportFormat === 'txt' && (
                <div className="flex flex-col gap-2">
                    <div className="">
                        <p className="text-sm">Document Content</p>
                        <p className="text-xs text-muted-foreground">Paste or type your text content below</p>
                    </div>
                    <Input
                        placeholder="Place your filename"
                        value={textFilename}
                        onChange={(e) => setTextFilename(e.target.value)}
                        required
                    />
                    <Textarea
                        className="resize-none max-h-20 "
                        placeholder="Place yoru RAG..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        required
                    />
                </div>
            )}
            <div className="flex flex-col gap-2">
                <p className="text-sm">Collection (optional)</p>
                <Select required>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Collection" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="hr">Hr</SelectItem>
                            <SelectItem value="call-center">call center</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleUpload} disabled={isUploadFiles}>
                {exportFormat === 'txt' ? "Create RAG from Text" : "Create RAG from File"}
            </Button>
        </Card>
    )
}
export default UploadDocument