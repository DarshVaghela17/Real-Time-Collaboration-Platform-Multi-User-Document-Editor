#!/bin/bash

API="http://localhost:5000/api"

# Login
echo "1. Login..."
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  | jq -r '.data.token')

echo "Token: ${TOKEN:0:30}..."

# Create document
echo -e "\n2. Create document..."
DOC=$(curl -s -X POST "$API/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Doc","content":"Hello"}')

echo "$DOC" | jq .

DOC_ID=$(echo "$DOC" | jq -r '.data.document.id')

# Get all documents
echo -e "\n3. Get all documents..."
curl -s "$API/documents" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get single document
echo -e "\n4. Get single document..."
curl -s "$API/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Update document
echo -e "\n5. Update document..."
curl -s -X PUT "$API/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated","content":"New content"}' | jq .

# Delete document
echo -e "\n6. Delete document..."
curl -s -X DELETE "$API/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n✅ Done!"