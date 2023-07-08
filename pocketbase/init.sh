#!/bin/sh

HOST="127.0.0.1"
PORT="8090"
USERNAME="service@docker.internal"
PASSWORD="12345678"

# run pocketbase 
/pb/pocketbase serve &


# Get its PID
PID=$!

sleep 1


# Create Init-Admin
/pb/pocketbase admin create $USERNAME $PASSWORD

# Get Init-Admin Token
token=$(
    curl --location "http://$HOST:$PORT/api/admins/auth-with-password" \
    --silent \
    --form "identity=\"$USERNAME\"" \
    --form "password=\"$PASSWORD\"" \
    | grep -E -o '\"token\":\s?\"(.*?)\"' \
    | cut -d : -f 2 \
    | cut -d "\"" -f 2
)

echo "Token: $token"

if [ $token == ""]; then
    echo "FAIL: token is empty"
    sleep 2
    kill $PID
    exit 1
fi

echo "Token: $token"

schema=$(cat /pb/schema.json | sed 's/\r\n//g')

http_code=$(
    curl -XPUT --location "http://$HOST:$PORT/api/collections/import" \
    -H "Authorization: $token" \
    -H "Content-Type: application/json" \
    -d "{\"collections\": $schema}" \
    -w "%{http_code}" \
)

if [[ $http_code == "204" ]]; then 
    echo "Successfuly imported collections"
    # Remove Init-Admin
    /pb/pocketbase admin delete $USERNAME
    kill $PID
    exit 0
else 
    echo "FAIL: Failed collection-import with code: $http_code"
    kill $PID
    exit 1
fi
