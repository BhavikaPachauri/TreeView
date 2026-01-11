import React from "react";
import { useState, useRef } from "react";


import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, GripVertical, Loader, FolderOpen, Folder, FileText, X, Check } from "lucide-react";



interface TreeNode {
  id: string;
  name: string;
  hasChildren?: boolean;
  isExpanded?: boolean;
  children?: TreeNode[];
  isLoading?: boolean;
}

interface DragState {
  draggedNodeId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}

// ============================================================================
// MOCK API SERVICE - LAZY LOADING SIMULATION
// ============================================================================

const mockApiService = {
  fetchChildren: async (parentId: string): Promise<TreeNode[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const childCount = Math.floor(Math.random() * 4) + 1;
        const children: TreeNode[] = Array.from({ length: childCount }, (_, i) => ({
          id: `${parentId}-child-${i + 1}-${Date.now()}`,
          name: `Child ${i + 1} of ${parentId.split('-').pop()}`,
          hasChildren: Math.random() > 0.5,
        }));
        resolve(children);
      }, 800);
    });
  }
};

// ============================================================================
// TREE NODE COMPONENT
// ============================================================================

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  onUpdate: (id: string, updates: Partial<TreeNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, childName: string) => void;
  onLoadChildren: (nodeId: string) => Promise<void>;
  onDragStart: (nodeId: string) => void;
  onDragEnd: () => void;
  onDragOver: (nodeId: string, position: 'before' | 'after' | 'inside') => void;
  onDrop: (targetId: string, position: 'before' | 'after' | 'inside') => void;
  dragState: DragState;
}

const TreeNodeComponent = ({
  node,
  level,
  onUpdate,
  onDelete,
  onAddChild,
  onLoadChildren,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dragState
}: TreeNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = async () => {
    if (!node.hasChildren) return;
    if (!node.isExpanded && !node.children) {
      await onLoadChildren(node.id);
    } else {
      onUpdate(node.id, { isExpanded: !node.isExpanded });
    }
  };

  const handleAddChild = () => {
    const childName = prompt("Enter child node name:");
    if (childName && childName.trim()) {
      onAddChild(node.id, childName.trim());
    }
  };

  const handleDelete = () => {
    const message = node.children?.length
      ? `Delete "${node.name}" and all its children?`
      : `Delete "${node.name}"?`;

    if (confirm(message)) {
      onDelete(node.id);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(node.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleEditSave = () => {
    if (editValue.trim()) {
      onUpdate(node.id, { name: editValue.trim() });
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(node.name);
    setIsEditing(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragState.draggedNodeId === node.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: 'before' | 'after' | 'inside';
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    } else {
      position = 'inside';
    }

    onDragOver(node.id, position);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragState.dropPosition) {
      onDrop(node.id, dragState.dropPosition);
    }
  };

  const isDragging = dragState.draggedNodeId === node.id;
  const isDropTarget = dragState.dropTargetId === node.id;
  const dropPosition = isDropTarget ? dragState.dropPosition : null;

  return (
    <div className="relative group">
      {/* Drop Indicators */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 z-20 shadow-lg" />
      )}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 z-20 shadow-lg" />
      )}

      {/* Node Row */}
      <div
        className={`
          flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-xl transition-all duration-200
          ${isDragging ? 'opacity-40 scale-95' : ''}
          ${dropPosition === 'inside'
            ? 'bg-gradient-to-r from-blue-50 to-purple-50 ring-2 ring-blue-400 shadow-md scale-[1.02]'
            : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50'
          }
        `}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag Handle */}
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100"
        >
          <GripVertical size={18} className="hidden sm:block" />
          <GripVertical size={16} className="sm:hidden" />
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggle}
          disabled={!node.hasChildren}
          className={`
            w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-all duration-200
            ${node.hasChildren
              ? 'text-gray-700 hover:bg-gradient-to-br hover:from-blue-100 hover:to-purple-100 hover:shadow-sm cursor-pointer active:scale-95'
              : 'text-transparent cursor-default'}
          `}
        >
          {node.isLoading ? (
            <Loader size={16} className="animate-spin text-blue-600" />
          ) : node.hasChildren ? (
            node.isExpanded ? (
              <ChevronDown size={18} className="text-blue-600" />
            ) : (
              <ChevronRight size={18} className="text-gray-500" />
            )
          ) : null}
        </button>

        {/* Icon */}
        <div className="flex-shrink-0">
          {node.hasChildren ? (
            node.isExpanded ? (
              <FolderOpen size={20} className="text-blue-500" />
            ) : (
              <Folder size={20} className="text-yellow-600" />
            )
          ) : (
            <FileText size={18} className="text-gray-400" />
          )}
        </div>

        {/* Node Content */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave();
                  if (e.key === 'Escape') handleEditCancel();
                }}
                className="flex-1 px-3 py-1.5 text-sm sm:text-base border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
              <button
                onClick={handleEditSave}
                className="p-1.5 sm:p-2 text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleEditCancel}
                className="p-1.5 sm:p-2 text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <span
              onDoubleClick={handleDoubleClick}
              className="flex-1 text-sm sm:text-base font-medium text-gray-800 cursor-text truncate hover:text-gray-900 transition-colors"
              title="Double-click to edit"
            >
              {node.name}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:shadow-sm active:scale-95"
              title="Edit"
            >
              <Edit2 size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleAddChild}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all hover:shadow-sm active:scale-95"
              title="Add child"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-sm active:scale-95"
              title="Delete"
            >
              <Trash2 size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {node.isExpanded && node.children && (
        <div className="ml-2 sm:ml-4 border-l-2 border-gray-200 mt-1">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onLoadChildren={onLoadChildren}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dragState={dragState}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TREE VIEW COMPONENT
// ============================================================================

interface TreeViewProps {
  data: TreeNode[];
  onChange: (data: TreeNode[]) => void;
}

export const TreeView = ({ data, onChange }: TreeViewProps) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedNodeId: null,
    dropTargetId: null,
    dropPosition: null,
  });

  const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateNode = (nodes: TreeNode[], id: string, updates: Partial<TreeNode>): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: updateNode(node.children, id, updates) };
      }
      return node;
    });
  };

  const removeNode = (nodes: TreeNode[], id: string): TreeNode[] => {
    return nodes.filter(node => {
      if (node.id === id) return false;
      if (node.children) {
        return { ...node, children: removeNode(node.children, id) };
      }
      return true;
    }).map(node => {
      if (node.children) {
        return { ...node, children: removeNode(node.children, id) };
      }
      return node;
    });
  };

  const extractNode = (nodes: TreeNode[], id: string): { tree: TreeNode[], node: TreeNode | null } => {
    let extractedNode: TreeNode | null = null;

    const filterTree = (items: TreeNode[]): TreeNode[] => {
      return items.filter(item => {
        if (item.id === id) {
          extractedNode = item;
          return false;
        }
        if (item.children) {
          item.children = filterTree(item.children);
        }
        return true;
      });
    };

    const tree = filterTree(JSON.parse(JSON.stringify(nodes)));
    return { tree, node: extractedNode };
  };

  const insertNode = (
    nodes: TreeNode[],
    targetId: string,
    nodeToInsert: TreeNode,
    position: 'before' | 'after' | 'inside'
  ): TreeNode[] => {
    const result: TreeNode[] = [];

    for (const node of nodes) {
      if (node.id === targetId) {
        if (position === 'before') {
          result.push(nodeToInsert, node);
        } else if (position === 'after') {
          result.push(node, nodeToInsert);
        } else if (position === 'inside') {
          result.push({
            ...node,
            children: [...(node.children || []), nodeToInsert],
            hasChildren: true,
            isExpanded: true,
          });
        }
      } else {
        if (node.children) {
          result.push({ ...node, children: insertNode(node.children, targetId, nodeToInsert, position) });
        } else {
          result.push(node);
        }
      }
    }

    return result;
  };

  const handleUpdate = (id: string, updates: Partial<TreeNode>) => {
    onChange(updateNode(data, id, updates));
  };

  const handleDelete = (id: string) => {
    onChange(removeNode(data, id));
  };

  const handleAddChild = (parentId: string, childName: string) => {
    const newChild: TreeNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: childName,
      hasChildren: false,
    };

    onChange(updateNode(data, parentId, {
      children: [...(findNode(data, parentId)?.children || []), newChild],
      hasChildren: true,
      isExpanded: true,
    }));
  };

  const handleLoadChildren = async (nodeId: string) => {
    onChange(updateNode(data, nodeId, { isLoading: true }));

    try {
      const children = await mockApiService.fetchChildren(nodeId);
      onChange(updateNode(data, nodeId, {
        children,
        isExpanded: true,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load children:', error);
      onChange(updateNode(data, nodeId, { isLoading: false }));
    }
  };

  const handleDragStart = (nodeId: string) => {
    setDragState({
      draggedNodeId: nodeId,
      dropTargetId: null,
      dropPosition: null,
    });
  };

  const handleDragEnd = () => {
    setDragState({
      draggedNodeId: null,
      dropTargetId: null,
      dropPosition: null,
    });
  };

  const handleDragOver = (nodeId: string, position: 'before' | 'after' | 'inside') => {
    setDragState(prev => ({
      ...prev,
      dropTargetId: nodeId,
      dropPosition: position,
    }));
  };

  const handleDrop = (targetId: string, position: 'before' | 'after' | 'inside') => {
    if (!dragState.draggedNodeId || dragState.draggedNodeId === targetId) {
      setDragState({ draggedNodeId: null, dropTargetId: null, dropPosition: null });
      return;
    }

    const { tree: treeWithoutDragged, node: draggedNode } = extractNode(data, dragState.draggedNodeId);

    if (!draggedNode) {
      setDragState({ draggedNodeId: null, dropTargetId: null, dropPosition: null });
      return;
    }

    const newTree = insertNode(treeWithoutDragged, targetId, draggedNode, position);
    onChange(newTree);

    setDragState({ draggedNodeId: null, dropTargetId: null, dropPosition: null });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
      {data.length === 0 ? (
        <div className="p-12 sm:p-16 text-center">
          <Folder size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">No nodes yet. Add a root node to get started.</p>
        </div>
      ) : (
        <div className="p-3 sm:p-6">
          {data.map((node) => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              level={0}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
              onLoadChildren={handleLoadChildren}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              dragState={dragState}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DEMO APP
// ============================================================================

export default function App() {
  const [treeData, setTreeData] = useState<TreeNode[]>([
    {
      id: "root-1",
      name: "Documents",
      hasChildren: true,
      isExpanded: true,
      children: [
        {
          id: "root-1-1",
          name: "Work",
          hasChildren: true,
        },
        {
          id: "root-1-2",
          name: "Personal",
          hasChildren: false,
        },
      ],
    },
    {
      id: "root-2",
      name: "Projects",
      hasChildren: true,
      isExpanded: false,
    },
    {
      id: "root-3",
      name: "Archive",
      hasChildren: false,
    },
  ]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Tree View */}
        <TreeView data={treeData} onChange={setTreeData} />
      </div>
    </div>
  );
}