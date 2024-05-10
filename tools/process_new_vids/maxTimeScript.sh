#stops the container if it's been runnig for too long

#sleep for two hours
sleep 2 * (60*60)

#stops the container if the script takes longer than two hours, and won't execute if the script finishes on time (<2 hours)
vastai stop instance $VAST_CONTAINERLABEL