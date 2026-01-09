// simple-test.js
console.log("Starting test...");
if (!globalThis.fetch) {
    console.log("Fetch is not defined globally!");
} else {
    console.log("Fetch is available.");
}

fetch('http://localhost:3001/transactions')
    .then(res => res.json())
    .then(data => console.log("GET Success:", data))
    .catch(err => console.error("GET Error:", err));
