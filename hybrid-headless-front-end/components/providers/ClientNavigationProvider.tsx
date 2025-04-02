"use client";

import { tripKeys } from "@/lib/hooks/useTrips";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

export function ClientNavigationProvider({
	children,
}: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const queryClient = useQueryClient();

	useEffect(() => {
		// Intercept all navigation events
		const handleClick = (e: MouseEvent) => {
			const link = (e.target as HTMLElement).closest("a");
			if (!link) return;

			const href = link.getAttribute("href");
			if (!href) return;

			// Don't intercept external links or special routes
			if (
				href.startsWith("http") ||
				href.startsWith("/wp-") ||
				href.startsWith("/my-account") ||
				href.includes("checkout")
			) {
				return;
			}

			e.preventDefault();

			// Handle trip detail pages
			if (href.startsWith("/trip/")) {
				const slug = href.split("/").pop();
				const cachedData = queryClient.getQueryData(
					tripKeys.detail(slug || ""),
				);
				if (cachedData) {
					router.push(href);
					return;
				}
			}

			// Handle trips listing page
			if (href === "/trips" || href === "/trips/") {
				const cachedData = queryClient.getQueryData(tripKeys.all);
				if (cachedData) {
					router.push(href);
					return;
				}
			}

			// Default navigation
			router.push(href);
		};

		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, [router, queryClient]);

	return <>{children}</>;
}
