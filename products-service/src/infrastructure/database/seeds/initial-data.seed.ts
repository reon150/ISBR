import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from '../../../domain/entities/user.entity';
import { Product } from '../../../domain/entities/product.entity';
import { Category } from '../../../domain/entities/category.entity';
import { Currency } from '../../../domain/shared/enums/currency.enum';
import { UserRole } from '../../../domain/shared/enums/user-role.enum';

interface CategoryData {
  name: string;
  description: string;
}

export async function seedInitialData(dataSource: DataSource): Promise<void> {
  const userRepository: Repository<User> = dataSource.getRepository(User);
  const categoryRepository: Repository<Category> = dataSource.getRepository(Category);
  const productRepository: Repository<Product> = dataSource.getRepository(Product);

  // Check if data already exists
  const existingUsers: number = await userRepository.count();
  if (existingUsers > 0) {
    console.log('Seed data already exists. Skipping...');
    return;
  }

  // Create Admin User
  const adminUser: User = new User();
  adminUser.email = 'admin@system.com';
  adminUser.password = 'Admin123!';
  adminUser.name = 'System Administrator';
  adminUser.role = UserRole.ADMIN;
  await userRepository.save(adminUser);
  console.log('Admin user created: admin@system.com');

  // Create Regular User
  const regularUser: User = new User();
  regularUser.email = 'user@test.com';
  regularUser.password = 'User123!';
  regularUser.name = 'Regular User';
  regularUser.role = UserRole.USER;
  await userRepository.save(regularUser);
  console.log('Regular user created: user@test.com');

  // Create more regular users
  const additionalUsers: User[] = [];
  const staticUsers: Array<{ email: string; password: string; name: string }> = [
    { email: 'jdoe@example.com', password: 'SecurePass123!', name: 'John Doe' },
    { email: 'asmith@example.com', password: 'MyPass456!', name: 'Alice Smith' },
    { email: 'bwilson@example.com', password: 'Pass789!', name: 'Bob Wilson' },
    { email: 'cmartin@example.com', password: 'Secure123!', name: 'Carol Martin' },
    { email: 'djones@example.com', password: 'Password456!', name: 'David Jones' },
  ];

  for (let i: number = 0; i < 5; i++) {
    const user: User = new User();
    user.email = staticUsers[i].email;
    user.password = staticUsers[i].password;
    user.name = staticUsers[i].name;
    user.role = UserRole.USER;
    await userRepository.save(user);
    additionalUsers.push(user);
  }

  // Define categories with diverse products
  const categoryData: CategoryData[] = [
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Furniture', description: 'Office and home furniture' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Home & Kitchen', description: 'Home and kitchen essentials' },
    { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
    { name: 'Beauty & Personal Care', description: 'Beauty products and personal care items' },
    { name: 'Toys & Games', description: 'Toys, games, and entertainment' },
    { name: 'Automotive', description: 'Car parts and automotive accessories' },
    { name: 'Books', description: 'Books and reading materials' },
    { name: 'Grocery', description: 'Food and beverages' },
  ];

  const categories: Category[] = [];

  for (const catData of categoryData) {
    const category: Category = new Category();
    category.name = catData.name;
    category.description = catData.description;
    category.createdBy = adminUser.id;
    category.updatedBy = adminUser.id;
    await categoryRepository.save(category);
    categories.push(category);
    console.log(`✓ Category created: ${category.name}`);
  }

  // Helper function to generate products by category
  const generateProductsForCategory: (
    category: Category,
    count: number,
    baseProducts: Array<{ name: string; sku: string; description: string; price: number }>,
  ) => Array<Partial<Product>> = (
    category: Category,
    count: number,
    baseProducts: Array<{ name: string; sku: string; description: string; price: number }>,
  ): Array<Partial<Product>> => {
    const products: Array<Partial<Product>> = [];

    // Add base products first
    for (const baseProduct of baseProducts) {
      products.push({
        ...baseProduct,
        categoryId: category.id,
        currency: Currency.DOP,
        stockQuantity: Math.floor(Math.random() * 100),
        createdBy: Math.random() > 0.5 ? adminUser.id : regularUser.id,
        updatedBy: Math.random() > 0.5 ? adminUser.id : regularUser.id,
      });
    }

    // Generate additional random products
    for (let i: number = baseProducts.length; i < count; i++) {
      const productName: string = `${category.name} Product ${i + 1}`;
      const sku: string = `${category.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
      const description: string = `High quality ${category.name.toLowerCase()} product`;

      products.push({
        sku,
        name: productName,
        description,
        categoryId: category.id,
        price: Math.random() * 50000 + 100,
        currency: Currency.DOP,
        stockQuantity: Math.floor(Math.random() * 100),
        createdBy: Math.random() > 0.5 ? adminUser.id : regularUser.id,
        updatedBy: Math.random() > 0.5 ? adminUser.id : regularUser.id,
      });
    }

    return products;
  };

  // Create products for each category with diverse data
  const allProducts: Array<Partial<Product>> = [];

  // Electronics
  allProducts.push(
    ...generateProductsForCategory(categories[0], 20, [
      {
        name: 'Laptop Dell Latitude 5420',
        sku: 'LAPTOP-001',
        description: 'Laptop profesional Intel Core i7, 16GB RAM, 512GB SSD',
        price: 85000,
      },
      {
        name: 'Mouse Logitech MX Master 3',
        sku: 'MOUSE-001',
        description: 'Mouse inalámbrico ergonómico de alta precisión',
        price: 4500,
      },
      {
        name: 'Teclado Mecánico Keychron K8',
        sku: 'KEYBOARD-001',
        description: 'Teclado mecánico inalámbrico 87 teclas',
        price: 6500,
      },
      {
        name: 'Monitor LG UltraWide 34"',
        sku: 'MONITOR-001',
        description: 'Monitor curvo ultrawide 34 pulgadas, resolución 3440x1440',
        price: 35000,
      },
      {
        name: 'Audífonos Sony WH-1000XM5',
        sku: 'HEADSET-001',
        description: 'Audífonos inalámbricos con cancelación de ruido activa',
        price: 18000,
      },
      {
        name: 'Cámara Web Logitech Brio 4K',
        sku: 'WEBCAM-001',
        description: 'Cámara web profesional con resolución 4K y HDR',
        price: 12000,
      },
      {
        name: 'Impresora HP LaserJet Pro',
        sku: 'PRINTER-001',
        description: 'Impresora láser monocromática de alto rendimiento',
        price: 22000,
      },
      {
        name: 'Tablet iPad Air 5ta Gen',
        sku: 'TABLET-001',
        description: 'Tablet Apple iPad Air con chip M1, 256GB, Wi-Fi',
        price: 42000,
      },
    ]),
  );

  // Furniture
  allProducts.push(
    ...generateProductsForCategory(categories[1], 15, [
      {
        name: 'Escritorio Standing Desk Eléctrico',
        sku: 'DESK-001',
        description: 'Escritorio ajustable en altura con motor eléctrico, 120x60cm',
        price: 28000,
      },
      {
        name: 'Silla Ergonómica Herman Miller Aeron',
        sku: 'CHAIR-001',
        description: 'Silla de oficina ergonómica premium con soporte lumbar ajustable',
        price: 95000,
      },
      {
        name: 'Sofá Modular Moderno',
        sku: 'SOFA-001',
        description: 'Sofá modular con cojines extraíbles, tela resistente',
        price: 45000,
      },
      {
        name: 'Mesa de Centro de Vidrio',
        sku: 'TABLE-001',
        description: 'Mesa de centro con base de acero y vidrio templado',
        price: 15000,
      },
      {
        name: 'Escritorio Gamer Gaming Desk',
        sku: 'DESK-GAMER',
        description: 'Escritorio gaming con portavasos y control de cable',
        price: 32000,
      },
    ]),
  );

  // Clothing
  allProducts.push(
    ...generateProductsForCategory(categories[2], 25, [
      {
        name: 'Camisa Casual Oxford',
        sku: 'SHIRT-001',
        description: 'Camisa de algodón Oxford de manga larga',
        price: 2500,
      },
      {
        name: 'Pantalón Vaquero Slim Fit',
        sku: 'JEANS-001',
        description: 'Pantalón vaquero stretch, corte moderno',
        price: 3500,
      },
      {
        name: 'Zapatos Deportivos Nike Air Max',
        sku: 'SNEAKERS-001',
        description: 'Zapatos deportivos con tecnología de amortiguación',
        price: 8500,
      },
      {
        name: 'Chaqueta de Cuero Genuino',
        sku: 'JACKET-001',
        description: 'Chaqueta de cuero genuino con forro polar',
        price: 22000,
      },
      {
        name: 'Reloj Inteligente Smartwatch',
        sku: 'WATCH-001',
        description: 'Smartwatch con GPS, monitor de frecuencia cardíaca',
        price: 15000,
      },
    ]),
  );

  // Home & Kitchen
  allProducts.push(
    ...generateProductsForCategory(categories[3], 20, [
      {
        name: 'Set de Ollas y Sartenes de Acero Inoxidable',
        sku: 'POTS-001',
        description: 'Set completo de cocina antiadherente',
        price: 12500,
      },
      {
        name: 'Licuadora de Alta Velocidad',
        sku: 'BLENDER-001',
        description: 'Licuadora potente con 10 velocidades',
        price: 8500,
      },
      {
        name: 'Robot Aspirador Inteligente',
        sku: 'VACUUM-001',
        description: 'Aspirador robot con navegación inteligente',
        price: 25000,
      },
      {
        name: 'Máquina de Café Espresso',
        sku: 'COFFEE-001',
        description: 'Máquina de café espresso automática con espumador',
        price: 35000,
      },
      {
        name: 'Colchón Memory Foam Queen Size',
        sku: 'MATTRESS-001',
        description: 'Colchón ortopédico de espuma viscoelástica',
        price: 55000,
      },
    ]),
  );

  // Sports & Outdoors
  allProducts.push(
    ...generateProductsForCategory(categories[4], 15, [
      {
        name: 'Bicicleta de Montaña 21 Velocidades',
        sku: 'BIKE-001',
        description: 'Bicicleta todo terreno con frenos de disco',
        price: 32000,
      },
      {
        name: 'Tent Camping para 4 Personas',
        sku: 'TENT-001',
        description: 'Carpa impermeable con mosquitero',
        price: 15000,
      },
      {
        name: 'Set de Pesas Ajustables',
        sku: 'WEIGHTS-001',
        description: 'Dumbbells ajustables de 5-25kg por pieza',
        price: 12000,
      },
      {
        name: 'Pelota de Fútbol Profesional',
        sku: 'SOCCER-001',
        description: 'Balón de cuero sintético FIFA quality pro',
        price: 3500,
      },
      {
        name: 'Bata de Natación Competitiva',
        sku: 'SWIM-001',
        description: 'Traje de baño hidrodinámico unisex',
        price: 8500,
      },
    ]),
  );

  // Beauty & Personal Care
  allProducts.push(
    ...generateProductsForCategory(categories[5], 20, [
      {
        name: 'Kit de Cuidado Facial Premium',
        sku: 'SKIN-001',
        description: 'Rutina completa de cuidado facial con productos orgánicos',
        price: 8500,
      },
      {
        name: 'Secador de Cabello Profesional',
        sku: 'DRYER-001',
        description: 'Secador con tecnología ioni para brillo intenso',
        price: 6500,
      },
      {
        name: 'Cepillo Eléctrico Sonic',
        sku: 'TOOTHBRUSH-001',
        description: 'Cepillo dental eléctrico con sensor de presión',
        price: 4500,
      },
      {
        name: 'Perfume Importado Acqua di Gio',
        sku: 'PERFUME-001',
        description: 'Perfume masculino de alta duración',
        price: 9500,
      },
      {
        name: 'Kit de Maquillaje Profesional',
        sku: 'MAKEUP-001',
        description: 'Paleta completa de sombras y labiales',
        price: 12500,
      },
    ]),
  );

  // Toys & Games
  allProducts.push(
    ...generateProductsForCategory(categories[6], 15, [
      {
        name: 'Consola PlayStation 5',
        sku: 'PS5-001',
        description: 'Consola de videojuegos de nueva generación',
        price: 65000,
      },
      {
        name: 'Lego Set Creator 31088',
        sku: 'LEGO-001',
        description: 'Set de construcción con 223 piezas',
        price: 5500,
      },
      {
        name: 'Bicicleta de Juguete Inteligente',
        sku: 'TOYBIKE-001',
        description: 'Bici de aprendizaje con estabilizadores',
        price: 8500,
      },
      {
        name: 'Puzzle 1000 Piezas Complejo',
        sku: 'PUZZLE-001',
        description: 'Rompecabezas educativo gran formato',
        price: 2500,
      },
      {
        name: 'Muñeca Interactiva con IA',
        sku: 'DOLL-001',
        description: 'Muñeca que responde y aprende de tu conversación',
        price: 15000,
      },
    ]),
  );

  // Automotive
  allProducts.push(
    ...generateProductsForCategory(categories[7], 15, [
      {
        name: 'Neumáticos Michelin P4',
        sku: 'TIRES-001',
        description: 'Set de 4 neumáticos todo terreno',
        price: 45000,
      },
      {
        name: 'Aceite Motor Sintético 5W-30',
        sku: 'OIL-001',
        description: 'Aceite de motor premium sintético',
        price: 2500,
      },
      {
        name: 'Batería de Coche AGM Premium',
        sku: 'BATTERY-001',
        description: 'Batería de gel sellada sin mantenimiento',
        price: 18000,
      },
      {
        name: 'Limpiaparabrisas Aero V',
        sku: 'WIPERS-001',
        description: 'Set de limpiaparabrisas aerodinámicos',
        price: 3500,
      },
      {
        name: 'Cargador de Batería Inteligente',
        sku: 'CHARGER-001',
        description: 'Cargador automático multiuso 12V',
        price: 8500,
      },
    ]),
  );

  // Books
  allProducts.push(
    ...generateProductsForCategory(categories[8], 30, [
      {
        name: 'El Principito - Edición Ilustrada',
        sku: 'BOOK-001',
        description: 'Clásico de la literatura con ilustraciones originales',
        price: 1500,
      },
      {
        name: 'Harry Potter - Colección Completa',
        sku: 'BOOK-002',
        description: 'Serie completa de 7 volúmenes en edición especial',
        price: 12000,
      },
      {
        name: 'Cien Años de Soledad',
        sku: 'BOOK-003',
        description: 'Novela cumbre del realismo mágico de García Márquez',
        price: 2500,
      },
      {
        name: 'Sapiens: De Animales a Dioses',
        sku: 'BOOK-004',
        description: 'Breve historia de la humanidad de Yuval Noah Harari',
        price: 3500,
      },
      {
        name: 'Educar sin Miedo - Guía Práctica',
        sku: 'BOOK-005',
        description: 'Manual de educación positiva para padres',
        price: 2800,
      },
    ]),
  );

  // Grocery
  allProducts.push(
    ...generateProductsForCategory(categories[9], 20, [
      {
        name: 'Aceite de Oliva Extra Virgen 750ml',
        sku: 'OIL-OLIVE',
        description: 'Aceite de primera prensada en frío',
        price: 1200,
      },
      {
        name: 'Café Gourmet Artesanal 500gr',
        sku: 'COFFEE-BEAN',
        description: 'Café orgánico de altura tostado artesanalmente',
        price: 1800,
      },
      {
        name: 'Chocolate Premium Belga 200gr',
        sku: 'CHOCOLATE',
        description: 'Chocolate belga con 70% cacao puro',
        price: 950,
      },
      {
        name: 'Miel Pura de Eucalipto 500gr',
        sku: 'HONEY',
        description: 'Miel 100% natural sin pasteurizar',
        price: 1500,
      },
      {
        name: 'Salmón Ahumado Premium 200gr',
        sku: 'SALMON',
        description: 'Salmón noruego ahumado en frío',
        price: 8500,
      },
    ]),
  );

  // Create all products
  const createdProducts: Array<{ id: string; sku: string; name: string }> = [];

  for (const productData of allProducts) {
    const product: Product = new Product();
    Object.assign(product, productData);
    product.id = randomUUID();
    await productRepository.save(product);
    createdProducts.push({
      id: product.id,
      sku: product.sku,
      name: product.name,
    });
  }

  console.log('\nSeed data created successfully');
  console.log(`Total products created: ${createdProducts.length}`);
  console.log(`Total categories: ${categories.length}`);
  console.log('\nDefault Credentials:');
  console.log('Admin: admin@system.com / Admin123!');
  console.log('User: user@test.com / User123!');
  console.log(`\nAdditional ${additionalUsers.length} users created`);
}
