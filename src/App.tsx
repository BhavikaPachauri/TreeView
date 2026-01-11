import React, { useState, createContext, useContext, ReactNode } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, Loader, Sparkles } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  hasChildren?: boolean;
  isLoaded?: boolean;
  color?: string;
  gradient?: string;
}

interface TreeContextType {
  treeData: TreeNode[];
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  addNode: (parentId: string, label: string) => void;
  deleteNode: (id: string) => void;
  updateNode: (id: string, label: string) => void;
  loadChildren: (parentId: string) => Promise<void>;
  moveNode: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
}

// Context
const TreeContext = createContext<TreeContextType | undefined>(undefined);

const useTree = () => {
  const context = useContext(TreeContext);
  if (!context) throw new Error('useTree must be used within TreeProvider');
  return context;
};

// Mock data
const initialData: TreeNode[] = [
  {
    id: 'a',
    label: 'Level A',
    gradient: 'from-blue-500 to-blue-600',
    hasChildren: true,
    isLoaded: false,
  },
];

// Simulate API call for lazy loading
const fetchChildren = async (parentId: string): Promise<TreeNode[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const childrenMap: Record<string, TreeNode[]> = {
    'a': [
      { id: 'b', label: 'Level A', gradient: 'from-emerald-400 to-emerald-500', hasChildren: true, isLoaded: false },
      { id: 'g', label: 'Level A', gradient: 'from-green-400 to-green-500', hasChildren: false },
    ],
    'b': [
      { id: 'c', label: 'Level A', gradient: 'from-teal-400 to-cyan-500', hasChildren: true, isLoaded: false },
      { id: 'e', label: 'Level A', gradient: 'from-lime-400 to-green-500', hasChildren: false },
      { id: 'f', label: 'Level A', gradient: 'from-emerald-500 to-teal-500', hasChildren: false },
    ],
    'c': [
      { id: 'd', label: 'Level A', gradient: 'from-yellow-400 to-amber-500', hasChildren: false },
    ],
  };

  return childrenMap[parentId] || [];
};

// Tree Node Component
interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  isLast: boolean;
  parentIsLast?: boolean[];
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ node, level, isLast, parentIsLast = [] }) => {
  const { expandedNodes, toggleNode, addNode, deleteNode, updateNode, loadChildren } = useTree();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.hasChildren || (node.children && node.children.length > 0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: { node, level },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggle = async () => {
    if (!isExpanded && hasChildren && !node.isLoaded) {
      setIsLoading(true);
      await loadChildren(node.id);
      setIsLoading(false);
    }
    toggleNode(node.id);
  };

  const handleEdit = () => {
    if (editValue.trim()) {
      updateNode(node.id, editValue.trim());
    } else {
      setEditValue(node.label);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${node.label}" and all its children?`)) {
      deleteNode(node.id);
    }
  };

  const handleAddChild = () => {
    if (newNodeName.trim()) {
      addNode(node.id, newNodeName.trim());
      setNewNodeName('');
      setShowAddInput(false);
      if (!isExpanded) {
        toggleNode(node.id);
      }
    }
  };

  return (
    <div className="relative">
      {/* Connecting Lines */}
      {level > 0 && (
        <>
          {/* Horizontal line with gradient */}
          <div
            className="absolute border-l-2 border-t-2 border-purple-200 rounded-tl-lg"
            style={{
              left: `${(level - 1) * 40 + 20}px`,
              top: '28px',
              width: '24px',
              height: '1px',
            }}
          />
          {/* Vertical line from parent */}
          {!isLast && (
            <div
              className="absolute border-l-2 border-purple-200"
              style={{
                left: `${(level - 1) * 40 + 20}px`,
                top: '28px',
                bottom: '0',
                width: '1px',
              }}
            />
          )}
          {/* Vertical lines for ancestors */}
          {parentIsLast.map((isParentLast, idx) => {
            if (!isParentLast) {
              return (
                <div
                  key={idx}
                  className="absolute border-l-2 border-purple-200"
                  style={{
                    left: `${idx * 40 + 20}px`,
                    top: '0',
                    bottom: '0',
                    width: '1px',
                  }}
                />
              );
            }
            return null;
          })}
        </>
      )}

      <div
        ref={setNodeRef}
        style={{ ...style, paddingLeft: `${level * 40}px` }}
        className="group flex items-center gap-4 py-2 relative z-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...attributes}
        {...listeners}
      >
        {/* Node Avatar with gradient */}
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${node.gradient || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-grab active:cursor-grabbing ring-4 ring-white ${
            isHovered ? 'scale-110' : ''
          }`}
        >
          {node.label.match(/Level ([A-Z])/)?.[1] || node.label.charAt(0).toUpperCase()}
        </div>

        {/* Node Label Card */}
        <div className={`flex items-center gap-3 bg-white rounded-xl px-5 py-3 shadow-md hover:shadow-xl transition-all duration-300 flex-1 max-w-md border-2 ${
          isHovered ? 'border-purple-300 scale-[1.02]' : 'border-transparent'
        }`}>
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEdit();
                if (e.key === 'Escape') {
                  setEditValue(node.label);
                  setIsEditing(false);
                }
              }}
              className="flex-1 px-3 py-2 text-sm font-semibold border-2 border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50"
              autoFocus
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span
                className="flex-1 font-semibold text-gray-800 text-sm select-none"
                onDoubleClick={() => setIsEditing(true)}
              >
                {node.label}
              </span>

              {/* Add Button */}
              <button
                onClick={() => setShowAddInput(true)}
                className={`p-2 rounded-lg transition-all duration-300 bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg ${
                  isHovered ? 'scale-110' : ''
                }`}
                title="Add child"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {/* Hidden Action Buttons */}
        <div className={`flex items-center gap-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        }`}>
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>

        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-110 border-2 border-white"
            style={{ left: `${level * 40 - 14}px` }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader size={14} className="animate-spin" />
            ) : isExpanded ? (
              <ChevronDown size={14} strokeWidth={3} />
            ) : (
              <ChevronRight size={14} strokeWidth={3} />
            )}
          </button>
        )}
      </div>

      {/* Add Child Input */}
      {showAddInput && (
        <div style={{ paddingLeft: `${(level + 1) * 40}px` }} className="flex items-center gap-4 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-white">
            <Sparkles size={20} />
          </div>
          <div className="flex items-center gap-3 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-400 rounded-xl px-4 py-3 shadow-lg flex-1 max-w-md">
            <input
              type="text"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChild();
                if (e.key === 'Escape') {
                  setNewNodeName('');
                  setShowAddInput(false);
                }
              }}
              placeholder="Enter node name..."
              className="flex-1 px-2 text-sm font-medium focus:outline-none bg-transparent placeholder-purple-400"
              autoFocus
            />
            <button
              onClick={handleAddChild}
              className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105"
            >
              Add
            </button>
            <button
              onClick={() => {
                setNewNodeName('');
                setShowAddInput(false);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Children */}
      {isExpanded && node.children && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
          {node.children.map((child, index) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              isLast={index === node.children!.length - 1}
              parentIsLast={[...parentIsLast, isLast]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Tree Provider
const TreeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [treeData, setTreeData] = useState<TreeNode[]>(initialData);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const addNode = (parentId: string, label: string) => {
    const gradients = [
      'from-rose-400 to-pink-500',
      'from-violet-400 to-purple-500',
      'from-cyan-400 to-blue-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-green-500',
      'from-fuchsia-400 to-pink-500',
    ];
    const newNode: TreeNode = {
      id: `node-${Date.now()}`,
      label,
      gradient: gradients[Math.floor(Math.random() * gradients.length)],
      hasChildren: false,
      isLoaded: true,
    };

    const addToTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), newNode],
            hasChildren: true,
            isLoaded: true,
          };
        }
        if (node.children) {
          return { ...node, children: addToTree(node.children) };
        }
        return node;
      });
    };

    setTreeData(addToTree(treeData));
  };

  const deleteNode = (id: string) => {
    const removeFromTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter((node) => node.id !== id)
        .map((node) => ({
          ...node,
          children: node.children ? removeFromTree(node.children) : undefined,
        }));
    };

    setTreeData(removeFromTree(treeData));
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const updateNode = (id: string, label: string) => {
    const updateInTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, label };
        }
        if (node.children) {
          return { ...node, children: updateInTree(node.children) };
        }
        return node;
      });
    };

    setTreeData(updateInTree(treeData));
  };

  const loadChildren = async (parentId: string) => {
    const children = await fetchChildren(parentId);

    const addChildrenToTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: children,
            isLoaded: true,
          };
        }
        if (node.children) {
          return { ...node, children: addChildrenToTree(node.children) };
        }
        return node;
      });
    };

    setTreeData(addChildrenToTree(treeData));
  };

  const moveNode = (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    console.log('Move', draggedId, 'to', targetId, position);
  };

  const value: TreeContextType = {
    treeData,
    expandedNodes,
    toggleNode,
    addNode,
    deleteNode,
    updateNode,
    loadChildren,
    moveNode,
  };

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
};

// Main TreeView Component
const TreeView: React.FC = () => {
  const { treeData } = useTree();
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveNode(active.data.current?.node || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveNode(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-3">
              Tree View Component
            </h1>
          
          </div>

          {/* Tree Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-10 border border-white/50">
            <div>
              {treeData.map((node, index) => (
                <TreeNodeComponent
                  key={node.id}
                  node={node}
                  level={0}
                  isLast={index === treeData.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Instructions */}
          
          
        </div>
      </div>

      <DragOverlay>
        {activeNode && (
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-2xl border-2 border-purple-400 animate-pulse">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${activeNode.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-white`}>
              {activeNode.label.match(/Level ([A-Z])/)?.[1] || activeNode.label.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-gray-800">{activeNode.label}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

// App Component
const App: React.FC = () => {
  return (
    <TreeProvider>
      <TreeView />
    </TreeProvider>
  );
};

export default App;