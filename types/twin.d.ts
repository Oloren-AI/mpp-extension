import "twin.macro";
import styledImport, { CSSProp, css as cssImport } from "styled-components";
import type { Node, Edge } from "reactflow";

interface FlowNodeData {
  data: Json;
  num_inputs: number;
  num_outputs: number;
  operator: string;
  hierarchy: string[];
  special?: boolean;
  logs?: string;
  status?: "idle" | "running" | "finished" | "error";
}

declare type FlowNode = Node<FlowNodeData>;

declare module "twin.macro" {
  // The styled and css imports
  const styled: typeof styledImport;
  const css: typeof cssImport;
}

declare module "react" {
  // The css prop
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    css?: CSSProp;
    tw?: string;
  }
  // The inline svg css prop
  interface SVGProps<T> extends SVGProps<SVGSVGElement> {
    css?: CSSProp;
    tw?: string;
  }
}

// The 'as' prop on styled components
declare global {
  namespace JSX {
    interface IntrinsicAttributes<T> extends DOMAttributes<T> {
      as?: string;
    }
  }
}
