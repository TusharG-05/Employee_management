from app.database import SessionLocal
from app.models import ChatMessage
from sqlalchemy import text

def debug_chat():
    db = SessionLocal()
    try:
        # Check table existence
        try:
            result = db.execute(text("SELECT to_regclass('public.\"office-echo\"')")).scalar()
            print(f"Table 'office-echo' exists: {result}")
        except Exception as e:
            print(f"Error checking table: {e}")

        # Test crud function directly
        from app import crud
        print("Testing crud.chat_history()...")
        history = crud.chat_history(db, limit=5)
        print(f"CRUD returned {len(history)} messages")
        for msg in history:
             print(f"CRUD Msg: {msg.message}")
            
    except Exception as e:
        print(f"Database error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_chat()
