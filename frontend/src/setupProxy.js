const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req) => {
        console.log('Proxying request:', {
          method: req.method,
          path: req.path,
          target: 'http://localhost:5000' + req.path
        });
      }
    })
  );
}; 