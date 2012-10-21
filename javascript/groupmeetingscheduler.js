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
				
				
				/////////////
        // Objects //
        /////////////
				
				// Contains all the information for a
				// single day in the calendar
				var DayBlock = function(startIndex, endIndex) {
						this.startIndex = startIndex;
						this.endIndex = endIndex;
						this.id = 0;
				}
				// Contains all the information for a 
				// single (15min) time slot in the calendar
				var TimeBlock = function(isFreeTime, id) {
        		this.isFreeTime = isFreeTime;
        		this.id = id;
        }
        // Sets a time block as free (true) or busy (false)
        TimeBlock.prototype.setFreeTime = function(isFreeTime) {
        	this.isFreeTime = isFreeTime;
        }
        
		    TimeBlock.prototype.switchTime = function() {
        	this.isFreeTime = !this.isFreeTime;
        }
        var numTimeBlocksPerDay = 30;
        // Array of (7) DayBlocks
        var dayArray = [];
        
				var widgetData = {
						usersFreeTimes:{}
				};
				var userid = "";
				
        function initDayArray() {
		     	for (var j = 0; j < 7; j++) {
		      		// Array of TimeBlocks for each day
						  var timeArray = [];
						  for (var i = 0; i < numTimeBlocksPerDay; i++) {
						  		var timeBlock = new TimeBlock(false, i + j*numTimeBlocksPerDay);
						  		timeArray[i] = timeBlock;
						  }
						  dayArray[j] = timeArray;
		      }
		    }
		    
		    function updateDayArray(id) {
		    		var day = 0;
		    		var time = id;
		    		while (time >= numTimeBlocksPerDay) {
		    				day++;
		    				time -= numTimeBlocksPerDay;
		    		}
		    		var timeBlock = dayArray[day][time];
		    		timeBlock.switchTime();
		    		dayArray[day][time] = timeBlock;
		    }
		    
		    function getTimeBlock(id) {
		    		var day = 0;
		    		var time = id;
		    		while (time >= numTimeBlocksPerDay) {
		    				day++;
		    				time -= numTimeBlocksPerDay;
		    		}
		    		timeBlock = dayArray[day][time];
		    		return timeBlock;
		    }

				function loadDayArray() {
						var timeBlockID = 0;
						var isTimeSet = 0;
				   	for (var i = 0; i < 7; i++) {
								for (var j = 0; j < numTimeBlocksPerDay; j++) {
										timeBlockID = j + i*numTimeBlocksPerDay;
										timeIndex = widgetData.usersFreeTimes[userid].indexOf(timeBlockID);
										//console.log(timeBlockID+" "+timeIndex);
										if (timeIndex != -1) {
												updateDayArray(timeBlockID);
												renderCalendar();
										}
								}
				    }
				}

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
						// JSON object containing an array of TimeBlocks for each day
						var daysAndTimes = {
								"days" : iota(6),
								"times" : iota(numTimeBlocksPerDay),
								"numTimesPerDay" : numTimeBlocksPerDay,
								"widgetData" : widgetData.usersFreeTimes[userid]
						};
						// Render template in calendar container
            sakai.api.Util.TemplateRenderer($templateContainer, daysAndTimes, $calendarContainer);
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
        		initDayArray();
        		//console.log("DayArray Initialized");
            if (showSettings) {
                // set up Settings view
                
                // show the Settings view
                $settingsContainer.show();
            } else {
                // set up Main view
								
                // get data about the current user
                var me = sakai.data.me;
                sakai.api.Widgets.loadWidgetData(tuid, function(success, data) {
							
										//TODO:  Make this and loadMeData take success into account; what to do in failure case?
										if (success) {
											widgetData = data;
										}
										else {
											console.log("Loading widget data failed");
										}
										sakai.api.User.loadMeData(function(success, data){
													//Only begin to create data when user info retrieved.
													userid = data.user.userid;
													//Create user free time array if we've never seen this user before
													//
													//
													if (widgetData.usersFreeTimes == undefined) {	
															widgetData.usersFreeTimes = {};
															widgetData.usersFreeTimes[userid] = [];
															console.log("WidgetData undefined");
													}
													else if(!widgetData.usersFreeTimes.hasOwnProperty(userid)){
															widgetData.usersFreeTimes[userid] = [];
															console.log("WidgetData has no entry for user");
													}
													else if(typeof(widgetData.usersFreeTimes[userid]) == "string"){
															widgetData.usersFreeTimes[userid] = [];
															console.log("WidgetData is String");
													}
													renderCalendar();
                          $mainContainer.show();
                          bindClick();
										});
								});
            }
        };

        // run the initialization function when the widget object loads
        doInit();
    };

    // inform Sakai OAE that this widget has loaded and is ready to run
    sakai.api.Widgets.widgetLoader.informOnLoad('groupmeetingscheduler');
});