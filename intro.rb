require 'osc-ruby'
@client = OSC::Client.new('localhost', 9177)



#@client.send(OSC::Message.new("/page" , "Executed"))

@client.send(OSC::Message.new("/v" , "speed", 1.5))
@client.send(OSC::Message.new("/v" , "introText", 'aleatory'))
@client.send(OSC::Message.new("/f" , "updateIntroText"))
#sleep 4
#@client.send(OSC::Message.new("/page" , "Scheduled"))

play :c3
