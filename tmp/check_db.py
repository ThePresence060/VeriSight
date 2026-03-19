from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session
from models import Article, StoryCluster

engine = create_engine("sqlite:///backend/gennews.db")

with Session(engine) as session:
    total = session.query(func.count(Article.id)).scalar()
    statuses = session.query(Article.status, func.count(Article.id)).group_by(Article.status).all()
    clusters = session.query(func.count(StoryCluster.id)).scalar()
    
    print(f"Total Articles: {total}")
    print(f"Statuses: {statuses}")
    print(f"Total Clusters: {clusters}")
    
    # Check if any have llm_analysis
    with_analysis = session.query(func.count(Article.id)).filter(Article.llm_analysis != None).scalar()
    print(f"Articles with AI Analysis: {with_analysis}")
