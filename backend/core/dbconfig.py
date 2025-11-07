from sqlalchemy import create_engine

def getDBconfig():
    conn_str = (
        "postgresql+psycopg2://postgres@localhost:5432/pcdb"
    )
    return create_engine(conn_str)
