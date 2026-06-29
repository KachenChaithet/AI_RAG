import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Pen } from "lucide-react"
import { useUpdateSession } from "@/hooks/useSession"

interface RenameDialogProps {
    sessionId: number
    topic: string
}

const RenameDialog = ({ sessionId, topic }: RenameDialogProps) => {
    const [newTopic, setNewTopic] = useState(topic)
    const [open, setOpen] = useState(false)
    const { mutate, isPending, isError } = useUpdateSession()

    const handleRename = () => {
        if (!newTopic.trim()) return
        if (newTopic === topic) {
            setOpen(false)
            return
        }
        mutate({ sessionId: sessionId, topic: newTopic }, {
            onSuccess: () => {
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen} >
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}>
                    <Pen className="size-4" />
                    <span>Rename</span>
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Session</DialogTitle>
                </DialogHeader>
                <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="name session..."
                />
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleRename}
                        disabled={isPending}
                    >
                        Update
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default RenameDialog