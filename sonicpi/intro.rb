require 'osc-ruby'
@client = OSC::Client.new('localhost', 9177)


@client.send(OSC::Message.new("/show" , "particles"))
@client.send(OSC::Message.new("/fx" , "pixelate"))
#@client.send(OSC::Message.new("/v" , "introText", 'aleatory'))
#@client.send(OSC::Message.new("/f" , "updateIntroText"))
#sleep 4
#@client.send(OSC::Message.new("/page" , "Scheduled"))


