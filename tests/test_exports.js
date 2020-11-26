describe('structuredChannel', function () {
  it('should be exported to the global scope', function () {
    expect(StructuredChannel).to.be.defined;
    expect(StructuredChannel).to.be.function;
    expect(StructuredChannel.default.connectTo).to.be.function;
    expect(StructuredChannel.default.waitForConnection).to.be.function;
  });
});
