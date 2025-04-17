export const iconPackConfig = [
    {
        prefix: 'logos',
        pack: '@iconify-json/logos',
    },
    {
        prefix: 'material-symbols',
        pack: '@iconify-json/material-symbols',
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
