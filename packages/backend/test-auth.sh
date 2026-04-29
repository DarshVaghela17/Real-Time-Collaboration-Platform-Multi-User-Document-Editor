#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "🧪 Testing Authentication API"
echo "================================"

# Test 1: Register
echo -e "\n1️⃣ Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpass123"
  }')
echo "$REGISTER_RESPONSE" | jq .

# Extract token from registration
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')
echo "Token: ${TOKEN:0:20}..."

# Test 2: Login
echo -e "\n2️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }')
echo "$LOGIN_RESPONSE" | jq .

# Update token from login
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

# Test 3: Get Current User (Protected)
echo -e "\n3️⃣ Testing Protected Route (GET /me)..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 4: Wrong Password
echo -e "\n4️⃣ Testing Login with Wrong Password..."
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }' | jq .

# Test 5: No Token
echo -e "\n5️⃣ Testing Protected Route without Token..."
curl -s -X GET "$BASE_URL/auth/me" | jq .

# Test 6: Invalid Token
echo -e "\n6️⃣ Testing Protected Route with Invalid Token..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer invalid.token.here" | jq .

echo -e "\n✅ Tests completed!"