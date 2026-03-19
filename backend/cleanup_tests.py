import sqlite3

conn = sqlite3.connect('gennews.db')
cur = conn.cursor()

# Find test articles
cur.execute("""
    SELECT id, title, url FROM articles 
    WHERE title LIKE '%Test%' 
       OR title LIKE '%Diag%' 
       OR url LIKE '%example.com%' 
       OR url LIKE '%user-submission%'
""")
rows = cur.fetchall()
print(f"Found {len(rows)} test articles:")
for r in rows:
    print(f"  ID {r[0]}: {r[1]} ({r[2][:60]})")

# Delete them
cur.execute("""
    DELETE FROM articles 
    WHERE title LIKE '%Test%' 
       OR title LIKE '%Diag%' 
       OR url LIKE '%example.com%' 
       OR url LIKE '%user-submission%'
""")
conn.commit()
print(f"\nDeleted {cur.rowcount} test articles.")
conn.close()
