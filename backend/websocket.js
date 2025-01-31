const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ noServer: true });

wss.broadcast = function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

module.exports = wss;