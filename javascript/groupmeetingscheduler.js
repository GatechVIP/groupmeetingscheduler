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
        var $templateContainer = $('#groupmeetingscheduler_template', $rootel);
        var $calendarContainer = $('#groupmeetingscheduler_calendar', $rootel);
        var $aggregateTemplate = $('#groupmeetingscheduler_aggregate_template', $rootel);
        var $aggregateContainer = $('#groupmeetingscheduler_aggregate', $rootel);
        var $peopleListTemplate = $('#groupmeetingscheduler_peoplelist_template', $rootel);
        var $peopleListContainer = $('#groupmeetingscheduler_peoplelist', $rootel);
        var $undefinedUserTemplate = $('#groupmeetingscheduler_undefinedUser_template', $rootel);
        var $undefinedUserContainer = $('#groupmeetingscheduler_undefinedUser', $rootel);
        var $changeViewButton = $('#groupmeetingscheduler_changeview', $rootel);
        var $aggregateRoot = $('#groupmeetingscheduler_aggregate_root', $rootel);
	
        // Days of the weeks
        var day0 = sakai.api.i18n.General.process('Sun');
        var day1 = sakai.api.i18n.General.process('Mon');
        var day2 = sakai.api.i18n.General.process('Tue');
        var day3 = sakai.api.i18n.General.process('Wed');
        var day4 = sakai.api.i18n.General.process('Thu');
        var day5 = sakai.api.i18n.General.process('Fri');
        var day6 = sakai.api.i18n.General.process('Sat');
        var userid = "";
        
        // Array containing HTML div elements that makes up the grid. Init this in 'initGrid'.
        var divArr = [];
	
        // Array containing a label for each timeslot (e.g. 9:30am, 11:15pm, etc.)
        // timeArr.length returns the number of time slots per day
        var timeArr = [];	
        // Puts times (in 15 min increments) in timeArr array to be displayed next to the time slots
        // Assumes starthr and endhr are in 24-hour time, and that startmin and endmin are
        // multiples of 15. 
        var initTimeArr = function (starthr, startmin, endhr, endmin) {
            var stopMinIndx = 3;
            var amPM = "am";
            var count = 0;
            for (var h = starthr; h <= endhr; h++) {
                if (h === 12) {
                    amPM = "pm";
                }
                if (h > 12) {
                    h-=12;
                    endhr-=12;
                    amPM = "pm";
                }
                if (h === endhr) {
                    stopMinIndx = endmin/15;
                }
                for (var m = startmin/15; m <= stopMinIndx; m++) {
                    if (m === 0) {
                        timeArr.push(h+":00"+amPM);
                    } else {
                        timeArr.push(h+":"+m*15+amPM);
                    }
                    count++;
                }
                startmin = 0;	
            }
        };

        /////////////////////////////
        // Settings View functions //
        /////////////////////////////


        ///////////////////////
        //     Rendering     //
        ///////////////////////

        // Convenience function. Creates an array from 0 to a-1.
        var iota = function(a) {
            var i = 0;
            var arr = [];
            while (i < a) arr.push(i++);
            return arr;
        };
        
        // Create the grid on the page
        var initGrid = function() {
            var calendarData = {
                'days': iota(7),
                'times': iota(timeArr.length),
                'timeArr': timeArr,
                'dayNames': [day0, day1, day2, day3, day4, day5, day6]
            };
            sakai.api.Util.TemplateRenderer($templateContainer, calendarData, $calendarContainer);
            
            // All blocks are initially set to busytime. So we can filter by the busytime class.
            // Creates an array of div elements in divArr
            $calendarContainer.children('.dayBlock').each(function(i, day) {
                $(day).children('.timeBlock').each(function(i, time) {
                    var $time = $(time);
                    divArr.push($time);
                });
            });
        };
        
        // Makes the HTML grid represent the data. Data must be a boolean array with length
        // equals to number of blocks in the HTML.
        var pushGrid = function(data) {
            for (var i = 0; i < data.length; i++) {
                divArr[i].removeClass('freetime busytime');
                divArr[i].addClass(data[i] ? 'freetime' : 'busytime');
            }
        };
        
        // Loads and display aggregate view. The format of "data" is specified in GitHub issue #17.
        var loadAggregateView = function(aggrData) {
            var rgba = function(r, g, b, a) {
                var flr = Math.floor;
                return 'rgba(' + flr(r) + ',' + flr(g) + ',' + flr(b) + ',' + a + ')';
            };
            var data = {
                'days': iota(7),
                'times': iota(timeArr.length),
                'numTimesPerDay': timeArr.length,
                'timeArr': timeArr,
                'dayNames': [day0, day1, day2, day3, day4, day5, day6]
            };
            sakai.api.Util.TemplateRenderer($aggregateTemplate, data, $aggregateContainer);
            var index = 0;
            $aggregateContainer.children('.dayBlock').each(function(i, day) {
                $(day).children('.timeBlock').each(function(j, time) {
                    var ratio = aggrData.times[index].length / aggrData.total;
                    time.style.backgroundColor = rgba(0, 255, 0, ratio);
                    index++;
                });
            });
            
            $aggregateContainer.mouseover(function(e) {
                var prefix = 'aggregate_';
                var $e = $(e.target);
                var id = $e.attr('id');
                if (!id || id.indexOf(prefix) !== 0) return;
                
                var idnum = parseInt(id.substr(prefix.length));
                var data = {
                    'num': aggrData.times[idnum].length,
                    'users': aggrData.times[idnum]
                };
                sakai.api.Util.TemplateRenderer($peopleListTemplate, data, $peopleListContainer);
            });
            
            $aggregateContainer.show();
        };
	
	
        /**
        * Renders the undefined user template which displays an error
        * message to the user.
        */
        var renderUndefinedUserTemplate = function () {
            sakai.api.Util.TemplateRenderer($undefinedUserTemplate, {}, $undefinedUserContainer);
        };
	
        ////////////////////
        // Event Handlers //
        ////////////////////
        
        $changeViewButton.click(function() {
            $aggregateRoot.toggleClass('groupmeetingscheduler_noshow');
            $calendarContainer.toggleClass('groupmeetingscheduler_noshow');
        });
        
        // First argument is an array of booleans. Each index in the array represents one time block.
        // Boolean true for free time, false for busy. After saving, saveData should call callback with
        // a boolean argument indicating whether save succeeded.
        var saveData = function(boolArr, callback) {
            console.info('Saving...');
            console.info(boolArr);
            widgetData = {};
            sakai.api.Widgets.loadWidgetData(tuid, function(success, data) {
		        if (success) {
			        widgetData = data;

                    widgetData.calendarData[userid] = boolArr;
                    sakai.api.Widgets.saveWidgetData(tuid, widgetData, function(success, data) {
                        if (!success && callback) {
                            callback(false);
                            return;
                        }
                    }, false);
		        }
                callback && callback(success ? true : false);
	        });
        };
        
        // loadData should call the callback function with a boolean indicating whether load succeeded 
        // and an array of booleans representing free/busy time. If the boolean is false (load failed),
        // the array is meaningless.
        var loadData = function(callback){
            var repeat = function(x, rep) {
                var arr = [];
                while (rep--) {
                    arr.push(x);
                }
                return arr;
            };
	        widgetData = {};
            
            sakai.api.Widgets.loadWidgetData(tuid, function(success, data){
		        if (success) {
			        widgetData = data;
                    console.info("Previous widget data:");
                    console.info(data);
                    //We have never seen this widget before.  Save the tuid and create/save the user times.
                    if (widgetData.widgetId === undefined) {
		                widgetData.widgetId = tuid;
                        widgetData.facilitator = userid;
                        widgetData.calendarData = {};
                        
                        sakai.api.Widgets.saveWidgetData(tuid, widgetData, function(success, data){
			                if (!success) {
                                console.log("Problem saving initial data!");
                            }
		                }, true);
	                }
                    //If we have never seen this user before, build their default array.
                    if(widgetData.calendarData[userid] === undefined){
                        widgetData.calendarData[userid] = repeat(false, 30*7);
                    }
                    
                    console.info("The current user data:");
                    console.info(widgetData.calendarData[userid]);
                    callback && callback(true, widgetData.calendarData[userid]);
		        } else {
                    widgetData.widgetId = tuid;
                    widgetData.facilitator = userid;
                    widgetData.calendarData = {};
                    sakai.api.Widgets.saveWidgetData(tuid, widgetData, function(success, data){
                        if(!success){
                            console.log("Problem saving initial data!");
                        }
                    }, true);
                    callback && callback(true, repeat(false, 30*7));
                }
                
	        });
        };
        
        var bindClick = function () {
            $calendarContainer.mousedown(downhandler);
            $calendarContainer.mouseup(uphandler);
            $calendarContainer.mouseover(overhandler);
        };
        
        /**
         * "Enum" for mouse states
         */
        var MouseState = {
            'UP': 0,
            'TOFREE': 1,
            'TOBUSY': 2
        };
        var mouseState = MouseState.UP;
        
        /** Switches freetime/busytime. If changed to freetime, mouseState = TOFREE, else mouseState = TOBUSY */
        var downhandler = function(e) {
            var ele = $(e.target);
            if (!ele.hasClass('timeBlock')) return;
            
            ele.toggleClass('freetime busytime');
            mouseState = ele.hasClass('freetime') ? MouseState.TOFREE : MouseState.TOBUSY;
            e.preventDefault();
        };

        /** Changes mouseState to UP. saveData. */
        var uphandler = function(e) {
            mouseState = MouseState.UP;
            e.preventDefault();
            saveData(divArr.map(function(e) {
                return e.hasClass('freetime');
            }));
        };

        /** Changes the block to freetime/busytime depending on the mouseState. If mouseState is UP, it does nothing */
        var overhandler = function(e) {
            if (mouseState === MouseState.UP) {
                return;
            }
            
            var ele = $(e.target);
            if (!ele.hasClass('timeBlock')) return;
            
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
            // set up Main view
            initTimeArr(9, 30, 20, 45); // timeslots from 9:30am to 8:45pm
	    
            sakai.api.User.loadMeData(function(success, udata) {
                if (!success) {
                    console.info('Load user data failed');
                    return;
                }
                userid = udata.user.userid;
		
                // If user is not logged in, userid is undefined
                if (userid === undefined) {
                    renderUndefinedUserTemplate();
                    $mainContainer.show();
                }
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
            
            // Test loadAggregateView
            var times = [];
            for (var i = 0; i < timeArr.length * 7; i++) {
                times[i] = i%2 ? ['u1'] : ['u1', 'u2'];
            }
            var aggrData = {
                'total': 2,
                'times': times
            };
            loadAggregateView(aggrData);
        }; // end doInit

        // run the initialization function when the widget object loads
        doInit();
    };

    // inform Sakai OAE that this widget has loaded and is ready to run
    sakai.api.Widgets.widgetLoader.informOnLoad('groupmeetingscheduler');
});
