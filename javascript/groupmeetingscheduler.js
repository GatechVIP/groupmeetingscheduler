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
     * Group Meeting Scheduler widget allows users to find a weekly group
     * meeting time based on all members' availability
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.groupmeetingscheduler = function(tuid, showSettings) {


        /////////////////////////////
        // Configuration variables //
        /////////////////////////////

        // DOM jQuery Objects
        var $rootel = $('#' + tuid);  // unique container for each widget instance
        var $mainContainer = $('#groupmeetingscheduler_main', $rootel);
        var $settingsContainer = $('#groupmeetingscheduler_settings', $rootel);
        var $settingsForm = $('#groupmeetingscheduler_settings_form', $rootel);
        var $cancelSettings = $('#groupmeetingscheduler_cancel_settings', $rootel);
        var $usernameContainer = $('#groupmeetingscheduler_username', $rootel);
        var $templateContainer = $('#groupmeetingscheduler_template', $rootel);
        var $calendarContainer = $('#groupmeetingscheduler_calendar', $rootel);
        var $debugContainer = $('#groupmeetingscheduler_debug', $rootel);
        var userid = "";
        var numTimesPerDay = 30;
        
        // Array containing HTML div elements that makes up the grid. Init this in 'initGrid'.
        var divArr = [];

        /////////////////////////////
        // Settings View functions //
        /////////////////////////////


        ///////////////////////
        //     Rendering     //
        ///////////////////////
        
        var initGrid = function() {
            var iota = function(a) {
                var i = 0;
                var arr = [];
                while (i < a) arr.push(i++);
                return arr;
            };
        
            var calendarData = {
                'days': iota(7),
                'times': iota(numTimesPerDay),
                'numTimesPerDay': numTimesPerDay
            };
            sakai.api.Util.TemplateRenderer($templateContainer, calendarData, $calendarContainer);
            
            $calendarContainer.children('.dayBlock').each(function(i, day) {
                $(day).children('.busytime').each(function(i, time) {
                    var jqTime = $(time);
                    divArr.push(jqTime);
                });
            });
        };
        
        var pushGrid = function(data) {
            for (var i = 0; i < data.length; i++) {
                divArr[i].removeClass('freetime busytime');
                divArr[i].addClass(data[i] ? 'freetime' : 'busytime');
            }
        };
        
        ////////////////////
        // Event Handlers //
        ////////////////////
        
        // First argument is an array of booleans. Each index in the array represents one time block.
        // Boolean true for free time, false for busy. After saving, saveData should call callback with
        // a boolean argument indicating whether save succeeded.
        var saveData = function(boolArr, callback) {
            // STUB!!! This code does not actually work!
            console.info('Saving...');
            console.info(boolArr);
            if (callback) callback();
        }
        
        // loadData should call the callback function with a boolean indicating whether load succeeded 
        // and an array of booleans representing free/busy time. If the boolean is false (load failed),
        // the array is meaningless.
        var loadData = function(callback) {
            // STUB!!! This code does not actually work!
            var repeat = function(x, rep) {
                var arr = [];
                while (rep--) {
                    arr.push(x);
                }
                return arr;
            };
            
            if (callback) callback(true, repeat(false, 30*7));
        }

        /** Binds Settings form */
        $settingsForm.on('submit', function(ev) {
            sakai.api.Widgets.Container.informFinish(tuid, 'groupmeetingscheduler');
        });

        $cancelSettings.on('click', function() {
            sakai.api.Widgets.Container.informFinish(tuid, 'groupmeetingscheduler');
        });
        
        var bindClick = function () {
            $calendarContainer.mousedown(downhandler);
            $calendarContainer.mouseup(uphandler);
            $calendarContainer.mouseover(overhandler);
         }
        
        var MouseState = {
            'UP': 0,
            'TOFREE': 1,
            'TOBUSY': 2
        };
        var mouseState = MouseState.UP;
        
        var downhandler = function(e) {
            var ele = $(e.target);
            ele.toggleClass('freetime busytime');
            
            mouseState = ele.hasClass('freetime') ? MouseState.TOFREE : MouseState.TOBUSY;
            e.preventDefault();
        };

        var uphandler = function(e) {
            mouseState = MouseState.UP;
            e.preventDefault();
            saveData(divArr.map(function(e) {
                return e.hasClass('freetime');
            }));
        };

        var overhandler = function(e) {
            if (mouseState === MouseState.UP) {
                return;
            }
            
            var ele = $(e.target);
            ele.removeClass('freetime busytime');
            ele.addClass(mouseState === MouseState.TOFREE ? 'freetime' : 'busytime');
            e.preventDefault();
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
                // show the Settings view
                $settingsContainer.show();
                return;
            }
            
            // set up Main view
            sakai.api.User.loadMeData(function(success, udata) {
                if (!success) {
                    console.info('Load user data failed');
                    return;
                }
                userid = udata.user.userid;
                loadData(function(success, data) {
                    if (!success) {
                        console.info('Load persistence data failed.');
                        return;
                    }
                    initGrid();
                    $mainContainer.show();
                    bindClick();
                    pushGrid(data);
                }); // end loadData
            }); // end loadMeData
        }; // end doInit

        // run the initialization function when the widget object loads
        doInit();
    };

    // inform Sakai OAE that this widget has loaded and is ready to run
    sakai.api.Widgets.widgetLoader.informOnLoad('groupmeetingscheduler');
});