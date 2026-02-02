export const iconPacks = [
    {
        name: 'logos',
        loader: () => import('@iconify-json/logos').then(m => m.icons),
    },
    {
        name: 'mdi',
        loader: () => import('@iconify-json/mdi').then(m => m.icons),
    },
];  