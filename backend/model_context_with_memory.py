from typing import List, Optional, Dict, Any, Tuple
from pydantic import Field
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.callbacks.manager import CallbackManagerForLLMRun
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain_core.outputs import ChatGenerationChunk, ChatResult

class ContextAwareChatModel(BaseChatModel):
    """Model czatu świadomy kontekstu z pamięcią"""
    
    chat_model: BaseChatModel = Field(default_factory=lambda: ChatOpenAI())
    context: str = Field(default="")
    memory: ConversationBufferMemory = Field(
        default_factory=lambda: ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
    )
    
    def _prepare_messages(self, messages: List[BaseMessage]) -> List[BaseMessage]:
        """Przygotowanie wiadomości z kontekstem i historią."""
        prepared_messages = []
        
        # Dodaj kontekst systemowy
        if self.context:
            prepared_messages.append(SystemMessage(content=self.context))
            
        # Dodaj historię konwersacji
        chat_history = self.memory.chat_memory.messages
        prepared_messages.extend(chat_history)
        
        # Dodaj aktualne wiadomości
        prepared_messages.extend(messages)
        
        return prepared_messages

    def invoke(self, input: List[BaseMessage], **kwargs) -> BaseMessage:
        """Wywołanie modelu z obsługą kontekstu i pamięci."""
        prepared_messages = self._prepare_messages(input)
        
        # Generuj odpowiedź
        response = self.chat_model.invoke(prepared_messages, **kwargs)
        
        # Zapisz interakcję w pamięci
        if len(input) > 0:
            self.memory.chat_memory.add_message(input[-1])
            self.memory.chat_memory.add_message(response)
            
        return response

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Generowanie odpowiedzi z uwzględnieniem kontekstu i historii."""
        prepared_messages = self._prepare_messages(messages)
        return self.chat_model._generate(prepared_messages, stop=stop, run_manager=run_manager, **kwargs)

    @property
    def _llm_type(self) -> str:
        """Zwraca typ modelu."""
        return "context_aware_chat_model"

def main():
    # Przykład użycia
    context = """
    Jesteś ekspertem w dziedzinie kinematografii.
    Twoje odpowiedzi powinny zawierać odniesienia do technik filmowych, historii kina
    i praktycznych aspektów produkcji filmowej.
    """
    
    # Inicjalizacja modelu
    model = ContextAwareChatModel(
        chat_model=ChatOpenAI(temperature=0.7),
        context=context
    )
    
    # Przykładowa konwersacja
    questions = [
        "Jakie są podstawowe techniki oświetlenia w filmie?",
        "A co z techniką oświetlenia kontrowego?",
        "Jak to wpływa na nastrój sceny?"
    ]
    
    # Przeprowadź konwersację
    for question in questions:
        print(f"\nPytanie: {question}")
        response = model.invoke([HumanMessage(content=question)])
        print(f"Odpowiedź: {response.content}")
        
        # Pokaż aktualną historię konwersacji
        print("\nHistoria konwersacji:")
        for msg in model.memory.chat_memory.messages:
            role = "Użytkownik" if isinstance(msg, HumanMessage) else "Asystent"
            print(f"{role}: {msg.content[:100]}...")

if __name__ == "__main__":
    main() 