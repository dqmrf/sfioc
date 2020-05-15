const config = {
  presets: [
    [
      '@babel/preset-env',
      {
        "targets": {
          "browsers": "last 2 versions",
          "node": "8.0.0"
        }
      }
    ]
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-function-sent',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-export-namespace-from',
    ['@babel/plugin-syntax-decorators', { 'legacy': true }],
    ['@babel/plugin-proposal-decorators', { 'legacy': true }],
    ['@babel/plugin-proposal-class-properties', { 'loose': true }]
  ]
}

module.exports = config;
