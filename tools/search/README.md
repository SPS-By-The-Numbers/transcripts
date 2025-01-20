# Meilisearch image build

This creates a dockerimage that has a Meilisearch instance
containing the full-text search database for all transcriptions.

The Dockerfile builds the Meilisearch instance loading a data dump.
This separate the production image from the build image and allows
using different authorizations keys for build vs produciton.

setup.mts initializes an empty Meilisearch search instance with
the proper index configurations (primary keys, searchable keys, etc)

`recreate_index.mts` loads all the current transcripts into the target
instances. It is the build step.

After that, you want to to do a `curl -X POST 'http://localhost:7700/dumps`
to product a dump that is then referenced by Dockerfile to build the final
production image.

To run the build instance of meilisearch, use "docker compose up" for the
docker-compose.yml file. This will start up a meilisearch instance on
localhost with the oh secure key of "masterKey" that can be used to 
create the database above.

The full run on reindexing all transcrtips over home internet is about 1 minute
covering over 2139 videos most being a couple hours of transcripts. Given
how fast this is, there is no need for an incremental index setup.
