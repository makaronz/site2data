from langfuse import Langfuse
import openai

# Konfiguracja Langfuse
langfuse = Langfuse(
    secret_key="sk-lf-55a6fa27-fa82-4b54-886c-74c3d83dcaf4",
    public_key="pk-lf-3e0c69ef-c854-4507-8768-deb684462d7b",
    host="https://cloud.langfuse.com"
)

# Konfiguracja OpenAI
client = openai.OpenAI(
    api_key="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"
)

def story():
    trace = langfuse.trace(name="story_generation")
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a great storyteller."},
            {"role": "user", "content": "Once upon a time in a galaxy far, far away..."}
        ],
    )
    return response.choices[0].message.content

def main():
    return story()

if __name__ == "__main__":
    print(main()) 