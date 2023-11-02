#!/usr/bin/python

import glob
import json
import subprocess

shard = [[],[],[]]


with open('to_transcribe', "r") as f:
    for idx, line in enumerate(f.readlines()):
        shard[idx % len(shard)].append(line.strip())

for idx, l in enumerate(shard):
    with open("%d.json" % idx, "w") as f:
        json.dump(l, f)

