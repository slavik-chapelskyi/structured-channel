describe('StructuredChannel.default.waitForConnection()', function () {
  it('should return a working channel', function () {
    return createChannelPair().then(function (channels) {
      expect(channels.child).to.be.defined;
      expect(channels.child).to.be.instanceof(StructuredChannel.default);
    });
  });

  it('should work with implicit target', function () {
    StructuredChannel.default.connectTo(window);

    return StructuredChannel.default.waitForConnection();
  });

  it('should work with origin = *', function () {
    StructuredChannel.default.connectTo(window);

    return StructuredChannel.default.waitForConnection(window, '*');
  });

  it('should send an error when origin does not match', function () {
    StructuredChannel.default.waitForConnection(window, 'http://abc.com:1234');

    return expectRejection(StructuredChannel.default.connectTo(window));
  });

  it('should ignore messages it does not know about', function () {
    var op = StructuredChannel.default.waitForConnection(window, '*');

    // Send a random message first.
    window.postMessage('not-a-hello', '*');

    // Then send the connection request.
    StructuredChannel.default.connectTo(window);

    return op;
  });
});
