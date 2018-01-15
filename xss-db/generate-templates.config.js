module.exports = {
  apps : [
    {
      name: 'generate-templates',
      interpreter: 'babel-node',
      script: './scripts/generate-templates.mjs',
      args: '0'
    }
  ]
};
