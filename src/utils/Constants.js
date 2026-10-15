// src/utils/Constants.js

export const GAME_CONFIG = {
    WORLD_SIZE: 500,
    ROAD_WIDTH: 12,
    SIDEWALK_WIDTH: 3,
    BUILDING_MIN_HEIGHT: 8,
    BUILDING_MAX_HEIGHT: 25,
    BLOCK_SIZE: 60,
    GRID_SIZE: 8,

    MOTO_MAX_SPEED: 80,
    MOTO_ACCELERATION: 25,
    MOTO_BRAKE_FORCE: 40,
    MOTO_TURN_SPEED: 2.5,
    MOTO_FRICTION: 8,
    MOTO_LEAN_FACTOR: 0.3,

    TRAFFIC_COUNT: 15,
    PEDESTRIAN_COUNT: 20,

    DELIVERY_BASE_TIME: 120,
    SATISFACTION_DECAY_RATE: 0.5,
    SCORE_DELIVERY: 100,
    SCORE_EARLY_BONUS: 50,
    SCORE_SAFE_AVOID: 25,

    CAMERA_DISTANCE: 12,
    CAMERA_HEIGHT: 6,
    CAMERA_SMOOTH: 0.08,

    COLORS: {
        ROAD: 0x333333,
        SIDEWALK: 0xccbb99,
        BUILDING_BASE: [0xd4956b, 0xc4825a, 0xe8b88a, 0xbf7c50, 0xd19a6e],
        BUILDING_ACCENT: [0x2266aa, 0x22aa66, 0xaa6622, 0x882244, 0x446688],
        TAXI_SMALL: 0xff3333,
        TAXI_LARGE: 0xffffff,
        BUS: 0x3355aa,
        MOTO_DEFAULT: 0xff6b35,
        GRASS: 0x558833,
        SAND: 0xddcc88,
        MARKET: 0xcc8844,
        CHECKPOINT: 0xff0000
    },

    SERVER_URL: import.meta.env?.VITE_SERVER_URL || 'http://localhost:3001',

    MULTIPLAYER: {
        TICK_RATE: 20,
        INTERPOLATION_DELAY: 100,
        MAX_PLAYERS: 8
    }
};

export const MISSION_DATA = [
    {
        id: 1,
        name: 'توصيل أول — First Delivery',
        description: 'وصّل الطاجين للزبون في الحي الجديد',
        food: 'طاجين — Tajine',
        time: 120,
        difficulty: 1,
        distance: 100,
        events: ['none']
    },
    {
        id: 2,
        name: 'طاكسي مزعج — Annoying Taxi',
        description: 'وصّل الأكل وانتبه من الطاكسيات',
        food: 'كسكس — Couscous',
        time: 110,
        difficulty: 1,
        distance: 130,
        events: ['taxi']
    },
    {
        id: 3,
        name: 'الحمار العنيد — Stubborn Donkey',
        description: 'في الطريق حمار وكاروصة',
        food: 'حريرة — Harira',
        time: 100,
        difficulty: 2,
        distance: 140,
        events: ['donkey']
    },
    {
        id: 4,
        name: 'الزحمة — Rush Hour',
        description: 'وقت الذروة والطريق مسدود',
        food: 'بسطيلة — Bastilla',
        time: 100,
        difficulty: 2,
        distance: 160,
        events: ['taxi', 'bus']
    },
    {
        id: 5,
        name: 'كنترول البوليس — Police Check',
        description: 'البوليس كيحبس في الطريق',
        food: 'مشوي — Grilled Meat',
        time: 90,
        difficulty: 3,
        distance: 150,
        events: ['police']
    },
    {
        id: 6,
        name: 'الحفر — Potholes',
        description: 'الطريق فيها حفر كثيرة',
        food: 'رفيسة — Rfissa',
        time: 95,
        difficulty: 3,
        distance: 170,
        events: ['potholes']
    },
    {
        id: 7,
        name: 'زبون غاضب — Angry Customer',
        description: 'الزبون مستعجل وكيتصل بزاف',
        food: 'طاجين كفتة — Kefta Tajine',
        time: 80,
        difficulty: 4,
        distance: 180,
        events: ['angry_customer', 'taxi']
    },
    {
        id: 8,
        name: 'العرس — Wedding',
        description: 'عرس في الزنقة والطريق مسدود',
        food: 'سلو — Sellou',
        time: 85,
        difficulty: 4,
        distance: 200,
        events: ['wedding', 'donkey']
    },
    {
        id: 9,
        name: 'ليلة ممطرة — Rainy Night',
        description: 'شتا وضلام والطريق زالقة',
        food: 'حريرة — Harira',
        time: 100,
        difficulty: 5,
        distance: 190,
        events: ['rain', 'potholes', 'taxi'],
        weather: 'rain',
        timeOfDay: 'night'
    },
    {
        id: 10,
        name: 'التحدي الكبير — The Big Challenge',
        description: 'كلشي ممكن يوقع في هاد المهمة',
        food: 'مشكل مغربي — Mixed Moroccan',
        time: 75,
        difficulty: 5,
        distance: 250,
        events: ['taxi', 'donkey', 'bus', 'police', 'potholes', 'angry_customer']
    }
];

export const FOOD_EMOJIS = {
    'طاجين — Tajine': '🥘',
    'كسكس — Couscous': '🍲',
    'حريرة — Harira': '🍜',
    'بسطيلة — Bastilla': '🥧',
    'مشوي — Grilled Meat': '🍖',
    'رفيسة — Rfissa': '🍛',
    'طاجين كفتة — Kefta Tajine': '🥘',
    'سلو — Sellou': '🍪',
    'مشكل مغربي — Mixed Moroccan': '🍽️'
};
