import type { TreeNode } from "../components/TreeView/TreeView.types";

export const fetchChildren = (parentId: string): Promise<TreeNode[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: `${parentId}-a`,
          name: "Level A",
          hasChildren: true,
        },
        {
          id: `${parentId}-b`,
          name: "Level B",
        },
      ]);
    }, 800);
  });
};
