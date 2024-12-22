/// <reference types="vite/client" />

declare namespace NEON {
  function InvokeUnrealEvent(delegate: string, data?: object): void;
  const InvokeUnreal: typeof InvokeUnrealEvent;

  function InvokeUnrealFunction(delegate: string, data?: object): Promise<any>;

  function OnInvoke(delegate: string, callback: (data: any) => void): void;
  const OnInvokeWeb: typeof OnInvoke;

  function InvokeWeb(delegate: string, data: any): void;
}

interface Window {
  cefQuery: (query: any) => void;
  NEON_Bridge_Web_Invoke: (method: string, data: any) => void;
}

export default NEON;
