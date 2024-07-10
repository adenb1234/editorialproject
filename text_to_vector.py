import sys
import json
from transformers import BertTokenizer, BertModel
import torch

def text_to_vector(text):
    # Load pre-trained BERT model and tokenizer
    tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
    model = BertModel.from_pretrained('bert-base-uncased')

    # Tokenize input text
    inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)

    # Generate embeddings
    with torch.no_grad():
        outputs = model(**inputs)
        embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().tolist()

    # Ensure the embeddings have the correct dimensionality of 768
    if len(embeddings) != 768:
        raise ValueError(f"Vector dimension mismatch: expected 768, got {len(embeddings)}")

    return embeddings

if __name__ == "__main__":
    # Read input text from command line argument
    input_text = sys.argv[1]

    # Convert text to vector
    vector = text_to_vector(input_text)

    # Print vector as JSON
    print(json.dumps(vector))
