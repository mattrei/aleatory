require 'rubygems'
require 'hornetseye_v4l2'
require 'hornetseye_xorg'
require 'hornetseye_rmagick'
require 'base64'
require 'json'
include Hornetseye
#Variables starting with $ are global, variables with @ are instance variables, @@ means class variables, and names starting with a capital letter are constants. All other variables are locals. 
@camera = V4L2Input.new '/dev/video2' do |modes|
      modes[ 1 ]
end

def cheese
  img = @camera.read.normalise
  img = img.to_ubyte
  m = img.to_magick
  m.format = 'PNG'
  return "data:image/png;base64," + Base64.encode64(m.to_blob)
end


puts cheese()
