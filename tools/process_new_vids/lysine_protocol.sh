#!/bin/bash

# Stops the container if it's been runnig for too long.

# Sleep for 2 hours.
sleep 7200

# Stops the container if the script takes longer than two hours, and won't execute if the script finishes on time (<2 hours)
vastai stop instance $VAST_CONTAINERLABEL
