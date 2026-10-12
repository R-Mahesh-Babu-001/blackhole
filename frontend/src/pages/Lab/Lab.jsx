import DocumentWorkspace from "../../components/DocumentWorkspace/DocumentWorkspace";
import "./Lab.css";

export default function Lab() {
  return (
    <section className="lab-page-workspace">
      <DocumentWorkspace
        workspaceType="lab"
        defaultFileType="ipynb"
      />
    </section>
  );
}