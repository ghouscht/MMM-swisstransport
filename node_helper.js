const NodeHelper = require("node_helper");
const request = require('request');
const moment = require('moment');

module.exports = NodeHelper.create({
  start: function() {},

  socketNotificationReceived: function(notification, payload) {
    const self = this;

    if (notification == "GetDepartures") {
      var promises = [];

      payload.stations.forEach(station => {
        const requestURL = `${payload.apiBase}?id=${station.id}&limit=${station.limit}`

        console.log(`${self.name} GET ${requestURL}`)

        promises.push(new Promise((resolve, reject) => {
          request(requestURL, {json: true}, (err, resp, body) => {            
            if (err) {
              reject(err);
            }

            resolve(body);
          });
        }));
      });

      Promise.all(promises).then(results => {
        var trains = [];
        results.forEach(result => {
          result.stationboard.forEach(departure => {
            trains.push({
              departureTimestampRaw: departure.stop.departureTimestamp * 1000,
              departureTimestamp: moment(departure.stop.departureTimestamp * 1000).format("HH:mm"),
              delay: departure.delay || 0,
              name: departure.name,
              to: departure.to,
              from: departure.stop.station.name,
              number: departure.number,
              category: departure.category
            });
          });
        });

        self.sendSocketNotification('DepartureData', trains);
      });
    }
  },
})