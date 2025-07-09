/// <reference types="vite/client" />

declare module '*.txt?raw' {
	const content: string;
	export default content;
}

declare module '*.txt' {
	const content: string;
	export default content;
}
