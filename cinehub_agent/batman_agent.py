import os
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langfuse.callback import CallbackHandler
from typing_extensions import TypedDict

# Konfiguracja kluczy API
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-3e0c69ef-c854-4507-8768-deb684462d7b"
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-55a6fa27-fa82-4b54-886c-74c3d83dcaf4"
os.environ["LANGFUSE_HOST"] = "https://cloud.langfuse.com"
os.environ["OPENAI_API_KEY"] = "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"

# Definicja stanu emaila
class EmailState(TypedDict):
    email: Dict[str, Any]
    is_spam: Optional[bool]
    spam_reason: Optional[str]
    email_category: Optional[str]
    draft_response: Optional[str]
    messages: List[Dict[str, Any]]

# Inicjalizacja modelu
model = ChatOpenAI(model="gpt-4", temperature=0)

# Definicja węzłów
def read_email(state: EmailState):
    email = state["email"]
    print(f"Alfred przetwarza email od {email['sender']} z tematem: {email['subject']}")
    return {}

def classify_email(state: EmailState):
    email = state["email"]
    
    prompt = f"""
Jako Alfred, kamerdyner Pana Wayne'a i jego TAJNEJ tożsamości Batmana, przeanalizuj ten email i określ, czy jest to spam, czy też wiadomość wymagająca uwagi Pana Wayne'a.

Email:
Od: {email['sender']}
Temat: {email['subject']}
Treść: {email['body']}

Najpierw określ, czy ten email jest spamem.
Odpowiedz SPAM lub HAM jeśli jest to prawdziwa wiadomość. Zwróć tylko odpowiedź.
Odpowiedź:
    """
    messages = [HumanMessage(content=prompt)]
    response = model.invoke(messages)
    
    response_text = response.content.lower()
    is_spam = "spam" in response_text and "ham" not in response_text
    
    if not is_spam:
        new_messages = state.get("messages", []) + [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": response.content}
        ]
    else:
        new_messages = state.get("messages", [])
    
    return {
        "is_spam": is_spam,
        "messages": new_messages
    }

def handle_spam(state: EmailState):
    print(f"Alfred oznaczył email jako spam.")
    print("Email został przeniesiony do folderu spam.")
    return {}

def drafting_response(state: EmailState):
    email = state["email"]
    
    prompt = f"""
Jako Alfred, kamerdyner, przygotuj uprzejmą wstępną odpowiedź na ten email.

Email:
Od: {email['sender']}
Temat: {email['subject']}
Treść: {email['body']}

Przygotuj krótką, profesjonalną odpowiedź, którą Pan Wayne może przejrzeć i spersonalizować przed wysłaniem.
    """
    
    messages = [HumanMessage(content=prompt)]
    response = model.invoke(messages)
    
    new_messages = state.get("messages", []) + [
        {"role": "user", "content": prompt},
        {"role": "assistant", "content": response.content}
    ]
    
    return {
        "draft_response": response.content,
        "messages": new_messages
    }

def notify_mr_wayne(state: EmailState):
    email = state["email"]
    
    print("\n" + "="*50)
    print(f"Proszę Pana, otrzymał Pan email od {email['sender']}.")
    print(f"Temat: {email['subject']}")
    print("\nPrzygotowałem projekt odpowiedzi do przejrzenia:")
    print("-"*50)
    print(state["draft_response"])
    print("="*50 + "\n")
    
    return {}

# Logika routingu
def route_email(state: EmailState) -> str:
    if state["is_spam"]:
        return "spam"
    else:
        return "legitimate"

# Tworzenie grafu
email_graph = StateGraph(EmailState)

# Dodawanie węzłów
email_graph.add_node("read_email", read_email)
email_graph.add_node("classify_email", classify_email)
email_graph.add_node("handle_spam", handle_spam)
email_graph.add_node("drafting_response", drafting_response)
email_graph.add_node("notify_mr_wayne", notify_mr_wayne)

# Dodawanie krawędzi
email_graph.add_edge(START, "read_email")
email_graph.add_edge("read_email", "classify_email")

# Dodawanie krawędzi warunkowych
email_graph.add_conditional_edges(
    "classify_email",
    route_email,
    {
        "spam": "handle_spam",
        "legitimate": "drafting_response"
    }
)

# Dodawanie końcowych krawędzi
email_graph.add_edge("handle_spam", END)
email_graph.add_edge("drafting_response", "notify_mr_wayne")
email_graph.add_edge("notify_mr_wayne", END)

# Kompilacja grafu
compiled_graph = email_graph.compile()

# Przykładowe emaile do testów
legitimate_email = {
    "sender": "Joker",
    "subject": "Znalazłem cię Batman!",
    "body": "Panie Wayne, odkryłem twoją tajną tożsamość! Wiem, że jesteś Batmanem! Nie ma co zaprzeczać, mam na to dowody i niedługo cię znajdę. Zemszczę się. JOKER"
}

spam_email = {
    "sender": "Crypto bro",
    "subject": "Najlepsza inwestycja 2025 roku",
    "body": "Panie Wayne, właśnie wypuściłem nową kryptowalutę i chcę, żeby Pan w nią zainwestował!"
}

def main():
    # Inicjalizacja handlera Langfuse dla Langchain (śledzenie)
    langfuse_handler = CallbackHandler()
    
    # Przetwarzanie prawdziwego emaila
    print("\nPrzetwarzanie prawdziwego emaila...")
    legitimate_result = compiled_graph.invoke(
        input={
            "email": legitimate_email,
            "is_spam": None,
            "draft_response": None,
            "messages": []
        },
        config={"callbacks": [langfuse_handler]}
    )
    
    # Przetwarzanie spamu
    print("\nPrzetwarzanie spamu...")
    spam_result = compiled_graph.invoke(
        input={
            "email": spam_email,
            "is_spam": None,
            "draft_response": None,
            "messages": []
        },
        config={"callbacks": [langfuse_handler]}
    )

if __name__ == "__main__":
    main() 