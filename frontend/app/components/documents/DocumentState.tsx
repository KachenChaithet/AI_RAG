"use client"
import { useDocuments, useDocumentStatus, useVectorStoreHealth } from "@/hooks/useDocument"
import CardDocument from "./CardDocument"
import Navbar from "./Navbar"
import TableDocument from "./TableDocument"
import { CircleCheck, Database, Layers } from "lucide-react"
import UploadDocument from "./UploadDocument"
import { useState } from "react"
import PaginationControl from "./PaginationControl"
import { useDebounce } from "@/hooks/useDebounce"

const DocumentState = () => {
    const { data: status } = useDocumentStatus()
    const { data: vector } = useVectorStoreHealth()
    const [showUpload, setShowUpload] = useState(false)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [typeFilter, setTypeFilter] = useState("")
    const debouncedSearch = useDebounce(search, 300)
    const { data } = useDocuments(debouncedSearch, "", page, typeFilter)



    return (
        <div className=" flex-2 space-y-4 overflow-hidden">
            <Navbar
                onUploadClick={() => setShowUpload(!showUpload)}
                search={search}
                onSearchChange={(val) => {
                    setSearch(val)
                    setPage(1)
                }}
                page={page}
                total={data?.total ?? 0}
                onPageChange={setPage}
                typeFilter={typeFilter}
                onTypeFilter={(val) => { setTypeFilter(val); setPage(1) }}
            />
            <div className="flex flex-col md:flex-row gap-2 p-1 justify-between    ">
                <CardDocument title="Documents" total={status?.total_documents ?? 0} iconClassName="text-blue-500" />
                <CardDocument title="Chunks" total={status?.total_chunks ?? 0} icon={Layers} iconClassName="text-green-500" />
                <CardDocument title="Vector Store" total={vector?.pgvector_version ?? ""} icon={Database} iconClassName="text-purple-500" />
                <CardDocument title="Status" total={vector?.status ?? ""} icon={CircleCheck} iconClassName="text-green-500" />
            </div>
            {showUpload && (
                <UploadDocument />

            )}
            <div className="flex flex-col gap-2">
                <div className="min-h-130 ">
                    <TableDocument
                        data={data?.data ?? []}
                    />
                </div>
                <PaginationControl
                    limit={data?.limit ?? 10}
                    onPageChange={setPage}
                    page={page}
                    total={data?.total ?? 0}
                />
            </div>

        </div >

    )
}
export default DocumentState