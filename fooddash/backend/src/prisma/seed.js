const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'admin@fooddash.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      role: 'ADMIN',
      address: 'Astana IT University, C1.3.229',
      latitude: 51.515,
      longitude: -0.09,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'john@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567891',
      role: 'CUSTOMER',
      address: '42 Baker Street, London',
      latitude: 51.5237,
      longitude: -0.1585,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'jane@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567892',
      role: 'CUSTOMER',
      address: '15 Oxford Road, London',
      latitude: 51.5155,
      longitude: -0.1410,
    },
  });

  const courierUser1 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'courier1@fooddash.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '+1234567893',
      role: 'COURIER',
      address: '5 Delivery Lane, London',
      latitude: 51.518,
      longitude: -0.12,
    },
  });

  const courierUser2 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'courier2@fooddash.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Williams',
      phone: '+1234567894',
      role: 'COURIER',
      address: '8 Fast Street, London',
      latitude: 51.520,
      longitude: -0.11,
    },
  });

  // Create Couriers
  const courier1 = await prisma.courier.create({
    data: {
      id: uuidv4(),
      userId: courierUser1.id,
      vehicleType: 'bicycle',
      isAvailable: true,
      isOnline: true,
      currentLat: 51.518,
      currentLng: -0.12,
      totalDeliveries: 156,
      rating: 4.8,
    },
  });

  const courier2 = await prisma.courier.create({
    data: {
      id: uuidv4(),
      userId: courierUser2.id,
      vehicleType: 'motorcycle',
      isAvailable: true,
      isOnline: true,
      currentLat: 51.520,
      currentLng: -0.11,
      totalDeliveries: 89,
      rating: 4.6,
    },
  });

  // Create Restaurants
  const restaurants = await Promise.all([
    prisma.restaurant.create({
      data: {
        id: uuidv4(),
        name: 'Bella Napoli',
        description: 'Authentic Italian cuisine with wood-fired pizzas and fresh pasta made daily.',
        address: '23 Italian Quarter, Soho, London',
        latitude: 51.5134,
        longitude: -0.1321,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200',
        rating: 4.7,
        reviewCount: 324,
        deliveryTime: '25-35 min',
        deliveryFee: 2.99,
        minOrder: 12.0,
        cuisine: 'Italian',
        openingTime: '11:00',
        closingTime: '23:00',
      },
    }),
    prisma.restaurant.create({
      data: {
        id: uuidv4(),
        name: 'Tokyo Ramen House',
        description: 'Rich, flavorful ramen bowls and authentic Japanese street food.',
        address: '45 East End Road, London',
        latitude: 51.5200,
        longitude: -0.0721,
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
        coverImage: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200',
        rating: 4.5,
        reviewCount: 198,
        deliveryTime: '20-30 min',
        deliveryFee: 1.99,
        minOrder: 10.0,
        cuisine: 'Japanese',
        openingTime: '11:30',
        closingTime: '22:00',
      },
    }),
    prisma.restaurant.create({
      data: {
        id: uuidv4(),
        name: 'The Grill Master',
        description: 'Premium burgers, smoked meats, and classic American BBQ.',
        address: '78 High Street, Camden, London',
        latitude: 51.5390,
        longitude: -0.1426,
        image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
        coverImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
        rating: 4.3,
        reviewCount: 412,
        deliveryTime: '30-40 min',
        deliveryFee: 3.49,
        minOrder: 15.0,
        cuisine: 'American',
        openingTime: '10:00',
        closingTime: '23:30',
      },
    }),
    prisma.restaurant.create({
      data: {
        id: uuidv4(),
        name: 'Spice Garden',
        description: 'Traditional Indian curries, tandoori specialties, and aromatic biryanis.',
        address: '12 Brick Lane, London',
        latitude: 51.5215,
        longitude: -0.0715,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        coverImage: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=1200',
        rating: 4.6,
        reviewCount: 276,
        deliveryTime: '30-45 min',
        deliveryFee: 2.49,
        minOrder: 12.0,
        cuisine: 'Indian',
        openingTime: '12:00',
        closingTime: '23:00',
      },
    }),
    prisma.restaurant.create({
      data: {
        id: uuidv4(),
        name: 'Le Petit Bistro',
        description: 'French bistro classics from croque-monsieur to coq au vin.',
        address: '56 Kings Road, Chelsea, London',
        latitude: 51.4874,
        longitude: -0.1686,
        image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800',
        coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
        rating: 4.8,
        reviewCount: 154,
        deliveryTime: '35-45 min',
        deliveryFee: 3.99,
        minOrder: 18.0,
        cuisine: 'French',
        openingTime: '10:00',
        closingTime: '22:30',
      },
    }),
    prisma.restaurant.create({
      data: {
        id: uuidv4(),
        name: 'Dragon Palace',
        description: 'Cantonese dim sum, Szechuan specialties, and wok-fried classics.',
        address: '90 Gerrard Street, Chinatown, London',
        latitude: 51.5113,
        longitude: -0.1310,
        image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800',
        coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
        rating: 4.4,
        reviewCount: 387,
        deliveryTime: '20-30 min',
        deliveryFee: 1.99,
        minOrder: 10.0,
        cuisine: 'Chinese',
        openingTime: '11:00',
        closingTime: '23:30',
      },
    }),
  ]);

  // Create categories and menu items for each restaurant
  // Restaurant 1: Bella Napoli (Italian)
  const r1Categories = await Promise.all([
    prisma.category.create({ data: { id: uuidv4(), name: 'Pizzas', sortOrder: 1, restaurantId: restaurants[0].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Pasta', sortOrder: 2, restaurantId: restaurants[0].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Appetizers', sortOrder: 3, restaurantId: restaurants[0].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Desserts', sortOrder: 4, restaurantId: restaurants[0].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Drinks', sortOrder: 5, restaurantId: restaurants[0].id } }),
  ]);

  await prisma.menuItem.createMany({
    data: [
      { id: uuidv4(), name: 'Margherita Pizza', description: 'San Marzano tomatoes, fresh mozzarella, basil', price: 12.99, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', isPopular: true, categoryId: r1Categories[0].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Pepperoni Pizza', description: 'Spicy pepperoni, mozzarella, tomato sauce', price: 14.99, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', isPopular: true, categoryId: r1Categories[0].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Quattro Formaggi', description: 'Mozzarella, gorgonzola, fontina, parmesan', price: 15.99, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', categoryId: r1Categories[0].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Diavola Pizza', description: 'Spicy salami, chili flakes, mozzarella', price: 14.49, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', categoryId: r1Categories[0].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Spaghetti Carbonara', description: 'Guanciale, egg yolk, pecorino, black pepper', price: 13.99, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', isPopular: true, categoryId: r1Categories[1].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Penne Arrabbiata', description: 'Spicy tomato sauce, garlic, chili', price: 11.99, image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400', categoryId: r1Categories[1].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Fettuccine Alfredo', description: 'Rich cream sauce, parmesan, butter', price: 13.49, image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400', categoryId: r1Categories[1].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Bruschetta', description: 'Toasted bread, tomatoes, garlic, fresh basil', price: 7.99, image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400', categoryId: r1Categories[2].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Caprese Salad', description: 'Buffalo mozzarella, tomatoes, basil, olive oil', price: 9.99, image: 'https://images.unsplash.com/photo-1608032077018-c9aad9565d29?w=400', categoryId: r1Categories[2].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert', price: 7.99, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', isPopular: true, categoryId: r1Categories[3].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Panna Cotta', description: 'Vanilla cream with berry coulis', price: 6.99, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', categoryId: r1Categories[3].id, restaurantId: restaurants[0].id },
      { id: uuidv4(), name: 'Italian Soda', description: 'Sparkling water with fruit syrup', price: 3.49, categoryId: r1Categories[4].id, restaurantId: restaurants[0].id },
    ],
  });

  // Restaurant 2: Tokyo Ramen House
  const r2Categories = await Promise.all([
    prisma.category.create({ data: { id: uuidv4(), name: 'Ramen', sortOrder: 1, restaurantId: restaurants[1].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Sushi Rolls', sortOrder: 2, restaurantId: restaurants[1].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Appetizers', sortOrder: 3, restaurantId: restaurants[1].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Drinks', sortOrder: 4, restaurantId: restaurants[1].id } }),
  ]);

  await prisma.menuItem.createMany({
    data: [
      { id: uuidv4(), name: 'Tonkotsu Ramen', description: 'Rich pork bone broth, chashu pork, soft egg, nori', price: 14.99, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', isPopular: true, categoryId: r2Categories[0].id, restaurantId: restaurants[1].id },
      { id: uuidv4(), name: 'Miso Ramen', description: 'Miso-based broth, corn, butter, bean sprouts', price: 13.99, image: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400', isPopular: true, categoryId: r2Categories[0].id, restaurantId: restaurants[1].id },
      { id: uuidv4(), name: 'Shoyu Ramen', description: 'Soy sauce broth, bamboo shoots, green onion', price: 13.49, image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400', categoryId: r2Categories[0].id, restaurantId: restaurants[1].id },
      { id: uuidv4(), name: 'Spicy Tantanmen', description: 'Chili sesame broth, ground pork, bok choy', price: 15.49, image: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400', categoryId: r2Categories[0].id, restaurantId: restaurants[1].id },
      { id: uuidv4(), name: 'California Roll', description: 'Crab, avocado, cucumber, sesame', price: 9.99, image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400', categoryId: r2Categories[1].id, restaurantId: restaurants[1].id },
      { id: uuidv4(), name: 'Dragon Roll', description: 'Shrimp tempura, eel, avocado', price: 14.99, image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400', isPopular: true, categoryId: r2Categories[1].id, restaurantId: restaurants[1].id },
      { id: uuidv4(), name: 'Gyoza (6pcs)', description: 'Pan-fried pork dumplings', price: 7.99, image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', categoryId: r2Categories[2].id, restaurantId: restaurants[1].id },
      { id: uuidv4(), name: 'Edamame', description: 'Steamed soybean pods with sea salt', price: 4.99, image: 'https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?w=400', categoryId: r2Categories[2].id, restaurantId: restaurants[1].id },
      { id: uuidv4(), name: 'Matcha Latte', description: 'Ceremonial grade matcha with steamed milk', price: 4.49, categoryId: r2Categories[3].id, restaurantId: restaurants[1].id },
    ],
  });

  // Restaurant 3: The Grill Master
  const r3Categories = await Promise.all([
    prisma.category.create({ data: { id: uuidv4(), name: 'Burgers', sortOrder: 1, restaurantId: restaurants[2].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Sides', sortOrder: 2, restaurantId: restaurants[2].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'BBQ Plates', sortOrder: 3, restaurantId: restaurants[2].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Shakes', sortOrder: 4, restaurantId: restaurants[2].id } }),
  ]);

  await prisma.menuItem.createMany({
    data: [
      { id: uuidv4(), name: 'Classic Smashburger', description: 'Double smashed patties, American cheese, pickles, special sauce', price: 12.99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', isPopular: true, categoryId: r3Categories[0].id, restaurantId: restaurants[2].id },
      { id: uuidv4(), name: 'Bacon BBQ Burger', description: 'Crispy bacon, cheddar, BBQ sauce, onion rings', price: 14.99, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400', isPopular: true, categoryId: r3Categories[0].id, restaurantId: restaurants[2].id },
      { id: uuidv4(), name: 'Mushroom Swiss Burger', description: 'Sauteed mushrooms, Swiss cheese, truffle aioli', price: 13.99, image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400', categoryId: r3Categories[0].id, restaurantId: restaurants[2].id },
      { id: uuidv4(), name: 'Loaded Fries', description: 'Crispy fries, cheese sauce, bacon, jalapeños', price: 8.99, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', isPopular: true, categoryId: r3Categories[1].id, restaurantId: restaurants[2].id },
      { id: uuidv4(), name: 'Onion Rings', description: 'Beer-battered onion rings with ranch', price: 6.99, image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400', categoryId: r3Categories[1].id, restaurantId: restaurants[2].id },
      { id: uuidv4(), name: 'Smoked Brisket Plate', description: '12-hour smoked brisket, coleslaw, cornbread', price: 18.99, image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400', categoryId: r3Categories[2].id, restaurantId: restaurants[2].id },
      { id: uuidv4(), name: 'Chocolate Shake', description: 'Thick chocolate milkshake with whipped cream', price: 5.99, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400', categoryId: r3Categories[3].id, restaurantId: restaurants[2].id },
    ],
  });

  // Restaurant 4: Spice Garden
  const r4Categories = await Promise.all([
    prisma.category.create({ data: { id: uuidv4(), name: 'Curries', sortOrder: 1, restaurantId: restaurants[3].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Tandoori', sortOrder: 2, restaurantId: restaurants[3].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Rice & Bread', sortOrder: 3, restaurantId: restaurants[3].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Starters', sortOrder: 4, restaurantId: restaurants[3].id } }),
  ]);

  await prisma.menuItem.createMany({
    data: [
      { id: uuidv4(), name: 'Butter Chicken', description: 'Creamy tomato-based curry with tender chicken', price: 13.99, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', isPopular: true, categoryId: r4Categories[0].id, restaurantId: restaurants[3].id },
      { id: uuidv4(), name: 'Lamb Rogan Josh', description: 'Slow-cooked lamb in aromatic Kashmiri spices', price: 15.99, image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=400', isPopular: true, categoryId: r4Categories[0].id, restaurantId: restaurants[3].id },
      { id: uuidv4(), name: 'Palak Paneer', description: 'Spinach and cottage cheese in spiced gravy', price: 11.99, image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=400', categoryId: r4Categories[0].id, restaurantId: restaurants[3].id },
      { id: uuidv4(), name: 'Chicken Tikka', description: 'Marinated chicken grilled in tandoor oven', price: 12.99, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400', isPopular: true, categoryId: r4Categories[1].id, restaurantId: restaurants[3].id },
      { id: uuidv4(), name: 'Hyderabadi Biryani', description: 'Fragrant basmati rice with spiced meat', price: 14.99, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', categoryId: r4Categories[2].id, restaurantId: restaurants[3].id },
      { id: uuidv4(), name: 'Garlic Naan', description: 'Soft flatbread with fresh garlic', price: 3.49, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', categoryId: r4Categories[2].id, restaurantId: restaurants[3].id },
      { id: uuidv4(), name: 'Samosa (2pcs)', description: 'Crispy pastry filled with spiced potatoes', price: 5.99, image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=400', categoryId: r4Categories[3].id, restaurantId: restaurants[3].id },
    ],
  });

  // Restaurant 5: Le Petit Bistro
  const r5Categories = await Promise.all([
    prisma.category.create({ data: { id: uuidv4(), name: 'Mains', sortOrder: 1, restaurantId: restaurants[4].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Starters', sortOrder: 2, restaurantId: restaurants[4].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Desserts', sortOrder: 3, restaurantId: restaurants[4].id } }),
  ]);

  await prisma.menuItem.createMany({
    data: [
      { id: uuidv4(), name: 'Coq au Vin', description: 'Braised chicken in red wine with mushrooms', price: 19.99, image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400', isPopular: true, categoryId: r5Categories[0].id, restaurantId: restaurants[4].id },
      { id: uuidv4(), name: 'Croque-Monsieur', description: 'Grilled ham and cheese with béchamel', price: 12.99, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', isPopular: true, categoryId: r5Categories[0].id, restaurantId: restaurants[4].id },
      { id: uuidv4(), name: 'Steak Frites', description: 'Pan-seared steak with herb butter and fries', price: 22.99, image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400', categoryId: r5Categories[0].id, restaurantId: restaurants[4].id },
      { id: uuidv4(), name: 'French Onion Soup', description: 'Rich beef broth, caramelized onions, gruyere', price: 9.99, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', isPopular: true, categoryId: r5Categories[1].id, restaurantId: restaurants[4].id },
      { id: uuidv4(), name: 'Crème Brûlée', description: 'Vanilla custard with caramelized sugar', price: 8.99, image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400', categoryId: r5Categories[2].id, restaurantId: restaurants[4].id },
    ],
  });

  // Restaurant 6: Dragon Palace
  const r6Categories = await Promise.all([
    prisma.category.create({ data: { id: uuidv4(), name: 'Dim Sum', sortOrder: 1, restaurantId: restaurants[5].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Wok Specials', sortOrder: 2, restaurantId: restaurants[5].id } }),
    prisma.category.create({ data: { id: uuidv4(), name: 'Noodles', sortOrder: 3, restaurantId: restaurants[5].id } }),
  ]);

  await prisma.menuItem.createMany({
    data: [
      { id: uuidv4(), name: 'Har Gow (4pcs)', description: 'Crystal shrimp dumplings', price: 6.99, image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', isPopular: true, categoryId: r6Categories[0].id, restaurantId: restaurants[5].id },
      { id: uuidv4(), name: 'Siu Mai (4pcs)', description: 'Pork and shrimp dumplings', price: 6.49, image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', categoryId: r6Categories[0].id, restaurantId: restaurants[5].id },
      { id: uuidv4(), name: 'Kung Pao Chicken', description: 'Wok-fried chicken with peanuts and chili', price: 13.99, image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400', isPopular: true, categoryId: r6Categories[1].id, restaurantId: restaurants[5].id },
      { id: uuidv4(), name: 'Sweet & Sour Pork', description: 'Crispy pork in tangy sweet and sour sauce', price: 12.99, image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', categoryId: r6Categories[1].id, restaurantId: restaurants[5].id },
      { id: uuidv4(), name: 'Beef Chow Mein', description: 'Stir-fried egg noodles with beef and vegetables', price: 11.99, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', isPopular: true, categoryId: r6Categories[2].id, restaurantId: restaurants[5].id },
      { id: uuidv4(), name: 'Dan Dan Noodles', description: 'Spicy Szechuan noodles with minced pork', price: 10.99, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', categoryId: r6Categories[2].id, restaurantId: restaurants[5].id },
    ],
  });

  // Create sample orders
  const menuItems = await prisma.menuItem.findMany({ take: 5 });

  const order1 = await prisma.order.create({
    data: {
      id: uuidv4(),
      orderNumber: 'FD-100001',
      status: 'DELIVERED',
      totalAmount: 32.97,
      deliveryFee: 2.99,
      deliveryAddress: '42 Baker Street, London',
      deliveryLat: 51.5237,
      deliveryLng: -0.1585,
      paymentMethod: 'ONLINE',
      customerId: customer1.id,
      restaurantId: restaurants[0].id,
      courierId: courier1.id,
      estimatedTime: '30 min',
      deliveredAt: new Date(Date.now() - 86400000),
      items: {
        create: [
          { id: uuidv4(), quantity: 2, price: 12.99, menuItemId: menuItems[0].id },
          { id: uuidv4(), quantity: 1, price: 7.99, menuItemId: menuItems[3]?.id || menuItems[0].id },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      id: uuidv4(),
      amount: 35.96,
      method: 'ONLINE',
      status: 'COMPLETED',
      orderId: order1.id,
      userId: customer1.id,
    },
  });

  await prisma.review.create({
    data: {
      id: uuidv4(),
      rating: 5,
      comment: 'Amazing pizza! Delivered hot and fresh. Will order again!',
      orderId: order1.id,
      userId: customer1.id,
      restaurantId: restaurants[0].id,
    },
  });

  console.log('✅ Seed data created successfully!');
  console.log('');
  console.log('📧 Test Accounts:');
  console.log('   Admin:    admin@fooddash.com / password123');
  console.log('   Customer: john@example.com / password123');
  console.log('   Customer: jane@example.com / password123');
  console.log('   Courier:  courier1@fooddash.com / password123');
  console.log('   Courier:  courier2@fooddash.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
