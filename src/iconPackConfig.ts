export const iconPackConfig = [
    {
      prefix: 'logos',
      pack: '@iconify-json/logos', 
    },
    {
      prefix: 'mdi',
      pack: '@iconify-json/mdi',
    }
  ];
  
  export const requireIconPack = require.context(
    '@iconify-json', 
    true,            
    /^\.\/(logos|mdi)$/, 
  );