// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  carMakeUrl: 'https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json',
  carModelApiUrl: 'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/',
  emailApiUrl: 'http://localhost:3000',
  production: false,
  disableLogin: true,
  COUNTRY: 'PR',
  GOOGLE_MAPS_API_KEY: 'AIzaSyDhMwXI-fZPAh4sQT1cNhvU4extr3lzTmM',
                       //'AIzaSyBuc0xmVegDEXFCXN6os-rbr8qslPwW-yg',
  firebase: {  
    apiKey: "AIzaSyCN-au8RKgtZLvJdIYD5IFwiQhXUSaL3n8",
    authDomain: "uar-platform.firebaseapp.com",
    projectId: "uar-platform",
    storageBucket: "uar-platform.firebasestorage.app",
    messagingSenderId: "301745938644",
    appId: "1:301745938644:web:ce314ad8ab40ec71259b41",
    measurementId: "G-SX0YWPBGHD"
  },
  IONIC_STORAGE: 'userdb',
  FEE: 0.23 ,
  BASE_FEE: 100.00, 
  IVA_FEE: .19,
  DRIVER_DELAY_MSG: 'Driver is taking longer than usual! please try again later',
  DRIVER_REJECTED_MSG: 'Driver rejected your booking',
  LOGOUT_CONFIRMATION: 'Are you sure you want to logout?',
  SELECT_DESTINATION_WARN: 'You must select destination location first to request ride',
  SELECT_ORIGIN_WARN: 'You must select origin location first to request ride',
  USER_CONFIRM_MSG: 'Your driver will arrive shortly. Do you want to confirm booking?',
  RIDE_COMPLETED_MSG: 'Your ride is completed. Please pay the Fare.',
  RIDE_COMPLETED_MSG_CUSTOM:`
        <div class="alert-image-container">
          <img src="../assets/images/success2.png" class="alert-image" alt="Success Image" />
        </div>
        <p>Su servicio se ha completado satifactoriamente! Gracias</p>
      `,
  USER_CANCEL_MSG: 'Do you want to cancel this ride ? Driver is already on his way',
  SCREEN_OPTIONS: {},
  DUMMY_CARDS: [{
    number: '2342',
    expiry: '03/23',
    image: 'assets/cards/visa.png'
  },
  {
    number: '0912',
    expiry: '05/23',
    image: 'assets/cards/amex.png'
  },
  {
    number: '4483',
    expiry: '03/25',
    image: 'assets/cards/mastercard.png'
  },
  {
    number: '1123',
    expiry: '03/24',
    image: 'assets/cards/discover.png'
  }],
  MARKER_OPTIONS: {
    origin: {
      animation: '\'DROP\'',
      label: 'origin',
      draggable: true

    },
    destination: {
      animation: '\'DROP\'',
      label: 'destination',
      draggable: true

    },
  },
  RENDER_OPTIONS: {
    suppressMarkers: true,
  },
  MAP_STYLE: [
    {
      elementType: 'geometry',
      stylers: [
        {
          color: '#EFF1FF'
        }
      ]
    },
    {
      elementType: 'labels.icon',
      stylers: [
        {
          visibility: 'off'
        }
      ]
    },
    {
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#6B6B6B'
        }
      ]
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [
        {
          color: '#D6D9FF'
        }
      ]
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#EEEEEE'
        }
      ]
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        {
          color: '#D7DCEF'
        }
      ]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#EEEEEE'
        }
      ]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [
        {
          color: '#e5e5e5'
        }
      ]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#9e9e9e'
        }
      ]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [
        {
          color: '#ffffff'
        }
      ]
    },
    {
      featureType: 'road.arterial',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#757575'
        }
      ]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [
        {
          color: '#DEE0ED'
        }
      ]
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#4C4C4C'
        }
      ]
    },
    {
      featureType: 'road.local',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#9e9e9e'
        }
      ]
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry',
      stylers: [
        {
          color: '#e5e5e5'
        }
      ]
    },
    {
      featureType: 'transit.station',
      elementType: 'geometry',
      stylers: [
        {
          color: '#eeeeee'
        }
      ]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [
        {
          color: '#C5D2E0'
        }
      ]
    },
    { 
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#E0F2FF'
        }
      ]
    }
  ],
  
  COUNTRY_DIAL_CODES: [
    {
      name: 'Puerto Rico',
      dialCode: '+1 939',
      code: 'PR'
    },
    {
      name: 'United States',
      dialCode: '+1',
      code: 'US'
    }
    
  ],
  PAYPAL_CONFIGURATION : {
        currency: 'USD',
        clientId: 'AZtN3jlfoMwBOBTuOxo5oQSmDBMY5eBvubO0mmaM603HsWJlUZBOpAQqpHG6-7zpQdIQQfWWdquhy8Vv',
        secret: 'EHohaeLYQW_BP1aP5iSlNH8UDNRThTS9Dqnf6GJZGy5awotJtKRe4YNL2afafGH7w_MTAmObGFkZa6po',
        sandbox: true,
        apiUrl: 'https://api-m.sandbox.paypal.com'
  },
  carColors:  [
    'Amarillo',
    'Azul',
    'Azul Marino',
    'Azul Medianoche',
    'Beige',
    'Blanco',
    'Blanco Perla',
    'Bronce',
    'Burdeos',
    'Celeste',
    'Champán',
    'Cobre',
    'Dorado',
    'Granate',
    'Gris',
    'Gris Carbón',
    'Gris Mate',
    'Gris Oscuro',
    'Marrón',
    'Naranja',
    'Negro',
    'Negro Brillante',
    'Negro Mate',
    'Plateado',
    'Púrpura',
    'Rojo',
    'Turquesa',
    'Verde',
    'Verde Azulado'
  ],
  
  WOMPI_CONFIGURATION:{
     publicKey :'pub_test_XXXXXXXXXXXXXXXXXXX',   // Reemplaza con tu llave pública
     privateKey : 'prv_test_XXXXXXXXXXXXXXXXXXX', // Reemplaza con tu llave privada
     apiUrl : 'https://sandbox.wompi.co/v1',
  },

  DRIVER_DOC_LIST: [
    {
      name: 'Identification Card',
      icon: 'person',
      url: '/driving-license',
    },
    {
      name: 'Driving License',
      icon: 'person',
      url: '/driving-license',
    },
  ],
  DEFAULT_LAT: 51.5,
  DEFAULT_LNG: 0.0,
  DRIVER_CANCEL_MSG: 'Are you sure you want to cancel this request ?',
  USER_REJECTED_MSG: 'User has canceled the Ride',
  TRIP_PAYMENTS: [
    { title: 'Paid amount', pay: '$25' },
    { title: 'Apple Pay', pay: '$15' },
    { title: 'Discount', pay: '$10' },
  ],
}



