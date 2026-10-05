// Mother-Root Test Suite

const mothRoot = require('../src/index');

describe('Mother-Root', () => {
  test('should have version', () => {
    expect(mothRoot.version).toBeDefined();
    expect(mothRoot.version).toBe('0.1.0');
  });

  test('should initialize without errors', () => {
    expect(() => {
      require('../src/index');
    }).not.toThrow();
  });
});
