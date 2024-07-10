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
const apiKey = process.env.PINECONE_API_KEY;
const pineconeUrl = process.env.PINECONE_ENDPOINT;

// Endpoint to handle search requests
app.post('/search', (req, res) => {
    const { query } = req.body;

    // Prepare the search query using the prepare_text_input.py script
    exec(`python3 /home/ubuntu/editorial-search-app/prepare_text_input.py "${query}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error preparing text input: ${stderr}`);
            return res.status(500).json({ error: 'Error preparing text input' });
        }

        console.log('Text input preparation output:', stdout);
        const textInput = JSON.parse(stdout);

        // Prepare the data for Pinecone query
        const data = {
            model: 'multilingual-e5-large',
            inputs: [textInput],
            parameters: {
                input_type: 'passage',
                truncate: 'END'
            }
        };

        console.log('Data prepared for Pinecone query:', data);

        // Send the query request to Pinecone
        axios.post(`${pineconeUrl}/embed`, data, {
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            // Log the entire response for debugging
            console.log('Pinecone response:', response);

            // Check if response.data.data is defined and is an array
            if (Array.isArray(response.data.data)) {
                // Transform the Pinecone response to match the expected structure
                const transformedResults = response.data.data.map(result => ({
                    title: result.metadata.title || 'Title not available',
                    url: result.metadata.url || '#',
                    snippet: result.metadata.snippet || 'Snippet not available'
                }));

                res.json({ results: transformedResults });
            } else {
                console.error('Unexpected search results structure');
                console.error('Full Pinecone response:', response.data);
                res.status(500).json({ error: 'Unexpected search results structure' });
            }
        })
        .catch(error => {
            console.error(`Error querying Pinecone: ${error}`);
            console.error('Full Pinecone error response:', error.response ? error.response.data : 'No response data');
            res.status(500).json({ error: 'Error querying Pinecone' });
        });
    });
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
