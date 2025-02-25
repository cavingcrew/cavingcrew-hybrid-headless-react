"use client";

import { Text } from "@mantine/core";
import React, { useEffect, useState } from "react";

export function CountdownTimer({ targetDate }: { targetDate: Date | null }) {
	const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

	function calculateTimeLeft() {
		if (!targetDate) return null;

		const now = new Date().getTime();
		const targetTime = targetDate.getTime();
		const difference = targetTime - now;

		if (difference <= 0) return null;

		return {
			days: Math.floor(difference / (1000 * 60 * 60 * 24)),
			hours: Math.floor(
				(difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
			),
			minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
			seconds: Math.floor((difference % (1000 * 60)) / 1000),
		};
	}

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft());
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	if (!timeLeft) return <Text component="span">soon</Text>;

	return (
		<Text component="span" fw={500}>
			in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
		</Text>
	);
}
