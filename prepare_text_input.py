import sys
import json

if __name__ == "__main__":
    # Read input text from command line argument
    input_text = sys.argv[1]

    # Print raw text as JSON
    print(json.dumps(input_text))
