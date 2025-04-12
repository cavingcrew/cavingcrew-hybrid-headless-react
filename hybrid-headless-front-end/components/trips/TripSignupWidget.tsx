"use client";

import { participantKeys } from "@/lib/hooks/useTripParticipants";
import { useUser } from "@/lib/hooks/useUser";
import {
	Alert,
	Anchor,
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Paper,
	Radio,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Auth } from "../../utils/user-utils";

import { WordPressLoginWidget } from "@/components/auth/WordPressLoginWidget";
import { apiService } from "@/lib/api-service";
import { tripKeys } from "@/lib/hooks/useTrips";
import type { ApiResponse, Trip } from "@/types/api";
import { IconInfoCircle, IconLogin } from "@tabler/icons-react";

interface TripSignupWidgetProps {
	trip: Trip;
	requiresLogin?: boolean;
	loginReason?: string;
}

const calculateMemberPrice = (basePrice: string, discountPounds?: string) => {
	const numericPrice = Number(basePrice);
	const numericDiscount = Number(discountPounds || 0);

	if (isNaN(numericPrice)) return 0;
	if (isNaN(numericDiscount) || numericDiscount <= 0) return numericPrice;

	return Math.max(numericPrice - numericDiscount, 0); // Ensure price doesn't go negative
};

export function TripSignupWidget({
	trip,
	requiresLogin = false,
	loginReason = "This trip requires login to sign up",
}: TripSignupWidgetProps) {
	const queryClient = useQueryClient();
	const [selectedVariation, setSelectedVariation] = useState<string>("");
	const [selectedPrice, setSelectedPrice] = useState<string>("");
	const [isSelectedVariationValid, setIsSelectedVariationValid] =
		useState(false);
	const [isSigningUp, setIsSigningUp] = useState(false);
	const hasAvailableVariations = trip.variations?.some(
		(v) => v.stock_status === "instock" && (v.stock_quantity ?? 0) > 0,
	);
	const nonMembersWelcome =
		(trip.acf["event_non-members_welcome"] || // Hyphen version first
			trip.acf.event_non_members_welcome) === // Fallback to underscore
		"yes";
	const mustCavedBefore = trip.acf?.event_must_caved_with_us_before === "yes";
	// Declare all derived variables first
	const { user, isLoggedIn, isMember, purchasedProducts } = useUser();
	const hasPurchased =
		purchasedProducts.includes(trip.id) ||
		trip.variations.some((v) => purchasedProducts.includes(v.id));
	const memberDiscount = trip.acf.event_members_discount;

	// Update price when variation changes
	useEffect(() => {
		if (selectedVariation) {
			const variation = trip.variations.find(
				(v) => v.id.toString() === selectedVariation,
			);
			setSelectedPrice(variation?.price || "");
		}
	}, [selectedVariation, trip.variations]);

	// Validate selected variation
	useEffect(() => {
		if (selectedVariation) {
			const variation = trip.variations.find(
				(v) => v.id.toString() === selectedVariation,
			);
			const valid =
				variation?.stock_status === "instock" &&
				(variation.stock_quantity ?? 0) > 0 &&
				!(
					trip.acf.event_type === "giggletrip" &&
					variation.sku.includes("bcamember") &&
					isMember
				);
			setIsSelectedVariationValid(!!valid);
		} else {
			setIsSelectedVariationValid(false);
		}
	}, [selectedVariation, trip.variations, isMember]);

	useEffect(() => {
		if (!trip.has_variations) return;

		const updateStock = async () => {
			const stockResponse = await apiService.getProductStock(trip.id);
			if (stockResponse.success && stockResponse.data) {
				queryClient.setQueryData<ApiResponse<Trip[]>>(tripKeys.all, (old) => {
					if (!old?.data) return old;
					return {
						...old,
						data: old.data.map((t) =>
							t.id === trip.id
								? {
										...t,
										variations: t.variations.map((v) => {
											const stockVariant = stockResponse.data?.variations?.find(
												(sv) => sv.id === v.id,
											);
											return stockVariant
												? {
														...v,
														stock_quantity: stockVariant.stock_quantity,
														stock_status: stockVariant.stock_status,
													}
												: v;
										}),
									}
								: t,
						),
					};
				});
			}
		};

		const interval = setInterval(updateStock, 30000);
		return () => clearInterval(interval);
	}, [trip.id, trip.has_variations, queryClient]);

	// Debug logging for variation selection
	useEffect(() => {
		console.log("DEBUG - Variation selected:", {
			conditions: {
				isLoggedIn,
				hasAvailableVariations,
				nonMembersWelcome: trip.acf.event_non_members_welcome === "yes",
				hasPurchased,
				isSelectedVariationValid,
				isMember,
				requiresLogin,
				isSigningUp,
				memberDiscount: trip.acf.event_members_discount,
				selectedVariation,
				variationStock: trip.variations.find(
					(v) => v.id.toString() === selectedVariation,
				)?.stock_quantity,
			},
			disabledReasons: {
				invalidVariation: !isSelectedVariationValid,
				nonMemberBlocked: !isMember && !nonMembersWelcome,
				requiresLogin,
				purchased: hasPurchased,
				isSigningUp,
			},
		});
	}, [
		selectedVariation,
		isSelectedVariationValid,
		isLoggedIn,
		hasAvailableVariations,
		hasPurchased,
		isMember,
		requiresLogin,
		isSigningUp,
		trip,
	]);

	const handleSignUp = () => {
		if (!selectedVariation) return;
		setIsSigningUp(true);

		// Invalidate participants cache for this trip
		queryClient.invalidateQueries({ queryKey: participantKeys.list(trip.id) });

		window.location.href = `/checkout/?add-to-cart=${selectedVariation}`;
	};

	if (
		(trip.has_variations && !hasAvailableVariations) ||
		(!trip.has_variations && !trip.purchasable)
	) {
		return (
			<Paper withBorder p="md" radius="md" mb="xl">
				<Alert
					color="yellow"
					title={trip.has_variations ? "Full Up" : "Not Available"}
				>
					{trip.has_variations
						? "All places are currently filled"
						: "This trip is currently not available for signups"}
				</Alert>
			</Paper>
		);
	}

	return (
		<Stack gap="md">
			<Paper withBorder p="md" radius="md" mb="xl">
				<Title order={3} mb="md">
					Sign Up Options
				</Title>

				{trip.has_variations && hasAvailableVariations && (
					<div
						style={{
							opacity: requiresLogin || hasPurchased ? 0.6 : 1,
							pointerEvents: requiresLogin || hasPurchased ? "none" : "auto",
						}}
					>
						<Radio.Group
							value={selectedVariation}
							onChange={setSelectedVariation}
							name="tripVariation"
							required
						>
							<Stack gap="lg">
								{trip.variations.map((variation) => {
									console.log(`Variation ${variation.id} clickable status:`, {
										inStock: variation.stock_status === "instock",
										stockQuantity: variation.stock_quantity,
										isBcaMemberBlocked:
											trip.acf.event_type === "giggletrip" &&
											(variation.sku.includes("GIGGLE--bcamember") ||
												variation.attributes[
													"what-describes-you-best"
												]?.value.includes("I'm a BCA")) &&
											isLoggedIn &&
											isMember,
										isPurchased: purchasedProducts.includes(variation.id),
									});

									const attribute = Object.values(variation.attributes)[0];
									let inStock = variation.stock_status === "instock";
									let isBcaMemberVariation = false;
									const isPurchased = purchasedProducts.includes(variation.id);

									// Updated BCA member handling
									if (
										trip.acf.event_type === "giggletrip" &&
										(variation.sku.includes("GIGGLE--bcamember") ||
											variation.attributes[
												"what-describes-you-best"
											]?.value.includes("I'm a BCA")) &&
										isLoggedIn &&
										isMember
									) {
										isBcaMemberVariation = true;
										inStock = false; // Force out of stock for members
									}

									const memberPrice = calculateMemberPrice(
										variation.price,
										memberDiscount,
									);

									return (
										<Paper
											key={variation.id}
											withBorder
											p="md"
											radius="md"
											style={{
												cursor: requiresLogin || hasPurchased || (!isMember && !nonMembersWelcome) 
													? "not-allowed" 
													: "pointer",
												transition: "all 0.2s ease",
												borderColor: selectedVariation === variation.id.toString() 
													? "#228be6" 
													: undefined,
												borderWidth: selectedVariation === variation.id.toString() ? 2 : 1,
												opacity: isBcaMemberVariation || (!isMember && !nonMembersWelcome)
													? 0.5
													: requiresLogin
													? 0.8
													: 1,
												backgroundColor: isBcaMemberVariation
													? "#f8f9fa"
													: selectedVariation === variation.id.toString()
													? "#f1f3f5"
													: undefined,
												boxShadow: selectedVariation === variation.id.toString()
													? "0 0 0 2px rgba(34, 139, 230, 0.2)"
													: undefined,
											}}
											onClick={() => {
												if (inStock && !isBcaMemberVariation && !isPurchased && (isMember || nonMembersWelcome)) {
													setSelectedVariation(variation.id.toString());
												}
											}}
										>
											<Radio
												value={variation.id.toString()}
												label={
													<Stack gap="xs" w="100%">
														<Group justify="space-between">
															<Text fw={500}>
																{attribute?.value || "Signup Option"}
															</Text>
															<Badge
																color={
																	isPurchased
																		? "green"
																		: inStock
																			? "green"
																			: "red"
																}
																variant="light"
															>
																{isPurchased
																	? "Purchased"
																	: inStock
																		? `${variation.stock_quantity ?? "N/A"} places left`
																		: "Full Up"}
															</Badge>
														</Group>
														{isBcaMemberVariation && (
															<Badge color="gray" variant="light" mt="sm">
																Not Available as you're a Caving Crew Member
															</Badge>
														)}

														{variation.description && (
															<div
																dangerouslySetInnerHTML={{
																	__html: variation.description,
																}}
																style={{
																	fontSize: "0.875rem",
																	color: "#868e96",
																	lineHeight: 1.6,
																	marginTop: "0.5rem",
																}}
															/>
														)}

														<Group justify="space-between" mt="sm">
															{isMember ? (
																<>
																	<Text fw={500}>
																		Member Price: £{memberPrice.toFixed(2)}
																	</Text>
																	{memberDiscount &&
																		Number.parseFloat(memberDiscount) > 0 && (
																			<Text td="line-through" c="dimmed">
																				£{variation.price}
																			</Text>
																		)}
																</>
															) : (
																<>
																	<Text fw={500}>
																		Price: £{variation.price}
																	</Text>
																	{memberDiscount &&
																		Number.parseFloat(memberDiscount) > 0 &&
																		isLoggedIn && (
																			<Text c="green" size="sm">
																				Save £
																				{Number.parseFloat(memberDiscount)} with
																				membership
																			</Text>
																		)}
																</>
															)}
														</Group>
													</Stack>
												}
												disabled={
													requiresLogin ||
													hasPurchased ||
													!inStock ||
													isBcaMemberVariation ||
													isPurchased ||
													(!isMember && !nonMembersWelcome)
												}
												styles={{
													root: {
														width: "100%",
														"& .mantine-Radio-body": {
															alignItems: "start",
														},
														"& .mantine-Radio-radio": {
															opacity: requiresLogin || hasPurchased ? 0.6 : 1,
															width: 0,
															height: 0,
															position: "absolute",
														},
													},
												}}
											/>
										</Paper>
									);
								})}
							</Stack>
						</Radio.Group>
					</div>
				)}

				<Divider my="md" />

				{!isMember &&
					memberDiscount &&
					Number.parseFloat(memberDiscount) > 0 && (
						<Alert color="teal" variant="light" icon={<IconInfoCircle />}>
							<Text size="sm">
								Members save £{memberDiscount} on this trip!{" "}
								<Anchor
									href="https://www.cavingcrew.com/trip/get-caving-crew-membership/"
									target="_blank"
									c="blue"
								>
									Get instant membership
								</Anchor>{" "}
								to unlock discounts. Membership is cheaper than you think and
								can be cancelled anytime.
							</Text>
						</Alert>
					)}

				{!hasPurchased && (
					<>
						{!isLoggedIn ? (
							<Stack gap="md">
								{nonMembersWelcome && !mustCavedBefore ? (
									<>
										<Alert color="blue" icon={<IconInfoCircle />}>
											New to caving? You can sign up as a guest. If you've caved
											with us before, you should log in.
										</Alert>
										<Group justify="space-between">
											<Stack gap={0}>
												<Text size="sm" c="dimmed">
													Guest signup available
												</Text>
											</Stack>
											<Button
												onClick={handleSignUp}
												disabled={!selectedVariation || isSigningUp}
												loading={isSigningUp}
												size="lg"
											>
												Continue as Guest
											</Button>
										</Group>
										<Divider label="or" labelPosition="center" />
										<WordPressLoginWidget />
									</>
								) : (
									<Stack gap="md">
										<Alert color="blue" icon={<IconInfoCircle />}>
											{mustCavedBefore
												? "This trip requires previous experience with us - please log in"
												: "Membership required to sign up - please log in"}
										</Alert>
										<WordPressLoginWidget />
									</Stack>
								)}
							</Stack>
						) : (
							<Group justify="space-between">
								{!isMember && !nonMembersWelcome ? (
									<>
										<Alert color="red" variant="filled" mb="md">
											<Text fw={500}>
												<Group gap="xs">
													<IconInfoCircle />
													<span>You must be a Caving Crew member to sign up for this trip</span>
												</Group>
											</Text>
										</Alert>
										<Button 
											component="a" 
											href="/membership" 
											size="lg" 
											fullWidth
											variant="filled"
											color="red"
											style={{
												fontWeight: 700,
												fontSize: "1.1rem",
											}}
										>
											<Group gap="xs">
												<IconLogin size={20} />
												<span>Membership Required - Get Instant Membership to Sign Up</span>
											</Group>
										</Button>
									</>
								) : !isMember && mustCavedBefore ? (
									<Alert color="blue" w="100%">
										This trip requires previous experience.{" "}
										<Anchor href="/membership" c="blue">
											Become a member
										</Anchor>{" "}
										to verify your experience
									</Alert>
								) : (
									<>
										<Stack gap={0}>
											{!isMember && (
												<Text size="sm" c="dimmed">
													Non-member signup
												</Text>
											)}
										</Stack>
										<Button
											onClick={handleSignUp}
											disabled={
												!isSelectedVariationValid ||
												(!isMember && !nonMembersWelcome) ||
												requiresLogin ||
												hasPurchased ||
												isSigningUp
											}
											loading={isSigningUp}
											size="lg"
										>
											{isMember ? "Signup for Trip" : "Continue as Non-Member"}
										</Button>
									</>
								)}
							</Group>
						)}
					</>
				)}
			</Paper>
		</Stack>
	);
}
