module.exports = function(app) {
  return {
    id: 'signalk-plugin-ocearo-ui',
    name: 'Ocearo UI: Ocean Robot Interface',
    description: 'Sailing made smarter with the Ocean Robot UI',

    start: function(options) {
      app.debug('Starting Ocearo UI Plugin...');
    },

    stop: function() {
      app.debug('Stopping Ocearo UI Plugin...');
    },

    schema: {
      title: "Ocearo UI Configuration",
      type: "object",
      properties: {
        enableFeature: {
          type: "boolean",
          title: "Enable Advanced Features",
          default: false
        }
      }
    },

    uiSchema: {
      enableFeature: {
        "ui:widget": "checkbox"
      }
    }
  };
};
