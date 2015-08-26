require 'open-uri'
require 'json'
 open("http://api.openweathermap.org/data/2.5/weather?q=New%20York,NY&units=imperial") {|f|
    f.each_line do |line|
    j = JSON.parse(line)
    puts j['coord']['lon']
    end
  }
