import {MessageData, MessagePayload} from './types';
import {isGlobal} from './helpers';

const REPLY_TYPE = 'x-channel-internal-reply';
const HELLO_TYPE = 'x-channel-internal-hello';
const ANY_ORIGIN = '*';

class Channel {
  static debug = false;
  private _handlers: Map<string, any> = new Map();
  private _pendingMessages: Map<number, any> = new Map();
  private _messageId = 0;
  private port: MessagePort;

  /**
   * The StructuredChannel constructor that creates a wrapper around MessagePort
   * for sending and receiving messages.
   *
   * Users should not create instances themselves but instead use
   * waitForConnection() and connectTo() static methods.
   *
   * @constructor
   *
   * @param {MessagePort} port - The port this object wraps.
   */
  constructor(port: MessagePort) {
    this._handleMessage = this._handleMessage.bind(this);

    this.port = port;
    this.port.addEventListener('message', this._handleMessage);
    this.port.start();
  }

  /**
   * Prints a message to the console if this._doDebug is true.
   * @private
   */
  private _debug(...args) {
    if (Channel.debug) {
      return console.log('DEBUG:', ...args);
    }
  }

  /**
   * Prints a warning message to the console.
   * @private
   */
  private _warn(...args) {
    console.log('WARNING:', [...args].map(arg => JSON.stringify(arg)).join(' '));
  }

  /**
   * Handles the messages sent to this port.
   *
   * @private
   */
  private _handleMessage(event: MessageEvent) {
    const {data} = event;

    this._debug('Got a message with data:', data);

    const {id, type} = data;

    if (id === undefined || !type || typeof type !== 'string' || !type.trim()) {
      return this._warn('Got an invalid message:', data);
    }

    if (type === REPLY_TYPE) {
      // This is a reply to a previous message.
      return this._handleReply(data);
    } else {
      // This is a new message for the client to handle.
      return this._handleNewMessage(data);
    }
  }

  /**
   * Handles replies to previously sent message.
   *
   * @private
   */
  private _handleReply(data: MessageData) {
    const {id} = data;

    if (!this._pendingMessages.has(id)) {
      return this._debug('Ignoring an unexpected reply.');
    }

    const {resolve, reject} = this._pendingMessages.get(id);

    if (data.error) {
      this._debug('Received an error reply for message', id);
      this._debug('Error was', data.error);
      reject(data.error);
    } else {
      this._debug('Received a success reply for message', id);
      this._debug('Result was', data.result);
      resolve(data.result);
    }

    return this._pendingMessages.delete(id);
  }

  /**
   * Handles a new message.
   *
   * @private
   */
  private _handleNewMessage(data: MessageData) {
    const {id, type, payload} = data;
    const handler = this._handlers.get(type);
    let handlerResult = null;

    try {
      if (handler) {
        handlerResult = Promise.resolve(handler(payload));
      } else {
        this._warn('Received a message of type', type, 'that has no handler.');
        handlerResult = Promise.reject(`Unhandled message ${type}`);
      }
    } catch (e) {
      this._warn('Handler function failed:', e);
      handlerResult = Promise.reject(e.message || e.name || 'Unknown error');
    }

    const returnMessage: MessageData = {
      id,
      type: REPLY_TYPE
    };

    handlerResult
      .then(
        result => {
          this.port.postMessage({...returnMessage, result});
        },
        err => {
          this.port.postMessage({...returnMessage, error: err || 'Unknown error'});
        }
      )
      .catch(e => {
        // The return value could not be transferred or something else is horribly broken.
        this._warn('Reply could not be sent:', e);
        this.port.postMessage({...returnMessage, error: 'Reply failed'});
      });
  }

  /**
   * Adds a handler for given message type.
   *
   * @param {String} eventType - The type of the message to handle.
   * @param {Function} handler - The handler function. The return value will be
   * transferred back to the sender and the Promise returned by send() is
   * settled according to it. If the function throws, returns a Promise that
   * is eventually rejected or returns a value that cannot be transmitted to the
   * sender, the send() Promise rejects. If the function returns a value, the
   * send() Promise is fulfilled with that value. If the function returns a
   * Promise that is eventually fulfilled, the send() Promise is fulfilled with
   * the fulfillment value.
   */
  on(eventType: string, handler) {
    if (this._handlers.has(eventType)) {
      throw new Error(`Multiple handlers registered for ${eventType}`);
    }

    this._handlers.set(eventType, handler);
  }

  /**
   * Removes the handler for the message of given type.
   *
   * @param {String} eventType - The type of the message for which the handler is
   * to be removed.
   */
  off(eventType: string) {
    if (!this._handlers.has(eventType)) {
      return this._warn(
        'WARNING: Tried to unregister handler for',
        eventType,
        'that has no handler.'
      );
    }

    this._handlers.delete(eventType);
  }

  /**
   * Sends a message to the other side of the channel.
   *
   * @param {String} type - The type of the message.
   * @param {Object} payload - The payload for the message. The value must
   * support structured cloning.
   *
   * @return {Promise} A Promise that is resolved once the receiver has handled
   * the message. The resolution value will be the object the handler method
   * returned. If the other party fails to handle the message, the Promise is
   * rejected.
   */
  send(type: string, payload?: MessagePayload) {
    const data: MessageData = {
      id: this._messageId++,
      payload,
      type
    };

    return new Promise((resolve, reject) => {
      this._pendingMessages.set(data.id, {resolve, reject});
      this.port.postMessage(data);
    });
  }

  /**
   * Opens a Channel to the given target. The target must load call `Channel.waitForConnection()` on other end.
   *
   * @param {Window|Worker} target - The target window or a worker to connect to.
   * @param {String} [targetOrigin=*] - If the target is a Window, this is the
   * `targetOrigin` for [Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).
   * __Failing to provide this parameter might have security implications as the
   * channel could be opened to a malicious target.__ If the target is a Worker,
   * this parameter is ignored.
   * @param {Object} [global] - An optional global object that can be used to get
   * a reference to the MessageChannel constructor.
   *
   * @return {Promise} A Promise that is fulfilled with a `StructuredChannel`
   * instance once the connection has been established. The Promise is rejected on
   * error.
   *
   * @throws {TypeError} TypeError if @param target is undefined.
   *
   */
  static connectTo(
    target: Window | Worker,
    targetOrigin?: string | typeof globalThis,
    global?: typeof globalThis
  ) {
    if (!target) {
      return Promise.reject('Target must be defined.');
    }

    if (isGlobal(targetOrigin)) {
      // Second param is the global object, targetOrigin is undefined.
      global = targetOrigin;
      targetOrigin = undefined;
    }

    // Create the channel.
    const channel = global ? new global.MessageChannel() : new MessageChannel();
    const origin = !isGlobal(targetOrigin) ? targetOrigin : ANY_ORIGIN;

    // Initiate the connection.
    try {
      if ('document' in target) {
        // target looks like a Window. Check the origin and report a failure to the
        // user. postMessage just silently discards the message it if the origins
        // don't match.
        if (
          targetOrigin &&
          targetOrigin !== ANY_ORIGIN &&
          targetOrigin !== target.document.location.origin
        ) {
          return Promise.reject("The origins don't match.");
        }

        target.postMessage(HELLO_TYPE, origin, [channel.port2]);
      } else {
        // This is a worker.
        target.postMessage(HELLO_TYPE, [channel.port2]);
      }
    } catch (e) {
      target.postMessage(HELLO_TYPE, origin, [channel.port2]);
    }

    return new Promise(function (resolve, reject) {
      const chnl = new Channel(channel.port1);

      chnl.on('ready', () => {
        chnl.off('ready');
        chnl.off('error');
        resolve(chnl);
      });

      chnl.on('error', reason => {
        chnl.off('ready');
        chnl.off('error');
        reject(reason);
      });
    });
  }

  /**
   * Waits for a connection request from `StructuredChannel.connectTo()` to arrive
   * as a message event to the given target.
   *
   * @param {Window|Worker} [target] - The target that should receive the
   * connection attempt (default `self`).
   * @param {String} [origin] - The origin from which the connection attempt should
   * come from. If undefined or '*', connection attempts and messages from all
   * origins are allowed. __Failing to provide a specific origin might have
   * security implications as malicious parties could establish a connection to
   * this target.__
   *
   * @return {Promise} that is resolved with a `StructuredChannel` instance once
   * the connection request is received.
   */
  static waitForConnection(target: Worker | Window = self, origin?: string) {
    return new Promise(resolve => {
      const handler = (event: MessageEvent) => {
        if (event.data !== HELLO_TYPE) {
          return;
        }

        const channel = new Channel(event.ports[0]);

        // Enforce origin restrictions.
        if (origin && origin !== ANY_ORIGIN && origin !== event.origin) {
          return channel.send('error', 'Disallowed origin.');
        }

        target.onmessage = null;

        channel.send('ready');
        resolve(channel);
      };

      target.onmessage = handler;
    });
  }
}

export default Channel;
