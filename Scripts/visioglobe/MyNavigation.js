/* eslint-disable max-len, brace-style, no-mixed-spaces-and-tabs, comma-dangle, no-var, guard-for-in, new-cap, camelcase, quotes */
/**
 * @fileOverview
 * Contains an application level helper class for displaying navigation instructions.
 * It is furnished as an example, and can be customized or used as a starting point by the developer.
 */

/** @global */
var instructions_overlay_visible = false;


var updateToggleInstructions = function () {
    // var nextState = (instructions_overlay_visible == true)?'ON':'OFF';
    // jQuery('#toggle_instructions').html('<a href="#" class="toggle_instructions" >Instructions: '+ nextState+'</a> ');

    if (instructions_overlay_visible) {
        jQuery('#toggle_instructions').attr('checked', 'checked');
        jQuery('#instructions').animate({
            bottom: '0px'
        });
    }
    else {
        jQuery('#toggle_instructions').removeAttr('checked');

        var instructionsHeight = -(parseInt(jQuery('#instructions').height(), 10) + 2); // 2 for the 1 pixel border

        jQuery('#instructions').animate({
            bottom: instructionsHeight + 'px'
        });
    }
    jQuery('#instructions').css('visibility', instructions_overlay_visible ? 'visible' : 'hidden');
};

/**
 * @public
 * @name MyNavigation
 * @class
 * @constructor MyNavigation
 * @description
 * It allows the rendering of navigation instructions if available from computeRoute().
 * Creates a navigation object to simplify the display of instructions.
 * It uses for the media directory the value of vg.imagePath (by default '../media'), which contains:
 * <ul>
 * <li>images for transit instructions: transit_*.png
 * </ul>
 * @see vg.mapviewer.web.Mapviewer#computeRoute
 * @see vg.mapviewer.web2d.Mapviewer#computeRoute
 * @param {vg.mapviewer.Mapviewer} pMapViewer
 * @param {object} pNavigationData result of vg.mapviewer.Mapviewer.computeRoute()
 * @param {object} vg_ids place id name correspondance, using the same file format as ids.json: {'targets':['default'],'labels':{'UL0-ID0003':['UL0-ID0003','Zara'],...} }
 *
 * @example
 This class asummes that the following elements exist on your .html file

 <div id="instructions" class="instructions">
 <div id="instructions_prev_button" class="instructions"><img src="media/leftArrow.png"/></div>
 <div id="instructions_count" class="instructions"></div>
 <div id="instructions_brief" class="instructions"></div>
 <div id="instructions_detail" class="instructions"></div>
 <img id="instructions_icon" class="instructions"></img>
 <div id="instructions_time" class="instructions"></div>
 <div id="instructions_next_button" class="instructions"><img src="media/rightArrow.png"/></div>
 </div>
 *
 * @example
 pNavigationData will have the form

 { 'navigation': {
  'instructions' : [{
     'icon': 'transit_instruction_turn_left.png',
     'dataset': '0',
     'modality': 'pedestrian',
     'time': '0.000000',
     'totalTime': '45.953415','position' : { 'lat' : '48.782332', 'lon' : '2.221195' },
     'detail': 'Go straight for a few seconds then turn left',
     'brief': 'Go straight',
     'duration': ' for a few seconds'
   }
   ,...
   ]
 }
 * @since 1.7.18 added ID of waypoints and destination
 */
class MyNavigation {
    constructor(pMapViewer, pNavigationData, vg_ids) {
        let self = this;
        // For Debugging.
        // window.navigationData = pNavigationData;

        // false is the default for 1.7.16 and below, true for 1.7.17 and above.
        // on 1.7.17 navigation data also has parameters which where use to calculate navigation.
        var lNavigationParameters = (pNavigationData && pNavigationData.navigation && pNavigationData.navigation.parameters) ? pNavigationData.navigation.parameters : {};
        var mergeFloorChangeInstructions = (lNavigationParameters && typeof(lNavigationParameters.mergeFloorChangeInstructions) !== 'undefined') ? lNavigationParameters.mergeFloorChangeInstructions : false;


        this.imagePath = vg.imagePath || '../media';

        this.mValid = false;
        this.instructions;
        this.mapviewer = pMapViewer;

        // start by saying no instruction has been set
        this.currentInstructionIndex = 0;
        this.numberOfInstructions;

        this.instructionOverlays = [];

        // If you want to highlight the curent instruction for debugging.
        this.showCurrentInstructionSegment = false;

        // show all instruction segments at the beginning.
        var debugInstructionSegments = false;

        var _this = this;


        /**
         * @public
         * @name navigationInstructionRadius
         * @type number
         * @field
         * @memberOf MyNavigation
         * @description radius in meters to use when moving the camera to the beginning of an instruction.
         */
        this.navigationInstructionRadius = 50;

        if (pMapViewer.sdkType === 'web2d') {
            this.navigationInstructionRadius = 25;
        }


        var navigation = pNavigationData['navigation'];

        if (navigation !== undefined) {
            this.instructions = navigation['instructions'];
            if (jQuery.isArray(this.instructions)) {
                self.numberOfInstructions = this.instructions.length;
                if (self.numberOfInstructions > 0) {
                    // Translate instructions if they come from offline routing
                    // i.e. they don't have a member .brief for example.
                    // If they come from the Routing Server (network), then do not translate
                    if (typeof(this.instructions[0].brief) === 'undefined') {
                        var translator = new MyNavigationTranslator(this.mapviewer, navigation, vg_ids);
                        var languageString = (navigation.route && navigation.route.request && navigation.route.request.language) || 'en'; // 'fr'
                        translator.translateInstructions(this.instructions, languageString, mergeFloorChangeInstructions);
                    }
                    this.displayInstruction(0);

                    if (debugInstructionSegments) {
                        for (var i = 0; i < self.numberOfInstructions; i++) {
                            this.displayInstructionSegment(this.instructions[i], (i % 2 == 0) ? 0x00ff0000 : 0x0000ff00);
                        }
                    }
                }
                this.mValid = true;
            }
        }
        else {
            this.remove();
        }
    }

    /**
     * @public
     * @name remove
     * @function
     * @memberOf MyNavigation#
     * @description
     * clear all information associated with the navigation.
     */
    remove() {
        this.currentInstructionIndex = 0;
        this.numberOfInstructions = 0;

        jQuery('#instructions_detail').html('');
        jQuery('#instructions_brief').html('');
        // jQuery('#instructions_count').html('0/0');
        jQuery('#instructions_count').html('');
        jQuery('#instructions_time').html('');
        jQuery('#instructions_icon').attr('src', '');

        this.removeInstructionOverlays();
    };

    /**
     * @public
     * @name displayNextInstruction
     * @function
     * @memberOf MyNavigation#
     * @description
     * displays the previous instruction if possible and move the camera to the start of the instruction
     */
    displayNextInstruction() {
        if (this.currentInstructionIndex < (this.numberOfInstructions - 1)) {
            this.currentInstructionIndex++;
            this.displayInstruction(this.currentInstructionIndex);

            this.goToCurrentInstruction();
        }
    };

    /**
     * @private
     * @param {Object} instruction
     * @param {string} color
     */
    displayInstructionSegment(instruction, color) {
        if (typeof(instruction.positions) !== 'undefined') {
            var overlayPoints = [];
            for (var j = 0, jl = instruction.positions.length; j < jl; j++) {
                var point = instruction.positions[j];
                // transfor to new coordinates
                point = this.mapviewer.convertLatLonToPoint(point);
                point.z = 2.5;
                overlayPoints.push(point);
            }
            var path_options = {
                floor: instruction.dataset,
                // url: trackImage, // only available on vg.mapviewer.web.Mapviewer
                // speed: lSpeed, // only available on vg.mapviewer.web.Mapviewer
                repeat: -1, // only available on vg.mapviewer.web.Mapviewer
                thickness: 2.0,
                opacity: 0.5,
                color: color, // change the color of the line
                points: overlayPoints,
                overlay: true,
                // only available on vg.mapviewer.web.Mapviewer, this makes it looks
                // better for sharp turns. Negative values will try to adapt the number of
                // segments to the length of the route, such that the absolute value
                // indicates the number of segments per "??unit??"
                segments: 1000
            };
            //
            var instructionPath = this.mapviewer.addRoutingPath(path_options);
            if (instructionPath) {
                this.instructionOverlays.push(instructionPath);
            }
        }
    }

    /**
     * @private
     * @description updates navigation div's with a given navigation instruction
     * @param {number} index instruction index
     * @since 1.7.10 handle .duration and .durationString, does not update currentInstructionIndex
     */
    displayInstruction(index) {
        let self = this;
        var instruction = this.instructions[index];
        /* It relies at least on the following images
         transit_instruction_end.png
         transit_instruction_down.png
         transit_instruction_up.png
         transit_instruction_start.png
         transit_instruction_straight.png
         transit_instruction_turn_gentle_left.png
         transit_instruction_turn_gentle_right.png
         transit_instruction_turn_left.png
         transit_instruction_turn_right.png
         transit_instruction_turn_sharp_left.png
         transit_instruction_turn_sharp_right.png
         transit_instruction_uturn_left.png
         transit_instruction_uturn_right.png
         transit_instruction_intermediate_destination.png
         */
        if (instruction !== undefined) {
            jQuery('#instructions_detail').html(instruction['detail']);
            jQuery('#instructions_brief').html(instruction['brief']);
            jQuery('#instructions_count').html((index + 1) + '/' + this.numberOfInstructions);
            // since 1.7.10, if the instructions comes from javascript engine,
            // instruction.duration contains the duration in seconds, and durationString contains
            // for example 'in few minutes'
            // If the data comes from routing server, .duration will be the duration string.
            var durationString = (typeof(instruction['durationString']) !== 'undefined') ? instruction['durationString'] : instruction['duration'];
            jQuery('#instructions_time').html(durationString);
            jQuery('#instructions_icon').attr('src', this.imagePath + '/' + instruction['icon']);
        }


        // Configure how the line looks
        this.removeInstructionOverlays();
        if (this.showCurrentInstructionSegment && typeof(instruction.positions) !== 'undefined') {
            this.displayInstructionSegment(instruction, 0x00ff0000);
        }


        // Hide back or next instruction button.
        jQuery('#instructions_prev_button').show();
        jQuery('#instructions_next_button').show();
        // if it is first, do not show previous
        if (index == 0) {
            jQuery('#instructions_prev_button').hide();
        }
        // if it is last, do not show next, note the don't do an else, to handle case of just one instruction.
        if (index == (self.numberOfInstructions - 1)) {
            jQuery('#instructions_next_button').hide();
        }
    }

    /**
     * @public
     * @name removeInstructionOverlays
     * @function
     * @memberOf MyNavigation#
     * @description
     * clear any instruction extra overlays.
     */
    removeInstructionOverlays() {
        for (let i in this.instructionOverlays) {
            this.instructionOverlays[i].remove();
        }
        this.instructionOverlays = [];
    };

    /**
     * @public
     * @name isValid
     * @function
     * @memberOf MyNavigation#
     * @description
     * returns false if there was no navigation data (for example missing 'computeNavigation: true' in the routing request)
     * @return {boolean} false if there was no navigation data
     */
    isValid() {
        return this.mValid;
    };

    /**
     * @public
     * @name displayPrevInstruction
     * @function
     * @memberOf MyNavigation#
     * @description
     * displays the previous instruction if possible and move the camera to the start of the instruction
     */
    displayPrevInstruction() {
        if (this.currentInstructionIndex > 0) {
            this.currentInstructionIndex--;
            this.displayInstruction(this.currentInstructionIndex);

            this.goToCurrentInstruction();
        }
    };

    /**
     * @private
     * @description calls mapviewer.camera.goTo(), if necessary it calls mapviewer.changeFloor()
     */
    goToCurrentInstruction() {
        let self = this;
        if (self.currentInstructionIndex == -1) {
            self.currentInstructionIndex = 0;
        }

        var instruction = this.instructions[self.currentInstructionIndex];

        // available on SDKs and datasets with offline routing
        var position;
        var seeWholeInstruction = true;
        if (seeWholeInstruction
            && instruction.positions
            && instruction.positions.length > 0) {
            var points = instruction.positions;
            var converted_points = [];
            for (var j = 0, jl = points.length; j < jl; j++) {
                var point = points[j];
                // transfor to new coordinates
                point = this.mapviewer.convertLatLonToPoint(point);

                converted_points.push(point);
            }
            position = this.mapviewer.getViewpointFromPositions({
                points: converted_points,
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            });

            // But do not allow to get too close.
            position.radius = Math.max(position.radius, this.navigationInstructionRadius);
        }
        else {
            // If you want to keep same height as currently for instructions.
            // _this.navigationInstructionRadius = mapviewer.camera.position.radius;

            position = this.mapviewer.convertLatLonToPoint(instruction['position']);
            position.radius = this.navigationInstructionRadius;
        }

        var currentFloor = this.mapviewer.getCurrentFloor();
        var instructionFloor = instruction['dataset'];

        // Hook for multiBuildingView
        if (typeof(multiBuildingView) !== 'undefined') {
            multiBuildingView.goTo({
                mode: 'floor',
                viewpoint: {
                    position: position
                },
                floorID: instructionFloor,
                floorAnimationDuration: 1.5
            });
            return;
        }


        if (currentFloor != instructionFloor) {
            this.mapviewer.changeFloor(instructionFloor).done(function () {
                this.mapviewer.camera.goTo(position);
            });
        }
        else {
            this.mapviewer.camera.goTo(position);
        }
    }
}
