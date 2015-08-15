var StructuredChannel =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	"use strict";

	var REPLY_TYPE = "X-StructuredChannel-internal-reply";
	var HELLO_TYPE = "X-StructuredChannel-internal-hello";
	var ANY_ORIGIN = "*";

	function StructuredChannel(port, origin) {
	  this._handleMessage = this._handleMessage.bind(this);
	  this._handlers = new Map();
	  this._pendingMessages = new Map();
	  this._messageID = 0;
	  this._doDebug = false;

	  this.port = port;
	  this.port.addEventListener("message", this._handleMessage);
	  this.port.start();

	  this.origin = origin;
	}

	StructuredChannel.prototype = {
	  /**
	   * Prints a message to the console if this._doDebug is true.
	   * @private
	   *
	   */
	  _debug: function _debug() {
	    if (this._doDebug) {
	      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	      }

	      console.log.apply(console, ["DEBUG:"].concat(args));
	    }
	  },

	  /**
	   * Prints a warning message to the console.
	   * @private
	   */
	  _warn: function _warn() {
	    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      args[_key2] = arguments[_key2];
	    }

	    console.warn.apply(console, ["WARNING:"].concat(args));
	  },

	  /**
	   * Adds a handler for given message type.
	   *
	   * @param {String} type - The type of the message to handle.
	   * @param {Function} handler - The handler function.
	   */
	  on: function on(eventType, handler) {
	    if (this._handlers.has(eventType)) {
	      throw new Error("Multiple handlers registered for " + eventType);
	    }

	    this._handlers.set(eventType, handler);
	  },

	  /**
	   * Removes the handler for the message of given type.
	   *
	   * @param {String} type - The type of the message for which the handler is
	   * to be removed.
	   */
	  off: function off(eventType) {
	    if (!this._handlers.has(eventType)) {
	      this._warn("WARNING: Tried to unregister handler for", eventType, "that has no handler.");
	      return;
	    }

	    this._handlers["delete"](eventType);
	  },

	  /**
	   * Sends a message to the other side of the channel.
	   *
	   * @param {String} type - The type of the message.
	   * @param {Object} payload - The payload for the message. The value must
	   * support structured cloning.
	   * @param {Array} transfer - An array of values that are transferred to the
	   * target context.
	   *
	   * @return A Promise that is resolved once the receiver has handled the
	   * message. The resolution value will be the object the handler method
	   * returned. If the message handler fails, the promise is rejected.
	   */
	  send: function send(type, payload) {
	    var _this = this;

	    var data = {
	      id: this._messageID++,
	      payload: payload,
	      type: type
	    };

	    return new Promise(function (resolve, reject) {
	      _this._pendingMessages.set(data.id, { resolve: resolve, reject: reject });
	      _this.port.postMessage(data);
	    });
	  },

	  /**
	   * Handles the messages sent to this port.
	   *
	   * @private
	   */
	  _handleMessage: function _handleMessage(event) {
	    var _this2 = this;

	    if (this.origin !== ANY_ORIGIN && this.origin !== event.origin) {
	      this._warn("Got a message from unexpected origin", event.origin);
	      return;
	    }

	    var data = event.data.data;

	    this._debug("Got a message with data:", data);

	    var id = data.id;
	    var type = data.type;
	    var payload = data.payload;

	    if (!id || !type || typeof type !== "string" || !type.trim()) {
	      this._warn("Got an invalid message:", data);
	      return;
	    }

	    if (type === REPLY_TYPE) {
	      // This is a reply to a previous message. Resolve or reject the promise
	      // based on the result.
	      if (!this._pendingMessages.has(id)) {
	        this._debug("Ignoring an unexpected reply.");
	        return;
	      }

	      var _pendingMessages$get = this._pendingMessages.get(id);

	      var resolve = _pendingMessages$get.resolve;
	      var reject = _pendingMessages$get.reject;

	      if (data.error) {
	        this._debug("Received an error reply for message", id);
	        this._debug("Error was", data.error);
	        reject(data.error);
	      } else {
	        this._debug("Received a success reply for message", id);
	        this._debug("Result was", data.result);
	        resolve(data.result);
	      }

	      this._pendingMessages["delete"](id);
	      return;
	    }

	    var handler = this._handlers.get(type);
	    var handlerResult = null;
	    try {
	      if (handler) {
	        handlerResult = Promise.resolve(handler(payload));
	      } else {
	        this._warn("Received a message of type", type, "that has no handler.");
	        handlerResult = Promise.reject("Unhandled message " + type);
	      }
	    } catch (e) {
	      this._warn("Handler function failed:", e);
	      handlerResult = Promise.reject(e);
	    }

	    handlerResult.then(function (result) {
	      _this2.port.postMessage({ type: REPLY_TYPE, error: false, result: result, id: id });
	    }, function (err) {
	      _this2.port.postMessage({ type: REPLY_TYPE, error: err, id: id });
	    });
	  }
	};

	/**
	 * Opens a StructuredChannel to the given target. The target must load this
	 * script and call `StructuredChannel.waitForConnection()`.
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
	 * @return {StructuredChannel} A new `StructuredChannel` instance that can be
	 * used to communicate with the given target.
	 */
	StructuredChannel.connectTo = function (target, targetOrigin, global) {
	  if (typeof targetOrigin.MessageChannel === "function") {
	    // Second param is the global object, origin is undefined.
	    global = targetOrigin;
	    targetOrigin = undefined;
	  }

	  // Create the channel.
	  var channel = global ? new global.MessageChannel() : new MessageChannel();

	  // Initiate the connection.
	  if (target instanceof Window) {
	    var _origin = targetOrigin ? targetOrigin : ANY_ORIGIN;
	    target.postMessage(HELLO_TYPE, _origin, [channel.port2]);
	  } else {
	    target.postMessage(HELLO_TYPE, [channel.port2]);
	  }

	  return new StructuredChannel(channel.port1, origin);
	};

	/**
	 * Waits for a connection request from `StructuredChannel.connectTo()` to arrive
	 * as a message event to the given target.
	 *
	 * @param {String} [origin] - The origin from which the connection attemp should
	 * come from. If undefined, connection attempts and messages from all origins
	 * are allowed.
	 * @param {Window|Worker} [target] - The target window.
	 *
	 * @return {Promise} that is resolved with a `StructuredChannel` instace once
	 * the connection request is received.
	 */
	StructuredChannel.waitForConnection = function (origin, target) {
	  return new Promise(function (resolve, reject) {
	    var handler = function handler(ev) {
	      if (ev.data === HELLO_TYPE) {
	        target.onmessage = null;
	        resolve(new StructuredChannel(ev.ports[0]));
	      }
	    };

	    target.onmessage = handler;
	  });
	};

	module.exports = StructuredChannel;

/***/ }
/******/ ]);