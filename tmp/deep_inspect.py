import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from models import Article

engine = create_engine("sqlite:///backend/gennews.db")

with Session(engine) as session:
    # Explicitly check ID 551 and 523 which the subagent saw
    for aid in [551, 523]:
        a = session.query(Article).filter(Article.id == aid).first()
        if a:
            print(f"--- Article {aid} ---")
            print(f"Status: {a.status}")
            print(f"Title: {a.title}")
            print(f"Original Text (first 500): {a.original_text[:500] if a.original_text else 'NONE'}")
            print(f"Cleaned Text (first 500): {a.cleaned_text[:500] if a.cleaned_text else 'NONE'}")
            print(f"LLM Analysis: {a.llm_analysis}")
            print(f"URL: {a.url}")
        else:
            print(f"Article {aid} NOT FOUND")
