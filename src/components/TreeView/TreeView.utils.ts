import type { TreeNode } from "./TreeView.types";

export const updateNodeById = (
  nodes: TreeNode[],
  id: string,
  updater: (node: TreeNode) => TreeNode
): TreeNode[] =>
  nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (node.children) {
      return {
        ...node,
        children: updateNodeById(node.children, id, updater),
      };
    }
    return node;
  });

export const removeNodeById = (
  nodes: TreeNode[],
  id: string
): TreeNode[] =>
  nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: node.children
        ? removeNodeById(node.children, id)
        : undefined,
    }));
