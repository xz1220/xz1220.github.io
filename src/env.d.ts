interface ImportMetaEnv {
	readonly PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN?: string;
}

declare module "@pagefind/default-ui" {
	declare class PagefindUI {
		constructor(arg: unknown);
	}
}
