const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const axios = require('axios');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

// Pinecone configuration
const apiKey = 'e638a72d-1285-46e8-83d1-dcd7e1caee10';
const indexName = 'serverless-index';
const pineconeUrl = `https://serverless-index-c1fd68l.svc.aped-4627-b74a.pinecone.io/vectors/query`;

// Endpoint to handle search requests
app.post('/search', (req, res) => {
    const { query } = req.body;

    // Convert the search query to a vector using the text_to_vector.py script
    exec(`python3 /home/ubuntu/editorial-search-app/backend/text_to_vector.py "${query}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error converting text to vector: ${stderr}`);
            return res.status(500).json({ error: 'Error converting text to vector' });
        }

        const vector = JSON.parse(stdout);

        // Prepare the data for Pinecone search
        const data = {
            vector: vector,
            topK: 10,
            includeMetadata: true
        };

        // Send the search request to Pinecone
        axios.post(pineconeUrl, data, {
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            // Check if response.data.results is defined and is an array
            if (Array.isArray(response.data.results)) {
                // Transform the Pinecone response to match the expected structure
                const transformedResults = response.data.results.map(result => ({
                    title: result.metadata.title || 'Title not available',
                    url: result.metadata.url || '#',
                    snippet: result.metadata.snippet || 'Snippet not available'
                }));

                res.json({ results: transformedResults });
            } else {
                console.error('Unexpected search results structure');
                res.status(500).json({ error: 'Unexpected search results structure' });
            }
        })
        .catch(error => {
            console.error(`Error querying Pinecone: ${error}`);
            res.status(500).json({ error: 'Error querying Pinecone' });
        });
    });
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
