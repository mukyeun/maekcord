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

      // 개발 환경에서 청크 분할 최적화
      if (env === 'development') {
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
                reuseExistingChunk: true,
              },
              antd: {
                test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
                name: 'antd',
                chunks: 'all',
                priority: 20,
                reuseExistingChunk: true,
              },
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                name: 'react',
                chunks: 'all',
                priority: 30,
                reuseExistingChunk: true,
              },
            },
          },
        };
      }

      // Ant Design 아이콘 청크 로딩 문제 해결
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        alias: {
          ...webpackConfig.resolve.alias,
          '@': path.resolve(__dirname, 'src'),
          '@components': path.resolve(__dirname, 'src/components'),
          '@pages': path.resolve(__dirname, 'src/pages'),
          '@utils': path.resolve(__dirname, 'src/utils'),
          '@hooks': path.resolve(__dirname, 'src/hooks'),
          '@store': path.resolve(__dirname, 'src/store'),
          '@api': path.resolve(__dirname, 'src/api'),
          '@config': path.resolve(__dirname, 'config'),
        },
        forceCase: false // 대소문자 구분 비활성화
      };

      // 청크 로딩 실패 시 재시도 설정
      webpackConfig.output = {
        ...webpackConfig.output,
        chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
        filename: 'static/js/[name].[contenthash:8].js',
      };

      // 청크 로딩 최적화
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        runtimeChunk: 'single',
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };

      // Ant Design 아이콘 청크 로딩 문제 완전 해결
      webpackConfig.module.rules.push({
        test: /[\\/]node_modules[\\/]@ant-design[\\/]icons[\\/]/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      });

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