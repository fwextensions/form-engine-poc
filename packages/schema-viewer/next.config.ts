import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	transpilePackages: ["form-engine"],
	webpack: (config, { isServer }) => {
		config.module.rules.push({
			test: /\.yaml$/,
			use: "yaml-loader",
		});
		return config;
	},
	// Updated Turbopack configuration location
	turbopack: {
		rules: {
			// Match all .yaml files
			"**/*.yaml": {
				// Specify the loader to use
				loaders: ["yaml-loader"],
				// Define what the loader transforms the file into (a JS module)
				as: "*.js",
			},
		},
	},
};

export default nextConfig;
