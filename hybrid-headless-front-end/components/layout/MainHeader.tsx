'use client';

import { 
  Container, 
  Group, 
  Text, 
  Menu, 
  Burger, 
  Drawer, 
  Stack,
  UnstyledButton,
  Box,
  rem
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';

const shouldFullRefresh = (href: string) => {
  return href.startsWith('/my-account') || href === '/about-us';
};

export function MainHeader() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);

  const mainLinks = [
    { label: 'Upcoming Trips', href: '/trips' },
    { label: 'Become a Member', href: '/trips/get-caving-crew-membership' },
  ];

  const aboutLinks = [
    { label: 'What is The Caving Crew', href: '/about-us' },
    { label: 'Our Facebook Group', href: 'https://www.facebook.com/groups/TheCavingCrew/', external: true },
    { label: 'Get in Touch', href: 'https://m.me/thecavingcrew', external: true },
  ];

  const accountLinks = [
    { label: 'My Crew details', href: '/my-account/edit-account', fullRefresh: true },
    { label: 'My Crew Trips', href: '/my-account/orders', fullRefresh: true },
    { label: 'Logout', href: '/my-account/customer-logout/?_wpnonce=be52231fdc', fullRefresh: true },
    { label: 'Lost password', href: '/my-account/lost-password', fullRefresh: true },
  ];

  // Desktop menu
  const DesktopMenu = () => (
    <Group gap={20}>
      {mainLinks.map((link) => {
        if (shouldFullRefresh(link.href)) {
          return (
            <UnstyledButton
              key={link.href}
              component="a"
              href={link.href}
              onClick={() => window.location.href = link.href}
            >
              {link.label}
            </UnstyledButton>
          );
        }
        
        return (
          <UnstyledButton
            key={link.href}
            component={Link}
            href={link.href}
          >
            {link.label}
          </UnstyledButton>
        );
      })}

      <Menu 
        trigger="hover" 
        openDelay={100} 
        closeDelay={400}
      >
        <Menu.Target>
          <UnstyledButton>
            <Group gap={3}>
              <span>About Us</span>
              <IconChevronDown size={rem(16)} />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {aboutLinks.map((link) => (
            <Menu.Item
              key={link.href}
              component={link.external ? 'a' : Link}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
            >
              {link.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      <Menu 
        trigger="hover" 
        openDelay={100} 
        closeDelay={400}
        opened={userMenuOpened}
        onChange={setUserMenuOpened}
      >
        <Menu.Target>
          <UnstyledButton>
            <Group gap={3}>
              <span>My Account</span>
              <IconChevronDown size={rem(16)} />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {accountLinks.map((link) => (
            <Menu.Item
              key={link.href}
              component={link.fullRefresh ? 'a' : Link}
              href={link.href}
              onClick={link.fullRefresh ? () => window.location.href = link.href : undefined}
            >
              {link.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );

  // Mobile menu (Drawer)
  const MobileMenu = () => (
    <Drawer
      opened={drawerOpened}
      onClose={closeDrawer}
      size="100%"
      padding="md"
      title="Menu"
      hiddenFrom="sm"
    >
      <Stack>
        {mainLinks.map((link) => (
          shouldFullRefresh(link.href) ? (
            <UnstyledButton
              key={link.href}
              component="a"
              href={link.href}
              onClick={() => {
                closeDrawer();
                window.location.href = link.href;
              }}
            >
              {link.label}
            </UnstyledButton>
          ) : (
            <UnstyledButton
              key={link.href}
              component={Link}
              href={link.href}
              onClick={closeDrawer}
            >
              {link.label}
            </UnstyledButton>
          )
        ))}

        <Box>
          <Text fw={500} mb="xs">About Us</Text>
          <Stack gap="xs" ml="md">
            {aboutLinks.map((link) => (
              <UnstyledButton
                key={link.href}
                component={link.external ? 'a' : Link}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                onClick={closeDrawer}
              >
                {link.label}
              </UnstyledButton>
            ))}
          </Stack>
        </Box>

        <Box>
          <Text fw={500} mb="xs">My Account</Text>
          <Stack gap="xs" ml="md">
            {accountLinks.map((link) => (
              <UnstyledButton
                key={link.href}
                component={link.fullRefresh ? 'a' : Link}
                href={link.href}
                onClick={() => {
                  closeDrawer();
                  if (link.fullRefresh) {
                    window.location.href = link.href;
                  }
                }}
              >
                {link.label}
              </UnstyledButton>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  );

  return (
    <Box component="header" h={60} style={{ borderBottom: '1px solid #e9ecef' }}>
      <Container size="lg" h="100%">
        <Group h="100%" justify="space-between">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Text size="xl" fw={700}>The Caving Crew</Text>
          </Link>

          {/* Desktop menu */}
          <Group visibleFrom="sm">
            <DesktopMenu />
          </Group>

          {/* Mobile menu button */}
          <Burger
            opened={drawerOpened}
            onClick={toggleDrawer}
            hiddenFrom="sm"
            size="sm"
          />

          {/* Mobile menu drawer */}
          <MobileMenu />
        </Group>
      </Container>
    </Box>
  );
}
