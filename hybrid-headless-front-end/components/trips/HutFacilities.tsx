"use client";

import {
  Grid,
  Group,
  Text,
  ThemeIcon
} from "@mantine/core";
import {
  IconBath,
  IconToiletPaper,
  IconStove,
  IconMicrowave,
  IconSignal4g,
  IconFlame,
  IconPlug,
  IconParking,
  IconSnowflake,
  IconTools,
  IconInfoCircle
} from "@tabler/icons-react";

const facilityIcons: Record<string, React.ReactNode> = {
  showers: <IconBath size={20} />,
  toilets: <IconToiletPaper size={20} />,
  hobs: <IconStove size={20} />,
  microwave: <IconMicrowave size={20} />,
  phone_signal: <IconSignal4g size={20} />,
  heating: <IconFlame size={20} />,
  electricity: <IconPlug size={20} />,
  parking: <IconParking size={20} />,
  refrigeration: <IconSnowflake size={20} />,
  other: <IconTools size={20} />
};

interface HutFacilitiesProps {
  facilities: string[];
}

export function HutFacilities({ facilities }: HutFacilitiesProps) {
  if (!facilities || facilities.length === 0) return null;

  return (
    <div>
      <Text fw={500} mb="sm">Hut Facilities</Text>
      <Grid gutter="md">
        {facilities.map((facility) => (
          <Grid.Col span={6} key={facility}>
            <Group gap="sm">
              <ThemeIcon variant="light" color="blue" size="md">
                {facilityIcons[facility] || <IconInfoCircle size={20} />}
              </ThemeIcon>
              <Text tt="capitalize">{facility.replace(/_/g, ' ')}</Text>
            </Group>
          </Grid.Col>
        ))}
      </Grid>
    </div>
  );
}
