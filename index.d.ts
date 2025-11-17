/// <reference types="vite/client" />

declare namespace NEON {
  function invokeUnrealEvent(delegate: string, data?: object): Promise<void>;
  function invokeUnrealFunction(delegate: string, data?: object): Promise<any>;
  const invokeUnreal: typeof invokeUnrealEvent;

  function onInvoke(delegate: string, callback: (data: any) => void): void;
  function invoke(delegate: string, data: any): void;
  function setVerbose(verbose: boolean): void;
}

interface Window {
  ue: {
    neon: {
      invoke: (payload: string) => Promise<string | void>;
    }
  };
  NEON_Bridge_Web_Invoke: (method: string, data: any) => void;
}

export default NEON;
