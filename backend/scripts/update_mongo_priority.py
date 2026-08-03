import pymongo

def update_priorities():
    client = pymongo.MongoClient('mongodb://localhost:27017')
    db = client['bimba_ai']
    
    # Set Groq priority to 1
    db.ai_providers.update_one({'slug': 'groq'}, {'$set': {'priority': 1, 'is_enabled': True}})
    # Set Gemini priority to 2
    db.ai_providers.update_one({'slug': 'gemini'}, {'$set': {'priority': 2}})
    # Set OpenRouter priority to 3
    db.ai_providers.update_one({'slug': 'openrouter'}, {'$set': {'priority': 3}})
    
    providers = list(db.ai_providers.find({}, {'_id': 0, 'provider_name': 1, 'slug': 1, 'priority': 1, 'is_enabled': 1}).sort('priority', 1))
    print("UPDATED MONGODB PROVIDERS:")
    for p in providers:
        print(p)

if __name__ == '__main__':
    update_priorities()
