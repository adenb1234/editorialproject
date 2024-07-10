import json
import requests
import subprocess

# Load the editorials from the JSON file
with open('/home/ubuntu/editorials.json', 'r') as file:
    editorials = json.load(file)

# Pinecone configuration
api_key = 'e638a72d-1285-46e8-83d1-dcd7e1caee10'
index_name = 'serverless-index'
pinecone_url = f'https://serverless-index-c1fd68l.svc.aped-4627-b74a.pinecone.io/vectors/upsert'

# Function to convert text to vector using the text_to_vector.py script
def text_to_vector(text):
    result = subprocess.run(['python3', '/home/ubuntu/editorial-search-app/backend/text_to_vector.py', text], capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Error converting text to vector: {result.stderr}")
    return json.loads(result.stdout)

# Index each editorial in Pinecone
for editorial in editorials:
    try:
        text = editorial['full_text']
        title = editorial['title']
        url = editorial['url']
        snippet = text[:200]  # Extract the first 200 characters as a snippet

        # Convert the text to a vector
        vector = text_to_vector(text)

        # Create the metadata object
        metadata = {
            'title': title,
            'url': url,
            'snippet': snippet,
            'full_text': text  # Include the full text in the metadata
        }

        # Log the metadata to verify snippet extraction
        print(f"Metadata for {title}: {metadata}")

        # Prepare the data for Pinecone
        data = {
            'vectors': [
                {
                    'id': url,  # Use the URL as a unique identifier
                    'values': vector,
                    'metadata': metadata
                }
            ]
        }

        # Send the data to Pinecone
        response = requests.post(pinecone_url, headers={'Api-Key': api_key, 'Content-Type': 'application/json'}, json=data)
        response.raise_for_status()
        print(f"Indexed editorial: {title}")

    except KeyError as e:
        print(f"Missing key {e} in editorial: {editorial}")
    except Exception as e:
        print(f"Failed to index editorial. Error: {e}")
