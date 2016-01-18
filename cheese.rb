require 'rubygems'
require 'hornetseye_v4l2'
require 'hornetseye_xorg'
require 'hornetseye_rmagick'
require 'base64'
require 'json'
require 'osc-ruby'

@client = OSC::Client.new('localhost', 9177)

include Hornetseye
#Variables starting with $ are global, variables with @ are instance variables, @@ means class variables, and names starting with a capital letter are constants. All other variables are locals.
@camera = V4L2Input.new '/dev/video2' do |modes|
      modes[ 1 ]
end

def cheese
  img = @camera.read.normalise
  img = img.to_ubyte
  m = img.to_magick
  m.resize!(256, 256) # webgl needs an image in size power of t
  m.format = 'PNG'
  img64 = "data:image/png;base64," + Base64.encode64(m.to_blob)

  return {:img => img64}
end

loop do
  begin
    a = cheese()

    puts "sending"
    @client.send(OSC::Message.new("/vis" , "xtion", "data", a.to_json))
    sleep 1/15

  rescue Errno::ENETUNREACH
  rescue Errno::ECONNREFUSED
  ensure
    puts "fehler"
  end
end
