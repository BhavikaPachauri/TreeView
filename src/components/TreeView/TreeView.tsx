import { TreeNode } from "./TreeNode";
import  type { TreeNode as NodeType } from "./TreeView.types";
import { useTreeState } from "../../hooks/useTreeState";

interface Props {
  data: NodeType[];
}

export const TreeView = ({ data }: Props) => {
  const { treeData, updateNode, removeNode } = useTreeState(data);

  return (
    <div className="bg-gray-50 p-10 rounded-xl">
      {treeData.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          updateNode={updateNode}
          removeNode={removeNode}
        />
      ))}
    </div>
  );
};
