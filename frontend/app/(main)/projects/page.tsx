"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EllipsisVertical, Loader2, Pencil, Search, Trash } from "lucide-react"
import { useState } from "react"

const page = () => {
    const [open, setOpen] = useState(false)
    const [createdOpen, setCreatedOpen] = useState(false)
    return (
        <div className=" h-full flex flex-col ">
            <div className="max-w-4xl mx-auto w-full mt-10 flex flex-col gap-4">
                <header className="flex items-center justify-between">
                    <p className="text-3xl font-extralight">Projects</p>
                    <div className="flex gap-2 items-center">
                        <Button
                        >Select chats</Button>
                        <AlertDialog open={createdOpen} onOpenChange={setCreatedOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant={'outline'} >New Project</Button>

                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-2xl">Create a project</AlertDialogTitle>
                                </AlertDialogHeader>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="name">What are you working on?</FieldLabel>
                                        <Input
                                            id="name"
                                            placeholder="Name your project"
                                            required
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="content">What are you working on?</FieldLabel>
                                        <Textarea
                                            id="content"
                                            placeholder="Describe your project, goals, subject, etc..."
                                            className="resize-none"
                                            required
                                        />
                                    </Field>
                                    <Field orientation={'horizontal'} className="justify-end">
                                        <Button variant={"outline"} onClick={() => setCreatedOpen(false)}>Cancel</Button>
                                        <Button>Create project</Button>
                                    </Field>
                                </FieldGroup>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                </header>
                <div className="rounded-md border flex items-center p-1 bg-neutral-200">
                    <span className="px-2">
                        <Search className="size-4 text-neutral-400 shrink-0" />
                    </span>
                    <Input
                        className="border-none outline-0 focus-visible:ring-0 bg-transparent placeholder:font-bold"
                        placeholder="Search chats..."
                    />

                </div>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 ">
                <div className="md:max-w-4xl  mx-auto grid grid-cols-2 gap-4">
                    <Card className="p-2 group bg-muted">
                        <CardHeader className="">
                            <CardTitle className="font-extralight">newProject</CardTitle>
                            <CardAction className={`transition-opacity ${open ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                <DropdownMenu open={open} onOpenChange={setOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                                            <EllipsisVertical className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Pencil className="size-4" />
                                            Rename
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onSelect={(e) => e.preventDefault()}
                                                >
                                                    <Trash className="size-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>ลบ Project</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        ต้องการลบ Project นี้หรือไม่?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                    <AlertDialogAction>ลบ</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardAction>
                        </CardHeader>
                        <CardContent className="text-muted-foreground">
                            Updated Apr 15
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
export default page