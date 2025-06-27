const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // 번들 분석을 위한 설정
      if (env === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
              },
              antd: {
                test: /[\\/]node_modules[\\/]antd[\\/]/,
                name: 'antd',
                chunks: 'all',
                priority: 20,
              },
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                name: 'react',
                chunks: 'all',
                priority: 30,
              },
            },
          },
        };
      }

      // 경로 별칭 설정
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@api': path.resolve(__dirname, 'src/api'),
        '@config': path.resolve(__dirname, 'config'),
      };

      return webpackConfig;
    },
  },
  
  babel: {
    plugins: [
      // 프로덕션에서 console.log 제거
      env === 'production' && [
        'transform-remove-console',
        { exclude: ['error', 'warn'] }
      ],
    ].filter(Boolean),
  },
}; 