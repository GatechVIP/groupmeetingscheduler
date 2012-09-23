/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

// load the master sakai object to access all Sakai OAE API methods
require(['jquery', 'sakai/sakai.api.core'], function($, sakai) {

    /**
     * @name sakai_global.groupmeetingscheduler
     *
     * @class groupmeetingscheduler
     *
     * @description
     * My Hello World is a dashboard widget that says hello to the current user
     * with text in the color of their choosing
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.groupmeetingscheduler = function(tuid, showSettings) {


        /////////////////////////////
        // Configuration variables //
        /////////////////////////////

        var DEFAULT_COLOR = '#000000';  // default text color is black

        // DOM jQuery Objects
        var $rootel = $('#' + tuid);  // unique container for each widget instance
        var $mainContainer = $('#groupmeetingscheduler_main', $rootel);
        var $settingsContainer = $('#groupmeetingscheduler_settings', $rootel);
        var $settingsForm = $('#groupmeetingscheduler_settings_form', $rootel);
        var $cancelSettings = $('#groupmeetingscheduler_cancel_settings', $rootel);
        var $colorPicker = $('#groupmeetingscheduler_color', $rootel);
        var $usernameContainer = $('#groupmeetingscheduler_username', $rootel);
    			var $calendarContainer = $('#groupmeetingscheduler_calendar', $rootel);

        ///////////////////////
        // Utility functions //
        ///////////////////////

        /**
         * Checks if the provided color argument is non-empty and returns the color
         * if not empty; if empty, returns the DEFAULT_COLOR
         *
         * @param {String} color The hex value of the color
         */
        var checkColorArgument = function(color) {
            // check if color exists and is not an empty string
            return (color && $.trim(color)) ? $.trim(color) : DEFAULT_COLOR;
        };

        /**
         * Gets the preferred color from the server using an asynchronous request
         *
         * @param {Object} callback Function to call when the request returns. This
         * function will be sent a String with the hex value of the preferred color.
         */
        var getPreferredColor = function(callback) {
            // get the data associated with this widget
            sakai.api.Widgets.loadWidgetData(tuid, function(success, data) {
                if (success) {
                    // fetching the data succeeded, send it to the callback function
                    callback(checkColorArgument(data.color));
                } else {
                    // fetching the data failed, we use the DEFAULT_COLOR
                    callback(DEFAULT_COLOR);
                }
            });
        };


        /////////////////////////
        // Main View functions //
        /////////////////////////

        /**
         * Shows the Main view that contains the Hello World text colored in the
         * provided color argument
         *
         * @param {String} color The hex value of the color to set the text
         * (i.e. '#00FF00')
         */
        var showMainView = function(color) {

						// For each day of the week
						for (var i=0; i < 7; i++) {
							// Day block contains all of the time blocks for one day
							var dayBlock = document.createElement('div');
							dayBlock.setAttribute('id', 'groupmeetingscheduler_dayBlock'+ i + $rootel);
							dayBlock.setAttribute('style', 'display: inline-block;');
							
							// Each time block represents some time increment (15min?)
							for (var j=0; j < 50; j++){
								var timeBlock = document.createElement('div');
								timeBlock.setAttribute('id', 'groupmeetingscheduler_timeBlock' + j + $rootel);
								timeBlock.setAttribute('style', 'width: 50px; height: 10px; background-color: #f00; border: black solid 1px; ');
								// Time blocks are added to day blocks
								dayBlock.appendChild(timeBlock);
								
								// Event handlers
		          	timeBlock.onmousedown = downhandler;
								timeBlock.onmouseup = uphandler;
								timeBlock.onmouseover = overhandler;
							}
							// Day blocks
							$calendarContainer.append(dayBlock);
						}
						$mainContainer.show();
						
						
        };


        /////////////////////////////
        // Settings View functions //
        /////////////////////////////

        /**
         * Sets the color dropdown in the Settings view to the given color
         *
         * @param {String} color The hex value of the color
         */
        var setDropdownColor = function(color) {
            // set the color dropdown to the given value
            $colorPicker.val(checkColorArgument(color));
        };


        ////////////////////
        // Event Handlers //
        ////////////////////

        /** Binds Settings form */
        $settingsForm.on('submit', function(ev) {
            // get the selected color
            var selectedColor = $colorPicker.val();

            // save the selected color
            sakai.api.Widgets.saveWidgetData(tuid, {
                'color': selectedColor
                },
                function(success, data) {
                    if (success) {
                        // Settings finished, switch to Main view
                        sakai.api.Widgets.Container.informFinish(tuid, 'groupmeetingscheduler');
                    }
                }
            );
            return false;
        });

        $cancelSettings.on('click', function(){
            sakai.api.Widgets.Container.informFinish(tuid, 'groupmeetingscheduler');
        });

				var downhandler = function(e) {
					var block = e.target;
					block.isTimeSet = !block.isTimeSet;
					block.style.backgroundColor = block.isTimeSet ? '#0f0' : '#f00';
					mouseState = block.isTimeSet ? 1 : 2;
					e.preventDefault();
				};
	
				var uphandler = function() {
					mouseState = 0;
				};
	
				var overhandler = function(e) {
					if (mouseState == 1) {
						e.target.style.backgroundColor = '#0f0';
						e.target.isTimeSet = 1;
					} else if (mouseState == 2) {
						e.target.style.backgroundColor = '#f00';
						e.target.isTimeSet = 0;
					}
				};
        /////////////////////////////
        // Initialization function //
        /////////////////////////////

        /**
         * Initialization function that is run when the widget is loaded. Determines
         * which mode the widget is in (settings or main), loads the necessary data
         * and shows the correct view.
         */
        var doInit = function() {
            if (showSettings) {
                // set up Settings view

                // get the preferred color & set the color picker dropdown
                getPreferredColor(setDropdownColor);

                // show the Settings view
                $settingsContainer.show();
            } else {
                // set up Main view
								
                // get data about the current user
                var me = sakai.data.me;

                // set the text of the usernameContainer <span> element to
                // the current user's first name
                $usernameContainer.text(sakai.api.User.getFirstName(me.profile));

                // get the preferred color and show the Main view
                getPreferredColor(showMainView);
            }
        };

        // run the initialization function when the widget object loads
        doInit();
    };

    // inform Sakai OAE that this widget has loaded and is ready to run
    sakai.api.Widgets.widgetLoader.informOnLoad('groupmeetingscheduler');
});