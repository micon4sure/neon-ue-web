/// <reference types="vite/client" />

declare namespace NEON {
  function invokeUnrealEvent(delegate: string, data?: object): void;
  function invokeUnrealFunction(delegate: string, data?: object): Promise<any>;
  const invokeUnreal: typeof invokeUnrealEvent;

  function onInvoke(delegate: string, callback: (data: any) => void): void;
}

interface Window {
  cefQuery: (query: any) => void;
  NEON_Bridge_Web_Invoke: (method: string, data: any) => void;
}

export default NEON;
