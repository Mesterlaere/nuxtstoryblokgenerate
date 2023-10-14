#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "Develop" || "$VERCEL_GIT_COMMIT_REF" == "Staging" || "$VERCEL_GIT_COMMIT_REF" == "Production"  || "$VERCEL_GIT_COMMIT_REF" == preview*  ]] ; then
  # Proceed with the build
	echo "✅ - Build can proceed"
  echo "ENVIRONMENT: $ENVIRONMENT"
  echo "If ENVIRONMENT was empty (probably because it's a preview branch), we default to 'staging' in the code"
  exit 1;

else
  # Don't build
  echo "🛑 - Build was cancelled, because branch is not develop, staging or production"
  exit 0;
fi
