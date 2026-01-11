export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  hasChildren?: boolean;
  isExpanded?: boolean;
}
