from sqlalchemy import create_engine

def getDBconfig():
    conn_str = (
        "postgresql+psycopg2://localhost/mydatabase"
    )
    return create_engine(conn_str)
