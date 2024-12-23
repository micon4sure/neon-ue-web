// Define the NEON API
namespace NEON {
  let loggingEnabled = true;

  export function setLoggingEnabled(enabled: boolean) {
    console.log('NEON logging set to', enabled ? 'enabled' : 'disabled');
    loggingEnabled = enabled;
  }

  export function log(...args: any[]) {
    if (loggingEnabled) {
      console.log(...args);
    }
  }

  export function error(...args: any[]) {
    if (loggingEnabled) {
      console.error(...args);
    }
  }

  export function InvokeUnrealEvent(delegate: string, data: object = {}) {
    return NEON_Bridge_Unreal.invokeUnrealEvent(delegate, data);
  }
  export const InvokeUnreal = InvokeUnrealEvent;

  export function InvokeUnrealFunction(delegate: string, data: object = {}): Promise<any> {
    return NEON_Bridge_Unreal.invokeUnrealFunction(delegate, data);
  }

  export function OnInvoke(delegate: string, callback: (data: any) => void) {
    NEON_Bridge_Web.registerCallback(delegate, callback);
  }
  export const OnInvokeWeb = OnInvoke;

  export function InvokeWeb(delegate: string, data: any) {
    NEON_Bridge_Web.invoke(delegate, data);
  }
}

// Define the NEON Bridge to be called from Unreal
window.NEON_Bridge_Web_Invoke = (method: string, data: any) => {
  NEON_Bridge_Web.invoke(method, data);
}

class NEON_Bridge_Web {

  private static callbacks: { [id: string]: (data: object) => void } = {};

  public static registerCallback(id: string, callback: (data: object) => void) {
    NEON.log('Registering NEON callback', id);
    NEON_Bridge_Web.callbacks[id] = callback;
  }

  static invoke(id: string, dataRaw: string = '{}') {
    let data: object;
    try {
      data = JSON.parse(dataRaw)
    } catch (e) {
      NEON.error('Invoke NEON web callback failed: data is not JSON parseable: ', data);
      return;
    }

    if (!NEON_Bridge_Web.callbacks[id]) {
      NEON.error(`Invoke NEON web callback failed: callback not found: ${id}`);
      return;
    }

    NEON.log('Invoke NEON web callback', id, data);
    NEON_Bridge_Web.callbacks[id](data);
  }
}

// Define the NEON Bridge to be called from Web
class NEON_Bridge_Unreal {

  static invokeUnreal(delegate: string, data: any): Promise<void> {
    return NEON_Bridge_Unreal.invokeUnrealEvent(delegate, data);
  }

  static invokeUnrealFunction(delegate: string, data: any): Promise<object> {
    if (!delegate) {
      NEON.error('NEON.invokeUnrealFunction failed: delegate is required');
      return Promise.reject({ errorCode: 101, errorMessage: 'Delegate is required' });
    }

    delegate = 'Invoke_' + delegate;
    NEON.log('NEON.invokeUnrealFunction', delegate, data);

    return new Promise<object>((resolve, reject) => {
      if (!window.cefQuery) {
        NEON.error('NEON.invokeUnrealFunction failed: cefQuery is not defined');
        return reject({ errorCode: 103, errorMessage: 'cefQuery is not defined' });
      }
      window.cefQuery({
        request: JSON.stringify({
          type: 'function',
          delegate,
          parameters: data
        }),
        onSuccess: function (response) {
          NEON.log(`NEON.invokeUnrealFunction[${delegate}] succeeded: ${response}`);
          try {
            const result = JSON.parse(response);
            resolve(result);
          } catch (e) {
            NEON.error(`NEON.invokeUnrealFunction[${delegate}] failed to parse response: ${response}`);
            reject({ errorCode: 102, errorMessage: 'Failed to parse response' })
          }
        },
        onFailure: function (errorCode, errorMessage) {
          NEON.error(`NEON.invokeUnrealFunction[${delegate}] failed: ${errorCode} - ${errorMessage}`);
          reject({ errorCode, errorMessage });
        }
      });
    });
  }

  static invokeUnrealEvent(delegate: string, data = {}): Promise<void> {
    if (!delegate) {
      NEON.error('NEON.invokeUnrealFunction failed: delegate is required');
      return Promise.reject({ errorCode: 101, errorMessage: 'Delegate is required' });
    }
    delegate = 'OnInvoke_' + delegate;
    NEON.log('NEON.invokeUnrealEvent', delegate, data);

    return new Promise<any>((resolve, reject) => {
      if (!window.cefQuery) {
        NEON.error('NEON.invokeUnrealFunction failed: cefQuery is not defined');
        return reject({ errorCode: 103, errorMessage: 'cefQuery is not defined' });
      }
      window.cefQuery({
        request: JSON.stringify({
          type: 'event',
          delegate,
          parameters: data
        }),
        onSuccess: function (response) {
          NEON.log(`NEON.invokeUnrealEvent[${delegate}] succeeded.`);
          resolve(null);
        },
        onFailure: function (errorCode, errorMessage) {
          NEON.error(`NEON.invokeUnrealEvent failed: ${errorCode} - ${errorMessage}`);
          reject({ errorCode, errorMessage });
        }
      });
    });
  }
}

export default NEON;