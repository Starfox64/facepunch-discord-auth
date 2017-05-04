#!/usr/bin/env bash

PACKAGE=`cat package.json`
REGEX='"version":\s+"([0-9\.]+)"'

if [[ $PACKAGE =~ $REGEX ]]
then
		VERSION="${BASH_REMATCH[1]}"
else
		echo "Failed to match version."
		exit 1
fi

echo "Building Facepunch Auth Bot v${VERSION}"

docker build -t starfox64/facepunch-discord-auth:latest -t starfox64/facepunch-discord-auth:${VERSION} . && docker push starfox64/facepunch-discord-auth:${VERSION} && starfox64/facepunch-discord-auth:latest
