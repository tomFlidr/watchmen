var moment = require('moment');
var async = require('async');
var auth = require('./../webserver/routes/web-auth-route');
var utils = require('./utils');
var debug = require('debug')('reporter');

function Reporter (storage){
  this.storage = storage;
}

var HOUR = 1000 * 60 * 60;
var DAY = HOUR * 24;
var WEEK = DAY * 7;
var MONTH = 365 / 12 * DAY;

exports = module.exports = Reporter;

/**
 * Basic report for services
 *
 * @param options
 * @param callback
 */

Reporter.prototype.getServices = function(options, callback){

  function getInfo(service, cb){
    getGeneralServiceInfo(service, storage, cb);
  }

  var storage = this.storage;

  debug('loading services');
  storage.getServices(options, function(err, services){

    if (err) {
      return callback(err);
    }

    async.mapSeries(services, getInfo, function(err, servicesData){
      if (err) {
        return callback(err);
      }
      debug('services loaded');
      callback(err, servicesData);
    });
  });
};


/**
 * Returns service reporting info
 *
 * @param serviceId
 * @param callback
 * @returns {*}
 */

Reporter.prototype.getService = function(serviceId, callback){
  var storage = this.storage;

  debug('loading service');

  storage.getService(serviceId, function(err, service){
    if (err || !service) {
      return callback(err, service);
    }

    getGeneralServiceInfo(service, storage, function(err, serviceData){
      if (err) {
        return callback(err);
      }

      if (!serviceData) {
        return callback(null, null);
      }

	  var lastMonth = +new Date() - MONTH;
      var lastWeek = +new Date() - WEEK;
      var lastHour = +new Date() - HOUR;

	  
      storage.getServiceOutagesSince(service, lastMonth, function(err, outagesLastMonth){
        if (err) {
          return callback(err);
        }

        var now = +new Date();
        var outagesLastHour = outagesLastMonth.filter(function(outage){
          return outage.timestamp >= now - HOUR;
        });
        var uptimeInfoLastHour = getUptime(service, outagesLastHour, serviceData.status.currentOutage, lastHour);

        storage.getLatencySince(serviceData.service, +new Date() - MONTH, 'day', function(err, latencyLastMonth){
          if (err) {
            return callback(err);
          }
		  
		  storage.getLatencySince(serviceData.service, +new Date() - WEEK, 'day', function(err, latencyLastWeek){
		    if (err) {
		  	return callback(err);
		    }
		  
		    storage.getLatencySince(serviceData.service, +new Date() - DAY, 'hour', function(err, latencyLast24Hours){
		    if (err) {
		  	return callback(err);
		    }
		  
		  	storage.getLatencySince(serviceData.service, +new Date() - HOUR, 'minute', function(err, latencyLastHour) {
		  	  if (err) {
		  		return callback(err);
		  	  }
		  	  
		  	  serviceData.status.lastMonth = serviceData.status.lastMonth || {};
		  	  serviceData.status.lastMonth.latency = latencyLastMonth;
			  
		  	  // rest of the properties for lastWeek are populated in getGeneralServiceInfo
		  	  serviceData.status.lastWeek = serviceData.status.lastWeek || {};
		  	  serviceData.status.lastWeek.latency = latencyLastWeek;
		  
		  	  serviceData.status.lastHour = serviceData.status.lastHour || {};
		  	  serviceData.status.lastHour.outages = outagesLastHour;
		  	  serviceData.status.lastHour.latency = latencyLastHour;
		  	  serviceData.status.lastHour.uptime = uptimeInfoLastHour.uptime;
		  	  serviceData.status.lastHour.downtime = uptimeInfoLastHour.totalDownTime;
		  
		  	  // rest of the properties for last 24h are populated in getGeneralServiceInfo
		  	  serviceData.status.last24Hours.latency = latencyLast24Hours;
		  
		  	  serviceData.status.latestOutages = outagesLastMonth.slice(0, 10); // max 10
		  
		  	  debug('service loaded');
		  	  callback(err, serviceData);
		  	});
		    });
		  });
        });
      });
    });
  });
};

/**
 * Calculate uptime since a certain data based on a list of outages
 *
 * @param outages
 * @param currentOutage
 * @param since
 * @return {
 *    totalDownTime: <int> ms
 *    uptime: <int>
 * }
 */
function getUptime (service, outages, currentOutage, since) {

  var totalDownTime = 0;
  var now = +new Date();
  
  if (service.created > since){
    since = service.created;
  }
  
  if (outages.length) {
    outages.forEach(function(outage) {
      if (outage.timestamp >= since) {
        totalDownTime += outage.downtime;
      }
    });
  }

  if (currentOutage) {
    if (currentOutage.timestamp >= since) {
      totalDownTime += (now - currentOutage.timestamp);
    } else {
      totalDownTime += (now - since);
    }
  }



  var totalTime = now - since;
  var uptime = utils.round((totalTime - totalDownTime) * 100 / totalTime, 3);

  if (uptime < 0 || uptime > 100) {
    console.error('Invalid uptime:');
    console.error('totalTime:', totalTime);
    console.error('currentOutage:', currentOutage);
    console.error('uptime:', uptime);
    console.error('totalDownTime:', totalDownTime);
  }

  return {
    uptime: uptime,
    totalDownTime : totalDownTime
  };
}

function getGeneralServiceInfo(service, storage, callback) {

  storage.getCurrentOutage(service, function(err, currentOutage){
    if (err) {
      return callback(err);
    }

	var lastMonth = +new Date() - MONTH;
    var last24H = +new Date() - DAY;
    var lastWeek = +new Date() - WEEK;

    storage.getServiceOutagesSince(service, lastMonth, function(err, outagesLastMonth){
      if (err) {
        return callback(err);
      }
	  
      var uptimeInfoLastMonth = getUptime(service, outagesLastMonth, currentOutage, lastMonth);

      //var uptimeInfoLastWeek = getUptime(service, outagesLastMonth, currentOutage, lastWeek);
	  var outagesLastWeek = outagesLastMonth.filter(function(outage){
        return outage.timestamp >= lastWeek;
      });
      var uptimeInfoLastWeek = getUptime(service, outagesLastWeek, currentOutage, lastWeek);
	  
      var outagesLast24Hours = outagesLastMonth.filter(function(outage){
        return outage.timestamp >= last24H;
      });
      var uptimeInfoLast24Hours = getUptime(service, outagesLast24Hours, currentOutage, last24H);

      return callback(null, {
        service: service,
        status: {
          currentOutage: currentOutage,
          last24Hours: {
            outages: outagesLast24Hours,
            numberOutages: outagesLast24Hours.length,
            downtime: uptimeInfoLast24Hours.totalDownTime,
            uptime: uptimeInfoLast24Hours.uptime
          },
          lastWeek: {
            outages: outagesLastMonth,
            numberOutages: outagesLastMonth.length,
            downtime: uptimeInfoLastWeek.totalDownTime,
            uptime: uptimeInfoLastWeek.uptime
          },
          lastMonth: {
            outages: outagesLastMonth,
            numberOutages: outagesLastMonth.length,
            downtime: uptimeInfoLastMonth.totalDownTime,
            uptime: uptimeInfoLastMonth.uptime
          }
        }
      });
    });
  });
}
