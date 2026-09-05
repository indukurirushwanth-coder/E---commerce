const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const { createTables } = require('../db/schema');

// Reusable image helpers — deterministic Unsplash photo IDs
const IMG = {
  phone1: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&q=80',
  phone2: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&q=80',
  phone3: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=700&q=80',
  phone4: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=700&q=80',
  laptop1: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&q=80',
  laptop2: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=700&q=80',
  laptop3: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=700&q=80',
  laptop4: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&q=80',
  watch1: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=80',
  watch2: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=700&q=80',
  watch3: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=700&q=80',
  watch4: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=700&q=80',
  speakers: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700&q=80',
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80',
  earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&q=80',
  camera: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=700&q=80',
  keyboard: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80',
  mouse: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&q=80',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&q=80',
  shoe1: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80',
  shoe2: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=700&q=80',
  shirt1: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&q=80',
  shirt2: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=700&q=80',
  jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&q=80',
  jeans: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=700&q=80',
  dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&q=80',
  bag: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&q=80',
  wallet: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=700&q=80',
  sofa: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&q=80',
  chair: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=700&q=80',
  lamp: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&q=80',
  table: 'https://images.unsplash.com/photo-1532372320978-9d0b1e0e8f3a?w=700&q=80',
  bed: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700&q=80',
  tv: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=700&q=80',
  fridge: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=700&q=80',
  ac: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=700&q=80',
  washer: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=700&q=80',
  blender: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=700&q=80',
  gpu: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=700&q=80',
  ram: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=700&q=80',
  ssd: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=700&q=80',
  perfume: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=700&q=80',
  serum: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700&q=80',
  cream: 'https://images.unsplash.com/photo-1556229010-aa3f7ff66b24?w=700&q=80',
  lipstick: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=700&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&q=80',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&q=80',
  coffee: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=700&q=80',
  honey: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=700&q=80',
  toy: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=700&q=80',
  book: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=700&q=80',
  plant: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=700&q=80',
  gym: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&q=80',
  fryingpan: 'https://images.unsplash.com/photo-1584990347449-a2d4c9b7a2f8?w=700&q=80',
  kettle: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=700&q=80',
  sunglasses: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700&q=80',
  countertop: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=700&q=80',
  backpack: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=700&q=80',
  drone: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=700&q=80',
  tablet: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=700&q=80',
};

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets, phones, laptops and more', image: IMG.laptop1,
    children: [
      { name: 'Mobile Phones', slug: 'mobile-phones', description: 'Smartphones from top brands', image: IMG.phone1 },
      { name: 'Laptops & Computers', slug: 'laptops-computers', description: 'Laptops, desktops and accessories', image: IMG.laptop2 },
      { name: 'Audio', slug: 'audio', description: 'Headphones, speakers and earbuds', image: IMG.headphones },
      { name: 'Cameras', slug: 'cameras', description: 'DSLR and mirrorless cameras', image: IMG.camera },
      { name: 'Computer Accessories', slug: 'computer-accessories', description: 'Keyboards, mice and more', image: IMG.keyboard },
    ] },
  { name: 'Fashion', slug: 'fashion', description: 'Clothing, footwear and accessories', image: IMG.shirt1,
    children: [
      { name: 'Men', slug: 'men', description: 'Men apparel and accessories', image: IMG.shirt1 },
      { name: 'Women', slug: 'women', description: 'Women apparel and accessories', image: IMG.dress },
      { name: 'Footwear', slug: 'footwear', description: 'Shoes, sneakers and sandals', image: IMG.shoe1 },
      { name: 'Bags & Luggage', slug: 'bags-luggage', description: 'Bags, wallets and luggage', image: IMG.bag },
      { name: 'Watches', slug: 'watches', description: 'Smartwatches and classics', image: IMG.watch1 },
    ] },
  { name: 'Home & Furniture', slug: 'home-furniture', description: 'Furniture, decor and appliances', image: IMG.sofa,
    children: [
      { name: 'Furniture', slug: 'furniture', description: 'Sofas, chairs, tables & beds', image: IMG.sofa },
      { name: 'Lighting', slug: 'lighting', description: 'Lamps and home lighting', image: IMG.lamp },
      { name: 'Home Decor', slug: 'home-decor', description: 'Decor and accents', image: IMG.plant },
    ] },
  { name: 'Appliances', slug: 'appliances', description: 'Large and small home appliances', image: IMG.fridge,
    children: [
      { name: 'Refrigerators', slug: 'refrigerators', description: 'Fridges for every home', image: IMG.fridge },
      { name: 'Air Conditioners', slug: 'air-conditioners', description: 'Cooling systems', image: IMG.ac },
      { name: 'Washers & Dryers', slug: 'washers-dryers', description: 'Laundry appliances', image: IMG.washer },
      { name: 'Kitchen Appliances', slug: 'kitchen-appliances', description: 'Blenders, kettles and more', image: IMG.blender },
    ] },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Beauty, skin and hair', image: IMG.serum,
    children: [
      { name: 'Skincare', slug: 'skincare', description: 'Serums, creams and cleansers', image: IMG.serum },
      { name: 'Perfumes', slug: 'perfumes', description: 'Designer fragrances', image: IMG.perfume },
      { name: 'Makeup', slug: 'makeup', description: 'Makeup essentials', image: IMG.lipstick },
    ] },
  { name: 'Grocery', slug: 'grocery', description: 'Daily essentials and gourmet food', image: IMG.rice,
    children: [
      { name: 'Staples', slug: 'staples', description: 'Rice, dal, oil and grains', image: IMG.rice },
      { name: 'Beverages', slug: 'beverages', description: 'Coffee, tea and drinks', image: IMG.coffee },
      { name: 'Food & Gourmet', slug: 'food-gourmet', description: 'Premium pantry', image: IMG.honey },
    ] },
  { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Fitness and outdoor gear', image: IMG.gym,
    children: [
      { name: 'Exercise Equipment', slug: 'exercise-equipment', description: 'Home gym equipment', image: IMG.gym },
      { name: 'Outdoor Gear', slug: 'outdoor-gear', description: 'Outdoor and camping goods', image: IMG.toy },
    ] },
];

const BRANDS = [
  'NovaTech', 'PixelPro', 'SonicWave', 'CloudPeak', 'UrbanThread', 'ZenMode', 'EverHome',
  'FreshFarms', 'GlowLab', 'StrideFit', 'CraftLine', 'AeroTouch', 'VoltEdge', 'LuxeCraft',
  'DailyGoods', 'TerraGear', 'BrightHive', 'Nimbus', 'AquaPure', 'Skyline',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildProducts() {
  const products = [];
  const push = (name, catSlug, brand, price, compareAt, imgs, opts = {}) => {
    products.push({
      name, catSlug, brand, price, compareAt, imgs,
      stock: opts.stock === undefined ? Math.max(0, Math.floor(Math.random() * 60)) : opts.stock,
      discount: opts.discount !== undefined ? opts.discount : Math.round(((compareAt - price) / compareAt) * 100),
      isFeatured: opts.isFeatured === undefined ? false : opts.isFeatured,
      isTrending: opts.isTrending === undefined ? false : opts.isTrending,
      isBestSeller: opts.isBestSeller === undefined ? false : opts.isBestSeller,
      isNew: opts.isNew === undefined ? false : opts.isNew,
      desc: opts.desc || `${name} — premium quality, engineered for everyday excellence.`,
      specs: opts.specs,
      tags: opts.tags,
    });
  };

  // Electronics
  push('NovaTech X1 Pro 5G Smartphone', 'mobile-phones', 'NovaTech', 45999, 59999, [IMG.phone1, IMG.phone2, IMG.phone4], { isFeatured: true, isBestSeller: true, isTrending: true, stock: 34 });
  push('NovaTech S23 Ultra Cam Phone', 'mobile-phones', 'NovaTech', 72999, 89999, [IMG.phone2, IMG.phone1], { isTrending: true });
  push('PixelPro Mate 12 Smartphone', 'mobile-phones', 'PixelPro', 37999, 46999, [IMG.phone3, IMG.phone1], { isFeatured: true, isNew: true });
  push('PixelPro Spark SE Dual Sim', 'mobile-phones', 'PixelPro', 12999, 16999, [IMG.phone4, IMG.phone3], { isBestSeller: true });
  push('AeroTouch Fold Smartphone', 'mobile-phones', 'AeroTouch', 119999, 139999, [IMG.phone1, IMG.phone3, IMG.phone2], { isNew: true });

  push('CloudPeak UltraBook 14 (i7/16GB/512GB)', 'laptops-computers', 'CloudPeak', 84999, 104999, [IMG.laptop1, IMG.laptop3], { isFeatured: true, isBestSeller: true, isTrending: true });
  push('CloudPeak CreatorBook 16 Touch', 'laptops-computers', 'CloudPeak', 128999, 149999, [IMG.laptop2, IMG.laptop1], { isNew: true });
  push('VoltEdge Gaming Laptop RTX 4060', 'laptops-computers', 'VoltEdge', 114999, 139999, [IMG.laptop3, IMG.laptop2], { isTrending: true });
  push('VoltEdge SlimBook 15 Business', 'laptops-computers', 'VoltEdge', 56999, 69999, [IMG.laptop4, IMG.laptop3], { stock: 12 });
  push('AeroTouch All-in-One Desktop', 'laptops-computers', 'AeroTouch', 98999, 119999, [IMG.laptop1, IMG.laptop4], {});

  push('SonicWave Wireless Noise Cancelling Headphones', 'audio', 'SonicWave', 9999, 14999, [IMG.headphones, IMG.speakers], { isFeatured: true, isBestSeller: true, isTrending: true });
  push('SonicWave BassBuds Pro Earbuds', 'audio', 'SonicWave', 3499, 5999, [IMG.earbuds, IMG.headphones], { isTrending: true, isNew: true });
  push('Nimbus Soundbar Studio 5.1', 'audio', 'Nimbus', 19999, 27999, [IMG.speakers, IMG.earbuds], { isFeatured: true });
  push('SonicWave Boombox Portable Speaker', 'audio', 'SonicWave', 5499, 7999, [IMG.speakers, IMG.headphones], {});
  push('Skyline Pro Music Headset', 'audio', 'Skyline', 2199, 3999, [IMG.headphones, IMG.earbuds], { isBestSeller: true });

  push('LuxeCraft Mirrorless Camera Body 24MP', 'cameras', 'LuxeCraft', 73999, 89999, [IMG.camera, IMG.countertop], { isFeatured: true });
  push('LuxeCraft DSLR Kit 18-55mm Lens', 'cameras', 'LuxeCraft', 48999, 59999, [IMG.countertop, IMG.camera], { isBestSeller: true, stock: 8 });
  push('AeroTouch 4K Action Camera', 'cameras', 'AeroTouch', 15999, 21999, [IMG.drone, IMG.camera], { isNew: true, isTrending: true });
  push('Skyline Drone Quad Camera Pro', 'cameras', 'Skyline', 89999, 119999, [IMG.drone, IMG.countertop], { stock: 4 });

  push('CraftLine RGB Mechanical Keyboard', 'computer-accessories', 'CraftLine', 4299, 6999, [IMG.keyboard, IMG.mouse], { isTrending: true });
  push('CraftLine Pro Wireless Mouse', 'computer-accessories', 'CraftLine', 1499, 2499, [IMG.mouse, IMG.keyboard], { isBestSeller: true });
  push('VoltEdge 27" 144Hz Gaming Monitor', 'computer-accessories', 'VoltEdge', 27999, 34999, [IMG.monitor, IMG.gpu], { isFeatured: true });
  push('VoltEdge RTX 4070 Graphics Card', 'computer-accessories', 'VoltEdge', 54999, 62999, [IMG.gpu, IMG.monitor], { stock: 6 });
  push('CloudPeak 32GB DDR5 RAM Kit', 'computer-accessories', 'CloudPeak', 9999, 12999, [IMG.ram, IMG.ssd], {});
  push('CloudPeak 1TB NVMe SSD', 'computer-accessories', 'CloudPeak', 8999, 11999, [IMG.ssd, IMG.ram], { isNew: true });

  // Fashion
  push('UrbanThread Classic Fit Tee Set', 'men', 'UrbanThread', 899, 1499, [IMG.shirt1, IMG.shirt2], { isBestSeller: true, isTrending: true });
  push('UrbanThread Premium Linen Shirt', 'men', 'UrbanThread', 1899, 2999, [IMG.shirt2, IMG.shirt1], { isFeatured: true });
  push('UrbanThread Denim Jacket', 'men', 'UrbanThread', 3999, 5999, [IMG.jacket, IMG.jeans], { isTrending: true });
  push('UrbanThread Slim Fit Jeans', 'men', 'UrbanThread', 2499, 3499, [IMG.jeans, IMG.shirt1], { isBestSeller: true });
  push('TerraGear Cotton Cargo Pants', 'men', 'TerraGear', 2199, 2999, [IMG.jeans, IMG.shirt2], {});

  push('UrbanThread Floral Evening Dress', 'women', 'UrbanThread', 3499, 4999, [IMG.dress, IMG.shirt1], { isFeatured: true, isNew: true });
  push('GlowLab Luxury Silk Saree Gold', 'women', 'GlowLab', 6499, 8999, [IMG.dress, IMG.serum], { stock: 9 });
  push('UrbanThread Tailored Blazer Women', 'women', 'UrbanThread', 4999, 6999, [IMG.shirt2, IMG.dress], {});
  push('BrightHive Kaftan Maxi Dress', 'women', 'BrightHive', 1999, 2999, [IMG.dress, IMG.shirt2], { isBestSeller: true });

  push('StrideFit Air Max Running Shoes', 'footwear', 'StrideFit', 4999, 7999, [IMG.shoe1, IMG.shoe2], { isFeatured: true, isBestSeller: true, isTrending: true });
  push('StrideFit Flex Knit Sneakers', 'footwear', 'StrideFit', 3499, 5499, [IMG.shoe2, IMG.shoe1], { isTrending: true });
  push('TerraGear Hiking Boots Pro', 'footwear', 'TerraGear', 6999, 8999, [IMG.shoe1, IMG.shoe2], { stock: 15 });
  push('StrideFit Classic Leather Loafers', 'footwear', 'StrideFit', 3999, 5999, [IMG.shoe2, IMG.shoe1], {});

  push('LuxeCraft Leather Weekender Bag', 'bags-luggage', 'LuxeCraft', 5999, 8999, [IMG.bag, IMG.backpack], { isFeatured: true });
  push('BrightHive Backpack 40L Travel', 'bags-luggage', 'BrightHive', 2999, 4499, [IMG.backpack, IMG.bag], { isBestSeller: true, isTrending: true });
  push('LuxeCraft Slim RFID Wallet', 'bags-luggage', 'LuxeCraft', 1299, 1999, [IMG.wallet, IMG.bag], { isBestSeller: true });
  push('BrightHive Duffel Gym Bag', 'bags-luggage', 'BrightHive', 1799, 2999, [IMG.bag, IMG.wallet], {});

  push('ZenMode Classic Analog Watch', 'watches', 'ZenMode', 4999, 7999, [IMG.watch1, IMG.watch2], { isFeatured: true, isBestSeller: true });
  push('ZenMode Smart Watch Fitness 45mm', 'watches', 'ZenMode', 8999, 12999, [IMG.watch2, IMG.watch3], { isTrending: true, isNew: true });
  push('ZenMode Chronograph Steel Watch', 'watches', 'ZenMode', 8499, 11999, [IMG.watch3, IMG.watch4], {});
  push('ZenMode Minimalist Mesh Watch', 'watches', 'ZenMode', 3499, 4999, [IMG.watch4, IMG.watch1], { isBestSeller: true });

  // Home & Furniture
  push('EverHome 3-Seater Fabric Sofa', 'furniture', 'EverHome', 45999, 59999, [IMG.sofa, IMG.chair], { isFeatured: true, isTrending: true });
  push('EverHome Ergonomic Office Chair', 'furniture', 'EverHome', 14999, 19999, [IMG.chair, IMG.sofa], { isBestSeller: true });
  push('EverHome Solid Wood Dining Table (6 Seater)', 'furniture', 'EverHome', 28999, 37999, [IMG.table, IMG.chair], {});
  push('EverHome Queen Mattress Ortho', 'furniture', 'EverHome', 19999, 29999, [IMG.bed, IMG.sofa], { stock: 11 });
  push('CraftLine Modular Bookshelf', 'furniture', 'CraftLine', 11999, 16999, [IMG.table, IMG.book], { isNew: true });

  push('BrightHive LED Floor Lamp', 'lighting', 'BrightHive', 1499, 2499, [IMG.lamp, IMG.plant], { isBestSeller: true });
  push('BrightHive Smart Bulb Starter Kit', 'lighting', 'BrightHive', 1999, 2999, [IMG.lamp, IMG.sofa], { isTrending: true });
  push('EverHome Crystal Chandelier', 'lighting', 'EverHome', 9999, 14999, [IMG.lamp, IMG.table], {});

  push('TerraGear Indoor Planter Bundle', 'home-decor', 'TerraGear', 2499, 3499, [IMG.plant, IMG.sofa], {});
  push('EverHome Velvet Throw Pillow Set', 'home-decor', 'EverHome', 1299, 1999, [IMG.sofa, IMG.bed], { isBestSeller: true });
  push('CraftLine Wall Art Abstract Trio', 'home-decor', 'CraftLine', 3999, 5999, [IMG.book, IMG.plant], { isNew: true });

  // Appliances
  push('FreshFarms 265L Double Door Fridge', 'refrigerators', 'FreshFarms', 28999, 37999, [IMG.fridge, IMG.washer], { isFeatured: true, isBestSeller: true });
  push('FreshFarms 180L Single Door Fridge', 'refrigerators', 'FreshFarms', 15999, 21999, [IMG.fridge, IMG.blender], { isBestSeller: true });
  push('FreshFarms 550L Side-by-Side Fridge', 'refrigerators', 'FreshFarms', 84999, 99999, [IMG.fridge, IMG.ac], { stock: 5 });

  push('Skyline 1.5 Ton Inverter AC', 'air-conditioners', 'Skyline', 36999, 45999, [IMG.ac, IMG.fridge], { isFeatured: true, isTrending: true });
  push('Skyline 1.0 Ton AC Window', 'air-conditioners', 'Skyline', 24999, 30999, [IMG.ac, IMG.washer], {});
  push('FreshFarms Tower AC Cooler Mini', 'air-conditioners', 'FreshFarms', 8999, 12999, [IMG.ac, IMG.blender], { isBestSeller: true });

  push('AquaPure Front Load Washer 7kg', 'washers-dryers', 'AquaPure', 32999, 41999, [IMG.washer, IMG.fridge], { isFeatured: true });
  push('AquaPure Top Load Washer 8kg', 'washers-dryers', 'AquaPure', 22999, 29999, [IMG.washer, IMG.kettle], { isBestSeller: true });

  push('CraftLine 1000W Mixer Blender', 'kitchen-appliances', 'CraftLine', 4999, 6999, [IMG.blender, IMG.kettle], { isBestSeller: true, isTrending: true });
  push('AquaPure Electric Kettle 1.5L', 'kitchen-appliances', 'AquaPure', 1499, 2299, [IMG.kettle, IMG.blender], { isBestSeller: true });
  push('EverHome Non-Stick Fry Pan Set (3pc)', 'kitchen-appliances', 'EverHome', 2999, 4499, [IMG.fryingpan, IMG.kettle], {});
  push('CraftLine Air Fryer 5L', 'kitchen-appliances', 'CraftLine', 8499, 11999, [IMG.fryingpan, IMG.blender], { isNew: true, isTrending: true });

  // Beauty
  push('GlowLab Vitamin C Brightening Serum', 'skincare', 'GlowLab', 1299, 1999, [IMG.serum, IMG.cream], { isFeatured: true, isBestSeller: true, isTrending: true });
  push('GlowLab Hydrating Day Cream SPF 30', 'skincare', 'GlowLab', 899, 1499, [IMG.cream, IMG.serum], { isBestSeller: true });
  push('GlowLab Retinol Night Repair', 'skincare', 'GlowLab', 1599, 2499, [IMG.serum, IMG.lipstick], { isNew: true });
  push('AquaPure Hyaluronic Sheet Mask (10pc)', 'skincare', 'AquaPure', 599, 999, [IMG.cream, IMG.serum], {});

  push('LuxeCraft Signature Eau de Parfum 100ml', 'perfumes', 'LuxeCraft', 5499, 7999, [IMG.perfume, IMG.watch1], { isFeatured: true });
  push('LuxeCraft Oud Intense Perfume', 'perfumes', 'LuxeCraft', 7999, 9999, [IMG.perfume, IMG.watch2], { isNew: true, stock: 14 });
  push('GlowLab Essence Roll On 20ml', 'perfumes', 'GlowLab', 799, 1299, [IMG.perfume, IMG.lipstick], { isBestSeller: true });

  push('GlowLab Velvet Matte Lipstick Collection', 'makeup', 'GlowLab', 999, 1599, [IMG.lipstick, IMG.serum], { isBestSeller: true, isTrending: true });
  push('GlowLab Full Coverage Foundation', 'makeup', 'GlowLab', 1199, 1799, [IMG.lipstick, IMG.cream], {});

  // Grocery
  push('FreshFarms Premium Basmati Rice 5kg', 'staples', 'FreshFarms', 599, 799, [IMG.rice, IMG.honey], { isBestSeller: true });
  push('FreshFarms Cold Pressed Groundnut Oil 1L', 'staples', 'FreshFarms', 349, 449, [IMG.oil, IMG.rice], { isBestSeller: true });
  push('DailyGoods Organic Toor Dal 1kg', 'staples', 'DailyGoods', 219, 299, [IMG.rice, IMG.oil], { isFeatured: true });
  push('FreshFarms Whole Wheat Atta 10kg', 'staples', 'FreshFarms', 549, 699, [IMG.rice, IMG.honey], {});

  push('DailyGoods Signature Coffee Beans 500g', 'beverages', 'DailyGoods', 899, 1299, [IMG.coffee, IMG.honey], { isFeatured: true, isTrending: true });
  push('DailyGoods Premium Green Tea (50 bags)', 'beverages', 'DailyGoods', 499, 799, [IMG.coffee, IMG.rice], {});
  push('FreshFarms Masala Chai Blend 250g', 'beverages', 'FreshFarms', 299, 399, [IMG.coffee, IMG.oil], { isBestSeller: true });

  push('FreshFarms Wild Forest Honey 500g', 'food-gourmet', 'FreshFarms', 699, 999, [IMG.honey, IMG.rice], { isBestSeller: true });
  push('DailyGoods Gourmet Nuts Mix 1kg', 'food-gourmet', 'DailyGoods', 1099, 1499, [IMG.honey, IMG.coffee], { isNew: true });
  push('DailyGoods Extra Virgin Olive Oil 500ml', 'food-gourmet', 'DailyGoods', 799, 1099, [IMG.oil, IMG.honey], {});

  // Sports
  push('StrideFit Adjustable Dumbbell Set 20kg', 'exercise-equipment', 'StrideFit', 6499, 8999, [IMG.gym, IMG.toy], { isFeatured: true });
  push('StrideFit Pro Yoga Mat 6mm', 'exercise-equipment', 'StrideFit', 1499, 2499, [IMG.gym, IMG.shoe2], { isBestSeller: true, isTrending: true });
  push('TerraGear Resistance Bands Kit', 'exercise-equipment', 'TerraGear', 899, 1499, [IMG.gym, IMG.shoe1], {});
  push('StrideFit Foldable Treadmill', 'exercise-equipment', 'StrideFit', 62999, 76999, [IMG.gym, IMG.monitor], { stock: 3 });

  push('TerraGear Camping Tent 4-Person', 'outdoor-gear', 'TerraGear', 7999, 10999, [IMG.toy, IMG.backpack], { isFeatured: true });
  push('TerraGear Insulated Water Bottle 1L', 'outdoor-gear', 'TerraGear', 1299, 1999, [IMG.toy, IMG.gym], { isBestSeller: true });
  push('Skyline UV Sports Sunglasses', 'outdoor-gear', 'Skyline', 2499, 3999, [IMG.sunglasses, IMG.gym], { isNew: true, isTrending: true });

  return products;
}

function run() {
  createTables();

  const brandsStmt = db.prepare('INSERT OR IGNORE INTO brands (name, slug) VALUES (?, ?)');
  for (const b of BRANDS) {
    brandsStmt.run(b, b.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  }

  const catStmt = db.prepare(`INSERT INTO categories (name, slug, description, image, parent_id, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)`);
  const catIdByName = {};

  let sort = 0;
  for (const cat of CATEGORIES) {
    const parentRes = catStmt.run(cat.name, cat.slug, cat.description, cat.image, null, sort++);
    const parentId = parentRes.lastInsertRowid;
    catIdByName[cat.slug] = parentId;
    for (const child of cat.children) {
      const res = catStmt.run(child.name, child.slug, child.description, child.image, parentId, sort++);
      catIdByName[child.slug] = res.lastInsertRowid;
    }
  }

  const products = buildProducts();

  const brandIdStmt = db.prepare('SELECT id FROM brands WHERE slug = ?');
  const catIdStmt = db.prepare('SELECT id FROM categories WHERE slug = ?');

  const insertProduct = db.prepare(`INSERT INTO products
    (name, slug, description, sku, brand_id, category_id, price, compare_at_price,
     stock, low_stock_threshold, is_published, is_featured, is_trending, is_best_seller, is_new,
     tags, specifications, rating_avg, rating_count, reviews_count, view_count, sold_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 5, 1, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?)`);

  const insertImage = db.prepare('INSERT INTO product_images (product_id, url, alt, sort_order) VALUES (?, ?, ?, ?)');
  const insertVariant = db.prepare('INSERT INTO product_variants (product_id, sku, name, color, size, price, compare_at_price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

  const specTemplates = {
    'mobile-phones': { 'Display': '6.7" AMOLED, 120Hz', 'Battery': '5000 mAh, 67W fast charge', 'Processor': 'Octa-core', 'Camera': '50MP AI triple camera', 'OS': 'Android 14', 'Warranty': '1 year' },
    'laptops-computers': { 'Processor': 'Intel Core i7', 'RAM': '16GB DDR5', 'Storage': '512GB NVMe SSD', 'Display': '14" 2.8K', 'Battery Life': 'Up to 12 hours', 'Warranty': '2 years' },
    'audio': { 'Battery': 'Up to 30 hours', 'Bluetooth': '5.3', 'Noise Cancellation': 'Active ANC', 'Warranty': '1 year' },
    'watches': { 'Water Resistance': '5 ATM', 'Movement': 'Precision quartz', 'Case': 'Stainless steel 42mm', 'Warranty': '2 years' },
  };

  let i = 0;
  for (const p of products) {
    i += 1;
    const brand = brandIdStmt.get(brandIdStmt && p.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    const brandId = brand ? brand.id : null;
    const cat = catIdStmt.get(p.catSlug);
    const categoryId = cat ? cat.id : 1;
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) + '-' + i;
    const sku = 'SKU-' + String(1000 + i);
    const sold = Math.floor(Math.random() * 300);
    const specs = JSON.stringify(specTemplates[p.catSlug] || { Material: 'Premium quality', Brand: p.brand, Warranty: '1 year' });
    const tags = [p.brand, p.catSlug].join(',');

    const res = insertProduct.run(
      p.name, slug, p.desc, sku, brandId, categoryId, p.price, p.compareAt,
      p.stock, p.isFeatured ? 1 : 0, p.isTrending ? 1 : 0, p.isBestSeller ? 1 : 0, p.isNew ? 1 : 0,
      tags, specs, sold
    );
    const productId = res.lastInsertRowid;

    p.imgs.forEach((url, idx) => {
      insertImage.run(productId, url, p.name, idx);
    });

    const variants = p.catSlug === 'footwear' || p.catSlug === 'men' || p.catSlug === 'women'
      ? [['Black', 'M'], ['Black', 'L'], ['Black', 'XL'], ['Navy', 'M'], ['Navy', 'L']]
      : p.catSlug === 'mobile-phones' || p.catSlug === 'laptops-computers'
        ? [['Midnight Black', null], ['Space Grey', null], ['Ocean Blue', null]]
        : [];
    variants.forEach((v, vi) => {
      insertVariant.run(productId, sku + '-' + (vi + 1), v.join(' '), v[0], v[1], p.price, p.compareAt, Math.max(0, Math.floor(p.stock * 0.8)), p.imgs[0]);
    });
  }

  // Admin + demo customer
  const hasAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@shopx.com');
  if (!hasAdmin) {
    db.prepare(`INSERT INTO users (full_name, email, phone, password_hash, role, email_verified)
      VALUES (?, ?, ?, ?, 'admin', 1)`)
      .run('ShopX Admin', 'admin@shopx.com', '+91 90000 00000', bcrypt.hashSync('admin123', 10));
  }
  const hasCustomer = db.prepare('SELECT id FROM users WHERE email = ?').get('customer@shopx.com');
  if (!hasCustomer) {
    db.prepare(`INSERT INTO users (full_name, email, phone, password_hash, role, email_verified)
      VALUES (?, ?, ?, ?, 'customer', 1)`)
      .run('Test Customer', 'customer@shopx.com', '+91 90000 00001', bcrypt.hashSync('customer123', 10));
    const seededCustomer = db.prepare('SELECT id FROM users WHERE email = ?').get('customer@shopx.com');
    db.prepare('INSERT OR IGNORE INTO cart (user_id) VALUES (?)').run(seededCustomer.id);
    db.prepare('INSERT OR IGNORE INTO wishlist (user_id) VALUES (?)').run(seededCustomer.id);
  }

  // Seed a few sample orders so analytics/admin looks alive (only if no orders exist)
  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  if (orderCount === 0) {
    const customer = db.prepare(`SELECT id FROM users WHERE email = 'customer@shopx.com'`).get();
    const top = db.prepare(`SELECT p.*, (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) as image
      FROM products p WHERE p.is_best_seller = 1 LIMIT 5`).all();
    db.prepare(`INSERT INTO addresses (user_id, full_name, phone, email, house, city, state, pin_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'India', 1)`)
      .run(customer.id, 'Test Customer', '+91 90000 00001', 'customer@shopx.com', '21 MG Road', 'Bengaluru', 'Karnataka', '560001');

    const statuses = ['delivered', 'shipped', 'confirmed', 'delivered', 'out_for_delivery'];
    top.forEach((p, idx) => {
      const num = Date.now() + idx;
      const orderNumber = 'SXSEED' + String(100000 + idx);
      const status = statuses[idx % statuses.length];
      const subtotal = p.price * 2;
      const total = subtotal + 49 + Math.round(subtotal * 0.05);
      const ores = db.prepare(`INSERT INTO orders (order_number, user_id, address_id, status, payment_method, payment_status, payment_gateway, payment_ref,
        subtotal, discount, delivery_fee, tax, total, tracking_stage, created_at)
        VALUES (?, ?, 1, ?, 'card', 'paid', 'shopx-pay', ?, ?, 0, 49, ?, ?, ?, datetime('now', ?))`)
        .run(orderNumber, customer.id, status, 'PAY' + String(200000 + idx), subtotal, Math.round(subtotal * 0.05), total, status, '-' + String(idx * 4) + ' days');
      db.prepare(`INSERT INTO order_items (order_id, product_id, product_name, image, quantity, price, total)
        VALUES (?, ?, ?, ?, 2, ?, ?)`).run(ores.lastInsertRowid, p.id, p.name, p.image, p.price, p.price * 2);
      db.prepare(`INSERT INTO payments (order_id, user_id, gateway, amount, status, method, provider_ref)
        VALUES (?, ?, 'shopx-pay', ?, 'paid', 'card', ?)`).run(ores.lastInsertRowid, customer.id, total, 'PAY' + String(300000 + idx));
      db.prepare(`UPDATE products SET sold_count = sold_count + 2, stock = MAX(0, stock - 2) WHERE id = ?`).run(p.id);
    });

    db.prepare(`INSERT INTO coupons (code, description, type, value, min_order_amount, max_discount_amount, usage_limit, is_active, expiry_date)
      VALUES ('WELCOME10', '10% off on your first order', 'percent', 10, 999, 500, 1000, 1, datetime('now', '+365 days'))`).run();
    db.prepare(`INSERT INTO coupons (code, description, type, value, min_order_amount, max_discount_amount, usage_limit, is_active, expiry_date)
      VALUES ('SHOPX200', 'Flat Rs. 200 off on orders above Rs. 2999', 'fixed', 200, 2999, null, 500, 1, datetime('now', '+180 days'))`).run();
  }

  console.log('Seed completed.');
}

run();