import DocumentWorkspace from "../../components/DocumentWorkspace/DocumentWorkspace";
import "./Notes.css";

export default function Notes() {
  return (
    <section className="notes-page-workspace">
      <DocumentWorkspace
        workspaceType="notes"
        defaultFileType="md"
      />
    </section>
  );
}