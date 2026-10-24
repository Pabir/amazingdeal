// Master Categories Taxonomy and Catalog Bank for AmazingDeal Platform

export interface CatalogItemSuggestion {
  title: string;
  category: string;
  price: number;
  comparePrice: number;
  unit: string;
  description: string;
  imageUrl: string;
}

export interface StoreCategoryDefinition {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  badge: string;
  items: CatalogItemSuggestion[];
}

export const MASTER_STORE_CATEGORIES: StoreCategoryDefinition[] = [
  {
    id: 'groceries',
    name: 'Daily Essentials & Groceries',
    tagline: 'Kiranas, provision stores, flour/atta, rice, oil & daily rations',
    icon: 'ShoppingBag',
    badge: 'Fastest Growing',
    items: [
      {
        title: 'Aashirvaad Shudh Chakki Atta (5kg)',
        category: 'Grains & Flours',
        price: 245.0,
        comparePrice: 280.0,
        unit: '5 kg',
        description: '100% pure whole wheat stone ground atta. High fiber, zero added maida.',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Fortune Sunlite Refined Sunflower Oil (1L)',
        category: 'Cooking Oils',
        price: 145.0,
        comparePrice: 170.0,
        unit: '1 L Pouch',
        description: 'Light, healthy sunflower cooking oil enriched with Vitamins A & D.',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'India Gate Basmati Rice Classic (1kg)',
        category: 'Grains & Flours',
        price: 175.0,
        comparePrice: 210.0,
        unit: '1 kg',
        description: 'Aged long-grain aromatic Basmati rice for premium biryani and pulao.',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Tata Salt Vacuum Evaporated Iodized Salt (1kg)',
        category: 'Spices & Staples',
        price: 28.0,
        comparePrice: 30.0,
        unit: '1 kg',
        description: 'Desh Ka Namak - purest vacuum-evaporated iodized salt.',
        imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Tata Tea Gold Leaf Tea (500g)',
        category: 'Beverages',
        price: 295.0,
        comparePrice: 340.0,
        unit: '500 g',
        description: 'Rich blend of Assam CTC teas with long leaves for superior aroma and taste.',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Organic Unpolished Toor Dal (1kg)',
        category: 'Grains & Flours',
        price: 165.0,
        comparePrice: 195.0,
        unit: '1 kg',
        description: 'Unpolished protein-rich arhar / toor dal without synthetic water polish.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Maggi 2-Minute Masala Noodles (Pack of 4)',
        category: 'Instant Food & Snacks',
        price: 56.0,
        comparePrice: 60.0,
        unit: '280 g (4x70g)',
        description: 'Classic favorite Masala noodles with signature spice tastemaker.',
        imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Parle-G Gold Glucose Biscuits (1kg Family Pack)',
        category: 'Instant Food & Snacks',
        price: 95.0,
        comparePrice: 110.0,
        unit: '1 kg',
        description: 'Crisp golden glucose biscuits loved by generations across India.',
        imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'supermarket',
    name: 'Supermarket & Hypermarket',
    tagline: 'Multi-aisle department stores, FMCG, home care & toiletries',
    icon: 'Store',
    badge: 'Popular',
    items: [
      {
        title: 'Surf Excel Easy Wash Detergent Powder (1kg)',
        category: 'Household & Cleaning',
        price: 140.0,
        comparePrice: 160.0,
        unit: '1 kg',
        description: 'Advanced stain removal formula for top-load and hand wash laundry.',
        imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Vim Dishwash Gel Lemon (750ml Bottle)',
        category: 'Household & Cleaning',
        price: 155.0,
        comparePrice: 180.0,
        unit: '750 ml',
        description: 'Power of 100 lemons. Cleans tough grease without leaving white residue.',
        imageUrl: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Colgate Strong Teeth Dental Cream (200g)',
        category: 'Personal Care & Hygiene',
        price: 115.0,
        comparePrice: 130.0,
        unit: '200 g',
        description: 'Amino Shakti formula adds natural calcium to make teeth 2x stronger.',
        imageUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Dettol Original Germ Protection Liquid Soap (900ml Refill)',
        category: 'Personal Care & Hygiene',
        price: 179.0,
        comparePrice: 215.0,
        unit: '900 ml',
        description: '100% better germ protection for healthy, hygienic family handwashing.',
        imageUrl: 'https://images.unsplash.com/photo-1608248597359-009778096f9c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Lizol Floral Surface & Floor Cleaner Disinfectant (1L)',
        category: 'Household & Cleaning',
        price: 199.0,
        comparePrice: 230.0,
        unit: '1 L',
        description: 'Kills 99.9% germs and viruses with 10x better cleaning and long floral fragrance.',
        imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Quaker Rolled Oats 100% Whole Grain (1kg)',
        category: 'Breakfast Cereals',
        price: 175.0,
        comparePrice: 200.0,
        unit: '1 kg',
        description: 'High soluble fiber oats for heart health, weight management and energy.',
        imageUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'fruits_veg',
    name: 'Fruits & Fresh Vegetables',
    tagline: 'Subzi mandis, fresh seasonal produce, farm-to-table organic',
    icon: 'Apple',
    badge: 'Daily High Demand',
    items: [
      {
        title: 'Fresh Farm Potatoes / Aloo (1kg)',
        category: 'Fresh Vegetables',
        price: 35.0,
        comparePrice: 45.0,
        unit: '1 kg',
        description: 'Freshly harvested soil-cleaned cooking potatoes.',
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Nashik Red Onions / Pyaaz (1kg)',
        category: 'Fresh Vegetables',
        price: 45.0,
        comparePrice: 55.0,
        unit: '1 kg',
        description: 'Crisp, spicy red onions sourced directly from Maharashtra farms.',
        imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Hybrid Red Ripe Tomatoes (1kg)',
        category: 'Fresh Vegetables',
        price: 40.0,
        comparePrice: 50.0,
        unit: '1 kg',
        description: 'Firm, juicy red tomatoes perfect for Indian curries and fresh salads.',
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Farm Fresh Green Palak / Spinach (1 Bunch ~250g)',
        category: 'Leafy Greens',
        price: 25.0,
        comparePrice: 30.0,
        unit: '1 Bunch',
        description: 'Tender iron-rich hydroponic spinach leaves, washed and trimmed.',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Kashmiri Royal Delicious Apples (1kg / ~4-5 Pcs)',
        category: 'Fresh Fruits',
        price: 180.0,
        comparePrice: 220.0,
        unit: '1 kg',
        description: 'Sweet, crisp and fragrant handpicked apples from Kashmir orchards.',
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Fresh Robusta Cavendish Bananas (1 Dozen / 12 Pcs)',
        category: 'Fresh Fruits',
        price: 60.0,
        comparePrice: 75.0,
        unit: '1 Dozen',
        description: 'Naturally ripened, sweet energy-rich bananas.',
        imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'dairy_bakery',
    name: 'Dairy, Milk, Sweets & Bakery',
    tagline: 'Milk booths, artisanal bakeries, sweet shops (mithai) & cakes',
    icon: 'Coffee',
    badge: 'Essential',
    items: [
      {
        title: 'Amul Taaza Homogenised Toned Milk (1L Pouch)',
        category: 'Dairy & Milk',
        price: 56.0,
        comparePrice: 58.0,
        unit: '1 L',
        description: 'Fresh pasteurized toned milk with minimum 3.0% milk fat and 8.5% SNF.',
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Fresh Malai Cow Paneer (200g Block)',
        category: 'Dairy & Milk',
        price: 90.0,
        comparePrice: 105.0,
        unit: '200 g',
        description: 'Soft, melt-in-mouth cottage cheese made from 100% pure cow milk.',
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Pure Desi Cow Ghee (1L Jar)',
        category: 'Dairy & Milk',
        price: 649.0,
        comparePrice: 749.0,
        unit: '1 L',
        description: 'Traditional bilona method granular pure cow ghee with rich aroma.',
        imageUrl: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Whole Wheat 100% Atta Brown Bread (400g)',
        category: 'Bakery & Bread',
        price: 45.0,
        comparePrice: 50.0,
        unit: '400 g',
        description: 'Fresh daily baked fiber-rich sliced brown bread without preservatives.',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Royal Kaju Katli Cashew Fudge (500g Gift Box)',
        category: 'Mithai & Sweets',
        price: 499.0,
        comparePrice: 599.0,
        unit: '500 g Box',
        description: 'Authentic melt-in-mouth cashew fudge adorned with edible silver vark.',
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Artisanal Butter Croissant (Pack of 2)',
        category: 'Bakery & Bread',
        price: 120.0,
        comparePrice: 150.0,
        unit: '2 Pcs',
        description: 'Flaky, buttery French-style breakfast croissants baked fresh every morning.',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'meat_fish',
    name: 'Meat, Poultry, Fish & Seafood',
    tagline: 'Fresh tender chicken cuts, mutton, river fish & eggs',
    icon: 'Drumstick',
    badge: 'High Value',
    items: [
      {
        title: 'Fresh Skinless Boneless Chicken Breast (500g)',
        category: 'Poultry & Chicken',
        price: 180.0,
        comparePrice: 220.0,
        unit: '500 g',
        description: 'Antibiotic-residue free, tender chicken breast fillets.',
        imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Farm Fresh Chicken Curry Cut (1kg / Skin Off)',
        category: 'Poultry & Chicken',
        price: 240.0,
        comparePrice: 280.0,
        unit: '1 kg',
        description: 'Juicy bone-in curry cut pieces cleaned and trimmed for curries.',
        imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Tender Baby Goat Mutton Curry Cut (500g)',
        category: 'Mutton & Lamb',
        price: 440.0,
        comparePrice: 520.0,
        unit: '500 g',
        description: 'Rich, tender cuts of fresh pasture-fed goat meat.',
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Fresh Farm White Eggs (Tray of 30 Eggs)',
        category: 'Eggs',
        price: 195.0,
        comparePrice: 225.0,
        unit: '30 Eggs Tray',
        description: 'Nutritious farm-fresh Grade A protein eggs.',
        imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Fresh River Rohu Fish Steaks (Bengali Cut / 1kg)',
        category: 'Fish & Seafood',
        price: 299.0,
        comparePrice: 350.0,
        unit: '1 kg (Cleaned)',
        description: 'Freshwater Rohu fish, de-scaled and cut into round curry steaks.',
        imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'restaurants',
    name: 'Restaurants, Cafes & Cloud Kitchens',
    tagline: 'Cooked meals, biryani, pizzas, rolls, burgers, chai & coffee',
    icon: 'Utensils',
    badge: 'Instant Delivery',
    items: [
      {
        title: 'Dum Handi Chicken Biryani with Raita (Serves 2)',
        category: 'Main Course Meals',
        price: 280.0,
        comparePrice: 350.0,
        unit: '1 Handi (750g)',
        description: 'Slow-cooked dum biryani with marinated tender chicken and fragrant saffron rice.',
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Paneer Butter Masala with 2 Garlic Naans',
        category: 'Main Course Meals',
        price: 240.0,
        comparePrice: 290.0,
        unit: '1 Meal Combo',
        description: 'Creamy tomato-cashew makhani gravy with tender paneer cubes and tandoori naans.',
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Farmhouse Cheese Burst Veggie Pizza (10 Inch)',
        category: 'Pizza & Fast Food',
        price: 349.0,
        comparePrice: 420.0,
        unit: '10 Inch (6 Slices)',
        description: 'Loaded with capsicum, onion, grilled mushrooms, sweet corn, and molten mozzarella.',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Cutting Masala Chai Flask (500ml / 4 Cups)',
        category: 'Beverages & Chai',
        price: 110.0,
        comparePrice: 140.0,
        unit: '500 ml Thermos Flask',
        description: 'Aromatic ginger-cardamom brewed tea delivered piping hot.',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy, Healthcare & Ayurveda',
    tagline: 'Chemist shops, OTC meds, wellness supplements & Ayurvedic care',
    icon: 'Crosshair',
    badge: 'Critical Need',
    items: [
      {
        title: 'Dolo 650mg Paracetamol Tablets (Strip of 15)',
        category: 'OTC Medicines',
        price: 32.0,
        comparePrice: 35.0,
        unit: '15 Tablets Strip',
        description: 'Effective relief for fever, headache, and body aches.',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Dettol Antiseptic Liquid (250ml Bottle)',
        category: 'First Aid & Antiseptics',
        price: 125.0,
        comparePrice: 145.0,
        unit: '250 ml',
        description: 'First aid antiseptic liquid for cuts, wounds, and household disinfection.',
        imageUrl: 'https://images.unsplash.com/photo-1608248597359-009778096f9c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Dabur Chyawanprash Immunity Booster (1kg Jar)',
        category: 'Ayurveda & Wellness',
        price: 395.0,
        comparePrice: 450.0,
        unit: '1 kg Jar',
        description: 'Enriched with Amla and 40+ Ayurvedic herbs for 2x immunity.',
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Dr. Morepen Digital Arm Blood Pressure Monitor',
        category: 'Healthcare Devices',
        price: 1299.0,
        comparePrice: 1799.0,
        unit: '1 Unit',
        description: 'Automatic high-precision digital BP measurement with memory storage.',
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'apparel',
    name: 'Apparel, Clothing & Ethnic Fashion',
    tagline: 'Clothing boutiques, sarees, shirts, jeans, kurtas & kidswear',
    icon: 'Shirt',
    badge: 'High Margin',
    items: [
      {
        title: "Men's Classic Combed Cotton Crew Neck T-Shirt",
        category: 'Men Fashion',
        price: 499.0,
        comparePrice: 899.0,
        unit: '1 Piece (M/L/XL)',
        description: '100% premium breathable combed cotton (180 GSM). Pre-shrunk fabric for lasting fit.',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: "Men's Multi-Pocket Tactical Cargo Trousers",
        category: 'Men Fashion',
        price: 999.0,
        comparePrice: 1499.0,
        unit: '1 Piece (Size 32-38)',
        description: 'Stretch cotton-twill utility trousers with 6 deep pockets and reinforced seams.',
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: "Women's Printed Rayon Anarkali Kurta with Dupatta",
        category: 'Women Ethnic Wear',
        price: 899.0,
        comparePrice: 1599.0,
        unit: '1 Set (Kurta + Dupatta)',
        description: 'Graceful floral printed flared Anarkali kurta crafted in breathable viscose rayon.',
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Pure Kanjeevaram Banarasi Silk Saree with Blouse Piece',
        category: 'Women Ethnic Wear',
        price: 2499.0,
        comparePrice: 4999.0,
        unit: '6.3 Meters with Blouse',
        description: 'Woven with rich golden zari borders and intricate floral pallu for festive celebrations.',
        imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'footwear',
    name: 'Footwear, Bags & Leather Accessories',
    tagline: 'Shoes, sports sneakers, sandals, school shoes, backpacks, wallets',
    icon: 'Footprints',
    badge: 'Lifestyle',
    items: [
      {
        title: "Men's Ultra-Light Breathable Mesh Running Shoes",
        category: 'Men Footwear',
        price: 999.0,
        comparePrice: 1799.0,
        unit: '1 Pair (UK 7-11)',
        description: 'Shock-absorbing EVA memory foam sole with flexible knit upper for running and gym.',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: "Women's Comfort Cushioned Wedge Heel Sandals",
        category: 'Women Footwear',
        price: 699.0,
        comparePrice: 1199.0,
        unit: '1 Pair (Euro 36-41)',
        description: 'Anti-skid sole with soft padded insole for all-day festive and daily wear.',
        imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Water-Resistant 15.6 Inch Laptop Backpack with USB Port',
        category: 'Bags & Luggage',
        price: 849.0,
        comparePrice: 1499.0,
        unit: '1 Bag (30L Capacity)',
        description: 'Multi-compartment durable polyester bag with padded shoulder straps.',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Genuine Vintage Leather Bi-Fold RFID Protected Wallet',
        category: 'Leather Accessories',
        price: 499.0,
        comparePrice: 999.0,
        unit: '1 Piece in Box',
        description: 'Handcrafted top-grain leather with 8 card slots, coin pocket, and RFID blocker.',
        imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics, Gadgets & Mobile Accessories',
    tagline: 'Mobile stores, TWS earbuds, chargers, cables, smart accessories',
    icon: 'Headphones',
    badge: 'High Demand',
    items: [
      {
        title: 'Wireless Bluetooth Stereo Earbuds with ANC (36hr Battery)',
        category: 'Audio & Headphones',
        price: 1499.0,
        comparePrice: 2499.0,
        unit: '1 Set in Box',
        description: 'Environmental noise cancellation, ultra-low latency gaming mode, and Type-C fast charging.',
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: '65W GaN Dual Port USB-C + USB-A Super Fast Charger',
        category: 'Mobile Accessories',
        price: 1199.0,
        comparePrice: 1899.0,
        unit: '1 Unit',
        description: 'Gallium Nitride technology charges laptops, iPhones, and Android devices at peak speed.',
        imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Heavy Duty Braided USB-C to USB-C Fast Cable (1.5m / 100W)',
        category: 'Mobile Accessories',
        price: 299.0,
        comparePrice: 599.0,
        unit: '1.5 Meter Cable',
        description: 'Tangle-free nylon braided cord with reinforced zinc alloy connectors.',
        imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: '1.83 Inch HD Bluetooth Calling Smartwatch with SpO2',
        category: 'Wearables & Smartwatches',
        price: 1599.0,
        comparePrice: 3499.0,
        unit: '1 Watch with Charger',
        description: 'Metal body, 100+ sports modes, 24/7 heart rate and blood oxygen monitoring.',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'beauty',
    name: 'Beauty, Cosmetics & Personal Care',
    tagline: 'Skincare, serums, haircare, perfumes, makeup & grooming kits',
    icon: 'Sparkles',
    badge: 'Trendy',
    items: [
      {
        title: 'Vitamin C 10% Brightening Face Serum with Hyaluronic Acid (30ml)',
        category: 'Skincare',
        price: 499.0,
        comparePrice: 799.0,
        unit: '30 ml Dropper Bottle',
        description: 'Reduces dark spots, promotes radiant glow, and repairs sun damage.',
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Red Onion Black Seed Hair Oil for Hair Fall Control (200ml)',
        category: 'Haircare',
        price: 349.0,
        comparePrice: 549.0,
        unit: '200 ml Bottle with Comb',
        description: '100% natural cold-pressed oil blend to strengthen roots and nourish scalp.',
        imageUrl: 'https://images.unsplash.com/photo-1608248597359-009778096f9c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Long-Lasting Transfer-Proof Matte Liquid Lipstick',
        category: 'Makeup & Cosmetics',
        price: 299.0,
        comparePrice: 499.0,
        unit: '1 Piece (5ml)',
        description: '12-hour smudge-proof velvety matte finish enriched with Vitamin E.',
        imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'home_kitchen',
    name: 'Home, Kitchen & Plasticware',
    tagline: 'Bartan marts, pressure cookers, non-stick tawas, bottles, storage',
    icon: 'Home',
    badge: 'Household',
    items: [
      {
        title: 'Tri-Ply Stainless Steel Outer Lid Pressure Cooker (3L)',
        category: 'Cookware',
        price: 1899.0,
        comparePrice: 2499.0,
        unit: '3 Liter Cooker',
        description: 'Induction and gas compatible tri-ply steel cooker for even heat distribution.',
        imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Non-Stick Granite Finish Dosa Tawa (28cm)',
        category: 'Cookware',
        price: 749.0,
        comparePrice: 1199.0,
        unit: '28 cm Diameter',
        description: '5-layer scratch resistant granite coating for oil-free crispy dosas and rotis.',
        imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Airtight Kitchen Storage Containers (Set of 6 / 1000ml)',
        category: 'Kitchen Storage',
        price: 499.0,
        comparePrice: 899.0,
        unit: 'Set of 6 Jars',
        description: 'BPA-free transparent modular stackable containers for pulses, dry fruits & spices.',
        imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'hardware',
    name: 'Hardware, Electricals, Sanitary & Paints',
    tagline: 'Paints, LED bulbs, switches, plumbing pipes, tools & bath fittings',
    icon: 'Wrench',
    badge: 'Trade & Repair',
    items: [
      {
        title: '9W Cool Day White LED Bulbs (Pack of 4)',
        category: 'Electricals & Lighting',
        price: 299.0,
        comparePrice: 480.0,
        unit: 'Pack of 4 Bulbs',
        description: 'Energy saving B22 base 6500K bright white LED bulbs with surge protection.',
        imageUrl: 'https://images.unsplash.com/photo-1550985543-f47f38aee65e?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Heavy Duty 4-Way Surge Protector Extension Board with 2 USB',
        category: 'Electricals',
        price: 499.0,
        comparePrice: 799.0,
        unit: '1 Board (2m Cord)',
        description: 'Master switch with individual indicator and overload thermal circuit breaker.',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Drop-Forged Steel Claw Hammer with Fiberglass Handle',
        category: 'Hardware Tools',
        price: 249.0,
        comparePrice: 399.0,
        unit: '1 Piece (500g)',
        description: 'Anti-slip rubberized grip hammer for carpenter and household repair tasks.',
        imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'stationery',
    name: 'Stationery, Books & Office Supplies',
    tagline: 'School notebooks, pens, printing paper, art supplies & calculators',
    icon: 'BookOpen',
    badge: 'Education',
    items: [
      {
        title: 'Classmate Spiral Ruled Long Notebook (Pack of 6 / 200 Pages)',
        category: 'Notebooks & Registers',
        price: 360.0,
        comparePrice: 420.0,
        unit: 'Pack of 6 Books',
        description: 'Chlorine-free whiter paper for smooth pen gliding and clean notes.',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Smooth Gel Pen Blue Ink (Box of 10 Pens)',
        category: 'Pens & Writing',
        price: 90.0,
        comparePrice: 100.0,
        unit: 'Box of 10 Pens',
        description: 'Waterproof fast-drying gel ink with comfortable rubber grip.',
        imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'JK Copier A4 Paper 75 GSM (Ream of 500 Sheets)',
        category: 'Office Paper',
        price: 299.0,
        comparePrice: 350.0,
        unit: '500 Sheets Ream',
        description: 'High-speed jam-free laser printing and photocopy paper.',
        imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'jewelry',
    name: 'Jewelry, Watches & Fashion Accessories',
    tagline: 'Imitation jewelry, Kundan sets, wristwatches, silver earrings',
    icon: 'Watch',
    badge: 'Luxury',
    items: [
      {
        title: 'Gold Plated Traditional Kundan & Pearl Choker Necklace Set',
        category: 'Imitation Jewelry',
        price: 899.0,
        comparePrice: 1999.0,
        unit: '1 Set (Necklace + Earrings)',
        description: 'Handcrafted Kundan jewelry with matching drop earrings for weddings.',
        imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: "Men's Luxury Quartz Chronograph Stainless Steel Watch",
        category: 'Watches',
        price: 1299.0,
        comparePrice: 2999.0,
        unit: '1 Watch in Velvet Box',
        description: 'Water-resistant mineral glass dial with date display and metal link strap.',
        imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'toys_baby',
    name: 'Toys, Baby Care & Kids World',
    tagline: 'Diapers, baby wipes, board games, learning toys, cycles & strollers',
    icon: 'Smile',
    badge: 'Kids',
    items: [
      {
        title: 'Pampers All Round Protection Diaper Pants (Large / 64 Count)',
        category: 'Baby Care & Diapers',
        price: 899.0,
        comparePrice: 1099.0,
        unit: 'Pack of 64 Diapers',
        description: 'Anti-rash lotion with Aloe Vera and 12-hour leak-lock absorption.',
        imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Magnetic 3D Building Blocks Construction Set (64 Pieces)',
        category: 'Educational Toys',
        price: 799.0,
        comparePrice: 1299.0,
        unit: '64 Pcs Box Set',
        description: 'STEM developmental building tiles with strong magnets for creative play.',
        imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'pet_food',
    name: 'Pet Food & Pet Supplies',
    tagline: 'Dog food, cat treats, pet shampoos, leashes, chew bones & toys',
    icon: 'Heart',
    badge: 'Care',
    items: [
      {
        title: 'Pedigree Adult Complete Dry Dog Food - Meat & Rice (3kg)',
        category: 'Dog Food',
        price: 640.0,
        comparePrice: 720.0,
        unit: '3 kg Bag',
        description: 'Balanced nutrition with 20% crude protein, Omega 6 and Zinc for healthy coat.',
        imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Whiskas Adult Dry Cat Food - Ocean Fish Flavour (1.2kg)',
        category: 'Cat Food',
        price: 395.0,
        comparePrice: 440.0,
        unit: '1.2 kg Pouch',
        description: 'Delicious crunchy pockets with fish protein and essential taurine for vision.',
        imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'pooja_gifts',
    name: 'Florist, Pooja Essentials & Gifts',
    tagline: 'Fresh flowers, dhoop, agarbatti, brass diyas, idols & festive gifts',
    icon: 'Gift',
    badge: 'Festive',
    items: [
      {
        title: 'Pure Cow Ghee Diya Battis (Box of 100 Wax-Free Diyas)',
        category: 'Pooja Essentials',
        price: 199.0,
        comparePrice: 280.0,
        unit: 'Box of 100 Battis',
        description: 'Ready-to-light pure cow ghee cotton wicks burning for 30+ minutes.',
        imageUrl: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Charcoal-Free Organic Flora Agarbatti / Incense Sticks (Pack of 3)',
        category: 'Pooja Essentials',
        price: 149.0,
        comparePrice: 225.0,
        unit: 'Pack of 3 Fragrances',
        description: 'Made from temple flowers with natural essential oils of Sandal, Rose & Mogra.',
        imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];

// Flattened popular items dictionary
export const ALL_POPULAR_ITEMS: CatalogItemSuggestion[] = MASTER_STORE_CATEGORIES.flatMap(
  (cat) => cat.items
);

// Helper to filter items based on one or more categories
export function getItemsForCategories(
  selectedCategoryNames?: string[] | string
): CatalogItemSuggestion[] {
  if (!selectedCategoryNames) return ALL_POPULAR_ITEMS;

  const namesList = Array.isArray(selectedCategoryNames)
    ? selectedCategoryNames.map((n) => n.toLowerCase().trim())
    : selectedCategoryNames.split(',').map((n) => n.toLowerCase().trim());

  if (namesList.length === 0 || namesList.includes('all')) {
    return ALL_POPULAR_ITEMS;
  }

  const matchingCats = MASTER_STORE_CATEGORIES.filter((cat) =>
    namesList.some(
      (n) =>
        cat.name.toLowerCase().includes(n) ||
        n.includes(cat.name.toLowerCase()) ||
        cat.id.toLowerCase().includes(n)
    )
  );

  if (matchingCats.length === 0) return ALL_POPULAR_ITEMS;

  return matchingCats.flatMap((c) => c.items);
}

// Autocomplete search helper
export function searchCatalogSuggestions(
  query: string,
  preferredCategories?: string[] | string
): CatalogItemSuggestion[] {
  if (!query || query.trim().length === 0) {
    return getItemsForCategories(preferredCategories).slice(0, 8);
  }

  const q = query.toLowerCase().trim();
  const pool = getItemsForCategories(preferredCategories);

  // Exact starts-with gets highest priority
  const startsWith = pool.filter((item) => item.title.toLowerCase().startsWith(q));
  const contains = pool.filter(
    (item) => !item.title.toLowerCase().startsWith(q) && item.title.toLowerCase().includes(q)
  );
  const categoryMatch = pool.filter(
    (item) =>
      !item.title.toLowerCase().includes(q) && item.category.toLowerCase().includes(q)
  );

  return [...startsWith, ...contains, ...categoryMatch].slice(0, 10);
}
