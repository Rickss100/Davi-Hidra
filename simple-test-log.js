// simple-test-log.js
import fs from 'fs';

const log = (msg) => {
    fs.appendFileSync('test-log.txt', msg + '\n');
};

log("Starting test...");
if (!globalThis.fetch) {
    log("Fetch is not defined globally!");
} else {
    log("Fetch is available.");
    fetch('http://localhost:3001/transactions')
        .then(res => res.json())
        .then(data => {
            log("GET Success: " + JSON.stringify(data));
            // Try POST
            return fetch('http://localhost:3001/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                     code: "LOG_TEST",
                     quantity: 5,
                     price: 10,
                     totalValue: 50,
                     type: "buy",
                     date: "2024-01-01",
                     category: "acoes"
                })
            });
        })
        .then(res => res.json())
        .then(data => log("POST Success: " + JSON.stringify(data)))
        .catch(err => log("Error: " + err.message));
}
