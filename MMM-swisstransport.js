/* Timetable for Trains Module */

/* Magic Mirror
 * Module: SwissTransport
 *
 * By Sebastian Plattner
 * based on https://github.com/Bangee44/MMM-swisstransport from Benjamin Angst http://www.beny.ch
 * MIT Licensed.
 */

Module.register("MMM-swisstransport", {
  // Define module defaults
  defaults: {
    departures: [],
    loaded: false,
    updateInterval: 2 * 60 * 1000, // 2m
    fade: true,
    fadePoint: 0.25, // Start on 1/4th of the list.
    apiBase: 'http://transport.opendata.ch/v1/stationboard',
    stations: [
      {
        id: "8590056", // Liebefeld, Neuhausplatz
        limit: 8,
      },
      {
        id: "8507083", // Köniz
        limit: 2,
      },
    ],
    minWalkingTime: 5,
  },

  // Define required scripts.
  getStyles: function() {
    return ["swisstransport.css", "font-awesome.css"];
  },

  // Define required scripts.
  getScripts: function() {
    return ["moment.js"];
  },

  start: function() {
    var self = this;

    Log.info(`Starting module: ${this.name}`);

    // Set locale.
    moment.locale(config.language);

    var payload = {
      apiBase: this.config.apiBase,
      stations: this.config.stations,
    };

    self.sendSocketNotification("GetDepartures", payload);

    setInterval(function() {
      self.sendSocketNotification("GetDepartures", payload);
    }, self.config.updateInterval); 
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "DepartureData") {
      // Log.log(`${this.name} got departure data ${JSON.stringify(payload)}`)

      payload.sort((a,b) => {
        if (a.departureTimestampRaw < b.departureTimestampRaw) return -1;
        if (a.departureTimestampRaw > b.departureTimestampRaw) return 1;
        return 0;
      })

      this.departures = payload;
      this.loaded = true;

      this.updateDom();
    }
  },

  getDom: function() {
    var wrapper = document.createElement("div");

    var currentTime = moment();

    if (!this.loaded) {
      wrapper.innerHTML = "Lade Verbindungen...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    var table = document.createElement("table");
    table.className = "small";

    for (var d in this.departures) {
      var departure = this.departures[d];

      var row = document.createElement("tr");
      table.appendChild(row);

      var trainNumberCell = document.createElement("td");
      switch (departure.category) {
        case "NFB":
        case "B":
          trainNumberCell.innerHTML = "<i class=\"fa fa-bus\"></i> " + departure.number;
          break;
        default:
          trainNumberCell.innerHTML = "<i class=\"fa fa-train\"></i> " + departure.number;
      }

      trainNumberCell.className = "align-left";
      row.appendChild(trainNumberCell);

      // To
      var trainToCell = document.createElement("td");
      trainToCell.innerHTML = departure.to;
      trainToCell.className = "align-left trainto";
      row.appendChild(trainToCell);

      // Time + delay
      var dTime = moment(departure.departureTimestampRaw);
      var diff = dTime.diff(currentTime, 'minutes');

      var depCell = document.createElement("td");
      depCell.className = "align-left departuretime";
      depCell.innerHTML = departure.departureTimestamp;

      if (diff <= this.config.minWalkingTime) {
        row.className = "red";
      }

      row.appendChild(depCell);

      if (departure.delay > 0) {
        var delayCell = document.createElement("td");
        delayCell.className = "delay red";
        delayCell.innerHTML = "+" + departure.delay + " min";
        row.appendChild(delayCell);
      } 

      if (this.config.fade && this.config.fadePoint < 1) {
        if (this.config.fadePoint < 0) {
          this.config.fadePoint = 0;
        }
        var startingPoint = this.departures.length * this.config.fadePoint;
        var steps = this.departures.length - startingPoint;
        if (d >= startingPoint) {
          var currentStep = d - startingPoint;
          row.style.opacity = 1 - (1 / steps * currentStep);
        }
      }

    }

    return table;
  },
});
