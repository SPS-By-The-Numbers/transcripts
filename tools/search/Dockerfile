FROM node:lts

#COPY /meili_data/dumps/20250120-081408619.dump /meili_data/dumps/latest.dump

WORKDIR /meili_data

RUN <<EOF
curl -L https://install.meilisearch.com | sh
EOF

# Only copy a few files since "npm install" is slow
COPY package.json tsconfig.json /meili_data
RUN npm install

COPY tools/search common config utilities /meili_data

EXPOSE 7700
ENTRYPOINT ["tini", "--"]

# Load the dump and create the database while also initializing the keys.
RUN <<EOF

# The key must be at least 16-bytes-long.
# https://www.meilisearch.com/docs/learn/security/basic_security#creating-the-master-key-in-a-self-hosted-instance
master_key=masterKey-92d071d1-2f8c-4304-b646-5397f606db5c

./meilisearch "--master-key=$master_key" &
SEARCH_PROCESS=$!

# Wait until keys return with the master key.
until curl -X -f -o /dev/null "http://127.0.0.1:7700/health"
do
  sleep 1
done

# Register the key UID. The same (Master Key, UID) pair will generate the same key.
until curl -X POST -H "Content-Type: application/json" --data-binary '{"name":"Transcript Front Search", "description":"Transcript Frontend Search Access", "uid": "fa82128d-a898-42ca-86eb-0e056195a111", "actions": ["search"], "indexes":["*"], "expiresAt": null}' -H "Authorization: Bearer $master_key" -s -f -o /dev/null "http://127.0.0.1:7700/keys"
do
  sleep 1
done

npx tpx tools/search/setup.mts

# Kill the meilisearch instance.
kill -INT ${SEARCH_PROCESS}
EOF


FROM getmeili/meilisearch:latest

ENTRYPOINT ["tini", "--"]
COPY --from=0 /meili_data/data.ms /meili_data/data.ms
CMD ["/bin/meilisearch", "--master-key=$master_key"]
