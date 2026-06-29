import DocumentChat from "@/app/components/documents/DocumentChat"
import DocumentState from "@/app/components/documents/DocumentState"

const page = () => {

    return (
        <div className=" h-full flex gap-4 flex-col md:flex-row">
            <DocumentState />
            <DocumentChat />
        </div>
    )
}
export default page