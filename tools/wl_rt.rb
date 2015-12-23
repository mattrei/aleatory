require 'osc-ruby'
@client = OSC::Client.new('localhost', 9177)

@client.send(OSC::Message.new("/scene" , "s1"))
