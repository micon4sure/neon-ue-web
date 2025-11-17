declare global {
  interface Window {
    ue: {
      neon: {
        invoke: (payload: string) => Promise<string | void>;
      };
    }
    NEON_Bridge_Web_Invoke: (delegate: string, data: any) => void;
  }
}

// Define the NEON API
namespace NEON {
  export function invokeUnrealEvent(delegate: string, data: object = {}) {
    return NEON_Bridge_Unreal.invokeUnrealEvent(delegate, data);
  }
  export const invokeUnreal = invokeUnrealEvent;

  export function invokeUnrealFunction(delegate: string, data: object = {}): Promise<any> {
    return NEON_Bridge_Unreal.invokeUnrealFunction(delegate, data);
  }

  export function onInvoke(delegate: string, callback: (data: any) => void) {
    NEON_Bridge_Web.registerCallback(delegate, callback);
  }

  export function invoke(delegate: string, data: any) {
    NEON_Bridge_Web.invoke(delegate, data);
  }

  export function setVerbose(verbose: boolean) {
    Log.setVerbose(verbose);
  }
}
class Log {
  private static verbose = false;

  static setVerbose(verbose: boolean) {
    Log.verbose = verbose;
  }

  static info(...args: any[]) {
    if (!Log.verbose)
      return
    console.log(`[NEON]`, ...args);
  }

  static error(...args: any[]) {
    console.error(`[NEON]`, ...args);
  }
}


export class NEON_Bridge_Web {

  private static callbacks: { [id: string]: (data: any) => void } = {};

  public static registerCallback(id: string, callback: (data: any) => void) {
    Log.info('Registering NEON callback', id);
    NEON_Bridge_Web.callbacks[id] = callback;
  }

  static invoke(id: string, data: any = {}) {
    let payload: any;
    if (typeof data === 'string') {
      try {
        payload = JSON.parse(data);
      } catch (e) {
        Log.error('Invoke NEON web callback failed: data is not JSON parseable: ', data);
        return;
      }
    } else {
      payload = data;
    }

    if (!NEON_Bridge_Web.callbacks[id]) {
      Log.error(`Invoke NEON web callback failed: callback not found: ${id}`);
      return;
    }

    Log.info('Invoke NEON web callback', id, payload);
    NEON_Bridge_Web.callbacks[id](payload);
  }
}

// Define the NEON Bridge to be called from Web
class NEON_Bridge_Unreal {
  static invokeUnreal(delegate: string, data: any): Promise<void> {
    return NEON_Bridge_Unreal.invokeUnrealEvent(delegate, data);
  }


  private static async invokeNative(type: 'function' | 'event', delegate: string, data: any): Promise<string> {
    if (!window.ue.neon) {
      throw new Error('NEON bridge is not available on window.neon');
    }
    if (window.ue.neon.invoke === undefined) {
      throw new Error('NEON bridge invoke method is not available on window.ue.neon.invoke');
    }
    const nativeBridge = window.ue.neon;
    const payload = JSON.stringify({
      type,
      delegate,
      parameters: data ?? {}
    });

    try {
      const response = await nativeBridge.invoke(payload);
      if (typeof response === 'string') {
        return response;
      }
      if (response === undefined || response === null) {
        return '';
      }
      return JSON.stringify(response);
    } catch (error) {
      Log.error(`NEON.invokeNative[${delegate}] failed`, error);
      throw new Error('NEON bridge invocation failed');
    }
  }

  static async invokeUnrealFunction(delegate: string, data: any = {}): Promise<any> {
    if (!delegate) {
      Log.error('NEON.invokeUnrealFunction failed: delegate is required');
      return Promise.reject('Delegate is required');
    }

    const methodName = `Invoke_${delegate}`;
    Log.info('NEON.invokeUnrealFunction', methodName, data);

    const response = await NEON_Bridge_Unreal.invokeNative('function', methodName, data);
    console.log('NEON.invokeUnrealFunction response:', response);

    try {
      return JSON.parse(response);
    } catch (e) {
      Log.error(`NEON.invokeUnrealFunction[${methodName}] failed to parse response: ${response}`);
      throw new Error('Failed to parse response from Unreal');
    }
  }

  static async invokeUnrealEvent(delegate: string, data: any = {}): Promise<void> {
    if (!delegate) {
      Log.error('NEON.invokeUnrealEvent failed: delegate is required');
      return Promise.reject('Delegate is required');
    }

    const methodName = `OnInvoke_${delegate}`;
    Log.info('NEON.invokeUnrealEvent', methodName, data);

    await NEON_Bridge_Unreal.invokeNative('event', methodName, data);
  }
}

// Define the NEON Bridge to be called from Unreal
window.NEON_Bridge_Web_Invoke = NEON.invoke;


export default NEON;