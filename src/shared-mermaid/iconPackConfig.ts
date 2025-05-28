// Add webpack-specific type declaration
interface RequireContext {
	(id: string): unknown;
	keys(): string[];
	resolve(id: string): string;
	id: string;
}

declare const require: NodeRequire & {
	context(directory: string, useSubdirectories: boolean, regExp: RegExp): RequireContext;
};

export const iconPackConfig = [
	{
		prefix: 'logos',
		pack: '@iconify-json/logos',
	},
	{
		prefix: 'mdi',
		pack: '@iconify-json/mdi',
	},
	{
		prefix: 'aws',
		pack: '@local/iconify-aws',
	}
];

export const requireIconPack = require.context(
	'@iconify-json',
	true,
	/^\.\/(logos|mdi)$/,
);

export const requireLocalIconPack = require.context(
	'../iconify-packages',
	true,
	/^\.\/aws\/icons\.json$/,
);
