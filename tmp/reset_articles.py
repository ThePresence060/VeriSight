import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from sqlalchemy import create_engine, update
from sqlalchemy.orm import Session
from models import Article

engine = create_engine("sqlite:///backend/gennews.db")

with Session(engine) as session:
    # Reset articles that were "deferred" or have NewsAPI snippets
    count = session.query(Article).filter(
        (Article.llm_analysis.like('%deferred%')) | 
        (Article.original_text.like('%[+ %'))
    ).update({Article.status: 'raw', Article.cleaned_text: None, Article.llm_analysis: None}, synchronize_session=False)
    
    session.commit()
    print(f"Reset {count} articles to 'raw' for re-processing.")
