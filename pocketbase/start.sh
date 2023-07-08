#!/bin/sh
USERNAME="service@docker.internal"
/pb/pocketbase admin update $USERNAME $SERVICE_ACCOUNT_PASSWORD
/pb/pocketbase serve --http=0.0.0.0:8090

