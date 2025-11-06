// Wrestling Promotions Database with Locations
// This file contains wrestling promotion data organized by region and search terms

export interface WrestlingPromotion {
  name: string;
  location: string;
  city: string;
  state?: string;
  country: string;
  status: 'active' | 'defunct';
  searchTerms: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const wrestlingPromotions: WrestlingPromotion[] = [
  // AUSTRALIA & NEW ZEALAND
  {
    name: "Australasian Wrestling Federation",
    location: "Sydney, New South Wales",
    city: "Sydney",
    state: "New South Wales",
    country: "Australia",
    status: "active",
    searchTerms: ["australasian wrestling", "awf", "australian wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: -33.8688, lng: 151.2093 }
  },
  {
    name: "Impact Pro Wrestling",
    location: "Melbourne, Victoria",
    city: "Melbourne",
    state: "Victoria", 
    country: "Australia",
    status: "active",
    searchTerms: ["impact pro wrestling", "ipw australia", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: -37.8136, lng: 144.9631 }
  },
  {
    name: "Melbourne City Wrestling",
    location: "Melbourne, Victoria",
    city: "Melbourne",
    state: "Victoria",
    country: "Australia", 
    status: "active",
    searchTerms: ["melbourne city wrestling", "mcw australia", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: -37.8136, lng: 144.9631 }
  },
  {
    name: "Riot City Wrestling",
    location: "Adelaide, South Australia",
    city: "Adelaide",
    state: "South Australia",
    country: "Australia",
    status: "active", 
    searchTerms: ["riot city wrestling", "rcw australia", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: -34.9285, lng: 138.6007 }
  },
  {
    name: "New Zealand Wide Pro Wrestling",
    location: "Auckland, New Zealand",
    city: "Auckland",
    country: "New Zealand",
    status: "active",
    searchTerms: ["new zealand wrestling", "nzwpw", "nz wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: -36.8485, lng: 174.7633 }
  },
  {
    name: "International Wrestling Australia",
    location: "Sydney, New South Wales",
    city: "Sydney",
    state: "New South Wales",
    country: "Australia",
    status: "active",
    searchTerms: ["international wrestling australia", "iwa australia", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: -33.8688, lng: 151.2093 }
  },
  {
    name: "Southern Pro Wrestling",
    location: "Adelaide, South Australia",
    city: "Adelaide",
    state: "South Australia",
    country: "Australia",
    status: "active",
    searchTerms: ["southern pro wrestling", "spw australia", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: -34.9285, lng: 138.6007 }
  },
  {
    name: "World Series Wrestling",
    location: "Melbourne, Victoria",
    city: "Melbourne",
    state: "Victoria",
    country: "Australia",
    status: "active",
    searchTerms: ["world series wrestling", "wsw australia", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: -37.8136, lng: 144.9631 }
  },

  // CANADA
  {
    name: "Border City Wrestling",
    location: "Windsor, Ontario",
    city: "Windsor",
    state: "Ontario",
    country: "Canada",
    status: "active",
    searchTerms: ["border city wrestling", "bcw canada", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 42.3149, lng: -83.0364 }
  },
  {
    name: "Great Canadian Wrestling",
    location: "Toronto, Ontario", 
    city: "Toronto",
    state: "Ontario",
    country: "Canada",
    status: "active",
    searchTerms: ["great canadian wrestling", "gcw canada", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 43.6532, lng: -79.3832 }
  },
  {
    name: "International Wrestling Syndicate",
    location: "Montreal, Quebec",
    city: "Montreal", 
    state: "Quebec",
    country: "Canada",
    status: "active",
    searchTerms: ["international wrestling syndicate", "iws canada", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 45.5017, lng: -73.5673 }
  },
  {
    name: "High Impact Wrestling Canada",
    location: "Vancouver, British Columbia",
    city: "Vancouver",
    state: "British Columbia",
    country: "Canada",
    status: "active",
    searchTerms: ["high impact wrestling canada", "hiw canada", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 49.2827, lng: -123.1207 }
  },
  {
    name: "Maple Leaf Pro Wrestling",
    location: "Toronto, Ontario",
    city: "Toronto",
    state: "Ontario",
    country: "Canada",
    status: "active",
    searchTerms: ["maple leaf pro wrestling", "mlpw", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 43.6532, lng: -79.3832 }
  },
  {
    name: "Northern Championship Wrestling",
    location: "Calgary, Alberta",
    city: "Calgary",
    state: "Alberta",
    country: "Canada",
    status: "active",
    searchTerms: ["northern championship wrestling", "ncw canada", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 51.0447, lng: -114.0719 }
  },
  {
    name: "Real Canadian Wrestling",
    location: "Edmonton, Alberta",
    city: "Edmonton",
    state: "Alberta",
    country: "Canada",
    status: "active",
    searchTerms: ["real canadian wrestling", "rcw canada", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 53.5461, lng: -113.4938 }
  },

  // JAPAN
  {
    name: "New Japan Pro-Wrestling",
    location: "Tokyo, Japan",
    city: "Tokyo",
    country: "Japan",
    status: "active",
    searchTerms: ["new japan", "njpw", "new japan pro wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 35.7058, lng: 139.7519 }
  },
  {
    name: "All Japan Pro Wrestling",
    location: "Tokyo, Japan",
    city: "Tokyo", 
    country: "Japan",
    status: "active",
    searchTerms: ["all japan", "ajpw", "all japan pro wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 35.7058, lng: 139.7519 }
  },
  {
    name: "Pro Wrestling Noah",
    location: "Tokyo, Japan",
    city: "Tokyo",
    country: "Japan", 
    status: "active",
    searchTerms: ["pro wrestling noah", "noah wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 35.7058, lng: 139.7519 }
  },
  {
    name: "DDT Pro-Wrestling",
    location: "Tokyo, Japan",
    city: "Tokyo",
    country: "Japan",
    status: "active",
    searchTerms: ["ddt pro wrestling", "ddt wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 35.6959, lng: 139.7008 }
  },
  {
    name: "World Wonder Ring Stardom",
    location: "Tokyo, Japan",
    city: "Tokyo",
    country: "Japan",
    status: "active", 
    searchTerms: ["stardom", "world wonder ring stardom", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 35.7058, lng: 139.7519 }
  },
  {
    name: "Big Japan Pro Wrestling",
    location: "Tokyo, Japan",
    city: "Tokyo",
    country: "Japan",
    status: "active",
    searchTerms: ["big japan pro wrestling", "bjpw", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 35.7058, lng: 139.7519 }
  },
  {
    name: "Dragongate",
    location: "Osaka, Japan",
    city: "Osaka",
    country: "Japan",
    status: "active",
    searchTerms: ["dragongate", "dragon gate", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 34.6937, lng: 135.5023 }
  },
  {
    name: "Osaka Pro Wrestling",
    location: "Osaka, Japan",
    city: "Osaka",
    country: "Japan",
    status: "active",
    searchTerms: ["osaka pro wrestling", "osaka pro", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 34.6937, lng: 135.5023 }
  },
  {
    name: "Pro Wrestling Zero1",
    location: "Tokyo, Japan",
    city: "Tokyo",
    country: "Japan",
    status: "active",
    searchTerms: ["pro wrestling zero1", "zero1", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 35.7058, lng: 139.7519 }
  },

  // MEXICO
  {
    name: "Consejo Mundial de Lucha Libre",
    location: "Arena México, Dr. Lavista 189, Doctores, Cuauhtémoc, Mexico City, CDMX 06720, Mexico",
    city: "Mexico City",
    country: "Mexico",
    status: "active",
    searchTerms: ["cmll", "consejo mundial", "mexican wrestling", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.4285, lng: -99.1276 }
  },
  {
    name: "Lucha Libre AAA Worldwide",
    location: "Arena Ciudad de México, Av. de las Granjas 800, Santa Bárbara, Azcapotzalco, Mexico City, CDMX 02230, Mexico", 
    city: "Mexico City",
    country: "Mexico",
    status: "active",
    searchTerms: ["aaa wrestling", "lucha libre aaa", "triple a", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.4889, lng: -99.2047 }
  },
  {
    name: "International Wrestling Revolution Group",
    location: "Arena Naucalpan, Calle Jardín 19, Centro, Naucalpan de Juárez, State of Mexico 53000, Mexico",
    city: "Naucalpan de Juárez",
    country: "Mexico",
    status: "active",
    searchTerms: ["iwrg", "international wrestling revolution group", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.4794, lng: -99.2408 }
  },
  {
    name: "The Crash Lucha Libre",
    location: "Tijuana, Mexico",
    city: "Tijuana",
    country: "Mexico",
    status: "active",
    searchTerms: ["the crash", "crash lucha libre", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 32.5149, lng: -117.0382 }
  },
  {
    name: "Toryumon Mexico",
    location: "Arena Coliseo, República de Perú 77, Centro Histórico, Cuauhtémoc, Mexico City, CDMX 06010, Mexico",
    city: "Mexico City",
    country: "Mexico",
    status: "active",
    searchTerms: ["toryumon mexico", "toryumon", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.4326, lng: -99.1332 }
  },
  {
    name: "Lucha Libre Elite",
    location: "Arena Naucalpan, Calle Jardín 19, Naucalpan de Juárez, State of Mexico 53000, Mexico",
    city: "Naucalpan de Juárez",
    country: "Mexico",
    status: "active",
    searchTerms: ["lucha libre elite", "lucha elite", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.4794, lng: -99.2408 }
  },
  {
    name: "Nacion Lucha Libre",
    location: "Gimnasio Olímpico Juan de la Barrera, Av. División del Norte 2333, General Anaya, Benito Juárez, Mexico City, CDMX 03340, Mexico",
    city: "Mexico City",
    country: "Mexico",
    status: "active",
    searchTerms: ["nacion lucha libre", "nacion lucha libre", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.3608, lng: -99.1522 }
  },
  {
    name: "Promo Azteca",
    location: "Gimnasio Olímpico Juan de la Barrera, Av. División del Norte 2333, General Anaya, Benito Juárez, Mexico City, CDMX 03340, Mexico",
    city: "Mexico City",
    country: "Mexico",
    status: "active",
    searchTerms: ["promo azteca", "azteca wrestling", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.3608, lng: -99.1522 }
  },
  {
    name: "Universal Wrestling Association",
    location: "El Toreo de Cuatro Caminos, Blvd. Manuel Ávila Camacho s/n, Lomas de Sotelo, Naucalpan de Juárez, State of Mexico 53390, Mexico",
    city: "Naucalpan de Juárez",
    country: "Mexico",
    status: "active",
    searchTerms: ["universal wrestling association", "uwa mexico", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.4833, lng: -99.2333 }
  },
  {
    name: "World Wrestling Association",
    location: "Auditorio Fausto Gutiérrez Moreno, Blvd. Gustavo Díaz Ordaz s/n, El Paraíso, Tijuana, Baja California 22024, Mexico",
    city: "Tijuana",
    country: "Mexico",
    status: "active",
    searchTerms: ["world wrestling association", "wwa mexico", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 32.5149, lng: -117.0382 }
  },
  {
    name: "Xtreme Latin American Wrestling",
    location: "El Toreo de Cuatro Caminos, Blvd. Manuel Ávila Camacho s/n, Naucalpan de Juárez, State of Mexico 53390, Mexico",
    city: "Naucalpan de Juárez",
    country: "Mexico",
    status: "active",
    searchTerms: ["xtreme latin american wrestling", "xlaw", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.4833, lng: -99.2333 }
  },
  {
    name: "International Wrestling League",
    location: "Deportivo Tlalli, Av. Sor Juana Inés de la Cruz 45, Industrial San Nicolás, Tlalnepantla de Baz, State of Mexico 54033, Mexico",
    city: "Tlalnepantla de Baz",
    country: "Mexico",
    status: "active",
    searchTerms: ["international wrestling league", "iwl mexico", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.5401, lng: -99.1954 }
  },
  {
    name: "Los Perros del Mal",
    location: "Sala de Armas, Av. Río Churubusco s/n, Ciudad Deportiva Magdalena Mixhuca, Granjas México, Mexico City, CDMX 08400, Mexico",
    city: "Mexico City",
    country: "Mexico",
    status: "active",
    searchTerms: ["los perros del mal", "perros del mal", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.4000, lng: -99.1000 }
  },
  {
    name: "Alianza Universal De Lucha Libre",
    location: "Tlalnepantla, Mexico",
    city: "Tlalnepantla",
    country: "Mexico",
    status: "active",
    searchTerms: ["alianza universal", "aul", "lucha libre tlalnepantla", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.5401, lng: -99.1954 }
  },
  {
    name: "Desastre Total Ultraviolento",
    location: "Tulancingo, Mexico",
    city: "Tulancingo",
    country: "Mexico",
    status: "active",
    searchTerms: ["desastre total", "dtu", "ultraviolento", "crazy boy", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 20.0754, lng: -98.3696 }
  },
  {
    name: "Federacion Universal de Lucha Libre",
    location: "Carpa Astros, Calzada de Tlalpan 855, Postal, Benito Juárez, Mexico City, CDMX 03410, Mexico",
    city: "Mexico City",
    country: "Mexico",
    status: "active",
    searchTerms: ["federacion universal", "full", "tinieblas jr", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 19.3608, lng: -99.1522 }
  },
  {
    name: "Lucha Libre Femenil",
    location: "Monterrey, Mexico",
    city: "Monterrey",
    country: "Mexico",
    status: "active",
    searchTerms: ["lucha libre femenil", "women's wrestling mexico", "lucha femenil", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 25.6866, lng: -100.3161 }
  },
  {
    name: "Nueva Generacion Xtrema",
    location: "Monterrey, Mexico",
    city: "Monterrey",
    country: "Mexico",
    status: "active",
    searchTerms: ["nueva generacion", "ngx", "xtrema", "sabu", "sandman", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 25.6866, lng: -100.3161 }
  },

  // UNITED KINGDOM & IRELAND
  {
    name: "Revolution Pro Wrestling",
    location: "London, England",
    city: "London",
    country: "United Kingdom",
    status: "active",
    searchTerms: ["revolution pro wrestling", "rev pro", "revpro", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 51.5279, lng: -0.0544 }
  },
  {
    name: "PROGRESS Wrestling",
    location: "London, England",
    city: "London",
    country: "United Kingdom", 
    status: "active",
    searchTerms: ["progress wrestling", "progress wrestling uk", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 51.5394, lng: -0.1426 }
  },
  {
    name: "Insane Championship Wrestling",
    location: "Glasgow, Scotland",
    city: "Glasgow",
    country: "United Kingdom",
    status: "active",
    searchTerms: ["icw", "insane championship wrestling", "icw scotland", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 55.8642, lng: -4.2518 }
  },
  {
    name: "Over the Top Wrestling",
    location: "Dublin, Ireland",
    city: "Dublin",
    country: "Ireland",
    status: "active",
    searchTerms: ["ott wrestling", "over the top wrestling", "irish wrestling", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 53.3498, lng: -6.2603 }
  },
  {
    name: "All Star Wrestling",
    location: "London, England",
    city: "London",
    country: "United Kingdom",
    status: "active",
    searchTerms: ["all star wrestling", "all star wrestling uk", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 51.5074, lng: -0.1278 }
  },
  {
    name: "Attack! Pro Wrestling",
    location: "Birmingham, England",
    city: "Birmingham",
    country: "United Kingdom",
    status: "active",
    searchTerms: ["attack pro wrestling", "attack wrestling", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 52.4862, lng: -1.8904 }
  },
  {
    name: "New Generation Wrestling",
    location: "Manchester, England",
    city: "Manchester",
    country: "United Kingdom",
    status: "active",
    searchTerms: ["new generation wrestling", "ngw uk", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 53.4808, lng: -2.2426 }
  },
  {
    name: "Irish Whip Wrestling",
    location: "Cork, Ireland",
    city: "Cork",
    country: "Ireland",
    status: "active",
    searchTerms: ["irish whip wrestling", "iww ireland", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 51.8985, lng: -8.4756 }
  },

  // UNITED STATES
  {
    name: "All Elite Wrestling",
    location: "Jacksonville, Florida",
    city: "Jacksonville",
    state: "Florida",
    country: "United States",
    status: "active",
    searchTerms: ["aew", "all elite wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 30.3322, lng: -81.6557 }
  },
  {
    name: "Ring of Honor",
    location: "Richmond, Virginia",
    city: "Richmond", 
    state: "Virginia",
    country: "United States",
    status: "active",
    searchTerms: ["roh", "ring of honor", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 37.5485, lng: -77.4675 }
  },
  {
    name: "Impact Wrestling",
    location: "Nashville, Tennessee",
    city: "Nashville",
    state: "Tennessee", 
    country: "United States",
    status: "active",
    searchTerms: ["impact wrestling", "tna", "total nonstop action", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 36.1627, lng: -86.7816 }
  },
  {
    name: "Pro Wrestling Guerrilla",
    location: "Los Angeles, California",
    city: "Los Angeles",
    state: "California",
    country: "United States",
    status: "active",
    searchTerms: ["pwg", "pro wrestling guerrilla", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 34.1669, lng: -118.3720 }
  },
  {
    name: "Game Changer Wrestling",
    location: "Atlantic City, New Jersey",
    city: "Atlantic City",
    state: "New Jersey",
    country: "United States",
    status: "active",
    searchTerms: ["gcw", "game changer wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 39.3643, lng: -74.4229 }
  },
  {
    name: "Ohio Valley Wrestling",
    location: "Louisville, Kentucky",
    city: "Louisville",
    state: "Kentucky",
    country: "United States",
    status: "active",
    searchTerms: ["ovw", "ohio valley wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 38.2527, lng: -85.7585 }
  },
  {
    name: "National Wrestling Alliance",
    location: "Atlanta, Georgia",
    city: "Atlanta",
    state: "Georgia",
    country: "United States",
    status: "active",
    searchTerms: ["nwa", "national wrestling alliance", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 33.7490, lng: -84.3880 }
  },
  {
    name: "Major League Wrestling",
    location: "New York, New York",
    city: "New York",
    state: "New York",
    country: "United States",
    status: "active",
    searchTerms: ["mlw", "major league wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 40.7698, lng: -73.9927 }
  },
  {
    name: "All Pro Wrestling",
    location: "San Francisco, California",
    city: "San Francisco",
    state: "California",
    country: "United States",
    status: "active",
    searchTerms: ["all pro wrestling", "apw", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  {
    name: "Chaotic Wrestling",
    location: "Melrose, Massachusetts",
    city: "Melrose",
    state: "Massachusetts",
    country: "United States",
    status: "active",
    searchTerms: ["chaotic wrestling", "chaotic wrestling massachusetts", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 42.4584, lng: -71.0664 }
  },
  {
    name: "Combat Zone Wrestling",
    location: "Philadelphia, Pennsylvania",
    city: "Philadelphia",
    state: "Pennsylvania",
    country: "United States",
    status: "active",
    searchTerms: ["combat zone wrestling", "czw", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 39.9190, lng: -75.1528 }
  },
  {
    name: "East Coast Wrestling Association",
    location: "Newark, Delaware",
    city: "Newark",
    state: "Delaware",
    country: "United States",
    status: "active",
    searchTerms: ["east coast wrestling association", "ecwa", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 39.6837, lng: -75.7497 }
  },
  {
    name: "Empire Wrestling Federation",
    location: "Knights of Columbus Hall, 4315 N Vincent Ave, Covina, CA 91722, USA",
    city: "Covina",
    state: "California",
    country: "United States",
    status: "active",
    searchTerms: ["empire wrestling federation", "ewf", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 34.0900, lng: -117.8900 }
  },
  {
    name: "House of Hardcore",
    location: "Mid-Hudson Civic Center, 14 Civic Center Plaza, Poughkeepsie, NY 12601, USA",
    city: "Poughkeepsie",
    state: "New York",
    country: "United States",
    status: "active",
    searchTerms: ["house of hardcore", "hoh", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 41.7000, lng: -73.9200 }
  },
  {
    name: "Independent Wrestling Association Mid-South",
    location: "Louisville, Kentucky",
    city: "Louisville",
    state: "Kentucky",
    country: "United States",
    status: "active",
    searchTerms: ["independent wrestling association mid-south", "iwams", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 38.2527, lng: -85.7585 }
  },
  {
    name: "Lucha VaVOOM",
    location: "The Mayan Theater, 1038 S Hill St, Los Angeles, CA 90015, USA",
    city: "Los Angeles",
    state: "California",
    country: "United States",
    status: "active",
    searchTerms: ["lucha vavoom", "lucha vavoom los angeles", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 34.0407, lng: -118.2468 }
  },
  {
    name: "MCW Pro Wrestling",
    location: "Baltimore, Maryland",
    city: "Baltimore",
    state: "Maryland",
    country: "United States",
    status: "active",
    searchTerms: ["mcw pro wrestling", "mcw baltimore", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 39.2904, lng: -76.6122 }
  },
  {
    name: "Millennium Wrestling Federation",
    location: "Boston, Massachusetts",
    city: "Boston",
    state: "Massachusetts",
    country: "United States",
    status: "active",
    searchTerms: ["millennium wrestling federation", "mwf", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 42.3601, lng: -71.0589 }
  },
  {
    name: "New England Championship Wrestling",
    location: "Boston, Massachusetts",
    city: "Boston",
    state: "Massachusetts",
    country: "United States",
    status: "active",
    searchTerms: ["new england championship wrestling", "necw", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 42.3601, lng: -71.0589 }
  },
  {
    name: "Northeast Wrestling",
    location: "Albany, New York",
    city: "Albany",
    state: "New York",
    country: "United States",
    status: "active",
    searchTerms: ["northeast wrestling", "new wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 42.6526, lng: -73.7562 }
  },
  {
    name: "Reality of Wrestling",
    location: "Houston, Texas",
    city: "Houston",
    state: "Texas",
    country: "United States",
    status: "active",
    searchTerms: ["reality of wrestling", "row wrestling", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 29.7604, lng: -95.3698 }
  },
  {
    name: "Revolutionary Championship Wrestling",
    location: "Pittsburgh, Pennsylvania",
    city: "Pittsburgh",
    state: "Pennsylvania",
    country: "United States",
    status: "active",
    searchTerms: ["revolutionary championship wrestling", "rcw pittsburgh", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 40.4406, lng: -79.9959 }
  },
  {
    name: "Southern States Wrestling",
    location: "Atlanta, Georgia",
    city: "Atlanta",
    state: "Georgia",
    country: "United States",
    status: "active",
    searchTerms: ["southern states wrestling", "ssw", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 33.7490, lng: -84.3880 }
  },
  {
    name: "Texas All-Star Wrestling",
    location: "Dallas, Texas",
    city: "Dallas",
    state: "Texas",
    country: "United States",
    status: "active",
    searchTerms: ["texas all-star wrestling", "tasw", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 32.7767, lng: -96.7970 }
  },
  {
    name: "Texas Wrestling Alliance",
    location: "San Antonio, Texas",
    city: "San Antonio",
    state: "Texas",
    country: "United States",
    status: "active",
    searchTerms: ["texas wrestling alliance", "twa", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 29.4241, lng: -98.4936 }
  },
  {
    name: "Top Rope Promotions",
    location: "Boston, Massachusetts",
    city: "Boston",
    state: "Massachusetts",
    country: "United States",
    status: "active",
    searchTerms: ["top rope promotions", "trp", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 42.3601, lng: -71.0589 }
  },
  {
    name: "Ultra Championship Wrestling-Zero",
    location: "UCW-Zero Training Center, 47 S Orange St, Salt Lake City, UT 84116, USA",
    city: "Salt Lake City",
    state: "Utah",
    country: "United States",
    status: "active",
    searchTerms: ["ultra championship wrestling-zero", "ucw zero", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 40.7608, lng: -111.8910 }
  },
  {
    name: "Warrior Wrestling",
    location: "Chicago, Illinois",
    city: "Chicago",
    state: "Illinois",
    country: "United States",
    status: "active",
    searchTerms: ["warrior wrestling", "warrior wrestling chicago", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 41.8781, lng: -87.6298 }
  },
  {
    name: "West Coast Wrestling Connection",
    location: "Portland, Oregon",
    city: "Portland",
    state: "Oregon",
    country: "United States",
    status: "active",
    searchTerms: ["west coast wrestling connection", "wcwc", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 45.5152, lng: -122.6784 }
  },
  {
    name: "Women Superstars United",
    location: "Flyers Skate Zone, 601 Laurel Oak Rd, Voorhees, NJ 08043, USA",
    city: "Voorhees",
    state: "New Jersey",
    country: "United States",
    status: "active",
    searchTerms: ["women superstars united", "wsu", "wrestling", "wrestle", "wrestling promotions", "pro wrestling"],
    coordinates: { lat: 39.8500, lng: -74.9500 }
  },
  {
    name: "Women of Wrestling",
    location: "Belasco Theater, 1050 S Hill St, Los Angeles, CA 90015, USA",
    city: "Los Angeles",
    state: "California",
    country: "United States",
    status: "active",
    searchTerms: ["women of wrestling", "wow", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 34.0407, lng: -118.2468 }
  },
  {
    name: "Women's Wrestling Army",
    location: "Fête Music Hall, 103 Dike St, Providence, RI 02909, USA",
    city: "Providence",
    state: "Rhode Island",
    country: "United States",
    status: "active",
    searchTerms: ["women's wrestling army", "wwa", "wrestle", "wrestling", "wrestling promotion", "wrestling promotions"],
    coordinates: { lat: 41.8240, lng: -71.4128 }
  },
  {
    name: "World League Wrestling",
    location: "St. Louis, Missouri",
    city: "St. Louis",
    state: "Missouri",
    country: "United States",
    status: "active",
    searchTerms: ["world league wrestling", "wlw"],
    coordinates: { lat: 38.6270, lng: -90.1994 }
  }
];

// Search function to find wrestling promotions based on search terms and location
export const findWrestlingPromotions = (searchQuery: string, userLocation?: { lat: number; lng: number }, maxDistanceMiles: number = 100): WrestlingPromotion[] => {
  const query = searchQuery.toLowerCase();
  
  // Check if the search query contains wrestling-related terms
  const wrestlingTerms = [
    'wrestling', 'wrestle', 'pro wrestling', 'professional wrestling',
    'lucha libre', 'puroresu', 'wrestling promotion', 'wrestling company',
    'wrestling federation', 'wrestling alliance', 'wrestling organization'
  ];
  
  const hasWrestlingTerm = wrestlingTerms.some(term => query.includes(term));
  
  if (!hasWrestlingTerm) {
    return [];
  }
  
  // Find promotions that match the search query
  let matchingPromotions = wrestlingPromotions.filter(promotion => {
    return promotion.searchTerms.some(term => 
      query.includes(term.toLowerCase())
    ) || promotion.name.toLowerCase().includes(query);
  });
  
  // If user location is provided, filter by distance and sort by proximity
  if (userLocation && matchingPromotions.length > 0) {
    // Ensure coordinates are numbers
    const userLat = typeof userLocation.lat === 'string' ? parseFloat(userLocation.lat) : userLocation.lat;
    const userLng = typeof userLocation.lng === 'string' ? parseFloat(userLocation.lng) : userLocation.lng;
    const maxDistance = typeof maxDistanceMiles === 'string' ? parseFloat(maxDistanceMiles) : maxDistanceMiles;
    
    console.log('User location:', userLocation);
    console.log('Max distance:', maxDistanceMiles, 'miles (parsed:', maxDistance, ')');
    console.log('Initial matching promotions:', matchingPromotions.length);
    console.log('User coordinates validation:', {
      original_lat: userLocation.lat,
      original_lng: userLocation.lng,
      parsed_lat: userLat,
      parsed_lng: userLng,
      latValid: typeof userLat === 'number' && !isNaN(userLat),
      lngValid: typeof userLng === 'number' && !isNaN(userLng)
    });
    
    matchingPromotions = matchingPromotions.filter(promotion => {
      if (!promotion.coordinates) {
        console.log('No coordinates for:', promotion.name);
        return false;
      }
      
      const distance = calculateDistance({ lat: userLat, lng: userLng }, promotion.coordinates);
      const isWithinRange = distance <= maxDistance;
      
      console.log(`${promotion.name} (${promotion.location}): ${distance.toFixed(1)} miles - ${isWithinRange ? 'IN RANGE' : 'OUT OF RANGE'}`);
      console.log(`   Promotion coordinates: ${promotion.coordinates.lat}, ${promotion.coordinates.lng}`);
      console.log(`   User coordinates (original): ${userLocation.lat}, ${userLocation.lng}`);
      console.log(`   User coordinates (parsed): ${userLat}, ${userLng}`);
      console.log(`   Calculated distance: ${distance.toFixed(1)} miles`);
      console.log(`   Distance limit (original): ${maxDistanceMiles} miles`);
      console.log(`   Distance limit (parsed): ${maxDistance} miles`);
      
      if (!isWithinRange) {
        console.log(`   ${promotion.name} is ${distance.toFixed(1)} miles away, but your distance slider is set to ${maxDistanceMiles} miles`);
      }
      
      return isWithinRange;
    });
    
    console.log('Filtered promotions within range:', matchingPromotions.length);
    
    // Sort by distance (closest first)
    matchingPromotions.sort((a, b) => {
      if (!a.coordinates || !b.coordinates) return 0;
      
      const distanceA = calculateDistance({ lat: userLat, lng: userLng }, a.coordinates);
      const distanceB = calculateDistance({ lat: userLat, lng: userLng }, b.coordinates);
      
      return distanceA - distanceB;
    });
    
    // Final summary
    if (matchingPromotions.length > 0) {
      console.log(`FINAL RESULT: Showing ${matchingPromotions.length} wrestling promotions within ${maxDistance} miles of your location`);
      matchingPromotions.forEach((promotion, index) => {
        const distance = calculateDistance({ lat: userLat, lng: userLng }, promotion.coordinates!);
        console.log(`   ${index + 1}. ${promotion.name} - ${distance.toFixed(1)} miles away`);
      });
    } else {
      console.log(`NO RESULTS: No wrestling promotions found within ${maxDistance} miles of your location`);
      console.log(`Try increasing your distance slider to find more promotions`);
    }
  }
  
  return matchingPromotions;
};

// Calculate distance between two coordinates (in miles)
const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get all wrestling promotions by country
export const getWrestlingPromotionsByCountry = (country: string): WrestlingPromotion[] => {
  return wrestlingPromotions.filter(promotion => 
    promotion.country.toLowerCase() === country.toLowerCase()
  );
};

// Get wrestling promotions by status
export const getWrestlingPromotionsByStatus = (status: 'active' | 'defunct'): WrestlingPromotion[] => {
  return wrestlingPromotions.filter(promotion => promotion.status === status);
};
