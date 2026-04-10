import os
import certifi
from pymongo import MongoClient

# Global singleton client
_client = None

def get_db():
    """
    Returns the MongoDB 'orgmemory' database object instance.
    Utilizes a global cached client connection pool.
    """
    global _client
    if _client is None:
        mongo_uri = os.environ.get('MONGO_URI')
        if not mongo_uri:
            raise RuntimeError("MONGO_URI environment variable is not defined.")
            
        # Using certifi + allowing invalid certs to bypass aggressive University firewalls (SSL Inspection)
        _client = MongoClient(
            mongo_uri, 
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=5000
        )
        
    return _client.get_database("orgmemory")
