// test-api.js
import { api } from './src/services/api.js';

const run = async () => {
    try {
        console.log('Testing GET...');
        const initial = await api.get('/transactions');
        console.log('GET Result:', initial);

        console.log('Testing POST...');
        const newTx = await api.post('/transactions', {
            code: 'TEST_NODE',
            quantity: 10,
            price: 50,
            totalValue: 500,
            type: 'buy',
            date: '2024-01-01',
            category: 'acoes'
        });
        console.log('POST Result:', newTx);

        console.log('Testing GET again...');
        const final = await api.get('/transactions');
        console.log('GET Result:', final);

    } catch (error) {
        console.error('Test Failed:', error);
    }
};

run();
