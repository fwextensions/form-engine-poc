/** @type {import("next").NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	async rewrites()
	{
		return [
			{
				source: "/api/:path*",
				destination: "https://housing.sfgov.org/api/:path*",
			},
		];
	},
};

module.exports = nextConfig;
