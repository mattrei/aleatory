require 'osc-ruby'
unless defined?(SHADER_ROOT)
  SHADER_ROOT = "/home/mat/dev/music/live-coding-space/lights/"
end
def shader(endpoint, *args)
  #if endpoint == :shader
  #  args[0] = "#{SHADER_ROOT}/#{args[0]}"
  #end
  endpoint = "/#{endpoint.to_s.gsub("suniform", "smoothed-uniform")}"
  @client ||= OSC::Client.new('localhost', 7400)#9177)
  begin
    args = args.map{|a| a.is_a?(Symbol) ? a.to_s : a}
    @client.send(OSC::Message.new(endpoint, *args))
  rescue Exception 
    puts "$!> Graphics not loaded"
  end
end

#shader(:shader, "test2.frag")w
#shader(:uniform, "iColorFactor", 0.1)
live_loop :dance do

  shader(:page, "@shader/first")
  shader(:uniform, "fov", rrand(0.3, 0.7))
  sample :drum_heavy_kick, attack: 0.00001, sustain: 0.1
  sleep 4
  #shader(:uniform, "iAmbi", rrand(0.0, 1.0))
  #shader(:page, "registry-shader")
  shader(:page, "@shader/registry-shader/demo")
  shader(:uniform, "fov", rrand(0.3, 0.7))
  sample :drum_heavy_kick, attack: 0.00001, sustain: 0.1
  sleep 4
  #shader(:page, "index")
end
