// 16 demo products across the 5 store categories.
// Images are served by the React app from client/public/images/products/.

const products = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description:
      'Immerse yourself in rich, balanced sound with active noise cancellation that quiets planes, trains and busy offices. Plush memory-foam ear cushions keep you comfortable for hours, while the 40-hour battery and fast charging (10 minutes = 5 hours of playback) keep the music going. Includes a built-in microphone for clear calls and multipoint Bluetooth 5.3.',
    price: 129.99,
    category: 'Electronics',
    image: '/images/products/wireless-headphones.svg',
    stock: 25,
    rating: 4.7,
    numReviews: 214,
    isFeatured: true,
  },
  {
    name: 'Smart Watch with AMOLED Display',
    description:
      'Stay on top of your day with a bright 1.9-inch AMOLED display, built-in GPS and more than 100 workout modes. Track heart rate, sleep and blood-oxygen levels, read notifications from your phone and enjoy up to 7 days of battery life. Water resistant to 50 metres.',
    price: 199.99,
    category: 'Electronics',
    image: '/images/products/smart-watch.svg',
    stock: 18,
    rating: 4.5,
    numReviews: 168,
    isFeatured: true,
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description:
      'Tactile, hot-swappable mechanical switches rated for 50 million keystrokes, per-key RGB backlighting and a durable aluminium top plate. Full N-key rollover, a detachable USB-C cable and dedicated media controls make it ready for long gaming and typing sessions.',
    price: 89.99,
    category: 'Gaming',
    image: '/images/products/mechanical-keyboard.svg',
    stock: 30,
    rating: 4.8,
    numReviews: 356,
    isFeatured: true,
  },
  {
    name: 'Lightweight Running Shoes',
    description:
      'A breathable engineered-mesh upper, responsive foam midsole and durable rubber outsole with multi-directional grip. At just 240 g per shoe, they are built for daily training runs, gym sessions and all-day comfort.',
    price: 84.99,
    category: 'Fashion',
    image: '/images/products/running-shoes.svg',
    stock: 45,
    rating: 4.3,
    numReviews: 142,
    isFeatured: true,
  },
  {
    name: '5G Smartphone (128 GB)',
    description:
      'A 6.5-inch 120 Hz OLED display, a 50 MP triple camera with night mode and an all-day 5000 mAh battery with 45 W fast charging. 8 GB of RAM and 128 GB of storage keep apps and photos running smoothly. Dual SIM with 5G connectivity.',
    price: 549.0,
    category: 'Electronics',
    image: '/images/products/smartphone.svg',
    stock: 4,
    rating: 4.6,
    numReviews: 97,
    isFeatured: true,
  },
  {
    name: 'RGB Gaming Mouse',
    description:
      'A precise 16,000 DPI optical sensor, a lightweight 69 g ergonomic shell and 7 programmable buttons. Customisable RGB lighting and on-board memory for up to 5 profiles. Braided cable and PTFE feet for smooth, fast glides.',
    price: 39.99,
    category: 'Gaming',
    image: '/images/products/gaming-mouse.svg',
    stock: 60,
    rating: 4.6,
    numReviews: 421,
    isFeatured: true,
  },
  {
    name: 'Aluminium Laptop Stand',
    description:
      'Raise your screen to eye level and improve your posture. Solid aluminium construction with 6 height settings, silicone pads that protect your laptop and an open design for better cooling. Fits 10 to 17-inch laptops and folds flat for travel.',
    price: 44.99,
    category: 'Accessories',
    image: '/images/products/laptop-stand.svg',
    stock: 38,
    rating: 4.7,
    numReviews: 263,
    isFeatured: true,
  },
  {
    name: 'LED Desk Lamp with Wireless Charger',
    description:
      'Eye-friendly, flicker-free LED light with 5 colour temperatures and 7 brightness levels. The base doubles as a 10 W wireless charger for your phone, and the adjustable arm puts light exactly where you need it. Touch controls and a 60-minute auto-off timer.',
    price: 49.99,
    category: 'Home',
    image: '/images/products/desk-lamp.svg',
    stock: 22,
    rating: 4.5,
    numReviews: 131,
    isFeatured: true,
  },
  {
    name: 'Portable Bluetooth Speaker',
    description:
      'Big 360-degree sound from a compact, waterproof (IPX7) speaker. Deep bass, 18 hours of playtime and a rugged fabric finish make it perfect for the beach, the park or the shower. Pair two speakers for true stereo sound.',
    price: 59.99,
    category: 'Electronics',
    image: '/images/products/bluetooth-speaker.svg',
    stock: 40,
    rating: 4.4,
    numReviews: 312,
    isFeatured: false,
  },
  {
    name: 'Wireless Game Controller',
    description:
      'Low-latency 2.4 GHz and Bluetooth connectivity for PC, Android and smart TVs. Hall-effect thumbsticks resist drift, dual rumble motors add immersion and the rechargeable battery lasts up to 20 hours. Textured grips keep it comfortable during long sessions.',
    price: 49.99,
    category: 'Gaming',
    image: '/images/products/game-controller.svg',
    stock: 35,
    rating: 4.5,
    numReviews: 188,
    isFeatured: false,
  },
  {
    name: 'Everyday Travel Backpack',
    description:
      'A water-resistant 25 L backpack with a padded 15.6-inch laptop sleeve, quick-access front pocket and hidden anti-theft pocket. A breathable back panel, luggage strap and built-in USB charging port make it ideal for commuting and weekend trips.',
    price: 64.99,
    category: 'Fashion',
    image: '/images/products/travel-backpack.svg',
    stock: 28,
    rating: 4.6,
    numReviews: 205,
    isFeatured: false,
  },
  {
    name: '7-in-1 USB-C Hub',
    description:
      'Turn one USB-C port into 4K HDMI, two USB-A 3.0 ports, SD and microSD card readers and 100 W USB-C Power Delivery pass-through. Compact aluminium body with a braided cable. Plug and play on Windows, macOS and Chromebooks.',
    price: 36.99,
    category: 'Accessories',
    image: '/images/products/usb-c-hub.svg',
    stock: 55,
    rating: 4.4,
    numReviews: 176,
    isFeatured: false,
  },
  {
    name: 'Fitness Band with Heart-Rate Monitor',
    description:
      'Track steps, calories, heart rate and sleep with a slim, lightweight band. 14-day battery life, 5 ATM water resistance and smart notifications. Syncs with the companion app so you can follow your progress over time.',
    price: 29.99,
    category: 'Accessories',
    image: '/images/products/fitness-band.svg',
    stock: 70,
    rating: 4.1,
    numReviews: 239,
    isFeatured: false,
  },
  {
    name: 'Polarized Aviator Sunglasses',
    description:
      'Classic aviator style with polarized, UV400-rated lenses that cut glare and protect your eyes. A lightweight metal frame with adjustable nose pads and spring hinges. Comes with a protective case and microfiber cleaning cloth.',
    price: 34.99,
    category: 'Fashion',
    image: '/images/products/aviator-sunglasses.svg',
    stock: 50,
    rating: 4.2,
    numReviews: 88,
    isFeatured: false,
  },
  {
    name: 'Ceramic Coffee Mug Set (2 pcs)',
    description:
      'Two handcrafted 350 ml stoneware mugs with a smooth reactive glaze in cream and terracotta. Microwave and dishwasher safe, with a comfortable handle and weighted base. A thoughtful gift for coffee and tea lovers.',
    price: 24.99,
    category: 'Home',
    image: '/images/products/coffee-mug-set.svg',
    stock: 3,
    rating: 4.8,
    numReviews: 74,
    isFeatured: false,
  },
  {
    name: 'Minimalist Wall Clock',
    description:
      'A clean 30 cm wall clock with a silent sweep movement - no ticking. Natural wood frame, easy-to-read markers and a scratch-resistant glass cover. Runs on a single AA battery.',
    price: 32.99,
    category: 'Home',
    image: '/images/products/wall-clock.svg',
    stock: 0,
    rating: 4.3,
    numReviews: 56,
    isFeatured: false,
  },
];

export default products;
