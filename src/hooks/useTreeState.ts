import { useState } from "react";
import type { TreeNode } from "../components/TreeView/TreeView.types";
import {
  updateNodeById,
  removeNodeById,
} from "../components/TreeView/TreeView.utils";

export const useTreeState = (initialData: TreeNode[]) => {
  const [treeData, setTreeData] = useState<TreeNode[]>(initialData);

  const updateNode = (id: string, updater: (n: TreeNode) => TreeNode) => {
    setTreeData((prev) => updateNodeById(prev, id, updater));
  };

  const removeNode = (id: string) => {
    setTreeData((prev) => removeNodeById(prev, id));
  };

  return { treeData, setTreeData, updateNode, removeNode };
};
