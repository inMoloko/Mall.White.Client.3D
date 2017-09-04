/**
 * Created by Nekrasov on 7/27/2017.
 */

// This code comes from VisioMove SDK: VgMyNavigationHelper.cpp
/**
 * @public
 * @name MyNavigationTranslator
 * @class
 * @description class used to translate navigation instructions coming from
 * the off-line routing engine (needs version 1.7.10 or greater).
 * Takes an instruction array and augments it with plain language descriptions.
 *
 * @param {vg.mapviewer.web.Mapviewer|vg.mapviewer.web2d.Mapviewer} pMapviewer
 * @param {object} pNavigation navigate result
 * @param {string} [vg_ids] special array that has correspondance betwee POI ids and their names in an specific format.

 * @see vg.mapviewer.web.Mapviewer#computeRoute
 * @see vg.mapviewer.web2d.Mapviewer#computeRoute
 * @see MyNavigationTranslator#translateInstructions
 *
 * @example
 var translator = new MyNavigationTranslator();
 var languageString = 'en'; // 'fr'
 translator.translateInstructions(routeResultData.navigation.instructions, languageString);
 *
 * @since 1.7.10
 * @since 1.7.22 added mapviewer to parameter
 */
var MyNavigationTranslator = function (pMapviewer, pNavigation, vg_ids) {
    this.mapviewer = pMapviewer;
    this.navigation = pNavigation;
    this.destinations = false;
    this.vg_ids = vg_ids;
    // available in 1.7.18
    if (pNavigation && pNavigation.route && pNavigation.route.request && pNavigation.route.request.dst) {
        this.destinations = pNavigation.route.request.dst;
    }
};

/**
 * @name getIDFromDestinationIndex
 * @memberOf MyNavigationTranslator#
 * @function
 * @description
 * returns the  poiID of the destinationIndex of the route.
 * This is important for routes and navigations that do not traverse the given destinations in order, and to get the name of the final destination.
 *
 * @param {number} pDestinationIndex destination index
 * @return {false|string} false if it cannot be found (for example, destination is a position), or if found, the poiID at a given destination index.
 *
 */
MyNavigationTranslator.prototype.getIDFromDestinationIndex = function (pDestinationIndex) {
    if (typeof(this.destinations) === 'string') {
        return this.destinations;
    }
    else if (this.destinations === false || !jQuery.isArray(this.destinations) || pDestinationIndex < 0 || pDestinationIndex >= this.destinations.length) {
        return false;
    }
    var destinationPoiID = this.destinations[pDestinationIndex];
    if (typeof(destinationPoiID) === 'string') {
        return destinationPoiID;
    }
    else if (typeof(destinationPoiID.id) === 'string') {
        // this is the result of mapviewer.getRoutingNode(string);
        return destinationPoiID.id;
    }
    return false;
};

/*
 * @name getPlacenameFromDestinationIndex
 * @memberOf MyNavigationTranslator#
 * @function
 * @description
 * returns the  name of the destinationIndex pDestinationIndex of the route.
 * This is important for routes and navigations that do not traverse the given destinations in order, and to get the name of the final destination.
 *
 * @param {number} destination index
 * @return {false|string} false if it cannot be found, or if the the name of a destination at a given destination index.
 *
 * @example
 var waypointName = this.getPlacenameFromDestinationIndex(lInstruction.destinationIndex);
 if (waypointName)
 {
 lStringNextAction += ' at '+waypointName;
 }
 *
 */
MyNavigationTranslator.prototype.getPlacenameFromDestinationIndex = function (pDestinationIndex) {
    var poiID = this.getIDFromDestinationIndex(pDestinationIndex);
    if (poiID !== false) {
        return this.getPlacenameFromID(poiID);
    }
    return false;
};

/**
 * @name getPlacenameFromID
 * @memberOf MyNavigationTranslator#
 * @function
 * @description
 * returns the  name of a placeID if known.  It looks to see if there is a POI with that ID that has a text
 * if not, it tries to look in the vg_ids object that was passed in the constructor to find that information.
 *
 * @param {string} pID
 * @return {false|string} false if it cannot be found, or if the the name of a destination of a given poiID.
 *
 * @example
 var nearPlaceName = navigationTranslator.getPlacenameFromID(lNearPlaceID);
 if (nearPlaceName !== false)
 {
 ...
 }
 *
 * @since 1.7.22 uses mapviewer.getPOI first to try to get the name of the place first
 */
MyNavigationTranslator.prototype.getPlacenameFromID = function (pID) {
    var tryPOIForName = true;
    var result = false;
    if (tryPOIForName) {
        // This won't work for Place Labels in VisioWeb2D since they don't use a POI.
        // one of the few differences between VisioWeb and VisioWeb2D
        var poi = this.mapviewer.getPoi(pID);
        if (poi && poi.length > 0) {
            poi = poi[0];
            var text = poi.options('text');
            if (typeof(text) === 'string' && text !== '') {
                result = text;
            }
        }
    }

    // If did not find the place on a POI (which would have been set most likely by mapviewer.setPlaceName())
    if (result === false) {
        var vg_ids = this.vg_ids;
        if ((typeof(vg_ids) !== 'undefined') && vg_ids.labels && vg_ids.labels[pID] && vg_ids.labels[pID].length > 1 && vg_ids.labels[pID][1]) {
            result = vg_ids.labels[pID][1];
        }
    }
    return result;
};

/**
 * @private
 * @name cLanguageMap
 * @memberOf MyNavigationTranslator#
 * @description
 * Map of language strings to index into: cActionStringTable, cNextActionStringTable, cTimeStringTable, cStringTable.
 * These tables keep exactly the same structure as the VisioMove SDK.
 */
MyNavigationTranslator.prototype.cLanguageMap = {
    'en': 0,
    'fr': 1,
    'ru': 2
};

// You can use a table like this to handle multiple languages.
// This text is in UTF8
/**
 * @private
 * @name cActionStringTable
 * @memberOf MyNavigationTranslator#
 * @description
 * Maneuver to action string including tokens to be replaced by certain keywords
 * @see MyNavigationTranslator#_replaceTokens
 */
MyNavigationTranslator.prototype.cActionStringTable =
    [
        [
            "<unknown>", // eVgManeuverTypeUnknown
            "Go straight",
            "Turn gentle right",
            "Turn gentle left",
            "Turn right",
            "Turn left",
            "Turn sharp right",
            "Turn sharp left",
            "Make right U-turn",
            "Make left U-turn",
            "Start",
            "You have arrived",
            "Go up to floor %L",
            "Go down to floor %L",
            "Use transportation mode %M",
            "Change Buildings",
            "Stop", // in 1.7.17 it said "waypoint #"
        ],
        [
            "<inconnu>", // eVgManeuverTypeUnknown
            "Continuez tout droit",
            "Tournez légèrement à droite",
            "Tournez légèrement à gauche",
            "Tournez à droite",
            "Tournez à gauche",
            "Tournez fortement à droite",
            "Tournez fortement à gauche",
            "Effectuez un demi-tour à droite",
            "Effectuez un demi-tour à gauche",
            "Départ",
            "Arrivée",
            "Montez à l'étage %L",
            "Descendez à l'étage %L",
            "Changez de moyen de transport: %M",
            "Changez de bâtiment",
            "Arrêtez vous", // in 1.7.17 it said also "l'escale #"
        ],
        ['<неизвестно>', // eVgManeuverTypeUnknown
            'Вперед',
            'Направо',
            'Немного налево',
            'Немного направо',
            'Налево',
            'Точно направо',
            'Точно налево',
            'Сделайте U-образный поворот направо',
            'Сделайте U-образный поворот налево',
            'Старт',
            'Вы прибыли',
            'Поднимитесь на этаж %L',
            'Спуститесь на этаж %L',
            'Испоьзуйте транспорт %M',
            'Перейдите в другое здание',
            'Стоп', // in 1.7.17 it said "waypoint #"
        ]
    ];

/**
 * @private
 * @name cNextActionStringTable
 * @memberOf MyNavigationTranslator#
 * @description
 * Maneuver to next action string including tokens to be replaced by certain keywords
 * @see MyNavigationTranslator#_replaceTokens
 */
MyNavigationTranslator.prototype.cNextActionStringTable =
    [
        [
            "<unknown>", // eVgManeuverTypeUnknown
            "go straight",
            "turn gentle right",
            "turn gentle left",
            "turn right",
            "turn left",
            "turn sharp right",
            "turn sharp left",
            "make right U-turn",
            "make left U-turn",
            "start",
            "you have arrived",
            "go up",
            "go down",
            "change transportation mode: %M",
            "change buildings", // Layer change, it could be buildings, zone, inside/outside....
            "stop", // eVgManeuverTypeWaypoint
        ],
        [
            "<inconnu>", // eVgManeuverTypeUnknown
            "continuez tout droit",
            "tournez légèrement à droite",
            "tournez légèrement à gauche",
            "tournez à droite",
            "tournez à gauche",
            "tournez fortement à droite",
            "tournez fortement à gauche",
            "effectuez un demi-tour à droite",
            "effectuez un demi-tour à gauche",
            "départ",
            "vous serez arrivés",
            "montez",
            "descendez",
            "changez de mode de transport: %M",
            "changez de bâtiment",
            "arrêt", // eVgManeuverTypeWaypoint
        ],
        ['<неизвестно>', // eVgManeuverTypeUnknown
            'прямо',
            'направо',
            'немного налево',
            'немного направо',
            'налево',
            'точно направо',
            'точно налево',
            'сделайте U-образный поворот направо',
            'сделайте U-образный поворот налево',
            'Старт',
            'Вы прибыли',
            'поднимитесь',
            'спуститесь',
            'Испоьзуйте транспорт %M',
            'Перейдите в другое здание',
            'Стоп', // in 1.7.17 it said "waypoint #"
        ]
    ];

/**
 * @private
 * @name cTimeStringTable
 * @memberOf MyNavigationTranslator#
 * @description
 * time under minute, around a minute, X number of minutes
 * @see MyNavigationTranslator#_replaceTokens
 */
MyNavigationTranslator.prototype.cTimeStringTable =
    [
        [
            "a few seconds",
            "about a minute",
            "about %d minutes",
        ],
        [
            "quelques secondes",
            "environ une minute",
            "environ %d minutes",
        ],
        [
            'несколько секунд',
            'около минуты',
            'около %d минут',
        ]
    ];

/* [cNumLanguages][eStringCount]*/
/**
 * @private
 * @name cStringTable
 * @memberOf MyNavigationTranslator#
 * @description
 * translation of some keywords
 */
MyNavigationTranslator.prototype.cStringTable =
    [
        [
            " for ",
            " then ",
            " and ",
            " near ",
            " using ",
            "the stairway",
            "the escalator",
            "the lift"
        ],
        [
            " pendant ",
            " puis ",
            " et ",
            " à proximité de ",
            " en empruntant ",
            "les escaliers",
            "l'escalator",
            "l'ascenseur"
        ],
        [
            ' ',
            ' потом ',
            ' и ',
            ' рядом ',
            ' используя ',
            'лестница,',
            'эскалатор,',
            'лифт,'
        ]
    ];

// Format
//	en: {action}[{duration}][{nextAction}[{means}]].
//	fr: {action}[{duration}][{nextAction}[{means}]].
//
// action:
//	en: "Change transportation mode"    | "Go up"  | "Go down"   | "Go straight"
//	fr: "Changez de moyen de transport" | "Montez" | "Descendez" | "Continuez"
//
// duration:
//	en: " for a few seconds"     | " for about a minute"     | " for about {dur} minutes" | ""
//	fr: " pendant quelques secondes" | " pendant environ une minute" | " pendant environ {dur} minutes"
//
// nextAction:
//	en: " then change transportation mode"    | " go up"  | " go down"   | " go straight"
//	fr: " puis changez de moyen de transport" | " montez" | " descendez" | " continuez"
//
// means:
//	en: " using {placeName}"         | " near {placeName}"
//	fr: " en empruntant {placeName}" | " à proximité de {placeName}"

/**
 * @private
 * @name cManeuverType2Index
 * @memberOf MyNavigationTranslator#
 * @description
 * conversion from maneuver string to index.
 */
MyNavigationTranslator.prototype.cManeuverType2Index =
    {
        'eVgManeuverTypeUnknown': 0,
        'eVgManeuverTypeGoStraight': 1,
        'eVgManeuverTypeTurnGentleRight': 2,
        'eVgManeuverTypeTurnGentleLeft': 3,
        'eVgManeuverTypeTurnRight': 4,
        'eVgManeuverTypeTurnLeft': 5,
        'eVgManeuverTypeTurnSharpRight': 6,
        'eVgManeuverTypeTurnSharpLeft': 7,
        'eVgManeuverTypeUTurnRight': 8,
        'eVgManeuverTypeUTurnLeft': 9,
        'eVgManeuverTypeStart': 10,
        'eVgManeuverTypeEnd': 11,
        'eVgManeuverTypeGoUp': 12,
        'eVgManeuverTypeGoDown': 13,
        'eVgManeuverTypeChangeModality': 14,
        'eVgManeuverTypeChangeLayer': 15,
        'eVgManeuverTypeWaypoint': 16
    };


/**
 * @public
 * @name translateInstructions
 * @function
 * @memberOf MyNavigationTranslator#
 *
 * @param {Array} pInstructions array of instructions
 * @param {string} [pLanguageString='en'] language string like 'en' or 'fr', must be in cLanguageMap, defaults to 'en' if not found.
 * @param {boolean} [pMergeFloorChangeInstructions=false]
 * @description
 * translates all the instructions in pInstructions, augmenting each instruction with .brief, .detailed, .duration, .durationInSeconds
 * @since 1.7.17 updated signature with mergeFloorChangeInstructions
 */
MyNavigationTranslator.prototype.translateInstructions = function (pInstructions, pLanguageString, pMergeFloorChangeInstructions) {
    // setup language
    var languageID = (pLanguageString && this.cLanguageMap[pLanguageString]) || this.cLanguageMap['en'];

    pMergeFloorChangeInstructions = pMergeFloorChangeInstructions || false;

    for (var index = 0, l = pInstructions.length; index < l; index++) {
        this._translateInstruction(pInstructions, index, languageID, pMergeFloorChangeInstructions);
    }
};


/*
 * Input:
 maneuverType
 dataset
 modality
 height
 duration: in seconds
 */

/**
 * @private
 * @name _translateInstructions
 * @function
 * @memberOf MyNavigationTranslator#
 *
 * @param {Array} pInstructions array of instructions
 * @param {number} pIndex index of instruction to translate
 * @param {number} [pLanguageIndex=0] language index in cLanguageMap.
 * @param {boolean} [pMergeFloorInstructions=false] if mergeFloorInstructions flag was used when computing the instructions, by default false
 * @description
 * translates all the instructions in pInstructions, augmenting each instruction with .brief, .detailed, .duration, .durationInSeconds
 */
MyNavigationTranslator.prototype._translateInstruction = function (pInstructions, pIndex, pLanguageIndex, pMergeFloorInstructions) {
    // default to 0
    var pLang = pLanguageIndex || 0;
    // default pMergeFloorInstructions to false
    pMergeFloorInstructions = pMergeFloorInstructions || false;

    var lSkipNearPlaces = false;

    var lNumInstructions = pInstructions.length;

    var lInstruction = pInstructions[pIndex];
    var lNextInstruction = pInstructions[pIndex + 1];

    var lInstructionManeuverIndex = this.cManeuverType2Index[lInstruction.maneuverType];

    var lStringAction = '';
    var lStringDuration = '';
    var lStringNextAction = '';
    var lStringVincinity = '';
    var lStringFloorChangeMethod = '';

    // enum StringType
    /** Duration link word ("for" in English, "pendant" in French) */
    var eStringFor = 0;
    /** Duration link word ("then" in English, "puis" in French) */
    var eStringThen = 1;
    /** Duration link word ("and" in English, "et" in French) */
    var eStringAnd = 2;
    /** Duration link word ("near" in English, "‡ proximitÈ de" in French) */
    var eStringNear = 3;
    /** Duration link word ("using" in English, "en empruntant" in French) */
    var eStringUsing = 4;

    var eStringStairway = 5;
    var eStringEscalator = 6;
    var eStringLift = 7;

    /** Last entry does not identify a string it is the number of strings */
    var eStringCount = 8;

    var eVgManeuverTypeUnknown = 0;
    var eVgManeuverTypeGoStraight = 1;
    var eVgManeuverTypeTurnGentleRight = 2;
    var eVgManeuverTypeTurnGentleLeft = 3;
    var eVgManeuverTypeTurnRight = 4;
    var eVgManeuverTypeTurnLeft = 5;
    var eVgManeuverTypeTurnSharpRight = 6;
    var eVgManeuverTypeTurnSharpLeft = 7;
    var eVgManeuverTypeUTurnRight = 8;
    var eVgManeuverTypeUTurnLeft = 9;
    var eVgManeuverTypeStart = 10;
    var eVgManeuverTypeEnd = 11;
    var eVgManeuverTypeGoUp = 12;
    var eVgManeuverTypeGoDown = 13;
    var eVgManeuverTypeChangeModality = 14;
    var eVgManeuverTypeChangeLayer = 15;
    var eVgManeuverTypeWaypoint = 16;
    var eVgManeuverTypeMax = 17;


    switch (lInstruction.maneuverType) {
        case 'eVgManeuverTypeEnd':
            lStringAction = this.cActionStringTable[pLang][lInstructionManeuverIndex];
            var lDestinationName = this.getPlacenameFromDestinationIndex(lInstruction.destinationIndex);
            if (lDestinationName) {
                lStringAction += ': ' + lDestinationName;
                lSkipNearPlaces = true;
            }
            break;
        case 'eVgManeuverTypeChangeModality':
        case 'eVgManeuverTypeChangeLayer':
        case 'eVgManeuverTypeGoDown':
        case 'eVgManeuverTypeGoUp':
        case 'eVgManeuverTypeStart':
            lStringAction = this.cActionStringTable[pLang][lInstructionManeuverIndex];
            break;
        case 'eVgManeuverTypeWaypoint':
            if (typeof(lInstruction.destinationIndex) !== 'undefined') {
                // This is a waypoint instructions
                lStringAction = this.cActionStringTable[pLang][eVgManeuverTypeWaypoint];
                var lWaypointName = this.getPlacenameFromDestinationIndex(lInstruction.destinationIndex);
                if (lWaypointName) {
                    lStringAction += ': ' + lWaypointName;
                    lSkipNearPlaces = true;
                }
            }
            break;
        case 'eVgManeuverTypeGoStraight':
            lStringAction = this.cActionStringTable[pLang][eVgManeuverTypeGoStraight];
            lStringDuration = this.cStringTable[pLang][eStringFor] + this._timeToText(lInstruction.duration / 60.0, pLang);
            if (pMergeFloorInstructions) {
                // When instruction merging is active, we have to test the next
                // instruction's layer/modality to know if we should instruct to change
                // level/transportation.
                if (!lNextInstruction) {
                    // Last instruction means next action is "you have arrived"
                    lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeEnd];

                    var lDestinationName = this.getPlacenameFromDestinationIndex(lInstruction.destinationIndex);
                    if (lDestinationName) {
                        lStringNextAction += ': ' + lDestinationName;
                        lSkipNearPlaces = true;
                    }
                    break;
                }
                var lInstructionLayer = lInstruction.dataset;
                var lNextInstructionLayer = lNextInstruction && lNextInstruction.dataset;
                if (lInstructionLayer != lNextInstructionLayer) {
                    // Test whether we go up or down or is a change of layers (possibly building)

                    if (lNextInstruction.height > lInstruction.height) {
                        lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeGoUp];
                    }
                    else if (lNextInstruction.height < lInstruction.height) {
                        lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeGoDown];
                    }
                    else {
                        // then is a change of layer (building)
                        lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeChangeLayer];
                    }

                    if (lNextInstruction.modality != lInstruction.modality) {
                        // This works here because with mMergeFloorChangeInstructions
                        // The next instruction will have the right modality
                        lStringNextAction += this.cStringTable[pLang][eStringAnd] + this.cNextActionStringTable[pLang][eVgManeuverTypeChangeModality];
                    }
                }
                else if (lNextInstruction.modality != lInstruction.modality) {
                    lStringNextAction += this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeChangeModality];
                }

                if (lNextInstruction && lNextInstruction.destinationIndex !== lInstruction.destinationIndex) {
                    // This instruction finishes at a waypoint
                    lStringNextAction += /* this.cStringTable[pLang][eStringAnd]*/ this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeWaypoint];

                    var lWaypointName = this.getPlacenameFromDestinationIndex(lInstruction.destinationIndex);
                    if (lWaypointName) {
                        lStringNextAction += ': ' + lWaypointName;
                        lSkipNearPlaces = true;
                    }
                }
            }
            else {
                // When instruction merging is inactive, we have to test the next
                // instruction's type to know if we should instruct to change level
                // or transportation mode.
                // no merge instructions.
                if (pIndex < (lNumInstructions - 1)) {
                    {
                        switch (lNextInstruction.maneuverType) {
                            case 'eVgManeuverTypeChangeLayer':
                            // We skip the change modality, as the modality of the
                            // instruction of eVgManeuverTypeChangeModality
                            // is the same as the current modality, thus the text
                            // will be wrong (#6684)
                            //
                            // case VgNavigationModule::eVgManeuverTypeChangeModality:
                            case 'eVgManeuverTypeEnd':
                                lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][this.cManeuverType2Index[lNextInstruction.maneuverType]];
                                var lDestinationName = this.getPlacenameFromDestinationIndex(lNextInstruction.destinationIndex);
                                if (lDestinationName) {
                                    lStringNextAction += ': ' + lDestinationName;
                                    lSkipNearPlaces = true;
                                }
                                break;
                            case 'eVgManeuverTypeGoDown':
                            case 'eVgManeuverTypeGoUp':
                                lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][this.cManeuverType2Index[lNextInstruction.maneuverType]];
                                break;
                            case 'eVgManeuverTypeWaypoint':
                                // This is the previous instruction before the actual stop
                                lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][this.cManeuverType2Index[lNextInstruction.maneuverType]];

                                var lWaypointName = this.getPlacenameFromDestinationIndex(lNextInstruction.destinationIndex);
                                if (lWaypointName) {
                                    lStringNextAction += ': ' + lWaypointName;
                                    lSkipNearPlaces = true;
                                }

                                break;
                            default:
                                break;
                        }
                    }
                }
                else {
                    // We are on last instruction, so no next action.
                }
            }
            break;

        default:
            // These are turn left/right instructions
            lStringAction = this.cActionStringTable[pLang][eVgManeuverTypeGoStraight];
            lStringDuration = this.cStringTable[pLang][eStringFor] + this._timeToText(lInstruction.duration / 60.0, pLang);
            lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][this.cManeuverType2Index[lInstruction.maneuverType]];
            break;
    } // switch statement


    var lPlaces = lInstruction.nearPlaces;
    if ((pMergeFloorInstructions && pIndex >= (lNumInstructions - 1)) ||
        (!pMergeFloorInstructions && pIndex >= (lNumInstructions - 2))) {
        lSkipNearPlaces = true;
    }


    var lThereIsFloorChange = false;
    var lThereIsFloorChangeAttribute = false;

    // If current instruction if a change floor kind OR
    // without mergefloor the next instruction is the change floor kind OR
    // with mergefloor, the height of the current and next instruction are different
    if ((lInstruction.maneuverType == 'eVgManeuverTypeGoUp'
            || lInstruction.maneuverType == 'eVgManeuverTypeGoDown')
        ||
        (!pMergeFloorInstructions
            && pIndex < (lNumInstructions - 2)
            && (pInstructions[pIndex + 1].maneuverType == 'eVgManeuverTypeGoUp'
                || pInstructions[pIndex + 1].maneuverType == 'eVgManeuverTypeGoDown'))
        ||
        (pMergeFloorInstructions
            && pIndex < (lNumInstructions - 1)
            && lInstruction.height != pInstructions[pIndex + 1].height)
    ) {
        lThereIsFloorChange = true;
        var lFound = false;
        for (var ia = 0, la = lInstruction.attributes.length; ia < la; ia++) {
            var attribute = lInstruction.attributes[ia];
            switch (attribute) {
                case 'stairway':
                    lStringFloorChangeMethod = this.cStringTable[pLang][eStringUsing] + this.cStringTable[pLang][eStringStairway];
                    lFound = true;
                    break;
                case 'escalator':
                    lStringFloorChangeMethod = this.cStringTable[pLang][eStringUsing] + this.cStringTable[pLang][eStringEscalator];
                    lFound = true;
                    break;
                case 'lift':
                    lStringFloorChangeMethod = this.cStringTable[pLang][eStringUsing] + this.cStringTable[pLang][eStringLift];
                    lFound = true;
                    break;
            }
            if (lFound) {
                break;
            }
        }
    }

    if (!lSkipNearPlaces) {
        if (lPlaces && lPlaces.length > 0) {
            // places are sorted by internal angle, if you wanted them sorted by distance.
            // lPlaces.sort(function(a,b){return a.distance - b.distance;});
            // TODO get place name
            var lID = lPlaces[0].id;
            var lPlaceName = this.getPlacenameFromID(lID);

            // For debugging, put ID if placename is not found.
            lPlaceName = lPlaceName || lID;
            if (lPlaceName !== false
                && lInstruction.maneuverType != 'eVgManeuverTypeChangeModality'
                && lInstruction.maneuverType != 'eVgManeuverTypeChangeLayer'
                && lInstruction.maneuverType != 'eVgManeuverTypeEnd') {
                lStringVincinity = this.cStringTable[pLang][eStringNear] + lPlaceName;
            }
        }
    }

    // Uncomment this line if you don't want landmark navigation.
    // lStringVincinity = '';

    lInstruction.detail = lStringAction + lStringDuration + lStringNextAction;
    if ((lStringNextAction && lStringNextAction != '') ||
        lInstruction.maneuverType == 'eVgManeuverTypeGoUp' ||
        lInstruction.maneuverType == 'eVgManeuverTypeGoDown') {
        lInstruction.detail += lStringFloorChangeMethod + lStringVincinity;
    }
    lInstruction.brief = lStringAction;
    lInstruction.durationString = lStringDuration;

    lInstruction.detail = this._replaceTokens(lInstruction.detail, lInstruction, lNextInstruction);
    lInstruction.brief = this._replaceTokens(lInstruction.brief, lInstruction, lNextInstruction);
    lInstruction.durationString = this._replaceTokens(lInstruction.durationString, lInstruction, lNextInstruction);
}; // end NavigationSolver.prototype.translateInstruction

/**
 * @private
 * @name _replaceTokens
 * @memberOf MyNavigationTranslator#
 * @function
 * @description
 * replaces tokens on a string. %d: duration in minutes, %m: current modality, %l: current dataset
 * %M modality of next instruction, %L: next dataset name.
 * @param {String} pStringWithTokens string with tokens
 * @param {InstructionObject} pInstructionCurrent
 * @param {InstructionObject} pInstructionNext
 * @return {string} with tokens replaced
 */
MyNavigationTranslator.prototype._replaceTokens = function (pStringWithTokens, pInstructionCurrent, pInstructionNext) {
    // Replaces occurrances of a token with contextual data
    if (typeof(pInstructionCurrent) !== 'undefined') {
        var lDurationInMinutes = Math.floor(pInstructionCurrent.duration / 60.0);

        pStringWithTokens = pStringWithTokens.replace('%d', lDurationInMinutes);
        pStringWithTokens = pStringWithTokens.replace('%m', pInstructionCurrent.modality);
        pStringWithTokens = pStringWithTokens.replace('%l', pInstructionCurrent.dataset);
    }

    if (typeof(pInstructionNext) !== 'undefined') {
        pStringWithTokens = pStringWithTokens.replace('%M', pInstructionNext.modality);
        pStringWithTokens = pStringWithTokens.replace('%L', pInstructionNext.dataset);
    }
    return pStringWithTokens;
};

/**
 * @private
 * @name _timeToText
 * @function
 * @memberOf MyNavigationTranslator#
 * @description
 * converts time in minutes to a string in a language
 * @param {number} pTimeInMinutes
 * @param {number} pLang
 * @return {string} describing duration
 */
MyNavigationTranslator.prototype._timeToText = function (pTimeInMinutes, pLang) {
    if (pTimeInMinutes < 1.0) {
        return this.cTimeStringTable[pLang][0];
    }
    else if (pTimeInMinutes < 2.0) {
        return this.cTimeStringTable[pLang][1];
    }
    else {
        return this.cTimeStringTable[pLang][2];
    }
};
