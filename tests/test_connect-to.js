describe('StructuredChannel.default.connectTo()', function () {
  function ensureConnected(channel) {
    return channel.send('ping', 'abc').then(function (reply) {
      expect(reply).to.equal('abc');
    });
  }

  it('should reject if target not defined', function () {
    return expectRejection(StructuredChannel.default.connectTo());
  });

  /** Window tests **/
  it('should connect to a Window with a target only', function () {
    return initializeFrame()
      .then(function (target) {
        return StructuredChannel.default.connectTo(target);
      })
      .then(ensureConnected);
  });

  it('should connect to a Window with target + targetOrigin', function () {
    return initializeFrame()
      .then(function (target) {
        return StructuredChannel.default.connectTo(target, target.document.location.origin);
      })
      .then(ensureConnected);
  });

  it('should connect to a same-origin Window with targetOrigin *', function () {
    return initializeFrame()
      .then(function (target) {
        return StructuredChannel.default.connectTo(target, '*');
      })
      .then(ensureConnected);
  });

  it('should connect to a Window with global as second argument', function () {
    return initializeFrame()
      .then(function (target) {
        return StructuredChannel.default.connectTo(target, window);
      })
      .then(ensureConnected);
  });

  it('should connect to a Window with targetOrigin + global', function () {
    return StructuredChannel.default
      .connectTo(initializeWorker(), '*', window)
      .then(ensureConnected);
  });

  it('should reject connection to Window if origin does not match', function () {
    return initializeFrame().then(function (target) {
      return expectRejection(StructuredChannel.default.connectTo(target, 'http://no.com:123'));
    });
  });

  /** Worker tests **/
  it('should connect to a Worker with a target only', function () {
    return StructuredChannel.default.connectTo(initializeWorker()).then(ensureConnected);
  });

  it('should connect to a Worker with target + targetOrigin', function () {
    return StructuredChannel.default.connectTo(initializeWorker(), 'foobar').then(ensureConnected);
  });

  it('should connect to a Worker with global as second argument', function () {
    return StructuredChannel.default.connectTo(initializeWorker(), window).then(ensureConnected);
  });

  it('should connect to a Worker with targetOrigin + global', function () {
    return StructuredChannel.default
      .connectTo(initializeWorker(), 'obm', window)
      .then(ensureConnected);
  });
});
