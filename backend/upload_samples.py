import requests

files_to_upload = [
    'sample_data/email_thread.txt',
    'sample_data/meeting_notes.txt'
]

for filepath in files_to_upload:
    filename = filepath.split('/')[-1]
    with open(filepath, 'rb') as f:
        r = requests.post(
            'http://localhost:5000/upload',
            files={'file': (filename, f, 'text/plain')}
        )
    data = r.json()
    msg = data.get('message', data.get('error', 'Unknown'))
    decisions = data.get('decisions_found', 0)
    chunks = data.get('chunks_created', 0)
    print(f"{filename}: {msg} | decisions: {decisions}, chunks: {chunks}")
