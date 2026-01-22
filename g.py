from openai import OpenAI

client = OpenAI(
  base_url="http://localhost:7860/api/v1/",
  default_headers={"x-api-key": "sk-lI-gW8VJADHUDyq-2zLbJx62k7pYDCjFjGWwcsrTNFE"},
  api_key="dummy-api-key" # Required by OpenAI SDK but not used by Langflow
)

response = client.responses.create(
  model="51f00bb1-29d3-4483-b99e-5e9e5251e298",
  input="สวัสดี",
  stream=True
)

for i in response:
    if i.delta:
        print(i.delta["content"])
