"use client";

import {
	Accordion,
	Alert,
	Box,
	Paper,
	Text,
	ThemeIcon,
	Title,
} from "@mantine/core";
import {
	IconBulb,
	IconCompass,
	IconFriends,
	IconHeartHandshake,
	IconMap,
	IconMoodSmile,
	IconRun,
	IconShield,
	IconTools,
	IconWash,
} from "@tabler/icons-react";
import React, { useEffect, useState } from "react";

export function TripObjectionHandling() {
	const [activeItem, setActiveItem] = useState<string | null>(null);

	// Handle hash changes for direct linking
	useEffect(() => {
		// Function to open accordion item based on hash
		const handleHashChange = () => {
			const hash = window.location.hash.replace("#", "");
			if (hash) {
				setActiveItem(hash);

				// Add a slight delay to ensure the accordion has time to open
				setTimeout(() => {
					// Find the accordion item and scroll to it
					const element = document.getElementById(`accordion-${hash}`);
					if (element) {
						element.scrollIntoView({ behavior: "smooth", block: "start" });
					}
				}, 100);
			}
		};

		// Initial check on mount
		handleHashChange();

		// Listen for hash changes
		window.addEventListener("hashchange", handleHashChange);

		// Cleanup
		return () => {
			window.removeEventListener("hashchange", handleHashChange);
		};
	}, []);

	return (
		<Paper withBorder p="md" radius="md" mt="md">
			<Title order={2} mb="md">
				Common Questions About First-Time Caving
			</Title>

			<Alert
				icon={<IconFriends size={16} />}
				title="Never done this before?"
				color="blue"
				mb="lg"
			>
				<Text>
					That's perfect! These trips are specifically designed for
					first-timers. Most people on these trips have never been caving before
					and don't know anyone else - you'll be in great company with other
					beginners just like you!
				</Text>
			</Alert>

			<Accordion value={activeItem} onChange={setActiveItem}>
				<Accordion.Item value="claustrophobia" id="accordion-claustrophobia">
					<Accordion.Control icon={<IconCompass size={16} />}>
						<Text fw={500}>What about claustrophobia?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							Good news! Our beginner trips only visit caves with large and
							spacious passages. Many of the main chambers are so large you
							could park several cars inside them! You don't often get
							claustrophobic in everyday situations like the inside of your car
							or your bedroom closet, right? The passages we explore are
							comparable to these familiar spaces - often much larger! Think of
							it like exploring an interesting building than anything confining.
							Our leaders are always nearby to offer reassurance and support.
							Many people who initially worried, tell us afterward that they
							felt completely at ease throughout the entire experience - and
							were amazed by the sense of peaceful spaciousness they found
							underground!
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="dark" id="accordion-dark">
					<Accordion.Control icon={<IconBulb size={16} />}>
						<Text fw={500}>Fear of the dark?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							The cave is actually well-lit during our trips! Everyone wears
							high-quality LED headlamps that cast impressive beams, and leaders
							carry powerful backup lights too. With our group moving through
							together, there's a wonderful ambient glow that illuminates the
							fascinating rock formations. Many participants tell us they're
							amazed by how clearly they can see everything.
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="stuck" id="accordion-stuck">
					<Accordion.Control icon={<IconMoodSmile size={16} />}>
						<Text fw={500}>Worried about getting stuck?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							That's a common worry, but our beginner routes are specifically
							chosen to be comfortable walking passages with no tight squeezes
							whatsoever. Our experienced leaders have taken many many people
							through these exact routes and know every inch of the path. We
							maintain a supportive, no-pressure atmosphere where the group
							stays together, and nobody ever gets left behind or put in an
							uncomfortable position.
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="falling" id="accordion-falling">
					<Accordion.Control icon={<IconShield size={16} />}>
						<Text fw={500}>Concerned about falling or injury?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							Safety is our absolute priority! That's why everyone wears proper
							helmets and sturdy footwear with excellent grip. Interestingly,
							caves often provide more secure footing than outdoor trails -
							there's no loose scree or slippery grass. Our leaders always point
							out the best places to step and offer a helping hand on any
							slightly challenging sections.
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="creatures" id="accordion-creatures">
					<Accordion.Control icon={<IconFriends size={16} />}>
						<Text fw={500}>What about creatures in the cave?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							Most people are surprised by how few creatures actually live in
							caves! While the entrance might have a few ordinary insects, the
							deeper cave environment is too resource-poor for most animals. The
							few cave-adapted creatures that do exist are typically tiny, rare,
							and fascinating rather than frightening. Many of our trips
							encounter no wildlife at all - it's one of the most peaceful
							environments you can experience!
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="lost" id="accordion-lost">
					<Accordion.Control icon={<IconMap size={16} />}>
						<Text fw={500}>Afraid of getting lost?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							Our beginner trips follow well-established routes that our guides
							have traversed countless times. We use a leader and seconder
							system and maintain constant communication throughout the group.
							Our leaders are trained in cave navigation and carry multiple
							backup light sources and emergency equipment. You can relax and
							enjoy the experience while we handle all the navigation!
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="firsttimer" id="accordion-firsttimer">
					<Accordion.Control icon={<IconCompass size={16} />}>
						<Text fw={500}>Never done this before and don't know anyone?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							That's perfect! These trips are specifically designed for
							first-timers. Most people on these trips have never been caving
							before and don't know anyone else - you'll be in great company
							with other beginners just like you!
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="fitness" id="accordion-fitness">
					<Accordion.Control icon={<IconRun size={16} />}>
						<Text fw={500}>What about the physical demands?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							These beginner trips are designed to be accessible to people with
							below-average fitness levels. If you can climb a flight of stairs
							and walk slowly for about 30 minutes, you'll do great! We take a
							gentle pace with regular rest stops to admire the cave features.
							Many participants tell us it's less physically demanding than they
							expected - more like a leisurely geology walk with a few moments
							of gentle adventure!
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="dirty" id="accordion-dirty">
					<Accordion.Control icon={<IconWash size={16} />}>
						<Text fw={500}>Will I get dirty or wet?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							Getting a bit muddy is part of the fun! We provide full protective
							oversuits to protect you and your clothes. Many participants
							discover an unexpected joy in this temporary freedom from keeping
							spotless - it's surprisingly liberating! The caves maintain a
							constant, mild temperature year-round, so you'll actually be more
							comfortable than in many outdoor activities regardless of the
							weather.
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="equipment" id="accordion-equipment">
					<Accordion.Control icon={<IconTools size={16} />}>
						<Text fw={500}>What about equipment?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							We provide absolutely everything you need - properly certified
							helmets, reliable lighting systems, protective clothing, and
							appropriate footwear if needed. Our equipment is well maintained,
							regularly inspected, and adheres to British Caving Association
							best practice. Before entering the cave, our leaders ensure
							everyone's gear is properly fitted and working perfectly. Many
							beginners tell us they feel like proper adventurers once they're
							kitted up!
						</Text>
					</Accordion.Panel>
				</Accordion.Item>

				<Accordion.Item value="danger" id="accordion-danger">
					<Accordion.Control icon={<IconHeartHandshake size={16} />}>
						<Text fw={500}>Isn't caving dangerous?</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Text>
							Not at all! Beginner caving with our group is actually
							significantly safer than many common recreational activities.
							Statistics show it's less risky than horse riding, rugby,
							bouldering, mountain biking, and many other widely enjoyed
							adventure sports.
						</Text>
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>
		</Paper>
	);
}
