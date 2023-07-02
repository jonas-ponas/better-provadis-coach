#!/bin/sh

USERNAME="dev@dev.local"
PASSWORD="secretPassword"

# run pocketbase 
/pb/pocketbase serve &

# Get its PID
PID=$!

sleep 1

# Crete Admin account
/pb/pocketbase admin create $USERNAME $PASSWORD

token=$(curl --location '127.0.0.1:8090/api/admins/auth-with-password' \
    --silent \
    --form "identity=\"$USERNAME\"" \
    --form "password=\"$PASSWORD\"" \
    | grep -E -o '\"token\":\s?\"(.*?)\"' \
    | cut -d : -f 2 \
    | cut -d "\"" -f 2)


if [ $token = ""]; then
    echo "token is empty"
    sleep 2
    kill $PID
    exit 1
fi

echo "Token: $token"

http_code=$(curl -s -o response.txt -w "%{http_code}" PUT 'localhost:8090/api/collections/import' \
    --header "\"Authorization: $token\"" \
    --header 'Content-Type: application/json' \
    --data '@/pb/schema.json')

echo $http_code

if [ $http_code = "204" ]; then 
    echo "init success"
    sleep 1
    kill $PID
    exit 0
else 
    echo "init failed: $http_code"
    sleep 1
    kill $PID
    exit 1
fi
