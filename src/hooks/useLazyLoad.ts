import { fetchChildren } from "../services/treeApi";
import type { TreeNode } from "../components/TreeView/TreeView.types";

export const loadChildren = async (
  node: TreeNode,
  updateNode: (id: string, updater: (n: TreeNode) => TreeNode) => void
) => {
  if (!node.children && node.hasChildren) {
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
