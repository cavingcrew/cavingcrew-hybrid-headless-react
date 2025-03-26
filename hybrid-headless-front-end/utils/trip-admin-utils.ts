/**
 * Utility functions for trip administration
 */
import type { Trip, TripParticipant } from "../types/api";

/**
 * Generate callout text for a trip
 * @param trip The trip object
 * @param participants List of trip participants
 * @returns Formatted callout text
 */
export const generateCalloutText = (trip: Trip, participants: TripParticipant[]): string => {
	// Get current time
	const now = new Date();

	// Calculate callout time (now + route duration * 1.25)
	const routeDuration = trip.route?.acf?.route_time_for_eta
		? Number(trip.route.acf.route_time_for_eta)
		: 4; // Default to 4 hours if not specified
	const calloutTimeMs = now.getTime() + routeDuration * 1.25 * 60 * 60 * 1000;
	const calloutTime = new Date(calloutTimeMs);

	// Calculate ETA (callout time - 1 hour)
	const etaTimeMs = calloutTimeMs - 60 * 60 * 1000;
	const etaTime = new Date(etaTimeMs);

	// Format times
	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Get cave and location information
	const getLocationName = () => {
		// For overnight trips, use the hut location
		if (trip.acf.event_type === "overnight") {
			if (trip.hut?.hut_location?.post_title) {
				return trip.hut.hut_location.post_title;
			}
			return trip.acf.event_location || trip.acf.event_cave_name || "";
		}

		// For other trips
		if (trip.route?.acf?.route_entrance_location_id?.title) {
			const locationTitle = trip.route.acf.route_entrance_location_id.title;
			const parkingLatLong =
				trip.route?.acf?.route_entrance_location_id?.acf
					?.location_parking_latlong;
			let city = "";

			// Check if parkingLatLong is an object with city property
			if (
				parkingLatLong &&
				typeof parkingLatLong === "object" &&
				"city" in parkingLatLong
			) {
				city = parkingLatLong.city || "";
			}

			if (city) {
				return `${locationTitle} near ${city}`;
			}
			return locationTitle;
		}

		if (trip.acf.event_cave_name) {
			if (trip.acf.event_possible_location) {
				return `${trip.acf.event_cave_name} near ${trip.acf.event_possible_location}`;
			}
			return trip.acf.event_cave_name;
		}

		return trip.acf.event_location || trip.acf.event_possible_location || "";
	};

	// Get route name
	const routeName =
		trip.route?.acf?.route_name || trip.acf.event_possible_objectives || "";

	// Get parking location
	const getParkingLocation = () => {
		if (
			trip.route?.acf?.route_entrance_location_id?.acf?.location_parking_latlong
		) {
			const parking =
				trip.route.acf.route_entrance_location_id.acf.location_parking_latlong;
			if (typeof parking === "object" && parking.lat && parking.lng) {
				return `${parking.lat},${parking.lng}`;
			}
			return String(parking);
		}
		return "";
	};

	// Import the cleanTackle function from trip-participant-utils
	const cleanTackle = (tackleRequired: string): string => {
		return (
			tackleRequired
				// Replace paragraph tags with newlines
				.replace(/\n/g, "")
				.replace(/<p>/g, "")
				.replace(/<\/p>/g, "\n")
				// Replace <br /> tags with newlines
				.replace(/<br\s*\/?>/g, "\n")
				// Remove any other HTML tags
				.replace(/<[^>]*>/g, "\n")
				// Trim extra whitespace
				.replace(/\n{3,}/g, "")
				.trim()
		);
	};

	// Get signed up participants
	const signedUpParticipants = participants.filter((p) => {
		const status = determineSignupStatus(p);
		return status === "Signed Up";
	});

	const participantNames = signedUpParticipants
		.map((p) => p.first_name)
		.join(", ");
	const participantCount = signedUpParticipants.length;

	// Get car registrations
	const carRegistrations = signedUpParticipants
		.map(
			(p) =>
				p.meta?.["admin-car-registration"] ||
				p.admin_meta?.["admin-car-registration"],
		)
		.filter(Boolean)
		.join(", ");

	// Get tackle requirements from route data
	const tackleRequired = trip.route?.acf?.route_group_tackle_required || "";

	// Clean up HTML tags while preserving structure
	const cleanedTackle = cleanTackle(tackleRequired);

	// Build the callout text with only defined sections
	let calloutTemplate = "";

	// Always include callout time and ETA
	calloutTemplate += `Callout: ${formatTime(calloutTime)}\n`;
	calloutTemplate += `ETA: ${formatTime(etaTime)}\n`;

	// Only include sections with data
	const locationName = getLocationName();
	if (locationName) {
		calloutTemplate += `Cave: ${locationName}\n`;
	}

	if (routeName) {
		calloutTemplate += `Route: ${routeName}\n`;
	}

	if (participantNames) {
		calloutTemplate += `${participantCount} People: ${participantNames}\n`;
		calloutTemplate +=
			"Emergency contact details accessible via NeoCrew if required\n";
	}

	const parkingLocation = getParkingLocation();
	if (parkingLocation) {
		// Trim lat/long to 5 decimal places (approx 1 meter accuracy)
		const trimmedLocation = parkingLocation.replace(
			/(-?\d+\.\d{5})\d*,(-?\d+\.\d{5})\d*/g,
			"$1,$2",
		);
		calloutTemplate += `Parked at (lat/long): ${trimmedLocation}\n`;

		if (carRegistrations) {
			calloutTemplate += `Car registrations: ${carRegistrations}\n`;
		}
	}

	calloutTemplate += `Equipped with:\n${cleanedTackle}`;

	return calloutTemplate;
};

/**
 * Generate tackle request text for a trip
 * @param trip The trip object
 * @param participants List of trip participants
 * @returns Formatted tackle request text
 */
export const generateTackleRequestText = (
	trip: Trip,
	participants: TripParticipant[],
): string => {
	// Get trip date and time
	const startDate = trip.acf.event_start_date_time
		? new Date(trip.acf.event_start_date_time)
		: new Date();

	// Format date and time
	const formattedDate = startDate.toLocaleDateString("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	const formattedTime = startDate.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	});

	// Get location name
	const getLocationName = () => {
		if (trip.route?.acf?.route_entrance_location_id?.title) {
			return trip.route.acf.route_entrance_location_id.title;
		}

		return trip.acf.event_cave_name || trip.acf.event_location || "the cave";
	};

	// Get route name
	const routeName =
		trip.route?.acf?.route_name || trip.acf.event_possible_objectives || "";

	// Import the cleanTackle function from trip-participant-utils
	const cleanTackle = (tackleRequired: string): string => {
		return (
			tackleRequired
				// Replace paragraph tags with newlines
				.replace(/\n/g, "")
				.replace(/<p>/g, "")
				.replace(/<\/p>/g, "\n")
				// Replace <br /> tags with newlines
				.replace(/<br\s*\/?>/g, "\n")
				// Remove any other HTML tags
				.replace(/<[^>]*>/g, "\n")
				// Trim extra whitespace
				.replace(/\n{3,}/g, "")
				.trim()
		);
	};

	// Get signed up participants
	const signedUpParticipants = participants.filter((p) => {
		const status = determineSignupStatus(p);
		return status === "Signed Up";
	});

	// Get route personal gear requirements
	const routePersonalGear = trip.route?.acf?.route_personal_gear_required || "";
	const requiresSRT =
		trip.acf.event_gear_required?.indexOf("SRT") !== -1 ||
		(typeof routePersonalGear === "string" &&
			routePersonalGear.indexOf("SRT Kit") !== -1) ||
		trip.acf.event_skills_required?.indexOf("SRT") !== -1;

	// Build the tackle request text
	let requestTemplate = `On ${formattedDate} at ${formattedTime} we're going to ${getLocationName()}`;

	if (routeName) {
		requestTemplate += ` to do ${routeName}`;
	}

	requestTemplate += ":\n\n";
	requestTemplate += "With help from NeoCrew, I think we'll need:\n";

	// Track participants who need wellies but haven't specified a size
	const participantsNeedingWellieSize: string[] = [];

	// Process each participant's gear needs
	signedUpParticipants.forEach((participant) => {
		const gearBringing =
			participant.meta?.["gear-bringing-evening-or-day-trip"] || "";
		const welliesSize = participant.meta?.gear_wellies_size || "";

		// Get required gear from route if available, otherwise use standard list
		let standardGear: string[] = [];

		if (routePersonalGear) {
			// Parse from route_personal_gear_required
			standardGear = (
				typeof routePersonalGear === "string"
					? routePersonalGear.replace(/<[^>]*>/g, "")
					: String(routePersonalGear)
			)
				.split(/[,;]/)
				.map((item) => item.trim())
				.filter(Boolean);
		} else {
			// Default standard gear
			standardGear = [
				"Oversuit",
				"Undersuit",
				"Helmet and Light",
				"Kneepads",
				"Gloves",
				"Wellies",
			];

			// Add SRT Kit if required for this trip
			if (requiresSRT) {
				standardGear.push("SRT Kit");
				if (
					gearBringing.indexOf("SRT Kit") === -1 &&
					gearBringing.indexOf("Harness and Cowstails") === -1
				) {
					standardGear.push("Harness and Cowstails");
				}
			}
		}

		// Check what gear the participant is missing
		const missingGear: string[] = [];

		// Parse individual items they're bringing
		const bringingItems = gearBringing
			.split(",")
			.map((item: string) => item.trim());

		// Even if they selected "Nothing", check if they've also selected specific items
		const isNewCaver = bringingItems.some(
			(item: string) =>
				item.indexOf("Nothing") !== -1 || item.indexOf("totally new") !== -1,
		);

		// Check each standard gear item
		standardGear.forEach((item: string) => {
			// Special case for SRT Kit and Harness/Cowstails
			if (
				item === "Harness and Cowstails" &&
				bringingItems.some(
					(g: string) =>
						g.indexOf("SRT Kit") !== -1 ||
						g.indexOf("Harness and Cowstails") !== -1,
				)
			) {
				return; // They have this covered
			}

			// For all other items, check if they're bringing it
			const hasBrought = bringingItems.some(
				(g: string) => g.indexOf(item) !== -1,
			);

			if (!hasBrought || (isNewCaver && item !== "Wellies")) {
				if (item === "Wellies") {
					if (welliesSize && welliesSize.trim() !== "") {
						missingGear.push(`Wellies size ${welliesSize}`);
					} else {
						missingGear.push("Wellies (size to be confirmed)");
						participantsNeedingWellieSize.push(participant.first_name);
					}
				} else {
					missingGear.push(item);
				}
			}
		});

		// Only add participants who need gear
		if (missingGear.length > 0) {
			requestTemplate += `${participant.first_name} ${participant.last_name}: ${missingGear.join(", ")}\n`;
		}
	});

	// Add note about wellie sizes if needed
	if (participantsNeedingWellieSize.length > 0) {
		requestTemplate += `\nI'll find out the wellie sizes for: ${participantsNeedingWellieSize.join(", ")}\n`;
	}

	// Add group equipment section
	requestTemplate += "\nThe Group equipment we need is:\n";

	// Add route-specific equipment if available
	if (trip.route?.acf?.route_group_tackle_required) {
		const tackleRequired = trip.route.acf.route_group_tackle_required;
		// Clean up HTML tags while preserving structure
		const cleanedTackle = cleanTackle(tackleRequired);

		// Use the cleaned tackle text as a single item instead of splitting
		requestTemplate += `- ${cleanedTackle}\n`;
	} else {
		// Default equipment if no specific requirements
		requestTemplate += "- Standard Caving Crew Leaderbag\n";

		if (requiresSRT) {
			requestTemplate += "- rope bags?\n";
			requestTemplate += "- XXm rope?\n";
			requestTemplate += "- X carabiners?\n";
			requestTemplate += "- 1 x emergency rope (xM)\n";
			requestTemplate += "- 1 SRT Leader Kit\n";
			requestTemplate += "- x slings\n";
		} else {
			requestTemplate += "- XXm handline rope\n";
			requestTemplate += "- x carabiners\n";
			requestTemplate += "- x slings\n";
		}
	}

	return requestTemplate;
};

/**
 * Generate location info message for a trip
 * @param trip The trip object
 * @returns Formatted location info message
 */
export const generateLocationInfoText = (trip: Trip): string => {
	// For overnight trips
	if (trip.acf.event_type === "overnight") {
		// Extract month and region for title
		const startDate = trip.acf.event_start_date_time
			? new Date(trip.acf.event_start_date_time)
			: new Date();
		const month = startDate.toLocaleDateString("en-GB", { month: "long" });
		const region = trip.hut?.hut_location?.post_title || "Caving Weekend";
		
		// Extract coordinates for map link
		const coordinates = trip.hut?.hut_lat_long || "";
		const mapLink = coordinates ? `http://maps.apple.com/?address=${coordinates}` : "";
		
		// Extract facilities as a readable string
		const facilities = trip.hut?.hut_facilities && trip.hut?.hut_facilities.length > 0 
			? trip.hut?.hut_facilities
				.map((f: string) => f.replace(/_/g, ' '))
				.join(", ")
			: "basic facilities";
		
		// Get kit list items if available
		let kitListItems = "";
		if (trip.acf.overnight_kitlist && Array.isArray(trip.acf.overnight_kitlist)) {
			const personalItems = trip.acf.overnight_kitlist.find((k: any) => 
				k.overnight_kit_list_type?.toLowerCase().includes('personal') || 
				k.overnight_kit_list_type?.toLowerCase().includes('bring')
			);
			
			if (personalItems && personalItems.overnight_kit_list) {
				// Extract list items from HTML
				const itemsHtml = personalItems.overnight_kit_list;
				const itemsText = itemsHtml
					.replace(/<li>/gi, "• ")
					.replace(/<\/li>/gi, "\n")
					.replace(/<[^>]*>/g, "")
					.replace(/\n{3,}/g, "\n")
					.trim();
				
				// Get first few items (up to 5)
				const itemsList = itemsText.split("\n").filter(Boolean);
				kitListItems = itemsList.slice(0, 5).join("\n");
			}
		}
		
		// If no kit list found, use default items
		if (!kitListItems) {
			kitListItems = `• Sleeping bag & pillow
• Multiple changes of underwear/thermals
• Old warm base layers (fleece/leggings)
• Personal toiletries
• Headtorch + spare batteries
• Sealed underground snack
• Any special dietary items`;
		}
		
		// Extract what's included from event_paying_for if available
		let includedItems = `✔️ All caving equipment  
✔️ Bedding/facilities listed above  
✔️ Meals as described in the trip details`;
		
		if (trip.acf.event_paying_for) {
			// Try to extract bullet points from HTML
			const payingForHtml = trip.acf.event_paying_for;
			if (payingForHtml.includes("<li>")) {
				const payingForText = payingForHtml
					.replace(/<li>/gi, "✔️ ")
					.replace(/<\/li>/gi, "  \n")
					.replace(/<[^>]*>/g, "")
					.replace(/\n{3,}/g, "\n")
					.trim();
				
				if (payingForText) {
					includedItems = payingForText;
				}
			}
		}
		
		// Build the overnight trip message template
		return `✨ Final Information ✨

We're looking forward to seeing you for our ${trip.name}

${mapLink ? `📍 Where to Drive To:
${mapLink}

` : ""}We're staying at:
• ${trip.hut?.hut_name || "Our accommodation"}${trip.hut?.hut_club_name ? ` (managed by ${trip.hut?.hut_club_name})` : ""}${trip.hut?.hut_address ? `, ${trip.hut?.hut_address}` : ""}
${facilities ? `• Facilities include: ${facilities}\n` : ""}

🕒 Arrival Time:
We'll start arriving around 18:00. Please try and arrive in the evening so we can plan the next day's activities together in person. Once you set off, message us with your ETA.

${trip.hut?.hut_parking_instructions ? `🚗 Parking Info:  
${trip.hut?.hut_parking_instructions.replace(/<[^>]*>/g, "").trim().split("\n").join("\n• ")}\n` : ""}
🧳 What to Bring:  
${kitListItems}  

ℹ️ Full Trip Details including kitlists for caving, sleeping, etc:
https://www.cavingcrew.com/trips/${trip.slug}

See you there! Please feel free to message me directly with any "stupid questions" - always happy to help.`;
	}

	// Get trip date and time
	const startDate = trip.acf.event_start_date_time
		? new Date(trip.acf.event_start_date_time)
		: new Date();

	// Format date and time
	const formattedDate = startDate.toLocaleDateString("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	const formattedTime = startDate.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	});

	// Get location information
	const getLocationName = () => {
		if (trip.route?.acf?.route_entrance_location_id?.title) {
			return trip.route.acf.route_entrance_location_id.title;
		}
		return (
			trip.acf.event_cave_name || trip.acf.event_location || "the meeting point"
		);
	};

	// Get parking coordinates
	const getParkingCoordinates = () => {
		if (
			trip.route?.acf?.route_entrance_location_id?.acf?.location_parking_latlong
		) {
			const parking =
				trip.route.acf.route_entrance_location_id.acf.location_parking_latlong;
			if (typeof parking === "object" && parking.lat && parking.lng) {
				return { lat: parking.lat, lng: parking.lng };
			}
		}
		return null;
	};

	// Get required gear
	const getRequiredGear = () => {
		if (trip.route?.acf?.route_personal_gear_required) {
			return typeof trip.route.acf.route_personal_gear_required === "string"
				? trip.route.acf.route_personal_gear_required
						.replace(/<[^>]*>/g, "")
						.trim()
						.split(/[,;]/)
						.map((item: string) => item.trim())
						.filter(Boolean)
				: String(trip.route.acf.route_personal_gear_required)
						.split(/[,;]/)
						.map((item: string) => item.trim())
						.filter(Boolean);
		}

		// Default gear based on trip type
		const requiresSRT =
			trip.acf.event_gear_required?.includes("SRT") ||
			trip.acf.event_skills_required?.includes("SRT");

		const standardGear = [
			"Oversuit",
			"Undersuit",
			"Helmet with headtorch",
			"Kneepads",
			"Gloves",
			"Wellies",
		];

		if (requiresSRT) {
			standardGear.push("SRT Kit");
		}

		return standardGear;
	};

	// For giggletrips and other trips
	const locationName = getLocationName();
	const parkingCoords = getParkingCoordinates();
	const requiredGear = getRequiredGear();

	let message = "";
	message += `🗓️ On the evening of ${formattedDate}, we're going caving.\n`;
	message += `🕒 Let's meet at the ${locationName} parking around ${formattedTime}.\n\n`;
	message += `⏱️ If you discover you're going to be late, please stay on route, and drop us a message with your adjusted ETA. Chances are it'll be absolutely fine. We'll see you when you arrive.\n\n`;

	// Add gear information
	message += `🧰 Everyone will need:\n`;
	requiredGear.forEach((item: string) => {
		message += `- ${item}\n`;
	});

	// Add note about gear borrowing for horizontal trips that aren't overnight or giggletrips
	if (
		trip.acf.event_type !== "giggletrip" &&
		trip.acf.event_type !== "overnight" &&
		(trip.acf.event_gear_required?.indexOf("Horizontal") !== -1 ||
			trip.route?.acf?.route_personal_gear_required?.indexOf("Horizontal") !==
				-1)
	) {
		message += `\nNote: it's not possible to borrow this from the Crew this time.\n`;
	}

	if (trip.acf.event_type != "giggletrip") {
		message += `\n`;
	}

	// Only include wellies information for giggletrips
	if (trip.acf.event_type === "giggletrip") {
		message += `🎒 Unless you've told us not to, we'll bring all the gear for you\n\n`;
	}

	// Only include this message for giggletrips
	if (trip.acf.event_type === "giggletrip") {
		message += `❄️ You do not need to wear extra layers beneath the undersuit, unless you're a very chilly person.\n\n`;
	}

	// Add information about what to bring for giggletrips
	if (trip.acf.event_type === "giggletrip") {
		message += `📋 Here's what you should bring:\n\n`;
		message += `👕 Some warm older/less nice clothes to wear as a base layer underneath the caving-specific clothes we will provide. Some examples:\n`;
		message += `   - Leggings\n`;
		message += `   - Summer base layers/swimming t-shirts\n`;
		message += `   - Outdoorsy t-shirts\n\n`;
		message += `👖 Change of socks/underwear/replacement clothing. (Anything you wear into the cave will likely be too wet and dirty to wear afterwards in the car, so make sure you have spare clothes for the drive home.)\n`;
		message += `👢 Wellies (We 'can' provide Wellies. But if you have your own they probably will feel more comfortable! Any wellies are fine - shortie pink sparkles festival wellies or dinosaurs are fine - whatever! And remember Welly socks too.)\n`;
		message += `🧖 Towel\n`;
		message += `💊 Any important medicines you take (including inhalers)\n`;
		message += `👓 Contact lenses or string for your glasses.\n`;
		message += `🍫 A full sealed snack you enjoy eating (eg a mars bar) to put in our kit bag to take underground\n`;
		message += `📱 A waterproof case if you plan on bringing your phone.\n`;
		message += `☕ A hot drink in a warm flask for afterwards is also recommended.\n\n`;
	}

	// Add additional information for giggletrips
	if (trip.acf.event_type === "giggletrip") {
		message += `\n🍽️ Caving is an energy heavy activity so do eat something sustaining beforehand.\n\n`;
		message += `🌳 Lastly, there are no toilets at the cave, so do 'wild wee' before you arrive, or in the woodland nearby.\n\n`;
		message += `✨ This is a great trip! I'm really looking forward to meeting you.\n\n`;
	}

	// Add parking coordinates if available
	if (parkingCoords) {
		message += `📍 This is the pin for the ${locationName} Parking.\n`;
		message += `http://maps.apple.com/?address=${parkingCoords.lat},${parkingCoords.lng}\n\n`;
	}

	// Add parking description if available
	if (
		trip.route?.acf?.route_entrance_location_id?.acf
			?.location_parking_description
	) {
		const parkingDescription =
			trip.route.acf.route_entrance_location_id.acf.location_parking_description
				.replace(/<br\s*\/?>/gi, "\n")
				.replace(/<\/p>\s*<p>/gi, "\n\n")
				.replace(/<[^>]*>/g, "")
				.replace(/\n{3,}/g, "\n\n")
				.trim();

		message += `🚗 Here's a description of the parking:\n`;
		message += `${parkingDescription}\n\n`;
	}

	// Add note about parking photos if available
	if (
		trip.route?.acf?.route_entrance_location_id?.acf?.location_parking_photos &&
		Array.isArray(
			trip.route.acf.route_entrance_location_id.acf.location_parking_photos,
		) &&
		trip.route.acf.route_entrance_location_id.acf.location_parking_photos
			.length > 0
	) {
		message += `📸 Note: Photos of the parking area are available on the trip signup page if you're logged in.\n`;
		message += `You can view them at: https://www.cavingcrew.com/trips/${trip.slug}#parking\n\n`;
	}

	return message;
};

/**
 * Generate gear trip check message for a trip
 * @param trip The trip object
 * @param participants List of trip participants
 * @returns Formatted gear check message
 */
export const generateGearTripCheckText = (
	trip: Trip,
	participants: TripParticipant[],
): string => {
	// Get signed up participants
	const signedUpParticipants = participants.filter((p) => {
		const status = determineSignupStatus(p);
		return status === "Signed Up";
	});

	// Get route personal gear requirements
	const routePersonalGear = trip.route?.acf?.route_personal_gear_required || "";
	const requiresSRT =
		trip.acf.event_gear_required?.indexOf("SRT") !== -1 ||
		(typeof routePersonalGear === "string" &&
			routePersonalGear.indexOf("SRT Kit") !== -1) ||
		trip.acf.event_skills_required?.indexOf("SRT") !== -1;

	// Build the gear check message
	let messageTemplate = `I've just been checking NeoCrew for people's gear requirements for this trip. `;

	// Add the required gear section
	if (routePersonalGear) {
		// Parse from route_personal_gear_required
		const gearList = (
			typeof routePersonalGear === "string"
				? routePersonalGear.replace(/<[^>]*>/g, "")
				: String(routePersonalGear)
		)
			.split(/[,;]/)
			.map((item) => item.trim())
			.filter(Boolean)
			.join(", ");

		messageTemplate += `The kit everyone needs is: ${gearList}.\n\n`;
	} else {
		// Default standard gear
		const standardGear = [
			"Oversuit",
			"Undersuit",
			"Helmet and Light",
			"Kneepads",
			"Gloves",
			"Wellies",
		];

		// Add SRT Kit if required for this trip
		if (requiresSRT) {
			standardGear.push("SRT Kit");
		}

		messageTemplate += `The kit everyone needs is: ${standardGear.join(", ")}.\n\n`;
	}

	// Add the individual needs section
	messageTemplate += `From what I can see:\n`;

	// Track participants who need wellies but haven't specified a size
	const participantsNeedingWellieSize: string[] = [];

	// Process each participant's gear needs
	signedUpParticipants.forEach((participant) => {
		const gearBringing =
			participant.meta?.["gear-bringing-evening-or-day-trip"] || "";
		const welliesSize = participant.meta?.gear_wellies_size || "";

		// Get required gear from route if available, otherwise use standard list
		let standardGear: string[] = [];

		if (routePersonalGear) {
			// Parse from route_personal_gear_required
			standardGear = (
				typeof routePersonalGear === "string"
					? routePersonalGear.replace(/<[^>]*>/g, "")
					: String(routePersonalGear)
			)
				.split(/[,;]/)
				.map((item) => item.trim())
				.filter(Boolean);
		} else {
			// Default standard gear
			standardGear = [
				"Oversuit",
				"Undersuit",
				"Helmet and Light",
				"Kneepads",
				"Gloves",
				"Wellies",
			];

			// Add SRT Kit if required for this trip
			if (requiresSRT) {
				standardGear.push("SRT Kit");
				if (
					gearBringing.indexOf("SRT Kit") === -1 &&
					gearBringing.indexOf("Harness and Cowstails") === -1
				) {
					standardGear.push("Harness and Cowstails");
				}
			}
		}

		// Check what gear the participant is missing
		const missingGear: string[] = [];

		// Parse individual items they're bringing
		const bringingItems = gearBringing
			.split(",")
			.map((item: string) => item.trim());

		// Even if they selected "Nothing", check if they've also selected specific items
		const isNewCaver = bringingItems.some(
			(item: string) =>
				item.indexOf("Nothing") !== -1 || item.indexOf("totally new") !== -1,
		);

		// Check each standard gear item
		standardGear.forEach((item: string) => {
			// Special case for SRT Kit and Harness/Cowstails
			if (
				item === "Harness and Cowstails" &&
				bringingItems.some(
					(g: string) =>
						g.indexOf("SRT Kit") !== -1 ||
						g.indexOf("Harness and Cowstails") !== -1,
				)
			) {
				return; // They have this covered
			}

			// For all other items, check if they're bringing it
			const hasBrought = bringingItems.some(
				(g: string) => g.indexOf(item) !== -1,
			);

			if (!hasBrought || (isNewCaver && item !== "Wellies")) {
				if (item === "Wellies") {
					if (welliesSize && welliesSize.trim() !== "") {
						missingGear.push(`Wellies (size ${welliesSize})`);
					} else {
						missingGear.push("Wellies");
						participantsNeedingWellieSize.push(participant.first_name);
					}
				} else {
					missingGear.push(item);
				}
			}
		});

		// Only add participants who need gear
		if (missingGear.length > 0) {
			messageTemplate += `- ${participant.first_name} needs ${missingGear.join(", ")}\n`;
		}
	});

	// Add note about wellie sizes if needed
	if (participantsNeedingWellieSize.length > 0) {
		messageTemplate += `\n${participantsNeedingWellieSize.join(", ")}: can you clarify what size wellies you need?\n`;
	}

	messageTemplate += `\nDoes that sound right to everyone?`;

	return messageTemplate;
};

/**
 * Helper function for determineSignupStatus
 * Imported from trip-participant-utils to avoid circular dependencies
 */
const determineSignupStatus = (participant: TripParticipant): string => {
	const { cc_attendance: attendance } = participant.order_meta || {};
	const { order_status: orderStatus } = participant;

	// Comprehensive status mapping
	const statusMap: Record<string, string> = {
		attended: "Attended",
		noshow: "No Show",
		cancelled: "Cancelled",
		latebail: "Late Bail",
		"no-register-show": "Attended Without Signup",
		noregistershow: "Attended Without Signup",
	};

	// Check predefined statuses first
	if (attendance && typeof attendance === "string" && statusMap[attendance])
		return statusMap[attendance];

	// Handle pending and processing statuses
	if (orderStatus === "processing" && (!attendance || attendance === "pending"))
		return "Signed Up";

	if (orderStatus === "on-hold" || orderStatus === "pending") return "Other";

	return "Other";
};
