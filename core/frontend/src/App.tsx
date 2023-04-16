import React from "react";
import NumberNode from "./nodes/NumberNode";
import type { FlowNodeData, NodeSetter } from "./util";
import { Typography } from "antd";
import OperationNode from "./nodes/OperationNode";

const { Title } = Typography;

function NodeTester({
  Node,
}: {
  Node: React.FC<{ node: FlowNodeData; setNode: NodeSetter }>;
}) {
  const [node, setNode] = React.useState<FlowNodeData>({
    id: "node-1",
    data: {},
    operator: "",
    hierarchy: [],
    num_inputs: 1,
    num_outputs: 1,
  });

  return (
    <div tw="flex flex-col mx-auto w-full max-w-2xl">
      <Title>{Node.name}</Title>
      <div tw="p-2 bg-white border-solid border border-gray-300 w-fit">
        <Node node={node} setNode={setNode} />
      </div>
      <pre>
        <code>{JSON.stringify(node, null, 2)}</code>
      </pre>
    </div>
  );
}

export const Components = [NumberNode, OperationNode] as const;

export default function App() {
  return Components.map((Node, i) => <NodeTester key={i} Node={Node} />);
}
