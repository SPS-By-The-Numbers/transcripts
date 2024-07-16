FROM getmeili/meilisearch:latest

COPY meili_data/dumps/20240715-065459316.dump /meili_data/dumps/latest.dump

EXPOSE 7700
ENTRYPOINT ["tini", "--"]
CMD     ["/bin/meilisearch", "--import-dump", "/meili_data/dumps/latest.dump", "--master-key=Fxxlzn-zi8ZPyasjgCidI6RrVaegNGVScNHaL-cF_Ug"]
