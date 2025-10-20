// src/main/characters/index.js
// Character registry and loader for multi-character support

const log = require('electron-log');

const ELARA = require('./elaraConstants');
const AERON = require('./aeronConstants');
const AELIRA = require('./aeliraConstants');
const ANDROS = require('./androsConstants');

const CHARACTERS = {
    'elara': ELARA,
    'aeron': AERON,
    'aelira': AELIRA,
    'andros': ANDROS
};

let activeCharacterCache = null;

function getCharacter(characterName = 'elara') {
    const normalizedName = characterName.toLowerCase();
    const character = CHARACTERS[normalizedName];
    
    if (!character) {
        log.warn(`Character '${characterName}' not found. Falling back to Elara.`);
        return CHARACTERS.elara;
    }
    
    return character;
}


function loadCharacter(characterName) {
    log.info(`Loading character: ${characterName}`);
    activeCharacterCache = getCharacter(characterName);
    return activeCharacterCache;
}


function getActiveCharacter() {
    if (!activeCharacterCache) {
        log.info('No character cached, loading default (Elara)');
        loadCharacter('elara');
    }
    return activeCharacterCache;
}


function clearCharacterCache() {
    log.info('Clearing character cache');
    activeCharacterCache = null;
}

function getAvailableCharacters() {
    return Object.keys(CHARACTERS).map(key => CHARACTERS[key].CHARACTER_NAME);
}

module.exports = {
    getCharacter,
    loadCharacter,
    getActiveCharacter,
    clearCharacterCache,
    getAvailableCharacters,
    CHARACTERS
};
