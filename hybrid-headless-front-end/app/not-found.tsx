"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NotFound() {
	const router = useRouter();

	useEffect(() => {
		// Get the current path
		const path = window.location.pathname;
		// Redirect to our catch-all handler
		router.push(path);
	}, [router]);

	// Show nothing while redirecting
	return null;
}
