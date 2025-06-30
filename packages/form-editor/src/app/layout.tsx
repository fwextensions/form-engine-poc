import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Form Editor",
	description: "Live editor for form schemas",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full">
		<head>
			<link rel="icon"
				type="image/png"
				href="https://housing.sfgov.org/assets/favicon-32x32-c7697ffee1e31d810b8063feaf8c67c7b2c906b489f13fabf69d59a386a9c9d0.png"
			/>
		</head>
		<body className="h-full">{children}</body>
		</html>
	);
}
