import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  TableOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  Button,
  Carousel,
  Input,
  InputNumber,
  Result,
  Spin,
  Typography,
  Upload,
} from "antd";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import type { Json } from "../../../backend/src/util";
import type { FlowNodeData, NodeProps } from "../util";
import { atom, useAtom } from "jotai";
import Papa from "papaparse";
import { RDKitModule } from "@rdkit/rdkit";

const rdkitAtom = atom<RDKitModule | null>(null);
const inferStateAtom = atom<InferInput | null>(null);

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

interface InferInput {
  smiles: string[];
  invalid: string[];
  status?: string;
  source?: "input" | "file";
  data?: any;
}

function SmilesInput() {
  const [rdkit] = useAtom(rdkitAtom);
  const [smiles, setSmiles] = useState<string>("");
  const [inferInput, setInferInput] = useAtom(inferStateAtom);
  const [valid, setValid] = useState<boolean>(false);

  useEffect(() => {
    if (inferInput?.source === "file") {
      setSmiles("");
    }
  }, [inferInput]);

  useEffect(() => {
    if (rdkit && !(inferInput?.source === "file" && smiles === "")) {
      const v = validateSMILES(smiles, rdkit);
      setValid(v);
      if (!v) setInferInput(null);
      else setInferInput({ smiles: [smiles], invalid: [], source: "input" });
    }
  }, [smiles, rdkit]);

  return (
    <div tw="flex flex-col space-y-2 pt-1">
      <label tw="text-lg font-semibold">Enter SMILES</label>
      <Input
        placeholder="SMILES Strings"
        value={smiles}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setInferInput(null);
          e.preventDefault();
          setSmiles(e.target.value);
        }}
        suffix={
          valid ? (
            <CheckCircleOutlined tw="text-green-700" />
          ) : smiles ? (
            <CloseCircleOutlined tw="text-red-700" />
          ) : (
            <span />
          )
        }
      />
    </div>
  );
}

function validateSMILES(smiles: string, rdkit: RDKitModule) {
  const mol = rdkit.get_mol(smiles || "invalid");
  const validity = mol.is_valid();
  mol.delete();
  return validity;
}

/**
 * Renders a file input box - parses uploaded file, detects a SMILE column.
 */

function FileInput() {
  const [inferInput, setInferInput] = useAtom(inferStateAtom);
  const [file, setFile] = useState<File | null>(null);
  const [rdkit] = useAtom(rdkitAtom);

  useEffect(() => {
    if (inferInput?.source === "input") {
      setFile(null);
    }
  }, [inferInput]);

  useEffect(() => {
    if (file && rdkit && !inferInput) {
    }
  }, [file, validateSMILES, rdkit]);

  return file ? (
    <Result
      status="success"
      subTitle={`Uploaded ${file.name}`}
      extra={
        <Button
          icon={<DeleteOutlined />}
          danger={true}
          onClick={() => {
            setFile(null);
            setInferInput(null);
          }}
        >
          Discard File
        </Button>
      }
    />
  ) : (
    <Upload.Dragger
      accept=".csv"
      multiple={false}
      disabled={file !== null}
      showUploadList={false}
      customRequest={({ file, onSuccess }) => {
        if (!rdkit) return;
        const f = file as File;
        setFile(f);
        Papa.parse(f, {
          complete: (results) => {
            const table = z
              .array(z.array(z.string()).min(1))
              .parse(results.data);
            const columnCounts = Array<number>(table[0].length).fill(0);
            const rowIndicies = Array.from({ length: 10 }, () =>
              Math.floor(Math.random() * table.length)
            );

            for (const rowIdx of rowIndicies) {
              for (const colIdx of Array.from(
                { length: columnCounts.length },
                (_, i) => i
              )) {
                columnCounts[colIdx] += validateSMILES(
                  table[rowIdx][colIdx],
                  rdkit
                )
                  ? 1
                  : 0;
              }
            }

            const maxIdx = columnCounts.indexOf(Math.max(...columnCounts));

            const startRow = validateSMILES(table[0][maxIdx], rdkit) ? 0 : 1;

            const allSmiles = table.slice(startRow).map((row) => row[maxIdx]);
            const invalidSmiles = allSmiles.filter(
              (smiles) => !validateSMILES(smiles, rdkit)
            );

            setInferInput({ smiles: allSmiles, invalid: invalidSmiles });
          },
        });
        if (onSuccess) onSuccess({});
      }}
    >
      <p className="ant-upload-drag-icon">
        <TableOutlined />
      </p>
      <p className="ant-upload-text">Upload a CSV file with a SMILES column</p>
      <p className="ant-upload-hint">Column name will be autodetected.</p>
    </Upload.Dragger>
  );
}

function InvalidCorrector() {
  const [inferInput, setInferInput] = useAtom(inferStateAtom);
  const [rdkit] = useAtom(rdkitAtom);
  const [state, setState] = useState<InferInput | null>(null);
  const [valid, setValid] = useState<boolean[]>();
  const [deleted, setDeleted] = useState<boolean[]>([]);

  const fixedAll = valid?.map((v, idx) => v || deleted[idx]).every((v) => v);

  useEffect(() => {
    if (inferInput) {
      setState(inferInput);
      setValid(Array(inferInput.invalid.length).fill(false));
      setDeleted(Array(inferInput.invalid.length).fill(false));
    }
  }, [inferInput]);

  return inferInput && state && valid && rdkit ? (
    <div tw="flex w-full flex-col space-y-2">
      <label tw="text-lg font-semibold">Fix Invalid SMILES</label>
      {state.invalid.map((smiles, idx) => {
        return (
          <div tw="flex w-full flex-row space-x-2">
            <Input
              tw="grow"
              placeholder="SMILES Strings"
              value={smiles}
              disabled={deleted[idx]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newValid = [...valid];
                const newState = [...state.invalid];
                newState[idx] = e.target.value;
                newValid[idx] = validateSMILES(e.target.value, rdkit);
                setValid(newValid);
                setState({ smiles: state.smiles, invalid: newState });
              }}
              key={idx}
              suffix={
                valid[idx] || deleted[idx] ? (
                  <CheckCircleOutlined tw="text-green-700" />
                ) : smiles ? (
                  <CloseCircleOutlined tw="text-red-700" />
                ) : (
                  <span />
                )
              }
            />
            <Button
              tw="inline-flex items-center"
              onClick={() =>
                setDeleted(deleted.map((d, i) => (i === idx ? !d : d)))
              }
            >
              {deleted[idx] ? <UndoOutlined /> : <DeleteOutlined />}
            </Button>
          </div>
        );
      })}
      <Button
        tw="w-full"
        disabled={!fixedAll}
        onClick={() => {
          const allSmiles: (string | null)[] = inferInput.smiles;
          for (let i = 0; i < inferInput.invalid.length; i++) {
            const idx = allSmiles.indexOf(inferInput.invalid[i]);
            if (deleted[i]) allSmiles[idx] = null;
            else allSmiles[idx] = state.invalid[i];
          }
          setInferInput({
            smiles: allSmiles.filter((x): x is string => !!x),
            invalid: [],
          });
        }}
      >
        Submit Fixes
      </Button>
    </div>
  ) : null;
}

const dataSchema = z.any();

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
  const [inferState] = useAtom(inferStateAtom);
  const [rdkit, setRDKit] = useAtom(rdkitAtom);

  useEffect(() => {
    if (inferState && inferState.invalid.length === 0)
      setOutputs([inferState.smiles]);
    else setOutputs(null);
  }, [inferState]);

  useRdkit(rdkit, setRDKit);

  return rdkit ? (
    <div tw="w-full flex flex-col space-y-2">
      <div tw="flex w-full flex-row items-center space-x-4">
        <div tw="h-fit w-1/2">
          <SmilesInput />
        </div>
        <div tw="h-fit w-1/2">
          <FileInput />
        </div>
      </div>
      {inferState && inferState.invalid.length > 0 ? (
        <InvalidCorrector />
      ) : null}
    </div>
  ) : (
    <div tw="w-full h-fit pb-12">
      <Spin tip="Loading" size="large">
        <div className="content" />
      </Spin>
    </div>
  );
}

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

function ViewMolecules({
  outputs,
  download,
}: {
  outputs: Json[];
  download?: (url: String) => void;
}) {
  const x = z.array(z.string()).parse(outputs[0]); // get first 4
  const [idx, setIdx] = useState(0);
  const [rdkit, setRdkit] = useAtom(rdkitAtom);
  useRdkit(rdkit, setRdkit);

  const [svg, setSVG] = useState<undefined | string>(undefined);

  useEffect(() => {
    if (rdkit && !svg) {
      const mol = rdkit?.get_mol(x[idx]);
      setSVG(mol.get_svg());
      mol.delete();
    }
  }, [rdkit, svg]);

  return svg ? (
    <div tw="w-full flex flex-col space-y-2" className="nodrag">
      <div dangerouslySetInnerHTML={{ __html: svg }}></div>
      <InputNumber
        tw="w-full"
        min={0}
        max={x.length - 1}
        value={idx}
        onChange={(e) => {
          if (e !== null) {
            setIdx(e);
            setSVG(undefined);
          }
        }}
      />
    </div>
  ) : (
    <Typography.Text>Loading...</Typography.Text>
  );
}

export default function InputMolecules({
  callAfterUpdateInpOuts = () => {},
  node,
  setNode,
}: NodeProps<z.infer<typeof dataSchema>>) {
  const data = dataSchema.parse(node.data);

  useEffect(() => {
    setNode((nd) => ({
      ...nd,
      data: {},
      operator: "ui",
      num_inputs: 0,
      num_outputs: 1,
      subcomponents: { ui: RemoteUI, output: ViewMolecules },
    }));
    callAfterUpdateInpOuts();
  }, []);

  return (
    <div tw="flex flex-col space-y-2">
      <Typography.Text>User Input Molecules</Typography.Text>
    </div>
  );
}
