"use client";

import { tripKeys } from "@/lib/hooks/useTrips";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

export function ClientRouterProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const queryClient = useQueryClient();

	useEffect(() => {
		// Handle all navigation
		const handleClick = (e: MouseEvent) => {
			const link = (e.target as HTMLElement).closest("a");
			if (!link) return;

			const href = link.getAttribute("href");
			if (!href) return;

			// Don't intercept external links or WordPress routes
			if (
				href.startsWith("http") ||
				href.startsWith("/wp-") ||
				href.startsWith("/my-account") ||
				href.includes("checkout") ||
				href.includes("cart")
			) {
				return;
			}

			e.preventDefault();

			// Pre-populate cache for known routes
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

			// Handle all other routes
			router.push(href);
		};

		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, [router, queryClient]);

	return <>{children}</>;
}
