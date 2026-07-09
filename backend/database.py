import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Ensure uploads directory exists
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        full_name TEXT NOT NULL,
        institution TEXT NOT NULL,
        country TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create Scans Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        prediction TEXT NOT NULL,
        confidence REAL NOT NULL,
        risk_level TEXT NOT NULL,
        inference_time REAL NOT NULL,
        model_version TEXT NOT NULL,
        dataset TEXT NOT NULL,
        original_image_path TEXT NOT NULL,
        gradcam_image_path TEXT NOT NULL,
        probabilities TEXT NOT NULL, -- JSON string
        notes TEXT,
        doctor_comments TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    
    # Create Sessions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()

# DATABASE ACTIONS: USERS
def create_user(email, password_hash, salt, full_name, institution, country, role):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO users (email, password_hash, salt, full_name, institution, country, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (email, password_hash, salt, full_name, institution, country, role))
        conn.commit()
        user_id = cursor.lastrowid
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_email(email):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# DATABASE ACTIONS: SESSIONS
def create_session(token, user_id, expires_at):
    conn = get_db()
    cursor = conn.cursor()
    # Invalidate existing sessions for user to maintain clean states
    cursor.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
    cursor.execute("""
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, ?)
    """, (token, user_id, expires_at.isoformat()))
    conn.commit()
    conn.close()

def get_session(token):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions WHERE token = ?", (token,))
    row = cursor.fetchone()
    conn.close()
    if row:
        expires_at = datetime.fromisoformat(row["expires_at"])
        if expires_at > datetime.now():
            return dict(row)
        else:
            # Session expired, delete it
            delete_session(token)
    return None

def delete_session(token):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# DATABASE ACTIONS: SCANS
def create_scan(user_id, date, prediction, confidence, risk_level, inference_time, model_version, dataset, original_image_path, gradcam_image_path, probabilities, notes="", doctor_comments=""):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO scans (user_id, date, prediction, confidence, risk_level, inference_time, model_version, dataset, original_image_path, gradcam_image_path, probabilities, notes, doctor_comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, date, prediction, confidence, risk_level, inference_time, model_version, dataset, original_image_path, gradcam_image_path, json.dumps(probabilities), notes, doctor_comments))
    conn.commit()
    scan_id = cursor.lastrowid
    conn.close()
    return scan_id

def get_scans_by_user(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scans WHERE user_id = ? ORDER BY id DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_scan_by_id(scan_id, user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scans WHERE id = ? AND user_id = ?", (scan_id, user_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_scan(scan_id, user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scans WHERE id = ? AND user_id = ?", (scan_id, user_id))
    conn.commit()
    conn.close()

# Initialize tables
init_db()
