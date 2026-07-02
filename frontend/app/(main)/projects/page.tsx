"use client"

import DropdownSettingProject from "@/app/components/DropdownSettingProject"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateProject, useProjects } from "@/hooks/useProject"
import { format } from "date-fns"
import { Check, ChevronDown, EllipsisVertical, Loader2, Pencil, Search, Trash } from "lucide-react"
import React, { useState } from "react"

const sortOptions = [
    { label: "Last updated", value: "updated" },
    { label: "Date created", value: "created" },
]

const page = () => {
    const { data } = useProjects()
    const [selected, setSelected] = useState("updated")
    const [createdOpen, setCreatedOpen] = useState(false)
    const [name, setName] = useState("")
    const { mutate, isPending } = useCreateProject()



    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        mutate(name, {
            onSuccess: () => {
                setCreatedOpen(false)
                setName("")
            }
        })

    }
    return (
        <div className=" h-full flex flex-col ">
            <div className="max-w-4xl mx-auto w-full mt-10 flex flex-col gap-4">
                <header className="flex items-center justify-between">
                    <p className="text-3xl font-extralight">Projects</p>
                    <div className="flex gap-2 items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild >
                                <Button variant={"ghost"} size={'sm'} className="focus-visible:ring-0 border-0">
                                    Sort by <span className="font-bold ml-1">{sortOptions.find(o => o.value === selected)?.label}</span>
                                    <ChevronDown className="size-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {sortOptions.map(option => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => setSelected(option.value)}
                                        className="flex items-center justify-between"
                                    >
                                        {option.label}
                                        {selected === option.value && <Check className="size-4 ml-4" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialog open={createdOpen} onOpenChange={setCreatedOpen}>
                            <AlertDialogTrigger asChild>
                                <Button>New Project</Button>

                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-2xl">Create a project</AlertDialogTitle>
                                </AlertDialogHeader>
                                <form onSubmit={handleSubmit}>
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel htmlFor="name">What are you working on?</FieldLabel>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Name your project"
                                                required
                                            />
                                        </Field>
                                        {/* <Field>
                                            <FieldLabel htmlFor="content">What are you working on?</FieldLabel>
                                            <Textarea
                                                id="content"
                                                placeholder="Describe your project, goals, subject, etc..."
                                                className="resize-none"
                                            />
                                        </Field> */}
                                        <Field orientation={'horizontal'} className="justify-end">
                                            <Button type="button" variant={"outline"} onClick={() => setCreatedOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={isPending}>Create project</Button>
                                        </Field>
                                    </FieldGroup>
                                </form>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                </header>
                <div className="rounded-md border flex items-center p-1 bg-muted">
                    <span className="px-2">
                        <Search className="size-4 text-neutral-400 shrink-0" />
                    </span>
                    <Input
                        className="border-none outline-0 bg-transparent! focus-visible:ring-0  placeholder:font-bold"
                        placeholder="Search chats..."
                    />

                </div>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 ">
                <div className="md:max-w-4xl  mx-auto grid grid-cols-2 gap-4">
                    {data?.map((item) => (
                        <Card className="p-2 group bg-muted hover:bg-neutral-50 has-data-[state=open]:bg-neutral-50" key={item.id}>
                            <CardHeader className="">
                                <CardTitle className="font-extralight">{item.name}</CardTitle>
                                <CardAction>
                                    <DropdownSettingProject name={item.name} projectId={item.id} />
                                </CardAction>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                Updated {format(new Date(item.created_at + "Z"), "MMM d")}
                            </CardContent>
                        </Card>
                    ))}

                </div>
            </div>
        </div>
    )
}
export default page