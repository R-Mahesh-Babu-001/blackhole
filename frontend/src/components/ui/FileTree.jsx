import { createContext, useContext } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./Collapsible";
import { Button } from "./Item";
import "./FileTree.css";

const FileTreeContext = createContext({
  selectedPath: null,
  onSelect: () => {},
});

/**
 * FileTree root component
 * Conforms to shadcn AI Elements File Tree specification
 */
export function FileTree({
  selectedPath,
  onSelect = () => {},
  className = "",
  children,
  ...props
}) {
  return (
    <FileTreeContext.Provider value={{ selectedPath, onSelect }}>
      <div className={`ui-file-tree ${className}`} role="tree" {...props}>
        {children}
      </div>
    </FileTreeContext.Provider>
  );
}

/**
 * FileTreeFolder renders a Collapsible with a ghost Button trigger
 */
export function FileTreeFolder({
  name,
  path = "",
  defaultOpen = true,
  className = "",
  children,
  ...props
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      data-path={path}
      className={`file-tree-folder ${className}`}
      {...props}
    >
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start file-tree-folder-btn"
          />
        }
      >
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="file-tree-chevron transition-transform"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="file-tree-folder-icon"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <FileTreeName>{name}</FileTreeName>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="file-tree-children ml-4 flex flex-col">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * FileTreeFile renders a Button with variant="ghost" and size="sm" that calls onSelect with its path.
 * If a file has FileTreeActions, renders them next to the Button, not inside it.
 */
export function FileTreeFile({
  name,
  path = "",
  icon,
  selected = false,
  actions,
  onSelect: customSelect,
  className = "",
  ...props
}) {
  const { selectedPath, onSelect: ctxSelect } = useContext(FileTreeContext);
  const isSelected = selected || (selectedPath && selectedPath === path);

  const handleClick = () => {
    if (customSelect) {
      customSelect(path);
    } else {
      ctxSelect(path);
    }
  };

  return (
    <div className={`file-tree-file-row ${className}`} role="treeitem" aria-selected={isSelected}>
      <Button
        variant="ghost"
        size="sm"
        className={`w-full justify-start file-tree-file-btn ${isSelected ? "is-selected" : ""}`}
        onClick={handleClick}
        {...props}
      >
        {icon || <FileTreeIcon name={name} />}
        <FileTreeName>{name}</FileTreeName>
      </Button>
      {actions && (
        <FileTreeActions>
          {actions}
        </FileTreeActions>
      )}
    </div>
  );
}

/**
 * FileTreeIcon displays file-type aware SVG icon
 */
export function FileTreeIcon({ name = "", className = "" }) {
  const ext = name.split(".").pop().toLowerCase();

  if (ext === "py" || ext === "ipynb") {
    return (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#ffffff" strokeWidth="2" className={`file-tree-icon ${className}`}>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    );
  }

  if (ext === "md" || ext === "txt") {
    return (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#e0e0e0" strokeWidth="2" className={`file-tree-icon ${className}`}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );
  }

  if (ext === "json" || ext === "js" || ext === "jsx") {
    return (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#4ade80" strokeWidth="2" className={`file-tree-icon ${className}`}>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" className={`file-tree-icon ${className}`}>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

export function FileTreeName({ className = "", children }) {
  return <span className={`file-tree-name ${className}`}>{children}</span>;
}

export function FileTreeActions({ className = "", children }) {
  return <div className={`file-tree-actions ${className}`}>{children}</div>;
}

/**
 * FileTreeNode
 * Recursively renders folder and file tree nodes
 */
export function FileTreeNode({ node, onSelect }) {
  if (node.type === "folder") {
    return (
      <FileTreeFolder
        name={node.name}
        path={node.path}
        defaultOpen={node.defaultOpen ?? true}
      >
        {node.children?.map((child) => (
          <FileTreeNode key={child.path} node={child} onSelect={onSelect} />
        ))}
      </FileTreeFolder>
    );
  }

  return (
    <FileTreeFile
      name={node.name}
      path={node.path}
      actions={node.actions}
      onSelect={onSelect}
    />
  );
}

/**
 * ChangedFilesCard
 * High-level presentation card for files changed/modified by the agent
 */
export function ChangedFilesCard({
  title = "Files Changed",
  files = [],
  tree = null,
  onSelectFile,
  className = "",
}) {
  const count = files.length;

  return (
    <div className={`changed-files-card ${className}`}>
      <div className="changed-files-header">
        <div className="changed-files-header-left">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span className="changed-files-title">{title}</span>
        </div>
        <span className="changed-files-badge">{count} {count === 1 ? "file" : "files"}</span>
      </div>
      <div className="changed-files-body">
        <FileTree onSelect={onSelectFile}>
          {tree ? (
            tree.map((node) => (
              <FileTreeNode key={node.path} node={node} onSelect={onSelectFile} />
            ))
          ) : (
            files.map((file) => (
              <FileTreeFile
                key={file.path || file.name}
                name={file.name}
                path={file.path || file.name}
                onSelect={onSelectFile}
              />
            ))
          )}
        </FileTree>
      </div>
    </div>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent, Button };
