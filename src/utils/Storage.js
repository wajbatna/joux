// src/utils/Storage.js

const STORAGE_KEY = 'livreur_rush_3d';

export function saveData(key, value) {
    try {
        const data = loadAllData();
        data[key] = value;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Storage save failed:', e);
    }
}

export function loadData(key, defaultValue = null) {
    try {
        const data = loadAllData();
        return data[key] !== undefined ? data[key] : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

function loadAllData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

export function getSettings() {
    return loadData('settings', {
        musicVolume: 50,
        sfxVolume: 70,
        quality: 'medium',
        shadows: true,
        sensitivity: 50,
        serverUrl: ''
    });
}

export function saveSettings(settings) {
    saveData('settings', settings);
}

export function getPlayerProfile() {
    return loadData('profile', {
        name: 'لاعب — Player',
        bikeColor: 0xff6b35,
        coins: 0,
        completedMissions: [],
        highScores: {},
        totalDeliveries: 0
    });
}

export function savePlayerProfile(profile) {
    saveData('profile', profile);
}
