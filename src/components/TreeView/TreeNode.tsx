import { useState } from "react";
import type { TreeNode as TreeNodeType } from "./TreeView.types";
import { loadChildren } from "../../hooks/useLazyLoad";

interface Props {
  node: TreeNodeType;
  updateNode: (id: string, updater: (n: TreeNodeType) => TreeNodeType) => void;
  removeNode: (id: string) => void;
  level?: number;
}

export const TreeNode = ({
  node,
  updateNode,
  removeNode,
  level = 0,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(node.name);

  const toggle = () => {
    if (node.hasChildren) {
      loadChildren(node, updateNode);
    }
  };

  const addChild = () => {
    const name = prompt("Enter node name");
    if (!name) return;

    updateNode(node.id, (n) => ({
      ...n,
      isExpanded: true,
      children: [
        ...(n.children ?? []),
        {
          id: crypto.randomUUID(),
          name,
          hasChildren: false,
          children: [],
        },
      ],
    }));
  };

  const saveEdit = () => {
    updateNode(node.id, (n) => ({ ...n, name: value }));
    setEditing(false);
  };

  const deleteNode = () => {
    if (confirm("Delete this node and all children?")) {
      removeNode(node.id);
    }
  };

  return (
    <div className="relative ml-10">
      {/* Vertical dotted line */}
      {level > 0 && (
        <div className="absolute left-4 top-0 h-full border-l-2 border-dotted border-gray-300" />
      )}

      <div className="relative flex items-center gap-4 py-3">
        {/* Horizontal dotted line */}
        {level > 0 && (
          <span className="absolute left-4 top-1/2 w-6 border-t-2 border-dotted border-gray-300" />
        )}

        {/* Circle Badge */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow
          ${level === 0 ? "bg-sky-400" : "bg-lime-400"}`}
        >
          {node.name.charAt(0).toUpperCase()}
        </div>

        {/* White Card */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-md shadow-md min-w-[170px]">
          {/* Expand / Collapse */}
          {node.hasChildren && (
            <button
              onClick={toggle}
              className="text-gray-500 text-sm"
            >
              {node.isExpanded ? "−" : "+"}
            </button>
          )}

          {/* Node Name */}
          {editing ? (
            <input
              className="border px-1 text-sm w-24"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={saveEdit}
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-medium text-gray-700 cursor-pointer"
              onDoubleClick={() => setEditing(true)}
            >
              {node.name}
            </span>
          )}

          {/* Actions */}
          <button
            onClick={addChild}
            className="ml-auto w-6 h-6 border rounded text-gray-600 hover:bg-gray-100"
          >
            +
          </button>

          <button
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-gray-700"
          >
            ✏️
          </button>

          <button
            onClick={deleteNode}
            className="text-gray-300 hover:text-red-500"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Children */}
      {node.isExpanded &&
        node.children?.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            updateNode={updateNode}
            removeNode={removeNode}
            level={level + 1}
          />
        ))}
    </div>
  );
};
