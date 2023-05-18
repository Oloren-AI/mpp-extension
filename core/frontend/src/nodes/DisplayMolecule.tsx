import { RDKitModule } from "@rdkit/rdkit";
import { useEffect, useState } from "react";
import React from "react";
import z from "zod";
import { FlowNodeData, NodeProps } from "../util";
import { Typography } from "antd";
import { Json } from "../../../backend/src/util";

export const urlCache = new Set();

const useDynamicScript = (url: string) => {
  const [ready, setReady] = React.useState(false);
  const [errorLoading, setErrorLoading] = React.useState(false);

  React.useEffect(() => {
    if (!url) return;

    if (urlCache.has(url)) {
      setReady(true);
      setErrorLoading(false);
      return;
    }

    setReady(false);
    setErrorLoading(false);

    const element = document.createElement("script");

    element.src = url;
    element.type = "text/javascript";
    element.async = true;

    element.onload = () => {
      urlCache.add(url);
      setReady(true);
    };

    element.onerror = () => {
      setReady(false);
      setErrorLoading(true);
    };

    document.head.appendChild(element);

    return () => {
      urlCache.delete(url);
      document.head.removeChild(element);
    };
  }, [url]);

  return {
    errorLoading,
    ready,
  };
};

function useRdkit(rdkit: any, setRDKit: any) {
  const { ready, errorLoading } = useDynamicScript(
    "https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.js"
  );

  useEffect(() => {
    if (!rdkit && ready) {
      window
        .initRDKitModule()
        .then((RDKit) => {
          console.log("Loading rdkit...");
          setRDKit(RDKit);
        })
        .catch((e) => {
          console.error("Error loading RDKit", e);
        });
    }
  }, [rdkit, ready]);
}

function RemoteUI({
  inputs,
  outputs,
  setOutputs,
  node,
}: {
  inputs: Json[];
  node: FlowNodeData<z.infer<typeof dataSchema>>;
  outputs: (Json | File)[] | null;
  setOutputs: React.Dispatch<React.SetStateAction<(Json | File)[] | null>>;
}) {
  const [rdkit, setRDKit] = React.useState<RDKitModule | null>(null);
  useRdkit(rdkit, setRDKit);

  const [svg, setSVG] = useState<undefined | string>(undefined);

  useEffect(() => {
    if (rdkit && !svg) {
      const mol = rdkit?.get_mol(inputs[0] as string);
      setSVG(mol.get_svg());
      mol.delete();
    }
  }, [rdkit, svg]);

  return svg ? (
    <div dangerouslySetInnerHTML={{ __html: svg }}></div>
  ) : (
    <Typography.Text>Loading...</Typography.Text>
  );
}

const dataSchema = z.any();

export default function DisplayMoleculeNode({
  callAfterUpdateInpOuts = () => {},
  node,
  setNode,
}: NodeProps<z.infer<typeof dataSchema>>) {
  useEffect(() => {
    setNode((nd) => ({
      ...nd,
      data: {},
      operator: "ui",
      num_inputs: 1,
      num_outputs: 0,
      subcomponents: { ui: RemoteUI },
    }));
    callAfterUpdateInpOuts();
  }, []);

  return <Typography.Text tw="font-bold">Display Molecule</Typography.Text>;
}
