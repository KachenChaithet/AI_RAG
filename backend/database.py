from psycopg2 import pool
from psycopg2.extensions import connection
from pgvector.psycopg2 import register_vector
import os
from dotenv import load_dotenv

load_dotenv()

db_pool = pool.SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    database=os.getenv("DB_DATABASE"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
)


def get_conn() -> connection:
    conn = db_pool.getconn()
    register_vector(conn)
    return conn


def release_conn(conn):
    return db_pool.putconn(conn)
