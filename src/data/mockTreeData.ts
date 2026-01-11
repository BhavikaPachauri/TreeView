import type { TreeNode } from "../components/TreeView/TreeView.types";

export const mockTreeData: TreeNode[] = [
  {
    id: "A",
    name: "Level A",
    isExpanded: true,
    hasChildren: true,
    children: [
      {
        id: "B1",
        name: "Level A",
        hasChildren: true,
        children: [
          {
            id: "C1",
            name: "Level A",
            hasChildren: true,
            children: [
              { id: "D", name: "Level A" },
            ],
          },
          { id: "C2", name: "Level A" },
          { id: "C3", name: "Level A" },
        ],
      },
      { id: "B2", name: "Level A" },
    ],
  },
];
