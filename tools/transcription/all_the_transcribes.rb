#!/usr/bin/ruby -w

require 'json'

Servers = [
  { host: 'root@199.195.151.121', port: '40055' },
#  { host: 'root@199.195.151.121', port: '40386'},
]

def get_ids
  ids = []
  f = File.open('./schoolboard_videos.json')
  JSON.load(f).each do |line|
    ids << line.split('=')[1].split('&')[0]
  end
  f.close
  return ids
end

def async_run(tag, cmd)
  puts ("#{tag} -- Host running: #{cmd}")
  IO.popen(cmd) do |f|
    f.each { |line| puts "#{tag} -- #{line}" }
  end
end

def do_cmd(host, port, cmd)
  async_run(port, "ssh -p #{port} #{host} #{cmd}")
end

def copy_to(host, port, infile, outfile)
  async_run(port, "scp -P #{port} '#{infile}' '#{host}:#{outfile}'")
end

def copy_from(host, port, infile, outfile)
  async_run(port, "scp -P #{port} '#{host}:#{infile}' '#{outfile}'")
end

def transcribe_id(id, host, port)
   outdir = "board-meetings/#{id}"
   if File.exist?("#{outdir}/trans_done")
     puts "Skipping [done] #{id}"
     return
   end
   vidfile = Dir.glob("#{outdir}/*.mp4")[0]
   if not vidfile
     return
   end
   title = File.basename(vidfile, File.extname(vidfile))
   puts title
   remote_input = '/workspace/input'
   do_cmd(host, port, "rm -f #{remote_input}.mp4")
   do_cmd(host, port, "rm -f #{remote_input}.wav")
   do_cmd(host, port, "rm -f 'input.*'")
   copy_to(host, port, vidfile, "#{remote_input}.mp4")
   do_cmd(host, port, "ffmpeg  -hide_banner -loglevel warning -i #{remote_input}.mp4 #{remote_input}.wav")
   do_cmd(host, port, "./do_whisperx.sh #{remote_input}.wav")
   copy_from(host, port, 'input.json', outdir)
   copy_from(host, port, 'input.srt', outdir)
   copy_from(host, port, 'input.tsv', outdir)
   copy_from(host, port, 'input.txt', outdir)
   copy_from(host, port, 'input.vtt', outdir)
   if File.exist?("#{outdir}/input.json")
     system("touch '#{outdir}/trans_done'")
   end
end

threads = []
vid_ids = get_ids

Servers.each do |s|
  threads << Thread.new {
     # Bootstrap the machine
     host = s[:host]
     port = s[:port]
     copy_to(host, port, 'bootstrap.sh', 'bootstrap.sh')
     copy_to(host, port, 'setup.sh', 'setup.sh')
     copy_to(host, port, 'do_whisperx.sh', 'do_whisperx.sh')
     copy_to(host, port, 'do_cmd.sh', 'do_cmd.sh')
     do_cmd(host, port, "chmod +x do_cmd.sh do_whisperx.sh")
#     do_cmd(host, port, 'bash ./bootstrap.sh')
     do_cmd(host, port, 'bash ./setup.sh')

     # Do the vids
     loop do
       vid = vid_ids.shift
       if not vid
         break
       end
       transcribe_id(vid, host, port)
     end
  }
end

threads.each {|t| t.join}
