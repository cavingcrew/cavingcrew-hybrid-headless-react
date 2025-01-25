"use client";

import dynamic from "next/dynamic";
import React from "react";
import { LoadingState } from "../../components/ui/LoadingState";

const CatchAllContent = dynamic(
	() => import("./CatchAllContent").then((mod) => mod.CatchAllContent),
	{
		loading: () => <LoadingState />,
		ssr: false,
	},
);

export default function CatchAllPage() {
	return <><p>ALERT ALERT</p><CatchAllContent /></>;
}
