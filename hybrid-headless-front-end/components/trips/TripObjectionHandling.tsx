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
  IconMoodSmile,
  IconShield,
} from "@tabler/icons-react";
import React from "react";

export function TripObjectionHandling() {
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
          That's perfect! These trips are specifically designed for first-timers. 
          Most people on these trips have never been caving before and don't know anyone else - 
          you'll be in great company with other beginners just like you!
        </Text>
      </Alert>

      <Accordion>
        <Accordion.Item value="claustrophobia">
          <Accordion.Control icon={<IconCompass size={16} />}>
            <Text fw={500}>What about claustrophobia?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              Good news! Our beginner trips only visit caves with spacious passages. Many of the main chambers are so large you could park several cars inside them! Think of it like walking through a natural underground cathedral rather than squeezing through tight spaces. Most beginners are surprised by how open and comfortable these introductory caves feel - more like exploring an interesting building than anything confining.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="dark">
          <Accordion.Control icon={<IconBulb size={16} />}>
            <Text fw={500}>Fear of the dark?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              The cave is actually well-lit during our trips! Everyone wears high-quality LED headlamps that cast impressive beams, and guides carry powerful backup lights too. With our group moving through together, there's a wonderful ambient glow that illuminates the fascinating rock formations. Many participants tell us they're amazed by how clearly they can see everything - it's more like a stunning light show than true darkness!
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="stuck">
          <Accordion.Control icon={<IconMoodSmile size={16} />}>
            <Text fw={500}>Worried about getting stuck?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              That's a common worry, but our beginner routes are specifically chosen to be comfortable walking passages with no tight squeezes whatsoever. Our experienced guides have taken hundreds of people through these exact routes and know every inch of the path. We maintain a supportive, no-pressure atmosphere where the group stays together, and nobody ever gets left behind or put in an uncomfortable position.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="falling">
          <Accordion.Control icon={<IconShield size={16} />}>
            <Text fw={500}>Concerned about falling or injury?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              Safety is our absolute priority! That's why everyone wears proper helmets and sturdy footwear with excellent grip. Interestingly, caves often provide more secure footing than outdoor trails - there's no loose scree or slippery pine needles, just solid rock with plenty of natural handholds. Our guides always point out the best places to step and offer a helping hand on any slightly challenging sections.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="creatures">
          <Accordion.Control>
            <Text fw={500}>What about creatures in the cave?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              Most people are surprised by how few creatures actually live in caves! While the entrance might have a few ordinary insects, the deeper cave environment is too resource-poor for most animals. The few cave-adapted creatures that do exist are typically tiny, rare, and fascinating rather than frightening. Many of our trips encounter no wildlife at all - it's one of the most peaceful environments you can experience!
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="lost">
          <Accordion.Control>
            <Text fw={500}>Afraid of getting lost?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              Our beginner trips follow well-established routes that our guides have traversed countless times. We use a tried-and-tested buddy system and maintain constant communication throughout the group. Our guides are professionally trained in cave navigation and carry multiple backup light sources and emergency equipment. You can simply relax and enjoy the experience while we handle all the navigation!
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="fitness">
          <Accordion.Control>
            <Text fw={500}>What about the physical demands?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              These beginner trips are designed to be accessible to people with average fitness levels. If you can climb a flight of stairs and walk for about 30 minutes, you'll do great! We take a gentle pace with regular rest stops to admire the cave features. Many participants tell us it's less physically demanding than they expected - more like a leisurely nature walk with a few moments of gentle adventure!
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="dirty">
          <Accordion.Control>
            <Text fw={500}>Will I get dirty or wet?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              Getting a bit muddy is part of the fun! We provide full protective oversuits that keep your clothes completely clean underneath. Many participants discover an unexpected joy in this temporary freedom from keeping spotless - it's surprisingly liberating! The caves maintain a constant, mild temperature year-round, so you'll actually be more comfortable than in many outdoor activities regardless of the weather.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="equipment">
          <Accordion.Control>
            <Text fw={500}>What about equipment?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              We provide absolutely everything you need - high-quality helmets, reliable lighting systems, protective clothing, and appropriate footwear if needed. Our equipment is professionally maintained, regularly inspected, and adheres to British Caving Association standards. Before entering the cave, our guides ensure everyone's gear is properly fitted and working perfectly. Many beginners tell us they feel like proper adventurers once they're kitted up!
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="danger">
          <Accordion.Control icon={<IconHeartHandshake size={16} />}>
            <Text fw={500}>Isn't caving dangerous?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text>
              Not at all! Beginner caving with our group is actually significantly safer than many common recreational activities. Statistics show it's less risky than horse riding, rugby, bouldering, mountain biking, and many other widely enjoyed adventure sports.
            </Text>
            <Text mt="xs">
              What we're offering is essentially the equivalent of a gentle underground walk. We follow established pathways, use professional equipment, and maintain constant supervision. Our beginner routes have been carefully selected for their accessibility and safety.
            </Text>
            <Text mt="xs">
              This experience is so accessible that we've successfully guided people in their seventies through these caves on their very first caving adventure! We regularly introduce both 18-year-olds just starting their adventure journey and older adults looking for something new and exciting.
            </Text>
            <Text mt="xs">
              Our perfect safety record speaks for itself. Every guide is fully certified, carries emergency equipment, and has completed extensive safety training. We follow strict protocols established by the British Caving Association, including regular route assessments, equipment checks, and maintaining appropriate guide-to-participant ratios.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  );
}
