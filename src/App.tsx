import React from "react";
import NumberNode from "./nodes/NumberNode";
import type { FlowNode, NodeSetter } from "./util";
import OperationNode from "./nodes/OperationNode";

function NodeTester({
  Node,
}: {
  Node: React.FC<{ node: FlowNode; setNode: NodeSetter }>;
}) {
  const [node, setNode] = React.useState<FlowNode>({
    id: "node-0",
    data: {
      data: {},
      operator: "",
      hierarchy: [],
      num_inputs: 1,
      num_outputs: 1,
    },
    position: {
      x: 200,
      y: 100,
    },
    type: "FlowNode",
  });

  return (
    <div tw="flex flex-col mx-auto w-full max-w-2xl">
      <h1>{Node.name}</h1>
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
