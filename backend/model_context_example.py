from typing import List, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.callbacks.manager import CallbackManagerForLLMRun
from langchain_openai import ChatOpenAI

class CustomContextChatModel(BaseChatModel):
    """Niestandardowy model czatu z kontekstem"""
    
    chat_model: BaseChatModel
    context: str
    
    def __init__(self, chat_model: Optional[BaseChatModel] = None, context: str = ""):
        """Inicjalizacja z opcjonalnym modelem i kontekstem."""
        super().__init__()
        self.chat_model = chat_model or ChatOpenAI()
        self.context = context

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs,
    ) -> str:
        """Generowanie odpowiedzi z uwzględnieniem kontekstu."""
        if self.context:
            # Dodaj kontekst jako pierwszą wiadomość
            context_message = HumanMessage(content=f"Context: {self.context}")
            messages = [context_message] + messages
        
        return self.chat_model._generate(messages, stop=stop, run_manager=run_manager, **kwargs)

    @property
    def _llm_type(self) -> str:
        """Zwraca typ modelu."""
        return "custom_context_chat_model"

def main():
    # Przykład użycia
    context = """
    Jesteś asystentem specjalizującym się w tematyce filmowej.
    Zawsze odpowiadasz w kontekście kinematografii i produkcji filmowej.
    """
    
    # Inicjalizacja modelu z kontekstem
    model = CustomContextChatModel(
        chat_model=ChatOpenAI(temperature=0.7),
        context=context
    )
    
    # Przykładowa konwersacja
    messages = [
        HumanMessage(content="Co sądzisz o oświetleniu?")
    ]
    
    # Generowanie odpowiedzi
    response = model.invoke(messages)
    print("Odpowiedź modelu:")
    print(response.content)

if __name__ == "__main__":
    main() 