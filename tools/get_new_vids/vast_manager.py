import subprocess
from subprocess import PIPE

searchCall = ['vastai', 'search offers', 'cpu_cores>=10 gpu_total_ram>=8 reliability>=0.95 dph<2']
BIG_NUM = 10.0

def find_instance():
    #run the command, and split it into a big table
    searchOut = subprocess.run(searchCall, check=True, stdout=PIPE, text=True).stdout
    rows = searchOut.split('\n')
    table = [row.split() for row in rows]
    tableHeader = table[0]
    
    #minus two because there's a trailing value which messes with the sorting, and start at one to skip the header
    entries = [dict() for i in range(1, len(table) - 2)]
    
    #if there's no entries return a bad value
    if(len(entries) < 1):
        return "Failed"
    
    #parse entries into a list of dictionary objects
    for i in range(0, len(entries) - 1):
        for j in range(0, len(tableHeader) - 1):
            entries[i][tableHeader[j]] = table[i + 1][j]
        print(i)
        print(entries[i])
    
    #sort the entries by price
    def data_sorter(entry):
        if "$/hr" in entry:
            return float(entry["$/hr"])
        else:
            #an arbitrarily large(for these purposes) number to put invalid entries at the bottom of the list
            return BIG_NUM
    entries.sort(key=data_sorter)
    
    #return the cheapest one
    return entries[0]