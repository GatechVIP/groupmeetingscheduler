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
        var $calendarTemplate = $('#groupmeetingscheduler_calendarTemplate', $rootel);
        var $undefinedUserTemplate = $('#groupmeetingscheduler_undefinedUserTemplate', $rootel);
		var $calendarContainer = $('#groupmeetingscheduler_calendar', $rootel);
		var $debugContainer = $('#groupmeetingscheduler_debug', $rootel);
		var widgetData = {
			usersFreeTimes:{}
		};
		var userid = "";
		var times = [];
		var hours = [];
		var initTimes = function (starthr, startmin, endhr, endmin) {
			var stopMinIndx = 3;
			var amPM = "am";
			var spc = "";
			var count = 0;
			for (var h = starthr; h <= endhr; h++) {
				if (h == 12) {
					amPM = "pm";
				}
				if (h > 12) {
					h-=12;
					endhr-=12;
					amPM = "pm";
				}
				if (h < 12) {
					spc = " ";
				}
				else {
					spc = "";
				}
				if (h == endhr) {
					stopMinIndx = endmin/15;
				}
				for (var m = startmin/15; m <= stopMinIndx; m++) {
				
					if (m == 0) {
						times.push(spc+h+":00"+amPM);
						hours.push(count);
					}
					else {
						times.push(spc+h+":"+m*15+amPM);
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

        /**
         * This renders the main calendar view where the user can select and
         * deselect free time
         */
        var renderCalendar = function () {
        		
        	var iota = function(a) {
        	    var i = 0;
        	    var arr = [];
        	    while (i < a) arr.push(i++);
        	    return arr;
        	}
		var day0 = sakai.api.i18n.General.process('Sun');
		var day1 = sakai.api.i18n.General.process('Mon');
		var day2 = sakai.api.i18n.General.process('Tue');
		var day3 = sakai.api.i18n.General.process('Wed');
		var day4 = sakai.api.i18n.General.process('Thu');
		var day5 = sakai.api.i18n.General.process('Fri');
		var day6 = sakai.api.i18n.General.process('Sat');
		// JSON object containing number of days, time slots, and the user's data
		var calendarData = {
			"days" : iota(7),
			"times" : iota(times.length),
			"numTimesPerDay" : times.length,
			"widgetData" : widgetData.usersFreeTimes[userid],
			"timeArr" : times,
			"hours" : hours,
			"dayNames" : [day0, day1, day2, day3, day4, day5, day6]
		};
		// Render template in calendar container
		sakai.api.Util.TemplateRenderer($calendarTemplate, calendarData, $calendarContainer);
        };
		
		/**
		 * Renders the undefined user template which displays an error
		 * message to the user.
		 */
		var renderUndefinedUserTemplate = function () {
			sakai.api.Util.TemplateRenderer($undefinedUserTemplate, {}, $calendarContainer);
		};
		
        ////////////////////
        // Event Handlers //
        ////////////////////

        /** Binds Settings form */
        $settingsForm.on('submit', function(ev) {
           	sakai.api.Widgets.Container.informFinish(tuid, 'groupmeetingscheduler');
        });

        $cancelSettings.on('click', function(){
            sakai.api.Widgets.Container.informFinish(tuid, 'groupmeetingscheduler');
        });
        
        var bindClick = function () {
            $calendarContainer.mousedown(downhandler);
            $calendarContainer.mouseup(uphandler);
            $calendarContainer.mouseover(overhandler);
         }
        
        var mouseState = 0;
        // 0 = up
        // 1 = change to freetime
        // 2 = change to busytime
		var downhandler = function(e) {
						
			var prefix = 'groupmeetingscheduler_timeBlock_';
			var divID = String(e.target.id);
				
			if (divID.indexOf(prefix) != -1) {
				var idArr = divID.split(prefix);
				var timeBlockID = parseInt(idArr[1]);
								
				var timeIndex = widgetData.usersFreeTimes[userid].indexOf(timeBlockID);
								
				if (timeIndex != -1) {
					mouseState = 2;
					widgetData.usersFreeTimes[userid].splice(timeIndex, 1);
									
				}
				else {
					mouseState = 1;
					if(timeIndex == -1){
						widgetData.usersFreeTimes[userid].push(timeBlockID);
					}
				}
				e.preventDefault();
				renderCalendar();
			}
		};
				
		var uphandler = function(e) {
			mouseState = 0;
			e.preventDefault();
			sakai.api.Widgets.saveWidgetData(tuid, widgetData, function(){}, true);
		};
	
		var overhandler = function(e) {
			var prefix = 'groupmeetingscheduler_timeBlock_';
			var divID = String(e.target.id);
			if (divID.indexOf(prefix) != -1) {
				var idArr = divID.split(prefix);
			  	var timeBlockID = parseInt(idArr[1]);
				var timeIndex = widgetData.usersFreeTimes[userid].indexOf(timeBlockID);
				if (mouseState == 1) {
					if(timeIndex == -1){
						widgetData.usersFreeTimes[userid].push(timeBlockID);
						renderCalendar();
					}
				} 
				else if (mouseState == 2) {
					if(timeIndex != -1){
						widgetData.usersFreeTimes[userid].splice(timeIndex, 1);
						renderCalendar();
					}
				}
			}
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
            } else {
                // set up Main view
				initTimes(9,30,20,15);
								
                sakai.api.Widgets.loadWidgetData(tuid, function(success, data) {
				//TODO:  Make this and loadMeData take success into account; what to do in failure case?
					if (success) {
						widgetData = data;
					}
					else {
						console.log("Failed to load widget data");
					}
					sakai.api.User.loadMeData(function(success, data){
						if(success) {
							//Only begin to create data when user info retrieved.
							userid = data.user.userid;
							// If user is not logged in, userid is undefined
							if (userid == undefined) {
				        		renderUndefinedUserTemplate();
							$mainContainer.show();
							}
							else {
								//Create user free time array if we've never seen this user before
								if (widgetData.usersFreeTimes == undefined) {	
									widgetData.usersFreeTimes = {};
									widgetData.usersFreeTimes[userid] = [];
								}
								else if(!widgetData.usersFreeTimes.hasOwnProperty(userid)){
									widgetData.usersFreeTimes[userid] = [];
								}
								else if(typeof(widgetData.usersFreeTimes[userid]) == "string"){
									widgetData.usersFreeTimes[userid] = [];
								}
								renderCalendar();
				                $mainContainer.show();
				               	bindClick();
				            }
		            	}
		            	else {
		            		console.log("Failed to load user data");
		            	}
					}); // end loadMeData
				}); // end loadWidgetData
            } // end else statement
        }; // end doInit

        // run the initialization function when the widget object loads
        doInit();
    };

    // inform Sakai OAE that this widget has loaded and is ready to run
    sakai.api.Widgets.widgetLoader.informOnLoad('groupmeetingscheduler');
});
