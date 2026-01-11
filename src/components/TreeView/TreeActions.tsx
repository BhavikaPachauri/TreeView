import { useState } from "react";
import type { TreeNode as NodeType } from "./TreeView.types";
import { fetchChildren } from "../../services/treeApi";

interface Props {
  node: NodeType;
  updateNode: (id: string, updater: (n: NodeType) => NodeType) => void;
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

  const toggle = async () => {
    if (!node.isExpanded && node.hasChildren && !node.children) {
      const children = await fetchChildren(node.id);
      updateNode(node.id, (n) => ({
        ...n,
        children,
        isExpanded: true,
      }));
    } else {
      updateNode(node.id, (n) => ({
        ...n,
        isExpanded: !n.isExpanded,
      }));
    }
  };

  const addChild = () => {
    const name = prompt("Enter node name");
    if (!name) return;

    updateNode(node.id, (n) => ({
      ...n,
      isExpanded: true,
      children: [
        ...(n.children || []),
        {
          id: crypto.randomUUID(),
          name,
        },
      ],
    }));
  };

  const deleteNode = () => {
    if (confirm("Delete this node and all children?")) {
      removeNode(node.id);
    }
  };

  const saveEdit = () => {
    updateNode(node.id, (n) => ({ ...n, name: value }));
    setEditing(false);
  };

  return (
    <div className="relative ml-6">
      {/* Vertical dotted line */}
      {level > 0 && (
        <div className="absolute left-0 top-0 h-full border-l border-dashed border-gray-300" />
      )}

      <div className="relative flex items-center gap-3 pl-6 py-2">
        {/* Horizontal dotted line */}
        {level > 0 && (
          <span className="absolute left-0 top-1/2 w-6 border-t border-dashed border-gray-300" />
        )}

        {/* Circle badge */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold
          ${level === 0 ? "bg-blue-500" : "bg-green-400"}`}
        >
          {node.name[0]}
        </div>

        {/* Card */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-md min-w-[160px]">
          {node.hasChildren && (
            <button onClick={toggle} className="text-gray-500">
              {node.isExpanded ? "−" : "+"}
            </button>
          )}

          {editing ? (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={saveEdit}
              autoFocus
              className="border px-1 text-sm"
            />
          ) : (
            <span
              className="text-sm font-medium"
              onDoubleClick={() => setEditing(true)}
            >
              {node.name}
            </span>
          )}

          <button
            onClick={addChild}
            className="ml-auto text-gray-400 hover:text-black"
          >
            +
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
