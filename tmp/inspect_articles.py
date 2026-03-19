import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from models import Article

engine = create_engine("sqlite:///backend/gennews.db")

with Session(engine) as session:
    # Get last 5 processed articles
    articles = session.query(Article).filter(Article.status != 'raw').order_by(Article.processed_at.desc()).limit(5).all()
    
    for a in articles:
        print(f"ID: {a.id} | Status: {a.status}")
        print(f"Title: {a.title[:50]}...")
        print(f"Text Length: {len(a.original_text if a.original_text else '')}")
        print(f"Snippet?: {'[+' in a.original_text if a.original_text else False}")
        print(f"AI Analysis: {a.llm_analysis if a.llm_analysis else 'None'}")
        print(f"Cluster ID: {a.cluster_id}")
        print("-" * 30)

    total_with_text = session.query(Article).filter(Article.original_text.like('%[+ %')).count()
    print(f"Articles still with snippets: {total_with_text}")
