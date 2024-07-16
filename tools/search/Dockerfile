FROM getmeili/meilisearch:latest

COPY meili_data/dumps/20240716-191250755.dump /meili_data/dumps/latest.dump

EXPOSE 7700
ENTRYPOINT ["tini", "--"]

# Load the dump and create the database while also initializing the keys.
RUN <<EOF
/bin/meilisearch --import-dump /meili_data/dumps/latest.dump --master-key="Fxxlzn-zi8ZPyasjgCidI6RrVaegNGVScNHaL-cF_Ug" &
until curl -X GET -H "Authorization: Bearer Fxxlzn-zi8ZPyasjgCidI6RrVaegNGVScNHaL-cF_Ug" -s -f -o /dev/null "http://127.0.0.1:7700/keys"
do
  sleep 1
done

# Kill the meilisearch instance.
kill -INT %1
EOF


FROM getmeili/meilisearch:latest

ENTRYPOINT ["tini", "--"]
COPY --from=0 /meili_data/data.ms /meili_data/data.ms
CMD     ["/bin/meilisearch", "--master-key=Fxxlzn-zi8ZPyasjgCidI6RrVaegNGVScNHaL-cF_Ug"]
