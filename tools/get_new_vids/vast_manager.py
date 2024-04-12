import subprocess
from subprocess import PIPE

searchCall = ['vastai', 'search offers', 'cpu_cores>=10 gpu_total_ram>=8 reliability>=0.95 dph<2']

def find_instance():
    #run the command, and split it into a big table
    searchOut = subprocess.run(searchCall, check=True, stdout=PIPE, text=True).stdout
    rows = searchOut.split('\n')
    table = [row.split() for row in rows]
    tableHeader = table[0]
    
    #minus one because there's a trailing value which messes with the sorting, and start at one to skip the header
    entries = [dict() for i in range(1, len(table) - 1)]
    
    #if there's no entries return a bad value
    if(len(entries) < 1):
        return "Failed"
    
    #parse entries into a list of dictionary objects
    for(i in range(0, len(entries))):
        for(j in range(0, len(tableHeader))) {
            entries[tableHeader[j]] = table[i + 1][j]
    
    #sort the entries by price
    def data_sorter(entry):
        return entry["$/hr"]
    entries.sort(key=data_sorter)
    
    #return the cheapest one
    return entries[0]