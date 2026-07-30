const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/db.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Replace DEFAULT_SERVICES Block
const servicesRegex = /const DEFAULT_SERVICES: Array<\{[\s\S]*?const SERVICES_SEED_VERSION = \d+;/m;
const newServices = `const DEFAULT_SERVICES: Array<{
  title: string;
  slug: string;
  icon: string;
  shortDesc: string;
  longDesc: string;
  features: string[];
  standards: string[];
  applications: string[];
  content?: string;
  cover_image_url?: string;
}> = [
  {
    title: "Yangın Algılama ve İhbar Sistemleri",
    slug: "yangin-algilama-ve-ihbar-sistemleri",
    icon: "Bell",
    shortDesc: "Kablo tipi, hava örneklemeli, alev dedektörleri ve adresli/konvansiyonel yangın alarm sistemleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: \`Endüstriyel tesisler, ticari binalar ve yaşam alanlarında can ve mal güvenliğini sağlamanın ilk adımı, olası bir yangın riskini henüz başlangıç aşamasında tespit etmektir. **Yangın Algılama ve İkaz Sistemleri**; ısı, duman, alev veya karbonmonoksit gibi yangın belirtilerini anlık olarak algılayarak, erken uyarı ve otomatik acil durum senaryolarını devreye sokan kritik bina kontrol altyapılarıdır.\`,
    cover_image_url: "/yangin_algilama.png",
  },
  {
    title: "Gaz Algılama Sistemleri",
    slug: "gaz-algilama-sistemleri",
    icon: "Wind",
    shortDesc: "Endüstriyel tesislerde patlayıcı ve zehirli gazların hızlı ve güvenilir algılanması için gelişmiş dedektör çözümleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: \`Endüstriyel tesislerdeki üretim, depolama ve proses süreçlerinde açığa çıkan patlayıcı, parlayıcı veya toksik gazlar; proses emniyeti standartlarına uygun olarak kontrol altına alınmadığı takdirde birincil derecede hayati risk, patlama ve duruş kayıplarına yol açmaktadır.

Tehlikeli gaz birikimlerini henüz kritik tutuşma veya zehirleme seviyelerine ulaşmadan algılayarak, erken uyarı, otomatik tahliye ve acil durum emniyet senaryolarını devreye sokan kritik proses emniyet ekipmanlarıdır.

Bir tesiste gaz riskini kaynağında bertaraf etmek ve algılama sistemlerinden maksimum verim almak için bütünsel bir proses emniyeti yaklaşımı uygulanmalıdır.\`,
    cover_image_url: "/basinctan_koruma.jpeg",
  },
  {
    title: "Kıvılcım Algılama Söndürme",
    slug: "kivilcim-algilama-sondurme",
    icon: "Zap",
    shortDesc: "Kıvılcım ve kor parçacıklarının erken tespiti ile patlama ve yangın riskini ortadan kaldıran sistemler.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: \`Kıvılcım algılama ve söndürme sistemleri; toz, lif veya parlayıcı dökme malzemelerin işlendiği, taşındığı ve depolandığı endüstriyel tesislerde proses emniyetini sağlamak amacıyla geniş bir kullanım alanına sahiptir.

**Sistemin Başlıca Bileşenleri** arasında sistem kontrol paneli, kıvılcım dedektörleri, söndürme nozulları, hidrofor sistemi ve çeşitli sensörler yer alır.\`,
    cover_image_url: "/k%C4%B1v%C4%B1lc%C4%B1m_algilama.jpeg",
  },
  {
    title: "Görüntü Tabanlı Yangın Algılama",
    slug: "goruntu-tabanli-yangin-algilama",
    icon: "Eye",
    shortDesc: "Video analiz ile duman ve alev algılama; klasik sistemlerin yetersiz kaldığı yerlerde çok erken algılama imkanı.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: \`**Görüntü Tabanlı Yangın Algılama** sistemleri, video analiz ile duman ve alev algılamasını gerçekleştirerek klasik sistemlerin yetersiz kaldığı yerlerde çok erken algılama imkanı sunar.

### Başlıca Avantajları
- Yangın durumunun anında doğrulanması
- Yangın noktasının gözle hemen tespit edilmesi
- Olay öncesi ve sonrasının izlenerek kanıt olarak kullanılabilmesi
- İnsansız bölgeleri yangına karşı uzaktan denetleme imkanı

**Kullanım Alanları:** Yüksek tavanlı depolar, hangarlar, endüstriyel üretim tesisleri, atık tesisleri ve dış ortamlar.\`,
    cover_image_url: "",
  },
  {
    title: "Exproof Çözümler",
    slug: "exproof-cozumler",
    icon: "Lock",
    shortDesc: "Patlama riski olan tehlikeli alanlarda güvenli ekipman ve aydınlatma çözümleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: \`Endüstriyel tesislerin parlayıcı, patlayıcı gaz, buhar veya toz riski taşıyan tehlikeli sahalarında (**Zone 0, Zone 1, Zone 2 / Zone 20, Zone 21, Zone 22**) standart elektrikli ve elektronik ekipmanların kullanımı felaketle sonuçlanabilecek patlamaları tetikleyebilir.

**Ex-Proof** (Explosion-Proof / Flameproof) çözümler; muhafazaları bünyesinde oluşabilecek bir patlamayı hapsedecek, dış atmosfere alev/kıvılcım sızdırmayacak ve yüzey sıcaklığını ortamın tutuşma eşiğinin altında tutacak şekilde tasarlanmış özel mühendislik sistemleridir.\`,
    cover_image_url: "/exproof.jpeg",
  },
  {
    title: "Yangın Söndürme Sistemleri",
    slug: "yangin-sondurme-sistemleri",
    icon: "Flame",
    shortDesc: "Sulu, gazlı, köpüklü ve pano içi söndürme sistemleri ile tesislerinizi yangına karşı koruyoruz.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: \`Kritik varlıkların yangına karşı korunmasında temiz gazlı, sulu, köpüklü ve pano içi gibi çeşitli teknolojik söndürme sistemleri tercih edilmektedir.

Sistemlerimiz **NFPA 2001, EN 15004 ve ISO 14520** standartlarına uygun olup tamamı sertifikalı ürünlerden oluşmaktadır.\`,
    cover_image_url: "",
  },
  {
    title: "Patlamadan Korunma",
    slug: "patlamadan-korunma",
    icon: "Shield",
    shortDesc: "Patlama tehlikesi bulunan ortamlarda güvenlik standartlarına uygun koruma çözümleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: \`Patlama tehlikesi bulunan ortamlarda güvenlik standartlarına uygun aktif ve pasif koruma çözümleri. Tesisinizin gereksinimlerine göre patlama kapakları, alevsiz tahliye, patlama izolasyonu ve sönümleme sistemleri kullanılarak bütünleşik güvenlik sağlanır.\`,
    cover_image_url: "/patlamadan_korunma.jpeg",
  },
  {
    title: "Aşırı Basınçtan Korunma",
    slug: "asiri-basinctan-korunma",
    icon: "Gauge",
    shortDesc: "Yüksek basınç ortamlarında güvenliği sağlayan basınç tahliye ve koruma sistemleri.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: \`Endüstriyel tesislerdeki hatlarda, reaktörlerde ve basınçlı kaplarda proses koşulları veya beklenmeyen reaksiyonlar sebebiyle meydana gelen tehlikeli basınç artışlarını anında tahliye ederek sistemin patlamasını ve hasar görmesini engelleyen basınç emniyet çözümleridir.\`,
    cover_image_url: "/asiri_basinctan_korunma.jpeg",
  },
  {
    title: "Servis ve Bakım Hizmetleri",
    slug: "servis-ve-bakim-hizmetleri",
    icon: "Wrench",
    shortDesc: "Periyodik bakım, test, eğitim ve devreye alma hizmetleri ile sistemlerinizin sürekli çalışmasını sağlıyoruz.",
    longDesc: "",
    features: [],
    standards: [],
    applications: [],
    content: \`Endüstriyel tesislerde can güvenliğinin, tesis bütünlüğünün ve operasyonel sürekliliğin korunması; emniyet sistemlerinin kusursuz çalışmasına bağlıdır. Tesislerin proses emniyeti gereksinimlerine yönelik uluslararası standartlara ve yasal mevzuatlara tam uyumlu, kapsamlı mühendislik, test ve bakım hizmetleri sunulmaktadır.\`,
    cover_image_url: "/servis_bakim.webp",
  },
];

// Bump this version whenever DEFAULT_SERVICES change to trigger a reseed
const SERVICES_SEED_VERSION = 12;`;

content = content.replace(servicesRegex, newServices);

// 2. Replace DEFAULT_SUBPRODUCTS Block
const subProductsRegex = /const DEFAULT_SUBPRODUCTS: Array<\{[\s\S]*?const SUBPRODUCTS_SEED_VERSION = \d+;/m;
const newSubProducts = `const DEFAULT_SUBPRODUCTS: Array<{
  serviceSlug: string;
  title: string;
  slug: string;
  description: string;
  features: string[];
  cover_image_url?: string;
}> = [
  // ─── Yangın Algılama Sistemleri ───
  {
    serviceSlug: "yangin-algilama-ve-ihbar-sistemleri",
    title: "Konvansiyonel Yangın Alarm Sistemleri",
    slug: "konvansiyonel-yangin-alarm-sistemleri",
    description: "Geleneksel yangın algılama ihtiyaçları için bölgesel tespit sağlayan güvenilir ve uygun maliyetli alarm sistemleri.",
    features: ["Bölgesel (Zon) bazlı algılama", "Düşük ilk yatırım maliyeti", "Kolay bakım ve işletme"],
    cover_image_url: "https://www.elva.com.tr/wp-content/uploads/2024/02/konvansiyel-yangin-algilama-sistem-bilesenleri.jpg",
  },
  {
    serviceSlug: "yangin-algilama-ve-ihbar-sistemleri",
    title: "Adresli Yangın Alarm Sistemleri",
    slug: "adresli-yangin-alarm-sistemleri",
    description: "Yangının tam noktasal yerini bildiren, gelişmiş senaryo altyapısına sahip akıllı algılama sistemleri.",
    features: ["Noktasal tespit (Dedektör bazlı)", "Gelişmiş entegrasyon", "Hata ve kirlilik uyarısı"],
    cover_image_url: "https://www.elva.com.tr/wp-content/uploads/2024/02/adresli-yangin-algilama-sistemleri-20191018-2.jpg",
  },
  {
    serviceSlug: "yangin-algilama-ve-ihbar-sistemleri",
    title: "Işın Tipi (Beam) Dedektörler",
    slug: "isin-tipi-beam-dedektorler",
    description: "Yüksek tavanlı ve geniş hacimli alanlarda duman algılaması için kullanılan kızılötesi ışınlı dedektörler.",
    features: ["Geniş alan kapsamı", "Yüksek tavanlara uygun", "Hızlı tepki süresi"],
    cover_image_url: "https://www.kesfedin.com/img/fireray-3000-101-112080-0.jpg",
  },
  {
    serviceSlug: "yangin-algilama-ve-ihbar-sistemleri",
    title: "Kablo Tipi Dedektörler",
    slug: "kablo-tipi-dedektorler",
    description: "Zorlu endüstriyel ortamlarda doğrusal sıcaklık artışını algılayan lineer dedektörler.",
    features: ["Doğrusal ısı algılama", "Zorlu ortam direnci", "Kablo galerileri için ideal"],
    cover_image_url: "https://www.elva.com.tr/wp-content/uploads/2024/02/elva-kablo-tipi-dedektorler-4.jpg",
  },
  {
    serviceSlug: "yangin-algilama-ve-ihbar-sistemleri",
    title: "Hava Örneklemeli Algılama Sistemleri",
    slug: "hava-orneklemeli-algilama-sistemleri",
    description: "Aktif hava emişi ile ortamdaki çok küçük duman partiküllerini tespit ederek en erken uyarıyı sağlayan sistemler.",
    features: ["Çok erken uyarı (ASD)", "Aktif hava emişi", "Veri merkezleri için ideal"],
    cover_image_url: "https://www.elva.com.tr/wp-content/uploads/2024/02/hava-orneklemeli-sistem-20191018-2-1.jpg",
  },
  {
    serviceSlug: "yangin-algilama-ve-ihbar-sistemleri",
    title: "Alev Dedektörleri",
    slug: "alev-dedektorleri",
    description: "UV/IR teknolojileri kullanarak dumansız alevleri saliseler içinde tespit eden yüksek hızlı dedektörler.",
    features: ["UV / IR sensörler", "Anında tepki süresi", "Yanıcı sıvı/gaz tesisleri"],
    cover_image_url: "https://www.elva.com.tr/wp-content/uploads/2024/02/adresli-yangin-algilama-sistemleri-200.jpg",
  },
  
  // ─── Gaz Algılama Sistemleri ───
  {
    serviceSlug: "gaz-algilama-sistemleri",
    title: "ATEX ve Ex-Proof Ekipman Seçimi",
    slug: "atex-ve-ex-proof-ekipman-secimi",
    description: "Tehlikeli bölgelerde (Zone 0, Zone 1, Zone 2) kullanılacak tüm dedektörler ve ekipmanlar ATEX/IECEx normlarına tam uyumlu seçilmelidir.",
    features: ["ATEX / IECEx Sertifikalı", "Patlayıcı Ortamlara Uygun", "Zone 0, 1, 2 Uyumluluğu"],
    cover_image_url: "https://www.elva.com.tr/wp-content/smush-webp/2026/02/gaz-algilama-sistemleri-image__3___-1024x817.jpg.webp",
  },

  // ─── Kıvılcım Algılama Söndürme ───
  {
    serviceSlug: "kivilcim-algilama-sondurme",
    title: "Filtre Sistemleri, Siklonlar ve Silolar",
    slug: "filtre-sistemleri-siklonlar-silolar",
    description: "Toz tutma üniteleri, torbalı filtreler, siklon ayırıcılar ve hammadde/ürün depolama siloları için kıvılcım algılama çözümleri.",
    features: ["Toz Tutma Üniteleri", "Torbalı Filtreler", "Depolama Siloları"],
    cover_image_url: "https://www.elva.com.tr/wp-content/uploads/2024/02/kivilcim-sondurme.jpeg",
  },
  {
    serviceSlug: "kivilcim-algilama-sondurme",
    title: "Pres Sistemleri ve Parçalayıcılar",
    slug: "pres-sistemleri-ve-parcalayicilar",
    description: "Yüksek mekanik sürtünme riskinin bulunduğu presler, kırıcılar, shredder (parçalayıcı) sistemleri için güvenlik.",
    features: ["Presler", "Kırıcılar", "Shredder Sistemleri"],
    cover_image_url: "https://www.elva.com.tr/wp-content/uploads/2024/02/kivilcim-sondurme.jpeg",
  },
  {
    serviceSlug: "kivilcim-algilama-sondurme",
    title: "Soğutucular ve Konveyörler",
    slug: "sogutucular-ve-konveyorler",
    description: "Ürün soğutma tamburları/kuleleri, bantlı ve pnömatik sevk konveyörleri için kıvılcım algılama çözümleri.",
    features: ["Soğutma Tamburları", "Bantlı Konveyörler", "Pnömatik Sevk"],
    cover_image_url: "https://www.elva.com.tr/wp-content/uploads/2024/03/endustriyel-kimya-3.jpg",
  },
  {
    serviceSlug: "kivilcim-algilama-sondurme",
    title: "Değirmenler ve Elekler",
    slug: "degirmenler-ve-elekler",
    description: "Öğütme, kırma ve eleme proseslerinin yürütüldüğü ünitelerde güvenliği en üst düzeye çıkaran sistemler.",
    features: ["Öğütme Prosesleri", "Kırma İşlemleri", "Eleme Üniteleri"],
    cover_image_url: "https://www.elva.com.tr/wp-content/uploads/2024/02/kivilcim-sondurme.jpeg",
  },

  // ─── Görüntü Tabanlı Yangın Algılama ───
  {
    serviceSlug: "goruntu-tabanli-yangin-algilama",
    title: "Akıllı Video Analiz Sistemleri",
    slug: "akilli-video-analiz-sistemleri",
    description: "Yangın durumunun anında doğrulanması ve gözle tespit edilmesi için gelişmiş video analiz algoritmaları.",
    features: ["Anında Doğrulama", "Olay Öncesi ve Sonrası Kayıt", "Duman ve Alev Analizi"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Video+Analiz",
  },

  // ─── Exproof Çözümler ───
  {
    serviceSlug: "exproof-cozumler",
    title: "Ex-Proof Yangın Algılama Sistemleri",
    slug: "ex-proof-yangin-algilama-sistemleri",
    description: "Tehlikeli sahalarda güvenli yangın algılama sağlayan patlamaya dayanıklı sistemler.",
    features: ["Zone 0, 1, 2 Uyumlu", "Kıvılcım Sızdırmaz Yapı", "Yüksek Emniyet"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Ex-Proof+Algilama",
  },
  {
    serviceSlug: "exproof-cozumler",
    title: "Exproof Kamera Sistemleri",
    slug: "exproof-kamera-sistemleri",
    description: "Patlama riski olan tehlikeli alanlarda güvenli görüntüleme sağlayan patlamaya dayanıklı kamera sistemleri. CCTV, termal kamera ve video analiz çözümleri ile tesislerinizi 7/24 izleyin.",
    features: [
      "Patlamaya dayanıklı CCTV kameralar",
      "Termal görüntüleme kameraları",
      "Video analiz ve uzaktan izleme",
      "ATEX/IECEx sertifikalı ekipmanlar",
    ],
    cover_image_url: "https://via.placeholder.com/800x400?text=Ex-Proof+Kamera",
  },
  {
    serviceSlug: "exproof-cozumler",
    title: "Exproof Aydınlatma",
    slug: "exproof-aydinlatma",
    description: "Tehlikeli alanlarda güvenli aydınlatma sağlayan patlamaya dayanıklı armatür ve ekipmanlar. LED, floresan ve acil durum aydınlatma çözümleri.",
    features: [
      "LED ve Floresan armatürler",
      "Acil durum aydınlatma",
      "Aydınlatma askıları ve aksesuarları",
      "ATEX/IECEx sertifikalı ürünler",
    ],
    cover_image_url: "https://via.placeholder.com/800x400?text=Ex-Proof+Aydinlatma",
  },

  // ─── Yangın Söndürme Sistemleri ───
  {
    serviceSlug: "yangin-sondurme-sistemleri",
    title: "Gazlı Söndürme Sistemleri",
    slug: "gazli-sondurme-sistemleri",
    description: "Kritik ve değerli varlıkların yangına karşı korunmasında tercih edilen temiz gazlı söndürme sistemleri.",
    features: ["HFC227ea (FM-200) / HFC125", "FK-5-1-12 (Novec 1230)", "Inert Gazlar", "Karbondioksit (CO2)"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Gazli+Sondurme",
  },
  {
    serviceSlug: "yangin-sondurme-sistemleri",
    title: "Köpüklü Söndürme Sistemleri",
    slug: "kopuklu-sondurme-sistemleri",
    description: "Su ile söndürülmesi mümkün olmayan yoğun yanıcı/parlayıcı kimyasal maddelerin veya yakıt yangınlarının söndürülmesinde tercih edilir.",
    features: ["Düşük Genleşmeli", "Orta Genleşmeli", "Yüksek Genleşmeli"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Kopuklu+Sondurme",
  },
  {
    serviceSlug: "yangin-sondurme-sistemleri",
    title: "Sulu Söndürme Sistemleri",
    slug: "sulu-sondurme-sistemleri",
    description: "Endüstriyel tesisler için sprinkler, baskın ve ön tepkimeli sulu söndürme altyapıları.",
    features: ["Sprinkler (Yağmurlama)", "Baskın (Deluge)", "Ön Tepkimeli (Preaction)", "Su Sisi (Watermist)"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Sulu+Sondurme",
  },
  {
    serviceSlug: "yangin-sondurme-sistemleri",
    title: "Pano İçi Söndürme Sistemleri",
    slug: "pano-ici-sondurme-sistemleri",
    description: "Sadece belirli bir boyuttaki kabin ve elektrik panolarının içten korunması için tasarlanmış kompakt sistemler.",
    features: ["İndirekt Pano İçi", "Direkt Pano İçi", "Plastik Boru (Tubing) Teknolojisi"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Pano+Ici+Sondurme",
  },

  // ─── Patlamadan Korunma ───
  {
    serviceSlug: "patlamadan-korunma",
    title: "Patlama Kapakları",
    slug: "patlama-kapaklari",
    description: "Patlama anında oluşan yüksek basıncı güvenli bir alana tahliye ederek ekipman ve tesisin zarar görmesini engelleyen pasif koruma sistemleridir.",
    features: ["Basınç Tahliyesi", "Pasif Koruma", "Hasar Önleme"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Patlama+Kapaklari",
  },
  {
    serviceSlug: "patlamadan-korunma",
    title: "Alevsiz Tahliye",
    slug: "alevsiz-tahliye",
    description: "Patlama basıncını ve alevi bina içinde veya kapalı mekanlarda güvenli bir şekilde sönümleyerek dışarıya alev yayılmasını önleyen sistemlerdir.",
    features: ["İç Mekan Uyumluluğu", "Alev Yutucu", "Güvenli Sönümleme"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Alevsiz+Tahliye",
  },
  {
    serviceSlug: "patlamadan-korunma",
    title: "Patlama İzolasyonu",
    slug: "patlama-izolasyonu",
    description: "Patlamanın basınç ve alev dalgasının boru hatları üzerinden diğer proses ekipmanlarına sıçramasını engeller.",
    features: ["Geri Dönüşsüz Vanalar", "Kimyasal Bariyerler", "Hızlı Kapanan Vanalar"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Patlama+Izolasyonu",
  },
  {
    serviceSlug: "patlamadan-korunma",
    title: "Patlama Sönümleme ve Elevex",
    slug: "patlama-sonumleme-elevex",
    description: "Patlamayı milisaniyeler içinde algılayıp söndüren sistemler ve yüksek elevatörler için özel Elevex çözümleri.",
    features: ["Milisaniyelik Tepki", "Özel Sönümlendiriciler", "Dikey Taşıma Koruma"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Sonumleme+ve+Elevex",
  },

  // ─── Aşırı Basınçtan Korunma ───
  {
    serviceSlug: "asiri-basinctan-korunma",
    title: "Patlama Diskleri ve Aksesuarları",
    slug: "patlama-diskleri-ve-aksesuarlari",
    description: "Tehlikeli basınç artışlarını anında tahliye ederek sistemin patlamasını engelleyen basınç emniyet diskleri.",
    features: ["İleri/Geri Yönlü Diskler", "Hijyenik ve Özel Tip", "Grafit Diskler", "Uyarı Sensörleri"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Patlama+Diskleri",
  },

  // ─── Servis ve Bakım Hizmetleri ───
  {
    serviceSlug: "servis-ve-bakim-hizmetleri",
    title: "Yangın ve Patlama Risk Analizi",
    slug: "yangin-ve-patlama-risk-analizi",
    description: "Tesis genelinde olası yangın ve patlama risklerinin önceden tespiti ve teknik değerlendirme hizmetleri.",
    features: ["Risk Değerlendirmesi", "Mevzuatlara Uyum", "Acil Durum Senaryoları"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Risk+Analizi",
  },
  {
    serviceSlug: "servis-ve-bakim-hizmetleri",
    title: "Toz Patlaması Laboratuvar Testleri",
    slug: "toz-patlamasi-laboratuvar-testleri",
    description: "Endüstriyel tozların patlayıcılık karakteristiklerinin laboratuvar ortamında test edilerek belirlenmesi.",
    features: ["Karakteristik Analizi", "Tasarım Kriteri Belirleme", "Laboratuvar Testleri"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Laboratuvar+Testi",
  },
  {
    serviceSlug: "servis-ve-bakim-hizmetleri",
    title: "Saha Mühendislik ve Periyodik Bakım",
    slug: "saha-muhendislik-ve-periyodik-bakim",
    description: "Sistemlerin işletme ömrü boyunca yüksek performansla çalışmasını garanti altına alan teknik bakım ve saha destek hizmetleri.",
    features: ["Saha Keşfi", "Süpervizörlük", "Periyodik Bakım", "Eğitim"],
    cover_image_url: "https://via.placeholder.com/800x400?text=Saha+Muhendislik",
  },
];

const SUBPRODUCTS_SEED_VERSION = 3;`;

content = content.replace(subProductsRegex, newSubProducts);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated db.ts');
