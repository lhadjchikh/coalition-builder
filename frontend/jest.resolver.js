const path = require('path');
const { createRequire } = require('module');

module.exports = (request, options) => {
  // If the request is coming from the shared directory and is looking for react modules,
  // resolve them from the frontend's node_modules
  if (
    options.basedir.includes('shared') &&
    (request.startsWith('react') || request.startsWith('@types/react'))
  ) {
    try {
      const frontendRequire = createRequire(path.join(__dirname, 'package.json'));
      return frontendRequire.resolve(request);
    } catch (error) {
      // Fall back to default resolution
    }
  }

  // Default resolution
  return options.defaultResolver(request, options);
};
