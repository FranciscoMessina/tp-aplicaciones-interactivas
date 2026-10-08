/**
 * Catalogo de demostracion que carga `npm run seed`. Cada categoria lleva sus
 * productos; para agregar uno alcanza con sumarlo a la lista de su categoria.
 * Los precios estan en pesos argentinos.
 */
export interface ProductSeed {
  name: string;
  description: string;
  price: number;
}

export interface CategorySeed {
  name: string;
  products: ProductSeed[];
}

export const catalogSeed: CategorySeed[] = [
  {
    name: "Consolas",
    products: [
      {
        name: "PlayStation 5 Slim 1TB",
        description:
          "Consola Sony PlayStation 5 Slim con lectora de discos, SSD de 1TB y joystick DualSense incluido. Juegos en 4K a hasta 120 FPS.",
        price: 1_149_999,
      },
      {
        name: "PlayStation 5 Pro 2TB",
        description:
          "La PlayStation 5 más potente, con GPU mejorada, ray tracing avanzado y escalado PSSR. Incluye SSD de 2TB y joystick DualSense.",
        price: 1_899_999,
      },
      {
        name: "Xbox Series X 1TB",
        description:
          "Consola Microsoft Xbox Series X con lectora de discos, SSD de 1TB y resolución 4K nativa. Compatible con Xbox Game Pass.",
        price: 1_199_999,
      },
      {
        name: "Xbox Series S 512GB",
        description:
          "Consola Xbox Series S totalmente digital, compacta y silenciosa. Juegos a 1440p y hasta 120 FPS con SSD de 512GB.",
        price: 649_999,
      },
      {
        name: "Nintendo Switch 2",
        description:
          "Consola híbrida Nintendo Switch 2 con pantalla LCD de 7,9 pulgadas, Joy-Con 2 magnéticos y salida 4K en modo TV.",
        price: 899_999,
      },
      {
        name: "Nintendo Switch OLED",
        description:
          "Nintendo Switch con pantalla OLED de 7 pulgadas, soporte ajustable, 64GB de almacenamiento y dock con puerto LAN.",
        price: 649_999,
      },
      {
        name: "Nintendo Switch Lite",
        description:
          "Versión portátil y liviana de la Nintendo Switch, con controles integrados. Ideal para jugar en cualquier lugar.",
        price: 399_999,
      },
      {
        name: "Steam Deck OLED 512GB",
        description:
          "PC portátil para juegos de Valve con pantalla OLED HDR de 7,4 pulgadas y acceso a toda tu biblioteca de Steam.",
        price: 1_099_999,
      },
      {
        name: "ASUS ROG Ally X",
        description:
          "Consola portátil con Windows 11, procesador AMD Ryzen Z1 Extreme, 24GB de RAM y pantalla de 120Hz. Juega en Steam, Xbox y Epic.",
        price: 1_299_999,
      },
      {
        name: "PlayStation Portal",
        description:
          "Reproductor remoto para jugar tu PlayStation 5 por Wi-Fi en una pantalla LCD de 8 pulgadas con controles DualSense.",
        price: 399_999,
      },
    ],
  },
  {
    name: "Computadoras",
    products: [
      {
        name: 'MacBook Air 13" M4',
        description:
          "Notebook Apple ultradelgada con chip M4, 16GB de memoria unificada, SSD de 256GB y hasta 18 horas de batería.",
        price: 2_199_999,
      },
      {
        name: 'MacBook Pro 14" M4 Pro',
        description:
          "Notebook profesional Apple con chip M4 Pro, 24GB de memoria, SSD de 512GB y pantalla Liquid Retina XDR.",
        price: 3_899_999,
      },
      {
        name: "Lenovo IdeaPad Slim 3 Ryzen 5",
        description:
          'Notebook de 15,6" con AMD Ryzen 5, 16GB de RAM y SSD de 512GB. Liviana y rendidora para estudio y oficina.',
        price: 899_999,
      },
      {
        name: "Lenovo Legion 5 RTX 4060",
        description:
          'Notebook gamer de 16" con Intel Core i7, placa de video NVIDIA RTX 4060, 16GB de RAM y pantalla de 165Hz.',
        price: 2_299_999,
      },
      {
        name: "ASUS ROG Strix G16 RTX 4070",
        description:
          "Notebook gamer con Intel Core i9, NVIDIA RTX 4070, 32GB de RAM DDR5 y pantalla QHD de 240Hz con refrigeración avanzada.",
        price: 2_899_999,
      },
      {
        name: "HP Pavilion 15 Core i5",
        description:
          'Notebook HP de 15,6" con Intel Core i5 de 13.ª generación, 8GB de RAM y SSD de 512GB. Teclado numérico incluido.',
        price: 999_999,
      },
      {
        name: "Dell XPS 13",
        description:
          "Ultrabook premium con Intel Core Ultra 7, 16GB de RAM, SSD de 1TB y pantalla InfinityEdge en un cuerpo de aluminio.",
        price: 2_499_999,
      },
      {
        name: "Acer Aspire 5 Core i3",
        description:
          "Notebook económica con Intel Core i3, 8GB de RAM y SSD de 256GB. Ideal para navegar, clases virtuales y ofimática.",
        price: 699_999,
      },
      {
        name: 'iMac 24" M4',
        description:
          "Computadora todo en uno de Apple con chip M4, pantalla Retina 4.5K, 16GB de memoria y teclado y mouse incluidos.",
        price: 2_799_999,
      },
      {
        name: "Mac mini M4",
        description:
          "Computadora de escritorio compacta de Apple con chip M4, 16GB de memoria y SSD de 256GB. Conecta tu propio monitor.",
        price: 1_299_999,
      },
      {
        name: "PC Gamer Ryzen 7 RTX 4070 Super",
        description:
          "PC de escritorio armada con AMD Ryzen 7 7700, NVIDIA RTX 4070 Super, 32GB de RAM DDR5 y SSD NVMe de 1TB.",
        price: 2_499_999,
      },
      {
        name: "PC de oficina Core i5",
        description:
          "Computadora de escritorio con Intel Core i5, 16GB de RAM y SSD de 480GB. Lista para trabajar con Windows 11.",
        price: 799_999,
      },
    ],
  },
  {
    name: "Celulares",
    products: [
      {
        name: "iPhone 16 128GB",
        description:
          "Celular Apple iPhone 16 con chip A18, cámara de 48MP, boton de Acción y Control de Cámara. Pantalla de 6,1 pulgadas.",
        price: 1_799_999,
      },
      {
        name: "iPhone 16 Pro Max 256GB",
        description:
          "El iPhone más grande y potente: chip A18 Pro, pantalla de 6,9 pulgadas, zoom óptico 5x y cuerpo de titanio.",
        price: 2_899_999,
      },
      {
        name: "iPhone 15 128GB",
        description:
          "Celular Apple iPhone 15 con Dynamic Island, cámara de 48MP y conector USB-C. Pantalla Super Retina XDR de 6,1 pulgadas.",
        price: 1_399_999,
      },
      {
        name: "Samsung Galaxy S25 Ultra 256GB",
        description:
          "Celular Samsung de gama alta con S Pen integrado, cámara de 200MP, zoom 100x y funciones de Galaxy AI.",
        price: 2_499_999,
      },
      {
        name: "Samsung Galaxy S25 128GB",
        description:
          "Celular Samsung compacto con procesador Snapdragon 8 Elite, pantalla de 6,2 pulgadas a 120Hz y Galaxy AI.",
        price: 1_599_999,
      },
      {
        name: "Samsung Galaxy Z Flip6",
        description:
          "Celular plegable Samsung con pantalla externa de 3,4 pulgadas, cámara de 50MP y diseño compacto que entra en cualquier bolsillo.",
        price: 1_899_999,
      },
      {
        name: "Samsung Galaxy A56 5G",
        description:
          "Celular de gama media con conectividad 5G, pantalla Super AMOLED de 120Hz, cámara de 50MP y batería de 5000mAh.",
        price: 749_999,
      },
      {
        name: "Samsung Galaxy A16",
        description:
          "Celular económico Samsung con pantalla de 6,7 pulgadas, 128GB de almacenamiento y 6 años de actualizaciones.",
        price: 329_999,
      },
      {
        name: "Motorola Edge 50 Pro",
        description:
          "Celular Motorola con pantalla curva pOLED de 144Hz, carga rápida de 125W y cámara de 50MP certificada por Pantone.",
        price: 899_999,
      },
      {
        name: "Motorola Moto G85 5G",
        description:
          "Celular Motorola 5G con pantalla curva de 120Hz, 256GB de almacenamiento y sonido Dolby Atmos.",
        price: 499_999,
      },
      {
        name: "Xiaomi Redmi Note 14 Pro",
        description:
          "Celular Xiaomi con cámara de 200MP, pantalla AMOLED de 120Hz, resistencia al agua IP68 y carga rápida de 45W.",
        price: 599_999,
      },
      {
        name: "Google Pixel 9",
        description:
          "Celular Google con chip Tensor G4, la mejor cámara con inteligencia artificial de Google y 7 años de actualizaciones de Android.",
        price: 1_499_999,
      },
    ],
  },
  {
    name: "Tablets",
    products: [
      {
        name: 'iPad 11" 128GB',
        description:
          "Tablet Apple iPad con chip A16, pantalla Liquid Retina de 11 pulgadas y compatibilidad con Apple Pencil USB-C.",
        price: 749_999,
      },
      {
        name: 'iPad Air 11" M3',
        description:
          "Tablet Apple iPad Air con chip M3, compatible con Apple Pencil Pro y Magic Keyboard. Ideal para dibujar y estudiar.",
        price: 1_199_999,
      },
      {
        name: 'iPad Pro 13" M4',
        description:
          "La tablet más potente de Apple, con chip M4 y pantalla Ultra Retina XDR OLED de 13 pulgadas en un cuerpo de 5,1mm.",
        price: 2_499_999,
      },
      {
        name: "iPad mini",
        description:
          "Tablet Apple de 8,3 pulgadas con chip A17 Pro, compatible con Apple Pencil Pro. Liviana y fácil de llevar.",
        price: 999_999,
      },
      {
        name: "Samsung Galaxy Tab S10 FE",
        description:
          "Tablet Samsung de 10,9 pulgadas con S Pen incluido, resistencia al agua IP68 y funciones de Galaxy AI.",
        price: 799_999,
      },
      {
        name: "Samsung Galaxy Tab A9+",
        description:
          "Tablet Samsung de 11 pulgadas con pantalla de 90Hz y cuatro parlantes. Perfecta para series, videos y clases.",
        price: 349_999,
      },
      {
        name: "Lenovo Tab M11",
        description:
          "Tablet Lenovo de 11 pulgadas con lápiz Tab Pen incluido, 128GB de almacenamiento y modo de lectura.",
        price: 299_999,
      },
      {
        name: "Kindle Paperwhite",
        description:
          "Lector de libros electrónicos Amazon con pantalla de 7 pulgadas sin reflejos, luz cálida ajustable y semanas de batería.",
        price: 299_999,
      },
    ],
  },
  {
    name: "Videojuegos",
    products: [
      {
        name: "EA Sports FC 26 - PS5",
        description:
          "Juego de fútbol de EA Sports para PlayStation 5 con clubes, ligas y jugadores licenciados. Incluye Ultimate Team y modo Carrera.",
        price: 99_999,
      },
      {
        name: "Marvel's Spider-Man 2 - PS5",
        description:
          "Juego de acción y aventura en mundo abierto para PlayStation 5. Jugá como Peter Parker y Miles Morales en Nueva York.",
        price: 79_999,
      },
      {
        name: "God of War Ragnarök - PS5",
        description:
          "Aventura de acción para PlayStation 5: Kratos y Atreus recorren los nueve reinos de la mitología nórdica.",
        price: 69_999,
      },
      {
        name: "Gran Turismo 7 - PS5",
        description:
          "Simulador de carreras para PlayStation 5 con más de 400 autos, circuitos reales y soporte para volante.",
        price: 69_999,
      },
      {
        name: "The Last of Us Part II Remastered - PS5",
        description:
          "Aventura de supervivencia remasterizada para PlayStation 5, con modo roguelike Sin Retorno y gráficos mejorados.",
        price: 59_999,
      },
      {
        name: "Elden Ring - PS5",
        description:
          "Juego de rol y acción en mundo abierto de FromSoftware para PlayStation 5, creado junto a George R. R. Martin.",
        price: 64_999,
      },
      {
        name: "Hogwarts Legacy - PS5",
        description:
          "Juego de rol en mundo abierto ambientado en el universo de Harry Potter. Explorá Hogwarts y aprende hechizos.",
        price: 49_999,
      },
      {
        name: "Call of Duty: Black Ops 6 - PS5",
        description:
          "Shooter en primera persona para PlayStation 5 con campaña, multijugador online y el clásico modo Zombies.",
        price: 99_999,
      },
      {
        name: "Mario Kart World - Nintendo Switch 2",
        description:
          "Juego de carreras para Nintendo Switch 2 con un mundo abierto conectado y carreras de hasta 24 jugadores.",
        price: 99_999,
      },
      {
        name: "The Legend of Zelda: Tears of the Kingdom - Switch",
        description:
          "Aventura en mundo abierto para Nintendo Switch. Link explora Hyrule y las islas del cielo con nuevas habilidades.",
        price: 84_999,
      },
      {
        name: "Super Mario Bros. Wonder - Switch",
        description:
          "Juego de plataformas 2D para Nintendo Switch con flores maravilla y multijugador local de hasta 4 jugadores.",
        price: 79_999,
      },
      {
        name: "Pokémon Legends: Z-A - Switch",
        description:
          "Juego de rol para Nintendo Switch ambientado en Ciudad Luminalia, con combates en tiempo real y megaevoluciones.",
        price: 84_999,
      },
      {
        name: "Forza Horizon 5 - Xbox",
        description:
          "Juego de carreras en mundo abierto para Xbox Series X|S ambientado en México, con cientos de autos para coleccionar.",
        price: 59_999,
      },
      {
        name: "Minecraft - Switch",
        description:
          "El juego de construcción y supervivencia para Nintendo Switch. Creá mundos bloque por bloque solo o con amigos.",
        price: 39_999,
      },
    ],
  },
  {
    name: "Accesorios gamer",
    products: [
      {
        name: "Joystick DualSense PS5",
        description:
          "Control inalámbrico oficial de PlayStation 5 con respuesta háptica, gatillos adaptativos y micrófono integrado.",
        price: 129_999,
      },
      {
        name: "Joystick DualSense Edge",
        description:
          "Control profesional para PlayStation 5 con botones traseros, sticks intercambiables y perfiles personalizables.",
        price: 349_999,
      },
      {
        name: "Control inalámbrico Xbox",
        description:
          "Joystick oficial de Xbox compatible con Xbox Series X|S, PC y celulares por Bluetooth. Agarre texturizado.",
        price: 109_999,
      },
      {
        name: "Nintendo Switch Pro Controller",
        description:
          "Control inalámbrico Pro para Nintendo Switch con vibración HD, sensores de movimiento y hasta 40 horas de batería.",
        price: 119_999,
      },
      {
        name: "Auriculares HyperX Cloud III",
        description:
          "Auriculares gamer con cable, sonido envolvente DTS, micrófono desmontable con cancelación de ruido y almohadillas comodas.",
        price: 149_999,
      },
      {
        name: "Auriculares Logitech G Pro X 2 Lightspeed",
        description:
          "Auriculares gamer inalámbricos con drivers de grafeno, conexión Lightspeed y Bluetooth, y 50 horas de batería.",
        price: 399_999,
      },
      {
        name: "Teclado mecánico Redragon Kumara",
        description:
          "Teclado mecánico compacto TKL con switches rojos, retroiluminación RGB y estructura de metal. Excelente relación precio-calidad.",
        price: 69_999,
      },
      {
        name: "Teclado Logitech G915 TKL",
        description:
          "Teclado mecánico inalámbrico de perfil bajo con conexión Lightspeed, iluminación RGB y cuerpo de aluminio.",
        price: 349_999,
      },
      {
        name: "Mouse Logitech G502 X",
        description:
          "Mouse gamer con sensor HERO 25K, switches hibridos Lightforce y 13 botones programables.",
        price: 99_999,
      },
      {
        name: "Mouse Razer DeathAdder V3",
        description:
          "Mouse gamer ergonómico ultraliviano de 59 gramos con sensor óptico Focus Pro de 30K DPI.",
        price: 129_999,
      },
      {
        name: "Silla gamer ergonómica",
        description:
          "Silla gamer reclinable con soporte lumbar, almohadón cervical, apoyabrazos regulables y tapizado de cuero sintético.",
        price: 349_999,
      },
      {
        name: "Volante Logitech G29",
        description:
          "Volante con pedalera para PlayStation y PC, con force feedback de doble motor y aro de cuero cosido a mano.",
        price: 499_999,
      },
    ],
  },
  {
    name: "Audio",
    products: [
      {
        name: "AirPods Pro 2",
        description:
          "Auriculares inalámbricos Apple con cancelación activa de ruido, audio espacial y estuche de carga USB-C.",
        price: 499_999,
      },
      {
        name: "AirPods 4",
        description:
          "Auriculares inalámbricos Apple con diseño abierto, audio espacial personalizado y hasta 30 horas de batería con el estuche.",
        price: 299_999,
      },
      {
        name: "Samsung Galaxy Buds3 Pro",
        description:
          "Auriculares inalámbricos Samsung con cancelación de ruido inteligente, sonido Hi-Fi de 24 bits e intérprete en tiempo real.",
        price: 349_999,
      },
      {
        name: "Sony WH-1000XM5",
        description:
          "Auriculares vincha inalámbricos Sony con la mejor cancelación de ruido, 30 horas de batería y carga rápida.",
        price: 599_999,
      },
      {
        name: "JBL Tune 520BT",
        description:
          "Auriculares vincha Bluetooth JBL con sonido Pure Bass, hasta 57 horas de batería y diseño plegable.",
        price: 79_999,
      },
      {
        name: "Parlante JBL Flip 6",
        description:
          "Parlante Bluetooth portátil resistente al agua y al polvo IP67, con 12 horas de batería y sonido potente.",
        price: 199_999,
      },
      {
        name: "Parlante JBL Charge 5",
        description:
          "Parlante Bluetooth portátil con 20 horas de batería, resistencia IP67 y powerbank integrado para cargar el celular.",
        price: 279_999,
      },
      {
        name: "Barra de sonido Samsung HW-B550",
        description:
          "Soundbar Samsung 2.1 con subwoofer inalámbrico, 410W de potencia y conexión Bluetooth con el televisor.",
        price: 399_999,
      },
    ],
  },
  {
    name: "Monitores y TV",
    products: [
      {
        name: 'Monitor Samsung Odyssey G5 27"',
        description:
          "Monitor gamer curvo de 27 pulgadas con resolución QHD, 165Hz, 1ms de respuesta y AMD FreeSync Premium.",
        price: 449_999,
      },
      {
        name: 'Monitor LG UltraGear 24"',
        description:
          "Monitor gamer IPS Full HD de 24 pulgadas con 180Hz, 1ms de respuesta y compatibilidad con NVIDIA G-SYNC.",
        price: 249_999,
      },
      {
        name: 'Monitor Dell 27" 4K',
        description:
          "Monitor IPS de 27 pulgadas con resolución 4K UHD, USB-C con carga de 65W y soporte regulable en altura.",
        price: 599_999,
      },
      {
        name: 'Monitor LG UltraWide 34"',
        description:
          "Monitor ultrapanorámico curvo de 34 pulgadas WQHD 21:9, ideal para multitarea, edición de video y juegos.",
        price: 699_999,
      },
      {
        name: 'Smart TV Samsung 55" Crystal UHD 4K',
        description:
          "Televisor Samsung de 55 pulgadas con resolución 4K, HDR10+ y Tizen con Netflix, YouTube y Disney+.",
        price: 849_999,
      },
      {
        name: 'Smart TV LG OLED 55" C4',
        description:
          "Televisor OLED LG de 55 pulgadas con negros perfectos, 144Hz, Dolby Vision y cuatro puertos HDMI 2.1 para consolas.",
        price: 2_199_999,
      },
      {
        name: 'Smart TV TCL 43" Google TV',
        description:
          "Televisor TCL de 43 pulgadas 4K con Google TV, control por voz y Chromecast integrado.",
        price: 449_999,
      },
      {
        name: "Chromecast con Google TV",
        description:
          "Convierte cualquier televisor en Smart TV: streaming en 4K HDR, control remoto por voz y todas tus apps.",
        price: 99_999,
      },
    ],
  },
  {
    name: "Componentes de PC",
    products: [
      {
        name: "Placa de video NVIDIA GeForce RTX 5070 12GB",
        description:
          "Placa de video NVIDIA de última generación con 12GB GDDR7, DLSS 4 y ray tracing para jugar en 1440p.",
        price: 1_299_999,
      },
      {
        name: "Placa de video NVIDIA GeForce RTX 4060 8GB",
        description:
          "Placa de video NVIDIA eficiente con 8GB GDDR6 y DLSS 3, ideal para juegos en Full HD con ray tracing.",
        price: 599_999,
      },
      {
        name: "Placa de video AMD Radeon RX 7800 XT 16GB",
        description:
          "Placa de video AMD con 16GB GDDR6 y FSR 3, pensada para jugar en 1440p con altas tasas de cuadros.",
        price: 1_099_999,
      },
      {
        name: "Procesador AMD Ryzen 7 9800X3D",
        description:
          "Procesador AMD de 8 núcleos con tecnología 3D V-Cache, el más rápido para juegos. Socket AM5.",
        price: 999_999,
      },
      {
        name: "Procesador Intel Core i5-14400F",
        description:
          "Procesador Intel de 10 núcleos y 16 hilos, gran opción calidad-precio para PC gamer. Socket LGA 1700, sin gráficos integrados.",
        price: 349_999,
      },
      {
        name: "Memoria RAM Kingston Fury Beast 32GB DDR5",
        description:
          "Kit de memoria RAM de 2x16GB DDR5 a 6000MHz con perfiles Intel XMP y AMD EXPO.",
        price: 199_999,
      },
      {
        name: "SSD Samsung 990 Pro 2TB NVMe",
        description:
          "Disco sólido M.2 NVMe PCIe 4.0 con velocidades de lectura de hasta 7450 MB/s. Compatible con PlayStation 5.",
        price: 349_999,
      },
      {
        name: "SSD Kingston A400 480GB",
        description:
          "Disco sólido SATA de 2,5 pulgadas, hasta 10 veces más rápido que un disco rígido. Ideal para revivir una PC vieja.",
        price: 49_999,
      },
      {
        name: "Fuente Corsair RM850e 850W",
        description:
          "Fuente de alimentación modular de 850W con certificación 80 Plus Gold y ventilador silencioso.",
        price: 229_999,
      },
      {
        name: "Motherboard ASUS TUF Gaming B650-Plus",
        description:
          "Placa madre ATX para procesadores AMD Ryzen socket AM5, con soporte DDR5, PCIe 5.0 y Wi-Fi 6.",
        price: 349_999,
      },
    ],
  },
  {
    name: "Smartwatches",
    products: [
      {
        name: "Apple Watch Series 10",
        description:
          "Reloj inteligente Apple con la pantalla más grande hasta ahora, electrocardiograma, detección de apnea del sueño y carga rápida.",
        price: 799_999,
      },
      {
        name: "Apple Watch SE",
        description:
          "Reloj inteligente Apple con seguimiento de actividad, detección de caídas y notificaciones del iPhone.",
        price: 449_999,
      },
      {
        name: "Samsung Galaxy Watch7",
        description:
          "Smartwatch Samsung con monitoreo de sueño y ritmo cardíaco, GPS de doble frecuencia y Wear OS.",
        price: 449_999,
      },
      {
        name: "Xiaomi Smart Band 9",
        description:
          "Pulsera inteligente con pantalla AMOLED, más de 150 modos deportivos y hasta 21 días de batería.",
        price: 69_999,
      },
      {
        name: "Garmin Forerunner 265",
        description:
          "Reloj GPS para running con pantalla AMOLED, métricas de entrenamiento avanzadas y hasta 13 días de batería.",
        price: 699_999,
      },
      {
        name: "Amazfit GTR 4",
        description:
          "Smartwatch con GPS de doble banda, llamadas por Bluetooth, Alexa integrada y hasta 14 días de batería.",
        price: 249_999,
      },
    ],
  },
  {
    name: "Accesorios",
    products: [
      {
        name: "Cargador Apple USB-C 20W",
        description:
          "Cargador de pared original Apple de 20W con carga rápida para iPhone, iPad y AirPods.",
        price: 49_999,
      },
      {
        name: "Power bank Xiaomi 20000mAh",
        description:
          "Batería externa de 20000mAh con carga rápida de 22,5W y dos puertos USB para cargar celulares y tablets.",
        price: 59_999,
      },
      {
        name: "Cable USB-C a USB-C 2m",
        description:
          "Cable mallado USB-C de 2 metros con carga de hasta 100W y transferencia de datos. Compatible con notebooks y celulares.",
        price: 14_999,
      },
      {
        name: "Funda MagSafe iPhone 16",
        description:
          "Funda de silicona para iPhone 16 con imanes MagSafe para carga inalámbrica y accesorios magnéticos.",
        price: 69_999,
      },
      {
        name: "Hub USB-C 7 en 1",
        description:
          "Adaptador USB-C con HDMI 4K, tres puertos USB, lector de tarjetas SD y carga de 100W para notebooks.",
        price: 59_999,
      },
      {
        name: "Webcam Logitech C920",
        description:
          "Cámara web Full HD 1080p con doble micrófono estéreo y enfoque automático, ideal para videollamadas y streaming.",
        price: 119_999,
      },
      {
        name: "Router TP-Link Archer AX55 Wi-Fi 6",
        description:
          "Router Wi-Fi 6 de doble banda con velocidades de hasta 3 Gbps, cuatro antenas y control desde la app.",
        price: 149_999,
      },
      {
        name: "Disco externo WD Elements 2TB",
        description:
          "Disco rígido externo portátil de 2TB con conexión USB 3.0 para backups, fotos y juegos de consola.",
        price: 149_999,
      },
    ],
  },
];
