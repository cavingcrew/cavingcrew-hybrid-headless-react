import { Container, Title, SimpleGrid, Card, Text, Group } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import Link from 'next/link';

export default async function CategoriesPage() {
  const { data: categories } = await apiService.getCategories();

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl">Trip Categories</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {categories.map((category) => (
          <Card
            key={category.id}
            component={Link}
            href={`/categories/${category.slug}`}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
          >
            <Text fw={500} size="lg" mb="xs">
              {category.name}
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              {category.description}
            </Text>
            <Group>
              <Text size="sm" c="blue">
                {category.count} trips available
              </Text>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
