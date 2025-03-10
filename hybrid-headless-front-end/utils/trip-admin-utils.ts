/**
 * Utility functions for trip administration
 */

/**
 * Generate callout text for a trip
 * @param trip The trip object
 * @param participants List of trip participants
 * @returns Formatted callout text
 */
export const generateCalloutText = (trip: any, participants: any[]): string => {
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
	trip: any,
	participants: any[],
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
export const generateLocationInfoText = (trip: any): string => {
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

	// Build the message based on trip type
	let message = "";

	// For overnight trips
	if (trip.acf.event_type === "overnight") {
		message = `This is an overnight trip to ${trip.acf.event_location || "our destination"}.\n\n`;
		message += `Please check the trip page for detailed information about accommodation, kit list, and plans for each day.\n\n`;
		message += `If you have any questions, please contact the trip leader: ${trip.acf.event_trip_leader || "the trip leader"}.\n`;
		return message;
	}

	// For giggletrips and other trips
	const locationName = getLocationName();
	const parkingCoords = getParkingCoordinates();
	const requiredGear = getRequiredGear();

	message += `On the evening of ${formattedDate}, we're going caving.\n`;
	message += `Let's meet at the ${locationName} parking around ${formattedTime}.\n\n`;
	message += `If you discover you're going to be late, please stay on route, and drop us a message with your adjusted ETA. Chances are it'll be absolutel fine. We'll see you when you arrive.\n\n`;

	// Add gear information
	message += `Everyone will need:\n`;
	requiredGear.forEach((item: string) => {
		message += `${item},\n`;
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
		message += `We'll bring all the gear for you if you've let us know you aren't bringing it in the signup page.\n\n`;
		message += `We 'can' provide Wellies. But if you have your own they probably will feel more comfortable! Any wellies are fine - pink sparkles or dinosaurs are fine - whatever! And remember Welly socks too.\n\n`;
	}

	// Only include this message for giggletrips
	if (trip.acf.event_type === "giggletrip") {
		message += `You do not need to wear extra layers beneath the undersuit, unless you're a very chilly person.\n\n`;
	}

	// Add information about what to bring for giggletrips
	if (trip.acf.event_type === "giggletrip") {
		message += `Here's what you should bring:\n\n`;
		message += `1. Some warm older/less nice clothes to wear as a base layer underneath the caving-specific clothes we will provide. Some examples:\n`;
		message += `   - Fleece jumpers\n`;
		message += `   - Leggings\n`;
		message += `   - Thermal base layers\n`;
		message += `   - Outdoorsy t-shirts\n\n`;
		message += `Avoid anything made from cotton or untreated wool (such as t-shirts or wooly jumpers); synthetic fabrics that keep their warmth when wet work best here. You will be provided with a thick fleece layer and a protective outer layer to wear over this, so if all you have is cotton you're better going without.\n\n`;
		message += `2. Change of socks/underwear/replacement clothing. Anything you wear into the cave will likely be too wet and dirty to wear afterwards in the car, so make sure you have spare clothes for the drive home.\n`;
		message += `3. Wellies (we do have spares if necessary, but the sizes and stock are limited). These aren't special wellies – £12 wellies from go-outdoors or sparkling pink wellies with fur linings are great for caving.\n`;
		message += `4. Towel\n`;
		message += `5. Any important medicines you take\n`;
		message += `6. Contact lenses or string for your glasses.\n`;
		message += `7. A full sealed snack you enjoy eating (eg a mars bar)\n`;
		message += `8. A hot drink for afterwards is also recommended.\n\n`;
	}

	// Add parking coordinates if available
	if (parkingCoords) {
		message += `This is the pin for the ${locationName} Parking.\n`;
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

		message += `Here's a description of the parking:\n`;
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
		message += `Note: Photos of the parking area are available on the trip signup page if you're logged in.\n`;
		message += `You can view them at: ${trip.permalink || window.location.href}#parking\n\n`;
	}

	// Add additional information for giggletrips
	if (trip.acf.event_type === "giggletrip") {
		message += `Caving is an energy heavy activity so do eat something sustaining beforehand.\n\n`;
		message += `Lastly, there are no toilets, so do 'free wee' before you arrive, or in the woodland nearby.\n\n`;
		message += `This is a great trip! I'm really looking forward to meeting you.\n`;
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
	trip: any,
	participants: any[],
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
const determineSignupStatus = (participant: any): string => {
	const { cc_attendance: attendance } = participant.order_meta || {};
	const { order_status: orderStatus } = participant;

	// Comprehensive status mapping
	const statusMap: { [key: string]: string } = {
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
