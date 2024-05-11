import subprocess
from subprocess import PIPE

searchCall = ['./vast.py', 'search offers', 'cpu_cores>=10 gpu_total_ram>=8 reliability>=0.95 dph<2']
BIG_NUM = 10.0

def find_instance():
    # Run the command, and split it into a big table
    searchRun = subprocess.run(searchCall, check=True, stdout=PIPE, stderr=PIPE, text=True)

    # Split by space is hazardous. "NV Driver" gets split into "NV" and "Driver" so hack around it.
    table = [ row.replace("NV Driver", "NV_Driver").split() for row in searchRun.stdout.splitlines() ]

    # First row is a header.
    tableHeader = table[0]

    # Drop the last line because there is a trailing value that messes with
    # the string sorting.
    tableData = table[1:-1]

    # If there's no entries return None.
    if not tableData:
        raise VastParseError('No instances parsable', searchRun.stdout, searchRun.stderr)
    
    # Parse entries into a list of dictionary objects.
    entries = [ { header: row[headerIdx] for headerIdx, header in enumerate(tableHeader)}
                for row in tableData ]
    
    HOURLY_RATE_KEY = "$/hr"

    def extract_hourly_rate(entry):
        return float(entry[HOURLY_RATE_KEY])
    
    # Return the cheapest one.
    return min([x for x in entries if HOURLY_RATE_KEY in x], key=extract_hourly_rate)

if __name__ == "__main__":
    print ("Cheapest instance: %s" % find_instance());

