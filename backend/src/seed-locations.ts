import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLocations() {
  const locations = [
    {
      name: "Main Warehouse",
      address: "501 20th St",
      city: "Greeley",
      state: "CO",
      zipCode: "80631",
      lat: 40.4233,
      lng: -104.7091
    },
    {
      name: "Longmont",
      address: "600 Kimbark St",
      city: "Longmont",
      state: "CO",
      zipCode: "80501",
      lat: 40.1672,
      lng: -105.1019
    },
    {
      name: "Denver",
      address: "1700 Broadway",
      city: "Denver",
      state: "CO",
      zipCode: "80202",
      lat: 39.7392,
      lng: -104.9903
    },
    {
      name: "Fort Collins",
      address: "215 N Mason St",
      city: "Fort Collins",
      state: "CO",
      zipCode: "80521",
      lat: 40.5853,
      lng: -105.0844
    },
    {
      name: "Test Bay",
      address: "250 N 5th St",
      city: "Grand Junction",
      state: "CO",
      zipCode: "81501",
      lat: 39.0639,
      lng: -108.5506
    },
  ];

  for (const location of locations) {
    await prisma.location.upsert({
      where: { name: location.name },
      update: {
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        lat: location.lat,
        lng: location.lng,
      },
      create: location,
    });
    console.log(`Upserted location: ${location.name}`);
  }

  console.log('All locations seeded successfully!');
}

seedLocations()
  .catch((e) => {
    console.error('Error seeding locations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });