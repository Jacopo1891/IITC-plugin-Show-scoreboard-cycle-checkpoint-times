// ==UserScript==
// @id             iitc-plugin-score-cycle-times@jonatkins&jacopo1891
// @name           IITC plugin: Show scoreboard cycle/checkpoint times
// @category       Info
// @version        0.1.5
// @namespace      https://github.com/Jacopo1891/IITC-plugin-Show-scoreboard-cycle-checkpoint-times
// @updateURL      //
// @downloadURL    //
// @description    [iitc-2018-09-13-002500] Show the times used for the septicycle and checkpoints for regional scoreboards.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'iitc';
plugin_info.dateTimeVersion = '20170108.21732';
plugin_info.pluginId = 'score-cycle-times';
//END PLUGIN AUTHORS NOTE

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.scoreCycleTimes = function() {};

window.plugin.scoreCycleTimes.CHECKPOINT = 5*60*60; //5 hours per checkpoint
window.plugin.scoreCycleTimes.CYCLE = 7*25*60*60; //7 25 hour 'days' per cycle

window.plugin.scoreCycleTimes.setup  = function() {

  // add a div to the sidebar, and basic style
  $('#sidebar').append('<div id="score_cycle_times_display"></div>');
  $('#score_cycle_times_display').css({'color':'#ffce00'});

  addHook('publicChatDataAvailable', window.plugin.scoreCycleTimes.handleScoreData);
};

window.plugin.scoreCycleTimes.update = function() {

  // checkpoint and cycle start times are based on a simple modulus of the timestamp
  // no special epoch (other than the unix timestamp/javascript's 1970-01-01 00:00 UTC) is required

  // when regional scoreboards were introduced, the first cycle would have started at 2014-01-15 10:00 UTC - but it was
  // a few checkpoints in when scores were first added

  var now = new Date().getTime();

  var cycleStart = Math.floor(now / (window.plugin.scoreCycleTimes.CYCLE*1000)) * (window.plugin.scoreCycleTimes.CYCLE*1000);
  var cycleEnd = cycleStart + window.plugin.scoreCycleTimes.CYCLE*1000;

  var checkpointStart = Math.floor(now / (window.plugin.scoreCycleTimes.CHECKPOINT*1000)) * (window.plugin.scoreCycleTimes.CHECKPOINT*1000);
  var checkpointEnd = checkpointStart + window.plugin.scoreCycleTimes.CHECKPOINT*1000;

  var latE6 = Math.round(map.getCenter().lat*1E6);
  var lngE6 = Math.round(map.getCenter().lng*1E6);
  window.postAjax('getRegionScoreDetails', {latE6:latE6,lngE6:lngE6}, function(data){
      scoreData = data.result;
      regionName = scoreData['regionName'];
      enlScoreLastCP = Number(scoreData['scoreHistory'][0][1]).toLocaleString();
      resScoreLastCP = Number(scoreData['scoreHistory'][0][2]).toLocaleString();
      enlScoreMedia = Number(scoreData['gameScore'][0]).toLocaleString();
      resScoreMedia = Number(scoreData['gameScore'][1]).toLocaleString();

      $('#scoreCycleTable tr:first').before(formatRowData('Region', regionName));
      $('#scoreCycleTable tr:last').before(formatRowData('Last CP', 'Enl: '+enlScoreLastCP+'<br>Res: '+resScoreLastCP));
      $('#scoreCycleTable tr:last').before(formatRowData('Media', 'Enl: '+enlScoreMedia+'<br>Res: '+resScoreMedia));
  });

  var formatRowData = function(label, data){
     return '<tr><td>'+label+'</td><td>'+data+'</td></tr>';
  }

  var formatRowTime = function(label,time) {
  var dataTime = new Date(time);
    var timeStr = dataTime.toLocaleTimeString().replace(/:00$/,'') + " " +  dataTime.toLocaleDateString();

    return '<tr><td>'+label+'</td><td>'+timeStr+'</td></tr>';
  };

  var html = '<table id="scoreCycleTable">'
           + formatRowTime('Cycle start', cycleStart)
           + formatRowTime('<b>Next checkpoint</b>', checkpointEnd)
           + formatRowTime('Cycle end', cycleEnd)
           + '</table>';

  $('#score_cycle_times_display').html(html);
  setTimeout ( window.plugin.scoreCycleTimes.update, checkpointEnd-now);
};

window.plugin.scoreCycleTimes.handleScoreData = function(){

    window.plugin.scoreCycleTimes.update();
}

var setup =  window.plugin.scoreCycleTimes.setup;

// PLUGIN END //////////////////////////////////////////////////////////

setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);