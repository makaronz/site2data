from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAI

def test_langchain():
    # Initialize the LLM
    llm = OpenAI()
    
    # Create a prompt template
    template = "What is a good name for a company that makes {product}?"
    prompt = PromptTemplate(
        input_variables=["product"],
        template=template,
    )
    
    # Create the chain
    chain = LLMChain(llm=llm, prompt=prompt)
    
    # Run the chain
    print(chain.run("eco-friendly water bottles")) 